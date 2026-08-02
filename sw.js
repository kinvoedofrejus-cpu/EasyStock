// Service Worker EasyStock — mode hors-ligne / PWA
const CACHE_NAME = "easystock-cache-v3";
const FICHIERS_A_METTRE_EN_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

// Installation : on met en cache les fichiers essentiels de l'application
self.addEventListener("install", (evenement) => {
  self.skipWaiting();
  evenement.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FICHIERS_A_METTRE_EN_CACHE).catch(() => {
        // Si un fichier manque, on n'empêche pas l'installation du reste
      });
    })
  );
});

// Activation : on supprime les anciennes versions du cache
self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(
    caches.keys().then((noms) =>
      Promise.all(
        noms
          .filter((nom) => nom !== CACHE_NAME)
          .map((nom) => caches.delete(nom))
      )
    )
  );
  self.clients.claim();
});

// Récupération : cache d'abord, puis réseau, avec repli sur le cache si hors-ligne
self.addEventListener("fetch", (evenement) => {
  // On ne gère que les requêtes GET du même site
  if (evenement.request.method !== "GET") return;

  evenement.respondWith(
    caches.match(evenement.request).then((reponseEnCache) => {
      const recuperationReseau = fetch(evenement.request)
        .then((reponseReseau) => {
          if (reponseReseau && reponseReseau.status === 200) {
            const copie = reponseReseau.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(evenement.request, copie));
          }
          return reponseReseau;
        })
        .catch(() => reponseEnCache);

      return reponseEnCache || recuperationReseau;
    })
  );
});
