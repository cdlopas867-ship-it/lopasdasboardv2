import { fmtInt, fmtDecMax } from "@/lib/format";
import { cn } from "@/lib/utils";

export type Viagem = {
  data: string;
  inicio: string;
  fim: string;
  turno: string;
  totalViagens: number;
  duracaoHoras: number;
};

export type ResumoViagens = {
  viagens: Viagem[];
  totalViagens: number;
  mediaViagens: number;
  totalDias: number;
  mediaPorTurno: { turno: string; media: number; total: number; pct: number }[];
  viagensPorDia: { data: string; total: number }[];
};

type Props = {
  cena: number;
  anim: boolean;
  dados: ResumoViagens;
};

/* Cenas da apresentação de Viagens — mesmas animações do dashboard. */
export default function CenasViagens({ cena, anim: _anim, dados }: Props) {
  const maxDia = Math.max(...dados.viagensPorDia.map((d) => d.total), 1);

  return (
    <>
      {/* Cena 0 — KPIs */}
      {cena === 0 && (
        <div>
          <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
            Controle de Viagens · Resumo
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="video-sobe rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
              <p className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">Total de Viagens</p>
              <p className="mt-1 font-serif text-4xl text-white">{fmtInt(dados.totalViagens)}</p>
            </div>
            <div className="video-sobe rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md" style={{ animationDelay: "0.12s" }}>
              <p className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">Média por Turno</p>
              <p className="mt-1 font-serif text-4xl text-white">{fmtDecMax(dados.mediaViagens, 1)}</p>
            </div>
            <div className="video-sobe rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md" style={{ animationDelay: "0.24s" }}>
              <p className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">Dias Registrados</p>
              <p className="mt-1 font-serif text-4xl text-white">{fmtInt(dados.totalDias)}</p>
            </div>
            <div className="video-sobe rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md" style={{ animationDelay: "0.36s" }}>
              <p className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">Média por Dia</p>
              <p className="mt-1 font-serif text-4xl text-white">
                {dados.totalDias > 0 ? fmtDecMax(dados.totalViagens / dados.totalDias, 1) : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cena 1 — Resumo por turno */}
      {cena === 1 && (
        <div>
          <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
            Distribuição por Turno
          </p>
          <div className="mt-4 space-y-4">
            {dados.mediaPorTurno.map((t, i) => (
              <div key={t.turno} className="video-sobe rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md" style={{ animationDelay: `${0.12 * i}s` }}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">
                    Turno {t.turno}
                  </p>
                  <span className="rounded-full bg-primary/20 px-3 py-0.5 text-xs font-bold text-primary">
                    {fmtDecMax(t.pct, 1)}%
                  </span>
                </div>
                <div className="mt-3 flex items-end gap-6">
                  <div>
                    <p className="text-xs text-white/50">Total</p>
                    <p className="font-serif text-2xl text-white">{fmtInt(t.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Média</p>
                    <p className="font-serif text-2xl text-white">{fmtDecMax(t.media, 1)}</p>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                  <div
                    className={cn("video-barra-x h-full rounded-full bg-primary", !_anim && "video-pausada")}
                    style={{ width: `${t.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cena 2 — Viagens por dia */}
      {cena === 2 && (
        <div>
          <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
            Viagens por Dia
          </p>
          <div className="video-sobe mt-4 space-y-2">
            {dados.viagensPorDia.slice().reverse().map((d, i) => (
              <div key={d.data} className="video-sobe flex items-center gap-3" style={{ animationDelay: `${0.06 * i}s` }}>
                <span className="w-20 shrink-0 text-xs tabular-nums text-white/50">{d.data}</span>
                <div className="h-6 flex-1 overflow-hidden rounded-lg bg-white/10">
                  <div
                    className={cn("video-barra-x flex h-full items-center justify-end rounded-lg bg-primary/80 px-2", !_anim && "video-pausada")}
                    style={{ width: `${(d.total / maxDia) * 100}%` }}
                  >
                    <span className="text-[10px] font-bold text-primary-foreground">{fmtInt(d.total)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cena 3 — Detalhamento por turno */}
      {cena === 3 && (
        <div>
          <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
            Detalhamento por Turno · {dados.viagens.length} registros
          </p>
          <div className="video-sobe mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20 text-left text-[10px] font-semibold tracking-widest text-white/50 uppercase">
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Início</th>
                  <th className="px-3 py-2">Fim</th>
                  <th className="px-3 py-2">Turno</th>
                  <th className="px-3 py-2 text-right">Duração (h)</th>
                  <th className="px-3 py-2 text-right">Viagens</th>
                  <th className="px-3 py-2 text-right">% do Dia</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const porData = new Map<string, number>();
                  for (const v of dados.viagens) porData.set(v.data, (porData.get(v.data) ?? 0) + v.totalViagens);
                  return dados.viagens.slice(0, 15).map((v, i) => {
                    const totalDia = porData.get(v.data) ?? 0;
                    const pctDia = totalDia > 0 ? (v.totalViagens / totalDia) * 100 : 0;
                    return (
                      <tr key={i} className="border-b border-white/10 last:border-0">
                        <td className="px-3 py-2.5 tabular-nums text-white/60">{v.data}</td>
                        <td className="px-3 py-2.5 tabular-nums text-white">{v.inicio}</td>
                        <td className="px-3 py-2.5 tabular-nums text-white">{v.fim}</td>
                        <td className="px-3 py-2.5">
                          <span className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            v.turno === "NOITE"
                              ? "bg-indigo-500/20 text-indigo-300"
                              : "bg-amber-500/20 text-amber-300",
                          )}>
                            {v.turno}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-white/50">{fmtDecMax(v.duracaoHoras, 1)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-white">{fmtInt(v.totalViagens)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-primary">{fmtDecMax(pctDia, 1)}%</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
