/* Service Worker para notificações push do painel Lopas.
 *
 * Recebe push events do servidor (quando o Drive é atualizado e o app
 * está fechado) e exibe uma notificação do sistema. Ao clicar na
 * notificação, abre/foca o app.
 */

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

  event.waitUntil(self.registration.showNotification(data.title || "Lopas CD", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
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
  );
});
