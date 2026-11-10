/**
 * Utility functions for detecting in-app browsers (LINE, Facebook, Messenger, Instagram, WebViews)
 * and immediately redirecting to external system browsers (Chrome on Android, Safari on iOS).
 */

export interface InAppBrowserInfo {
  isInApp: boolean;
  app: 'line' | 'facebook' | 'messenger' | 'instagram' | 'wechat' | 'twitter' | 'tiktok' | 'android_webview' | 'ios_webview' | 'other' | null;
  isAndroid: boolean;
  isIOS: boolean;
  rawUserAgent: string;
}

/**
 * Detects whether the current user-agent is running inside an in-app browser.
 */
export function detectInAppBrowser(customUa?: string): InAppBrowserInfo {
  if (typeof window === 'undefined') {
    return {
      isInApp: false,
      app: null,
      isAndroid: false,
      isIOS: false,
      rawUserAgent: '',
    };
  }

  const ua = customUa ?? (navigator?.userAgent || navigator?.vendor || (window as any)?.opera || '');
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;

  // 1. LINE (both iOS and Android)
  if (/Line\//i.test(ua) || /\bLine\b/i.test(ua)) {
    return { isInApp: true, app: 'line', isAndroid, isIOS, rawUserAgent: ua };
  }

  // 2. Facebook Messenger
  if (/Messenger/i.test(ua) || /FB_IAB\/Orca-Android/i.test(ua) || /MessengerForiOS/i.test(ua)) {
    return { isInApp: true, app: 'messenger', isAndroid, isIOS, rawUserAgent: ua };
  }

  // 3. Facebook Main App
  if (/FBAV|FBAN|FB_IAB|FB4A|FBIOS/i.test(ua)) {
    return { isInApp: true, app: 'facebook', isAndroid, isIOS, rawUserAgent: ua };
  }

  // 4. Instagram
  if (/Instagram/i.test(ua)) {
    return { isInApp: true, app: 'instagram', isAndroid, isIOS, rawUserAgent: ua };
  }

  // 5. WeChat
  if (/MicroMessenger/i.test(ua)) {
    return { isInApp: true, app: 'wechat', isAndroid, isIOS, rawUserAgent: ua };
  }

  // 6. Twitter / X
  if (/Twitter/i.test(ua)) {
    return { isInApp: true, app: 'twitter', isAndroid, isIOS, rawUserAgent: ua };
  }

  // 7. TikTok
  if (/musical_ly|ByteLocale|ByteFullConfig|TikTok/i.test(ua)) {
    return { isInApp: true, app: 'tiktok', isAndroid, isIOS, rawUserAgent: ua };
  }

  // 8. Other known chat/social apps
  if (/KAKAOTALK|Snapchat/i.test(ua)) {
    return { isInApp: true, app: 'other', isAndroid, isIOS, rawUserAgent: ua };
  }

  // 9. Generic Android WebView
  if (isAndroid) {
    const isWv = /; wv\b/i.test(ua);
    const isVersionChrome = /Version\/[\d.]+/i.test(ua) && /Chrome\/[\d.]+/i.test(ua) && !/Mobile\/\w+ Safari/i.test(ua);
    if (isWv || isVersionChrome) {
      return { isInApp: true, app: 'android_webview', isAndroid: true, isIOS: false, rawUserAgent: ua };
    }
  }

  // 10. Generic iOS WebView (WebKit without Safari token)
  if (isIOS) {
    const isWebKit = /WebKit/i.test(ua);
    const hasSafari = /Safari/i.test(ua);
    if (isWebKit && !hasSafari) {
      return { isInApp: true, app: 'ios_webview', isAndroid: false, isIOS: true, rawUserAgent: ua };
    }
  }

  return {
    isInApp: false,
    app: null,
    isAndroid,
    isIOS,
    rawUserAgent: ua,
  };
}

/**
 * Builds an Android Chrome intent URL to break out of in-app WebViews into Google Chrome.
 */
export function getIntentUrl(targetUrl: string = window.location.href): string {
  try {
    const urlObj = new URL(targetUrl, window.location.origin);
    const cleanUrl = urlObj.host + urlObj.pathname + urlObj.search + urlObj.hash;
    // Target Google Chrome with fallback to the standard URL
    return `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(targetUrl)};end`;
  } catch {
    const stripped = targetUrl.replace(/^https?:\/\//i, '');
    return `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;end`;
  }
}

/**
 * Builds a LINE redirect URL by appending openExternalBrowser=1,
 * which instructs LINE to open the user's default browser (Safari on iOS, Chrome on Android).
 */
export function getLineRedirectUrl(targetUrl: string = window.location.href): string {
  try {
    const url = new URL(targetUrl, window.location.origin);
    if (url.searchParams.get('openExternalBrowser') !== '1') {
      url.searchParams.set('openExternalBrowser', '1');
    }
    return url.toString();
  } catch {
    const separator = targetUrl.includes('?') ? '&' : '?';
    return targetUrl.includes('openExternalBrowser=1')
      ? targetUrl
      : `${targetUrl}${separator}openExternalBrowser=1`;
  }
}

/**
 * Attempts to immediately redirect the user from the in-app browser to the system browser.
 * Returns true if an automatic redirection mechanism was dispatched.
 */
export function redirectToExternalBrowser(info?: InAppBrowserInfo): boolean {
  if (typeof window === 'undefined') return false;

  const currentInfo = info ?? detectInAppBrowser();
  if (!currentInfo.isInApp) return false;

  // 1. LINE (both iOS and Android)
  // LINE natively recognizes ?openExternalBrowser=1 to kick to system browser
  if (currentInfo.app === 'line') {
    const lineTarget = getLineRedirectUrl(window.location.href);
    if (window.location.href !== lineTarget) {
      window.location.replace(lineTarget);
      return true;
    }
  }

  // 2. Android (Facebook, Messenger, Instagram, Twitter, WebViews)
  // Chrome Intent forces Android to launch Google Chrome
  if (currentInfo.isAndroid) {
    const intentUrl = getIntentUrl(window.location.href);
    window.location.href = intentUrl;
    return true;
  }

  // 3. iOS (Facebook, Messenger, Instagram, WebViews)
  // iOS WKWebView blocks automatic external browser launch via JavaScript without user action.
  // The caller must render the dedicated breakout guidance screen.
  return false;
}

/**
 * Cleans up openExternalBrowser parameter from the URL once in the external browser.
 */
export function cleanupExternalBrowserParam(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('openExternalBrowser')) {
      url.searchParams.delete('openExternalBrowser');
      const newSearch = url.searchParams.toString();
      const cleanUrl = url.pathname + (newSearch ? `?${newSearch}` : '') + url.hash;
      window.history.replaceState({}, '', cleanUrl);
    }
  } catch {
    // Ignore errors
  }
}
