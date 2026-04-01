const CACHE_NAME = 'roguelike-shooter-v1-cache';
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
  
  // Essential Entities (Add more if needed, or rely on dynamic cache)
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

// Install Event: Pre-cache items
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

// Activate Event: Cleanup old caches
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

// Fetch Event: Cache-First strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Cache miss - perform a real network request
        return fetch(event.request).then((networkResponse) => {
          // Check if we should cache this new request (only same-origin for now)
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Clone the response to store in cache
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return networkResponse;
        });
      })
  );
});
