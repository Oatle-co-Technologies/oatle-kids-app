const CACHE_NAME = "oatle-kids-v2";

const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icons/oatle-kids-192.png",
  "/icons/oatle-kids-512.png",
  "/icons/oatle-kids-180.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("oatle-kids-") &&
                key !== CACHE_NAME
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (
    request.method !== "GET" ||
    !request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  // Keep the React app available offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put("/", copy));

          return response;
        })
        .catch(() => caches.match("/"))
    );

    return;
  }

  // Cache assets after their first successful request.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          if (!response.ok) {
            return response;
          }

          const copy = response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, copy));

          return response;
        })
        .catch(() => cached);
    })
  );
});
