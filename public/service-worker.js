const CACHE_NAME = 'pokepwa-v4';
const API_CACHE_NAME = 'pokepwa-api-v4';
const IMAGE_CACHE_NAME = 'pokepwa-images-v3';

// URLs críticas para cache offline
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/index.html',
  '/static/media/logo.svg'
];

self.addEventListener('install', (event) => {
  console.log('🔧 Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache abierto, agregando recursos críticos...');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})));
      })
      .then(() => {
        console.log('✅ Recursos críticos cacheados');
        self.skipWaiting(); // Activar inmediatamente
      })
      .catch((error) => {
        console.error('❌ Error cacheando recursos:', error);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Interceptar peticiones a la API de Pokémon
  if (event.request.url.includes('pokeapi.co')) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            // Si está en cache, devolver la respuesta cacheada
            console.log('API desde cache:', event.request.url);
            return response;
          }
          
          // Si no está en cache, hacer la petición
          return fetch(event.request).then((fetchResponse) => {
            // Solo cachear respuestas exitosas
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              cache.put(event.request, responseClone);
              console.log('Guardando API en cache:', event.request.url);
            }
            return fetchResponse;
          }).catch((error) => {
            console.log('Error de red para API:', error);
            return new Response(JSON.stringify({error: 'Sin conexión'}), {
              status: 503,
              headers: {'Content-Type': 'application/json'}
            });
          });
        });
      })
    );
  }
  // Interceptar imágenes de Pokémon
  else if (event.request.url.includes('raw.githubusercontent.com') && event.request.url.includes('sprites')) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            console.log('Imagen desde cache:', event.request.url);
            return response;
          }
          
          return fetch(event.request).then((fetchResponse) => {
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              cache.put(event.request, responseClone);
              console.log('Guardando imagen en cache:', event.request.url);
            }
            return fetchResponse;
          }).catch((error) => {
            console.log('Error cargando imagen:', error);
            // Devolver imagen placeholder si falla
            return fetch('/favicon.ico');
          });
        });
      })
    );
  }
  // Para otras peticiones, usar estrategia cache-first
  else {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).catch(() => {
            // Si es una navegación y falla, servir la página principal
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
        }
      )
    );
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            console.log('Eliminando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Tomar control inmediatamente
  return self.clients.claim();
});
