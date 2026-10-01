import { useEffect, useState, useCallback } from "react";
import type { VideoKpi, VideoUnidade, VideoOcupacao, VideoMes, VideoAvarias, VideoPendentes, VideoReservados } from "./VideoResumoDashboard";
import type { VideoForaDeLinha } from "./CenasApresentacao";
import { interpretarLocal } from "@/lib/interpretador-local";

type Resumo = { valor: number; previsto: number; ton: number; saldo: number; itens: number };

type Segmento = { t: string; n?: boolean };
type Mensagem = Segmento[];

type Fase = "mensagens" | "lopas" | "movidos";

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

const TEMPO_POR_MSG = 7000;
const TEMPO_LOPAS = 3200;
const TEMPO_MOVIDOS = 3000;

export default function IntroTexto(props: Props) {
  const [mensagens] = useState<Mensagem[]>(() => interpretarLocal(props));
  const [idx, setIdx] = useState(0);
  const [visivel, setVisivel] = useState(true);
  const [pausado, setPausado] = useState(false);
  const [fase, setFase] = useState<Fase>("mensagens");

  const concluir = useCallback(() => props.onConcluir(), [props]);

  // Avança as mensagens com fade suave (não avança se pausado)
  useEffect(() => {
    if (pausado || fase !== "mensagens" || idx >= mensagens.length) return;
    setVisivel(true);
    const tOut = setTimeout(() => setVisivel(false), TEMPO_POR_MSG - 700);
    const tNext = setTimeout(() => setIdx((i) => i + 1), TEMPO_POR_MSG);
    return () => { clearTimeout(tOut); clearTimeout(tNext); };
  }, [idx, mensagens.length, pausado, fase]);

  // Quando as mensagens acabam, vai para a fase LOPAS
  useEffect(() => {
    if (fase !== "mensagens" || mensagens.length === 0 || idx < mensagens.length) return;
    const t = setTimeout(() => setFase("lopas"), 700);
    return () => clearTimeout(t);
  }, [idx, mensagens.length, fase]);

  // Fase LOPAS → MOVIDOS PELA FÉ
  useEffect(() => {
    if (pausado || fase !== "lopas") return;
    const t = setTimeout(() => setFase("movidos"), TEMPO_LOPAS);
    return () => clearTimeout(t);
  }, [fase, pausado]);

  // Fase MOVIDOS PELA FÉ → concluir
  useEffect(() => {
    if (pausado || fase !== "movidos") return;
    const t = setTimeout(concluir, TEMPO_MOVIDOS);
    return () => clearTimeout(t);
  }, [fase, pausado, concluir]);

  const pular = useCallback(() => concluir(), [concluir]);

  // Barra de espaço pausa/continua
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setPausado((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const msg = mensagens[Math.min(idx, mensagens.length - 1)] ?? [];
  const faseFinal = fase === "lopas" || fase === "movidos";

  return (
    <div
      role="dialog"
      aria-label="Resumo de boas-vindas"
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Fundo */}
      <div
        className="video-kenburns absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${faseFinal ? "/fundo-lopas-final.webp" : "/fundo-satelite-real.jpg?v=1"})` }}
      />
      {!faseFinal && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#4a6b20]/82 via-[#3a521a]/68 to-[#2e3f14]/92" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.45)_100%)]" />
        </>
      )}
      {faseFinal && (
        <div className="absolute inset-0 bg-black/35" />
      )}

      {/* Botão Pular */}
      {!faseFinal && (
        <button
          type="button"
          onClick={pular}
          className="absolute top-4 right-4 z-20 cursor-pointer rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/20 sm:top-6 sm:right-6"
        >
          Pular resumo
        </button>
      )}

      {/* Watermark */}
      {!faseFinal && (
        <div className="pointer-events-none absolute bottom-6 left-4 z-[1] sm:bottom-10 sm:left-10">
          <p className="font-serif text-xs tracking-tight text-white/80 sm:text-lg">
            Controle de Estoque CD Lopas
          </p>
          <p className="mt-0.5 text-[8px] font-semibold tracking-[0.3em] text-primary uppercase sm:text-[11px]">
            Movidos pela fé
          </p>
        </div>
      )}

      {/* Mensagens de interpretação do estoque */}
      {fase === "mensagens" && (
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
              {msg.map((seg: Segmento, i: number) =>
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
        </div>
      )}

      {/* Sequência final: LOPAS → MOVIDOS PELA FÉ */}
      {faseFinal && (
        <div className="relative z-10 flex flex-col items-center justify-center">
          {fase === "lopas" && (
            <h1
              className="fase-lopas font-serif text-5xl font-light italic tracking-[0.35em] text-white/90 drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)] sm:text-7xl"
            >
              LOPAS 2026
            </h1>
          )}
          {fase === "movidos" && (
            <p className="fase-movidos font-serif text-xl font-light italic tracking-[0.25em] text-white/80 drop-shadow-[0_2px_14px_rgba(0,0,0,0.4)] sm:text-3xl">
              Movidos pela fé
            </p>
          )}
        </div>
      )}
    </div>
  );
}
