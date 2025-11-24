const CACHE_NAME = "biere-v5"; // On change la version pour forcer la maj

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",     
  "./manifest.json",
  "./offline.html",
  "./images/icons-vector.png" // Assure-toi que ce chemin est bon !
];

// 1. INSTALLATION
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .catch(err => console.error("Erreur d'installation (Fichier manquant ?) :", err))
  );
});

// 2. ACTIVATION
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
});

// 3. FETCH
self.addEventListener("fetch", event => {

  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then(networkResponse => {
           if (networkResponse && networkResponse.status === 200) {
               const responseClone = networkResponse.clone();
               caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
           }
           return networkResponse;
        })
        .catch(() => {
           // Page Offline si besoin
           if (event.request.headers.get('accept').includes('text/html')) {
               return caches.match('./offline.html');
           }
        });
    })
  );
});