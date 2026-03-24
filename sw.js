// given-sw.js — Service Worker for offline support
const CACHE = 'given-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/given-style.css',
  '/given-storage.js',
  '/given-shift.js',
  '/given-schedule.js',
  '/given-today.js',
  '/given-family.js',
  '/given-home.js',
  '/given-plans.js',
  '/given-notes.js',
  '/given-firebase.js',
  '/given-app.js',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@500;600;700&family=Nunito:wght@400;500;600;700;800&display=swap'
];

// Install: cache all core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for app assets, network-first for Firebase
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Skip non-GET and Firebase/Firestore requests (let them go to network)
  if (e.request.method !== 'GET') return;
  if (url.includes('firestore.googleapis.com') || url.includes('firebase')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache successful responses for app assets
        if (response.ok && (url.startsWith(self.location.origin) || url.includes('fonts.googleapis'))) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback — return cached index.html for navigation
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
