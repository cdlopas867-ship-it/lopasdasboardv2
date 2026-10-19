/* Monitor do Drive que envia notificações push quando os dados mudam.
 *
 * Roda como um intervalo no servidor (junto com o auto-import do Drive).
 * Quando `importarSeMudou` detecta uma mudança e importa com sucesso,
 * envia uma notificação push para todas as assinaturas ativas.
 */

import { importarSeMudou } from "@/lib/drive-auto-import";
import { sendPushToAll, getSubscriptionCount } from "@/lib/push-store";

declare global {
  // eslint-disable-next-line no-var
  var __pushMonitorInterval: ReturnType<typeof setInterval> | undefined;
  var __pushMonitorStarted: boolean | undefined;
}

export function iniciarPushMonitor() {
  if (globalThis.__pushMonitorStarted) return;
  globalThis.__pushMonitorStarted = true;

  /* A cada 30 s, verifica se o Drive mudou. Se mudou, envia push. */
  globalThis.__pushMonitorInterval = setInterval(async () => {
    try {
      if (getSubscriptionCount() === 0) return; // ninguém para notificar
      const mudou = await importarSeMudou();
      if (mudou) {
        const agora = new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        });
        console.info(`[push-monitor] Drive mudou · enviando push a ${getSubscriptionCount()} assinatura(s) · ${agora}`);
        await sendPushToAll(
          "Lopas CD · Painel atualizado",
          `Novos dados recebidos da planilha do Drive · ${agora}`,
          { tipo: "drive-update" },
        );
      }
    } catch (e) {
      console.error("[push-monitor] erro:", (e as Error).message);
    }
  }, 30_000);

  console.info("[push-monitor] monitor do Drive iniciado (verifica a cada 30 s)");
}
