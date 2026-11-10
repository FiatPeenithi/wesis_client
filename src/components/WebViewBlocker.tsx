import React, { useEffect, useState } from 'react';
import { Copy, Check, ExternalLink, Compass, Smartphone, MoreHorizontal } from 'lucide-react';
import { detectInAppBrowser, getIntentUrl, getLineRedirectUrl, redirectToExternalBrowser, cleanupExternalBrowserParam } from '../lib/inAppBrowser';

export const WebViewBlocker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronous initial detection: never render children on first mount if in an in-app browser
  const [browserInfo] = useState(() => detectInAppBrowser());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (browserInfo.isInApp) {
      // Immediately attempt automatic redirect
      redirectToExternalBrowser(browserInfo);
    } else {
      // Clean up openExternalBrowser param if we've successfully arrived in standard browser
      cleanupExternalBrowserParam();
    }
  }, [browserInfo]);

  const handleCopyLink = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(window.location.href);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = window.location.href;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore copy error
    }
  };

  const handleManualOpen = () => {
    if (browserInfo.isAndroid) {
      window.location.href = getIntentUrl(window.location.href);
    } else if (browserInfo.app === 'line') {
      window.location.replace(getLineRedirectUrl(window.location.href));
    } else {
      handleCopyLink();
    }
  };

  // If inside an in-app browser, block the children (especially LoginPage) from EVER loading
  if (browserInfo.isInApp) {
    const isLine = browserInfo.app === 'line';
    const isAndroid = browserInfo.isAndroid;
    const isIOS = browserInfo.isIOS;

    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-5 text-center font-prompt select-none relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="bg-zinc-900/90 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full flex flex-col items-center gap-6 relative z-10 backdrop-blur-xl">
          {/* Top Badge & Icon */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-zinc-800/80 border border-white/10 flex items-center justify-center shadow-inner">
              <Compass className="w-10 h-10 text-yellow-400 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-md">
              In-App
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isAndroid ? 'กรุณาเปิดใน Google Chrome' : isIOS ? 'กรุณาเปิดใน Safari' : 'กรุณาเปิดในเบราว์เซอร์หลัก'}
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
              ระบบไม่อนุญาตให้เข้าสู่ระบบผ่าน In-App Browser (LINE / Facebook / Messenger) เพื่อความปลอดภัยและการเชื่อมต่อบัญชี
            </p>
          </div>

          {/* Main Action for Android or LINE */}
          {(isAndroid || isLine) && (
            <button
              onClick={handleManualOpen}
              className="w-full py-4 px-5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-zinc-950 font-bold rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-yellow-500/20 active:scale-[0.98] transition-all cursor-pointer text-base"
            >
              <ExternalLink className="w-5 h-5" />
              <span>{isAndroid ? 'เปิดใน Google Chrome ทันที' : 'เปิดในเบราว์เซอร์ภายนอก'}</span>
            </button>
          )}

          {/* Step Guide for iOS / Meta apps */}
          {isIOS && !isLine && (
            <div className="w-full bg-zinc-950/60 border border-white/10 rounded-2xl p-4 text-left space-y-3">
              <p className="text-xs uppercase font-bold tracking-wider text-yellow-400/90 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                <span>วิธีเปิดใน Safari</span>
              </p>
              
              <div className="space-y-2.5 text-xs text-zinc-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold shrink-0 text-[11px]">1</span>
                  <span>แตะที่ปุ่ม <strong className="text-white bg-zinc-800 px-1.5 py-0.5 rounded inline-flex items-center gap-1"><MoreHorizontal className="w-3 h-3 inline" /> สามจุด</strong> หรือไอคอนแชร์ที่มุมจอ</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold shrink-0 text-[11px]">2</span>
                  <span>เลือก <strong className="text-white bg-zinc-800 px-1.5 py-0.5 rounded">"เปิดใน Safari"</strong> หรือ <strong className="text-white bg-zinc-800 px-1.5 py-0.5 rounded">"Open in Safari"</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Copy URL Section */}
          <div className="w-full space-y-2">
            <p className="text-xs text-zinc-500 font-medium text-left uppercase tracking-wider">
              หรือคัดลอกลิงก์ไปเปิดด้วยตนเอง
            </p>
            <div className="flex bg-zinc-950 rounded-xl overflow-hidden border border-white/10">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="bg-transparent text-zinc-400 px-3.5 py-3 w-full outline-none text-xs font-mono truncate"
              />
              <button
                onClick={handleCopyLink}
                className="bg-zinc-800 hover:bg-zinc-700 transition-colors px-4 flex items-center justify-center border-l border-white/10 cursor-pointer active:scale-95"
                title="คัดลอกลิงก์"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-zinc-300" />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-emerald-400 font-medium animate-fadeIn">
                ✓ คัดลอกลิงก์แล้ว นำไปวางใน Chrome หรือ Safari ได้เลย
              </p>
            )}
          </div>
        </div>

        {/* Brand footer */}
        <p className="text-zinc-600 text-xs mt-6">
          WESIS • เพื่อประสบการณ์และความปลอดภัยสูงสุด
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
