let deferredInstallPrompt = null;

export function getDeferredInstallPrompt() {
  return deferredInstallPrompt;
}

export function clearDeferredInstallPrompt() {
  deferredInstallPrompt = null;
}

function requestOfflineAssets(registration) {
  registration.active?.postMessage({
    type: "CACHE_OFFLINE_ASSETS",
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  window.dispatchEvent(
    new CustomEvent("oatle-install-ready", { detail: event })
  );
});

window.addEventListener("appinstalled", () => {
  clearDeferredInstallPrompt();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js", { updateViaCache: "none" })
      .then((registration) => {
        console.log(
          "Oatle Kids service worker registered:",
          registration.scope
        );

        registration.update().catch((error) => {
          console.warn(
            "Oatle Kids service worker update check failed:",
            error
          );
        });

        navigator.serviceWorker.ready
          .then(requestOfflineAssets)
          .catch((error) => {
            console.warn(
              "Oatle Kids offline cache request failed:",
              error
            );
          });
      })
      .catch((error) => {
        console.error(
          "Oatle Kids service worker registration failed:",
          error
        );
      });
  });

  navigator.serviceWorker.addEventListener(
    "controllerchange",
    () => {
      navigator.serviceWorker.ready
        .then(requestOfflineAssets)
        .catch(() => {});
    }
  );
}
