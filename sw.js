const CACHE_NAME = 'roguelike-shooter-v4-cache';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './assets/pwa/icon-192.png',
  './assets/pwa/icon-512.png',
  
  // Core Engine Scripts
  './src/main.js',
  './src/Config.js',
  './src/Platform.js',

  './src/core/Game.js',
  './src/core/GameStateMachine.js',
  './src/core/Input.js',
  './src/core/World.js',
  './src/core/Map.js',
  './src/core/Camera.js',
  
  // States
  './src/states/State.js',
  './src/states/BootState.js',
  './src/states/PlatformSelectState.js',
  './src/states/LoadingState.js',
  './src/states/PlayingState.js',
  './src/states/GameOverState.js',
  './src/states/PausedState.js',
  './src/states/SaveSelectState.js',
  './src/states/SkillAcquiredState.js',
  './src/states/ReloadState.js',
  
  // UI & Utils
  './src/ui/UIManager.js',
  './src/ui/TouchControls.js',
  './src/utils/SaveManager.js',
  './src/utils/PoolManager.js',
  './src/utils/SpatialHash.js',
  './src/utils/Pathfinder.js',
  
  // Essential Entities
  './src/entities/Entity.js',
  './src/entities/Player.js',
  './src/entities/Enemy.js',
  './src/entities/Altar.js',
  './src/entities/WeaponItem.js',
  './src/entities/Bullet.js',
  './src/entities/Item.js',
  './src/entities/HealthPack.js',
  
  // Core Visuals
  './assets/tilesets/mayan_tileset.png',
  './assets/tilesets/tile_coordinates.json',
  './assets/sprites/player_spritesheet_v2.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching offline assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Stale-While-Revalidate strategy
self.addEventListener('fetch', (event) => {
  // We don't want to cache browser-native extensions
  if (event.request.url.startsWith('chrome-extension') || event.request.url.includes('extension')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Kick off the network request regardless to update the cache in the background
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(err => {
        console.log('[Service Worker] Fetch failed (offline), relying purely on cache.', err);
      });

      // 2. Return the cached response IMMEDIATELY if we have it, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
