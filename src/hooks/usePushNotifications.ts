import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../lib/api';

const VAPID_PUBLIC_KEY = "BCqGQrN0XvH84FNrSMnFQPrctHwSZWomN5PBd9-dRu93S1rfnK3TRSUyYrDfauVnOmJShi7pHDt7T5Dbvdm71WQ";

const DISMISS_KEY = 'wesis_push_dismissed';
const SYNCED_KEY = 'wesis_push_synced';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  try {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch {
    // atob missing or malformed key on old WebViews: fail soft, no white screen.
    return new Uint8Array(0);
  }
}

function arrayBufferToBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  try {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
}

export interface PushSubscriptionPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

function serializeSubscription(subscription: PushSubscription): PushSubscriptionPayload | null {
  const json = subscription.toJSON();
  let p256dh = json.keys?.p256dh || '';
  let auth = json.keys?.auth || '';

  // Fallback to explicit getKey if toJSON did not serialize keys (common on mobile WebViews)
  if ((!p256dh || !auth) && typeof subscription.getKey === 'function') {
    if (!p256dh) {
      p256dh = arrayBufferToBase64Url(subscription.getKey('p256dh'));
    }
    if (!auth) {
      auth = arrayBufferToBase64Url(subscription.getKey('auth'));
    }
  }

  if (!subscription.endpoint || !p256dh || !auth) {
    console.warn('[PWA] Push subscription is missing essential keys:', {
      hasEndpoint: !!subscription.endpoint,
      hasP256dh: !!p256dh,
      hasAuth: !!auth,
    });
    return null;
  }

  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime ?? null,
    keys: {
      p256dh,
      auth,
    },
  };
}

function getNotificationPermission(): NotificationPermission {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
    return Notification.permission;
  } catch {
    return 'denied';
  }
}

function isNotificationSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 'Notification' in window;
  } catch {
    return false;
  }
}

function isSupported(): boolean {
  try {
    return (
      !!VAPID_PUBLIC_KEY &&
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      !!window.isSecureContext
    );
  } catch {
    return false;
  }
}

export function isPushSupported(): boolean {
  try {
    return isSupported() && isNotificationSupported();
  } catch {
    return false;
  }
}

async function waitForRegistration(): Promise<ServiceWorkerRegistration | null> {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;

    // Timeout safety so registration.ready doesn't hang indefinitely on slow/buggy mobile browsers
    const readyPromise = navigator.serviceWorker.ready;
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000));
    const reg = await Promise.race([readyPromise, timeoutPromise]);
    if (!reg) {
      console.warn('[PWA] Service worker ready timed out');
      return null;
    }

    // Ensure an active worker is actually controlling before subscribing, since
    // subscribe() fails with "AbortError: push service error" otherwise.
    if (!reg.active) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => resolve(), 3000);
        const worker = reg.installing || reg.waiting;
        if (!worker) {
          clearTimeout(timer);
          return resolve();
        }
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated') {
            clearTimeout(timer);
            resolve();
          } else if (worker.state === 'redundant') {
            clearTimeout(timer);
            reject(new Error('Service worker failed to activate'));
          }
        });
      });
    }
    return reg;
  } catch (err) {
    console.warn('[PWA] service worker not ready:', err);
    return null;
  }
}

let activeSubscribePromise: Promise<PushSubscription | null> | null = null;
let activeSyncPromise: Promise<boolean> | null = null;

async function rawCreateOrGetSubscription(): Promise<PushSubscription | null> {
  const registration = await waitForRegistration();
  if (!registration) return null;

  if (!('pushManager' in registration) || !registration.pushManager) return null;

  try {
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      // Validate that existing subscription actually has valid keys
      const serialized = serializeSubscription(existing);
      if (serialized) {
        return existing;
      }
      // Existing subscription has invalid/missing keys — unsubscribe and renew
      console.warn('[PWA] Existing push subscription lacks keys, renewing subscription...');
      await existing.unsubscribe().catch(() => {});
    }
  } catch (err) {
    console.warn('[PWA] Error checking existing subscription:', err);
  }

  const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY as string);
  if (!appServerKey || appServerKey.byteLength === 0) {
    console.error('[PWA] Invalid VAPID public key');
    return null;
  }

  // Retry a few times: the first attempt right after activation can still throw
  // AbortError/InvalidStateError transiently.
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey.buffer as ArrayBuffer,
      });
      if (serializeSubscription(sub)) {
        return sub;
      }
      console.warn('[PWA] Newly created subscription lacks keys, will retry...');
      await sub.unsubscribe().catch(() => {});
    } catch (err: any) {
      lastError = err;
      console.warn(`[PWA] Subscribe attempt ${attempt + 1} failed:`, err?.message || err);

      // If a subscription with a different key exists or state is invalid, unsubscribe first
      if (err?.name === 'InvalidStateError' || err?.message?.includes('different applicationServerKey')) {
        try {
          const conflictSub = await registration.pushManager.getSubscription();
          if (conflictSub) {
            await conflictSub.unsubscribe();
          }
        } catch { /* ignore */ }
      }

      await new Promise((r) => setTimeout(r, 400));
    }
  }
  console.warn('[PWA] push subscribe failed after retries:', lastError);
  return null;
}

async function createOrGetSubscription(): Promise<PushSubscription | null> {
  if (activeSubscribePromise) {
    return activeSubscribePromise;
  }
  activeSubscribePromise = rawCreateOrGetSubscription().finally(() => {
    activeSubscribePromise = null;
  });
  return activeSubscribePromise;
}

async function rawSendSubscriptionToServer(userId: string): Promise<boolean> {
  const subscription = await createOrGetSubscription();
  if (!subscription) return false;

  const payload = serializeSubscription(subscription);
  if (!payload) {
    console.warn('[PWA] Cannot send push subscription: keys missing after serialization');
    return false;
  }

  try {
    const res = await api.post('/push/subscribe', {
      userId,
      subscription: payload,
    });
    if (res.status >= 200 && res.status < 300) {
      try { localStorage.setItem(SYNCED_KEY, 'true'); } catch { /* quota or private */ }
      return true;
    }
    return false;
  } catch (err: any) {
    console.warn('[PWA] /push/subscribe request failed:', err?.response?.data || err?.message || err);
    return false;
  }
}

async function sendSubscriptionToServer(userId: string): Promise<boolean> {
  if (activeSyncPromise) {
    return activeSyncPromise;
  }
  activeSyncPromise = rawSendSubscriptionToServer(userId).finally(() => {
    activeSyncPromise = null;
  });
  return activeSyncPromise;
}

export type PushErrorReason = 'denied' | 'unsupported' | 'subscribe-failed' | null;

export function usePushNotifications() {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(() =>
    getNotificationPermission() === 'granted' && (() => { try { return localStorage.getItem(SYNCED_KEY) === 'true'; } catch { return false; } })()
      ? 'done'
      : 'idle',
  );
  // WHY permission/subscribe failed, distinct from `status`. `status === 'error'`
  // alone doesn't tell you whether the user needs to change browser settings
  // (denied) or whether they can just retry (subscribe-failed) — those need
  // very different messaging.
  const [errorReason, setErrorReason] = useState<PushErrorReason>(null);
  const syncedIdRef = useRef<string | null>(null);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    if (!isSupported()) return;

    // Run once per user id only (user object reference changes every render).
    if (getNotificationPermission() === 'granted') {
      if (syncedIdRef.current === userId) return;
      syncedIdRef.current = userId;
      setStatus('loading');
      sendSubscriptionToServer(userId)
        .then((ok) => {
          setStatus(ok ? 'done' : 'error');
          // Permission is already granted here — a failure is the push
          // service/subscription step, never "please allow notifications".
          if (!ok) setErrorReason('subscribe-failed');
          else setErrorReason(null);
        })
        .catch((err) => {
          console.warn('[PWA] Push subscription sync failed:', err);
          setStatus('error');
          setErrorReason('subscribe-failed');
        });
      return;
    }
    if (getNotificationPermission() === 'denied') {
      setStatus('error');
      setErrorReason('denied');
    }
  }, [userId]);

  const enablePush = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    if (!isSupported()) {
      setStatus('error');
      setErrorReason('unsupported');
      return false;
    }
    if (getNotificationPermission() === 'denied') {
      setStatus('error');
      setErrorReason('denied');
      return false;
    }

    setStatus('loading');
    setErrorReason(null);
    try {
      if (!isNotificationSupported()) {
        setStatus('error');
        setErrorReason('unsupported');
        return false;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        // The user just declined the native prompt — this genuinely is a
        // permission problem.
        setStatus('error');
        setErrorReason('denied');
        return false;
      }
      const ok = await sendSubscriptionToServer(user.id);
      if (ok) {
        syncedIdRef.current = user.id;
        setErrorReason(null);
      } else {
        // Permission was just granted above — this failure is the push
        // service/subscribe step, not a permission issue.
        setErrorReason('subscribe-failed');
      }
      setStatus(ok ? 'done' : 'error');
      return ok;
    } catch (err) {
      console.warn('[PWA] Push subscription failed:', err);
      setStatus('error');
      setErrorReason('subscribe-failed');
      return false;
    }
  }, [user]);

  return { enablePush, status, errorReason };
}

export function shouldShowPushOptIn(): boolean {
  try {
    if (!isSupported()) return false;
    const permission = getNotificationPermission();
    if (permission === 'denied') return false;
    if (permission === 'granted') {
      // Permission being granted doesn't mean the subscription ever actually
      // succeeded (e.g. it can fail with a push-service AbortError). Only
      // stop showing the prompt once we've confirmed a real sync, otherwise
      // the user is stuck with a silently-failing background retry forever.
      try { return localStorage.getItem(SYNCED_KEY) !== 'true'; } catch { return false; }
    }
    try { return localStorage.getItem(DISMISS_KEY) !== 'true'; } catch { return false; }
  } catch {
    return false;
  }
}

export function dismissPushOptIn() {
  try { localStorage.setItem(DISMISS_KEY, 'true'); } catch { /* quota or private */ }
}

export function clearPushDismiss() {
  try { localStorage.removeItem(DISMISS_KEY); } catch { /* quota or private */ }
}