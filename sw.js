const CACHE_NAME = "biere-v4"; // Nouvelle version pour forcer la mise à jour

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",     
  "./manifest.json",
  "./offline.html"   // <--- MAINTENANT ON PEUT LE METTRE CAR IL EXISTE !
];

// 1. INSTALLATION
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .catch(err => console.error("Erreur d'installation :", err))
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

// 3. FETCH (Gestion intelligente)
self.addEventListener("fetch", event => {
  // On ignore les requêtes non-http (extensions, etc.)
  // if (!event.request.url.startsWith('http')) return;

  // Stratégie : Cache d'abord, puis Réseau, puis Page Offline
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // A. Si trouvé dans le cache, on rend
      if (cachedResponse) {
        return cachedResponse;
      }

      // B. Sinon, on tente le réseau
      return fetch(event.request)
        .then(networkResponse => {
           // Si l'API répond bien, on sauvegarde la réponse pour la prochaine fois
           if (networkResponse && networkResponse.status === 200) {
               const responseClone = networkResponse.clone();
               caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
           }
           return networkResponse;
        })
        .catch(() => {
           // C. SI TOUT ECHOUE (Pas de cache + Pas d'internet)
           // On renvoie la page offline.html SEULEMENT si c'est une page web (HTML) qu'on demandait
           if (event.request.headers.get('accept').includes('text/html')) {
               return caches.match('./offline.html');
           }
        });
    })
  );
});