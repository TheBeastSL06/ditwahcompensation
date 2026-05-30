// DS Horowpothana — Compensation Register Service Worker
const CACHE = 'ds-horowpothana-v1';

// Only cache the shell assets — NOT Google API calls
const SHELL = [
  '/ditwahcompensation/',
  '/ditwahcompensation/index.html',
  'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&family=JetBrains+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Never intercept Google API / OAuth / Sheets calls — always go to network
  if (
    url.includes('accounts.google.com') ||
    url.includes('googleapis.com') ||
    url.includes('oauth2') ||
    url.includes('gsi/client')
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Cache-first for shell assets, network-first fallback
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      if (resp && resp.status === 200 && e.request.method === 'GET') {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return resp;
    }))
  );
});
