import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtBrMax, fmtTonDec } from "@/lib/format";

type RespostaCarregamento = {
  totalRecebido: number;
  totalCarregado: number;
  totalCargas: number;
  mediaPct: number;
};

/* Card de resumo da saúde do estoque — mesmo estilo visual dos KPI cards.
 * Busca os dados de recebido vs. carregado e mostra a média percentual.
 * Clicável: expande para mostrar o detalhamento. */
export default function KpiSaudeEstoque() {
  const [open, setOpen] = useState(false);
  const [dados, setDados] = useState<RespostaCarregamento | null>(null);

  useEffect(() => {
    fetch("/api/carregamento")
      .then((r) => {
        if (!r.ok) throw new Error("Falha");
        return r.json();
      })
      .then((d: RespostaCarregamento) => setDados(d))
      .catch(() => {});
  }, []);

  const mediaPct = dados?.mediaPct ?? 0;
  const saudavel = mediaPct >= 100;
  const saldo = (dados?.totalRecebido ?? 0) - (dados?.totalCarregado ?? 0);

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
          Saúde do Estoque
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
      <p
        className={cn(
          "mt-3 font-serif text-4xl tracking-tight text-white group-hover:text-primary",
          saudavel && "text-primary",
        )}
      >
        {fmtBrMax(mediaPct, 1)}%
      </p>
      <p className="mt-1 text-xs text-white/50">
        Carregado / Recebido
      </p>
      <div className={cn("expand-grid", open && "expand-grid-open")}>
        <div>
          <p className="pt-4 text-sm leading-relaxed text-white/70">
            {saudavel
              ? "Carregamento superando recebimento — giro saudável do estoque."
              : "Recebimento acima do carregamento — estoque acumulando."}
          </p>
          <dl className="mt-3 space-y-1.5 border-t border-white/20 pt-3">
            <div className="flex justify-between text-xs">
              <dt className="text-white/50">Total Recebido</dt>
              <dd className="font-semibold text-white">{fmtTonDec(dados?.totalRecebido ?? 0)}</dd>
            </div>
            <div className="flex justify-between text-xs">
              <dt className="text-white/50">Total Carregado</dt>
              <dd className="font-semibold text-white">{fmtTonDec(dados?.totalCarregado ?? 0)}</dd>
            </div>
            <div className="flex justify-between text-xs">
              <dt className="text-white/50">Saldo</dt>
              <dd className={cn("font-semibold", saldo <= 0 ? "text-primary" : "text-brand-amber")}>
                {saldo >= 0 ? "+" : ""}{fmtTonDec(saldo)}
              </dd>
            </div>
            <div className="flex justify-between text-xs">
              <dt className="text-white/50">N° de Cargas</dt>
              <dd className="font-semibold text-white">{dados?.totalCargas ?? 0}</dd>
            </div>
          </dl>
        </div>
      </div>
      <span className="mt-2 block text-[10px] font-medium tracking-widest text-primary uppercase opacity-0 transition-opacity group-hover:opacity-100">
        {open ? "Recolher" : "Ver resumo"} · 08
      </span>
    </button>
  );
}
