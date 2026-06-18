const CACHE = 'nivelato-v2';
const URLS = [
  './index.html',
  './dashboard.html',
  './adhd.js',
  './style.css',
  './autism.css',
  './manifest.json',
  './favicon.ico',
  './160.png',
  './192.png',
  './512.png',
  './maskable-192.png',
  './maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(URLS.map(u => new Request(u, {mode: 'no-cors'}))).catch(() => {/* cache what we can */}))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => new Response('offline', {status: 503})))
  );
});
