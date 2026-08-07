// Service worker minimal — syaratnya browser (Chrome/Android) supaya
// aplikasi ini boleh "Diinstal" ke layar utama HP. Data stok tetap
// selalu diambil langsung dari Supabase secara live seperti biasa;
// yang di-cache di sini cuma "kerangka" halaman (HTML/ikon), supaya
// aplikasinya tetap bisa terbuka walau sinyal internet sedang lemah.

const CACHE_NAME = 'stok-sanet-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Data (Supabase) selalu diambil online — jangan pernah di-cache.
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request)
        .then(res => {
          if (res && res.status === 200 && event.request.method === 'GET') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
