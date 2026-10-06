/* Primitivos compartilhados para cenas interativas com donut + toggle.
   Usados por Ocupação, Recebimento por turno, Reservados, Saúde e Fora de Linha. */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtBrMax } from "@/lib/format";

const R = 84;
const CIRC = 2 * Math.PI * R;
const DURACAO_CONTAGEM = 1300;

export type SecaoDonut = {
  id: string;
  label: string;
  cor: string;
  pct: number;
};

/* Donut interativo — clique alterna para a próxima seção.
   O anel muda de cor e o valor central anima até a % da seção ativa. */
export function DonutInterativo({
  secoes,
  foco,
  onToggle,
  anim,
}: {
  secoes: SecaoDonut[];
  foco: number;
  onToggle: () => void;
  anim: boolean;
}) {
  const ativa = secoes[foco] ?? secoes[0]!;

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
      setContagem(ativa.pct * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anim, ativa.pct]);

  return (
    <button
      type="button"
      onClick={onToggle}
      className="video-pop group relative flex items-center justify-center cursor-pointer"
      aria-label="Alternar seção"
    >
      <svg viewBox="0 0 200 200" className="size-28 sm:size-32 transition-transform group-hover:scale-105">
        <circle cx="100" cy="100" r={R} fill="none" strokeWidth="16" className="stroke-white/15" />
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          strokeWidth="16"
          strokeLinecap="round"
          stroke={ativa.cor}
          transform="rotate(-90 100 100)"
          style={{
            strokeDasharray: CIRC,
            strokeDashoffset: anim ? CIRC * (1 - ativa.pct / 100) : CIRC,
            transition: "stroke-dashoffset 1.3s cubic-bezier(0.22,1,0.36,1), stroke 0.4s ease",
            filter: `drop-shadow(0 0 8px ${ativa.cor}55)`,
          }}
        />
      </svg>
      <div className="absolute text-center pointer-events-none">
        <p className="font-serif text-2xl text-white" style={{ textShadow: `0 0 12px ${ativa.cor}44` }}>
          {fmtBrMax(contagem, 1)}%
        </p>
        <p className="text-[8px] font-bold tracking-widest uppercase" style={{ color: ativa.cor }}>
          {ativa.label}
        </p>
      </div>
    </button>
  );
}

/* Botões de toggle — pílulas que alternam a seção ativa. */
export function ToggleSecoes({
  secoes,
  foco,
  onChange,
}: {
  secoes: SecaoDonut[];
  foco: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-2">
      {secoes.map((s, i) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(i)}
          className={cn(
            "rounded-full px-3 py-1 text-[9px] font-bold tracking-widest uppercase transition-all duration-300",
            i === foco ? "text-brand-dark" : "text-white/50 border border-white/15 hover:text-white/80",
          )}
          style={i === foco ? { background: s.cor } : undefined}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

/* Hook helper — estado de foco que reseta quando `cena` muda. */
export function useFocoCena<T extends number>(cena: number, inicial: T = 0 as T) {
  const [foco, setFoco] = useState<T>(inicial);
  useEffect(() => setFoco(inicial), [cena]);
  return [foco, setFoco] as const;
}

/* Banner resumo — pílula centralizada com texto de resumo da cena. */
export function BannerResumo({
  texto,
  delay = "0.6s",
}: {
  texto: string;
  delay?: string;
}) {
  return (
    <div
      className="video-sobe mt-3 flex justify-center"
      style={{ animationDelay: delay }}
    >
      <p
        className="rounded-full px-5 py-2 text-center text-xs font-semibold text-white"
        style={{ background: "rgba(138, 146, 121, 0.45)" }}
      >
        {texto}
      </p>
    </div>
  );
}
