/* Cena Fora de Linha — comparativo Em Linha × Fora de Linha no mesmo
   estilo minimalista da CenaSaudeEstoque: anel central + tabela-resumo
   de duas colunas. */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtInt, fmtMoeda, fmtPct, fmtBrMax } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import {
  ITENS_FORA_DE_LINHA,
  POSICAO_EM_LINHA,
  POSICAO_FORA_DE_LINHA,
  POSICAO_TOTAL,
  type ItemForaDeLinha,
  type PosicaoEstoque,
} from "@/data/fora-de-linha";

export type ForaDeLinhaProp = {
  itens: ItemForaDeLinha[];
  posicaoEmLinha: PosicaoEstoque;
  posicaoForaDeLinha: PosicaoEstoque;
  posicaoTotal: PosicaoEstoque;
} | null;

const R = 84;
const CIRC = 2 * Math.PI * R;
const DURACAO_CONTAGEM = 1300; // ms — mesma duração do donut

export default function CenaForaDeLinha({
  anim,
  foraDeLinha,
  onPausar,
}: {
  anim: boolean;
  foraDeLinha?: ForaDeLinhaProp | null;
  onPausar?: () => void;
}) {
  const posicaoEmLinha = foraDeLinha?.posicaoEmLinha ?? POSICAO_EM_LINHA;
  const posicaoFora = foraDeLinha?.posicaoForaDeLinha ?? POSICAO_FORA_DE_LINHA;
  const posicaoTotal = foraDeLinha?.posicaoTotal ?? POSICAO_TOTAL;

  const pctEmLinha = posicaoTotal.valorEstoque > 0
    ? (posicaoEmLinha.valorEstoque / posicaoTotal.valorEstoque) * 100
    : 0;
  const pctFora = posicaoTotal.valorEstoque > 0
    ? (posicaoFora.valorEstoque / posicaoTotal.valorEstoque) * 100
    : 0;

  /* Contagem animada de 0 até o valor da % em linha */
  const [contagem, setContagem] = useState(0);
  useEffect(() => {
    if (!anim) {
      setContagem(0);
      return;
    }
    let raf: number;
    const inicio = performance.now();
    const tick = (agora: number) => {
      const t = Math.min((agora - inicio) / DURACAO_CONTAGEM, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setContagem(pctEmLinha * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anim, pctEmLinha]);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Em Linha × Fora de Linha
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto="Comparativo entre itens em linha (ativos) e fora de linha (descontinuados). Inclui itens, saldo, valor em estoque, reservas e massa. Fonte: planilha 'Estoque Em Linha x Fora de Linha'. Atualizado em 24/09/2026."
        />
      </div>

      {/* Anel circular — % em linha sobre o total */}
      <div className="video-pop relative mt-2 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="size-28 sm:size-32">
          <circle cx="100" cy="100" r={R} fill="none" strokeWidth="16" className="stroke-white/15" />
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            strokeWidth="16"
            strokeLinecap="round"
            stroke="white"
            transform="rotate(-90 100 100)"
            style={{
              strokeDasharray: CIRC,
              strokeDashoffset: anim ? CIRC * (1 - pctEmLinha / 100) : CIRC,
              transition: "stroke-dashoffset 1.3s cubic-bezier(0.22,1,0.36,1)",
              filter: "drop-shadow(0 0 8px rgba(255,255,255,0.35))",
            }}
          />
        </svg>
        <div className="absolute text-center">
          <p className="font-serif text-2xl text-white">{fmtBrMax(contagem, 1)}%</p>
          <p className="text-[8px] font-bold tracking-widest text-white/55 uppercase">em linha</p>
        </div>
      </div>

      {/* Resumo — indicadores em duas colunas */}
      <div className="video-sobe mt-3 w-full max-w-xs mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Resumo
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Indicador</th>
              <th className="pb-0.5 text-right font-bold">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/10">
              <td className="py-0.5 text-white/80">Itens em linha</td>
              <td className="py-0.5 text-right font-mono font-semibold text-emerald-400">
                {fmtInt(posicaoEmLinha.itens)}
              </td>
            </tr>
            <tr className="border-b border-white/10">
              <td className="py-0.5 text-white/80">Itens fora de linha</td>
              <td className="py-0.5 text-right font-mono font-semibold text-brand-amber">
                {fmtInt(posicaoFora.itens)}
              </td>
            </tr>
            <tr className="border-b border-white/10">
              <td className="py-0.5 text-white/80">Valor em linha</td>
              <td className="py-0.5 text-right font-mono font-semibold text-white/80">
                {fmtMoeda(posicaoEmLinha.valorEstoque)}
              </td>
            </tr>
            <tr className="border-b border-white/10">
              <td className="py-0.5 text-white/80">Valor fora de linha</td>
              <td className="py-0.5 text-right font-mono font-semibold text-brand-amber">
                {fmtMoeda(posicaoFora.valorEstoque)}
              </td>
            </tr>
            <tr className="border-b border-white/10">
              <td className="py-0.5 text-white/80">Massa em linha</td>
              <td className="py-0.5 text-right font-mono font-semibold text-white/80">
                {fmtBrMax(posicaoEmLinha.pesoTon, 1)} t
              </td>
            </tr>
            <tr className="border-b border-white/10 last:border-0">
              <td className="py-0.5 text-white/80">Massa fora de linha</td>
              <td className="py-0.5 text-right font-mono font-semibold text-brand-amber">
                {fmtBrMax(posicaoFora.pesoTon, 1)} t
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * % em linha = valor em linha ÷ valor total × 100. {fmtPct(pctEmLinha / 100)} em linha · {fmtPct(pctFora / 100)} fora de linha.
        </p>
      </div>
    </div>
  );
}
