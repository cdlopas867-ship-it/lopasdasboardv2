// Service worker mínimo — permite a instalação como PWA
const CACHE = "lopas-cd-v3";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/", "/widget", "/favicon.png", "/manifest.json", "/manifest-widget.json", "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png"])).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Estratégia network-first — sempre tenta a rede, usa cache como fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
