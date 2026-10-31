/* День и кибербез — офлайн-кэш */
var CACHE = "den-i-cyber-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./day.html",
  "./cyber.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE) return caches.delete(key);
        return null;
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function fallbackFor(url) {
  var path = new URL(url).pathname.split("/").pop();
  if (!path) path = "index.html";
  return caches.match("./" + path).then(function (hit) {
    return hit || caches.match("./index.html");
  });
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(function (response) {
        var copy = response.clone();
        var path = new URL(request.url).pathname.split("/").pop() || "index.html";
        caches.open(CACHE).then(function (cache) {
          cache.put("./" + path, copy);
        });
        return response;
      }).catch(function () {
        return fallbackFor(request.url);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (hit) {
      if (hit) return hit;
      return fetch(request).then(function (response) {
        if (response.ok && new URL(request.url).origin === self.location.origin) {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return response;
      });
    })
  );
});
