/**
 * Service Worker Offline and Sync Handler
 * Manages offline functionality and triggers data synchronization
 */

/**
 * Handles Service Worker installation
 * Pre-caches static assets for offline access
 */
const handleInstall = (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    precacheStaticAssets()
      .then(() => {
        console.log('[SW] Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error during installation:', error);
      })
  );
};

/**
 * Handles Service Worker activation
 * Cleans up old caches and takes control of all clients
 */
const handleActivate = (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    cleanOldCaches()
      .then(() => {
        console.log('[SW] Service Worker activated successfully');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('[SW] Error during activation:', error);
      })
  );
};

/**
 * Handles fetch requests and applies appropriate caching strategies
 * - API requests (Google Apps Script): Network-first strategy
 * - Static assets: Cache-first strategy
 */
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

/**
 * Handles messages from clients
 * Supports:
 * - SKIP_WAITING: Immediately activate new Service Worker version
 * - GET_VERSION: Return current cache version
 */
const handleMessage = (event) => {
  const { type } = event.data || {};
  
  console.log('[SW] Received message:', type);
  
  switch (type) {
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

/**
 * Handles Background Sync events
 * Triggered when connection is regained (if browser supports Background Sync API)
 */
const handleSync = (event) => {
  console.log('[SW] Sync event triggered:', event.tag);
  
  if (event.tag === 'sync-records') {
    console.log('[SW] Notifying clients to sync pending records');
    event.waitUntil(notifyClientsToSync());
  }
};

/**
 * Notifies all connected clients to trigger synchronization
 * Clients will handle the actual sync via the app's sync module
 */
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

/**
 * Registers all Service Worker event listeners
 */
const registerEventHandlers = () => {
  self.addEventListener('install', handleInstall);
  self.addEventListener('activate', handleActivate);
  self.addEventListener('fetch', handleFetch);
  self.addEventListener('message', handleMessage);
  self.addEventListener('sync', handleSync);
  
  console.log('[SW] Event handlers registered');
};

// Initialize event handlers when the script loads
registerEventHandlers();
