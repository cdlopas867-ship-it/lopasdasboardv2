import { useEffect, useMemo, useState, useCallback } from "react";
import type { VideoKpi, VideoUnidade, VideoOcupacao, VideoMes, VideoAvarias, VideoPendentes, VideoReservados } from "./VideoResumoDashboard";
import type { VideoForaDeLinha } from "./CenasApresentacao";
import { fmtBr, fmtInt, fmtTonDec, fmtBrMax } from "@/lib/format";

type Resumo = { valor: number; previsto: number; ton: number; saldo: number; itens: number };

/** Um segmento de mensagem: texto comum ou número em destaque. */
type Segmento = { t: string; n?: boolean };
type Mensagem = Segmento[];

type Props = {
  resumo?: Resumo | null;
  kpis: VideoKpi[];
  unidades: VideoUnidade[];
  ocupacao: VideoOcupacao;
  semana: { rotulo: string; total: string; dias: { dia: string; ton: number; meta: number }[] } | null;
  mensal?: VideoMes[];
  avarias?: VideoAvarias;
  pendentes?: VideoPendentes;
  reservados?: VideoReservados;
  foraDeLinha?: VideoForaDeLinha | null;
  valorFaturado?: number;
  onConcluir: () => void;
};

/** Envolve número em um segmento de destaque. */
const num = (v: number | string): Segmento => ({ t: String(v), n: true });
const txt = (s: string): Segmento => ({ t: s });

/** Constrói as frases interpretando todos os dados do estoque. */
function construirMensagens(p: Props): Mensagem[] {
  const msgs: Mensagem[] = [];
  const { resumo, ocupacao, unidades, semana, mensal, avarias, pendentes, reservados, foraDeLinha, valorFaturado } = p;

  // 1 — Saudação
  msgs.push([txt("Olá, seja bem-vindo ao painel do estoque Lopas.")]);

  // 2 — Massa total e valor
  if (resumo) {
    msgs.push([
      txt("Nosso estoque hoje soma "), num(fmtTonDec(resumo.ton)),
      txt(", com "), num(`R$ ${fmtBr(resumo.valor / 1e6, 2)} mi`),
      txt(" investidos em mercadoria."),
    ]);
    msgs.push([
      txt("São "), num(fmtInt(resumo.saldo)), txt(" peças distribuídas em "),
      num(fmtInt(resumo.itens)), txt(" itens ativos do catálogo do CD."),
    ]);
  }

  // 3 — Ocupação
  const pctTxt = `${fmtBr(ocupacao.pct * 100, 1)}%`;
  msgs.push([
    txt("A ocupação do CD está em "), num(pctTxt),
    txt(" — "), num(fmtInt(ocupacao.ocupados)), txt(" endereços ocupados de "),
    num(fmtInt(ocupacao.ocupados + ocupacao.livres)), txt(" posições totais."),
  ]);

  // 4 — Em linha vs Fora de linha
  if (foraDeLinha) {
    const em = foraDeLinha.posicaoEmLinha;
    const fora = foraDeLinha.posicaoForaDeLinha;
    msgs.push([
      txt("Em linha: "), num(fmtTonDec(em.pesoTon)), txt(" em "),
      num(fmtInt(em.itens)), txt(" itens ativos — a espinha dorsal do CD."),
    ]);
    msgs.push([
      txt("Fora de linha: "), num(fmtTonDec(fora.pesoTon)), txt(" em "),
      num(fmtInt(fora.itens)), txt(" itens — Opportunity de revisão para giro ou baixa."),
    ]);
  }

  // 5 — Recebimento da semana
  if (semana) {
    const aceitos = semana.dias.filter((d) => d.ton >= d.meta).length;
    const tonSemana = semana.dias.reduce((s, d) => s + d.ton, 0);
    msgs.push([
      txt("Na última semana recebemos "), num(fmtTonDec(tonSemana)),
      txt(", com "), num(aceitos), txt(" de "), num(semana.dias.length),
      txt(" dias batendo a meta de recebimento."),
    ]);
  }

  // 6 — Recebido vs carregado (mensal)
  if (mensal?.length) {
    const totRec = mensal.reduce((s, m) => s + m.recebido, 0);
    const totCar = mensal.reduce((s, m) => s + m.carregado, 0);
    const eficiencia = fmtBrMax((totCar / Math.max(totRec, 1)) * 100, 1);
    msgs.push([
      txt("De "), num(fmtTonDec(totRec)), txt(" recebidas este ano, "),
      num(fmtTonDec(totCar)), txt(" já foram carregadas — "),
      num(`${eficiencia}%`), txt(" de eficiência no fluxo."),
    ]);
  }

  // 7 — Estoque reservado
  if (reservados) {
    msgs.push([
      txt("Estoque reservado: "), num(fmtTonDec(reservados.totalTon)),
      txt(" em "), num(fmtInt(reservados.totalQtd)), txt(" peças — "),
      num(`R$ ${fmtBr(reservados.totalValor / 1e6, 2)} mi`),
      txt(" comprometidos em vendas futuras."),
    ]);
  }

  // 8 — Avarias
  if (avarias?.total) {
    msgs.push([
      txt("Avarias registradas: "), num(fmtInt(avarias.total)),
      txt(" volumes acumulados no ano"),
      avarias.custo ? [txt(" — custo estimado de "), num(avarias.custo)] : [],
    ].flat() as Mensagem);
  }

  // 9 — Pendentes
  if (pendentes?.itens) {
    msgs.push([
      txt("Pendentes de produção: "), num(fmtInt(pendentes.itens)),
      txt(" lotes somando "), num(fmtTonDec(pendentes.totalTon)),
      txt(" — média de "), num(fmtTonDec(pendentes.mediaTon)),
      txt(" por lote."),
    ]);
  }

  // 10 — Unidade destaque
  if (unidades.length) {
    const top = [...unidades].sort((a, b) => b.share - a.share)[0];
    msgs.push([
      txt("Guarda-Roupas lidera com "), num(`${fmtBr(top.share, 1)}%`),
      txt(" de participação, seguido por Salas e Complementos."),
    ]);
  }

  // 11 — Valor faturado
  if (valorFaturado) {
    msgs.push([
      txt("Já carregamos "), num(`R$ ${fmtBr(valorFaturado / 1e6, 2)} mi`),
      txt(" em faturamento — a engrenagem girando forte."),
    ]);
  }

  // 12 — Encerramento
  msgs.push([
    txt("Tudo pronto para acompanhar o painel. Bom trabalho."),
  ]);

  return msgs;
}

const TEMPO_POR_MSG = 4600;

export default function IntroTexto(props: Props) {
  const mensagens = useMemo(
    () => construirMensagens(props),
    [props],
  );

  const [idx, setIdx] = useState(0);
  const [visivel, setVisivel] = useState(true);

  const concluir = useCallback(() => props.onConcluir(), [props]);

  // Avança as mensagens com fade suave.
  useEffect(() => {
    if (idx >= mensagens.length) return;
    setVisivel(true);
    const tOut = setTimeout(() => setVisivel(false), TEMPO_POR_MSG - 700);
    const tNext = setTimeout(() => setIdx((i) => i + 1), TEMPO_POR_MSG);
    return () => { clearTimeout(tOut); clearTimeout(tNext); };
  }, [idx, mensagens.length]);

  // Quando chega ao fim, conclui.
  useEffect(() => {
    if (idx >= mensagens.length) {
      const t = setTimeout(concluir, 600);
      return () => clearTimeout(t);
    }
  }, [idx, mensagens.length, concluir]);

  const pular = useCallback(() => concluir(), [concluir]);
  const msg = mensagens[Math.min(idx, mensagens.length - 1)] ?? [];

  return (
    <div
      role="dialog"
      aria-label="Resumo de boas-vindas"
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Fundo */}
      <div
        className="video-kenburns absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/fundo-satelite-real.jpg?v=1)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#4a6b20]/82 via-[#3a521a]/68 to-[#2e3f14]/92" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.45)_100%)]" />

      {/* Botão Pular */}
      <button
        type="button"
        onClick={pular}
        className="absolute top-4 right-4 z-20 cursor-pointer rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/20 sm:top-6 sm:right-6"
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
          className="flex items-center justify-center text-center transition-all duration-700 ease-out"
          style={{
            opacity: visivel ? 1 : 0,
            transform: visivel ? "translateY(0) scale(1)" : "translateY(-16px) scale(0.97)",
            filter: visivel ? "blur(0px)" : "blur(8px)",
          }}
        >
          <p className="font-serif italic text-xl leading-relaxed text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] sm:text-3xl sm:leading-relaxed">
            {msg.map((seg, i) =>
              seg.n ? (
                <span
                  key={i}
                  className="font-bold text-primary drop-shadow-[0_0_16px_rgba(142,181,90,0.5)] sm:text-4xl"
                >
                  {seg.t}
                </span>
              ) : (
                <span key={i}>{seg.t}</span>
              ),
            )}
          </p>
        </div>

        <p className="mt-10 font-mono text-[9px] tracking-widest text-white/40 uppercase italic">
          {Math.min(idx + 1, mensagens.length)} / {mensagens.length}
        </p>
      </div>
    </div>
  );
}
