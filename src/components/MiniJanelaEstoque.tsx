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
        className="fixed bottom-4 right-4 z-[130] hidden md:flex items-center gap-2 rounded-full border border-white/20 bg-black/70 px-3 py-2 text-[11px] font-bold tracking-widest text-white/80 uppercase backdrop-blur transition hover:bg-black/85"
      >
        <span className="size-1.5 animate-pulse rounded-full bg-[#00FFCC]" />
        Estoque
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[130] hidden md:block w-60 overflow-hidden rounded-xl border border-white/15 bg-[#0c1408]/85 shadow-2xl backdrop-blur-md">
      {/* cabeçalho */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-[#00FFCC]" />
          <span className="text-[10px] font-bold tracking-[0.25em] text-white/70 uppercase">Estoque CD Lopas</span>
        </div>
        <button
          type="button"
          onClick={() => setAberta(false)}
          aria-label="Fechar mini-janela"
          className="text-white/40 transition hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* métricas */}
      <div className="px-3 pb-2.5">
        <div className="flex items-end justify-between border-b border-white/10 py-1.5">
          <span className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">Peso</span>
          <span className="font-mono text-lg font-bold text-[#00FFCC]">{fmtTonDec(pesoTon)}</span>
        </div>
        <div className="flex items-end justify-between border-b border-white/10 py-1.5">
          <span className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">Valor</span>
          <span className="font-mono text-lg font-bold text-white">{fmtMi(valor)}</span>
        </div>
        <div className="flex items-center justify-between pt-1.5 text-[9px] text-white/40">
          <span>{itens != null ? `${itens} itens` : ""}</span>
          <span>Atualizado {atualizadoEm ?? "—"}</span>
        </div>
      </div>

      {/* faixa que "passa" — sinaliza ao vivo */}
      <div className="h-0.5 w-full overflow-hidden bg-white/5">
        <div className="mini-janela-passa h-full w-1/3 bg-gradient-to-r from-transparent via-[#00FFCC] to-transparent" />
      </div>
    </div>
  );
}
