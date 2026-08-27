const CACHE_PREFIX = 'mail-nakagiri-cache-';
const CACHE_NAME = CACHE_PREFIX + 'v67';
const PRECACHE_URLS = [
  './',
  './index.html',
  './mail_nakagiri.html',
  './mail_nakagiri2.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './quote_ARK-INT-202510.pdf',
  './contract_interakt_202510.pdf',
  './第2期追加業務覚書_Interakt様_AI決算書診断システム.pdf',
  './第2期開発計画書_Interakt様_AI決算書診断システム.pdf',
  './御見積書_Interakt様_AI決算書診断システム第2期.pdf',
  './attachments/nakagiri/請求書_日本酵素開発株式会社_20260630.pdf',
  './attachments/nakagiri/発注書_ヴェーダテクノロジーズ_20260626_NMNセフィロト15000_60個.pdf',
  './attachments/nakagiri/請求書_ヴェーダテクノロジーズ_20260630.pdf',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Network-first: always try to fetch the latest, fall back to cache when offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});
