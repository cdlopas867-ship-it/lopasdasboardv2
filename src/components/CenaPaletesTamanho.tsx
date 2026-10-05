import { fmtInt } from "@/lib/format";
import type { VideoPaletas } from "./VideoResumoDashboard";

const ORDEM = ["P", "M", "G", "GG"];

/* Cena "Paletes" — apenas cards de estoque, sem recebimento. */
export default function CenaPaletesTamanho({ paletas }: { anim: boolean; paletas?: VideoPaletas | undefined }) {
  const est = paletas;
  if (!est || est.porTamanho.length === 0) {
    return (
      <div className="flex w-full flex-col items-center py-6 text-center">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">Paletes em estoque</p>
        <p className="video-sobe mt-4 font-serif text-2xl text-white/70">Sem dados de paletes.</p>
      </div>
    );
  }

  const undEst = est.porTamanho.reduce((s, x) => s + x.und, 0);
  const itensEst = est.porTamanho.reduce((s, x) => s + x.itens, 0);

  const porTam = ORDEM.map((t) => est.porTamanho.find((x) => x.tamanho === t)).filter(Boolean) as { tamanho: string; paletes: number; itens: number; und: number }[];

  const metricas: [string, string][] = [
    ["QTD em estoque", fmtInt(undEst)],
    ["Itens em estoque", fmtInt(itensEst)],
    ["Paletes estoque", fmtInt(est.totalPaletes)],
    ...porTam.map((p) => [`Pal. ${p.tamanho}`, fmtInt(p.paletes)] as [string, string]),
  ];

  return (
    <div className="flex w-full flex-col">
      <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
        Paletes · Estoque
      </p>

      {/* Cards de estoque */}
      <div className="video-sobe mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" style={{ animationDelay: "0.1s" }}>
        {metricas.map(([r, v]) => (
          <div key={r} className="rounded-xl border border-white/15 bg-white/5 p-3">
            <p className="font-serif text-2xl text-white sm:text-3xl">{v}</p>
            <p className="mt-1 text-[8px] font-bold tracking-[0.25em] text-white/55 uppercase">{r}</p>
          </div>
        ))}
      </div>

      {/* Resumo final */}
      <p className="video-sobe mt-4 text-[11px] text-white/55" style={{ animationDelay: "0.3s" }}>
        {fmtInt(undEst)} volumes em estoque · {fmtInt(itensEst)} itens · {fmtInt(est.totalPaletes)} paletes.
      </p>
    </div>
  );
}
