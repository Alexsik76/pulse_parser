const CACHE_NAME = 'bp-tracker-v1';
const ASSETS = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/mobile-select@1.4.0/dist/style/mobile-select.css',
    'https://cdn.jsdelivr.net/npm/mobile-select@1.4.0/dist/mobile-select.iife.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});