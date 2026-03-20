// Cache Configuration
const CACHE_VERSION = 'v2.0'; // Increment on each build to invalidate cache
const STATIC_CACHE_NAME = `battref-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `battref-dynamic-${CACHE_VERSION}`;


// Static assets to pre-cache during installation
const STATIC_ASSETS = [
  '/Baterias/',
  '/Baterias/index.html',
  '/Baterias/manifest.json',
  '/Baterias/icons/icon.svg'
];

const precacheStaticAssets = async () => {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    console.log('[SW Cache] Pre-caching static assets');
    return cache.addAll(STATIC_ASSETS);
  } catch (error) {
    console.error('[SW Cache] Error pre-caching assets:', error);
    throw error;
  }
};

const cleanOldCaches = async () => {
  try {
    const cacheNames = await caches.keys();
    const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
    
    const deletionPromises = cacheNames
      .filter(name => name.startsWith('battref-') && !currentCaches.includes(name))
      .map(name => {
        console.log('[SW Cache] Deleting old cache:', name);
        return caches.delete(name);
      });
    
    return Promise.all(deletionPromises);
  } catch (error) {
    console.error('[SW Cache] Error cleaning old caches:', error);
  }
};

const cacheFirst = async (request) => {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW Cache] Cache hit:', request.url);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    // Cache valid responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW Cache] Cache-first fetch failed:', request.url, error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cachedResponse = await caches.match('/Baterias/');
      if (cachedResponse) return cachedResponse;
    }
    
    throw error;
  }
};

const networkFirst = async (request) => {
  try {
    console.log('[SW Cache] Attempting network request:', request.url);
    const networkResponse = await fetch(request);

    // Only cache GET responses — POST/PUT/DELETE must never be cached.
    // Caching a POST response (e.g. Google Apps Script API) could return a
    // stale "success" on retry, silently dropping records.
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW Cache] Network failed, trying cache:', request.url);
    
    try {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    } catch (cacheError) {
      console.error('[SW Cache] Cache lookup failed:', cacheError);
    }
    
    throw error;
  }
};
