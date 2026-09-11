// KANZ COINS Service Worker — Cache-First for static assets
const CACHE_VERSION = "kanz-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;

// Assets to pre-cache on install
const PRECACHE_URLS = ["/", "/index.html"];

// Cache-first patterns (hashed assets are safe to cache long-term)
const CACHE_FIRST_PATTERNS = [
  /\/assets\//,
  /\.(woff2?|ttf|otf)$/,
  /\.(webp|png|jpg|jpeg|svg|ico)$/,
];

// Network-first patterns (API calls, HTML pages must always be fresh)
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /\/auth\//,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip cross-origin requests (fonts from Google, etc.)
  if (url.origin !== location.origin) return;

  // Network-first for API calls
  if (NETWORK_FIRST_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for static/hashed assets
  if (CACHE_FIRST_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          const toCache = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, toCache));
          return response;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for HTML pages
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response && response.status === 200) {
          const toCache = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, toCache));
        }
        return response;
      });
      return cached || fetchPromise;
    })
  );
});
