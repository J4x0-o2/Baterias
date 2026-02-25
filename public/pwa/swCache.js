//swCache.js - Gestión de Cache para Service Worker
//Estrategias de caché y constantes

// Nombres de los caches
const CACHE_VERSION = 'v1';
const STATIC_CACHE_NAME = `battref-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `battref-dynamic-${CACHE_VERSION}`;

// Recursos estáticos para pre-cachear (shell de la app)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg'
];

//Pre-cachea los recursos estáticos durante la instalación
const precacheStaticAssets = async () => {
  const cache = await caches.open(STATIC_CACHE_NAME);
  console.log('[SW Cache] Pre-caching static assets');
  return cache.addAll(STATIC_ASSETS);
};

const cleanOldCaches = async () => {
  const cacheNames = await caches.keys();
  const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
  
  const deletionPromises = cacheNames
    .filter(name => name.startsWith('battref-') && !currentCaches.includes(name))
    .map(name => {
      console.log('[SW Cache] Deleting old cache:', name);
      return caches.delete(name);
    });
  
  return Promise.all(deletionPromises);
};


//Primero busca en cache, si no existe va a la red y cachea
const cacheFirst = async (request) => {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cachear respuesta válida
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW Cache] Cache-first fetch failed:', error);
    
    // Retornar página principal si es navegación
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    
    throw error;
  }
};


//Primero intenta la red, si falla busca en cache
const networkFirst = async (request) => {
  try {
    const networkResponse = await fetch(request);
    
    // Cachear respuesta válida
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW Cache] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
};
