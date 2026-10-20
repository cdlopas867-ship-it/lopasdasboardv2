/* Cena Recebimento por turno — donut interativo com toggle entre turnos. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtDecMax, fmtInt, fmtTonDec } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, BannerResumo, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import type { VideoTurno } from "./VideoResumoDashboard";
import type { ResumoViagens } from "@/lib/viagens-store";

const CORES_TURNO = ["#00FFCC", "#FFA500", "#A78BFA"];

export default function CenaRecebimentoTurno({
  anim,
  turnos,
  cena,
  viagens,
  onPausar,
}: {
  anim: boolean;
  turnos: VideoTurno[];
  cena: number;
  viagens?: ResumoViagens | null;
  onPausar?: () => void;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);
  const totalTon = turnos.reduce((s, t) => s + (t.ton ?? 0), 0);
  const turnoPrincipal = turnos.length ? turnos.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;

  const secoes: SecaoDonut[] = turnos.map((t, i) => ({
    id: t.nome,
    label: `turno ${t.nome.toLowerCase()}`,
    cor: CORES_TURNO[i % CORES_TURNO.length]!,
    pct: t.pct,
  }));

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Recebimento por turno
        </p>
        <InfoTooltip onOpen={onPausar} texto="Distribuição do recebimento entre turnos. Turno dia: 06:00–17:59. Turno noite: 18:00–02:30. Percentual = tonelagem do turno ÷ total recebido. Fonte: sistema Focco. Período acumulado de 2026." />
      </div>

      <DonutInterativo
        secoes={secoes}
        foco={Math.min(foco, secoes.length - 1)}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />
      <ToggleSecoes secoes={secoes} foco={Math.min(foco, secoes.length - 1)} onChange={setFoco} />

      <div className="video-sobe mt-3 w-full max-w-xs mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Legenda
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Turno</th>
              <th className="pb-0.5 text-center font-bold">Faixa</th>
              <th className="pb-0.5 text-right font-bold">Ton.</th>
              <th className="pb-0.5 text-right font-bold">%</th>
            </tr>
          </thead>
          <tbody>
            {turnos.map((t, i) => (
              <tr
                key={t.nome}
                className={cn(
                  "border-b border-white/10 last:border-0 transition-all duration-300",
                  i === foco ? "bg-white/[0.04]" : "opacity-35",
                )}
                style={i === foco ? { color: secoes[i]?.cor } : undefined}
              >
                <td className="py-0.5" style={i === foco ? { color: secoes[i]?.cor } : undefined}>{t.nome}</td>
                <td className="py-0.5 text-center text-white/50">{t.faixa ?? "—"}</td>
                <td className="py-0.5 text-right font-mono font-semibold" style={i === foco ? { color: secoes[i]?.cor } : undefined}>
                  {t.ton ? fmtTonDec(t.ton) : "—"}
                </td>
                <td className="py-0.5 text-right font-mono font-bold" style={i === foco ? { color: secoes[i]?.cor } : undefined}>
                  {fmtBrMax(t.pct, 1)}%
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-white/40 bg-white/10 font-bold">
              <td className="py-1 text-white">Total</td>
              <td />
              <td className="py-1 text-right font-mono text-white">
                {totalTon ? fmtTonDec(totalTon) : "—"}
              </td>
              <td className="py-1 text-right font-mono text-white">100%</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * Turno dia: 06:00–17:59. * Turno noite: 18:00–02:30. Fonte: sistema Focco.
        </p>
      </div>

      <BannerResumo texto={`${fmtTonDec(turnos[Math.min(foco, turnos.length - 1)]?.ton ?? 0)} recebidas · ${fmtBrMax(turnos[Math.min(foco, turnos.length - 1)]?.pct ?? 0, 1)}%`} />

      {/* Viagens CD — média de caminhões recebidos por dia e por turno (planilha CDEVIAGENS) */}
      {viagens && viagens.totalViagens > 0 && (() => {
        const mediaDia = viagens.totalDias > 0 ? viagens.totalViagens / viagens.totalDias : 0;
        const porTurno = viagens.mediaPorTurno.filter((t) => t.turno && t.turno !== "—");
        if (mediaDia <= 0 && porTurno.length === 0) return null;
        return (
          <div className="video-sobe mt-3 w-full max-w-xs mx-auto rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md" style={{ animationDelay: "0.55s" }}>
            <p className="text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
              Viagens CD · Caminhões recebidos
            </p>
            <div className="mt-2 flex items-center justify-center gap-5 text-center">
              <div>
                <p className="text-[9px] text-white/50 uppercase">Média/dia</p>
                <p className="font-serif text-2xl leading-7 text-white">{fmtDecMax(mediaDia, 1)}</p>
              </div>
              {porTurno.map((t) => (
                <div key={t.turno}>
                  <p className="text-[9px] text-white/50 uppercase">Turno {t.turno.toLowerCase()}</p>
                  <p className="font-serif text-2xl leading-7 text-white">{fmtDecMax(t.media, 1)}</p>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-[8px] leading-tight text-white/40">
              Média de caminhões por dia e por turno · Fonte: planilha CDEVIAGENS.
            </p>
          </div>
        );
      })()}
    </div>
  );
}
