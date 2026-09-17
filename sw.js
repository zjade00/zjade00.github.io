const CACHE = "customer-manager-20260917-traffic-totals-r1";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("customer-manager-") && key !== CACHE).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Cloud data and authentication must go straight to the network. The cache
  // contains public application files only, never an authenticated response.
  if (request.method !== "GET" || url.origin !== self.location.origin || request.headers.has("authorization")) return;
  if (url.pathname === "/update.html" || url.pathname === "/version.json") {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  // Login callbacks can carry one-time codes. Allow only known asset queries,
  // and do not cache arbitrary same-origin routes or API responses.
  if (url.hash || [...url.searchParams.keys()].some((key) => key !== "v" && key !== "t")) return;
  const isShell = url.pathname === "/" || url.pathname === "/index.html";
  const isAsset = APP_SHELL.includes(url.pathname) || /^\/assets\/.+\.(?:js|css|png|jpe?g|svg|webp|avif|gif|ico|woff2?|ttf)$/i.test(url.pathname);
  if (!isShell && !isAsset) return;
  const cacheKey = isShell ? "/" : request;

  event.respondWith(
    fetch(request, isShell ? { cache: "no-store" } : {})
      .then((response) => {
        const directive = response.headers.get("cache-control") || "";
        if (response.ok && !response.redirected && response.type !== "opaque" && !/no-store|private/i.test(directive)) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(cacheKey, copy)).catch(() => {}));
        }
        return response;
      })
      .catch(async (error) => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(cacheKey);
        if (cached) return cached;
        throw error;
      }),
  );
});
