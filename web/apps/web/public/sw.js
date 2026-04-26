const CACHE_NAME = 'geoagent-v1';
const SHELL_URLS = ['/', '/login', '/favicon.ico'];

// Install: cache the app shell
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(SHELL_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', function (event) {
  var url = event.request.url;

  // Pass through Firebase / Google APIs — never cache these
  if (
    url.includes('firebase') ||
    url.includes('googleapis') ||
    url.includes('firebaseio') ||
    url.includes('gstatic')
  ) {
    return; // default browser fetch
  }

  // Navigation requests: network-first, fall back to cached '/'
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function () {
        return caches.match('/');
      })
    );
    return;
  }

  // Same-origin static assets (JS, CSS, images, _next/): cache-first
  var isSameOrigin = url.startsWith(self.location.origin);
  var isStatic =
    url.includes('/_next/') ||
    /\.(js|css|png|jpg|jpeg|svg|ico|webp|woff|woff2)(\?|$)/.test(url);

  if (isSameOrigin && isStatic) {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        return fetch(event.request).then(function (response) {
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else: network only
});
