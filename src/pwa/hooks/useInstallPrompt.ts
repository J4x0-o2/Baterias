import { useState, useEffect, useCallback } from 'react';
import { isInstallPromptAvailable, showInstallPrompt } from '../swOffline';

// Detecta si la PWA es instalable y provee función para instalar
export const useInstallPrompt = () => {
  const [isInstallable, setIsInstallable] = useState(isInstallPromptAvailable());

  useEffect(() => {
    const handleInstallable = () => setIsInstallable(true);
    const handleInstalled = () => setIsInstallable(false);

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    const accepted = await showInstallPrompt();
    if (accepted) {
      setIsInstallable(false);
    }
    return accepted;
  }, []);

  return { isInstallable, installApp };
};
