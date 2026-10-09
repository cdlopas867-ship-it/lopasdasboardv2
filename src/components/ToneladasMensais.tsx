/* Tonelagem mensal do tipo de atividade ativo na cena Produtividade
   (PESO kg ÷ 1000 agrupado por mês). Substitui os "Destaques do mês". */

import { fmtBrMax } from "@/lib/format";
import type { ProdTipo } from "@/data/produtividade";

const COR = "#00FFCC";

export default function ToneladasMensais({ tipo }: { tipo: ProdTipo }) {
  const meses = tipo.mensal ?? [];
  const max = Math.max(1, ...meses.map((m) => m.ton));

  return (
    <div className="mx-auto mt-3 w-full max-w-4xl">
      <p className="mb-1.5 text-center text-[9px] font-bold tracking-[0.25em] text-white/60 uppercase">
        Toneladas por mês
      </p>
      {meses.length ? (
        <div className="video-sobe flex h-28 items-end gap-2 rounded-xl border border-white/15 bg-white/5 px-3 pt-2 pb-1.5">
          {meses.map((m) => (
            <div key={m.mes} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center">
              <span className="font-mono text-[9px] font-bold text-white">{fmtBrMax(m.ton, 0)}</span>
              <div
                className="mt-0.5 rounded-t"
                style={{ height: `${(m.ton / max) * 62}%`, background: COR }}
              />
              <span className="mt-0.5 text-[9px] font-bold text-white/60 uppercase">{m.mes}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-[10px] text-white/40">Sem dados mensais para este tipo.</p>
      )}
    </div>
  );
}
