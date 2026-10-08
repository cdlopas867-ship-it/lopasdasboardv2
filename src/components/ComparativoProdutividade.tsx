/* Comparativo — a atividade produtiva ativa (separação, recebimento,
   movimentação) contra o volume efetivamente carregado, no mesmo período. As
   toneladas carregadas por mês vêm de src/data/carregado-mensal.ts. */

import { fmtTonDec } from "@/lib/format";
import { carregadoNoPeriodo } from "@/data/carregado-mensal";
import type { ProdTipo } from "@/data/produtividade";

const CARREGADO_COR = "#FFA500";

export default function ComparativoProdutividade({ tipo, cor }: { tipo: ProdTipo; cor: string }) {
  const carregado = carregadoNoPeriodo(tipo.periodo);
  const maior = Math.max(tipo.ton, carregado.ton, 1);

  return (
    <div className="video-sobe mx-auto mt-3 w-full max-w-4xl rounded-xl border border-white/15 bg-white/5 px-3 py-2.5">
      <p className="text-center text-[9px] font-bold tracking-[0.25em] text-white/60 uppercase">
        {tipo.nome} × carregado
      </p>
      <p className="mb-2 text-center text-[9px] text-white/45">
        Mesmo período · {rotuloMeses(carregado.meses)}
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Barra rotulo={tipo.nome} ton={tipo.ton} maior={maior} cor={cor} />
        <Barra rotulo="Carregado" ton={carregado.ton} maior={maior} cor={CARREGADO_COR} />
      </div>
    </div>
  );
}

function Barra({
  rotulo,
  ton,
  maior,
  cor,
}: {
  rotulo: string;
  ton: number;
  maior: number;
  cor: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-[10px] font-bold text-white/85" title={rotulo}>
          {rotulo}
        </span>
        <span className="shrink-0 font-mono text-[13px] font-bold" style={{ color: cor }}>
          {fmtTonDec(ton)}
        </span>
      </div>
      <span className="mt-1 block h-[4px] overflow-hidden rounded-full bg-white/10">
        <span
          className="block h-full rounded-full transition-all duration-500"
          style={{ width: `${(ton / maior) * 100}%`, background: cor }}
        />
      </span>
    </div>
  );
}

function rotuloMeses(meses: string[]): string {
  if (!meses.length) return "—";
  return `${meses[0]}–${meses[meses.length - 1]}/2026`;
}
