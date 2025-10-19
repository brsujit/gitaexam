// sw.js (place next to index.html)
const CACHE = 'pm-billbook-v11';
const CORE = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await Promise.allSettled(CORE.map(u => cache.add(u)));
      await Promise.allSettled(['./QRcode.jpg'].map(u => cache.add(u))); // optional
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
