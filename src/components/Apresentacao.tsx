import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";

/* Wrapper reutilizável de apresentação no estilo "PowerPoint". */
type Props = {
  totalCenas: number;
  duracoes: number[];
  titulo: string;
  subtitulo?: string;
  children: (ctx: { cena: number; anim: boolean }) => ReactNode;
  onLogout?: () => void;
};

export default function Apresentacao({
  totalCenas,
  duracoes,
  titulo,
  subtitulo = "Movidos pela fé",
  children,
  onLogout,
}: Props) {
  const [cena, setCena] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [anim, setAnim] = useState(false);

  useEffect(() => {
    setAnim(false);
    const t = setTimeout(() => setAnim(true), 60);
    return () => clearTimeout(t);
  }, [cena]);

  useEffect(() => {
    if (pausado) return;
    const t = setTimeout(() => setCena((c) => (c + 1) % totalCenas), duracoes[cena]!);
    return () => clearTimeout(t);
  }, [cena, pausado, totalCenas, duracoes]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCena(0);
      if (e.key === " ") { e.preventDefault(); setPausado((p) => !p); }
      if (e.key === "ArrowRight") setCena((s) => Math.min(s + 1, totalCenas - 1));
      if (e.key === "ArrowLeft") setCena((s) => Math.max(s - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totalCenas]);

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = anterior; };
  }, []);

  return (
    <div role="dialog" aria-label={titulo} className="fixed inset-0 z-[120] flex flex-col overflow-hidden">
      <img
        src="/fundo-apresentacao.jpg"
        alt=""
        aria-hidden="true"
        decoding="async"
        fetchPriority="high"
        className="video-kenburns absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#4a6b20]/75 via-[#3a521a]/60 to-[#2e3f14]/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />

      <div className="pointer-events-none absolute bottom-8 left-4 z-[1] sm:bottom-10 sm:left-10">
        <p className="font-serif text-xs tracking-tight text-white/85 sm:text-lg">{titulo}</p>
        <p className="mt-0.5 text-[8px] font-semibold tracking-[0.3em] text-primary uppercase sm:text-[11px]">{subtitulo}</p>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-3 px-5 pt-3 sm:px-8">
          <div className="flex flex-1 gap-1.5 px-2">
            {Array.from({ length: totalCenas }).map((_, i) => (
              <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                {i < cena && <div className="h-full w-full bg-white" />}
                {i === cena && <div key={`${cena}-${pausado}`} className="video-segmento h-full rounded-full bg-white" style={{ animationDuration: `${duracoes[cena]}ms`, animationPlayState: pausado ? "paused" : "running" }} />}
              </div>
            ))}
          </div>
          <Link to="/" aria-label="Voltar ao dashboard" className="cursor-pointer rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-sm">‹</Link>
          <button type="button" onClick={() => setCena((s) => Math.max(s - 1, 0))} aria-label="Voltar cena" className="cursor-pointer rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold text-white">←</button>
          <button type="button" onClick={() => setPausado((p) => !p)} aria-label={pausado ? "Continuar" : "Pausar"} className="cursor-pointer rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold text-white">{pausado ? "▶" : "Ⅱ"}</button>
          <button type="button" onClick={() => setCena((s) => Math.min(s + 1, totalCenas - 1))} aria-label="Avançar cena" className="cursor-pointer rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold text-white">→</button>
          {onLogout && <button type="button" onClick={onLogout} aria-label="Sair" className="cursor-pointer rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold text-white">Sair</button>}
          <button type="button" onClick={() => setCena(0)} aria-label="Reiniciar" className="cursor-pointer rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold text-white">↺</button>
        </div>

        <div className="relative flex min-h-0 flex-grow items-center justify-center overflow-hidden px-4 py-2 sm:px-8">
          <div className="relative min-h-0 max-h-full w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/20 bg-white/10 px-4 py-2 shadow-2xl backdrop-blur-md sm:px-8">
            {children({ cena, anim })}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 pb-2 text-[9px] font-bold tracking-[0.2em] text-white/45 uppercase sm:px-8">
          <span>{pausado ? "Pausado · espaço retoma" : "Reprodução automática · espaço pausa"}</span>
          <span className="font-mono">{String(cena + 1).padStart(2, "0")} / {String(totalCenas).padStart(2, "0")}</span>
        </div>
      </div>
    </div>
  );
}
