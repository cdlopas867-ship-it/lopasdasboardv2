import { useState, useEffect } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtPeso } from "@/lib/format";
import type { PendenteProducao, AlertaPendente } from "@/lib/pendentes";
import { alertaPorData } from "@/lib/pendentes";

const CORES: Record<AlertaPendente, string> = {
  critico: "#c0473a",
  prazo: "#6B8E23",
};

const ALERTAS: Record<
  AlertaPendente,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  critico: {
    label: "Crítico",
    dot: "bg-red-500",
    text: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-l-red-500",
  },
  prazo: {
    label: "No prazo",
    dot: "bg-green-500",
    text: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-l-green-500",
  },
};

const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

type ItemComAlerta = PendenteProducao & { alerta: AlertaPendente };

function mesLabel(key: string): string {
  const [ano = "", mes = ""] = key.split("-");
  return `${MESES[Number(mes) - 1] ?? "?"}/${ano.slice(2)}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
  return (
    <div className="rounded-lg border bg-card p-3 text-xs shadow-xl">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="mt-1 flex items-center gap-2">
          <span className="size-2.5 rounded-sm" style={{ background: p.stroke }} />
          <span className="text-muted-foreground">
            {ALERTAS[p.dataKey as AlertaPendente]?.label ?? p.dataKey}:
          </span>
          <span className="font-semibold text-foreground">{p.value} t</span>
        </p>
      ))}
      <p className="mt-1.5 border-t pt-1 font-bold text-foreground">
        Total: {total.toFixed(1)} t
      </p>
    </div>
  );
}

export default function PendentesProducao({
  pendentes,
  atualizadoEm,
}: {
  pendentes?: PendenteProducao[] | undefined;
  atualizadoEm?: string;
}) {
  const [autoIdx, setAutoIdx] = useState(0);
  const [userHover, setUserHover] = useState(false);

  const comAlerta: ItemComAlerta[] = (pendentes ?? [])
    .map((p) => ({ ...p, alerta: alertaPorData(p.dtFinal) }))
    .sort((a, b) => a.dtFinal.localeCompare(b.dtFinal));

  /* Agrupar por mês (DT FINAL) */
  const porMes = new Map<string, ItemComAlerta[]>();
  for (const p of comAlerta) {
    const key = p.dtFinal.slice(0, 7) || "s/data";
    if (!porMes.has(key)) porMes.set(key, []);
    porMes.get(key)!.push(p);
  }
  const meses = [...porMes.keys()].sort();

  /* Dados do gráfico */
  const chartData = meses.map((m) => {
    const items = porMes.get(m)!;
    const peso = { critico: 0, prazo: 0 } as Record<AlertaPendente, number>;
    for (const p of items) peso[p.alerta] += p.pesoPendente / 1000;
    return {
      mes: mesLabel(m),
      critico: +peso.critico.toFixed(1),
      prazo: +peso.prazo.toFixed(1),
    };
  });

  /* Card automático por mês — sincronizado com o desenho da linha */
  const cicloMs = 6000;
  const drawMs = cicloMs * 0.4;
  const intervalMs = Math.max(400, drawMs / Math.max(chartData.length, 1));
  useEffect(() => {
    if (userHover || !chartData.length) return;
    let i = 0;
    setAutoIdx(0);
    const tick = () => {
      i = (i + 1) % chartData.length;
      setAutoIdx(i);
      timer = setTimeout(tick, i === 0 ? cicloMs - drawMs : intervalMs);
    };
    let timer = setTimeout(tick, intervalMs);
    return () => clearTimeout(timer);
  }, [userHover, chartData.length, intervalMs]);

  return (
    <section id="pendencias" className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-20 scroll-mt-20">
      <div className="mb-12">
        <h2 className="font-serif text-3xl sm:text-4xl">Pendências de Produção</h2>
        <div className="mt-2 flex items-center gap-3">
          <p className="text-muted-foreground">
            Peso pendente por mês — crítico (meses passados) e no prazo.
          </p>
          {atualizadoEm && (
            <span className="rounded-full border border-border bg-card px-3 py-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Atualizado em {atualizadoEm}
            </span>
          )}
        </div>
      </div>

      {/* Gráfico de linha — peso pendente por mês */}
      <div className="grafico-surge mb-8 rounded-2xl border bg-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-serif text-2xl">Peso pendente por mês</h3>
          <div className="flex gap-3 text-[10px] font-bold tracking-wider uppercase">
            {(Object.keys(ALERTAS) as AlertaPendente[]).map((key) => (
              <span key={key} className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2.5 rounded-sm" style={{ background: CORES[key] }} />
                {ALERTAS[key].label}
              </span>
            ))}
          </div>
        </div>
        <div
          onMouseEnter={() => setUserHover(true)}
          onMouseLeave={() => setUserHover(false)}
          className="relative h-64 grafico-loop"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="#8a8a80" />
              <YAxis
                tick={{ fontSize: 10 }}
                stroke="#8a8a80"
                width={44}
                tickFormatter={(v) => `${v}t`}
              />
              <Tooltip content={<ChartTooltip />} />
              {(Object.keys(ALERTAS) as AlertaPendente[]).map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CORES[key]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive
                  animationDuration={1500}
                  animationEasing="ease-out"
                  animationBegin={key === "critico" ? 200 : 500}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          {chartData.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground/60">
                Aguardando importação de pendências
              </p>
            </div>
          )}

          {/* Card automático — surge por mês conforme a linha desenha */}
          {!userHover && chartData[autoIdx] && (() => {
            const d = chartData[autoIdx]!;
            const n = chartData.length;
            const total = d.critico + d.prazo;
            const xPct = (autoIdx / Math.max(n - 1, 1)) * 100;
            const yPct = (1 - Math.min(total, 100) / 100) * 100;
            return (
              <div
                key={autoIdx}
                className="pointer-events-none absolute z-10"
                style={{
                  left: `${xPct}%`,
                  top: `${yPct}%`,
                  transform: "translate(-50%, calc(-100% - 12px))",
                }}
              >
                <div className="abc-auto-card max-w-[200px] rounded-lg border bg-card p-3 text-xs shadow-xl">
                  <p className="font-semibold text-foreground">{d.mes}</p>
                  <p className="mt-1 font-bold text-foreground">{total.toFixed(1)} t</p>
                  <div className="mt-1 space-y-0.5">
                    {(["critico", "prazo"] as AlertaPendente[]).map((k) => (
                      <p key={k} className="flex items-center gap-1.5" style={{ color: CORES[k] }}>
                        <span className="size-2 rounded-sm" style={{ background: CORES[k] }} />
                        <span className="font-semibold">{d[k]} t</span>
                        <span className="text-muted-foreground">· {ALERTAS[k].label}</span>
                      </p>
                    ))}
                  </div>
                </div>
                <div
                  className="abc-auto-dot absolute size-3 rounded-full border-2 border-white"
                  style={{
                    background: CORES.critico,
                    left: "50%",
                    top: "calc(100% + 8px)",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
