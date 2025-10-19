// sw.js
const CACHE = 'pm-billbook-v2'; // bump version to force update
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './QRcode.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Network-first for navigations (ensures updated index.html)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Others: network, fallback to cache if offline
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
