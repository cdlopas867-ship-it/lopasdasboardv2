import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* Tela de apresentação pós-login — cicla indicadores chave do CD
   com efeito de texto surgindo e sumindo, sobre o fundo da marca. */

export type MetricaIntro = {
  rotulo: string;
  valor: string;
  sub?: string;
};

type Props = {
  metricas: MetricaIntro[];
  onDone: () => void;
};

const DURACAO_METRICA = 3000; // ms por indicador

/* Ícone SVG simples para cada métrica — escolhe pela palavra-chave do rótulo */
function IconeMetrica({ rotulo }: { rotulo: string }) {
  const u = rotulo.toUpperCase();
  let path: string;
  if (u.includes("PESO") || u.includes("MASSA"))
    path = "M5 20h14M7 20V10l5-5 5 5v10M10 20v-6h4v6";
  else if (u.includes("OCUPAC"))
    path = "M4 21V8l8-5 8 5v13M9 21v-6h6v6";
  else if (u.includes("AVAR"))
    path = "M12 2 2 22h20L12 2zm0 6v6m0 4h.01";
  else if (u.includes("RECEB"))
    path = "M3 16h14v5H3zM21 7l-5-5v3h-4v4h4v3z";
  else
    path = "M3 3h18v18H3zM7 7h10v10H7z";

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-7"
    >
      <path d={path} />
    </svg>
  );
}

export default function IntroMetricas({ metricas, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (idx >= metricas.length) {
      setLeaving(true);
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }

    // Barra de progresso animada via requestAnimationFrame
    startRef.current = performance.now();
    setProgresso(0);

    const tick = (now: number) => {
      const pct = Math.min((now - startRef.current) / DURACAO_METRICA, 1);
      setProgresso(pct);
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    const t = setTimeout(() => setIdx((i) => i + 1), DURACAO_METRICA);
    return () => {
      clearTimeout(t);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [idx, metricas.length, onDone]);

  const metrica = metricas[idx];

  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-brand-dark",
        leaving && "animate-intro-exit",
      )}
    >
      {/* Fundo — vista aérea do CD */}
      <div className="absolute inset-0">
        <img
          src="/fundo-intro.jpg?v=3"
          alt=""
          className="animate-intro-video h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />
      </div>

      {/* Linha decorativa superior */}
      <div className="absolute top-0 left-1/2 z-10 h-24 w-px -translate-x-1/2 bg-gradient-to-b from-primary/60 to-transparent" />

      {/* Marca — fixa no topo */}
      <div className="animate-intro-text relative z-10 mb-8 text-center">
        <p className="font-serif text-3xl tracking-tight text-white">
          Lopas{" "}
          <span className="align-top font-sans text-sm font-light tracking-[0.15em] text-white/70">
            2026
          </span>
        </p>
        <div className="mx-auto mt-3 h-px w-16 bg-primary/40" />
      </div>

      {/* Indicador em ciclo — surge e some */}
      {metrica && (
        <div
          key={idx}
          className="intro-metrica relative z-10 flex flex-col items-center px-6 text-center"
        >
          {/* Ícone circular */}
          <div className="relative mb-6 flex size-20 items-center justify-center rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm">
            <div className="absolute inset-0 animate-ping rounded-full border border-primary/20" style={{ animationDuration: "2s" }} />
            <span className="relative text-primary">
              <IconeMetrica rotulo={metrica.rotulo} />
            </span>
          </div>

          <p className="text-[11px] font-semibold tracking-[0.3em] text-primary uppercase">
            {metrica.rotulo}
          </p>

          {/* Valor com brilho */}
          <p className="mt-4 font-serif text-5xl tracking-tight text-white sm:text-6xl">
            <span className="relative">
              {metrica.valor}
              <span className="absolute -inset-x-4 -inset-y-1 -z-10 rounded-lg bg-primary/10 blur-2xl" />
            </span>
          </p>

          {metrica.sub && (
            <p className="mt-3 max-w-xs text-sm font-medium tracking-wider text-white/60">
              {metrica.sub}
            </p>
          )}
        </div>
      )}

      {/* Barra de progresso do indicador atual */}
      <div className="relative z-10 mt-8 h-0.5 w-48 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-primary transition-none"
          style={{ width: `${progresso * 100}%` }}
        />
      </div>

      {/* Pontinhos de progresso */}
      <div className="relative z-10 mt-5 flex gap-2">
        {metricas.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              i === idx ? "w-8 bg-primary" : i < idx ? "w-1.5 bg-white/50" : "w-1.5 bg-white/20",
            )}
          />
        ))}
      </div>

      {/* Linha decorativa inferior */}
      <div className="absolute bottom-24 left-1/2 z-10 h-16 w-px -translate-x-1/2 bg-gradient-to-t from-primary/40 to-transparent" />

      {/* Selo inferior */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center">
        <p className="animate-intro-text-2 text-[11px] font-semibold tracking-[0.3em] text-primary uppercase">
          Movidos pela fé
        </p>
      </div>
    </div>
  );
}
