import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { iniciarSinoFavicon, pararSinoFavicon } from "@/lib/favicon-sino";
import { permissaoNotificacao } from "@/lib/notificacao-desktop";

/* Banner de notificação de atualização — estilo WhatsApp Web.
 *
 * Quando o painel recebe novos dados da planilha do Drive, este banner
 * desliza do topo e fica visível até o usuário dispensar (não some sozinho,
 * como um toast). Mostra o horário em que a atualização chegou.
 * Também adiciona um badge "(1)" no título da aba enquanto visível.
 * O ícone é um sininho que balança continuamente (classe .sino-toca) com um
 * badge vermelho pulsante, para chamar atenção à atualização.
 */
const TITULO_BASE = "Painel de Estoque · Lopas 2026";

export function NotificacaoAtualizacao({
  notificacao,
  onDispensar,
  onAtivarNotificacoes,
}: {
  notificacao: { visivel: boolean; horario: number } | null;
  onDispensar: () => void;
  /* Pede a permissão da notificação do sistema (o navegador exige um clique). */
  onAtivarNotificacoes?: () => Promise<unknown>;
}) {
  const [mostrar, setMostrar] = useState(false);
  const [permissao, setPermissao] = useState(() => permissaoNotificacao());

  useEffect(() => setPermissao(permissaoNotificacao()), [notificacao]);

  const ativar = async () => {
    if (!onAtivarNotificacoes) return;
    await onAtivarNotificacoes();
    setPermissao(permissaoNotificacao());
  };

  useEffect(() => {
    if (notificacao?.visivel) {
      // pequeno atraso para a animação de entrada
      const t = requestAnimationFrame(() => setMostrar(true));
      return () => cancelAnimationFrame(t);
    }
    setMostrar(false);
  }, [notificacao]);

  /* Sino animado no ícone da aba + badge numérico no ícone do app instalado
     (Badging API, estilo WhatsApp) enquanto a notificação está visível. */
  useEffect(() => {
    if (!notificacao?.visivel) return;
    iniciarSinoFavicon();
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    nav.setAppBadge?.(1).catch(() => {});
    return () => {
      pararSinoFavicon();
      nav.clearAppBadge?.().catch(() => {});
    };
  }, [notificacao]);

  /* Badge no título da aba — "(1) Painel..." enquanto a notificação está visível */
  useEffect(() => {
    if (notificacao?.visivel) {
      document.title = `(1) ${TITULO_BASE}`;
      return () => { document.title = TITULO_BASE; };
    }
    document.title = TITULO_BASE;
  }, [notificacao]);

  if (!notificacao?.visivel) return null;

  const horarioFormatado = new Date(notificacao.horario).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  return (
    <div
      className="fixed left-1/2 top-3 z-[200] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 transition-all duration-300 ease-out md:left-3 md:translate-x-0"
      style={{
        transform: mostrar
          ? "translateY(0)"
          : "translateY(-150%)",
        opacity: mostrar ? 1 : 0,
        left: "50%",
        translate: "-50% 0",
      }}
    >
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg shadow-emerald-900/10 dark:border-emerald-800 dark:bg-emerald-950">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Bell className="sino-toca h-5 w-5" />
          <span className="sino-badge-pulsa absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-emerald-50 dark:ring-emerald-950" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            Painel atualizado
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            Novos dados recebidos da planilha · {horarioFormatado}
          </p>
          {permissao === "default" && (
            <button
              type="button"
              onClick={ativar}
              className="mt-1.5 inline-flex items-start gap-1 rounded-md bg-emerald-600 px-2 py-1 text-left text-[11px] font-semibold leading-tight text-white transition-colors hover:bg-emerald-700"
            >
              <Bell className="mt-0.5 h-3 w-3 shrink-0" />
              Ativar notificação na área de trabalho
            </button>
          )}
          {permissao === "denied" && (
            <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
              Notificações bloqueadas — libere nas permissões do site.
            </p>
          )}
        </div>
        <button
          onClick={onDispensar}
          className="shrink-0 rounded-full p-1 text-emerald-600 transition-colors hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900"
          aria-label="Dispensar notificação"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
