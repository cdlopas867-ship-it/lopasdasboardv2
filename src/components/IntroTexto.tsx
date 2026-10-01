import { useEffect, useState, useCallback } from "react";
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

/* ── Fallback estático (usado quando a IA não está disponível) ── */

function construirMensagens(p: Props): Mensagem[] {
  const msgs: Mensagem[] = [];
  const { resumo, ocupacao, unidades, semana, mensal, avarias, pendentes, reservados, foraDeLinha, valorFaturado } = p;

  msgs.push([txt("Olá, seja bem-vindo ao painel do estoque Lopas.")]);

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

  const pctTxt = `${fmtBr(ocupacao.pct * 100, 1)}%`;
  msgs.push([
    txt("A ocupação do CD está em "), num(pctTxt),
    txt(" — "), num(fmtInt(ocupacao.ocupados)), txt(" endereços ocupados de "),
    num(fmtInt(ocupacao.ocupados + ocupacao.livres)), txt(" posições totais."),
  ]);

  if (foraDeLinha) {
    const em = foraDeLinha.posicaoEmLinha;
    const fora = foraDeLinha.posicaoForaDeLinha;
    msgs.push([
      txt("Em linha: "), num(fmtTonDec(em.pesoTon)), txt(" em "),
      num(fmtInt(em.itens)), txt(" itens ativos — a espinha dorsal do CD."),
    ]);
    msgs.push([
      txt("Fora de linha: "), num(fmtTonDec(fora.pesoTon)), txt(" em "),
      num(fmtInt(fora.itens)), txt(" itens — opportunity de revisão para giro ou baixa."),
    ]);
  }

  if (semana) {
    const aceitos = semana.dias.filter((d) => d.ton >= d.meta).length;
    const tonSemana = semana.dias.reduce((s, d) => s + d.ton, 0);
    msgs.push([
      txt("Na última semana recebemos "), num(fmtTonDec(tonSemana)),
      txt(", com "), num(aceitos), txt(" de "), num(semana.dias.length),
      txt(" dias batendo a meta de recebimento."),
    ]);
  }

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

  if (reservados) {
    msgs.push([
      txt("Estoque reservado: "), num(fmtTonDec(reservados.totalTon)),
      txt(" em "), num(fmtInt(reservados.totalQtd)), txt(" peças — "),
      num(`R$ ${fmtBr(reservados.totalValor / 1e6, 2)} mi`),
      txt(" comprometidos em vendas futuras."),
    ]);
  }

  if (avarias?.total) {
    msgs.push([
      txt("Avarias registradas: "), num(fmtInt(avarias.total)),
      txt(" volumes acumulados no ano"),
      avarias.custo ? [txt(" — custo estimado de "), num(avarias.custo)] : [],
    ].flat() as Mensagem);
  }

  if (pendentes?.itens) {
    msgs.push([
      txt("Pendentes de produção: "), num(fmtInt(pendentes.itens)),
      txt(" lotes somando "), num(fmtTonDec(pendentes.totalTon)),
      txt(" — média de "), num(fmtTonDec(pendentes.mediaTon)),
      txt(" por lote."),
    ]);
  }

  if (unidades.length) {
    const top = [...unidades].sort((a, b) => b.share - a.share)[0];
    msgs.push([
      txt("Guarda-Roupas lidera com "), num(`${fmtBr(top.share, 1)}%`),
      txt(" de participação, seguido por Salas e Complementos."),
    ]);
  }

  if (valorFaturado) {
    msgs.push([
      txt("Já carregamos "), num(`R$ ${fmtBr(valorFaturado / 1e6, 2)} mi`),
      txt(" em faturamento — a engrenagem girando forte."),
    ]);
  }

  msgs.push([txt("Tudo pronto para acompanhar o painel. Bom trabalho.")]);

  return msgs;
}

/* ── Resumo de dados para enviar à IA ── */

function buildDataSummary(p: Props): string {
  const partes: string[] = [];
  const { resumo, ocupacao, unidades, semana, mensal, avarias, pendentes, reservados, foraDeLinha, valorFaturado } = p;

  if (resumo) {
    partes.push(`Massa total: ${fmtTonDec(resumo.ton)}`);
    partes.push(`Valor investido: R$ ${fmtBr(resumo.valor / 1e6, 2)} mi`);
    partes.push(`Peças em saldo: ${fmtInt(resumo.saldo)}`);
    partes.push(`Itens ativos: ${fmtInt(resumo.itens)}`);
  }
  if (ocupacao) {
    partes.push(`Ocupação do CD: ${fmtBr(ocupacao.pct * 100, 1)}%`);
    partes.push(`Endereços: ${fmtInt(ocupacao.ocupados)} ocupados de ${fmtInt(ocupacao.ocupados + ocupacao.livres)} totais`);
  }
  if (foraDeLinha) {
    partes.push(`Em linha: ${fmtTonDec(foraDeLinha.posicaoEmLinha.pesoTon)} em ${fmtInt(foraDeLinha.posicaoEmLinha.itens)} itens`);
    partes.push(`Fora de linha: ${fmtTonDec(foraDeLinha.posicaoForaDeLinha.pesoTon)} em ${fmtInt(foraDeLinha.posicaoForaDeLinha.itens)} itens`);
  }
  if (semana) {
    const aceitos = semana.dias.filter((d) => d.ton >= d.meta).length;
    const tonSemana = semana.dias.reduce((s, d) => s + d.ton, 0);
    partes.push(`Recebimento da semana: ${fmtTonDec(tonSemana)}`);
    partes.push(`Dias batendo meta: ${aceitos} de ${semana.dias.length}`);
  }
  if (mensal?.length) {
    const totRec = mensal.reduce((s, m) => s + m.recebido, 0);
    const totCar = mensal.reduce((s, m) => s + m.carregado, 0);
    const eficiencia = fmtBrMax((totCar / Math.max(totRec, 1)) * 100, 1);
    partes.push(`Recebido no ano: ${fmtTonDec(totRec)}`);
    partes.push(`Carregado no ano: ${fmtTonDec(totCar)}`);
    partes.push(`Eficiência do fluxo: ${eficiencia}%`);
  }
  if (reservados) {
    partes.push(`Estoque reservado: ${fmtTonDec(reservados.totalTon)} em ${fmtInt(reservados.totalQtd)} peças`);
    partes.push(`Valor reservado: R$ ${fmtBr(reservados.totalValor / 1e6, 2)} mi`);
  }
  if (avarias?.total) {
    partes.push(`Avarias no ano: ${fmtInt(avarias.total)} volumes`);
    if (avarias.custo) partes.push(`Custo de avarias: ${avarias.custo}`);
  }
  if (pendentes?.itens) {
    partes.push(`Pendentes de produção: ${fmtInt(pendentes.itens)} lotes, ${fmtTonDec(pendentes.totalTon)} no total`);
    partes.push(`Média por lote: ${fmtTonDec(pendentes.mediaTon)}`);
  }
  if (unidades.length) {
    const top = [...unidades].sort((a, b) => b.share - a.share)[0];
    partes.push(`Categoria líder: ${top.nome} com ${fmtBr(top.share, 1)}% de participação`);
  }
  if (valorFaturado) {
    partes.push(`Faturamento carregado: R$ ${fmtBr(valorFaturado / 1e6, 2)} mi`);
  }

  return partes.join("\n");
}

/* ── Parser de mensagens da IA: destaca números em verde ── */

function parseMensagem(str: string): Mensagem {
  const regex = /R\$\s*[\d.,]+(?:\s*(?:mi|milhões?))?|[\d][\d.,]*(?:\s*%)?/g;
  const segments: Mensagem = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) segments.push(txt(str.slice(lastIndex, match.index)));
    segments.push(num(match[0]));
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < str.length) segments.push(txt(str.slice(lastIndex)));
  return segments;
}

const TEMPO_POR_MSG = 4600;

export default function IntroTexto(props: Props) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [idx, setIdx] = useState(0);
  const [visivel, setVisivel] = useState(true);

  const concluir = useCallback(() => props.onConcluir(), [props]);

  // Busca interpretação da IA ao montar — fallback estático se indisponível
  useEffect(() => {
    let cancelled = false;
    const resumo = buildDataSummary(props);
    fetch("/api/interpretar-estoque", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumo }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.mensagens) && data.mensagens.length) {
          setMensagens(data.mensagens.map(parseMensagem));
        } else {
          setMensagens(construirMensagens(props));
        }
        setCarregando(false);
      })
      .catch(() => {
        if (cancelled) return;
        setMensagens(construirMensagens(props));
        setCarregando(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Avança as mensagens com fade suave
  useEffect(() => {
    if (carregando || idx >= mensagens.length) return;
    setVisivel(true);
    const tOut = setTimeout(() => setVisivel(false), TEMPO_POR_MSG - 700);
    const tNext = setTimeout(() => setIdx((i) => i + 1), TEMPO_POR_MSG);
    return () => { clearTimeout(tOut); clearTimeout(tNext); };
  }, [idx, mensagens.length, carregando]);

  // Quando chega ao fim, conclui
  useEffect(() => {
    if (!carregando && mensagens.length > 0 && idx >= mensagens.length) {
      const t = setTimeout(concluir, 600);
      return () => clearTimeout(t);
    }
  }, [idx, mensagens.length, carregando, concluir]);

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
        {carregando ? (
          <p className="font-serif italic text-lg leading-relaxed text-white/60 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] sm:text-2xl">
            Preparando análise de estoque...
          </p>
        ) : (
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
        )}
      </div>
    </div>
  );
}
