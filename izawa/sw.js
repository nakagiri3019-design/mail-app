// 伊沢版 専用キャッシュ。ルート版 / 他の版とは独立させること。
const CACHE_PREFIX = 'mail-izawa-cache-';
const CACHE_NAME = CACHE_PREFIX + 'v5';
const PRECACHE_URLS = [
  './',
  './index.html',
  '../mail_quote.js',
  '../mail_attach.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './files/construction_insurance_renewal.pdf',
  './files/hachijo_resort_overview.pdf',
  './files/hachijo_villa_plan_v1.pdf',
  './files/hachijo_villa_plan_v2.pdf',
  './files/imas_invoice_20261020.pdf',
  './files/higashiokaba_schedule_fix.pdf',
  './files/higashiokaba_schedule_r3.pdf',
  './files/kaitsuke_nishikasai.pdf',
  './files/mysoku_ichigaya.pdf',
  './files/mysoku_nishikasai.pdf',
  './files/mysoku_shinanomachi.pdf',
  './files/nishikasai_reform_quote.pdf',
  './files/nishikasai_reform_quote_r2.pdf',
  './files/oosugi_bess_overview.pdf',
  './files/oosugi_bess_quote.pdf',
  './files/oosugi_connection_reply.pdf',
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
          // 自分（izawa）の古い世代だけを消す。他版のキャッシュには触らない。
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Network-first: always try to fetch the latest, fall back to cache when offline.
// 添付PDFは precache 済み。それ以外は初回表示時にここでキャッシュさせる。
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
