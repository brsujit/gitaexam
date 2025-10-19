// sw.js (place next to index.html)
const CACHE = 'pm-billbook-v10'; // bump when you change index.html
const CORE = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      // Cache core files but don’t fail install if any is missing
      await Promise.allSettled(CORE.map(u => cache.add(u)));
      // Optional asset
      await Promise.allSettled(['./QRcode.jpg'].map(u => cache.add(u)));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // start controlling without extra refresh
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Navigations: network-first, fallback to cached shell
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Other requests: try network, fallback to cache
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
