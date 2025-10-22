/* Gita Exam Service Worker */
const VERSION = 'v1.0.0';
const CACHE_NAME = `gitaexam-${VERSION}`;

// Compute the base path (e.g., "/gitaexam/")
const BASE = new URL('./', self.location).pathname;

const CORE_ASSETS = [
  `${BASE}`,
  `${BASE}index.html`,
  `${BASE}manifest.webmanifest`
  // Optionally cache icons if they exist:
  // `${BASE}icons/icon-192.png`,
  // `${BASE}icons/icon-512.png`
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        await cache.addAll(CORE_ASSETS);
      } catch (e) {
        // If any file fails (e.g., icons missing), we still want install to succeed
        console.warn('[SW] addAll error (safe to ignore if icons missing):', e);
        for (const url of CORE_ASSETS) {
          try {
            await cache.add(url);
          } catch (err) {
            console.warn('[SW] Could not cache:', url, err);
          }
        }
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => key.startsWith('gitaexam-') && key !== CACHE_NAME ? caches.delete(key) : null)
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Navigation requests: network-first with offline fallback to index.html
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const net = await fetch(request);
        // Stash a copy of navigations for offline
        const cache = await caches.open(CACHE_NAME);
        cache.put(`${BASE}index.html`, net.clone());
        return net;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(`${BASE}index.html`);
        return cached || new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } });
      }
    })());
    return;
  }

  // Static assets: cache-first, then network
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const net = await fetch(request);
      // Only cache same-origin GET responses
      if (request.method === 'GET' && new URL(request.url).origin === self.location.origin) {
        cache.put(request, net.clone());
      }
      return net;
    } catch (err) {
      // As last resort, try a base fallback for same-origin
      if (new URL(request.url).origin === self.location.origin) {
        const offline = await cache.match(`${BASE}index.html`);
        if (offline) return offline;
      }
      throw err;
    }
  })());
});
