/* Cena Fora de Linha — comparativo interativo Em Linha × Fora de Linha.
   Widget de dados cruzados: clique numa seção para destacar seus indicadores
   e mudar a cor do anel (ciano = em linha, âmbar = fora de linha). */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtInt, fmtMoeda, fmtPct, fmtBrMax } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import {
  POSICAO_EM_LINHA,
  POSICAO_FORA_DE_LINHA,
  POSICAO_TOTAL,
  type PosicaoEstoque,
} from "@/data/fora-de-linha";

export type ForaDeLinhaProp = {
  itens: unknown[];
  posicaoEmLinha: PosicaoEstoque;
  posicaoForaDeLinha: PosicaoEstoque;
  posicaoTotal: PosicaoEstoque;
} | null;

const R = 84;
const CIRC = 2 * Math.PI * R;
const DURACAO_CONTAGEM = 1300;

/* Cores do tema interativo — ciano para em linha, âmbar para fora de linha */
const COR_EM_LINHA = "#00FFCC";
const COR_FORA = "#FFA500";

type Foco = "emLinha" | "foraDeLinha";

type LinhaTabela = {
  grupo: Foco;
  rotulo: string;
  valor: string;
};

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

  const [foco, setFoco] = useState<Foco>("emLinha");

  const pctAtiva = foco === "emLinha" ? pctEmLinha : pctFora;
  const corAtiva = foco === "emLinha" ? COR_EM_LINHA : COR_FORA;

  /* Contagem animada de 0 até o valor da % ativa */
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
      setContagem(pctAtiva * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anim, pctAtiva]);

  /* Linhas da tabela — dados cruzados de ambas as posições */
  const linhas: LinhaTabela[] = [
    { grupo: "emLinha", rotulo: "Em linha · itens", valor: fmtInt(posicaoEmLinha.itens) },
    { grupo: "emLinha", rotulo: "Em linha · saldo", valor: fmtInt(posicaoEmLinha.saldoFocco) },
    { grupo: "emLinha", rotulo: "Em linha · reservados qtd", valor: fmtInt(posicaoEmLinha.reservas) },
    { grupo: "emLinha", rotulo: "Em linha · reservados ton", valor: `${fmtBrMax(posicaoEmLinha.pesoReservadoTon, 1)} t` },
    { grupo: "emLinha", rotulo: "Em linha · reservados R$", valor: fmtMoeda(posicaoEmLinha.valorReservado) },
    { grupo: "emLinha", rotulo: "Em linha · tonelagem", valor: `${fmtBrMax(posicaoEmLinha.pesoTon, 1)} t` },
    { grupo: "emLinha", rotulo: "Em linha · valor", valor: fmtMoeda(posicaoEmLinha.valorEstoque) },
    { grupo: "foraDeLinha", rotulo: "Fora de linha · itens", valor: fmtInt(posicaoFora.itens) },
    { grupo: "foraDeLinha", rotulo: "Fora de linha · saldo", valor: fmtInt(posicaoFora.saldoFocco) },
    { grupo: "foraDeLinha", rotulo: "Fora de linha · reservados qtd", valor: fmtInt(posicaoFora.reservas) },
    { grupo: "foraDeLinha", rotulo: "Fora de linha · reservados ton", valor: `${fmtBrMax(posicaoFora.pesoReservadoTon, 1)} t` },
    { grupo: "foraDeLinha", rotulo: "Fora de linha · reservados R$", valor: fmtMoeda(posicaoFora.valorReservado) },
    { grupo: "foraDeLinha", rotulo: "Fora de linha · tonelagem", valor: `${fmtBrMax(posicaoFora.pesoTon, 1)} t` },
    { grupo: "foraDeLinha", rotulo: "Fora de linha · valor", valor: fmtMoeda(posicaoFora.valorEstoque) },
  ];

  const dataSinc = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

  return (
    <div className="flex w-full flex-col items-center">
      {/* Cabeçalho — título + pílula SINCRONIZADO */}
      <div className="flex w-full max-w-sm items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
            Em Linha × Fora de Linha
          </p>
          <InfoTooltip
            onOpen={onPausar}
            texto="Comparativo entre itens em linha (ativos) e fora de linha (descontinuados). Clique numa seção para destacar seus indicadores. Inclui itens, saldo, valor em estoque, reservas e massa. Fonte: planilha 'Estoque Em Linha x Fora de Linha'."
          />
        </div>
        <span className="video-sobe inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[8px] font-bold tracking-widest text-white/60 uppercase backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          Sincronizado {dataSinc}
        </span>
      </div>

      {/* Anel circular interativo — cor muda conforme a seção ativa */}
      <button
        type="button"
        onClick={() => setFoco((f) => (f === "emLinha" ? "foraDeLinha" : "emLinha"))}
        className="video-pop group relative mt-3 flex items-center justify-center cursor-pointer"
        aria-label="Alternar Em Linha / Fora de Linha"
      >
        <svg viewBox="0 0 200 200" className="size-28 sm:size-32 transition-transform group-hover:scale-105">
          <circle cx="100" cy="100" r={R} fill="none" strokeWidth="16" className="stroke-white/15" />
          {/* Anel da seção inativa (fundo) */}
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            strokeWidth="16"
            strokeLinecap="round"
            stroke={foco === "emLinha" ? COR_FORA : COR_EM_LINHA}
            strokeOpacity={0.2}
            transform="rotate(-90 100 100)"
            style={{
              strokeDasharray: CIRC,
              strokeDashoffset: anim ? CIRC * (1 - (foco === "emLinha" ? pctFora : pctEmLinha) / 100) : CIRC,
              transition: "stroke-dashoffset 1.3s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
          {/* Anel da seção ativa */}
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            strokeWidth="16"
            strokeLinecap="round"
            stroke={corAtiva}
            transform="rotate(-90 100 100)"
            style={{
              strokeDasharray: CIRC,
              strokeDashoffset: anim ? CIRC * (1 - pctAtiva / 100) : CIRC,
              transition: "stroke-dashoffset 1.3s cubic-bezier(0.22,1,0.36,1), stroke 0.4s ease",
              filter: `drop-shadow(0 0 8px ${corAtiva}55)`,
            }}
          />
        </svg>
        <div className="absolute text-center pointer-events-none">
          <p className="font-serif text-2xl text-white" style={{ textShadow: `0 0 12px ${corAtiva}44` }}>
            {fmtBrMax(contagem, 1)}%
          </p>
          <p className="text-[8px] font-bold tracking-widest uppercase" style={{ color: corAtiva }}>
            {foco === "emLinha" ? "em linha" : "fora de linha"}
          </p>
        </div>
      </button>

      {/* Botões de seleção — Em Linha / Fora de Linha */}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFoco("emLinha")}
          className={cn(
            "rounded-full px-3 py-1 text-[9px] font-bold tracking-widest uppercase transition-all duration-300",
            foco === "emLinha"
              ? "text-brand-dark"
              : "text-white/50 border border-white/15 hover:text-white/80",
          )}
          style={foco === "emLinha" ? { background: COR_EM_LINHA } : undefined}
        >
          Em Linha
        </button>
        <button
          type="button"
          onClick={() => setFoco("foraDeLinha")}
          className={cn(
            "rounded-full px-3 py-1 text-[9px] font-bold tracking-widest uppercase transition-all duration-300",
            foco === "foraDeLinha"
              ? "text-brand-dark"
              : "text-white/50 border border-white/15 hover:text-white/80",
          )}
          style={foco === "foraDeLinha" ? { background: COR_FORA } : undefined}
        >
          Fora de Linha
        </button>
      </div>

      {/* Tabela — Resumo do estoque com destaque interativo */}
      <div className="video-sobe mt-3 w-full max-w-sm mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Resumo do estoque
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Indicador</th>
              <th className="pb-0.5 text-right font-bold">Valor</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, i) => {
              const ativa = linha.grupo === foco;
              const cor = linha.grupo === "emLinha" ? COR_EM_LINHA : COR_FORA;
              return (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-white/10 transition-all duration-300",
                    i === linhas.length - 1 && "last:border-0",
                    ativa ? "bg-white/[0.04]" : "opacity-35",
                  )}
                >
                  <td
                    className={cn("py-0.5 transition-colors", ativa ? "" : "")}
                    style={ativa ? { color: cor } : undefined}
                  >
                    {linha.rotulo}
                  </td>
                  <td
                    className="py-0.5 text-right font-mono font-semibold transition-colors"
                    style={ativa ? { color: cor } : undefined}
                  >
                    {linha.valor}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * % em linha = valor em linha ÷ valor total × 100. {fmtPct(pctEmLinha / 100)} em linha · {fmtPct(pctFora / 100)} fora de linha. Clique para alternar.
        </p>
      </div>
    </div>
  );
}
