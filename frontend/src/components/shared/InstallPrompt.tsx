import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, 'true');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:hidden">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-sky-600 px-4 py-3 text-white shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <Download className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium truncate">Install Flying411 for quick access</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-50 transition-colors"
            data-testid="pwa-install-button"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1.5 hover:bg-sky-500 transition-colors"
            aria-label="Dismiss install prompt"
            data-testid="pwa-dismiss-button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
