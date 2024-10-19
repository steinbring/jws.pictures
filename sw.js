const CACHE_NAME = 'jws-pictures-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/main.js',
  'https://jws.social/fileserver/01E5SQ87G8HX9T4NYTPR147MJF/attachment/original/01HYRS8T6WMW6VMSHW8MKT2HC0.png',
  '/https://jws.pictures/photos/all.json',
  'https://jws.pictures/photos/2024.json',
  'https://jws.pictures/photos/2023.json',
  'https://jws.pictures/photos/2022.json',
  'https://jws.pictures/photos/2021.json',
  'https://jws.pictures/photos/2020.json',
  'https://jws.pictures/photos/2019.json',
  'https://jws.pictures/photos/2018.json',
];

// Install the service worker and cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercept fetch requests and serve cached assets if available
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return the cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate the service worker and remove old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
});

// Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}