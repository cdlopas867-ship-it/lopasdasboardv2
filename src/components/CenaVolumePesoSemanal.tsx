/* Cena — Relação de volumes e peso do estoque por dia.
   Mostra o total de unidades (volume) e toneladas (peso) de cada dia,
   com o índice (peso ÷ volume × 100) — a densidade em toneladas por 100 un. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import type { RecebimentoSemanalDia } from "@/components/VideoResumoDashboard";

type Dia = {
  iso: string;
  label: string;
  diaSemana: string;
  volume: number;
  peso: number;
  indice: number;
};

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function agruparDias(dias: RecebimentoSemanalDia[]): Dia[] {
  const map = new Map<string, { volume: number; peso: number }>();
  for (const d of dias) {
    if (!d.iso) continue;
    const date = new Date(d.iso + "T12:00:00Z");
    if (isNaN(date.getTime())) continue;
    const key = d.iso;
    const atual = map.get(key) ?? { volume: 0, peso: 0 };
    atual.volume += d.totalQtd ?? 0;
    atual.peso += d.ton ?? 0;
    map.set(key, atual);
  }
  const resultado = [...map.entries()].map(([iso, v]) => {
    const date = new Date(iso + "T12:00:00Z");
    const fmt = `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    return {
      iso,
      label: fmt,
      diaSemana: DIAS_SEMANA[date.getUTCDay()] ?? "",
      volume: v.volume,
      peso: Math.round(v.peso * 10) / 10,
      indice: v.volume > 0 ? Math.round((v.peso / v.volume) * 100 * 100) / 100 : 0,
    };
  });
  resultado.sort((a, b) => a.iso.localeCompare(b.iso));
  return resultado.slice(-14);
}

export default function CenaVolumePesoSemanal({
  anim,
  recebimentoSemanal,
  onPausar,
}: {
  anim: boolean;
  recebimentoSemanal?: RecebimentoSemanalDia[];
  onPausar?: () => void;
}) {
  const dias = agruparDias(recebimentoSemanal ?? []);
  const temVolume = dias.some((s) => s.volume > 0);
  const maxPeso = Math.max(...dias.map((s) => s.peso), 1);
  const maxVolume = Math.max(...dias.map((s) => s.volume), 1);
  const totPeso = dias.reduce((s, w) => s + w.peso, 0);
  const totVolume = dias.reduce((s, w) => s + w.volume, 0);
  const indiceGeral = totVolume > 0 ? (totPeso / totVolume) * 100 : 0;

  if (dias.length === 0) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Volume × Peso · por dia
        </p>
        <p className="video-sobe font-serif text-3xl text-white/70">Sem dados de recebimento.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Volume × Peso · por dia
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto="Relação entre o volume (unidades) e o peso (toneladas) do recebimento do CD, por dia. O índice = peso ÷ volume × 100 mostra a densidade em toneladas por 100 unidades — quanto maior, mais pesado é o mix recebido no dia. Fonte: planilha PESO RECEBIDO POR PERÍODO do Google Drive."
        />
      </div>

      {/* Resumo — totais e índice geral */}
      <div className="video-sobe mt-3 flex flex-wrap items-center justify-center gap-4">
        <div className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-center">
          <p className="font-serif text-2xl text-white sm:text-3xl">{fmtInt(totPeso)} <span className="text-base text-white/50">t</span></p>
          <p className="text-[8px] font-bold tracking-widest text-white/50 uppercase">Peso total</p>
        </div>
        {temVolume && (
          <div className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-center">
            <p className="font-serif text-2xl text-white sm:text-3xl">{fmtInt(totVolume)}</p>
            <p className="text-[8px] font-bold tracking-widest text-white/50 uppercase">Volume total (un)</p>
          </div>
        )}
        {temVolume && (
          <div className="rounded-xl border border-brand-amber/30 bg-brand-amber/10 px-5 py-2.5 text-center">
            <p className="font-serif text-2xl text-brand-amber sm:text-3xl">{fmtBrMax(indiceGeral, 2)}</p>
            <p className="text-[8px] font-bold tracking-widest text-brand-amber/70 uppercase">Índice geral (t/100un)</p>
          </div>
        )}
      </div>

      {/* Tabela diária */}
      <div className="video-sobe mx-auto mt-4 w-full max-w-3xl overflow-hidden rounded-xl border border-white/15 bg-white/5" style={{ animationDelay: "0.15s" }}>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="px-3 py-1.5 font-bold">Dia</th>
              <th className="px-2 py-1.5 text-right font-bold">Volume (un)</th>
              <th className="px-2 py-1.5 text-right font-bold">Peso (t)</th>
              <th className="px-3 py-1.5 text-right font-bold">Índice</th>
            </tr>
          </thead>
          <tbody>
            {dias.map((s, i) => (
              <tr key={s.iso} className="border-b border-white/10 last:border-0">
                <td className="px-3 py-1.5 font-mono text-[10px] font-semibold text-white/85">
                  {s.label} <span className="text-white/40">{s.diaSemana}</span>
                </td>
                <td className="px-2 py-1.5 text-right">
                  {s.volume > 0 ? (
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-[12px] font-bold text-white">{fmtInt(s.volume)}</span>
                      <span className="mt-0.5 block h-[3px] w-16 overflow-hidden rounded-full bg-white/10">
                        <span
                          className={cn("block h-full rounded-full bg-white/60", !anim && "video-pausada")}
                          style={{ width: `${(s.volume / maxVolume) * 100}%` }}
                        />
                      </span>
                    </div>
                  ) : (
                    <span className="text-white/30">—</span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-[12px] font-bold text-brand-amber">{fmtBrMax(s.peso, 1)}</span>
                    <span className="mt-0.5 block h-[3px] w-16 overflow-hidden rounded-full bg-white/10">
                      <span
                        className={cn("block h-full rounded-full bg-brand-amber/70", !anim && "video-pausada")}
                        style={{ width: `${(s.peso / maxPeso) * 100}%` }}
                      />
                    </span>
                  </div>
                </td>
                <td className="px-3 py-1.5 text-right">
                  {s.indice > 0 ? (
                    <span className="font-mono text-[12px] font-bold text-white/90">{fmtBrMax(s.indice, 2)}</span>
                  ) : (
                    <span className="text-white/30">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-white/20 font-bold">
              <td className="px-3 py-1.5 text-white/80">Total · {dias.length} dias</td>
              <td className="px-2 py-1.5 text-right font-mono text-[12px] text-white">{temVolume ? fmtInt(totVolume) : "—"}</td>
              <td className="px-2 py-1.5 text-right font-mono text-[12px] text-brand-amber">{fmtBrMax(totPeso, 1)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-[12px] text-white/90">{temVolume ? fmtBrMax(indiceGeral, 2) : "—"}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mx-auto mt-2 max-w-3xl text-center text-[8px] leading-tight text-white/40">
        Índice = toneladas ÷ unidades × 100 (densidade em t/100un). Dias sem volume (—) não têm
        contagem de unidades no recebimento. Últimos {dias.length} dias com recebimento.
      </p>
    </div>
  );
}
