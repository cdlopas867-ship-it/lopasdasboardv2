/* Service worker unificado — cache do app (PWA) + notificações push +
 * detecção de atualização quando uma nova versão é publicada.
 *
 * Rotas de API (/api/*) passam direto (sem cache) para o painel instalado
 * sempre buscar dados frescos do servidor.
 */

const CACHE = "lopas-cd-v5";

/* --- Badge/contador (IndexedDB) — badge no ícone como WhatsApp --- */
const BADGE_DB = "lopas-badge";
const BADGE_STORE = "count";
const BADGE_KEY = "updates";

async function openBadgeDb() {
  return new Promise((resolve) => {
    if (!("indexedDB" in self)) return resolve(null);
    const req = indexedDB.open(BADGE_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(BADGE_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function getBadgeCount() {
  try {
    const db = await openBadgeDb();
    if (!db) return 0;
    return await new Promise((resolve) => {
      const tx = db.transaction(BADGE_STORE, "readonly");
      const req = tx.objectStore(BADGE_STORE).get(BADGE_KEY);
      req.onsuccess = () => resolve(req.result ?? 0);
      req.onerror = () => resolve(0);
    });
  } catch { return 0; }
}

async function setBadgeCount(n) {
  try {
    const db = await openBadgeDb();
    if (!db) return;
    await new Promise((resolve) => {
      const tx = db.transaction(BADGE_STORE, "readwrite");
      tx.objectStore(BADGE_STORE).put(n, BADGE_KEY);
      tx.oncomplete = resolve; tx.onerror = resolve;
    });
  } catch {}
}

async function aplicarBadge(count) {
  try {
    if ("setAppBadge" in self.registration) {
      if (count > 0) await self.registration.setAppBadge(count);
      else await self.registration.clearAppBadge();
    }
  } catch {}
}

async function incrementarBadge() {
  const count = (await getBadgeCount()) + 1;
  await setBadgeCount(count);
  await aplicarBadge(count);
  return count;
}

async function limparBadge() {
  await setBadgeCount(0);
  await aplicarBadge(0);
}

/* --- Install: cache do app shell + skipWaiting --- */
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(["/", "/favicon.png", "/manifest.json", "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png"])
    ).catch(() => {})
  );
});

/* --- Activate: limpa caches antigos e assume controle --- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* --- Fetch: network-first, com detecção de nova versão na navegação --- */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return; // API sempre direto

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone();
        /* Compara os scripts do HTML novo com o cache — se mudou, é nova versão */
        caches.match("/").then((cached) => {
          if (!cached) {
            caches.open(CACHE).then((cache) => cache.put("/", copy));
            return;
          }
          Promise.all([cached.text(), copy.text()]).then(([oldHtml, newHtml]) => {
            if (extractScripts(oldHtml) !== extractScripts(newHtml)) {
              caches.open(CACHE).then((cache) => cache.put("/", copy));
              notificarClientesAtualizacao();
            }
          }).catch(() => {});
        });
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

function extractScripts(html) {
  const matches = html.match(/src="[^"]*\.(js|mjs)"/g) || [];
  return matches.sort().join("|");
}

async function notificarClientesAtualizacao() {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({ type: "APP_UPDATE_AVAILABLE" });
  }
}

/* --- Periodic Background Sync: checa atualização com o app fechado --- */
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-update") event.waitUntil(checarAtualizacaoBackground());
});

async function checarAtualizacaoBackground() {
  try {
    const res = await fetch("/", { cache: "no-store" });
    const newHtml = await res.text();
    const cached = await caches.match("/");
    if (!cached) return;
    const oldHtml = await cached.text();
    if (extractScripts(oldHtml) !== extractScripts(newHtml)) {
      await caches.open(CACHE).then((cache) => cache.put("/", new Response(newHtml, res)));
      notificarClientesAtualizacao();
      if (Notification.permission === "granted") {
        await self.registration.showNotification("Lopas CD · Nova versão disponível", {
          body: "Toque para atualizar o app",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: "lopas-app-update",
          data: { url: "/" },
          vibrate: [200, 100, 200],
        });
      }
    }
  } catch {}
}

/* --- Push notifications (do sw-push.js original) --- */
self.addEventListener("push", (event) => {
  let data = { title: "Lopas CD", body: "Painel atualizado" };
  try { if (event.data) data = event.data.json(); } catch {}

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || "Lopas CD", {
        body: data.body || "Novos dados recebidos da planilha do Drive",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "lopas-drive-update",
        renotify: true,
        data: { url: data.url || "/" },
        vibrate: [200, 100, 200],
      }),
      incrementarBadge(),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    Promise.all([
      limparBadge(),
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      }),
    ]),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_BADGE") event.waitUntil(limparBadge());
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
