import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { tempoRelativo, useNotificacoes } from "@/lib/notificacoes";

/* Sino de notificações no topo do painel — estilo Facebook.
 *
 * Contador vermelho com as novidades não lidas; ao abrir, lista as atualizações
 * recebidas da pasta do Drive (mais recentes primeiro), com o que mudou e há
 * quanto tempo. Fecha ao clicar fora ou com Esc. */

export function SinoNotificacoes() {
  const { itens, naoLidas, marcarTodasLidas, marcarLida, limpar } = useNotificacoes();
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const foraDaCaixa = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const escapar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", foraDaCaixa);
    document.addEventListener("keydown", escapar);
    return () => {
      document.removeEventListener("mousedown", foraDaCaixa);
      document.removeEventListener("keydown", escapar);
    };
  }, [aberto]);

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label={naoLidas > 0 ? `Notificações (${naoLidas} novas)` : "Notificações"}
        aria-expanded={aberto}
        className="relative flex cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        <Bell className="h-4 w-4" />
        {naoLidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-[210] mt-2 w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-white/15 bg-[#1c2712]/95 text-white shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
            <p className="text-sm font-semibold">Notificações</p>
            <div className="flex items-center gap-3">
              {naoLidas > 0 && (
                <button
                  type="button"
                  onClick={marcarTodasLidas}
                  className="flex cursor-pointer items-center gap-1 text-[11px] text-white/60 transition-colors hover:text-white"
                >
                  <CheckCheck className="h-3 w-3" /> Marcar lidas
                </button>
              )}
              {itens.length > 0 && (
                <button
                  type="button"
                  onClick={limpar}
                  className="flex cursor-pointer items-center gap-1 text-[11px] text-white/60 transition-colors hover:text-white"
                >
                  <Trash2 className="h-3 w-3" /> Limpar
                </button>
              )}
            </div>
          </div>

          {itens.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs leading-relaxed text-white/60">
              Nenhuma novidade por enquanto. Aqui aparece cada atualização que o
              app receber da pasta do Drive.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {itens.map((n) => (
                <li key={n.id} className="border-b border-white/5 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => marcarLida(n.id)}
                    className={`flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                      n.lida ? "" : "bg-white/10"
                    }`}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/90 text-white">
                      <CheckCheck className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold leading-tight">
                        {n.titulo}
                      </span>
                      {n.detalhe && (
                        <span className="mt-0.5 block text-[11px] leading-snug text-white/70">
                          {n.detalhe}
                        </span>
                      )}
                      <span className="mt-1 block text-[10px] uppercase tracking-wide text-white/45">
                        {tempoRelativo(n.horario)}
                      </span>
                    </span>
                    {!n.lida && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
