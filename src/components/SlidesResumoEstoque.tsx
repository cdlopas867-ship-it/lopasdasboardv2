import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/* Slides/cenas animadas do resumo de estoque — carousel inline embutido
   na seção "Resumo do Estoque". Reaproveita as animações do vídeo-resumo
   (video-sobe, video-barra-x/y, video-pop) num formato navegável. */

export type SlideKpi = { rotulo: string; valor: string };
export type SlideUnidade = { nome: string; share: number; valor: string };
export type SlideOcupacao = { pct: number; ocupados: number; livres: number };
export type SlideAvarias = {
  total: number;
  custo: string;
  meses: { mes: string; qtd: number }[];
} | null;
export type SlidePendentes = {
  itens: number;
  totalTon: number;
  mediaTon: number;
  fatias: { rotulo: string; ton: number; cor: string }[];
  meses: { mes: string; ton: number; pct: number; itens: number }[];
} | null;

type Props = {
  kpis: SlideKpi[];
  unidades: SlideUnidade[];
  ocupacao: SlideOcupacao;
  avarias?: SlideAvarias;
  pendentes?: SlidePendentes;
};

const TOTAL_SLIDES = 5;
const DURACOES = [6000, 6000, 6000, 6500, 6500];

export default function SlidesResumoEstoque({
  kpis,
  unidades,
  ocupacao,
  avarias,
  pendentes,
}: Props) {
  const [slide, setSlide] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [anim, setAnim] = useState(false);

  useEffect(() => {
    setAnim(false);
    const t = setTimeout(() => setAnim(true), 60);
    return () => clearTimeout(t);
  }, [slide]);

  useEffect(() => {
    if (pausado) return;
    const t = setTimeout(() => {
      setSlide((s) => (s + 1) % TOTAL_SLIDES);
    }, DURACOES[slide]!);
    return () => clearTimeout(t);
  }, [slide, pausado]);

  const prev = () => setSlide((s) => (s - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
  const next = () => setSlide((s) => (s + 1) % TOTAL_SLIDES);

  const R = 72;
  const CIRC = 2 * Math.PI * R;
  const maxTurnoUn = Math.max(...unidades.map((u) => u.share), 1);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-brand-dark">
      {/* Fundo — armazém com overlay escuro */}
      <div
        className="video-kenburns absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url(/fundo-apresentacao.jpg)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/80 via-brand-dark/70 to-brand-dark/90" />

      {/* Topo — segmentos de progresso + controles */}
      <div className="relative flex items-center gap-2 px-4 pt-4 sm:px-6">
        <span className="text-[10px] font-bold tracking-[0.25em] text-primary uppercase">
          Resumo · Estoque
        </span>
        <div className="flex flex-1 gap-1.5 px-2">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
              {i < slide && <div className="h-full w-full bg-primary" />}
              {i === slide && (
                <div
                  key={`${slide}-${pausado}`}
                  className="video-segmento h-full rounded-full bg-primary"
                  style={{
                    animationDuration: `${DURACOES[slide]}ms`,
                    animationPlayState: pausado ? "paused" : "running",
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPausado((p) => !p)}
          aria-label={pausado ? "Continuar" : "Pausar"}
          className="cursor-pointer rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          {pausado ? "▶" : "⏸"}
        </button>
      </div>

      {/* Cena atual */}
      <div className="relative flex min-h-[320px] items-center justify-center px-4 py-8 sm:min-h-[360px] sm:px-8">
        <div key={slide} className="video-pop w-full max-w-2xl">
          {/* Slide 1 — KPIs de abertura */}
          {slide === 0 && (
            <div>
              <p className="video-sobe text-xs font-bold tracking-[0.3em] text-white/70 uppercase">
                Resumo do CD · 2026
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {kpis.map((k, i) => (
                  <div
                    key={k.rotulo}
                    className="video-sobe rounded-2xl border border-white/15 bg-white/5 p-5 text-center"
                    style={{ animationDelay: `${0.15 * (i + 1)}s` }}
                  >
                    <p className="font-serif text-3xl tracking-tight text-white sm:text-4xl">
                      {k.valor}
                    </p>
                    <p className="mt-2 text-[10px] font-bold tracking-widest text-white/55 uppercase">
                      {k.rotulo}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Slide 2 — participação das unidades */}
          {slide === 1 && (
            <div>
              <p className="video-sobe text-xs font-bold tracking-[0.3em] text-white/70 uppercase">
                Valor por unidade
              </p>
              <div className="mt-6 space-y-5">
                {unidades.map((u, i) => (
                  <div key={u.nome} className="video-sobe" style={{ animationDelay: `${0.12 * i}s` }}>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="font-serif text-xl text-white sm:text-2xl">{u.nome}</span>
                      <span className="text-sm font-bold text-white">
                        {u.valor}{" "}
                        <span className="text-white/50">· {u.share.toLocaleString("pt-BR")}%</span>
                      </span>
                    </div>
                    <div className="h-3.5 overflow-hidden rounded-full bg-white/15">
                      <div
                        className={cn(
                          "video-barra-x h-full rounded-full bg-gradient-to-r from-primary/80 to-primary",
                          !anim && "video-pausada",
                        )}
                        style={{ width: `${(u.share / maxTurnoUn) * 100}%`, animationDelay: `${0.12 * i + 0.2}s` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Slide 3 — ocupação (donut) */}
          {slide === 2 && (
            <div className="flex w-full flex-col items-center">
              <p className="video-sobe text-xs font-bold tracking-[0.3em] text-white/70 uppercase">
                Ocupação do CD
              </p>
              <div className="video-pop relative mt-5 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="size-44 sm:size-52">
                  <circle cx="100" cy="100" r={R} fill="none" strokeWidth="14" className="stroke-white/15" />
                  <circle
                    cx="100"
                    cy="100"
                    r={R}
                    fill="none"
                    strokeWidth="14"
                    strokeLinecap="round"
                    stroke="var(--color-primary)"
                    transform="rotate(-90 100 100)"
                    style={{
                      strokeDasharray: CIRC,
                      strokeDashoffset: anim ? CIRC * (1 - ocupacao.pct) : CIRC,
                      transition: "stroke-dashoffset 1.3s cubic-bezier(0.22,1,0.36,1)",
                      filter: "drop-shadow(0 0 8px color-mix(in oklab, var(--primary) 40%, transparent))",
                    }}
                  />
                </svg>
                <div className="absolute text-center">
                  <p className="font-serif text-4xl text-white">
                    {(ocupacao.pct * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                  </p>
                  <p className="text-[10px] font-bold tracking-widest text-white/55 uppercase">ocupado</p>
                </div>
              </div>
              <div className="video-sobe mt-5 flex gap-6 text-sm text-white" style={{ animationDelay: "0.5s" }}>
                <span className="flex items-center gap-2">
                  <span className="size-3 rounded-sm bg-primary" />
                  {ocupacao.ocupados.toLocaleString("pt-BR")} ocupados
                </span>
                <span className="flex items-center gap-2 text-white/60">
                  <span className="size-3 rounded-sm bg-white/25" />
                  {ocupacao.livres.toLocaleString("pt-BR")} livres
                </span>
              </div>
            </div>
          )}

          {/* Slide 4 — pendências de produção */}
          {slide === 3 && (
            <div className="w-full">
              <p className="video-sobe text-xs font-bold tracking-[0.3em] text-white/70 uppercase">
                Pendências de produção
              </p>
              {pendentes ? (
                <>
                  <p className="video-sobe mt-3 font-serif text-3xl text-white sm:text-4xl">
                    {pendentes.totalTon.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} t{" "}
                    <span className="text-base text-white/60">
                      · {pendentes.itens.toLocaleString("pt-BR")} ordens
                    </span>
                  </p>
                  <div className="mt-6 space-y-5">
                    {pendentes.fatias.map((f, i) => {
                      const max = Math.max(...pendentes.fatias.map((x) => x.ton), 1);
                      return (
                        <div key={f.rotulo} className="video-sobe flex items-center gap-4" style={{ animationDelay: `${0.12 * i}s` }}>
                          <span className="w-20 shrink-0 text-xs font-bold tracking-wider text-white/70 uppercase">
                            {f.rotulo}
                          </span>
                          <div className="h-7 flex-1 overflow-hidden rounded-lg bg-white/15">
                            <div
                              className={cn("video-barra-x h-full rounded-lg", !anim && "video-pausada")}
                              style={{
                                width: `${(f.ton / max) * 100}%`,
                                background: f.cor,
                                animationDelay: `${0.12 * i + 0.15}s`,
                              }}
                            />
                          </div>
                          <span className="w-14 text-right font-mono text-xs font-bold text-white">
                            {f.ton.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} t
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="video-sobe mt-6 font-serif text-2xl text-white/70">
                  Nenhuma pendência de produção.
                </p>
              )}
            </div>
          )}

          {/* Slide 5 — avarias por mês */}
          {slide === 4 && (
            <div className="w-full">
              <p className="video-sobe text-xs font-bold tracking-[0.3em] text-white/70 uppercase">
                Avarias
              </p>
              {avarias ? (
                <>
                  <div className="video-sobe mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                    <p className="font-serif text-3xl text-white sm:text-4xl">
                      {avarias.total.toLocaleString("pt-BR")}{" "}
                      <span className="text-base text-white/60">ocorrências</span>
                    </p>
                    <p className="font-serif text-2xl text-brand-amber">{avarias.custo}</p>
                  </div>
                  <div className="mt-6 flex h-32 items-end justify-between gap-2 sm:gap-4">
                    {avarias.meses.map((m, i) => {
                      const max = Math.max(...avarias.meses.map((x) => x.qtd), 1);
                      return (
                        <div key={m.mes} className="flex h-full flex-1 flex-col justify-end">
                          <p
                            className="video-sobe mb-1.5 text-center font-mono text-[11px] font-bold text-white/85"
                            style={{ animationDelay: `${0.12 * i + 0.5}s` }}
                          >
                            {m.qtd.toLocaleString("pt-BR")}
                          </p>
                          <div
                            className={cn(
                              "video-barra-y w-full rounded-t-lg bg-gradient-to-t from-red-500/60 to-red-400",
                              !anim && "video-pausada",
                            )}
                            style={{
                              height: `${Math.max((m.qtd / max) * 100, 4)}%`,
                              animationDelay: `${0.12 * i + 0.2}s`,
                            }}
                          />
                          <p className="mt-2 truncate text-center text-[10px] font-bold text-white/70 uppercase">
                            {m.mes.slice(0, 3)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="video-sobe mt-6 font-serif text-2xl text-white/70">
                  Sem registros de avarias.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Setas de navegação */}
      <button
        type="button"
        onClick={prev}
        aria-label="Anterior"
        className="absolute top-1/2 left-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-xl text-white backdrop-blur transition-all hover:bg-black/50 hover:border-white/40"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Próximo"
        className="absolute top-1/2 right-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-xl text-white backdrop-blur transition-all hover:bg-black/50 hover:border-white/40"
      >
        ›
      </button>

      {/* Indicadores + contador */}
      <div className="relative flex items-center justify-center gap-2 pb-4">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSlide(i)}
            aria-label={`Slide ${i + 1}`}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === slide ? "w-8 bg-primary" : "w-2 bg-white/30 hover:bg-white/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}
