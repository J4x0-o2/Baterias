import { useState, useEffect, useCallback } from 'react';
import { applyUpdate } from '../swOffline';

// Detecta actualizaciones disponibles del Service Worker
export const useUpdateAvailable = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setUpdateAvailable(true);
    window.addEventListener('pwa-update-available', handleUpdate);

    return () => {
      window.removeEventListener('pwa-update-available', handleUpdate);
    };
  }, []);

  const applyAppUpdate = useCallback(async () => {
    await applyUpdate();
  }, []);

  return { updateAvailable, applyAppUpdate };
};
