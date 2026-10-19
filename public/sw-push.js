/* Service Worker para notificações push do painel Lopas.
 *
 * Recebe push events do servidor (quando o Drive é atualizado e o app
 * está fechado) e exibe uma notificação do sistema. Ao clicar na
 * notificação, abre/foca o app.
 *
 * Também define um badge no ícone do app (estilo WhatsApp: um círculo
 * vermelho com a contagem de atualizações) usando a Badging API.
 * O badge é incrementado a cada push e limpo quando o app é aberto.
 */

const BADGE_DB = "lopas-badge";
const BADGE_STORE = "count";
const BADGE_KEY = "updates";

/* --- Contador de badge persistido em IndexedDB (sobrevive a restarts do SW) --- */
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
  } catch {
    return 0;
  }
}

async function setBadgeCount(n) {
  try {
    const db = await openBadgeDb();
    if (!db) return;
    await new Promise((resolve) => {
      const tx = db.transaction(BADGE_STORE, "readwrite");
      tx.objectStore(BADGE_STORE).put(n, BADGE_KEY);
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
  } catch {
    /* ignora — badge é best-effort */
  }
}

function openBadgeDb() {
  return new Promise((resolve) => {
    if (!("indexedDB" in self)) return resolve(null);
    const req = indexedDB.open(BADGE_DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(BADGE_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

/* Define o badge no ícone do app (Badging API). Best-effort: navegadores
   sem suporte simplesmente ignoram. */
async function aplicarBadge(count) {
  try {
    if ("setAppBadge" in self.registration) {
      if (count > 0) await self.registration.setAppBadge(count);
      else await self.registration.clearAppBadge();
    }
  } catch {
    /* ignora */
  }
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

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "Lopas CD", body: "Painel atualizado" };
  try {
    if (event.data) data = event.data.json();
  } catch {
    /* payload não-JSON — usa defaults */
  }

  const options = {
    body: data.body || "Novos dados recebidos da planilha do Drive",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "lopas-drive-update",
    renotify: true,
    data: { url: data.url || "/" },
    vibrate: [200, 100, 200],
  };

  /* Mostra a notificação E define o badge no ícone (estilo WhatsApp) */
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || "Lopas CD", options),
      incrementarBadge(),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  /* Ao clicar na notificação, limpa o badge (usuário está abrindo o app) */
  event.waitUntil(
    Promise.all([
      limparBadge(),
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        /* Se o app já está aberto, foca a janela */
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        /* Senão, abre o app */
        if (self.clients.openWindow) return self.clients.openWindow(url);
      }),
    ]),
  );
});

/* Quando o app (cliente) volta ao foco, pede ao SW para limpar o badge.
   Mensagem trocada com o hook usePushNotification no cliente. */
self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_BADGE") {
    event.waitUntil(limparBadge());
  }
});
