import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt } from "@/lib/format";
import type { VideoPaletas } from "./VideoResumoDashboard";

const CORES: Record<string, string> = { P: "#22c55e", M: "#3b82f6", G: "#f97316", GG: "#a855f7" };
const ORDEM = ["P", "M", "G", "GG"];

/* Cena "Paletes por tamanho" — compara paletes recebidos × paletes em estoque
   por tamanho (P, M, G, GG), com totais e médias. */
export default function CenaPaletesTamanho({ anim, paletas }: { anim: boolean; paletas?: VideoPaletas | undefined }) {
  const est = paletas;
  const rec = paletas?.recebimento ?? null;
  if (!est || est.porTamanho.length === 0) {
    return (
      <div className="flex w-full flex-col items-center py-6 text-center">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">Paletes por tamanho</p>
        <p className="video-sobe mt-4 font-serif text-2xl text-white/70">Sem dados de paletes.</p>
      </div>
    );
  }
  const linhas = ORDEM.map((t) => ({
    t,
    e: est.porTamanho.find((x) => x.tamanho === t),
    r: rec?.porTamanho.find((x) => x.tamanho === t),
  })).filter((l) => l.e || l.r);
  const max = Math.max(1, ...linhas.flatMap((l) => [l.e?.paletes ?? 0, l.r?.paletes ?? 0]));
  const dias = paletas?.diasRecebidos ?? 0;
  const undEst = est.porTamanho.reduce((s, x) => s + x.und, 0);
  const undRec = rec?.porTamanho.reduce((s, x) => s + x.und, 0) ?? 0;
  const metricas: [string, string][] = [
    ["Paletes em estoque", fmtInt(est.totalPaletes)],
    ["Paletes recebidos", rec ? fmtInt(rec.totalPaletes) : "—"],
    ["Média recebida / dia", rec && dias > 0 ? fmtBrMax(rec.totalPaletes / dias, 1) : "—"],
    ["Média und / palete", est.totalPaletes > 0 ? fmtBrMax(undEst / est.totalPaletes, 1) : "—"],
  ];

  return (
    <div className="flex w-full flex-col">
      <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
        Paletes por tamanho · Recebimento × Estoque
      </p>
      <div className="video-sobe mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" style={{ animationDelay: "0.1s" }}>
        {metricas.map(([r, v]) => (
          <div key={r} className="rounded-xl border border-white/15 bg-white/5 p-3">
            <p className="font-serif text-2xl text-white sm:text-3xl">{v}</p>
            <p className="mt-1 text-[8px] font-bold tracking-[0.25em] text-white/55 uppercase">{r}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {linhas.map((l, i) => {
          const cor = CORES[l.t] ?? "#6b7280";
          return (
            <div key={l.t} className="video-sobe flex items-center gap-3" style={{ animationDelay: `${0.12 * i + 0.3}s` }}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold" style={{ background: `${cor}25`, color: cor }}>
                {l.t}
              </span>
              <div className="flex-1 space-y-1">
                {([["Receb.", l.r?.paletes ?? 0, 0.55], ["Estoque", l.e?.paletes ?? 0, 1]] as const).map(([rot, v, op]) => (
                  <div key={rot} className="flex items-center gap-2">
                    <span className="w-12 text-[9px] text-white/50 uppercase">{rot}</span>
                    <div className="h-3.5 flex-1 overflow-hidden rounded bg-white/8">
                      <div
                        className={cn("video-barra-x h-full rounded", !anim && "video-pausada")}
                        style={{ width: `${Math.max((v / max) * 100, 2)}%`, background: cor, opacity: op, animationDelay: `${0.12 * i + 0.4}s` }}
                      />
                    </div>
                    <span className="w-14 text-right font-mono text-xs font-bold text-white">{fmtInt(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <table className="video-sobe mt-5 w-full text-left text-[11px] text-white" style={{ animationDelay: "0.7s" }}>
        <thead>
          <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
            <th className="pb-1">Tam.</th>
            <th className="pb-1 text-right">Receb.</th>
            <th className="pb-1 text-right">Estoque</th>
            <th className="pb-1 text-right">% est.</th>
            <th className="pb-1 text-right">Und/pal.</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.t} className="border-b border-white/10">
              <td className="py-1 font-bold" style={{ color: CORES[l.t] }}>{l.t}</td>
              <td className="py-1 text-right font-mono">{fmtInt(l.r?.paletes ?? 0)}</td>
              <td className="py-1 text-right font-mono">{fmtInt(l.e?.paletes ?? 0)}</td>
              <td className="py-1 text-right font-mono">{fmtBrMax(((l.e?.paletes ?? 0) / Math.max(est.totalPaletes, 1)) * 100, 1)}%</td>
              <td className="py-1 text-right font-mono">{l.e && l.e.paletes > 0 ? fmtBrMax(l.e.und / l.e.paletes, 1) : "—"}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="py-1">Total</td>
            <td className="py-1 text-right font-mono">{rec ? fmtInt(rec.totalPaletes) : "—"}</td>
            <td className="py-1 text-right font-mono">{fmtInt(est.totalPaletes)}</td>
            <td className="py-1 text-right font-mono">100%</td>
            <td className="py-1 text-right font-mono">{est.totalPaletes > 0 ? fmtBrMax(undEst / est.totalPaletes, 1) : "—"}</td>
          </tr>
        </tbody>
      </table>
      {rec && (
        <p className="mt-2 text-[10px] text-white/45">
          {fmtInt(undRec)} volumes recebidos{dias > 0 ? ` em ${fmtInt(dias)} dias` : ""} · {fmtInt(undEst)} volumes em estoque.
        </p>
      )}
    </div>
  );
}
