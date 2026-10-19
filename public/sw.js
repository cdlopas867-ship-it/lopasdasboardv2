// Service worker — permite a instalação como PWA.
// As rotas de API (/api/*) e SSE passam direto (sem cache/interceptação)
// para o painel instalado sempre buscar dados frescos do servidor.
const CACHE = "lopas-cd-v3";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/", "/favicon.png", "/manifest.json", "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png"])).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Rotas de API e SSE: sempre direto ao servidor, sem cache do SW.
  if (url.pathname.startsWith("/api/")) {
    return; // não chama respondWith — o navegador faz a requisição normal
  }

  // Estratégia network-first — sempre tenta a rede, usa cache como fallback.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
