import { useState, useEffect } from 'react';
import { isOnline as checkIsOnline, subscribeToConnectionChanges } from '../swOffline';

// Detecta estado de conexión online/offline
export const useOnlineStatus = (): boolean => {
  const [online, setOnline] = useState(checkIsOnline());

  useEffect(() => {
    const unsubscribe = subscribeToConnectionChanges(setOnline);
    return unsubscribe;
  }, []);

  return online;
};
