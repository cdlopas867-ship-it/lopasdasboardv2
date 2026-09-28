import { useState, useEffect } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { fmtMoeda, fmtTonDec, fmtPct } from "@/lib/format";
import { ITENS_PADRAO, type ItemFicha } from "@/data/itens-estoque";

/* Curva ABC (Pareto) por item — gráfico de linha:
   - Estoque: itens ordenados por valor, % acumulado do valor total.
   - Recebimento: itens ordenados pelo peso recebido (fluxo ABC), vem da
     aba "Base Recebimento" da planilha quando tem colunas de item. */

type PontoAbc = {
  idx: number;
  nome: string;
  valor: number;
  acum: number; // % acumulado
  classe: "A" | "B" | "C";
};

const CORES: Record<"A" | "B" | "C", string> = {
  A: "#6B8E23",
  B: "#d1a02b",
  C: "#c0473a",
};

const fmtTon = fmtTonDec;

function pareto(entradas: { nome: string; valor: number }[]): PontoAbc[] {
  const total = entradas.reduce((s, e) => s + e.valor, 0) || 1;
  let acum = 0;
  return [...entradas]
    .sort((a, b) => b.valor - a.valor)
    .map((e, i) => {
      const anterior = (acum / total) * 100;
      acum += e.valor;
      const acumPct = (acum / total) * 100;
      const classe = anterior < 80 ? "A" : anterior < 95 ? "B" : "C";
      return { idx: i + 1, nome: e.nome, valor: e.valor, acum: +acumPct.toFixed(1), classe };
    });
}

function nomeCurto(desc: string): string {
  return desc
    .replace(/^VOL CX /i, "")
    .replace(/\s*\d+[.,]\d+\s*X.*$/i, "")
    .trim();
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function AbcTooltip({ active, payload, fmtValor }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0]!.payload as PontoAbc;
  return (
    <div className="max-w-[240px] rounded-lg border bg-card p-3 text-xs shadow-xl">
      <p className="font-semibold text-foreground">
        #{p.idx} · {p.nome}
      </p>
      <p className="mt-1 text-muted-foreground">{fmtValor(p.valor)}</p>
      <p className="mt-0.5 font-bold" style={{ color: CORES[p.classe] }}>
        {fmtPct(p.acum)} acumulado · classe {p.classe}
      </p>
    </div>
  );
}

function GraficoAbc({
  titulo,
  subtitulo,
  pontos,
  fmtValor,
  msgVazia,
}: {
  titulo: string;
  subtitulo: string;
  pontos: PontoAbc[];
  fmtValor: (v: number) => string;
  msgVazia: string;
}) {
  const [aberta, setAberta] = useState<"A" | "B" | "C" | null>(null);
  const [autoIdx, setAutoIdx] = useState(0);
  const [userHover, setUserHover] = useState(false);

  /* Um card por classe (A, B, C) — surge nos pontos de transição da linha */
  const destaques = (["A", "B", "C"] as const)
    .map((c) => {
      const itensClasse = pontos.filter((p) => p.classe === c);
      return itensClasse[itensClasse.length - 1] ?? null;
    })
    .filter(Boolean) as PontoAbc[];
  const cicloMs = 6000;
  const drawMs = cicloMs * 0.4;
  const intervalMs = Math.max(400, drawMs / Math.max(destaques.length, 1));
  useEffect(() => {
    if (userHover || !destaques.length) return;
    let i = 0;
    setAutoIdx(0);
    const tick = () => {
      i = (i + 1) % destaques.length;
      setAutoIdx(i);
      timeout = setTimeout(tick, i === 0 ? cicloMs - drawMs : intervalMs);
    };
    let timeout = setTimeout(tick, intervalMs);
    return () => clearTimeout(timeout);
  }, [userHover, destaques.length, intervalMs]);

  if (!pontos.length) {
    return (
      <div className="flex min-h-[280px] items-center rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
        {msgVazia}
      </div>
    );
  }
  const n = pontos.length;
  const somaValor = pontos.reduce((s, p) => s + p.valor, 0);
  const classes = (["A", "B", "C"] as const).map((c) => {
    const itens = pontos.filter((p) => p.classe === c);
    return {
      c,
      n: itens.length,
      pctItens: (itens.length / n) * 100,
      pctValor: itens.length ? (itens.reduce((s, p) => s + p.valor, 0) / somaValor) * 100 : 0,
    };
  });

  return (
    <div className="grafico-surge rounded-2xl border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl">{titulo}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>
        </div>
        <div className="flex gap-2 text-[10px] font-bold tracking-wider uppercase">
          {classes.map((cl) => (
            <span key={cl.c} className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2.5 rounded-sm" style={{ background: CORES[cl.c] }} />
              {cl.c}
            </span>
          ))}
        </div>
      </div>

      <div
        onMouseEnter={() => setUserHover(true)}
        onMouseLeave={() => setUserHover(false)}
        className="relative mt-4 h-64 grafico-loop"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={pontos} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
            <XAxis
              dataKey="idx"
              tick={{ fontSize: 10 }}
              stroke="#8a8a80"
              label={{ value: "itens (ranking)", position: "insideBottomRight", offset: -2, fontSize: 10, fill: "#8a8a80" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
              stroke="#8a8a80"
              width={44}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<AbcTooltip fmtValor={fmtValor} />} />
            <ReferenceLine y={80} stroke={CORES.A} strokeDasharray="5 4" />
            <ReferenceLine y={95} stroke={CORES.B} strokeDasharray="5 4" />
            <Line
              type="monotone"
              dataKey="acum"
              stroke={CORES.A}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive
              animationDuration={1500}
              animationEasing="ease-out"
              animationBegin={200}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Card automático — um card por classe (A, B, C) surgindo na linha */}
        {!userHover && destaques[autoIdx] && (() => {
          const p = destaques[autoIdx]!;
          const posReal = p.idx - 1;
          const n = pontos.length;
          const xPct = (posReal / Math.max(n - 1, 1)) * 100;
          const yPct = (1 - p.acum / 100) * 100;
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
              <div className="abc-auto-card max-w-[240px] rounded-lg border bg-card p-3 text-xs shadow-xl">
                <p className="font-semibold text-foreground">
                  #{p.idx} · {p.nome}
                </p>
                <p className="mt-1 text-muted-foreground">{fmtValor(p.valor)}</p>
                <p className="mt-0.5 font-bold" style={{ color: CORES[p.classe] }}>
                  {fmtPct(p.acum)} acumulado · classe {p.classe}
                </p>
              </div>
              {/* Ponto destacado na linha */}
              <div
                className="abc-auto-dot absolute size-3 rounded-full border-2 border-white"
                style={{
                  background: CORES[p.classe],
                  left: "50%",
                  top: "calc(100% + 8px)",
                  transform: "translate(-50%, -50%)",
                }}
              />
            </div>
          );
        })()}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {classes.map((cl) => (
          <button
            key={cl.c}
            type="button"
            onClick={() => setAberta(aberta === cl.c ? null : cl.c)}
            aria-expanded={aberta === cl.c}
            className={cn(
              "cursor-pointer rounded-lg bg-secondary/70 p-3 text-left transition-colors hover:bg-secondary",
              cl.c === "A" && "border border-primary/30",
              aberta === cl.c && "border bg-secondary",
            )}
            style={aberta === cl.c ? { borderColor: CORES[cl.c] } : undefined}
          >
            <span className="block text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Classe {cl.c}
            </span>
            <span className="mt-1 block text-sm font-bold text-foreground">
              {cl.n} {cl.n === 1 ? "item" : "itens"} · {fmtPct(cl.pctValor)}
            </span>
            <span className="block text-[10px] text-muted-foreground">{fmtPct(cl.pctItens)} dos itens</span>
          </button>
        ))}
      </div>

      <div className={cn("expand-grid mt-3", aberta && "expand-grid-open")}>
        {aberta && (
          <div className="overflow-hidden rounded-xl border">
            <div className="max-h-64 overflow-y-auto divide-y text-sm">
              {pontos
                .filter((p) => p.classe === aberta)
                .map((p) => (
                  <div key={p.idx} className="flex items-center justify-between gap-4 px-4 py-2">
                    <span className="truncate text-muted-foreground">
                      #{p.idx} · {p.nome}
                    </span>
                    <span className="shrink-0 font-semibold text-foreground">
                      {fmtValor(p.valor)}{" "}
                      <span className="font-normal text-muted-foreground">· {fmtPct((p.valor / somaValor) * 100)}</span>
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CurvaAbc({
  itens,
  recebimentoItens,
}: {
  itens?: ItemFicha[] | undefined;
  recebimentoItens?: { nome: string; ton: number }[] | undefined;
}) {
  const base = itens && itens.length ? itens : ITENS_PADRAO;
  const estoque = pareto(
    base.map((i) => ({ nome: `${nomeCurto(i.desc)} · ${i.item}`, valor: i.valor })),
  );
  const recebimento = recebimentoItens?.length
    ? pareto(recebimentoItens.map((r) => ({ nome: r.nome, valor: r.ton })))
    : [];

  return (
    <section id="curva-abc" className="border-t bg-card/60 px-4 py-12 sm:px-8 sm:py-16 scroll-mt-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl">Curva ABC</h2>
            <p className="mt-2 text-muted-foreground">
              Pareto por item em gráfico de linha — poucos itens concentram quase todo o valor.
            </p>
          </div>
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            A ≤ 80% · B ≤ 95% · C restante
          </span>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <GraficoAbc
            titulo="Curva ABC do Estoque"
            subtitulo="Itens ordenados por valor em estoque — % acumulado do valor total."
            pontos={estoque}
            fmtValor={fmtMoeda}
            msgVazia="Sem itens em estoque para montar a curva."
          />
          <GraficoAbc
            titulo="Fluxo ABC do Recebimento"
            subtitulo="Itens ordenados pelo peso recebido — % acumulado do fluxo."
            pontos={recebimento}
            fmtValor={fmtTon}
            msgVazia="Sem dados por item — a planilha do Drive não trouxe a aba Base Recebimento com colunas de item e peso recebido."
          />
        </div>
      </div>
    </section>
  );
}
