
//SERVICE WORKER INSTALLATION HANDLER
//Caches static assets and activates the SW immediately
const handleInstall = (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    // Precache all static assets (HTML, JS, CSS, images)
    precacheStaticAssets()
      .then(() => {
        console.log('[SW] Service Worker installed successfully');
        // Skip waiting and activate immediately (don't wait for old SW to unload)
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error during installation:', error);
      })
  );
};


//Cleans up old caches and claims all clients
const handleActivate = (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    // Remove outdated cache versions
    cleanOldCaches()
      .then(() => {
        console.log('[SW] Service Worker activated successfully');
        // Immediately claim all clients (don't wait for page reload)
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('[SW] Error during activation:', error);
      })
  );
};


//FETCH REQUEST HANDLER
const handleFetch = (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignore non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Ignore extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // API requests (Google Apps Script) - Network First strategy
  // These need to be fresh when possible to ensure data is sent
  if (url.hostname.includes('script.google.com')) {
    console.log('[SW] [API] Using network-first strategy for:', request.url);
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Static assets - Cache First strategy
  // These can be served from cache to improve performance
  if (request.method === 'GET' && 
      (request.destination === 'document' || 
       request.destination === 'script' || 
       request.destination === 'style' ||
       request.destination === 'image')) {
    console.log('[SW] [ASSET] Using cache-first strategy for:', request.url);
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Default to network-first for other requests
  console.log('[SW] [OTHER] Using network-first strategy for:', request.url);
  event.respondWith(networkFirst(request));
};


const handleMessage = (event) => {
  const { type } = event.data || {};
  
  console.log('[SW] Received message:', type);
  
  switch (type) {
    // Command to skip waiting and activate new SW version immediately
    case 'SKIP_WAITING':
      console.log('[SW] Skipping waiting and activating new SW');
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      console.log('[SW] Returning cache version:', CACHE_VERSION);
      event.ports[0].postMessage({ version: CACHE_VERSION });
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
};


//Triggered when device reconnects to network
//Used to sync battery records that couldn't be sent while offline
const handleSync = (event) => {
  console.log('[SW] Sync event triggered:', event.tag);
  
  if (event.tag === 'sync-records') {
    console.log('[SW] Notifying clients to sync pending records');
    event.waitUntil(notifyClientsToSync());
  }
};


//Sends sync trigger message to all active app clients
const notifyClientsToSync = async () => {
  try {
    const clients = await self.clients.matchAll();
    console.log('[SW] Notifying', clients.length, 'client(s) to sync');
    
    clients.forEach(client => {
      client.postMessage({ 
        type: 'TRIGGER_SYNC',
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('[SW] Error notifying clients:', error);
  }
};



//Registers all Service Worker event listeners
const registerEventHandlers = () => {
  self.addEventListener('install', handleInstall);
  self.addEventListener('activate', handleActivate);
  self.addEventListener('fetch', handleFetch);
  self.addEventListener('message', handleMessage);
  self.addEventListener('sync', handleSync);
  
  console.log('[SW] Event handlers registered');
};


// Activate all handlers when this script loads
registerEventHandlers();
