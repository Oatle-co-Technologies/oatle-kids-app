const CACHE_NAME = "oatle-kids-v4";

const APP_SHELL = self.__OATLE_PRECACHE_MANIFEST__ || [
  "/",
  "/manifest.webmanifest",
  "/icons/oatle-kids-192.png",
  "/icons/oatle-kids-512.png",
  "/icons/oatle-kids-180.png",
];

const REQUIRED_SHELL = APP_SHELL.filter(
  (url) =>
    url === "/" ||
    url.endsWith(".js") ||
    url.endsWith(".css") ||
    url === "/manifest.webmanifest" ||
    url.startsWith("/icons/")
);

const OPTIONAL_SHELL = APP_SHELL.filter(
  (url) => !REQUIRED_SHELL.includes(url)
);

let offlineCachePromise = null;

async function cacheOptionalAssets() {
  if (offlineCachePromise) {
    return offlineCachePromise;
  }

  offlineCachePromise = (async () => {
    const cache = await caches.open(CACHE_NAME);
    const batchSize = 8;

    for (let index = 0; index < OPTIONAL_SHELL.length; index += batchSize) {
      const batch = OPTIONAL_SHELL.slice(index, index + batchSize);

      await Promise.all(
        batch.map(async (url) => {
          const cached = await cache.match(url, { ignoreSearch: true });

          if (cached) {
            return;
          }

          try {
            const response = await fetch(url, { cache: "reload" });

            if (response.ok) {
              await cache.put(url, response);
            }
          } catch {
            // A future app launch will retry anything a slow connection missed.
          }
        })
      );
    }
  })().finally(() => {
    offlineCachePromise = null;
  });

  return offlineCachePromise;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(REQUIRED_SHELL);
      await self.skipWaiting();
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_OFFLINE_ASSETS") {
    return;
  }

  event.waitUntil(cacheOptionalAssets());
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
      (async () => {
        try {
          const response = await fetch(request);

          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put("/", response.clone());
          }

          return response;
        } catch {
          return (await caches.match("/")) || Response.error();
        }
      })()
    );

    return;
  }

  // Cache assets after their first successful request.
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request).then(async (response) => {
        if (response.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }

        return response;
      }).catch(() => Response.error());
    })
  );
});
