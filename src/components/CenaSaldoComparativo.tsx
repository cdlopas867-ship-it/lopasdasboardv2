/* Cena Controle de Saldo — Full (FullSoft) × Focco (ERP, estoque 001).
   Donut interativo com toggle Match / Diferença / Só Full / Só Focco,
   resumo de totais, alertas e tabela das maiores divergências. */

import { cn } from "@/lib/utils";
import { fmtInt, fmtBrMax, fmtMoeda } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, BannerResumo, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import { SALDO_COMPARATIVO, type SaldoComparativo } from "@/data/saldo-comparativo";

const COR_MATCH = "#22c55e";
const COR_DIFF = "#f97316";
const COR_SO_FULL = "#ef4444";
const COR_SO_FOCCO = "#3b82f6";

export default function CenaSaldoComparativo({
  anim,
  cena,
  onPausar,
  saldoComparativo,
}: {
  anim: boolean;
  cena: number;
  onPausar?: () => void;
  saldoComparativo?: SaldoComparativo | null;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);
  const d = saldoComparativo ?? SALDO_COMPARATIVO;

  const totalItens = d.comparativo.itensEmComum + d.comparativo.itensSoFull + d.comparativo.itensSoFocco;
  const pctMatch = totalItens > 0 ? (d.comparativo.qtdExata / totalItens) * 100 : 0;
  const pctDiff = totalItens > 0 ? (d.comparativo.qtdDiferenca / totalItens) * 100 : 0;
  const pctSoFull = totalItens > 0 ? (d.comparativo.itensSoFull / totalItens) * 100 : 0;
  const pctSoFocco = totalItens > 0 ? (d.comparativo.itensSoFocco / totalItens) * 100 : 0;

  const secoes: SecaoDonut[] = [
    { id: "match", label: "exato", cor: COR_MATCH, pct: pctMatch },
    { id: "diff", label: "diferença", cor: COR_DIFF, pct: pctDiff },
    { id: "so_full", label: "só full", cor: COR_SO_FULL, pct: pctSoFull },
    { id: "so_focco", label: "só focco", cor: COR_SO_FOCCO, pct: pctSoFocco },
  ];

  const saldoTotal = d.full.saldo + d.focco.saldo;
  const pctFull = saldoTotal > 0 ? (d.full.saldo / saldoTotal) * 100 : 0;
  const pctFocco = saldoTotal > 0 ? (d.focco.saldo / saldoTotal) * 100 : 0;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Saldo · Full × Focco
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto={`Controle de saldo entre FullSoft (sistema Full) e Focco (ERP, estoque 001). Full: ${fmtInt(d.full.itens)} itens · ${fmtInt(d.full.saldo)} un · ${fmtMoeda(d.full.valor)}. Focco: ${fmtInt(d.focco.itens)} itens · ${fmtInt(d.focco.saldo)} un. Itens em comum: ${fmtInt(d.comparativo.itensEmComum)}. Exato: ${fmtInt(d.comparativo.qtdExata)} (${d.comparativo.pctMatch}%). Diferença: ${fmtInt(d.comparativo.qtdDiferenca)}. Só Full: ${fmtInt(d.comparativo.itensSoFull)}. Só Focco: ${fmtInt(d.comparativo.itensSoFocco)}. Data-base: ${d.dataBase}.`}
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
            ? `${fmtBrMax(pctMatch, 1)}% exato · ${fmtInt(d.comparativo.qtdExata)} itens`
            : foco === 1
              ? `${fmtBrMax(pctDiff, 1)}% com diferença · ${fmtInt(d.comparativo.qtdDiferenca)} itens`
              : foco === 2
                ? `${fmtInt(d.comparativo.itensSoFull)} itens só no Full`
                : `${fmtInt(d.comparativo.itensSoFocco)} itens só no Focco`
        }
      />

      {/* Resumo Full × Focco */}
      <div className="video-sobe mt-4 w-full max-w-sm mx-auto grid grid-cols-2 gap-2" style={{ animationDelay: "0.5s" }}>
        <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
          <p className="text-[8px] font-bold tracking-[0.3em] text-white/50 uppercase">Full (FullSoft)</p>
          <p className="mt-1 font-serif text-xl text-white">{fmtInt(d.full.saldo)}</p>
          <p className="text-[10px] text-white/50">{fmtInt(d.full.itens)} itens · {fmtMoeda(d.full.valor)}</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn("h-full rounded-full", !anim && "video-pausada")}
              style={{ width: `${pctFull}%`, background: "linear-gradient(90deg, #00FFCC, #00b894)", transition: "width 1s ease" }}
            />
          </div>
          <p className="mt-0.5 text-right text-[9px] font-mono text-white/60">{fmtBrMax(pctFull, 1)}%</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
          <p className="text-[8px] font-bold tracking-[0.3em] text-white/50 uppercase">Focco (ERP)</p>
          <p className="mt-1 font-serif text-xl text-white">{fmtInt(d.focco.saldo)}</p>
          <p className="text-[10px] text-white/50">{fmtInt(d.focco.itens)} itens</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn("h-full rounded-full", !anim && "video-pausada")}
              style={{ width: `${pctFocco}%`, background: "linear-gradient(90deg, #3b82f6, #1d4ed8)", transition: "width 1s ease" }}
            />
          </div>
          <p className="mt-0.5 text-right text-[9px] font-mono text-white/60">{fmtBrMax(pctFocco, 1)}%</p>
        </div>
      </div>

      {/* Alertas */}
      <div className="video-sobe mt-3 w-full max-w-sm mx-auto flex items-center gap-2" style={{ animationDelay: "0.6s" }}>
        <div className="flex-1 rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1.5 text-center">
          <p className="font-mono text-sm font-bold text-red-400">{fmtInt(d.alertas.soFull)}</p>
          <p className="text-[7px] font-bold tracking-widest text-white/50 uppercase">só full</p>
        </div>
        <div className="flex-1 rounded-lg border border-blue-500/20 bg-blue-500/5 px-2.5 py-1.5 text-center">
          <p className="font-mono text-sm font-bold text-blue-400">{fmtInt(d.alertas.soFocco)}</p>
          <p className="text-[7px] font-bold tracking-widest text-white/50 uppercase">só focco</p>
        </div>
        <div className="flex-1 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-center">
          <p className={cn("font-mono text-sm font-bold", d.alertas.diferencaTotal < 0 ? "text-amber-400" : "text-red-400")}>
            {d.alertas.diferencaTotal < 0 ? "−" : "+"}{fmtInt(Math.abs(d.alertas.diferencaTotal))}
          </p>
          <p className="text-[7px] font-bold tracking-widest text-white/50 uppercase">diff total</p>
        </div>
      </div>

      {/* Top divergências */}
      <div className="video-sobe mt-3 w-full max-w-sm mx-auto" style={{ animationDelay: "0.7s" }}>
        <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Maiores divergências
        </p>
        <div className="space-y-1">
          {d.topDiferencas.slice(0, 6).map((it, i) => (
            <div
              key={`${it.item}-${i}`}
              className="flex items-center gap-2 rounded-md bg-white/[0.03] px-2 py-1"
              style={{ animationDelay: `${0.08 * i + 0.7}s` }}
            >
              <span className="w-12 shrink-0 font-mono text-[10px] font-bold text-white/70">{it.item}</span>
              <span className="flex-1 truncate text-[10px] text-white/50">{it.desc}</span>
              <span className="shrink-0 font-mono text-[10px] font-semibold text-white/80">{fmtInt(it.full)}</span>
              <span className="shrink-0 text-white/30">→</span>
              <span className="shrink-0 font-mono text-[10px] font-semibold text-white/80">{fmtInt(it.focco)}</span>
              <span
                className={cn(
                  "shrink-0 w-14 text-right font-mono text-[10px] font-bold",
                  it.diff > 0 ? "text-red-400" : "text-amber-400",
                )}
              >
                {it.diff > 0 ? "+" : ""}{fmtInt(it.diff)}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          Full = sistema FullSoft · Focco = ERP estoque 001 · Data-base: {d.dataBase}
        </p>
      </div>
    </div>
  );
}
