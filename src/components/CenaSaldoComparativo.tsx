/* Cena Controle de Saldo — Full (WMS FullSoft, estoque 112 · relatório WF0112 -
   Estoques) × Focco (ERP, estoque 001 · posição de estoque). Mesmo formato das
   outras cenas: donut interativo + botões, card com o % do foco, tabela Legenda,
   indicadores e alertas das divergências. */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { fmtInt, fmtMi, fmtBrMax, fmtMoeda, fmtTonDec } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, BannerResumo, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import { SALDO_COMPARATIVO, type SaldoComparativo } from "@/data/saldo-comparativo";
import type { VideoReservados } from "./VideoResumoDashboard";
import { exportarExcelSaldo } from "@/lib/export-excel-saldo";

const COR_EXATO = "#22C55E";
const COR_DIFERENCA = "#F97316";
const COR_SO_FULL = "#EF4444";
const COR_SO_FOCCO = "#3B82F6";
const COR_RESERVADO = "#00FFCC";

export default function CenaSaldoComparativo({
  anim,
  cena,
  onPausar,
  saldoComparativo,
  reservados,
}: {
  anim: boolean;
  cena: number;
  onPausar?: (() => void) | undefined;
  saldoComparativo?: SaldoComparativo | null | undefined;
  reservados?: VideoReservados | null | undefined;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);
  const [exportando, setExportando] = useState(false);
  const d = saldoComparativo ?? SALDO_COMPARATIVO;

  const handleExport = async () => {
    onPausar?.();
    setExportando(true);
    try {
      await exportarExcelSaldo(d);
    } catch (e) {
      console.error("Erro ao exportar Excel:", e);
    } finally {
      setExportando(false);
    }
  };

  const c = d.comparativo;
  const totalItens = c.itensEmComum + c.itensSoFull + c.itensSoFocco;
  const pct = (n: number) => (totalItens > 0 ? (n / totalItens) * 100 : 0);

  /* Donut e botões cobrem só os dois estados comparáveis (exato × diferença);
     "só Full" e "só Focco" continuam na Legenda e nos alertas. */
  const secoes: SecaoDonut[] = [
    { id: "exato", label: "exato", cor: COR_EXATO, pct: pct(c.qtdExata) },
    { id: "diferenca", label: "diferença", cor: COR_DIFERENCA, pct: pct(c.qtdDiferenca) },
  ];

  /* Tonelagem por situação nos dois lados: a do Full é a quantidade do Full
     pelo peso unitário do item na posição do Focco (o relatório do Full não
     traz peso); a do Focco é o próprio peso da posição. */
  const linhas: { idx: number; cor: string; rotulo: string; itens: number; pct: number; tonFull: number | null; tonFocco: number | null }[] = [
    { idx: 0, cor: COR_EXATO, rotulo: "Exato", itens: c.qtdExata, pct: pct(c.qtdExata), tonFull: c.tonFullExato, tonFocco: c.tonExato },
    { idx: 1, cor: COR_DIFERENCA, rotulo: "Diferença", itens: c.qtdDiferenca, pct: pct(c.qtdDiferenca), tonFull: c.tonFullDiferenca, tonFocco: c.tonDiferenca },
    { idx: 2, cor: COR_SO_FULL, rotulo: "Só Full", itens: c.itensSoFull, pct: pct(c.itensSoFull), tonFull: c.tonFullSoFull, tonFocco: null },
    { idx: 3, cor: COR_SO_FOCCO, rotulo: "Só Focco", itens: c.itensSoFocco, pct: pct(c.itensSoFocco), tonFull: null, tonFocco: c.tonSoFocco },
  ];
  const tonTotalFull = c.tonFullExato + c.tonFullDiferenca + c.tonFullSoFull;
  const tonTotalFocco = c.tonExato + c.tonDiferenca + c.tonSoFocco;

  const saldoTotal = d.full.saldo + d.focco.saldo;
  const pctFull = saldoTotal > 0 ? (d.full.saldo / saldoTotal) * 100 : 0;
  const pctFocco = saldoTotal > 0 ? (d.focco.saldo / saldoTotal) * 100 : 0;

  /* Itens reservados sob risco — a reserva não é coberta pelo Full (ou pelo Focco). */
  const risco = d.risco ?? { itens: 0, qtdReservada: 0, tonReservada: 0 };
  const itensRisco = d.itensRisco ?? [];
  const contRisco = {
    semFull: itensRisco.filter((i) => i.risco === "sem-full").length,
    fullInsuficiente: itensRisco.filter((i) => i.risco === "full-insuficiente").length,
    foccoInsuficiente: itensRisco.filter((i) => i.risco === "focco-insuficiente").length,
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Saldo · Full × Focco
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto={`Controle de saldo entre o Full (WMS do CD, FullSoft, estoque 112 — relatório WF0112 - Estoques, considerando apenas os volumes — descrição começando por VOL — em qualquer endereço, inclusive os da ASTEC: as peças soltas ficam de fora) e o Focco (ERP, estoque 001 — posição de estoque do CD). O cruzamento é pelo código do item: itens com o mesmo código nos dois sistemas são comparados pelo saldo. Acuracidade = itens com saldo exatamente igual ÷ itens em comum. Itens que só existem em um sistema viram alertas (o relatório do Full lista também peças e componentes que não estão na posição do Focco). Data-base: ${d.dataBase}. Clique para alternar.`}
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
            ? `${fmtBrMax(pct(c.qtdExata), 1)}% exato · ${fmtInt(c.qtdExata)} itens`
            : `${fmtBrMax(pct(c.qtdDiferenca), 1)}% com diferença · ${fmtInt(c.qtdDiferenca)} itens`
        }
      />

      {/* Legenda — distribuição dos itens entre os quatro estados */}
      <div className="video-sobe mt-3 w-full max-w-xs mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Legenda
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Situação</th>
              <th className="pb-0.5 text-right font-bold">Itens</th>
              <th className="pb-0.5 text-right font-bold">Ton. Full</th>
              <th className="pb-0.5 text-right font-bold">Ton. Focco</th>
              <th className="pb-0.5 text-right font-bold">%</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const ativo = l.idx === foco;
              return (
                <tr
                  key={l.rotulo}
                  className={cn(
                    "border-b border-white/10 transition-all duration-300",
                    ativo ? "bg-white/[0.04]" : "opacity-40",
                  )}
                >
                  <td className="py-0.5" style={ativo ? { color: l.cor } : undefined}>{l.rotulo}</td>
                  <td className="py-0.5 text-right font-mono font-semibold" style={ativo ? { color: l.cor } : undefined}>
                    {fmtInt(l.itens)}
                  </td>
                  <td className="py-0.5 text-right font-mono font-semibold" style={ativo ? { color: l.cor } : undefined}>
                    {l.tonFull == null ? "—" : fmtTonDec(l.tonFull)}
                  </td>
                  <td className="py-0.5 text-right font-mono font-semibold" style={ativo ? { color: l.cor } : undefined}>
                    {l.tonFocco == null ? "—" : fmtTonDec(l.tonFocco)}
                  </td>
                  <td className="py-0.5 text-right font-mono font-bold" style={ativo ? { color: l.cor } : undefined}>
                    {fmtBrMax(l.pct, 1)}%
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-white/40 bg-white/10 font-bold">
              <td className="py-1 text-white">Total de itens</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(totalItens)}</td>
              <td className="py-1 text-right font-mono text-white">{fmtTonDec(tonTotalFull)}</td>
              <td className="py-1 text-right font-mono text-white">{fmtTonDec(tonTotalFocco)}</td>
              <td className="py-1 text-right font-mono text-white">100%</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * Acuracidade nos {fmtInt(c.itensEmComum)} itens em comum:{" "}
          <span className="font-bold text-white/70">{fmtBrMax(c.pctAcuracia, 1)}%</span> com saldo exatamente igual.
        </p>
        <p className="mt-1 text-[8px] leading-tight text-white/40">
          * Ton. Full = quantidade do Full × peso unitário do item na posição do Focco (PESO LIQ UN); Ton. Focco = peso da
          posição do Focco (PESO LIQ TOTAL). O relatório do Full não traz peso: item sem peso cadastrado na posição não entra
          na tonelagem do Full.
        </p>
      </div>

      {/* Indicadores dos dois sistemas — saldo e participação */}
      <div className="video-sobe mt-3 grid w-full max-w-sm mx-auto grid-cols-2 gap-2" style={{ animationDelay: "0.6s" }}>
        <div className="rounded-xl border border-white/15 bg-white/5 p-2.5">
          <p className="text-[8px] font-bold tracking-[0.25em] text-white/50 uppercase">Full · Estoque 112</p>
          <p className="mt-1 font-serif text-lg text-white sm:text-xl">{fmtInt(d.full.saldo)}</p>
          <p className="text-[10px] text-white/50">{fmtInt(d.full.itens)} itens</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{ width: `${pctFull}%`, background: `linear-gradient(90deg, ${COR_RESERVADO}, #00b894)`, transition: "width 1s ease" }}
            />
          </div>
          <p className="mt-0.5 text-right font-mono text-[9px] text-white/60">{fmtBrMax(pctFull, 1)}% do saldo</p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 p-2.5">
          <p className="text-[8px] font-bold tracking-[0.25em] text-white/50 uppercase">Focco · Estoque 001</p>
          <p className="mt-1 font-serif text-lg text-white sm:text-xl">{fmtInt(d.focco.saldo)}</p>
          <p className="text-[10px] text-white/50">
            {fmtInt(d.focco.itens)} itens · {fmtMi(d.focco.valor)}
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{ width: `${pctFocco}%`, background: `linear-gradient(90deg, ${COR_SO_FOCCO}, #1D4ED8)`, transition: "width 1s ease" }}
            />
          </div>
          <p className="mt-0.5 text-right font-mono text-[9px] text-white/60">{fmtBrMax(pctFocco, 1)}% do saldo</p>
        </div>
      </div>

      {/* Alertas — itens sem par no outro sistema e saldo total divergente */}
      <div className="video-sobe mt-3 flex w-full max-w-sm mx-auto items-center gap-2" style={{ animationDelay: "0.7s" }}>
        <div className="flex-1 rounded-lg border border-red-500/25 bg-red-500/5 px-2.5 py-1.5 text-center">
          <p className="font-mono text-sm font-bold text-red-400">{fmtInt(d.alertas.soFull)}</p>
          <p className="text-[7px] font-bold tracking-widest text-white/50 uppercase">só full</p>
        </div>
        <div className="flex-1 rounded-lg border border-blue-500/25 bg-blue-500/5 px-2.5 py-1.5 text-center">
          <p className="font-mono text-sm font-bold text-blue-400">{fmtInt(d.alertas.soFocco)}</p>
          <p className="text-[7px] font-bold tracking-widest text-white/50 uppercase">só focco</p>
        </div>
        <div className="flex-1 rounded-lg border border-amber-500/25 bg-amber-500/5 px-2.5 py-1.5 text-center">
          <p className={cn("font-mono text-sm font-bold", d.alertas.diferencaTotal < 0 ? "text-amber-400" : "text-red-400")}>
            {d.alertas.diferencaTotal < 0 ? "−" : "+"}
            {fmtInt(Math.abs(d.alertas.diferencaTotal))}
          </p>
          <p className="text-[7px] font-bold tracking-widest text-white/50 uppercase">dif. de saldo</p>
        </div>
      </div>

      {/* Reservados sob risco — a reserva não é coberta pelo Full (ou pelo Focco) */}
      {risco.itens > 0 && (
        <div className="video-sobe mt-3 w-full max-w-sm mx-auto" style={{ animationDelay: "0.75s" }}>
          <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
            Reservados sob risco
          </p>
          <div className="rounded-lg border border-red-500/25 bg-red-500/5 px-2.5 py-1.5">
            <p className="font-mono text-sm font-bold text-red-400">
              {fmtInt(risco.itens)} itens · {fmtTonDec(risco.tonReservada)} reservadas
            </p>
            <p className="text-[8px] text-white/50">
              {fmtInt(risco.qtdReservada)} un com reserva não coberta pelo Full (estoque 112)
            </p>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            <span className="rounded-md border border-red-500/25 bg-red-500/5 px-1.5 py-0.5 text-[8px] text-red-300">
              sem saldo no Full {fmtInt(contRisco.semFull)}
            </span>
            <span className="rounded-md border border-amber-500/25 bg-amber-500/5 px-1.5 py-0.5 text-[8px] text-amber-300">
              Full não cobre a reserva {fmtInt(contRisco.fullInsuficiente)}
            </span>
            {contRisco.foccoInsuficiente > 0 && (
              <span className="rounded-md border border-orange-500/25 bg-orange-500/5 px-1.5 py-0.5 text-[8px] text-orange-300">
                reserva &gt; Focco {fmtInt(contRisco.foccoInsuficiente)}
              </span>
            )}
          </div>
          <div className="mt-1 space-y-1">
            {itensRisco.slice(0, 5).map((it, i) => (
              <div key={`${it.item}-${i}`} className="flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2 py-1">
                <span className="w-20 shrink-0 truncate font-mono text-[9px] font-bold text-white/70">{it.item}</span>
                <span className="flex-1 truncate text-[10px] text-white/50">{it.desc}</span>
                <span className="shrink-0 font-mono text-[10px] font-semibold text-white/80">{fmtInt(it.reservados)} res.</span>
                <span className="shrink-0 text-[9px] text-white/30">→</span>
                <span className="shrink-0 font-mono text-[10px] font-semibold text-white/80">{fmtInt(it.full)}</span>
                <span className="w-14 shrink-0 text-right font-mono text-[10px] font-bold text-red-400">{fmtTonDec(it.tonReservada ?? 0)}</span>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[8px] leading-tight text-white/40">
            * Itens com reserva na carteira (estoque 001) que o Full não tem saldo para atender — ou a reserva maior que o saldo
            do Focco. Colunas: quantidade reservada, saldo no Full e tonelada reservada. As demais vão no Excel exportado.
          </p>
        </div>
      )}

      {/* Maiores divergências — itens com saldo diferente nos dois sistemas */}
      <div className="video-sobe mt-3 w-full max-w-sm mx-auto" style={{ animationDelay: "0.8s" }}>
        <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Maiores divergências
        </p>
        <div className="space-y-1">
          {d.topDiferencas.slice(0, 5).map((it, i) => (
            <div key={`${it.item}-${i}`} className="flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2 py-1">
              <span className="w-20 shrink-0 truncate font-mono text-[9px] font-bold text-white/70">{it.item}</span>
              <span className="flex-1 truncate text-[10px] text-white/50">{it.desc}</span>
              <span className="shrink-0 font-mono text-[10px] font-semibold text-white/80">{fmtInt(it.full)}</span>
              <span className="shrink-0 text-[9px] text-white/30">→</span>
              <span className="shrink-0 font-mono text-[10px] font-semibold text-white/80">{fmtInt(it.focco)}</span>
              <span className={cn("w-16 shrink-0 text-right font-mono text-[10px] font-bold", it.diff > 0 ? "text-red-400" : "text-amber-400")}>
                {it.diff > 0 ? "+" : ""}
                {fmtInt(it.diff)}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          Full = WMS FullSoft, estoque 112 (relatório WF0112 - Estoques) · Focco = ERP, estoque 001 (posição de estoque) · Saldo
          geral: {fmtMoeda(d.alertas.diferencaTotal)} de diferença. Data-base: {d.dataBase}.
        </p>

        <button
          type="button"
          onClick={handleExport}
          disabled={exportando}
          className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold tracking-widest text-white/80 uppercase backdrop-blur-sm transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          {exportando ? "Gerando Excel…" : "⬇ Exportar Excel"}
        </button>
      </div>

    </div>
  );
}
