import { cn } from "@/lib/utils";
import { fmtInt } from "@/lib/format";
import type { VideoPaletas } from "./VideoResumoDashboard";

const CORES: Record<string, string> = { P: "#22c55e", M: "#3b82f6", G: "#f97316", GG: "#a855f7" };
const ORDEM = ["P", "M", "G", "GG"];

/* Cena "Paletes por tamanho" — versão resumida:
   métricas principais + paletes por tamanho em uma linha compacta. */
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

  const dias = paletas?.diasRecebidos ?? 0;
  const undEst = est.porTamanho.reduce((s, x) => s + x.und, 0);
  const totalQtdRec = paletas?.totalQtdRecebido ?? rec?.porTamanho.reduce((s, x) => s + x.und, 0) ?? 0;

  const metricas: [string, string][] = [
    ["QTD em estoque", fmtInt(undEst)],
    ["QTD recebida", fmtInt(totalQtdRec)],
    ["Média QTD/dia", dias > 0 ? fmtInt(Math.round(totalQtdRec / dias)) : "—"],
    ["Paletes estoque", fmtInt(est.totalPaletes)],
  ];

  return (
    <div className="flex w-full flex-col">
      <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
        Paletes · QTD Recebida × Estoque
      </p>

      {/* Métricas principais */}
      <div className="video-sobe mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" style={{ animationDelay: "0.1s" }}>
        {metricas.map(([r, v]) => (
          <div key={r} className="rounded-xl border border-white/15 bg-white/5 p-3">
            <p className="font-serif text-2xl text-white sm:text-3xl">{v}</p>
            <p className="mt-1 text-[8px] font-bold tracking-[0.25em] text-white/55 uppercase">{r}</p>
          </div>
        ))}
      </div>

      {/* Paletes por tamanho — resumo compacto em uma linha por tamanho */}
      <div className="video-sobe mt-4 space-y-2" style={{ animationDelay: "0.2s" }}>
        <p className="text-[9px] font-bold tracking-[0.3em] text-white/50 uppercase">Paletes por tamanho</p>
        {linhas.map((l, i) => {
          const cor = CORES[l.t] ?? "#6b7280";
          const palEst = l.e?.paletes ?? 0;
          const pct = ((palEst / Math.max(est.totalPaletes, 1)) * 100).toFixed(0);
          return (
            <div key={l.t} className="video-sobe flex items-center gap-3" style={{ animationDelay: `${0.08 * i + 0.3}s` }}>
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                style={{ background: `${cor}25`, color: cor }}
              >
                {l.t}
              </span>
              {/* barra de proporção */}
              <div className="h-2 flex-1 overflow-hidden rounded bg-white/8">
                <div
                  className={cn("video-barra-x h-full rounded", !anim && "video-pausada")}
                  style={{ width: `${Math.max((palEst / Math.max(est.totalPaletes, 1)) * 100, 2)}%`, background: cor, animationDelay: `${0.08 * i + 0.4}s` }}
                />
              </div>
              <span className="w-12 text-right font-mono text-xs font-bold text-white">{fmtInt(palEst)}</span>
              <span className="w-9 text-right font-mono text-[10px] text-white/50">{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Resumo final */}
      <p className="video-sobe mt-4 text-[11px] text-white/55" style={{ animationDelay: "0.6s" }}>
        {fmtInt(totalQtdRec)} volumes recebidos{dias > 0 ? ` em ${fmtInt(dias)} dias` : ""} · {fmtInt(undEst)} volumes em estoque · {fmtInt(est.totalPaletes)} paletes.
      </p>
    </div>
  );
}
