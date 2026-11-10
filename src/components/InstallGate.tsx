import React, { useState, useEffect } from 'react';
import { Download, Share2, Plus, Smartphone, MoreVertical } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export const InstallGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isInstallable,
    isStandalone,
    isIOS,
    isSecure,
    showIOSInstruction,
    setShowIOSInstruction,
    installPWA,
  } = usePWA();

  // Auto-redirect HTTP → HTTPS (skip localhost / 127.0.0.1 for dev)
  useEffect(() => {
    const { protocol, hostname, href } = window.location;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (protocol === 'http:' && !isLocalhost) {
      window.location.replace(href.replace(/^http:/, 'https:'));
    }
  }, []);

  const [isMobile] = useState(() => {
    try {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return /android|iphone|ipad|ipod/i.test(
          typeof navigator !== 'undefined' ? navigator.userAgent || '' : '',
        );
      }
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const uaMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
      return coarse || uaMobile;
    } catch {
      return false;
    }
  });
  const [showAndroidHelp, setShowAndroidHelp] = useState(false);

  // Only enforce on phones that are running in the browser (not installed)
  if (!isMobile || isStandalone) {
    return <>{children}</>;
  }

  // iOS never fires beforeinstallprompt — always show manual instructions
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans tracking-tight">
      <div className="bg-neutral-800 p-8 rounded-2xl border border-neutral-700 shadow-xl max-w-sm w-full flex flex-col items-center gap-6">
        <div className="bg-emerald-500/10 p-5 rounded-full">
          <Smartphone className="w-16 h-16 text-emerald-500" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-neutral-100">ติดตั้งแอป WE SIS</h1>
          <p className="text-neutral-400 text-base leading-relaxed">
            กรุณาติดตั้งแอปพลิเคชันบนอุปกรณ์ของคุณ<br />
            เพื่อการใช้งานที่สมบูรณ์และรับการแจ้งเตือน
          </p>
        </div>

        {!isIOS && (
          <>
            {isInstallable ? (
              <button
                onClick={installPWA}
                className="w-full bg-emerald-500 hover:bg-emerald-400 transition-colors text-neutral-950 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 text-lg"
              >
                <Download className="w-5 h-5" />
                ติดตั้งแอป
              </button>
            ) : (
              <button
                onClick={() => setShowAndroidHelp(true)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 transition-colors text-neutral-950 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 text-lg"
              >
                <Download className="w-5 h-5" />
                วิธีติดตั้งบน Android
              </button>
            )}

            {showAndroidHelp && (
              <div className="w-full space-y-3 bg-neutral-900 p-4 rounded-xl border border-neutral-700 text-left">
                <p className="text-sm text-neutral-300 font-medium">ติดตั้งแอปบน Android:</p>
                <div className="text-base text-neutral-400 space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="bg-neutral-700 text-neutral-300 px-2 py-1 rounded text-sm min-w-[30px] text-center">1</span>
                    <span>กดเมนู <MoreVertical className="w-4 h-4 inline text-emerald-400" /> มุมขวาบนของ Chrome</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="bg-neutral-700 text-neutral-300 px-2 py-1 rounded text-sm min-w-[30px] text-center">2</span>
                    <span>เลือก "ติดตั้งแอป" หรือ "เพิ่มไปยังหน้าจอหลัก"</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="bg-neutral-700 text-neutral-300 px-2 py-1 rounded text-sm min-w-[30px] text-center">3</span>
                    <span>กด "ติดตั้ง" แล้วเปิดแอปจากหน้าจอหลัก</span>
                  </p>
                </div>
                {!isSecure && (
                  <p className="text-xs text-amber-400 leading-relaxed">
                    หมายเหตุ: การติดตั้งต้องใช้ HTTPS เท่านั้น หากทดสอบผ่าน http:// โปรดใช้ลิงก์ https:// แทน
                  </p>
                )}
                <button
                  onClick={() => setShowAndroidHelp(false)}
                  className="w-full bg-neutral-800 hover:bg-neutral-700 transition-colors text-neutral-300 py-2.5 rounded-lg text-sm"
                >
                  ปิด
                </button>
              </div>
            )}
          </>
        )}

        {isIOS && (
          <>
            <button
              onClick={installPWA}
              className="w-full bg-emerald-500 hover:bg-emerald-400 transition-colors text-neutral-950 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 text-lg"
            >
              <Download className="w-5 h-5" />
              วิธีติดตั้งบน iPhone/iPad
            </button>

            {showIOSInstruction && (
              <div className="w-full space-y-3 bg-neutral-900 p-4 rounded-xl border border-neutral-700 text-left">
                <p className="text-sm text-neutral-300 font-medium">ติดตั้งแอปบน iOS:</p>
                <div className="text-base text-neutral-400 space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="bg-neutral-700 text-neutral-300 px-2 py-1 rounded text-sm min-w-[30px] text-center">1</span>
                    <span>กดปุ่ม <Share2 className="w-4 h-4 inline text-emerald-400" /> แชร์ที่แถบด้านล่าง</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="bg-neutral-700 text-neutral-300 px-2 py-1 rounded text-sm min-w-[30px] text-center">2</span>
                    <span>เลือก <Plus className="w-4 h-4 inline text-emerald-400" /> "เพิ่มไปยังหน้าจอหลัก"</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="bg-neutral-700 text-neutral-300 px-2 py-1 rounded text-sm min-w-[30px] text-center">3</span>
                    <span>กด "เพิ่ม" แล้วเปิดแอปจากหน้าจอหลัก</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowIOSInstruction(false)}
                  className="w-full bg-neutral-800 hover:bg-neutral-700 transition-colors text-neutral-300 py-2.5 rounded-lg text-sm"
                >
                  ปิด
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
