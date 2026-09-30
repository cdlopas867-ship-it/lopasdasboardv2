/* Cena Em Linha × Fora de Linha — comparação lado a lado da posição de estoque
   dos itens ativos (em linha) vs. descontinuados (fora de linha), com peso
   tonelada, reservados, disponível e valor de cada grupo. */

import { cn } from "@/lib/utils";
import { fmtInt, fmtMoeda, fmtPct, fmtTonDec } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import {
  POSICAO_EM_LINHA,
  POSICAO_FORA_DE_LINHA,
  POSICAO_TOTAL,
  type PosicaoEstoque,
} from "@/data/fora-de-linha";

type PropsForaDeLinha = {
  posicaoEmLinha: PosicaoEstoque;
  posicaoForaDeLinha: PosicaoEstoque;
  posicaoTotal: PosicaoEstoque;
} | null;

type Lado = {
  nome: string;
  cor: string;
  pos: PosicaoEstoque;
};

export default function CenaEmLinhaVsForaDeLinha({
  anim,
  foraDeLinha,
  onPausar,
}: {
  anim: boolean;
  foraDeLinha?: PropsForaDeLinha | null;
  onPausar?: () => void;
}) {
  const emLinha = foraDeLinha?.posicaoEmLinha ?? POSICAO_EM_LINHA;
  const fora = foraDeLinha?.posicaoForaDeLinha ?? POSICAO_FORA_DE_LINHA;
  const total = foraDeLinha?.posicaoTotal ?? POSICAO_TOTAL;

  const lados: Lado[] = [
    { nome: "Em Linha", cor: "#7ec896", pos: emLinha },
    { nome: "Fora de Linha", cor: "#fbbf24", pos: fora },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Em Linha × Fora de Linha
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto="Comparação da posição de estoque entre itens ativos (em linha) e descontinuados (fora de linha). Peso, reservados, disponível e valor de cada grupo. Fonte: planilha 'Estoque Em Linha x Fora de Linha'. Atualizado em 24/09/2026."
        />
      </div>

      {/* Cards lado a lado */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
        {lados.map((l, i) => {
          const pctValor = l.pos.valorEstoque / total.valorEstoque;
          const pctPeso = l.pos.pesoTon / total.pesoTon;
          return (
            <div
              key={l.nome}
              className="video-sobe rounded-xl border bg-white/5 p-3 sm:p-4"
              style={{ borderColor: `${l.cor}55`, animationDelay: `${0.15 * (i + 1)}s` }}
            >
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: l.cor }} />
                <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: l.cor }}>
                  {l.nome}
                </p>
              </div>

              {/* Destaque: peso tonelada */}
              <p className="mt-1.5 font-serif text-2xl text-white sm:text-3xl">
                {fmtTonDec(l.pos.pesoTon)}
              </p>
              <p className="text-[9px] font-bold tracking-widest text-white/45 uppercase">peso total</p>

              {/* Métricas */}
              <dl className="mt-3 space-y-1.5 text-[11px]">
                <Linha rotulo="Itens" valor={fmtInt(l.pos.itens)} />
                <Linha rotulo="Disponível" valor={`${fmtInt(l.pos.disponivel)} un`} />
                <Linha rotulo="Reservados" valor={`${fmtInt(l.pos.reservas)} un`} />
                <Linha rotulo="Peso reserv." valor={fmtTonDec(l.pos.pesoReservadoTon)} />
                <Linha rotulo="Valor" valor={fmtMoeda(l.pos.valorEstoque)} destaque />
              </dl>

              {/* Participação no total */}
              <div className="mt-3 space-y-1.5">
                <BarraShare
                  rotulo="% do valor"
                  pct={pctValor}
                  cor={l.cor}
                  anim={anim}
                  delay={0.4 + 0.1 * i}
                />
                <BarraShare
                  rotulo="% do peso"
                  pct={pctPeso}
                  cor={l.cor}
                  anim={anim}
                  delay={0.5 + 0.1 * i}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total geral */}
      <div
        className="video-sobe mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 rounded-xl border border-white/20 bg-white/5 px-3 py-2"
        style={{ animationDelay: "0.6s" }}
      >
        <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase">Total geral</p>
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-0.5 text-[11px]">
          <Metrica rotulo="Itens" valor={fmtInt(total.itens)} />
          <Metrica rotulo="Peso" valor={fmtTonDec(total.pesoTon)} />
          <Metrica rotulo="Disponível" valor={`${fmtInt(total.disponivel)} un`} />
          <Metrica rotulo="Reservados" valor={`${fmtInt(total.reservas)} un`} />
          <Metrica rotulo="Valor" valor={fmtMoeda(total.valorEstoque)} destaque />
        </div>
      </div>
    </div>
  );
}

function Linha({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b border-white/10 pb-1 last:border-0 last:pb-0">
      <dt className="text-white/50">{rotulo}</dt>
      <dd className={cn("font-mono font-semibold", destaque ? "text-white" : "text-white/85")}>{valor}</dd>
    </div>
  );
}

function BarraShare({
  rotulo,
  pct,
  cor,
  anim,
  delay,
}: {
  rotulo: string;
  pct: number;
  cor: string;
  anim: boolean;
  delay: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-[9px] font-bold tracking-widest text-white/55 uppercase">
        <span>{rotulo}</span>
        <span className="font-mono" style={{ color: cor }}>
          {fmtPct(pct)}
        </span>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div
          className={cn("video-barra-x h-full rounded-full", !anim && "video-pausada")}
          style={{ width: `${pct * 100}%`, background: cor, animationDelay: `${delay}s` }}
        />
      </div>
    </div>
  );
}

function Metrica({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-white/45">{rotulo}:</span>
      <span className={cn("font-mono font-semibold", destaque ? "text-white" : "text-white/80")}>{valor}</span>
    </span>
  );
}
