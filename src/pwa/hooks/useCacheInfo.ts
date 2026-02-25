import { useState, useEffect, useCallback } from 'react';
import { getCacheInfo, clearAllCaches } from '../swCache';

// Información y control del cache
export const useCacheInfo = () => {
  const [cacheInfo, setCacheInfo] = useState({
    available: false,
    size: 0,
    formattedSize: '0 B',
    cacheCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const refreshCacheInfo = useCallback(async () => {
    setLoading(true);
    const info = await getCacheInfo();
    setCacheInfo(info);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshCacheInfo();
  }, [refreshCacheInfo]);

  const clearCache = useCallback(async () => {
    await clearAllCaches();
    await refreshCacheInfo();
  }, [refreshCacheInfo]);

  return { cacheInfo, loading, refreshCacheInfo, clearCache };
};
