/* Cena Resumo Total — visão consolidada do estoque com peso, valor,
   previsto, reservado e disponível. Usa os dados de posição (em linha ×
   fora de linha) e o resumo geral do sync. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtMoeda, fmtTonDec } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import {
  POSICAO_EM_LINHA,
  POSICAO_TOTAL,
  type PosicaoEstoque,
} from "@/data/fora-de-linha";

export type ResumoTotalProp = {
  valor: number;
  previsto: number;
  ton: number;
  saldo: number;
  itens: number;
} | null;

type Props = {
  anim: boolean;
  resumo?: ResumoTotalProp | null;
  foraDeLinha?: {
    posicaoTotal: PosicaoEstoque;
    posicaoEmLinha: PosicaoEstoque;
  } | null;
  onPausar?: () => void;
};

type Metrica = {
  rotulo: string;
  valor: string;
  cor: string;
};

export default function CenaResumoTotal({ anim, resumo, foraDeLinha, onPausar }: Props) {
  const posTotal = foraDeLinha?.posicaoTotal ?? POSICAO_TOTAL;
  const posEmLinha = foraDeLinha?.posicaoEmLinha ?? POSICAO_EM_LINHA;
  const previsto = resumo?.previsto ?? 0;

  const valorTotal = posTotal.valorEstoque;
  const valorReservado = posTotal.valorReservado;
  const valorDisponivel = valorTotal - valorReservado;
  const pesoTotal = posTotal.pesoTon;
  const pesoReservado = posTotal.pesoReservadoTon;
  const pesoDisponivel = pesoTotal - pesoReservado;
  const pesoEmLinha = posEmLinha.pesoTon;

  const metricas: Metrica[] = [
    { rotulo: "Peso em estoque", valor: fmtTonDec(pesoTotal), cor: "#e2e8f0" },
    { rotulo: "Peso em linha", valor: fmtTonDec(pesoEmLinha), cor: "#34d399" },
    { rotulo: "Valor total", valor: fmtMoeda(valorTotal), cor: "#e2e8f0" },
    { rotulo: "Valor previsto", valor: fmtMoeda(previsto), cor: "#fbbf24" },
    { rotulo: "Valor reservado", valor: fmtMoeda(valorReservado), cor: "#f87171" },
    { rotulo: "Peso reservado", valor: fmtTonDec(pesoReservado), cor: "#f87171" },
    { rotulo: "Valor disponível", valor: fmtMoeda(valorDisponivel), cor: "#60a5fa" },
    { rotulo: "Peso disponível", valor: fmtTonDec(pesoDisponivel), cor: "#60a5fa" },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-[10px] font-semibold tracking-[0.3em] text-white/70 uppercase">
          Resumo Total do Estoque
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto="Visão consolidada do estoque: peso total, peso em linha, valor total, valor previsto, valor e peso reservados, valor e peso disponíveis. Valor previsto = potencial de venda do estoque. Disponível = total − reservado. Fonte: planilha de saldo de itens e Em Linha × Fora de Linha do Drive."
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-2.5">
        {metricas.map((m, i) => (
          <div
            key={m.rotulo}
            className="video-sobe group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/[0.07]"
            style={{ animationDelay: `${0.08 * i}s` }}
          >
            {/* Acento de cor superior */}
            <div
              className="absolute inset-x-0 top-0 h-px opacity-60"
              style={{ background: `linear-gradient(90deg, transparent, ${m.cor}, transparent)` }}
            />
            <p className="text-[8.5px] font-medium tracking-[0.18em] text-white/45 uppercase">
              {m.rotulo}
            </p>
            <p
              className="mt-1.5 text-base font-semibold tabular-nums tracking-tight sm:text-lg"
              style={{ color: m.cor }}
            >
              {m.valor}
            </p>
          </div>
        ))}
      </div>

      {/* Barra de proporção reservado × disponível */}
      <div className="video-sobe mt-3.5" style={{ animationDelay: "0.7s" }}>
        <div className="flex h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className={cn("video-barra-x h-full rounded-l-full", !anim && "video-pausada")}
            style={{ width: `${(valorReservado / valorTotal) * 100}%`, background: "linear-gradient(90deg, #ef4444, #f87171)", animationDelay: "0.75s" }}
          />
          <div
            className={cn("video-barra-x h-full rounded-r-full", !anim && "video-pausada")}
            style={{ width: `${(valorDisponivel / valorTotal) * 100}%`, background: "linear-gradient(90deg, #3b82f6, #60a5fa)", animationDelay: "0.8s" }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] font-medium text-white/40">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-red-400" />
            {fmtBrMax((valorReservado / valorTotal) * 100, 1)}% reservado
          </span>
          <span className="flex items-center gap-1.5">
            {fmtBrMax((valorDisponivel / valorTotal) * 100, 1)}% disponível
            <span className="size-1.5 rounded-full bg-blue-400" />
          </span>
        </div>
      </div>
    </div>
  );
}
