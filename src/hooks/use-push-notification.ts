import { useEffect, useCallback } from "react";
import { pedirPermissaoNotificacao } from "@/lib/notificacao-desktop";

/* Hook que registra o service worker de push e assina notificações push.
 *
 * - Registra `/sw-push.js` como service worker.
 * - Assina push com a chave pública VAPID do servidor **quando a permissão
 *   de notificação já foi concedida**.
 * - A permissão NÃO é pedida automaticamente na carga: o navegador só abre o
 *   pedido a partir de um clique do usuário, e uma tentativa fora de gesto
 *   pode deixar a permissão bloqueada para sempre. Quem chama
 *   `ativarNotificacoes` (botão do banner de atualização) faz o pedido.
 * - Re-assina automaticamente se a assinatura expirar.
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/* Registra o service worker e envia a assinatura push ao servidor. */
async function assinarPush(): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  if (Notification.permission !== "granted") return;

  const sw = await navigator.serviceWorker.register("/sw-push.js", { scope: "/" });
  await navigator.serviceWorker.ready;

  const res = await fetch("/api/push/public-key");
  if (!res.ok) return;
  const { publicKey } = await res.json();
  if (!publicKey) return;

  let sub = await sw.pushManager.getSubscription();
  if (!sub) {
    sub = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });
}

export function usePushNotification() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    /* Limpa o badge do ícone do app (estilo WhatsApp) quando o app abre
       ou volta ao foco — o usuário já está vendo o painel. */
    async function clearBadge() {
      try {
        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage({ type: "CLEAR_BADGE" });
        if ("clearAppBadge" in navigator) await navigator.clearAppBadge();
      } catch {
        /* best-effort */
      }
    }
    clearBadge();

    const onFocus = () => clearBadge();
    const onVisibility = () => {
      if (document.visibilityState === "visible") clearBadge();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    /* Só assina sem incomodar quando a permissão já existe. */
    if (Notification.permission === "granted") {
      assinarPush()
        .then(() => console.info("[push] assinatura registrada"))
        .catch((e) => console.error("[push] falha ao registrar:", e));
    }

    /* Re-assina quando o SW detecta que a assinatura mudou */
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_SUBSCRIPTION_CHANGED") {
        assinarPush().catch((e) => console.error("[push] falha ao re-assinar:", e));
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

  /* Chamada a partir do clique do usuário: pede a permissão do navegador e,
     se concedida, assina o push. */
  const ativarNotificacoes = useCallback(async () => {
    const permissao = await pedirPermissaoNotificacao();
    if (permissao === "granted") {
      await assinarPush().catch((e) => console.error("[push] falha ao registrar:", e));
    }
    return permissao;
  }, []);

  return { ativarNotificacoes };
}
