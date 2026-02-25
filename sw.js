//Punto de entrada que importa los módulos de cache y offline

importScripts('./pwa/swCache.js', './pwa/swOffline.js');

registerOfflineHandlers();

console.log('[SW] Service Worker initialized');
