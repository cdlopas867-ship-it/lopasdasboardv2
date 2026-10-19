import { useEffect } from "react";

/* Hook que registra o service worker de push e assina notificações push.
 *
 * - Registra `/sw-push.js` como service worker.
 * - Pede permissão de notificação do usuário (se ainda não concedida).
 * - Assina push com a chave pública VAPID do servidor.
 * - Envia a assinatura para o servidor armazenar.
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

export function usePushNotification() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    let sw: ServiceWorkerRegistration | null = null;

    async function registerAndSubscribe() {
      try {
        sw = await navigator.serviceWorker.register("/sw-push.js", { scope: "/" });
        await navigator.serviceWorker.ready;

        /* Pede permissão se ainda não tem */
        if (Notification.permission === "default") {
          const perm = await Notification.requestPermission();
          if (perm !== "granted") return;
        }
        if (Notification.permission !== "granted") return;

        /* Busca a chave pública VAPID do servidor */
        const res = await fetch("/api/push/public-key");
        if (!res.ok) return;
        const { publicKey } = await res.json();
        if (!publicKey) return;

        /* Assina push (ou reusa assinatura existente) */
        let sub = await sw.pushManager.getSubscription();
        if (!sub) {
          sub = await sw.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
        }

        /* Envia a assinatura ao servidor */
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        });

        console.info("[push] assinatura registrada");
      } catch (e) {
        console.error("[push] falha ao registrar:", e);
      }
    }

    registerAndSubscribe();

    /* Re-assina quando o SW detecta que a assinatura mudou */
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "PUSH_SUBSCRIPTION_CHANGED") {
        registerAndSubscribe();
      }
    });
  }, []);
}
