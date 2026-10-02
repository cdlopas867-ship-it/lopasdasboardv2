/* Cena — Saúde do Estoque
 * Apenas o donut com a % de saúde (carregado ÷ recebido × 100). */

import { useEffect, useState } from "react";
import { fmtBrMax } from "@/lib/format";
import type { VideoMes } from "./VideoResumoDashboard";

const R = 84;
const CIRC = 2 * Math.PI * R;
const COR = "#00FFCC";
const DURACAO_CONTAGEM = 1300;

type Props = {
  anim: boolean;
  mensal?: VideoMes[] | undefined;
  cena?: number;
};

export default function CenaSaudeEstoque({ anim, mensal }: Props) {
  const listaMes = (mensal ?? []).filter((m) => m.recebido > 0 || m.carregado > 0);
  const totRecebido = listaMes.reduce((s, m) => s + m.recebido, 0);
  const totCarregado = listaMes.reduce((s, m) => s + m.carregado, 0);
  const saude = totRecebido > 0 ? (totCarregado / totRecebido) * 100 : 0;
  const pctGrafico = Math.min(saude, 100);

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
      setContagem(pctGrafico * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anim, pctGrafico]);

  return (
    <div className="flex w-full flex-col items-center">
      <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
        Saúde do Estoque
      </p>

      <div className="video-pop relative mt-4 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="size-28 sm:size-32">
          <circle cx="100" cy="100" r={R} fill="none" strokeWidth="16" className="stroke-white/15" />
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            strokeWidth="16"
            strokeLinecap="round"
            stroke={COR}
            transform="rotate(-90 100 100)"
            style={{
              strokeDasharray: CIRC,
              strokeDashoffset: anim ? CIRC * (1 - pctGrafico / 100) : CIRC,
              transition: "stroke-dashoffset 1.3s cubic-bezier(0.22,1,0.36,1)",
              filter: `drop-shadow(0 0 8px ${COR}55)`,
            }}
          />
        </svg>
        <div className="absolute text-center pointer-events-none">
          <p className="font-serif text-2xl text-white" style={{ textShadow: `0 0 12px ${COR}44` }}>
            {fmtBrMax(contagem, 1)}%
          </p>
          <p className="text-[8px] font-bold tracking-widest uppercase" style={{ color: COR }}>
            saúde
          </p>
        </div>
      </div>

      <p className="video-sobe mt-3 text-[8px] leading-tight text-white/40" style={{ animationDelay: "0.5s" }}>
        * Saúde = carregado ÷ recebido × 100. Janeiro a setembro de 2026.
      </p>
    </div>
  );
}
