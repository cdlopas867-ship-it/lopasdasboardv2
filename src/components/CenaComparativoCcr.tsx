/* Cena Comparativo CCR × Estoque 001 — compara o peso em toneladas entre o
   ESTOQUE 001 (Focco ERP, posição de estoque) e o ESTOQUE CCR (relatório de
   volumes do CD). Mostra a diferença total, por unidade e os itens com maior
   divergência de peso. */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { fmtInt, fmtBrMax, fmtTonDec } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, BannerResumo, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import { COMPARATIVO_CCR, type ComparativoCcr } from "@/data/comparativo-ccr";

const COR_001 = "#3B82F6";
const COR_CCR = "#F97316";
const COR_DIF = "#EF4444";

export default function CenaComparativoCcr({
  anim,
  cena,
  onPausar,
  comparativoCcr,
}: {
  anim: boolean;
  cena: number;
  onPausar?: (() => void) | undefined;
  comparativoCcr?: ComparativoCcr | null;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);
  const d = comparativoCcr ?? COMPARATIVO_CCR;
  const [modo, setModo] = useState<"peso" | "saldo">("peso");

  /* Donut: Estoque 001 × CCR como proporção do peso total */
  const total = d.estoque001.pesoTon + d.ccr.pesoTon;
  const secoes: SecaoDonut[] = [
    { id: "001", label: "Estoque 001", cor: COR_001, pct: total > 0 ? (d.estoque001.pesoTon / total) * 100 : 0 },
    { id: "ccr", label: "CCR", cor: COR_CCR, pct: total > 0 ? (d.ccr.pesoTon / total) * 100 : 0 },
  ];

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Estoque 001 × CCR
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto={`Comparativo de peso entre o ESTOQUE 001 (Focco ERP — posição de estoque do CD) e o ESTOQUE CCR (relatório de volumes do CD). O CCR apresenta ${fmtBrMax(d.diferenca.pesoPct, 1)}% a mais de peso que o Estoque 001 (${fmtTonDec(d.diferenca.pesoTon)} t de diferença). A diferença ocorre porque o CCR inclui volumes em trânsito e outras posições que não aparecem na posição 001. Cruzamento por código de item: ${fmtInt(d.itensEmComum)} itens em comum, ${fmtInt(d.itensSo001)} só no 001, ${fmtInt(d.itensSoCcr)} só no CCR. Data-base: ${d.dataBase}. Clique para alternar.`}
        />
      </div>

      <DonutInterativo
        secoes={secoes}
        foco={foco}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />
      <ToggleSecoes secoes={secoes} foco={foco} onChange={setFoco} />

      <BannerResumo
        delay="0.4s"
        texto={
          foco === 0
            ? `${fmtTonDec(d.estoque001.pesoTon)} t · ${fmtInt(d.estoque001.itens)} itens · ${fmtBrMax((d.estoque001.pesoTon / total) * 100, 1)}%`
            : `${fmtTonDec(d.ccr.pesoTon)} t · ${fmtInt(d.ccr.itens)} itens · ${fmtBrMax((d.ccr.pesoTon / total) * 100, 1)}%`
        }
      />

      {/* Toggle Peso / Saldo */}
      <div className="video-sobe mt-2 flex gap-1.5" style={{ animationDelay: "0.35s" }}>
        {(["peso", "saldo"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={(e) => { e.stopPropagation(); setModo(m); onPausar?.(); }}
            className={cn(
              "rounded-full px-3 py-0.5 text-[9px] font-bold tracking-widest uppercase transition-colors",
              modo === m
                ? "bg-white/20 text-white"
                : "bg-white/5 text-white/50 hover:bg-white/10",
            )}
          >
            {m === "peso" ? "Peso (t)" : "Saldo (un)"}
          </button>
        ))}
      </div>

      {/* Comparativo por unidade */}
      <div className="video-sobe mt-3 w-full max-w-sm mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Por unidade
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Unidade</th>
              <th className="pb-0.5 text-right font-bold">001</th>
              <th className="pb-0.5 text-right font-bold">CCR</th>
              <th className="pb-0.5 text-right font-bold">Dif.</th>
              <th className="pb-0.5 text-right font-bold">%</th>
            </tr>
          </thead>
          <tbody>
            {d.porUnidade.map((u, i) => {
              const v001 = modo === "peso" ? u.peso001 : (d.estoque001.saldo / d.estoque001.pesoTon) * u.peso001;
              const vCcr = modo === "peso" ? u.pesoCcr : (d.ccr.saldo / d.ccr.pesoTon) * u.pesoCcr;
              const dif = modo === "peso" ? u.difTon : (vCcr - v001);
              const pct = modo === "peso" ? u.difPct : (v001 > 0 ? (dif / v001) * 100 : 0);
              return (
                <tr
                  key={u.nome}
                  className="video-sobe border-b border-white/10"
                  style={{ animationDelay: `${0.55 + i * 0.08}s` }}
                >
                  <td className="py-0.5 font-semibold text-white/90">{u.nome}</td>
                  <td className="py-0.5 text-right font-mono font-semibold text-blue-400">
                    {modo === "peso" ? fmtTonDec(v001) : fmtInt(Math.round(v001))}
                  </td>
                  <td className="py-0.5 text-right font-mono font-semibold text-orange-400">
                    {modo === "peso" ? fmtTonDec(vCcr) : fmtInt(Math.round(vCcr))}
                  </td>
                  <td className="py-0.5 text-right font-mono font-bold text-red-400">
                    +{modo === "peso" ? fmtTonDec(dif) : fmtInt(Math.round(dif))}
                  </td>
                  <td className="py-0.5 text-right font-mono font-bold text-red-400">
                    +{fmtBrMax(pct, 1)}%
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-white/40 bg-white/10 font-bold">
              <td className="py-1 text-white">Total</td>
              <td className="py-1 text-right font-mono text-blue-400">
                {modo === "peso" ? fmtTonDec(d.estoque001.pesoTon) : fmtInt(d.estoque001.saldo)}
              </td>
              <td className="py-1 text-right font-mono text-orange-400">
                {modo === "peso" ? fmtTonDec(d.ccr.pesoTon) : fmtInt(d.ccr.saldo)}
              </td>
              <td className="py-1 text-right font-mono text-red-400">
                +{modo === "peso" ? fmtTonDec(d.diferenca.pesoTon) : fmtInt(d.diferenca.saldoUn)}
              </td>
              <td className="py-1 text-right font-mono text-red-400">
                +{fmtBrMax(modo === "peso" ? d.diferenca.pesoPct : d.diferenca.saldoPct, 1)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Indicadores dos dois sistemas */}
      <div className="video-sobe mt-3 grid w-full max-w-sm mx-auto grid-cols-2 gap-2" style={{ animationDelay: "0.6s" }}>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-2.5">
          <p className="text-[8px] font-bold tracking-[0.25em] text-white/50 uppercase">Estoque 001 · Focco</p>
          <p className="mt-1 font-serif text-lg text-white sm:text-xl">{fmtTonDec(d.estoque001.pesoTon)}</p>
          <p className="text-[10px] text-white/50">{fmtInt(d.estoque001.itens)} itens · {fmtInt(d.estoque001.saldo)} un</p>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-2.5">
          <p className="text-[8px] font-bold tracking-[0.25em] text-white/50 uppercase">CCR · Volumes CD</p>
          <p className="mt-1 font-serif text-lg text-white sm:text-xl">{fmtTonDec(d.ccr.pesoTon)}</p>
          <p className="text-[10px] text-white/50">{fmtInt(d.ccr.itens)} itens · {fmtInt(d.ccr.saldo)} un</p>
        </div>
      </div>

      {/* Alerta de diferença */}
      <div className="video-sobe mt-3 flex w-full max-w-sm mx-auto items-center justify-center gap-3 rounded-lg border border-red-500/25 bg-red-500/5 px-4 py-2" style={{ animationDelay: "0.7s" }}>
        <span className="font-mono text-2xl font-bold text-red-400">+{fmtTonDec(d.diferenca.pesoTon)}</span>
        <span className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
          {fmtBrMax(d.diferenca.pesoPct, 1)}% a mais no CCR
        </span>
      </div>

      {/* Maiores divergências por item */}
      <div className="video-sobe mt-3 w-full max-w-sm mx-auto" style={{ animationDelay: "0.8s" }}>
        <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Maiores divergências
        </p>
        <div className="space-y-1">
          {d.topDiferencas.slice(0, 5).map((it, i) => (
            <div key={`${it.item}-${i}`} className="flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2 py-1">
              <span className="w-12 shrink-0 truncate font-mono text-[9px] font-bold text-white/70">{it.item}</span>
              <span className="flex-1 truncate text-[10px] text-white/50">{it.desc}</span>
              <span className="shrink-0 font-mono text-[10px] font-semibold text-blue-400">{fmtTonDec(it.peso001)}</span>
              <span className="shrink-0 text-[9px] text-white/30">→</span>
              <span className="shrink-0 font-mono text-[10px] font-semibold text-orange-400">{fmtTonDec(it.pesoCcr)}</span>
              <span className="w-12 shrink-0 text-right font-mono text-[10px] font-bold text-red-400">{fmtTonDec(it.difTon)}</span>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          Estoque 001 = Focco ERP (posição de estoque) · CCR = relatório de volumes do CD ·
          {fmtInt(d.itensEmComum)} itens em comum, {fmtInt(d.itensSo001)} só no 001, {fmtInt(d.itensSoCcr)} só no CCR.
          Data-base: {d.dataBase}.
        </p>
      </div>
    </div>
  );
}
