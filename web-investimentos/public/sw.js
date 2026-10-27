/* Service worker: app shell offline + cache de assets. Caminhos relativos ao escopo
   para funcionar tanto na raiz (Vercel) quanto em subpasta (GitHub Pages). */
const CACHE = "painel-investimentos-v2";
const scope = new URL(self.registration.scope);
const at = (path) => new URL(path, scope).toString();
const SHELL = [at("./"), at("manifest.webmanifest"), at("icons/icon-192.png"), at("icons/icon-512.png")];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const put = (req, res) => caches.open(CACHE).then((c) => c.put(req, res));

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(scope.pathname)) return;
  const path = url.pathname.slice(scope.pathname.length);

  // Assets com hash no nome: cache-first.
  if (path.startsWith("_next/static/") || path.startsWith("icons/")) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((res) => (put(request, res.clone()), res))),
    );
    return;
  }

  // Páginas e notícias: rede primeiro, cache como reserva offline.
  if (request.mode === "navigate" || path.startsWith("api/")) {
    const key = request.mode === "navigate" ? at("./") : request;
    event.respondWith(
      fetch(request)
        .then((res) => (put(key, res.clone()), res))
        .catch(() => caches.match(key).then((hit) => hit || Response.error())),
    );
  }
});
