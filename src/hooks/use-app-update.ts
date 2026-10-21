import { useEffect, useState, useCallback, useRef } from "react";

/* Hook que detecta quando uma nova versão do app foi publicada.
 *
 * - Na carga inicial, guarda a assinatura dos scripts carregados.
 * - A cada 2 min e quando a aba volta ao foco, busca o HTML atual do
 *   servidor (cache: no-store) e compara os <script src> com os da página.
 * - Se diferentes, uma nova versão foi publicada → ativa a notificação.
 * - Também ouve mensagens do SW (APP_UPDATE_AVAILABLE), que chegam quando
 *   o SW detecta a mudança durante uma navegação ou via Periodic Sync.
 */

function getLoadedScripts(): string {
  return Array.from(document.querySelectorAll('script[src]'))
    .map((s) => s.getAttribute("src") ?? "")
    .filter((s) => s.includes("/assets/"))
    .sort()
    .join("|");
}

function extractFetchedScripts(html: string): string {
  const matches = html.match(/src="(\/assets\/[^"]*)"/g) || [];
  return matches.map((s) => s.replace(/src="([^"]*)"/, "$1")).sort().join("|");
}

async function checarAtualizacao(): Promise<boolean> {
  try {
    const res = await fetch("/", { cache: "no-store" });
    const html = await res.text();
    return extractFetchedScripts(html) !== getLoadedScripts();
  } catch {
    return false;
  }
}

export function useAppUpdate() {
  const [updateDisponivel, setUpdateDisponivel] = useState(false);
  /* Só recarrega no controllerchange se nós mesmos pedimos o skipWaiting
     — evita reload na primeira carga (quando o SW assume o controle pela
     primeira vez) e no ambiente de preview. */
  const pediuSkip = useRef(false);

  /* Ouvir mensagens do SW (APP_UPDATE_AVAILABLE) + controllerchange */
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "APP_UPDATE_AVAILABLE") setUpdateDisponivel(true);
    };
    const onControllerChange = () => {
      if (pediuSkip.current) window.location.reload();
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  /* Polling de verificação + checagem no foco */
  useEffect(() => {
    let cancelado = false;
    const verificar = async () => {
      if (document.visibilityState !== "visible") return;
      const atualizou = await checarAtualizacao();
      if (atualizou && !cancelado) setUpdateDisponivel(true);
    };
    const interval = setInterval(verificar, 120_000);
    const onVisivel = () => { if (document.visibilityState === "visible") setTimeout(verificar, 1000); };
    document.addEventListener("visibilitychange", onVisivel);
    window.addEventListener("focus", onVisivel);
    return () => {
      cancelado = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisivel);
      window.removeEventListener("focus", onVisivel);
    };
  }, []);

  const atualizarAgora = useCallback(() => {
    pediuSkip.current = true;
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
    }
    /* fallback: recarrega mesmo se o SW não responder em 1s */
    setTimeout(() => window.location.reload(), 1000);
  }, []);

  /* Registra Periodic Background Sync (Chrome/Edge desktop) */
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PeriodicSyncManager" in window)) return;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const tags = await reg.periodicSync.getTags();
        if (!tags.includes("check-update")) {
          await reg.periodicSync.register("check-update", { minInterval: 12 * 60 * 60 * 1000 });
        }
      } catch { /* sem permissão ou sem suporte — best-effort */ }
    })();
  }, []);

  return { updateDisponivel, atualizarAgora, dispensar: () => setUpdateDisponivel(false) };
}
