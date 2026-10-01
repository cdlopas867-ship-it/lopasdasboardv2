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
    { rotulo: "Peso em estoque", valor: fmtTonDec(pesoTotal) },
    { rotulo: "Peso em linha", valor: fmtTonDec(pesoEmLinha) },
    { rotulo: "Valor total", valor: fmtMoeda(valorTotal) },
    { rotulo: "Valor previsto", valor: fmtMoeda(previsto) },
    { rotulo: "Valor reservado", valor: fmtMoeda(valorReservado) },
    { rotulo: "Peso reservado", valor: fmtTonDec(pesoReservado) },
    { rotulo: "Valor disponível", valor: fmtMoeda(valorDisponivel) },
    { rotulo: "Peso disponível", valor: fmtTonDec(pesoDisponivel) },
  ];

  return (
    <div className="w-full">
      {/* Cabeçalho */}
      <div className="video-sobe flex items-center gap-2">
        <p className="text-[10px] font-semibold tracking-[0.3em] text-white/70 uppercase">
          Resumo Total do Estoque
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto="Visão consolidada do estoque: peso total, peso em linha, valor total, valor previsto, valor e peso reservados, valor e peso disponíveis. Valor previsto = potencial de venda do estoque. Disponível = total − reservado. Fonte: planilha de saldo de itens e Em Linha × Fora de Linha do Drive."
        />
      </div>

      {/* Card único glassmorphism */}
      <div
        className="video-sobe mt-3 overflow-hidden rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-xl"
        style={{ animationDelay: "0.1s" }}
      >
        {/* Valor principal em destaque */}
        <div className="px-5 pt-5 pb-4 text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {fmtMoeda(valorTotal)}
            </span>
          </div>
          <p className="mt-1.5 text-[9px] font-medium tracking-[0.25em] text-[#98c679] uppercase">
            Valor em Estoque
          </p>
          <p className="mx-auto mt-2 max-w-[14rem] text-center text-[10px] leading-relaxed text-white/55">
            De {fmtTonDec(pesoTotal)}, {fmtTonDec(pesoEmLinha)} estão em linha de produção.
            {fmtTonDec(pesoReservado)} reservados e {fmtTonDec(pesoDisponivel)} disponíveis.
          </p>
        </div>

        {/* Lista de métricas */}
        <div className="border-t border-white/10">
          {metricas.map((m, i) => (
            <div
              key={m.rotulo}
              className="video-sobe flex items-center justify-between px-5 py-2.5"
              style={{ animationDelay: `${0.15 + 0.06 * i}s` }}
            >
              <span className="text-[10px] font-medium tracking-wide text-white/55 uppercase">
                {m.rotulo}
              </span>
              <span className="text-[13px] font-semibold tabular-nums text-white">
                {m.valor}
              </span>
            </div>
          ))}
        </div>
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
