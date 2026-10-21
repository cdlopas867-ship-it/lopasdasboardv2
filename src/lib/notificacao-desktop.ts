/* Notificação na área de trabalho (notificação do sistema) quando o painel
 * recebe dados novos da planilha.
 *
 * - Usa o service worker unificado (/sw.js) para exibir a
 *   notificação do sistema; sem service worker, cai para a Notification API.
 * - O navegador só aceita pedir a permissão a partir de um clique do usuário,
 *   por isso `pedirPermissaoNotificacao` é chamada no botão do banner.
 * - A `tag` é a mesma usada pelo push do servidor (sw.js): assim a
 *   notificação local substitui a do push em vez de duplicar.
 */

const TAG = "lopas-drive-update";

export function permissaoNotificacao(): NotificationPermission | "indisponivel" {
  if (typeof window === "undefined" || !("Notification" in window)) return "indisponivel";
  return Notification.permission;
}

export async function pedirPermissaoNotificacao(): Promise<
  NotificationPermission | "indisponivel"
> {
  if (typeof window === "undefined" || !("Notification" in window)) return "indisponivel";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/* Exibe a notificação do sistema com o horário da atualização. */
export async function notificarAtualizacao(horario: number): Promise<void> {
  if (permissaoNotificacao() !== "granted") return;

  const hora = new Date(horario).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  const titulo = "Lopas CD · Painel atualizado";
  const corpo = `Novos dados recebidos da planilha · ${hora}`;

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration("/");
      if (reg) {
        await reg.showNotification(titulo, {
          body: corpo,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: TAG,
          data: { url: "/" },
        });
        return;
      }
    }
    new Notification(titulo, { body: corpo, icon: "/icon-192.png", tag: TAG });
  } catch {
    /* best-effort — o banner no painel continua avisando */
  }
}
