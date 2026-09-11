// Nordic Operations — DV Aktiviteter Service Worker v2
// GitHub Pages kompatibel — relative paths
const CACHE = 'dv-aktiviteter-v2';
const ASSETS = [
  './aktiviteter-app.html',
  './dv-data.js',
  './index.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS).catch(err => console.warn('Cache partial:', err)))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request)
        .catch(() => cached))
  );
});
