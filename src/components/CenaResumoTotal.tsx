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
  unidade: string;
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
    { rotulo: "Peso em estoque", valor: fmtTonDec(pesoTotal), unidade: "t", cor: "#ffffff" },
    { rotulo: "Peso em linha", valor: fmtTonDec(pesoEmLinha), unidade: "t", cor: "#34d399" },
    { rotulo: "Valor total", valor: fmtMoeda(valorTotal), unidade: "R$", cor: "#ffffff" },
    { rotulo: "Valor previsto", valor: fmtMoeda(previsto), unidade: "R$", cor: "#fbbf24" },
    { rotulo: "Valor reservado", valor: fmtMoeda(valorReservado), unidade: "R$", cor: "#f87171" },
    { rotulo: "Peso reservado", valor: fmtTonDec(pesoReservado), unidade: "t", cor: "#f87171" },
    { rotulo: "Valor disponível", valor: fmtMoeda(valorDisponivel), unidade: "R$", cor: "#60a5fa" },
    { rotulo: "Peso disponível", valor: fmtTonDec(pesoDisponivel), unidade: "t", cor: "#60a5fa" },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Resumo Total do Estoque
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto="Visão consolidada do estoque: peso total, peso em linha, valor total, valor previsto, valor e peso reservados, valor e peso disponíveis. Valor previsto = potencial de venda do estoque. Disponível = total − reservado. Fonte: planilha de saldo de itens e Em Linha × Fora de Linha do Drive."
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
        {metricas.map((m, i) => (
          <div
            key={m.rotulo}
            className="video-sobe rounded-xl border border-white/15 bg-white/5 px-3 py-2.5"
            style={{ animationDelay: `${0.08 * i}s` }}
          >
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: m.cor }} />
              <p className="text-[9px] font-bold tracking-widest text-white/55 uppercase">
                {m.rotulo}
              </p>
            </div>
            <p className="mt-1 font-serif text-lg text-white sm:text-xl" style={{ color: m.cor }}>
              {m.valor}
            </p>
          </div>
        ))}
      </div>

      {/* Barra de proporção reservado × disponível */}
      <div className="video-sobe mt-3" style={{ animationDelay: "0.7s" }}>
        <div className="flex h-3 overflow-hidden rounded-full">
          <div
            className={cn("video-barra-x h-full", !anim && "video-pausada")}
            style={{ width: `${(valorReservado / valorTotal) * 100}%`, background: "#f87171", animationDelay: "0.75s" }}
          />
          <div
            className={cn("video-barra-x h-full", !anim && "video-pausada")}
            style={{ width: `${(valorDisponivel / valorTotal) * 100}%`, background: "#60a5fa", animationDelay: "0.8s" }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[9px] font-bold text-white/50">
          <span className="text-white">{fmtBrMax((valorReservado / valorTotal) * 100, 1)}% reservado</span>
          <span className="text-white">{fmtBrMax((valorDisponivel / valorTotal) * 100, 1)}% disponível</span>
        </div>
      </div>
    </div>
  );
}
