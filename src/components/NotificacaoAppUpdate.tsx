import { RefreshCw, X } from "lucide-react";
import { permissaoNotificacao } from "@/lib/notificacao-desktop";

/* Banner de "nova versão disponível" — aparece quando o hook useAppUpdate
 * detecta que uma nova versão foi publicada no servidor. O usuário clica em
 * "Atualizar agora" para recarregar o app com a versão nova. */

export function NotificacaoAppUpdate({
  visivel,
  onAtualizar,
  onDispensar,
}: {
  visivel: boolean;
  onAtualizar: () => void;
  onDispensar: () => void;
}) {
  if (!visivel) return null;

  return (
    <div
      role="alert"
      className="fixed left-1/2 top-14 z-[210] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2"
    >
      <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-lg shadow-amber-900/10 dark:border-amber-700 dark:bg-amber-950">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
          <RefreshCw className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            Nova versão disponível
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Atualize para receber as últimas mudanças do painel.
          </p>
          <button
            type="button"
            onClick={onAtualizar}
            className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-amber-700"
          >
            <RefreshCw className="h-3 w-3" />
            Atualizar agora
          </button>
        </div>
        <button
          onClick={onDispensar}
          className="shrink-0 rounded-full p-1 text-amber-600 transition-colors hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900"
          aria-label="Dispensar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
