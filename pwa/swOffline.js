//Event listeners y sincronización

const handleInstall = (event) => {
  console.log('[SW Offline] Installing Service Worker...');
  
  event.waitUntil(
    precacheStaticAssets()
      .then(() => {
        console.log('[SW Offline] Service Worker installed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW Offline] Error during installation:', error);
      })
  );
};


//Limpia caches antiguos
const handleActivate = (event) => {
  console.log('[SW Offline] Activating Service Worker...');
  
  event.waitUntil(
    cleanOldCaches()
      .then(() => {
        console.log('[SW Offline] Service Worker activated');
        return self.clients.claim();
      })
  );
};


const handleFetch = (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar solicitudes que no sean HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Ignorar solicitudes de extensiones
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // API requests (Google Apps Script) - Network First
  if (url.pathname.startsWith('/api') || url.hostname.includes('script.google.com')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Recursos estáticos - Cache First
  event.respondWith(cacheFirst(request));
};


const handleMessage = (event) => {
  const { type } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION });
      break;
    default:
      console.log('[SW Offline] Unknown message:', event.data);
  }
};

const handleSync = (event) => {
  console.log('[SW Offline] Background sync event:', event.tag);
  
  if (event.tag === 'sync-records') {
    event.waitUntil(notifyClientsToSync());
  }
};


const notifyClientsToSync = async () => {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'TRIGGER_SYNC' });
  });
};

const registerOfflineHandlers = () => {
  self.addEventListener('install', handleInstall);
  self.addEventListener('activate', handleActivate);
  self.addEventListener('fetch', handleFetch);
  self.addEventListener('message', handleMessage);
  self.addEventListener('sync', handleSync);
};
