// BeBrilliant Progressive Web App (PWA) Service Worker
// STRICT POLICY: ZERO OFFLINE DATA PERSISTENCE.
// To ensure exam integrity, real-time grading, anti-cheat, and financial reconciliation,
// this Service Worker enforces Network-Only execution for all dynamic routes & API endpoints.

const CACHE_NAME = 'bebrilliant-static-shell-v1';

// Only core static installation/branding assets are cached to satisfy PWA installability requirements
const STATIC_ASSETS = [
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.ico',
];

// Install: Cache only minimal installation shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Non-critical error pre-caching shell assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Purge any old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Clearing deprecated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Enforce STRICT NETWORK-ONLY for all dynamic routes, API calls, and page navigation.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests (mutations, POST, PUT, DELETE must always hit network)
  if (request.method !== 'GET') {
    return;
  }

  // Check if this is a static PWA shell icon asset
  const isStaticShellAsset = STATIC_ASSETS.some((asset) => url.pathname === asset);

  if (isStaticShellAsset) {
    // Stale-while-revalidate only for PWA branding icons
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // ALL OTHER REQUESTS: STRICT NETWORK-ONLY POLICY (NO OFFLINE DATA)
  // If the device is offline or network fails, network fetch rejects.
  // The client-side OfflineGuard will alert the user and pause interactions.
  event.respondWith(
    fetch(request).catch((error) => {
      // For standard HTML document navigation while offline, do NOT serve stale cached pages.
      // Propagate the network error so the browser / OfflineGuard handles disconnection cleanly.
      return Promise.reject(error);
    })
  );
});

// Web Push Notification Listener
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'BeBrilliant Notification';
    const options = {
      body: data.body || '',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[SW] Error parsing push notification payload:', err);
  }
});

// Notification Click Handler: Open or focus on the target window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
