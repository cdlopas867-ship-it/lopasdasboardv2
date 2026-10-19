/* Mini-janela de desktop — widget fixo que mantém à vista o peso e o valor
   do estoque do CD, sem precisar abrir a apresentação inteira. Só aparece em
   telas grandes (md+); no mobile fica oculta. Visual estilo Windows 11 Quick
   Settings: painel escuro (#1c1c1c), tiles azuis (#609af8), cantos
   arredondados e sombra flutuante. */

import { useState } from "react";
import { fmtTonDec, fmtMi } from "@/lib/format";

const C = {
  panel: "#1c1c1c",
  panelEdge: "#ffffff20",
  tileActive: "#609af8",
  tileInactive: "#303030",
  accent: "#609af8",
  track: "#4d4d4d",
  trackFill: "#609af8",
};

type Props = {
  pesoTon: number;
  valor: number;
  itens?: number;
  atualizadoEm?: string;
};

export default function MiniJanelaEstoque({ pesoTon, valor, itens, atualizadoEm }: Props) {
  const [aberta, setAberta] = useState(true);

  if (!aberta) {
    return (
      <button
        type="button"
        onClick={() => setAberta(true)}
        className="fixed bottom-4 right-4 z-[130] hidden md:flex items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-semibold text-white/90 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)] backdrop-blur-xl transition hover:bg-white/10"
        style={{ background: C.panel, border: `1px solid ${C.panelEdge}` }}
      >
        <span
          className="size-2 animate-pulse rounded-full"
          style={{ background: C.accent, boxShadow: `0 0 8px ${C.accent}` }}
        />
        Desempenho
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-[130] hidden md:block w-64 overflow-hidden rounded-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.85)] backdrop-blur-xl"
      style={{ background: C.panel, border: `1px solid ${C.panelEdge}` }}
    >
      {/* cabeçalho */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span
            className="size-2 animate-pulse rounded-full"
            style={{ background: C.accent, boxShadow: `0 0 8px ${C.accent}` }}
          />
          <span className="text-[10px] font-semibold tracking-wide text-white/90">
            Desempenho
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAberta(false)}
          aria-label="Fechar mini-janela"
          className="grid size-5 place-items-center rounded-md text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* tiles — estilo Quick Settings */}
      <div className="grid grid-cols-2 gap-2 px-3.5 pb-2.5">
        {/* Peso — tile azul (ativo) */}
        <div
          className="flex flex-col gap-0.5 rounded-xl px-2.5 py-2"
          style={{ background: C.tileActive }}
        >
          <span className="text-[8px] font-semibold tracking-[0.1em] uppercase text-white/80">
            Peso
          </span>
          <span className="font-mono text-sm font-bold tabular-nums text-white">
            {fmtTonDec(pesoTon)}
          </span>
        </div>
        {/* Valor — tile azul (ativo) */}
        <div
          className="flex flex-col gap-0.5 rounded-xl px-2.5 py-2"
          style={{ background: C.tileActive }}
        >
          <span className="text-[8px] font-semibold tracking-[0.1em] uppercase text-white/80">
            Valor
          </span>
          <span className="font-mono text-sm font-bold tabular-nums text-white">
            {fmtMi(valor)}
          </span>
        </div>
      </div>

      {/* rodapé */}
      <div className="flex items-center justify-between px-3.5 pb-3 pt-0.5 text-[9px] text-white/50">
        <span className="tracking-wide">{itens != null ? `${itens} itens` : ""}</span>
        <a
          href="/widget"
          target="_blank"
          rel="noopener"
          className="tracking-wide underline transition hover:text-white"
          style={{ color: `${C.accent}99` }}
        >
          Abrir widget ↗
        </a>
      </div>
    </div>
  );
}
