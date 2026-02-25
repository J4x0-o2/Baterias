import { isServiceWorkerActive } from '../swOffline';
import { useOnlineStatus } from './useOnlineStatus';
import { useInstallPrompt } from './useInstallPrompt';
import { useUpdateAvailable } from './useUpdateAvailable';

// Estado completo de la PWA
export const usePWAStatus = () => {
  const isOnline = useOnlineStatus();
  const { isInstallable, installApp } = useInstallPrompt();
  const { updateAvailable, applyAppUpdate } = useUpdateAvailable();
  const swActive = isServiceWorkerActive();

  return {
    isOnline,
    isOffline: !isOnline,
    isInstallable,
    installApp,
    updateAvailable,
    applyAppUpdate,
    serviceWorkerActive: swActive,
  };
};
