import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtBrMax, fmtTonDec } from "@/lib/format";
import type { VideoMes } from "./VideoResumoDashboard";

/* Cena — Saúde do Estoque
 * Gráfico de rosca (donut) mostrando a % de carregado sobre recebido,
 * indicando a "saúde" do fluxo de estoque no período.
 * Estilo minimalista: anel branco sobre track cinza, % em serif no centro.
 * Animação de contagem de 0 até o valor da saúde sincronizada com o donut. */

type Props = {
  anim: boolean;
  mensal?: VideoMes[] | undefined;
};

const R = 84;
const CIRC = 2 * Math.PI * R;
const DURACAO_CONTAGEM = 1300; // ms — mesma duração do donut

export default function CenaSaudeEstoque({ anim, mensal }: Props) {
  const listaMes = (mensal ?? []).filter((m) => m.recebido > 0 || m.carregado > 0);
  const totRecebido = listaMes.reduce((s, m) => s + m.recebido, 0);
  const totCarregado = listaMes.reduce((s, m) => s + m.carregado, 0);
  const saude = totRecebido > 0 ? (totCarregado / totRecebido) * 100 : 0;
  const pctGrafico = Math.min(saude, 100); // donut nunca passa de 100%
  const cor =
    saude >= 100
      ? "text-emerald-400"
      : saude >= 95
        ? "text-brand-amber"
        : "text-red-400";

  /* Contagem animada de 0 até o valor da saúde */
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
      // ease-out cúbico — desacelera no final
      const eased = 1 - Math.pow(1 - t, 3);
      setContagem(saude * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anim, saude]);

  return (
    <div className="flex w-full flex-col items-center">
      <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
        Saúde do Estoque
      </p>

      {/* Anel circular de progresso — % carregado sobre recebido */}
      <div className="video-pop relative mt-2 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="size-28 sm:size-32">
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            strokeWidth="16"
            className="stroke-white/15"
          />
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            strokeWidth="16"
            strokeLinecap="round"
            stroke="white"
            transform="rotate(-90 100 100)"
            style={{
              strokeDasharray: CIRC,
              strokeDashoffset: anim ? CIRC * (1 - pctGrafico / 100) : CIRC,
              transition: "stroke-dashoffset 1.3s cubic-bezier(0.22,1,0.36,1)",
              filter: "drop-shadow(0 0 8px rgba(255,255,255,0.35))",
            }}
          />
        </svg>
        <div className="absolute text-center">
          <p className="font-serif text-3xl sm:text-4xl text-white">
            {fmtBrMax(contagem, 1)}%
          </p>
          <p className="text-[8px] font-bold tracking-widest text-white/55 uppercase">
            carregado
          </p>
        </div>
      </div>

      {/* Resumo — recebido, carregado e saldo */}
      <div
        className="video-sobe mt-3 w-full max-w-xs mx-auto"
        style={{ animationDelay: "0.5s" }}
      >
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Resumo do período
        </p>
        <table className="w-full text-left text-xs text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Indicador</th>
              <th className="pb-0.5 text-right font-bold">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/10">
              <td className="py-0.5 text-white/80">Recebido</td>
              <td className="py-0.5 text-right font-mono font-semibold text-white/80">
                {fmtTonDec(totRecebido)}
              </td>
            </tr>
            <tr className="border-b border-white/10">
              <td className="py-0.5 text-white/80">Carregado</td>
              <td className="py-0.5 text-right font-mono font-semibold text-white/80">
                {fmtTonDec(totCarregado)}
              </td>
            </tr>
            <tr className="border-b border-white/10">
              <td className="py-0.5 text-white/80">Saldo</td>
              <td className={cn("py-0.5 text-right font-mono font-bold", totRecebido - totCarregado >= 0 ? "text-emerald-400" : "text-red-400")}>
                {fmtTonDec(Math.abs(totRecebido - totCarregado))}
              </td>
            </tr>
            <tr className="border-b border-white/10 last:border-0">
              <td className="py-0.5 text-white/80">Saúde</td>
              <td className={cn("py-0.5 text-right font-mono font-bold", cor)}>
                {fmtBrMax(contagem, 1)}%
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * Saúde = carregado ÷ recebido × 100. Janeiro a setembro de 2026.
        </p>
      </div>
    </div>
  );
}
