import { useEffect, useMemo, useState, useCallback } from "react";
import type { VideoKpi, VideoUnidade, VideoOcupacao, VideoMes } from "./VideoResumoDashboard";
import type { VideoForaDeLinha } from "./CenasApresentacao";
import { fmtBr, fmtInt } from "@/lib/format";
import { fmtTonDec } from "@/lib/format";

type Resumo = { valor: number; previsto: number; ton: number; saldo: number; itens: number };

type Props = {
  resumo?: Resumo | null;
  kpis: VideoKpi[];
  unidades: VideoUnidade[];
  ocupacao: VideoOcupacao;
  semana: { rotulo: string; total: string; dias: { dia: string; ton: number; meta: number }[] } | null;
  mensal?: VideoMes[];
  foraDeLinha?: VideoForaDeLinha | null;
  valorFaturado?: number;
  onConcluir: () => void;
};

/** Constrói as frases de boas-vindas interpretando os dados do estoque. */
function construirMensagens(p: {
  resumo?: Resumo | null;
  kpis: VideoKpi[];
  unidades: VideoUnidade[];
  ocupacao: VideoOcupacao;
  semana: Props["semana"];
  mensal?: VideoMes[];
  valorFaturado?: number;
}): string[] {
  const msgs: string[] = [];
  const { resumo, ocupacao, unidades, semana, mensal, valorFaturado } = p;

  // 1 — Saudação
  msgs.push("Olá! Seja bem-vindo ao painel do estoque Lopas 🌿");

  // 2 — Massa total e valor
  if (resumo) {
    const tom = fmtTonDec(resumo.ton);
    const valorMi = fmtBr(resumo.valor / 1e6, 2);
    msgs.push(`Nosso estoque hoje soma ${tom}, com valor de R$ ${valorMi} milhões investidos em mercadoria.`);

    const saldoTxt = fmtInt(resumo.saldo);
    msgs.push(`São ${saldoTxt} peças distribuídas em ${resumo.itens} itens ativos do catálogo do CD.`);
  }

  // 3 — Ocupação
  const pctTxt = `${fmtBr(ocupacao.pct * 100, 1)}%`;
  msgs.push(
    `A ocupação do CD está em ${pctTxt} — ${fmtInt(ocupacao.ocupados)} endereços ocupados de ${fmtInt(ocupacao.ocupados + ocupacao.livres)} posições totais.`,
  );

  // 4 — Recebimento da semana
  if (semana) {
    const aceitos = semana.dias.filter((d) => d.ton >= d.meta).length;
    msgs.push(`Na última semana recebemos ${semana.total}, com ${aceitos} dias batendo a meta de recebimento.`);
  }

  // 5 — Unidade destaque
  if (unidades.length) {
    const top = [...unidades].sort((a, b) => b.share - a.share)[0];
    msgs.push(`${top.nome} lidera o estoque com ${fmtBr(top.share, 1)}% de participação, seguido pelas demais unidades do CD.`);
  }

  // 6 — Recebido vs carregado (mensal)
  if (mensal?.length) {
    const totRec = mensal.reduce((s, m) => s + m.recebido, 0);
    const totCar = mensal.reduce((s, m) => s + m.carregado, 0);
    msgs.push(
      `De ${fmtTonDec(totRec)} recebidas este ano, ${fmtTonDec(totCar)} já foram carregadas — ${fmtBr((totCar / Math.max(totRec, 1)) * 100, 1)}% de eficiência no fluxo.`,
    );
  }

  // 7 — Valor faturado (se disponível)
  if (valorFaturado) {
    msgs.push(`Já carregamos R$ ${fmtBr(valorFaturado / 1e6, 2)} milhões em faturamento — a engrenagem girando forte! 🚀`);
  }

  // 8 — Encerramento
  msgs.push("Tudo pronto para você acompanhar o painel. Bom trabalho e mãos à obra! 👋");

  return msgs;
}

const TEMPO_POR_MSG = 4200; // ms cada frase fica em tela

export default function IntroTexto(props: Props) {
  const mensagens = useMemo(
    () => construirMensagens(props),
    [props.resumo, props.kpis, props.unidades, props.ocupacao, props.semana, props.mensal, props.valorFaturado],
  );

  const [idx, setIdx] = useState(0);
  const [visivel, setVisivel] = useState(true);

  const concluir = useCallback(() => props.onConcluir(), [props]);

  // Avança as mensagens automaticamente com fade.
  useEffect(() => {
    if (idx >= mensagens.length) return;

    // Fade-in
    setVisivel(true);
    const tOut = setTimeout(() => setVisivel(false), TEMPO_POR_MSG - 600);
    const tNext = setTimeout(() => setIdx((i) => i + 1), TEMPO_POR_MSG);

    return () => {
      clearTimeout(tOut);
      clearTimeout(tNext);
    };
  }, [idx, mensagens.length]);

  // Quando chega ao fim, conclui.
  useEffect(() => {
    if (idx >= mensagens.length) {
      const t = setTimeout(concluir, 500);
      return () => clearTimeout(t);
    }
  }, [idx, mensagens.length, concluir]);

  const pular = useCallback(() => concluir(), [concluir]);

  const progresso = Math.min((idx / mensagens.length) * 100, 100);
  const texto = mensagens[Math.min(idx, mensagens.length - 1)];

  return (
    <div
      role="dialog"
      aria-label="Resumo de boas-vindas"
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Fundo da marca */}
      <div
        className="video-kenburns absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/fundo-satelite-real.jpg?v=1)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#4a6b20]/80 via-[#3a521a]/65 to-[#2e3f14]/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      {/* Botão Pular */}
      <button
        type="button"
        onClick={pular}
        className="absolute top-4 right-4 z-20 cursor-pointer rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-sm transition-colors hover:bg-white/20 sm:top-6 sm:right-6"
      >
        Pular resumo
      </button>

      {/* Watermark */}
      <div className="pointer-events-none absolute bottom-6 left-4 z-[1] sm:bottom-10 sm:left-10">
        <p className="font-serif text-xs tracking-tight text-white/80 sm:text-lg">
          Controle de Estoque CD Lopas
        </p>
        <p className="mt-0.5 text-[8px] font-semibold tracking-[0.3em] text-primary uppercase sm:text-[11px]">
          Movidos pela fé
        </p>
      </div>

      {/* Mensagem central */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center px-6">
        <div
          className="flex items-center justify-center text-center transition-all duration-700 ease-in-out"
          style={{
            opacity: visivel ? 1 : 0,
            transform: visivel ? "translateY(0)" : "translateY(-12px)",
            filter: visivel ? "blur(0px)" : "blur(6px)",
          }}
        >
          <p className="font-serif text-xl leading-relaxed text-white drop-shadow-lg sm:text-3xl sm:leading-relaxed">
            {texto}
          </p>
        </div>

        {/* Barra de progresso */}
        <div className="mt-10 h-0.5 w-48 overflow-hidden rounded-full bg-white/15 sm:w-64">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${progresso}%` }}
          />
        </div>
        <p className="mt-3 font-mono text-[9px] font-bold tracking-widest text-white/40 uppercase">
          {Math.min(idx + 1, mensagens.length)} / {mensagens.length}
        </p>
      </div>
    </div>
  );
}
