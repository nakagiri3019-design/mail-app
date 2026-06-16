// Minimal service worker: enables PWA install, no caching (always network).
self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});

// Network pass-through (a fetch handler is required for installability).
self.addEventListener('fetch', function (e) {
  e.respondWith(fetch(e.request).catch(function () {
    return new Response('', { status: 504, statusText: 'offline' });
  }));
});
