/* Cena Produção da Semana — donut interativo com Peso Previsto × Recebido.
   Mesmo padrão da CenaRecebimentoTurno: donut + toggle + tabela.
   A tonelagem (peso em toneladas) fica em destaque no card e na tabela. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import { semanaAtual, type ProducaoSemanalDia } from "@/lib/producao-semanal";

const COR_PRODUZIDO = "#33D953"; // verde
const COR_RECEBIDO = "#38BDF8"; // azul
const COR_PREVISTO = "#FFA500"; // laranja

const ROTULOS = ["Peso Previsto", "Recebido"];

/* Variação percentual da tonelagem de um dia para o outro (▲ sobe / ▼ desce). */
function VariacaoDia({ atual, anterior }: { atual: number; anterior: number | undefined }) {
  if (anterior == null || anterior <= 0) return null;
  const pct = ((atual - anterior) / anterior) * 100;
  const up = pct >= 0;
  return (
    <div className={cn("text-[9px] font-bold leading-tight", up ? "text-emerald-400" : "text-red-400")}>
      {up ? "▲" : "▼"} {fmtBrMax(Math.abs(pct), 1)}%
    </div>
  );
}

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

  const semana = semanaAtual(dias);
  const totalPrevisto = semana.reduce((s, d) => s + d.previsto, 0);
  const totalRecebido = semana.reduce((s, d) => s + d.entregue, 0);
  const totalTonPrev = semana.reduce((s, d) => s + d.tonPrevisto, 0);
  const totalTonRec = semana.reduce((s, d) => s + d.tonEntregue, 0);
  const totalOrdens = semana.reduce((s, d) => s + d.ordens, 0);
  /* Total previsto de todo o período da planilha (base do %) — equivale ao
     "Total Geral" da tabela dinâmica de Soma de PESO PREVISTO por DT FINAL. */
  const totalUnPeriodo = dias.reduce((s, d) => s + d.previsto, 0);
  const totalTonPeriodo = dias.reduce((s, d) => s + d.tonPrevisto, 0);

  /* % = quanto a semana representa do total previsto do período. */
  const pctPesoPrevisto = totalTonPeriodo > 0 ? (totalTonPrev / totalTonPeriodo) * 100 : 0;
  const pctRecebido = totalTonPeriodo > 0 ? (totalTonRec / totalTonPeriodo) * 100 : 0;

  const secoes: SecaoDonut[] = [
    { id: "previsto", label: "peso previsto", cor: COR_PREVISTO, pct: pctPesoPrevisto },
    { id: "recebido", label: "recebido", cor: COR_RECEBIDO, pct: pctRecebido },
  ];

  /* Tabela: Total previsto (período) + Peso Previsto / Recebido (semana). */
  const linhas = [
    { rotulo: "Total previsto", cor: undefined as string | undefined, un: totalUnPeriodo, ton: totalTonPeriodo, pct: 100, idx: -1 },
    { rotulo: "Peso Previsto", cor: COR_PREVISTO, un: totalPrevisto, ton: totalTonPrev, pct: pctPesoPrevisto, idx: 0 },
    { rotulo: "Recebido", cor: COR_RECEBIDO, un: totalRecebido, ton: totalTonRec, pct: pctRecebido, idx: 1 },
  ];

  const focoSecao = secoes[foco] ?? secoes[0]!;
  const focoLinha = linhas[foco + 1]!;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Produção da Semana
        </p>
        <InfoTooltip onOpen={onPausar} texto="Ordens de produção da semana atual (seg–dom). Peso Previsto = tonelagem programada para esta semana (PESO PREVISTO). Recebido = o que efetivamente chegou ao estoque (planilha PESO RECEBIDO POR PERÍODO). O % compara cada um com o total previsto do período (Total Geral da Soma de PESO PREVISTO por DT FINAL). Peso em toneladas. Fonte: sistema Focco." />
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
            {ROTULOS[foco]} da Semana
          </p>
          <p className="text-[20px] font-extrabold leading-tight" style={{ color: focoSecao.cor }}>
            {fmtBrMax(focoSecao.pct, 1)}%
          </p>
          <p className="text-[10px] text-white/55">
            {fmtInt(focoLinha.un)} de {fmtInt(totalUnPeriodo)} un ·{" "}
            <span className="font-bold text-white/90">{fmtBrMax(focoLinha.ton, 1)} t</span>
          </p>
        </div>
        <div className="rounded-lg bg-white/5 px-4 py-1.5 text-center">
          <p className="text-[12px] font-bold text-white">
            {fmtInt(totalOrdens)} ordens · {fmtBrMax(totalTonPrev, 1)} t previstas nesta semana
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
              <th className="pb-0.5 font-bold">Legenda</th>
              <th className="pb-0.5 font-bold">Indicador</th>
              <th className="pb-0.5 text-right font-bold">Un.</th>
              <th className="pb-0.5 text-right font-bold">Ton.</th>
              <th className="pb-0.5 text-right font-bold">%</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const highlighted = l.idx === foco;
              return (
                <tr
                  key={l.rotulo}
                  className={cn(
                    "border-b border-white/10 last:border-0 transition-all duration-300",
                    highlighted ? "bg-white/[0.04]" : l.idx >= 0 ? "opacity-35" : "",
                  )}
                >
                  <td className="py-0.5">
                    <span
                      className="inline-block size-2 rounded-full align-middle"
                      style={{ background: l.cor ?? "rgba(255,255,255,0.35)" }}
                    />
                  </td>
                  <td className="py-0.5" style={highlighted ? { color: l.cor } : undefined}>{l.rotulo}</td>
                  <td className="py-0.5 text-right font-mono font-semibold" style={highlighted ? { color: l.cor } : undefined}>
                    {fmtInt(l.un)}
                  </td>
                  <td className="py-0.5 text-right">
                    <span
                      className={cn("font-mono font-bold", l.ton > 0 ? "text-white" : "text-white/40")}
                      style={l.ton > 0 ? { color: l.cor ?? "#fff" } : undefined}
                    >
                      {l.ton > 0 ? fmtBrMax(l.ton, 1) : "—"}
                    </span>
                  </td>
                  <td className="py-0.5 text-right font-mono font-bold" style={highlighted ? { color: l.cor } : undefined}>
                    {fmtBrMax(l.pct, 1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * Peso Previsto: tonelagem programada para esta semana. Recebido: já chegou ao estoque. % sobre o total previsto do período. Tonelagem em toneladas (t). Fonte: sistema Focco.
        </p>
      </div>

      {/* Dia a dia — produzido × recebido por dia (data final) da semana atual */}
      <div className="video-sobe mt-3 w-full max-w-xs mx-auto" style={{ animationDelay: "0.65s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Dia a dia
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest uppercase">
              <th className="pb-0.5 font-bold text-white/55">Dia</th>
              <th className="pb-0.5 text-right font-bold" style={{ color: COR_PRODUZIDO }}>
                Produzido
              </th>
              <th className="pb-0.5 text-right font-bold" style={{ color: COR_RECEBIDO }}>
                Recebido
              </th>
            </tr>
          </thead>
          <tbody>
            {semana.map((d, i) => {
              const ant = semana[i - 1];
              return (
                <tr key={d.iso} className="border-b border-white/10 last:border-0">
                  <td className="py-0.5 whitespace-nowrap">
                    <span className="font-semibold text-white/90">{d.dia}</span>{" "}
                    <span className="text-[9px] text-white/45">{d.data}</span>
                  </td>
                  <td className="py-0.5 text-right">
                    <span className="font-mono font-bold" style={{ color: COR_PRODUZIDO }}>
                      {d.tonPrevisto > 0 ? `${fmtBrMax(d.tonPrevisto, 1)} t` : "—"}
                    </span>{" "}
                    <span className="text-[9px] text-white/45">{fmtInt(d.produzido)}</span>
                    <VariacaoDia atual={d.tonPrevisto} anterior={ant?.tonPrevisto} />
                  </td>
                  <td className="py-0.5 text-right">
                    <span className="font-mono font-bold" style={{ color: COR_RECEBIDO }}>
                      {d.tonEntregue > 0 ? `${fmtBrMax(d.tonEntregue, 1)} t` : "—"}
                    </span>{" "}
                    <span className="text-[9px] text-white/45">{fmtInt(d.entregue)}</span>
                    <VariacaoDia atual={d.tonEntregue} anterior={ant?.tonEntregue} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * Tonelagem (t) e unidades por dia (data final). Produzido = peso previsto (PESO PREVISTO); Recebido = já chegou ao estoque. ▲/▼ = variação em % da tonelagem vs dia anterior.
        </p>
      </div>

    </div>
  );
}
