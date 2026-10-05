import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt } from "@/lib/format";
import type { ProducaoSemanalDia } from "@/lib/producao-semanal";

/* Cena "Produção da Semana" — mostra o que vai descer da fábrica
   nos próximos dias: previsto, entregue, pendente (unidades e tonelagem),
   número de ordens e lotes, com média diária. */
export default function CenaProducaoSemanal({
  anim,
  dias,
  onPausar,
}: {
  anim: boolean;
  dias?: ProducaoSemanalDia[] | undefined;
  onPausar?: (() => void) | undefined;
}) {
  if (!dias || dias.length === 0) {
    return (
      <div className="flex w-full flex-col items-center py-6 text-center">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Produção da Semana
        </p>
        <p className="video-sobe mt-4 font-serif text-2xl text-white/70">
          Sem dados de produção.
        </p>
      </div>
    );
  }

  const semana = dias.slice(-7);
  const maxTon = Math.max(...semana.map((d) => d.tonPrevisto), 1);

  const totalPrevisto = semana.reduce((s, d) => s + d.previsto, 0);
  const totalEntregue = semana.reduce((s, d) => s + d.entregue, 0);
  const totalPendente = semana.reduce((s, d) => s + d.pendente, 0);
  const totalTonPrev = semana.reduce((s, d) => s + d.tonPrevisto, 0);
  const totalTonPend = semana.reduce((s, d) => s + d.tonPendente, 0);
  const totalOrdens = semana.reduce((s, d) => s + d.ordens, 0);
  const mediaTon = totalTonPrev / semana.length;
  const pctEntregue = totalPrevisto > 0 ? (totalEntregue / totalPrevisto) * 100 : 0;

  return (
    <div className="flex w-full flex-col">
      <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
        Produção da Semana · O que vai descer
      </p>

      {/* Resumo */}
      <div className="video-sobe mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-baseline gap-2">
          <p className="font-serif text-3xl text-white sm:text-4xl">
            {fmtBrMax(totalTonPrev, 1)} t
          </p>
          <span className="text-sm text-white/60">previsto</span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="font-serif text-2xl text-brand-amber sm:text-3xl">
            {fmtBrMax(totalTonPend, 1)} t
          </p>
          <span className="text-sm text-white/60">pendente</span>
        </div>
        <span className="text-[10px] text-white/45">
          · {fmtInt(totalOrdens)} ordens · {semana.length} dias
        </span>
      </div>

      {/* Média e % entregue */}
      <div className="video-sobe mt-1 flex flex-wrap gap-x-6 gap-y-0.5 text-[10px] text-white/50" style={{ animationDelay: "0.15s" }}>
        <span>Média <span className="font-bold text-white/80">{fmtBrMax(mediaTon, 1)} t/dia</span></span>
        <span>Entregue <span className="font-bold text-green-400">{fmtBrMax(pctEntregue, 0)}%</span></span>
        <span>Pendente <span className="font-bold text-brand-amber">{fmtInt(totalPendente)} un</span></span>
      </div>

      {/* Tabela por dia */}
      <div className="video-sobe mt-4 overflow-x-auto" style={{ animationDelay: "0.2s" }}>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-1.5 pr-2 font-bold">Dia</th>
              <th className="pb-1.5 text-right font-bold">Previsto</th>
              <th className="pb-1.5 text-right font-bold">Entregue</th>
              <th className="pb-1.5 text-right font-bold">Pendente</th>
              <th className="pb-1.5 text-right font-bold">Ton</th>
              <th className="pb-1.5 text-right font-bold">Ordens</th>
            </tr>
          </thead>
          <tbody>
            {semana.map((d, i) => {
              const pctEnt = d.previsto > 0 ? (d.entregue / d.previsto) * 100 : 0;
              const cumpriu = pctEnt >= 100;
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
                  {/* Previsto (unidades) */}
                  <td className="py-1.5 text-right font-mono text-white/80">
                    {fmtInt(d.previsto)}
                  </td>
                  {/* Entregue (unidades) */}
                  <td className={cn("py-1.5 text-right font-mono", cumpriu ? "text-green-400" : "text-white/80")}>
                    {fmtInt(d.entregue)}
                  </td>
                  {/* Pendente (unidades) */}
                  <td className="py-1.5 text-right font-mono font-bold text-brand-amber">
                    {fmtInt(d.pendente)}
                  </td>
                  {/* Tonelagem com barra */}
                  <td className="py-1.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="hidden h-4 w-16 overflow-hidden rounded bg-white/8 sm:block">
                        <div
                          className={cn("video-barra-x h-full rounded", !anim && "video-pausada")}
                          style={{
                            width: `${Math.min((d.tonPrevisto / maxTon) * 100, 100)}%`,
                            background: cumpriu
                              ? "linear-gradient(90deg, #22c55e80, #22c55e)"
                              : "linear-gradient(90deg, #f59e0b80, #f59e0b)",
                            animationDelay: `${0.08 * i + 0.35}s`,
                          }}
                        />
                      </div>
                      <span className="font-mono font-bold text-white">{fmtBrMax(d.tonPrevisto, 1)}</span>
                    </div>
                  </td>
                  {/* Ordens */}
                  <td className="py-1.5 text-right font-mono text-white/60">
                    {fmtInt(d.ordens)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Total */}
          <tfoot>
            <tr className="border-t-2 border-white/30 font-bold">
              <td className="py-1.5 pr-2 text-white">Total</td>
              <td className="py-1.5 text-right font-mono text-white">{fmtInt(totalPrevisto)}</td>
              <td className="py-1.5 text-right font-mono text-green-400">{fmtInt(totalEntregue)}</td>
              <td className="py-1.5 text-right font-mono text-brand-amber">{fmtInt(totalPendente)}</td>
              <td className="py-1.5 text-right font-mono text-white">{fmtBrMax(totalTonPrev, 1)}</td>
              <td className="py-1.5 text-right font-mono text-white">{fmtInt(totalOrdens)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="video-sobe mt-3 text-[8px] leading-tight text-white/40" style={{ animationDelay: "0.6s" }}>
        * Produção prevista por dia (DT FINAL da ordem). Tonelagem = unidades × peso unitário da Base Estoque.
        Pendente = previsto − entregue. Ordens = número de ordens de produção no dia.
      </p>
    </div>
  );
}
