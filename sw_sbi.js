const CACHE_NAME = 'sbi-v2';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// Network pass-through (a fetch handler is required for installability).
self.addEventListener('fetch', function(e) {
  e.respondWith(fetch(e.request).catch(function() {
    return new Response('', { status: 504, statusText: 'offline' });
  }));
});
