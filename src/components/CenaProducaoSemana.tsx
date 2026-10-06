/* Cena Produção da Semana — donut interativo com toggle Entregue / Pendente.
   Mesmo padrão da CenaRecebimentoTurno: donut + toggle + tabela de legenda. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt, fmtTonDec } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, BannerResumo, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import type { ProducaoSemanalDia } from "@/lib/producao-semanal";

const COR_RECEBIDO = "#33D953";
const COR_PREVISTO = "#FFA500";

export default function CenaProducaoSemana({
  anim,
  dias,
  cena,
  onPausar,
}: {
  anim: boolean;
  dias: ProducaoSemanalDia[];
  cena: number;
  onPausar?: () => void;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);

  const semana = (dias ?? []).slice(-7);
  const totalPrevisto = semana.reduce((s, d) => s + d.previsto, 0);
  const totalEntregue = semana.reduce((s, d) => s + d.entregue, 0);
  const totalPendente = semana.reduce((s, d) => s + d.pendente, 0);
  const totalTonPrev = semana.reduce((s, d) => s + d.tonPrevisto, 0);
  const totalTonPend = semana.reduce((s, d) => s + d.tonPendente, 0);
  const totalOrdens = semana.reduce((s, d) => s + d.ordens, 0);
  const pctEntregue = totalPrevisto > 0 ? (totalEntregue / totalPrevisto) * 100 : 0;
  const pctPendente = 100 - pctEntregue;

  const secoes: SecaoDonut[] = [
    { id: "recebido", label: "recebido", cor: COR_RECEBIDO, pct: pctEntregue },
    { id: "previsto", label: "previsto", cor: COR_PREVISTO, pct: pctPendente },
  ];

  /* Tabela: Programado (total), Recebido (foco 0), Previsto (foco 1), Ordens */
  const linhas = [
    { rotulo: "Programado", un: totalPrevisto, ton: totalTonPrev, pct: 100, idx: -1 },
    { rotulo: "Recebido", un: totalEntregue, ton: 0, pct: pctEntregue, idx: 0 },
    { rotulo: "Previsto", un: totalPendente, ton: totalTonPend, pct: pctPendente, idx: 1 },
  ];

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Produção da Semana
        </p>
        <InfoTooltip onOpen={onPausar} texto="Ordens de produção programadas para os próximos 7 dias. Recebido = unidades já recebidas no estoque. Previsto = unidades que ainda faltam descer. Fonte: sistema Focco." />
      </div>

      <DonutInterativo
        secoes={secoes}
        foco={foco}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />
      <ToggleSecoes secoes={secoes} foco={foco} onChange={setFoco} />

      <div className="mt-2 w-full max-w-xs mx-auto space-y-1.5">
        <div className="rounded-lg bg-white/10 px-4 py-2 text-center">
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/60 uppercase">
            Recebido da Semana
          </p>
          <p className="text-[20px] font-extrabold text-white leading-tight">
            {fmtBrMax(pctEntregue, 1)}%
          </p>
          <p className="text-[10px] text-white/55">
            {fmtInt(totalEntregue)} de {fmtInt(totalPrevisto)} un · {fmtBrMax(totalTonPrev, 1)} t previstas
          </p>
        </div>
        <div className="rounded-lg bg-white/5 px-4 py-1.5 text-center">
          <p className="text-[12px] font-bold text-white">
            {fmtInt(totalOrdens)} ordens · {fmtBrMax(totalTonPend, 1)} t a receber
          </p>
        </div>
      </div>

      <div className="video-sobe mt-3 w-full max-w-xs mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Legenda
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Indicador</th>
              <th className="pb-0.5 text-right font-bold">Un.</th>
              <th className="pb-0.5 text-right font-bold">Ton.</th>
              <th className="pb-0.5 text-right font-bold">%</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const highlighted = l.idx === foco;
              const cor = l.idx >= 0 ? secoes[l.idx]?.cor : undefined;
              return (
                <tr
                  key={l.rotulo}
                  className={cn(
                    "border-b border-white/10 last:border-0 transition-all duration-300",
                    highlighted ? "bg-white/[0.04]" : l.idx >= 0 ? "opacity-35" : "",
                  )}
                >
                  <td className="py-0.5" style={highlighted ? { color: cor } : undefined}>{l.rotulo}</td>
                  <td className="py-0.5 text-right font-mono font-semibold" style={highlighted ? { color: cor } : undefined}>
                    {fmtInt(l.un)}
                  </td>
                  <td className="py-0.5 text-right font-mono text-white/50">
                    {l.ton > 0 ? fmtTonDec(l.ton) : "—"}
                  </td>
                  <td className="py-0.5 text-right font-mono font-bold" style={highlighted ? { color: cor } : undefined}>
                    {fmtBrMax(l.pct, 1)}%
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-white/40 bg-white/10 font-bold">
              <td className="py-1 text-white">Ordens</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(totalOrdens)}</td>
              <td className="py-1 text-right font-mono text-white">{fmtBrMax(totalTonPrev, 1)} t</td>
              <td className="py-1 text-right font-mono text-white">100%</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * Programado: ordens dos próximos 7 dias. Recebido: já recebido no estoque. Previsto: o que falta descer. Fonte: sistema Focco.
        </p>
      </div>

    </div>
  );
}
