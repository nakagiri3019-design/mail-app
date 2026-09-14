// 尾田版 専用キャッシュ。ルート版 / noguchi 版とは独立させること。
const CACHE_PREFIX = 'mail-oda-cache-';
const CACHE_NAME = CACHE_PREFIX + 'v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './files/eid_nx_estimate.pdf',
  './files/eid_nx_invoice.pdf',
  './files/eid_nx_report.pdf',
  './files/eid_nx_report_signed.pdf',
  './files/eid_saejima_estimate.pdf',
  './files/eid_saejima_invoice.pdf',
  './files/eid_saejima_report.pdf',
  './files/eid_saejima_report_signed.pdf',
  './files/fukutomi_3ken_estimate.pdf',
  './files/fukutomi_3ken_invoice.pdf',
  './files/fukutomi_3ken_report.pdf',
  './files/fukutomi_3ken_report_signed.pdf',
  './files/fukutomi_iijima_estimate.pdf',
  './files/fukutomi_iijima_invoice.pdf',
  './files/fukutomi_iijima_report.pdf',
  './files/fukutomi_iijima_report_signed.pdf',
  './files/zanshin_0713_estimate.pdf',
  './files/zanshin_0803_report.pdf',
  './files/zanshin_0803_report_signed.pdf',
  './files/zanshin_0810_invoice.pdf',
  './files/zanshin_0814_estimate.pdf',
  './files/zanshin_0904_report.pdf',
  './files/zanshin_0904_report_signed.pdf',
  './files/zanshin_0910_invoice.pdf',
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
          // 自分（oda）の古い世代だけを消す。他版のキャッシュには触らない。
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
