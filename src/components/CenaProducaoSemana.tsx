/* Cena Produção da Semana — donut interativo com Recebido × Diferença (o que falta receber).
   Mesmo padrão da CenaRecebimentoTurno: donut + toggle + tabela.
   Os % são sobre o peso previsto da semana. */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, DestaqueGradiente, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import { semanaAtual, type ProducaoSemanalDia } from "@/lib/producao-semanal";
import type { RecebimentoSemanalDia } from "./VideoResumoDashboard";

const COR_PRODUZIDO = "#33D953"; // verde
const COR_RECEBIDO = "#38BDF8"; // azul
const COR_DIFERENCA = "#FFA500"; // laranja

const META_DIARIA = 330; // meta de 330 t/dia

const CORES_TAMANHO: Record<string, string> = {
  P: "#22c55e",
  M: "#3b82f6",
  G: "#f97316",
  GG: "#a855f7",
};

const TITULOS = ["Recebido da Semana", "Falta Receber"];

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
  recebimentoSemanal,
  cena,
  onPausar,
}: {
  anim: boolean;
  dias: ProducaoSemanalDia[];
  recebimentoSemanal?: RecebimentoSemanalDia[];
  cena: number;
  onPausar?: () => void;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);
  const [mostraPaletes, setMostraPaletes] = useState(false);

  const semana = semanaAtual(dias);
  const totalPrevisto = semana.reduce((s, d) => s + d.previsto, 0);
  const totalRecebido = semana.reduce((s, d) => s + d.entregue, 0);
  const totalTonPrev = semana.reduce((s, d) => s + d.tonPrevisto, 0);
  const totalTonRec = semana.reduce((s, d) => s + d.tonEntregue, 0);
  const totalOrdens = semana.reduce((s, d) => s + d.ordens, 0);

  /* Recebido = já chegou ao estoque; Diferença = o que falta receber (previsto − recebido).
     Os % são sobre o peso previsto da semana (base = 100%). */
  const pctRecebido = totalTonPrev > 0 ? (totalTonRec / totalTonPrev) * 100 : 0;
  const pctDiferenca = totalTonPrev > 0 ? 100 - pctRecebido : 0;
  const unFalta = totalPrevisto - totalRecebido;
  const tonFalta = totalTonPrev - totalTonRec;

  const secoes: SecaoDonut[] = [
    { id: "recebido", label: "recebido", cor: COR_RECEBIDO, pct: pctRecebido },
    { id: "diferenca", label: "falta receber", cor: COR_DIFERENCA, pct: pctDiferenca },
  ];

  const linhas = [
    { rotulo: "Recebido", cor: COR_RECEBIDO, un: totalRecebido, ton: totalTonRec, pct: pctRecebido, idx: 0 },
    { rotulo: "Diferença", cor: COR_DIFERENCA, un: unFalta, ton: tonFalta, pct: pctDiferenca, idx: 1 },
  ];

  const focoSecao = secoes[foco] ?? secoes[0]!;
  const focoLinha = linhas[foco]!;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Produção da Semana
        </p>
        <InfoTooltip onOpen={onPausar} texto="Ordens de produção da semana atual (seg–dom). Recebido = o que já chegou ao estoque (planilha Gerenciamento dos recebimentos - WF0072, pelo peso de cada autorização). Diferença = o que falta receber (peso previsto da semana − recebido). Os % são sobre o peso previsto da semana (PESO PREVISTO). Peso em toneladas. Fonte: sistema Focco." />
      </div>

      <DonutInterativo
        secoes={secoes}
        foco={foco}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />
      <ToggleSecoes secoes={secoes} foco={foco} onChange={setFoco} />

      <div className="mt-2 w-full max-w-xs mx-auto space-y-1.5">
        <div className="flex w-full justify-center">
          <DestaqueGradiente
            numero={`${fmtBrMax(focoSecao.pct, 1)}%`}
            rotulo={TITULOS[foco]}
          />
        </div>
        <p className="text-center text-[10px] text-white/55">
          {fmtInt(focoLinha.un)} de {fmtInt(totalPrevisto)} un ·{" "}
          <span className="font-bold text-white/90">{fmtBrMax(focoLinha.ton, 1)} t</span>
        </p>
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
                    highlighted ? "bg-white/[0.04]" : "opacity-35",
                  )}
                >
                  <td className="py-0.5">
                    <span
                      className="inline-block size-2 rounded-full align-middle"
                      style={{ background: l.cor }}
                    />
                  </td>
                  <td className="py-0.5" style={highlighted ? { color: l.cor } : undefined}>{l.rotulo}</td>
                  <td className="py-0.5 text-right font-mono font-semibold" style={highlighted ? { color: l.cor } : undefined}>
                    {fmtInt(l.un)}
                  </td>
                  <td className="py-0.5 text-right">
                    <span
                      className={cn("font-mono font-bold", l.ton > 0 ? "text-white" : "text-white/40")}
                      style={l.ton > 0 ? { color: l.cor } : undefined}
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
          <tfoot>
            <tr className="border-t-2 border-white/40 bg-white/10 font-bold">
              <td className="py-1" />
              <td className="py-1 text-white">Total</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(totalRecebido + unFalta)}</td>
              <td className="py-1 text-right font-mono text-white">{fmtBrMax(totalTonRec + tonFalta, 1)}</td>
              <td className="py-1 text-right font-mono text-white">100%</td>
            </tr>
          </tfoot>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * Recebido: já chegou ao estoque (Gerenciamento dos recebimentos · WF0072). Diferença: o que falta receber (peso previsto da semana − recebido). % sobre o peso previsto da semana. Tonelagem em toneladas (t). Fonte: sistema Focco.
        </p>
      </div>

      {/* Botão: Tipos de Paletes Recebidos */}
      {recebimentoSemanal && recebimentoSemanal.length > 0 && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMostraPaletes((v) => !v); onPausar?.(); }}
            className={cn(
              "rounded-full border px-4 py-1 text-[9px] font-bold tracking-widest uppercase backdrop-blur-sm transition-colors",
              mostraPaletes
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10",
            )}
          >
            {mostraPaletes ? "✓ Tipos de Paletes Recebidos" : "▶ Tipos de Paletes Recebidos"}
          </button>
        </div>
      )}

      {/* Tipos de Paletes Recebidos por dia — toggleable */}
      {mostraPaletes && recebimentoSemanal && recebimentoSemanal.length > 0 && (
        <div className="video-sobe mt-2 w-full max-w-xs mx-auto" style={{ animationDelay: "0.1s" }}>
          <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
            Tipos de Paletes Recebidos
          </p>
          <table className="w-full text-left text-[10px] text-white">
            <thead>
              <tr className="border-b border-white/20 text-[7px] font-bold tracking-widest uppercase">
                <th className="pb-0.5 font-bold text-white/55">Dia</th>
                <th className="pb-0.5 font-bold text-white/55">Tipos de palete</th>
                <th className="pb-0.5 text-right font-bold text-white/55">QTD</th>
                <th className="pb-0.5 text-right font-bold text-white/55">Paletes</th>
              </tr>
            </thead>
            <tbody>
              {recebimentoSemanal.slice(-7).map((d) => (
                <tr key={d.iso} className="border-b border-white/10 last:border-0">
                  <td className="py-0.5 whitespace-nowrap">
                    <span className="font-semibold text-white/90">{d.dia}</span>{" "}
                    <span className="text-[8px] text-white/45">{d.data}</span>
                  </td>
                  <td className="py-0.5">
                    <div className="flex flex-wrap gap-0.5">
                      {d.porTamanho.map((t) => {
                        const cor = CORES_TAMANHO[t.tamanho] ?? "#6b7280";
                        return (
                          <span
                            key={t.tamanho}
                            className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[8px] font-bold"
                            style={{ background: `${cor}20`, color: cor }}
                          >
                            {t.tamanho}
                            <span className="font-mono">{fmtInt(t.und)}</span>
                            <span className="text-white/40">·</span>
                            <span className="font-mono">{fmtInt(t.paletes)}p</span>
                          </span>
                        );
                      })}
                      {d.porTamanho.length === 0 && (
                        <span className="text-[8px] text-white/30">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-0.5 text-right font-mono text-white/80">{fmtInt(d.totalQtd)}</td>
                  <td className="py-0.5 text-right font-mono font-bold text-white">{fmtInt(d.totalPaletes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dia a dia — produzido × recebido por dia (data final) da semana atual */}
      <div className="video-sobe mt-3 w-full max-w-xs mx-auto" style={{ animationDelay: "0.65s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Dia a dia · Meta {META_DIARIA} t/dia
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
              <th className="pb-0.5 text-right font-bold text-white/55">Meta</th>
              <th className="pb-0.5 text-right font-bold text-white/55">Média</th>
            </tr>
          </thead>
          <tbody>
            {semana.map((d, i) => {
              const ant = semana[i - 1];
              const cumpriuMeta = d.tonEntregue >= META_DIARIA;
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
                  <td className="py-0.5 text-right">
                    {d.tonEntregue > 0 ? (
                      <span
                        className={cn("font-mono font-bold", cumpriuMeta ? "text-emerald-400" : "text-brand-amber")}
                      >
                        {fmtBrMax((d.tonEntregue / META_DIARIA) * 100, 0)}%
                      </span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                    {d.tonEntregue > 0 && (
                      <span className={cn("ml-0.5", cumpriuMeta ? "text-emerald-400" : "text-white/30")}>
                        {cumpriuMeta ? "✓" : ""}
                      </span>
                    )}
                  </td>
                  <td className="py-0.5 text-right">
                    <span className="font-mono font-bold text-white/90">
                      {d.ordens > 0 && d.tonPrevisto > 0
                        ? `${fmtBrMax(d.tonPrevisto / d.ordens, 1)} t`
                        : "—"}
                    </span>
                    <span className="block text-[9px] text-white/45">
                      {d.ordens > 0 ? "por ordem" : ""}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * Tonelagem (t) e unidades por dia (data final). Produzido = peso previsto (PESO PREVISTO); Recebido = já chegou ao estoque (Gerenciamento dos recebimentos · WF0072). Meta = {META_DIARIA} t/dia (% do recebido vs meta · ✓ = meta batida). Média = tonelagem prevista do dia ÷ nº de ordens de produção do dia. ▲/▼ = variação em % da tonelagem vs dia anterior.
        </p>
      </div>

    </div>
  );
}
