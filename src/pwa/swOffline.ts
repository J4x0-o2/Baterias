// Gestión Offline para PWA

import { syncPendingRecords } from '../modules/sync';

const BASE_URL = import.meta.env.BASE_URL || '/';
const SW_PATH = `${BASE_URL}sw.js`;
type ConnectionCallback = (isOnline: boolean) => void;
const connectionListeners: Set<ConnectionCallback> = new Set();
let swRegistration: ServiceWorkerRegistration | null = null;

// Registra el Service Worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service Workers no soportado');
    return null;
  }

  if (swRegistration) return swRegistration;

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, { scope: BASE_URL });
    swRegistration = registration;
    console.log('[PWA] Service Worker registrado:', registration.scope);

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            notifyUpdateAvailable();
          }
        });
      }
    });

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return registration;
  } catch (error) {
    console.error('[PWA] Error al registrar Service Worker:', error);
    return null;
  }
};

export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.unregister();
  } catch {
    return false;
  }
};

export const isServiceWorkerActive = (): boolean => {
  return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
};

export const isOnline = (): boolean => navigator.onLine;

// Suscribe a cambios de conexión
export const subscribeToConnectionChanges = (callback: ConnectionCallback): () => void => {
  connectionListeners.add(callback);

  if (connectionListeners.size === 1) {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  return () => {
    connectionListeners.delete(callback);
    if (connectionListeners.size === 0) {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  };
};

const handleOnline = (): void => {
  notifyConnectionChange(true);
  triggerSync();
};

const handleOffline = (): void => {
  notifyConnectionChange(false);
};

const notifyConnectionChange = (online: boolean): void => {
  connectionListeners.forEach(callback => callback(online));
};

// Dispara Background Sync
export const triggerSync = async (): Promise<void> => {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-records');
  } catch (error) {
    console.error('[PWA] Error al registrar sync:', error);
  }
};

const handleServiceWorkerMessage = (event: MessageEvent): void => {
  const { type } = event.data || {};
  if (type === 'TRIGGER_SYNC') {
    // El SW solicita sincronización - ejecutar desde el módulo sync
    syncPendingRecords().then(({ synced, failed }) => {
      console.log(`[PWA] Sincronización: ${synced} exitosos, ${failed} fallidos`);
    });
  }
};

const notifyUpdateAvailable = (): void => {
  window.dispatchEvent(new CustomEvent('pwa-update-available'));
};

// Aplica actualización pendiente del SW
export const applyUpdate = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
};

export const isPWAInstallable = (): boolean => 'BeforeInstallPromptEvent' in window;

let deferredPrompt: Event | null = null;

// Configura el prompt de instalación
export const setupInstallPrompt = (): void => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
  });
};

export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) return false;

  const promptEvent = deferredPrompt as BeforeInstallPromptEvent;
  promptEvent.prompt();
  const { outcome } = await promptEvent.userChoice;
  deferredPrompt = null;
  return outcome === 'accepted';
};

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const getServiceWorkerRegistration = (): ServiceWorkerRegistration | null => swRegistration;

export const checkForUpdate = async (): Promise<boolean> => {
  if (!swRegistration) return false;
  
  try {
    await swRegistration.update();
    return swRegistration.waiting !== null;
  } catch {
    return false;
  }
};

export const isInstallPromptAvailable = (): boolean => deferredPrompt !== null;
