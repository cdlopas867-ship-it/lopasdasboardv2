// Service worker mínimo — permite a instalação como PWA
const CACHE = "lopas-cd-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/", "/favicon.png", "/manifest.json"])).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Estratégia network-first — sempre tenta a rede, usa cache como fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
