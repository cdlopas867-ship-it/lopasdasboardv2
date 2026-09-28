import { useState } from "react";
import { cn } from "@/lib/utils";
import { fmtPeso, fmtMoeda, fmtInt } from "@/lib/format";
import type { Avaria } from "@/lib/avarias";

/* Card de resumo de avarias — mesmo estilo visual dos KPI cards.
 * Clicável: expande para mostrar a classificação por mês. */
export default function KpiAvarias({ avarias }: { avarias?: Avaria[] | undefined }) {
  const [open, setOpen] = useState(false);

  const totalPeso = avarias?.reduce((s, a) => s + a.pesoTotal, 0) ?? 0;
  const totalCusto = avarias?.reduce((s, a) => s + a.custo, 0) ?? 0;
  const itensUnicos = avarias ? new Set(avarias.map((a) => a.item)).size : 0;

  /* Tipos de avaria (motivo) — top 5 */
  const motivosMap = new Map<string, number>();
  for (const a of avarias ?? []) {
    const m = a.motivo || "Sem motivo";
    motivosMap.set(m, (motivosMap.get(m) ?? 0) + 1);
  }
  const motivosSorted = [...motivosMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

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
          Avarias / Mov.
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
        {fmtInt(avarias?.length ?? 0)}
      </p>
      <p className="mt-1 text-xs text-white/50">
        {itensUnicos} itens · {fmtPeso(totalPeso)}
      </p>
      <div className={cn("expand-grid", open && "expand-grid-open")}>
        <div>
          <p className="pt-4 text-sm leading-relaxed text-white/70">
            Custo total: <span className="font-semibold text-white">{fmtMoeda(totalCusto)}</span>
          </p>
          <p className="pt-4 text-sm leading-relaxed text-white/70">
            Tipos de avaria por motivo:
          </p>
          <dl className="mt-3 space-y-1.5 border-t border-white/20 pt-3">
            {motivosSorted.map(([motivo, count]) => (
              <div key={motivo} className="flex items-center justify-between text-xs">
                <dt className="text-white/50">{motivo}</dt>
                <dd className="font-semibold text-white">
                  {fmtInt(count)} vol
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <span className="mt-2 block text-[10px] font-medium tracking-widest text-primary uppercase opacity-0 transition-opacity group-hover:opacity-100">
        {open ? "Recolher" : "Ver resumo"} · 07
      </span>
    </button>
  );
}
