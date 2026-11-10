import { useState, useEffect } from 'react';

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstruction, setShowIOSInstruction] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const checkStandalone = () => {
      try {
        const mm =
          typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia('(display-mode: standalone)').matches
            : false;
        const iosStandalone = (window.navigator as any)?.standalone;
        setIsStandalone(!!(mm || iosStandalone));
      } catch {
        setIsStandalone(false);
      }
    };

    // Check if iOS
    const checkIOS = () => {
      try {
        const userAgent = window.navigator?.userAgent?.toLowerCase() || '';
        const iOS = /ipad|iphone|ipod/.test(userAgent) && !(window as any).MSStream;
        setIsIOS(iOS);
      } catch {
        setIsIOS(false);
      }
    };

    checkStandalone();
    checkIOS();

    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const onInstalled = () => {
      setInstallPrompt(null);
      setIsInstallable(false);
      // Re-evaluate standalone mode after the app was installed
      setTimeout(checkStandalone, 100);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkStandalone();
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', onInstalled);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const installPWA = async () => {
    if (isIOS) {
      setShowIOSInstruction(true);
      return;
    }

    if (!installPrompt) return;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstallable(false);
    }
  };

  return {
    isInstallable: (isInstallable || (isIOS && !isStandalone)),
    isStandalone,
    isIOS,
    isSecure: typeof window !== 'undefined' ? !!window.isSecureContext : false,
    showIOSInstruction,
    setShowIOSInstruction,
    installPWA,
  };
}
