import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt } from "@/lib/format";
import type { RecebimentoSemanalDia } from "./VideoResumoDashboard";

const CORES_TAMANHO: Record<string, string> = {
  P: "#22c55e",
  M: "#3b82f6",
  G: "#f97316",
  GG: "#a855f7",
};

/* Cena "Recebimento da Semana" — mostra os últimos dias de recebimento
   com tonelagem, % da meta (330), tipo de palete que desceu (P/M/G/GG),
   QTD (volumes) e QTD por palete. */
export default function CenaRecebimentoSemanal({
  anim,
  dias,
  onPausar,
}: {
  anim: boolean;
  dias?: RecebimentoSemanalDia[] | undefined;
  onPausar?: (() => void) | undefined;
}) {
  if (!dias || dias.length === 0) {
    return (
      <div className="flex w-full flex-col items-center py-6 text-center">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Recebimento da Semana
        </p>
        <p className="video-sobe mt-4 font-serif text-2xl text-white/70">
          Sem dados de recebimento por palete.
        </p>
      </div>
    );
  }

  /* Últimos 7 dias */
  const semana = dias.slice(-7);
  const maxTon = Math.max(...semana.map((d) => d.ton), 330);

  const totalTon = semana.reduce((s, d) => s + d.ton, 0);
  const totalQtd = semana.reduce((s, d) => s + d.totalQtd, 0);
  const totalPaletes = semana.reduce((s, d) => s + d.totalPaletes, 0);

  return (
    <div className="flex w-full flex-col">
      <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
        Recebimento da Semana · Meta 330 t/dia
      </p>

      {/* Resumo */}
      <div className="video-sobe mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-baseline gap-2">
          <p className="font-serif text-3xl text-white sm:text-4xl">
            {fmtBrMax(totalTon, 1)} t
          </p>
          <span className="text-sm text-white/60">total</span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="font-serif text-2xl text-brand-amber sm:text-3xl">
            {fmtInt(totalPaletes)}
          </p>
          <span className="text-sm text-white/60">paletes</span>
        </div>
        <span className="text-[10px] text-white/45">
          · {fmtInt(totalQtd)} volumes · {semana.length} dias
        </span>
      </div>

      {/* Tabela por dia */}
      <div className="video-sobe mt-4 overflow-x-auto" style={{ animationDelay: "0.2s" }}>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-1.5 pr-2 font-bold">Dia</th>
              <th className="pb-1.5 text-right font-bold">Ton</th>
              <th className="pb-1.5 text-right font-bold">% Meta</th>
              <th className="pb-1.5 pl-2 font-bold">Tipos de palete</th>
              <th className="pb-1.5 text-right font-bold">QTD</th>
              <th className="pb-1.5 text-right font-bold">Paletes</th>
            </tr>
          </thead>
          <tbody>
            {semana.map((d, i) => {
              const pctMeta = (d.ton / d.meta) * 100;
              const cumpriu = d.ton >= d.meta;
              return (
                <tr
                  key={d.iso}
                  className="video-sobe border-b border-white/10 last:border-0"
                  style={{ animationDelay: `${0.08 * i + 0.25}s` }}
                >
                  {/* Dia + data */}
                  <td className="py-1.5 pr-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-white/90">{d.dia}</span>
                      <span className="text-[9px] text-white/45">{d.data}</span>
                    </div>
                  </td>
                  {/* Tonelada com barra */}
                  <td className="py-1.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="hidden h-4 w-16 overflow-hidden rounded bg-white/8 sm:block">
                        <div
                          className={cn("video-barra-x h-full rounded", !anim && "video-pausada")}
                          style={{
                            width: `${Math.min((d.ton / maxTon) * 100, 100)}%`,
                            background: cumpriu
                              ? "linear-gradient(90deg, #22c55e80, #22c55e)"
                              : "linear-gradient(90deg, #f59e0b80, #f59e0b)",
                            animationDelay: `${0.08 * i + 0.35}s`,
                          }}
                        />
                      </div>
                      <span className="font-mono font-bold text-white">{fmtBrMax(d.ton, 1)}</span>
                    </div>
                  </td>
                  {/* % Meta */}
                  <td className={cn("py-1.5 text-right font-mono font-bold", cumpriu ? "text-green-400" : "text-brand-amber")}>
                    {fmtBrMax(pctMeta, 0)}%
                  </td>
                  {/* Tipos de palete que desceram */}
                  <td className="py-1.5 pl-2">
                    <div className="flex flex-wrap gap-1">
                      {d.porTamanho.map((t) => {
                        const cor = CORES_TAMANHO[t.tamanho] ?? "#6b7280";
                        return (
                          <span
                            key={t.tamanho}
                            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold"
                            style={{ background: `${cor}20`, color: cor }}
                          >
                            {t.tamanho}
                            <span className="font-mono">{fmtInt(t.und)}</span>
                            <span className="text-white/40">·</span>
                            <span className="font-mono">{fmtInt(t.paletes)}p</span>
                          </span>
                        );
                      })}
                      {d.porTamanho.length === 0 && (
                        <span className="text-[9px] text-white/30">—</span>
                      )}
                    </div>
                  </td>
                  {/* QTD total */}
                  <td className="py-1.5 text-right font-mono text-white/80">
                    {fmtInt(d.totalQtd)}
                  </td>
                  {/* Paletes total */}
                  <td className="py-1.5 text-right font-mono font-bold text-white">
                    {fmtInt(d.totalPaletes)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Total */}
          <tfoot>
            <tr className="border-t-2 border-white/30 font-bold">
              <td className="py-1.5 pr-2 text-white">Total</td>
              <td className="py-1.5 text-right font-mono text-white">{fmtBrMax(totalTon, 1)}</td>
              <td className="py-1.5 text-right font-mono text-white/60">
                {fmtBrMax((totalTon / (330 * semana.length)) * 100, 0)}%
              </td>
              <td className="py-1.5 pl-2 text-white/50">média {fmtBrMax(totalTon / semana.length, 1)} t/dia</td>
              <td className="py-1.5 text-right font-mono text-white">{fmtInt(totalQtd)}</td>
              <td className="py-1.5 text-right font-mono text-white">{fmtInt(totalPaletes)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="video-sobe mt-3 text-[8px] leading-tight text-white/40" style={{ animationDelay: "0.6s" }}>
        * Tonelagem e paletes por dia da Base Recebimento cruzada com a configuração de pallet (ENGENHARIA 014).
        Meta diária = 330 t. QTD = volumes recebidos. Paletes = ⌈QTD ÷ und/pallet⌉.
      </p>
    </div>
  );
}
