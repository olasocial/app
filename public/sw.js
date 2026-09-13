/* eslint-disable no-restricted-globals */
// OLA SOCIAL — High Performance Service Worker
const CACHE_VERSION = 'ola-social-v1.0.0';
const CACHE_NAME = `ola-cache-${CACHE_VERSION}`;

// Core application shell assets for offline resilience
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './favicon.png'
];

// Domains and endpoints that must NEVER be cached (server-authoritative & live security)
const NEVER_CACHE_PATTERNS = [
  /supabase\.co/,
  /\/rest\/v1/,
  /\/auth\/v1/,
  /\/realtime\/v1/,
  /\/functions\/v1/,
  /challenges\.cloudflare\.com/,
  /google-analytics\.com/
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial warning:', err);
      });
    })
  );
  // Do not automatically force skipWaiting here; let the user-controlled update prompt handle it
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith('ola-cache-') && key !== CACHE_NAME) {
            console.log('[SW] Evicting outdated cache:', key);
            return caches.delete(key);
          }
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = request.url;

  // STRICT RULE: Never cache Supabase, Turnstile, or dynamic backend requests
  const shouldBypass = NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url));
  if (shouldBypass) {
    return;
  }

  // Handle HTML navigation (SPA entry point fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('./index.html').then((cachedIndex) => {
          return cachedIndex || caches.match('./');
        });
      })
    );
    return;
  }

  // Static Assets (fonts, images, scripts, stylesheets): Stale-While-Revalidate
  const isStaticAsset =
    url.includes('/assets/') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com') ||
    request.destination === 'image' ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font';

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache).catch(() => {});
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// System Web Push Handler
self.addEventListener('push', (event) => {
  let data = {
    title: 'Ola Social',
    body: '🤗 Tienes una nueva interacción en Ola Social',
    icon: './logo.png',
    badge: './logo.png',
    data: { url: './' }
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || './logo.png',
    badge: data.badge || './logo.png',
    vibrate: [100, 50, 100],
    data: data.data || { url: './' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});
