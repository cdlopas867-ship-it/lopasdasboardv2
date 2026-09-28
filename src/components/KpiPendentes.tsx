import { useState } from "react";
import { cn } from "@/lib/utils";
import { fmtPeso, fmtInt } from "@/lib/format";
import type { PendenteProducao, AlertaPendente } from "@/lib/pendentes";
import { alertaPorData } from "@/lib/pendentes";

const ALERTAS: Record<AlertaPendente, { label: string; dot: string; text: string }> = {
  critico: { label: "Crítico", dot: "bg-red-500", text: "text-red-500" },
  prazo: { label: "No prazo", dot: "bg-green-500", text: "text-green-500" },
};

/* Card de resumo de pendências de produção — mesmo estilo visual dos KPI cards.
 * Clicável: expande para mostrar a classificação por alerta de atraso. */
export default function KpiPendentes({
  pendentes,
}: {
  pendentes?: PendenteProducao[] | undefined;
}) {
  const [open, setOpen] = useState(false);

  const comAlerta = (pendentes ?? []).map((p) => ({ ...p, alerta: alertaPorData(p.dtFinal) }));
  const totalPeso = pendentes?.reduce((s, p) => s + p.pesoPendente, 0) ?? 0;
  const counts = { critico: 0, prazo: 0 } as Record<AlertaPendente, number>;
  const pesos = { critico: 0, prazo: 0 } as Record<AlertaPendente, number>;
  for (const p of comAlerta) {
    counts[p.alerta]++;
    pesos[p.alerta] += p.pesoPendente;
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      className={cn(
        "card-lift group cursor-pointer rounded-2xl border border-white/20 bg-white/10 p-6 text-left backdrop-blur-md",
        open && "border-primary/40 bg-white/15",
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold tracking-[0.15em] text-white/60 uppercase">
          Pendências Produção
        </span>
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full border border-white/30 text-xs text-primary transition-transform duration-300",
            open && "rotate-45 border-primary bg-primary text-primary-foreground",
          )}
        >
          +
        </span>
      </div>
      <p className="mt-3 font-serif text-4xl tracking-tight text-white group-hover:text-primary">
        {fmtPeso(totalPeso)}
      </p>
      <p className="mt-1 text-xs text-white/50">
        {fmtInt(pendentes?.length ?? 0)} itens pendentes
      </p>
      <div className={cn("expand-grid", open && "expand-grid-open")}>
        <div>
          <p className="pt-4 text-sm leading-relaxed text-white/70">
            Classificação por status:
          </p>
          <dl className="mt-3 space-y-1.5 border-t border-white/20 pt-3">
            {(Object.keys(ALERTAS) as AlertaPendente[]).map((key) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <dt className="flex items-center gap-2 text-white/50">
                  <span className={cn("size-2 rounded-full", ALERTAS[key].dot)} />
                  {ALERTAS[key].label}
                </dt>
                <dd className="font-semibold text-white">
                  {counts[key]} itens · {fmtPeso(pesos[key])}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <span className="mt-2 block text-[10px] font-medium tracking-widest text-primary uppercase opacity-0 transition-opacity group-hover:opacity-100">
        {open ? "Recolher" : "Ver resumo"} · 06
      </span>
    </button>
  );
}
