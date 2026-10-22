/* Aviso do navegador (notificação do sistema) quando chegam dados novos.
 *
 * Usa o service worker registrado quando existir — mesmo caminho das
 * notificações push — e cai para a Notification direta se ele não estiver
 * disponível. Sem permissão concedida não faz nada: quem pede a permissão é o
 * hook usePushNotification, na abertura do painel. */

export async function mostrarAvisoNavegador(titulo: string, corpo: string): Promise<void> {
  try {
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    const opcoes: NotificationOptions = {
      body: corpo,
      /* Mesma tag: uma atualização nova substitui a anterior em vez de empilhar */
      tag: "lopas-atualizacao",
      icon: "/icon-192.png",
      badge: "/favicon.png",
      data: { url: "/" },
    };

    const registro = await navigator.serviceWorker?.getRegistration?.();
    if (registro?.showNotification) {
      await registro.showNotification(titulo, opcoes);
    } else {
      new Notification(titulo, opcoes);
    }
    console.info("[aviso] notificação do navegador exibida");
  } catch (e) {
    console.error("[aviso] falha ao exibir notificação do navegador:", (e as Error).message);
  }
}
