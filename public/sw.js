//Service Worker Entry Point
//Imports cache strategies and offline/sync handlers

importScripts('./cache-strategies.js', './offline-sync.js');

console.log('[SW] Service Worker initialized - cache version:', CACHE_VERSION);

