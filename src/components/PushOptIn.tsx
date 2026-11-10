import { useEffect, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { usePushNotifications, shouldShowPushOptIn, dismissPushOptIn, isPushSupported } from '../hooks/usePushNotifications';

const UNSUPPORTED_KEY = 'wesis_push_unsupported_seen';

const isNotificationSupported = () => {
  try {
    return typeof window !== 'undefined' && 'Notification' in window;
  } catch {
    return false;
  }
};

export function PushOptIn() {
  const { enablePush, status, errorReason } = usePushNotifications();
  const [visible, setVisible] = useState(() => shouldShowPushOptIn());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnsupported, setShowUnsupported] = useState(false);

  // Unsupported devices: show a non-blocking toast once, then let the user
  // continue normally. Plain div only (no animation library) so it can never
  // white-screen old phones itself.
  useEffect(() => {
    try {
      if (isNotificationSupported() && isPushSupported()) return;
      let seen = false;
      try { seen = localStorage.getItem(UNSUPPORTED_KEY) === 'true'; } catch { seen = true; }
      if (!seen) setShowUnsupported(true);
    } catch {
      // Never block app boot on old WebViews.
    }
  }, []);

  useEffect(() => {
    if (!showUnsupported) return;
    const t = setTimeout(() => setShowUnsupported(false), 8000);
    return () => clearTimeout(t);
  }, [showUnsupported]);

  const dismissUnsupported = () => {
    try { localStorage.setItem(UNSUPPORTED_KEY, 'true'); } catch { /* ignore */ }
    setShowUnsupported(false);
  };

  if (showUnsupported) {
    return (
      <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-sm">
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 text-white font-prompt">
          <div className="flex items-start gap-3">
            <div className="bg-zinc-700/30 p-3 rounded-xl shrink-0">
              <BellOff className="w-6 h-6 text-zinc-400" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-bold text-base leading-tight">Notifications unavailable</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Your device does not support browser notifications. You can continue using the app normally.
              </p>
            </div>
            <button
              onClick={dismissUnsupported}
              className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Bail out entirely on browsers without the Notification API (some
  // in-app browsers, older iOS Safari) — calling requestPermission there
  // would throw instead of prompting.
  if (!visible || status === 'done' || !isNotificationSupported()) return null;

  const permissionDenied = errorReason === 'denied';

  const handleEnable = async () => {
    // Once the user has denied permission, the browser will never show the
    // native prompt again — calling requestPermission() just silently
    // resolves to 'denied' with no UI. Short-circuit that dead-end and send
    // them to browser settings instead of pretending "enable" will work.
    if (permissionDenied) {
      setError('คุณเคยปฏิเสธการแจ้งเตือนไว้ กรุณาเปิดสิทธิ์การแจ้งเตือนในการตั้งค่าเบราว์เซอร์');
      return;
    }

    setError(null);
    setBusy(true);
    const ok = await enablePush();
    setBusy(false);
    if (ok) {
      dismissPushOptIn();
      setVisible(false);
      return;
    }
    // errorReason distinguishes between browser-level unsupported and a
    // push-service failure. 'denied' is no longer surfaced here — that's
    // handled above via permissionDenied before enablePush() is called.
    if (errorReason === 'unsupported') {
      setError('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนแบบพุช');
    } else {
      // 'subscribe-failed' or unknown — permission was granted, the push
      // service/connection is what failed, so it's retryable.
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleDismiss = () => {
    dismissPushOptIn();
    setVisible(false);
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-sm">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 text-white font-prompt">
        <div className="flex items-start gap-3">
          <div className="bg-yellow-400/10 p-3 rounded-xl shrink-0">
            <Bell className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-bold text-base leading-tight">เปิดการแจ้งเตือน</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              รับการแจ้งเตือนข้อความจากพี่จริงใจได้ทันที
            </p>
            {error && <p className="text-xs text-rose-400 leading-relaxed">{error}</p>}
          </div>
          <button
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={handleEnable}
          disabled={busy || status === 'loading'}
          className="mt-4 w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 transition-colors text-zinc-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-base"
        >
          <Bell className="w-4 h-4" />
          {busy || status === 'loading'
            ? 'กำลังเปิด...'
            : permissionDenied
            ? 'ไปที่การตั้งค่าเบราว์เซอร์'
            : 'เปิดการแจ้งเตือน'}
        </button>
      </div>
    </div>
  );
}