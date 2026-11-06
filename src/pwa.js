// Let the browser offer installation through its native UI.
// Do not cancel beforeinstallprompt without a working custom install control.
function requestOfflineAssets(registration) {
  registration.active?.postMessage({
    type: "CACHE_OFFLINE_ASSETS",
  });
}

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
