/* Comparativo mensal da produtividade — mês anterior × mês atual.
   Mostra a tonelagem, o mês e a variação % entre os dois últimos meses
   do tipo de atividade ativo. Usa o campo `mensal` do ProdTipo. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt } from "@/lib/format";
import type { ProdTipo } from "@/data/produtividade";

const NOMES_MESES: Record<string, string> = {
  Jan: "Janeiro", Fev: "Fevereiro", Mar: "Março", Abr: "Abril",
  Mai: "Maio", Jun: "Junho", Jul: "Julho", Ago: "Agosto",
  Set: "Setembro", Out: "Outubro", Nov: "Novembro", Dez: "Dezembro",
};

export default function ComparativoMensalProdutividade({ tipo }: { tipo: ProdTipo }) {
  const meses = tipo.mensal ?? [];
  if (meses.length < 2) return null;

  const atual = meses[meses.length - 1]!;
  const anterior = meses[meses.length - 2]!;
  const delta = anterior.ton > 0 ? ((atual.ton - anterior.ton) / anterior.ton) * 100 : 0;
  const subiu = delta >= 0;
  const isParcial = atual.mes === "Out"; // outubro é o mês atual (parcial)

  return (
    <div className="mx-auto mt-3 w-full max-w-4xl">
      <p className="mb-1.5 text-center text-[9px] font-bold tracking-[0.25em] text-white/60 uppercase">
        Mês anterior × Mês atual
      </p>
      <div className="video-sobe grid grid-cols-2 gap-3">
        {/* Mês anterior */}
        <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5">
          <p className="text-[8px] font-bold tracking-widest text-white/45 uppercase">
            {NOMES_MESES[anterior.mes] ?? anterior.mes} · 2026
          </p>
          <p className="mt-1 font-serif text-2xl text-white sm:text-3xl">
            {fmtBrMax(anterior.ton, 1)} <span className="text-sm text-white/50">t</span>
          </p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white/50"
              style={{ width: `${Math.min((anterior.ton / Math.max(anterior.ton, atual.ton)) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[9px] text-white/45">
            {fmtBrMax(anterior.ton, 1)} toneladas movimentadas
          </p>
        </div>

        {/* Mês atual */}
        <div className="rounded-xl border border-brand-amber/30 bg-brand-amber/10 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[8px] font-bold tracking-widest text-brand-amber/70 uppercase">
              {NOMES_MESES[atual.mes] ?? atual.mes} · 2026
            </p>
            {isParcial && (
              <span className="rounded-full bg-brand-amber/20 px-1.5 py-0.5 text-[7px] font-bold tracking-wider text-brand-amber uppercase">
                Parcial
              </span>
            )}
          </div>
          <p className="mt-1 font-serif text-2xl text-brand-amber sm:text-3xl">
            {fmtBrMax(atual.ton, 1)} <span className="text-sm text-brand-amber/50">t</span>
          </p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand-amber"
              style={{ width: `${Math.min((atual.ton / Math.max(anterior.ton, atual.ton)) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[9px] text-white/45">
            {fmtBrMax(atual.ton, 1)} toneladas {isParcial ? "até agora" : "movimentadas"}
          </p>
        </div>
      </div>

      {/* Variação */}
      <div className="video-sobe mt-2 flex items-center justify-center gap-2" style={{ animationDelay: "0.15s" }}>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[10px] font-bold",
            subiu ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400",
          )}
        >
          {subiu ? "▲" : "▼"} {fmtBrMax(Math.abs(delta), 1)}% {subiu ? "a mais" : "a menos"}
        </span>
        <span className="text-[10px] text-white/45">
          {subiu ? "+" : "−"}{fmtBrMax(Math.abs(atual.ton - anterior.ton), 1)} t vs. {anterior.mes}
        </span>
      </div>
    </div>
  );
}
