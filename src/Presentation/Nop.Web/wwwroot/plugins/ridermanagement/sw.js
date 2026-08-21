/**
 * sw.js – Rider Management PWA Service Worker
 *
 * Handles:
 *  - Caching of static assets for offline resilience
 *  - Displaying push notifications when the page is in the background
 */

const CACHE_NAME = 'rider-mgmt-v1';
const PRECACHE = [
    '/plugins/ridermanagement/js/rider-notifications.js'
];

// Install: pre-cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting())
    );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request))
    );
});

// Push: show notification when a server push arrives (optional Web Push integration)
self.addEventListener('push', event => {
    let data = { title: 'New Delivery Order', body: 'You have a new order assigned.' };
    try { data = event.data.json(); } catch {}

    event.waitUntil(
        self.registration.showNotification(data.title || 'New Delivery Order', {
            body: data.body || '',
            icon: '/plugins/ridermanagement/icon-192.png',
            badge: '/plugins/ridermanagement/icon-192.png',
            tag: data.notificationId || 'rider-order',
            renotify: false,
            vibrate: [200, 100, 200]
        })
    );
});

// Notification click: focus existing window or open dashboard
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            const existing = list.find(c => c.url.includes('/rider/dashboard'));
            if (existing) return existing.focus();
            return clients.openWindow('/rider/dashboard');
        })
    );
});
