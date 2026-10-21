/* Cena — Controle de almoxarifados (FOCCOERP REST0330).
 * Padrão das demais cenas: donut interativo + toggle Saldo/Valor + legenda.
 * Donut mostra o top 5 almoxarifados + "Outros"; tabela lista todos. */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt, fmtMi } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, BannerResumo, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import {
  ALMOXARIFADOS,
  ALMOXARIFADOS_DATA_BASE,
  ALMOXARIFADOS_TOTAL,
} from "@/data/almoxarifados";

type Metrica = "saldo" | "valor";

/* Paleta do donut — âmbar no maior (Expedição WMS ~95%), depois ciano/laranja/azul/roxo/cinza. */
const CORES_ALMOX = ["#D4881E", "#00FFCC", "#FFA500", "#3b82f6", "#a855f7", "#6b7280"];
const COR_AMBER = CORES_ALMOX[0]!;

export default function CenaAlmoxarifados({
  anim,
  cena,
  onPausar,
}: {
  anim: boolean;
  cena: number;
  onPausar?: (() => void) | undefined;
}) {
  const [metrica, setMetrica] = useState<Metrica>("saldo");
  const [foco, setFoco] = useFocoCena<number>(cena, 0);

  const total = ALMOXARIFADOS_TOTAL[metrica];
  const fmtValor = (v: number) => (metrica === "saldo" ? `${fmtInt(v)} un` : fmtMi(v));

  /* Top 5 + "Outros" para o donut; tabela mostra todos os 13. */
  const ordenados = [...ALMOXARIFADOS].sort((a, b) => b[metrica] - a[metrica]);
  const top5 = ordenados.slice(0, 5);
  const outros = ordenados.slice(5);
  const totalOutros = outros.reduce((s, a) => s + a[metrica], 0);

  const secoes: SecaoDonut[] = [
    ...top5.map((a, i) => ({
      id: a.cod,
      label: a.nome.toLowerCase(),
      cor: CORES_ALMOX[i]!,
      pct: total > 0 ? (a[metrica] / total) * 100 : 0,
    })),
    {
      id: "outros",
      label: `outros (${outros.length})`,
      cor: CORES_ALMOX[5]!,
      pct: total > 0 ? (totalOutros / total) * 100 : 0,
    },
  ];

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Controle de Almoxarifados
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto="Saldo dos itens por almoxarifado. Toggle Saldo (un.) × Valor (R$). O gráfico mostra a participação de cada almoxarifado no total. Fonte: FOCCOERP REST0330 — Relatório de Saldo dos Itens (Sintético, Por Almoxarifado). 13 almoxarifados, saldo em 21/10/2026."
        />
      </div>

      {/* Toggle Saldo × Valor — ativo em âmbar, como ToggleSecoes */}
      <div className="video-sobe mt-2 flex max-w-xl flex-wrap items-center justify-center gap-2" style={{ animationDelay: "0.1s" }}>
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
              "cursor-pointer rounded-full px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-all duration-300",
              metrica === m
                ? "text-brand-dark"
                : "text-white/80 border border-white/30 hover:text-white hover:border-white/50",
            )}
            style={metrica === m ? { background: COR_AMBER } : undefined}
          >
            {m === "saldo" ? "Saldo (un.)" : "Valor (R$)"}
          </button>
        ))}
      </div>

      <DonutInterativo
        secoes={secoes}
        foco={foco}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />

      <BannerResumo texto={fmtValor(total)} delay="0.4s" />

      {/* Legenda — todos os almoxarifados com valor e % */}
      <div className="video-sobe mt-3 w-full max-w-sm mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Por almoxarifado
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Almoxarifado</th>
              <th className="pb-0.5 text-right font-bold">Valor</th>
              <th className="pb-0.5 text-right font-bold">%</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((a, i) => {
              const pct = total > 0 ? (a[metrica] / total) * 100 : 0;
              const corIndex = top5.findIndex((t) => t.cod === a.cod);
              const cor = corIndex >= 0 ? CORES_ALMOX[corIndex] : CORES_ALMOX[5];
              const ehFoco = corIndex >= 0 && corIndex === foco;
              return (
                <tr
                  key={a.cod}
                  className={cn(
                    "video-sobe border-b border-white/10",
                    ehFoco ? "bg-white/10" : "bg-white/[0.04]",
                  )}
                  style={{ color: cor, animationDelay: `${0.05 * i}s` }}
                >
                  <td className="py-0.5">
                    <span className="mr-1.5 font-mono text-white/45">{a.cod}</span>
                    {a.nome}
                  </td>
                  <td className="py-0.5 text-right font-mono font-semibold">{fmtValor(a[metrica])}</td>
                  <td className="py-0.5 text-right font-mono">{fmtBrMax(pct, 1)}%</td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-white/40 bg-white/10 font-bold">
              <td className="py-1 text-white">Total</td>
              <td className="py-1 text-right font-mono text-white">{fmtValor(total)}</td>
              <td className="py-1 text-right font-mono text-white">100%</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          {ALMOXARIFADOS.length} almoxarifados · saldo em {ALMOXARIFADOS_DATA_BASE}. Clique no gráfico para alternar.
        </p>
      </div>
    </div>
  );
}
