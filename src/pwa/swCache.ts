// Utilidades de Cache para el Cliente

export const CACHE_NAMES = {
  STATIC: 'battref-static-v1',
  DYNAMIC: 'battref-dynamic-v1',
} as const;

export const CACHE_VERSION = 'v1';

export const isCacheAvailable = (): boolean => {
  return 'caches' in window;
};

// Obtiene el tamaño total del cache en bytes
export const getCacheSize = async (): Promise<number> => {
  if (!isCacheAvailable()) return 0;
  
  let totalSize = 0;
  
  for (const cacheName of Object.values(CACHE_NAMES)) {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.clone().blob();
          totalSize += blob.size;
        }
      }
    } catch {
      // Ignorar errores de cache
    }
  }
  
  return totalSize;
};

export const formatCacheSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const clearAllCaches = async (): Promise<void> => {
  if (!isCacheAvailable()) return;
  
  const cacheNames = await caches.keys();
  
  await Promise.all(
    cacheNames
      .filter(name => name.startsWith('battref-'))
      .map(name => caches.delete(name))
  );
};

// Información completa del estado del cache
export const getCacheInfo = async (): Promise<{
  available: boolean;
  size: number;
  formattedSize: string;
  cacheCount: number;
}> => {
  if (!isCacheAvailable()) {
    return {
      available: false,
      size: 0,
      formattedSize: '0 B',
      cacheCount: 0,
    };
  }
  
  const cacheNames = await caches.keys();
  const battrefCaches = cacheNames.filter(name => name.startsWith('battref-'));
  const size = await getCacheSize();
  
  return {
    available: true,
    size,
    formattedSize: formatCacheSize(size),
    cacheCount: battrefCaches.length,
  };
};

