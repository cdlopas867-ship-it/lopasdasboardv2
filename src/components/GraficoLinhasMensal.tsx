import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { fmtTonDec, fmtBrMax } from "@/lib/format";

type DiaCarregamento = {
  data: string;
  recebido: number;
  carregado: number;
  cargas: number;
};

type RespostaCarregamento = {
  dias: DiaCarregamento[];
  totalRecebido: number;
  totalCarregado: number;
  totalCargas: number;
  mediaPct: number;
};

const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

/* Agrupa os dados diários por mês (formato "dd/mm") somando recebido e carregado. */
function agruparPorMes(dias: DiaCarregamento[]) {
  const mapa = new Map<number, { mes: string; recebido: number; carregado: number }>();
  for (const d of dias) {
    const partes = d.data.split("/");
    const mesIdx = Number(partes[1]) - 1;
    if (mesIdx < 0 || mesIdx > 11) continue;
    const atual = mapa.get(mesIdx) ?? { mes: MESES[mesIdx]!, recebido: 0, carregado: 0 };
    atual.recebido += d.recebido;
    atual.carregado += d.carregado;
    mapa.set(mesIdx, atual);
  }
  return [...mapa.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

export function GraficoLinhasMensal() {
  const [dados, setDados] = useState<RespostaCarregamento | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/carregamento")
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao buscar dados");
        return r.json();
      })
      .then((d: RespostaCarregamento) => setDados(d))
      .catch((e) => setErro(e.message));
  }, []);

  if (erro) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border/50 bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar os dados de recebido vs. carregado.
        </p>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border/50 bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">Carregando gráfico…</p>
      </div>
    );
  }

  const dadosMensais = agruparPorMes(dados.dias);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
      <div className="border-b p-6 pb-4">
        <h3 className="font-serif text-2xl">Recebido × Carregado — Mensal</h3>
        <p className="text-xs text-muted-foreground">
          Evolução mensal das toneladas recebidas vs. carregadas
        </p>
      </div>

      <div className="p-6">
        <div className="mb-4 flex items-center gap-6 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          <span className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-brand-amber" /> Recebido
          </span>
          <span className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-primary" /> Carregado
          </span>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dadosMensais} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={(v) => `${v} t`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              formatter={(value: number, name: string) => [
                fmtTonDec(value),
                name === "recebido" ? "Recebido" : "Carregado",
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
              formatter={(value) =>
                value === "recebido" ? "Recebido" : "Carregado"
              }
            />
            <Line
              type="monotone"
              dataKey="recebido"
              stroke="hsl(var(--brand-amber))"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "hsl(var(--brand-amber))" }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="carregado"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "hsl(var(--primary))" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Resumo mensal em tabela */}
      <div className="overflow-x-auto border-t">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              <th className="px-4 py-3">Mês</th>
              <th className="px-4 py-3 text-right">Recebido (t)</th>
              <th className="px-4 py-3 text-right">Carregado (t)</th>
              <th className="px-4 py-3 text-right">Carregado/Recebido</th>
            </tr>
          </thead>
          <tbody>
            {dadosMensais.map((m) => {
              const pct = m.recebido > 0 ? (m.carregado / m.recebido) * 100 : 0;
              const acima = pct >= 100;
              return (
                <tr key={m.mes} className="border-b last:border-0 hover:bg-secondary/40">
                  <td className="px-4 py-3 font-medium text-foreground">{m.mes}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {fmtTonDec(m.recebido)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-primary">
                    {fmtTonDec(m.carregado)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right tabular-nums font-semibold",
                      acima ? "text-primary" : "text-brand-amber",
                    )}
                  >
                    {fmtBrMax(pct, 1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
