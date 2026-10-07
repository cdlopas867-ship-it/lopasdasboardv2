/* Cena Produção da Semana — detalhamento das ordens da semana atual
   (DT FINAL, LOTE, VOLUME, PESO PREVISTO, PESO REALIZADO), no lugar do
   donut/botões/legenda de Produzido × Recebido × A produzir.
   Mantém a tabela "Dia a dia" (produzido × recebido) com a variação %. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { semanaAtual, type ProducaoSemanalDia } from "@/lib/producao-semanal";

const COR_PRODUZIDO = "#33D953"; // verde
const COR_RECEBIDO = "#38BDF8"; // azul

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
  dias,
  onPausar,
}: {
  anim: boolean;
  dias: ProducaoSemanalDia[];
  cena: number;
  onPausar?: () => void;
}) {
  const semana = semanaAtual(dias);
  /* Linhas cruas da planilha de produção para os dias da semana atual. */
  const ordens = semana.flatMap((d) => d.linhas ?? []);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Produção da Semana
        </p>
        <InfoTooltip onOpen={onPausar} texto="Ordens de produção da semana atual (seg–dom): DT FINAL, LOTE, VOLUME e PESO PREVISTO / PESO REALIZADO (kg). Fonte: planilha PCP 003 - Análise de Realização Total (sistema Focco)." />
      </div>

      {/* Ordens da semana — dados crus da planilha de produção */}
      <div className="video-sobe mt-3 w-full max-w-2xl mx-auto" style={{ animationDelay: "0.35s" }}>
        <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Ordens da semana · {fmtInt(ordens.length)}
        </p>
        <div className="max-h-[46vh] overflow-y-auto rounded-lg border border-white/10 bg-black/10">
          <table className="w-full text-left text-[10px] text-white">
            <thead className="sticky top-0 z-[1] bg-[#3a521a]/95 backdrop-blur">
              <tr className="text-[8px] font-bold tracking-widest text-white/60 uppercase">
                <th className="px-2 py-1.5 font-bold">DT Final</th>
                <th className="px-2 py-1.5 font-bold">Lote</th>
                <th className="px-2 py-1.5 font-bold">Volume</th>
                <th className="px-2 py-1.5 text-right font-bold">Peso Previsto</th>
                <th className="px-2 py-1.5 text-right font-bold">Peso Realizado</th>
              </tr>
            </thead>
            <tbody>
              {ordens.map((l, i) => (
                <tr key={`${l.data}-${l.lote}-${i}`} className="border-b border-white/10 last:border-0">
                  <td className="px-2 py-0.5 whitespace-nowrap font-mono">{l.data}</td>
                  <td className="px-2 py-0.5 whitespace-nowrap font-mono">{l.lote || "—"}</td>
                  <td className="px-2 py-0.5">
                    <span className="block max-w-[15rem] truncate" title={l.volume}>
                      {l.volume || "—"}
                    </span>
                  </td>
                  <td className="px-2 py-0.5 text-right font-mono font-semibold">
                    {l.pesoPrevisto > 0 ? fmtBrMax(l.pesoPrevisto, 1) : "—"}
                  </td>
                  <td className="px-2 py-0.5 text-right font-mono font-semibold">
                    {l.pesoRealizado > 0 ? fmtBrMax(l.pesoRealizado, 1) : "—"}
                  </td>
                </tr>
              ))}
              {ordens.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-center text-white/50">
                    Nenhuma ordem de produção na semana atual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-[8px] leading-tight text-white/40">
          * Ordens de produção da semana atual (seg–dom), agrupadas por DT FINAL. Pesos em kg. Fonte: planilha PCP 003 - Análise de Realização Total (sistema Focco).
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
