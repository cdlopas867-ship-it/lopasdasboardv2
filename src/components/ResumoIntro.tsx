import { useEffect, useState } from "react";
import { fmtInt, fmtBrMax } from "@/lib/format";
import type { VideoAvarias, VideoDia, VideoKpi, VideoPendentes } from "./VideoResumoDashboard";

/* Tela de resumo intro — 6 slides com os principais indicadores do CD,
   no estilo editorial da marca, antes de iniciar a reprodução automática.
   Botão "Pular resumo" avança direto para o vídeo. */

type IconeTipo = "peso" | "ocupacao" | "valor" | "avarias" | "recebimento" | "pendentes";

type Slide = {
  icone: IconeTipo;
  titulo: string;
  valor?: string;
  subtitulo: string;
};

const DURACAO_SLIDE = 4000;

function prepararSlides(
  kpis: VideoKpi[],
  avarias?: VideoAvarias | undefined,
  semana?: { rotulo: string; total: string; dias: VideoDia[] } | null,
  pendentes?: VideoPendentes | undefined,
): Slide[] {
  const slides: Slide[] = [];

  const peso = kpis.find((k) => k.id === "peso");
  const ocup = kpis.find((k) => k.id === "ocupacao");
  const valor = kpis.find((k) => k.id === "valor");

  if (peso) {
    const extraGr = peso.extra?.find(([k]) => k === "Guarda-Roupas");
    slides.push({
      icone: "peso",
      titulo: "Peso Total em Estoque",
      valor: peso.valor,
      subtitulo: extraGr
        ? `Guarda-Roupas responde por ${extraGr[1]}`
        : peso.detalhe ?? "",
    });
  }
  if (ocup) {
    slides.push({
      icone: "ocupacao",
      titulo: "Ocupação do CD",
      valor: ocup.valor,
      subtitulo: ocup.detalhe ?? "",
    });
  }
  if (valor) {
    const extraGr = valor.extra?.find(([k]) => k === "Guarda-Roupas");
    slides.push({
      icone: "valor",
      titulo: "Valor em Estoque",
      subtitulo: extraGr
        ? `Guarda-Roupas concentra ${extraGr[1]} (53%) do valor total`
        : valor.detalhe ?? "",
    });
  }
  if (avarias) {
    slides.push({
      icone: "avarias",
      titulo: "Avarias",
      valor: `${fmtInt(avarias.total)} volumes`,
      subtitulo: avarias.referenciaParcial
        ? `Totais e meses conferidos na tabela oficial · custo parcial (${avarias.custo}).`
        : `Custo: ${avarias.custo}`,
    });
  }
  if (avarias?.tipos?.length) {
    const tipos = avarias.tipos;
    const top = tipos[0]!;
    slides.push({
      icone: "avarias",
      titulo: "Tipos de Avaria",
      valor: `${fmtInt(tipos.length)} tipos`,
      subtitulo: tipos.map((t) => t.tipo).join(" · "),
    });
    slides.push({
      icone: "avarias",
      titulo: "Maior Incidência",
      valor: top.tipo,
      subtitulo: `${fmtInt(top.total)} volumes · ${fmtBrMax(top.pct, 1)}% do total de avarias`,
    });
  }
  if (semana?.dias?.length) {
    const ultimo = semana.dias[semana.dias.length - 1]!;
    slides.push({
      icone: "recebimento",
      titulo: "Recebimento do Dia",
      valor: `${fmtBrMax(ultimo.ton, 0)} t`,
      subtitulo: `${ultimo.dia} · ${ultimo.data} · Meta: ${fmtInt(ultimo.meta)} t`,
    });
  }
  if (pendentes) {
    slides.push({
      icone: "pendentes",
      titulo: "Pendências de Produção",
      valor: `${fmtBrMax(pendentes.totalTon, 1)} t`,
      subtitulo: `${fmtInt(pendentes.itens)} ordens · média ${fmtBrMax(pendentes.mediaTon, 1)} t`,
    });
  }

  return slides;
}

/* Ícones de linha — warehouse, grid, moeda, alerta, caminhão, produção */
function IconeSlide({ tipo }: { tipo: IconeTipo }) {
  const s = "#76A035";
  const cls = "size-12 sm:size-14";
  if (tipo === "peso") {
    return (
      <svg viewBox="0 0 64 64" className={cls} fill="none" strokeWidth="1.5" stroke={s} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 26 L32 10 L58 26" />
        <path d="M10 24 V54 H54 V24" />
        <path d="M18 54 V36 H46 V54" />
        <path d="M18 42 H46" />
      </svg>
    );
  }
  if (tipo === "ocupacao") {
    return (
      <svg viewBox="0 0 64 64" className={cls} fill="none" strokeWidth="1.5" stroke={s} strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="14" width="44" height="40" rx="2" />
        <path d="M10 28 H54 M10 42 H54 M24 14 V54 M38 14 V54" />
      </svg>
    );
  }
  if (tipo === "valor") {
    return (
      <svg viewBox="0 0 64 64" className={cls} fill="none" strokeWidth="1.5" stroke={s} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="32" cy="32" r="22" />
        <path d="M32 18 V46 M24 26 H40 M24 38 H40" />
      </svg>
    );
  }
  if (tipo === "avarias") {
    return (
      <svg viewBox="0 0 64 64" className={cls} fill="none" strokeWidth="1.5" stroke={s} strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 8 L56 50 H8 Z" />
        <path d="M32 26 V40 M32 46 V48" />
      </svg>
    );
  }
  if (tipo === "recebimento") {
    return (
      <svg viewBox="0 0 64 64" className={cls} fill="none" strokeWidth="1.5" stroke={s} strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="30" width="36" height="22" rx="2" />
        <path d="M42 36 H54 L60 44 V52 H42" />
        <circle cx="16" cy="54" r="5" />
        <circle cx="50" cy="54" r="5" />
        <path d="M14 30 V22 H34 V30" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className={cls} fill="none" strokeWidth="1.5" stroke={s} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 20 H56 V50 H8 Z" />
      <path d="M8 28 H56 M20 28 V50 M44 28 V50" />
      <path d="M20 20 V12 H44 V20" />
    </svg>
  );
}

type Props = {
  kpis: VideoKpi[];
  avarias?: VideoAvarias | undefined;
  semana?: { rotulo: string; total: string; dias: VideoDia[] } | null;
  pendentes?: VideoPendentes | undefined;
  onConcluir: () => void;
};

export default function ResumoIntro({ kpis, avarias, semana, pendentes, onConcluir }: Props) {
  const slides = prepararSlides(kpis, avarias, semana, pendentes);
  const [atual, setAtual] = useState(0);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    if (saindo) return;
    const t = setTimeout(() => {
      if (atual < slides.length - 1) {
        setAtual((s) => s + 1);
      } else {
        setSaindo(true);
        setTimeout(onConcluir, 600);
      }
    }, DURACAO_SLIDE);
    return () => clearTimeout(t);
  }, [atual, saindo, slides.length, onConcluir]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && atual < slides.length - 1) setAtual((s) => s + 1);
      if (e.key === "ArrowLeft" && atual > 0) setAtual((s) => s - 1);
      if (e.key === "Escape" || e.key === "Enter") {
        setSaindo(true);
        setTimeout(onConcluir, 600);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [atual, slides.length, onConcluir]);

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = anterior; };
  }, []);

  const slide = slides[atual]!;

  return (
    <div
      className={`resumo-intro ${saindo ? "resumo-intro-saindo" : ""} fixed inset-0 z-[130] flex flex-col items-center justify-center overflow-hidden`}
    >
      {/* Fundo */}
      <div
        className="video-kenburns absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/fundo-satelite-real.jpg?v=1)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a3e18]/80 via-[#1e2c10]/70 to-[#0f1608]/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.45)_100%)]" />

      {/* Botão "Pular resumo" no topo */}
      <button
        type="button"
        onClick={() => {
          setSaindo(true);
          setTimeout(onConcluir, 600);
        }}
        className="absolute left-1/2 top-5 z-20 -translate-x-1/2 cursor-pointer rounded-full border border-white/20 bg-white/5 px-6 py-2 text-[10px] font-bold tracking-[0.25em] text-white/60 uppercase backdrop-blur-sm transition-colors hover:bg-white/15 hover:text-white/90"
      >
        Pular resumo →
      </button>

      {/* Conteúdo central */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-6 text-center sm:max-w-md">
        {/* Cabeçalho */}
        <div key={`header-${atual}`} className="resumo-slide-entra mb-4">
          <p className="font-serif text-3xl tracking-tight text-white sm:text-4xl">
            Lopas<sup className="ml-1 text-lg text-white/70 sm:text-xl">2026</sup>
          </p>
        </div>

        {/* Ícone circular */}
        <div key={`icon-${atual}`} className="resumo-slide-entra mb-4 flex items-center justify-center">
          <div className="flex size-16 items-center justify-center rounded-full border-2 border-[#76A035]/60 sm:size-20">
            <IconeSlide tipo={slide.icone} />
          </div>
        </div>

        {/* Dados */}
        <div key={`data-${atual}`} className="resumo-slide-entra flex flex-col items-center">
          <p className="text-[10px] font-bold tracking-[0.3em] text-[#76A035] uppercase sm:text-[11px]">
            {slide.titulo}
          </p>
          {slide.valor && (
            <p className="mt-2 font-serif text-3xl tracking-tight text-white sm:text-4xl">
              {slide.valor}
            </p>
          )}
          <p className="mt-2 max-w-[18rem] text-xs leading-relaxed text-white/60 sm:text-sm sm:max-w-xs">
            {slide.subtitulo}
          </p>
        </div>

        {/* Barra de progresso */}
        <div className="mt-6 flex w-full max-w-[240px] gap-1">
          {slides.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[#76A035] transition-all duration-500"
                style={{ width: i <= atual ? "100%" : "0%" }}
              />
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="mt-3.5 flex gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`size-2 rounded-full border transition-all duration-300 ${
                i === atual
                  ? "border-[#76A035] bg-[#76A035] scale-125"
                  : "border-white/30 bg-transparent"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Rodapé */}
      <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center px-6">
        <p className="text-[10px] font-bold tracking-[0.4em] text-[#76A035]/50 uppercase">
          Movidos pela fé
        </p>
      </div>
    </div>
  );
}
