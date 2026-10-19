/* Store de assinaturas Web Push + envio de notificações push.
 *
 * - Mantém as assinaturas (push subscriptions) em memória no servidor.
 * - Usa as chaves VAPID do ambiente para assinar e enviar notificações.
 * - Se as chaves VAPID não existirem, gera automaticamente na primeira execução.
 */

import type { PushSubscription as WebPushSubscription } from "web-push";

type SubStore = {
  subscriptions: Set<string>;
  vapidKeys: { publicKey: string; privateKey: string } | null;
  initialized: boolean;
};

const store: SubStore = {
  subscriptions: new Set(),
  vapidKeys: null,
  initialized: false,
};

declare global {
  // eslint-disable-next-line no-var
  var __pushSubscriptions: Set<string> | undefined;
  // eslint-disable-next-line no-var
  var __vapidKeys: { publicKey: string; privateKey: string } | undefined;
}

function getStore(): SubStore {
  if (!globalThis.__pushSubscriptions) globalThis.__pushSubscriptions = new Set();
  if (!globalThis.__vapidKeys) globalThis.__vapidKeys = null;
  return {
    subscriptions: globalThis.__pushSubscriptions,
    vapidKeys: globalThis.__vapidKeys,
    initialized: !!globalThis.__vapidKeys,
  };
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? getStore().vapidKeys?.publicKey ?? null;
}

export async function ensureVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const envPub = process.env.VAPID_PUBLIC_KEY;
  const envPriv = process.env.VAPID_PRIVATE_KEY;
  if (envPub && envPriv) {
    const keys = { publicKey: envPub, privateKey: envPriv };
    globalThis.__vapidKeys = keys;
    return keys;
  }

  if (globalThis.__vapidKeys) return globalThis.__vapidKeys;

  /* Gera chaves VAPID dinamicamente se não houver no ambiente. */
  const webPush = await import("web-push");
  const keys = webPush.generateVAPIDKeys();
  globalThis.__vapidKeys = keys;
  console.info("[push] chaves VAPID geradas automaticamente (defina VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY no ambiente para persistir)");
  return keys;
}

export function addSubscription(subscription: WebPushSubscription): void {
  globalThis.__pushSubscriptions ??= new Set();
  globalThis.__pushSubscriptions.add(JSON.stringify(subscription));
  console.info(`[push] assinatura adicionada · total: ${globalThis.__pushSubscriptions.size}`);
}

export function removeSubscription(subscription: WebPushSubscription): void {
  globalThis.__pushSubscriptions?.delete(JSON.stringify(subscription));
}

export function getSubscriptionCount(): number {
  return globalThis.__pushSubscriptions?.size ?? 0;
}

/* Envia uma notificação push para todas as assinaturas ativas. */
export async function sendPushToAll(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
  const subs = globalThis.__pushSubscriptions;
  if (!subs || subs.size === 0) return;

  const keys = await ensureVapidKeys();
  const webPush = await import("web-push");

  webPush.setVapidDetails(
    "mailto:contato@lopas.com.br",
    keys.publicKey,
    keys.privateKey,
  );

  const payload = JSON.stringify({ title, body, data: { ...data, url: "/" } });

  const promises: Promise<void>[] = [];
  for (const subStr of subs) {
    const sub = JSON.parse(subStr) as WebPushSubscription;
    promises.push(
      webPush.sendNotification(sub, payload)
        .then(() => { /* enviado */ })
        .catch((err: { statusCode?: number; message?: string }) => {
          /* 410 = assinatura expirada; remove silenciosamente */
          if (err.statusCode === 410 || err.statusCode === 404) {
            subs.delete(subStr);
            console.info("[push] assinatura removida (expirada)");
          } else {
            console.error(`[push] falha ao enviar: ${err.statusCode} ${err.message}`);
          }
        }),
    );
  }
  await Promise.all(promises);
}
