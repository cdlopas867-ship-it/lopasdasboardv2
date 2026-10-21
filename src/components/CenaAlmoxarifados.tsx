/* Cena — Controle de almoxarifados (FOCCOERP REST0330).
 * Barras por almoxarifado, com alternância Saldo (un.) × Valor (R$).
 * Barras proporcionais ao maior almoxarifado da métrica ativa. */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { fmtBr, fmtBrMax, fmtInt, fmtMi } from "@/lib/format";
import {
  ALMOXARIFADOS,
  ALMOXARIFADOS_DATA_BASE,
  ALMOXARIFADOS_TOTAL,
} from "@/data/almoxarifados";

type Metrica = "saldo" | "valor";

export default function CenaAlmoxarifados({
  anim,
  onPausar,
}: {
  anim: boolean;
  onPausar?: (() => void) | undefined;
}) {
  const [metrica, setMetrica] = useState<Metrica>("saldo");
  const total = ALMOXARIFADOS_TOTAL[metrica];
  const linhas = [...ALMOXARIFADOS].sort((a, b) => b[metrica] - a[metrica]);
  const maior = Math.max(...linhas.map((l) => l[metrica]), 1);
  const fmt = (v: number) => (metrica === "saldo" ? `${fmtInt(v)} un` : fmtMi(v));

  return (
    <div className="mx-auto w-full max-w-xl pb-6">
      <p className="video-sobe text-center text-[11px] font-bold uppercase tracking-[0.3em] text-white/70">
        Controle de Almoxarifados
      </p>

      <div className="video-sobe mt-3 flex justify-center gap-2" style={{ animationDelay: "0.1s" }}>
        {(["saldo", "valor"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPausar?.();
              setMetrica(m);
            }}
            className={cn(
              "cursor-pointer rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors",
              metrica === m
                ? "border-brand-amber bg-brand-amber/90 text-brand-dark"
                : "border-white/25 bg-white/10 text-white/80 hover:bg-white/20",
            )}
          >
            {m === "saldo" ? "Saldo (un.)" : "Valor (R$)"}
          </button>
        ))}
      </div>

      <div className="video-sobe mt-4 text-center" style={{ animationDelay: "0.15s" }}>
        <p className="font-serif text-4xl text-white">{fmt(total)}</p>
        <p className="mt-1 text-[11px] text-white/60">
          {ALMOXARIFADOS.length} almoxarifados · saldo em {ALMOXARIFADOS_DATA_BASE}
        </p>
      </div>

      <div className="video-sobe mt-4 space-y-1.5" style={{ animationDelay: "0.25s" }}>
        {linhas.map((l, i) => {
          const pct = (l[metrica] / total) * 100;
          return (
            <div key={l.cod} className="rounded-lg bg-white/5 px-3 py-1.5">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate text-white/90">
                  <span className="mr-1.5 font-mono text-white/45">{l.cod}</span>
                  {l.nome}
                </span>
                <span className="shrink-0 font-mono text-white">
                  {fmt(l[metrica])} <span className="text-white/45">· {fmtBrMax(pct, 1)}%</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn("h-full rounded-full", i === 0 ? "bg-brand-amber" : "bg-emerald-400/80")}
                  style={{
                    width: `${Math.max((l[metrica] / maior) * 100, 1.5)}%`,
                    transition: anim ? "width .8s ease" : "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-[10px] text-white/45">
        Fonte: FOCCOERP REST0330 · Total {fmtBr(ALMOXARIFADOS_TOTAL.saldo)} un · {fmtMi(ALMOXARIFADOS_TOTAL.valor)}
      </p>
    </div>
  );
}
