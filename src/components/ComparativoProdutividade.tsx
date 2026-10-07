/* Comparativo — a atividade produtiva ativa (separação, recebimento,
   movimentação) contra o volume efetivamente carregado, no mesmo período. As
   toneladas carregadas por mês vêm de src/data/carregado-mensal.ts; a
   diferença (atividade − carregado) mostra o quanto a atividade fica acima
   (ou abaixo) do carregado na mesma janela de meses. */

import { fmtBrMax, fmtTonDec } from "@/lib/format";
import { carregadoNoPeriodo } from "@/data/carregado-mensal";
import type { ProdTipo } from "@/data/produtividade";

const CARREGADO_COR = "#FFA500";
const ACIMA_COR = "#F87171";
const ABAIXO_COR = "#4ADE80";

export default function ComparativoProdutividade({ tipo, cor }: { tipo: ProdTipo; cor: string }) {
  const carregado = carregadoNoPeriodo(tipo.periodo);
  const dif = Math.round((tipo.ton - carregado.ton) * 10) / 10;
  const pct = carregado.ton > 0 ? (dif / carregado.ton) * 100 : 0;
  const maior = Math.max(tipo.ton, carregado.ton, 1);
  const acima = dif >= 0;
  const difCor = acima ? ACIMA_COR : ABAIXO_COR;

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

      <div
        className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-lg border px-3 py-1.5"
        style={{ borderColor: `${difCor}55`, background: `${difCor}1A` }}
      >
        <span className="text-[9px] font-bold tracking-wider text-white/70 uppercase">
          Diferença · atividade − carregado
        </span>
        <span className="font-mono text-[14px] font-bold" style={{ color: difCor }}>
          {acima ? "+" : ""}
          {fmtTonDec(dif)}
        </span>
        <span className="font-mono text-[10px] font-semibold text-white/65">
          ({acima ? "+" : ""}
          {fmtBrMax(pct, 1)}%)
        </span>
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
