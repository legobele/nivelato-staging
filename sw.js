const CACHE = 'nivelato-v1';
const URLS = [
  '/nivelato/',
  '/nivelato/index.html',
  '/nivelato/dashboard.html',
  '/nivelato/login.html',
  '/nivelato/adhd.js',
  '/nivelato/dashboard.js',
  '/nivelato/style.css',
  '/nivelato/autism.css',
  '/nivelato/firebase-config.js',
  '/nivelato/auth-guard.js',
  '/nivelato/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(URLS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      return caches.open(CACHE).then(c => { c.put(e.request, res.clone()); return res; });
    }))
  );
});
