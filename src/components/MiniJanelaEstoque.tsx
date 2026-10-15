/* Mini-janela de desktop — widget fixo que mantém à vista o peso e o valor
   do estoque do CD, sem precisar abrir a apresentação inteira. Só aparece em
   telas grandes (md+); no mobile fica oculta. */

import { useState } from "react";
import { fmtTonDec, fmtMi } from "@/lib/format";

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
        className="fixed bottom-4 right-4 z-[130] hidden md:flex items-center gap-2 rounded-full border border-[#00FFCC]/30 bg-[#0c1408]/90 px-4 py-2.5 text-[11px] font-bold tracking-widest text-white/80 uppercase shadow-[0_0_20px_-4px_rgba(0,255,204,0.4)] backdrop-blur-md transition hover:border-[#00FFCC]/50 hover:bg-[#0c1408]/95"
      >
        <span className="size-2 animate-pulse rounded-full bg-[#00FFCC] shadow-[0_0_8px_#00FFCC]" />
        Desempenho
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[130] hidden md:block w-64 overflow-hidden rounded-2xl border border-[#00FFCC]/15 bg-gradient-to-b from-[#0f1a0b]/95 to-[#0a1306]/95 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      {/* cabeçalho com gradiente sutil */}
      <div className="relative flex items-center justify-between px-3.5 pt-3 pb-2">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00FFCC]/8 via-transparent to-transparent" />
        <div className="relative flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-[#00FFCC] shadow-[0_0_8px_#00FFCC]" />
          <span className="text-[10px] font-bold tracking-[0.22em] text-white/80 uppercase">Desempenho</span>
        </div>
        <button
          type="button"
          onClick={() => setAberta(false)}
          aria-label="Fechar mini-janela"
          className="relative grid size-5 place-items-center rounded-md text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* linha de separação com gradiente */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {/* métricas */}
      <div className="px-3.5 py-2.5 space-y-2.5">
        {/* Peso */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-[0.15em] text-white/45 uppercase">Peso</span>
          <span className="font-mono text-xl font-bold tabular-nums text-[#00FFCC] [text-shadow:0_0_12px_rgba(0,255,204,0.3)]">
            {fmtTonDec(pesoTon)}
          </span>
        </div>
        {/* separador pontilhado */}
        <div className="border-t border-dashed border-white/10" />
        {/* Valor */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-[0.15em] text-white/45 uppercase">Valor</span>
          <span className="font-mono text-xl font-bold tabular-nums text-white">
            {fmtMi(valor)}
          </span>
        </div>
      </div>

      {/* rodapé */}
      <div className="flex items-center justify-between px-3.5 pb-2.5 text-[9px] text-white/35">
        <span className="tracking-wide">{itens != null ? `${itens} itens` : ""}</span>
        <a href="/widget" target="_blank" rel="noopener" className="tracking-wide text-[#00FFCC]/60 underline transition hover:text-[#00FFCC]">
          Abrir widget ↗
        </a>
      </div>

      {/* faixa que "passa" — sinaliza ao vivo */}
      <div className="h-0.5 w-full overflow-hidden bg-white/5">
        <div className="mini-janela-passa h-full w-1/3 bg-gradient-to-r from-transparent via-[#00FFCC] to-transparent" />
      </div>
    </div>
  );
}
