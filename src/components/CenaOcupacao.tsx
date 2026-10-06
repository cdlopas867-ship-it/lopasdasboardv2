/* Cena Ocupação do CD — donut interativo com toggle Ocupado / Livre. */

import { fmtBrMax, fmtInt } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, TotaisDestacados, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import type { VideoOcupacao } from "./VideoResumoDashboard";

const COR_OCUPADO = "#00FFCC";
const COR_LIVRE = "#FFA500";
const COR_BLOQUEADO = "#FF4444";

export default function CenaOcupacao({
  anim,
  ocupacao,
  cena,
  onPausar,
}: {
  anim: boolean;
  ocupacao: VideoOcupacao;
  cena: number;
  onPausar?: () => void;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);

  const bloqueados = ocupacao.bloqueados ?? 0;
  const total = ocupacao.ocupados + ocupacao.livres + bloqueados;
  const secoes: SecaoDonut[] = [
    { id: "ocupado", label: "ocupado", cor: COR_OCUPADO, pct: total > 0 ? (ocupacao.ocupados / total) * 100 : ocupacao.pct * 100 },
    { id: "livre", label: "livre", cor: COR_LIVRE, pct: total > 0 ? (ocupacao.livres / total) * 100 : (1 - ocupacao.pct) * 100 },
    ...(bloqueados > 0 ? [{ id: "bloqueado", label: "bloqueado", cor: COR_BLOQUEADO, pct: total > 0 ? (bloqueados / total) * 100 : 0 }] : []),
  ];

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Ocupação do CD
        </p>
        <InfoTooltip onOpen={onPausar} texto="Taxa de ocupação das posições de armazenagem. Cálculo: posições ocupadas ÷ total de posições (livres + ocupadas + bloqueadas). Fonte: relatório WF0126 — Ocupação do Centro de Distribuição." />
      </div>

      <DonutInterativo
        secoes={secoes}
        foco={foco}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />
      <ToggleSecoes secoes={secoes} foco={foco} onChange={setFoco} />

      {/* Resumo rápido da seção ativa */}
      <div className="mt-2 w-full max-w-xs mx-auto rounded-lg bg-white/10 px-4 py-2 text-center">
        <p className="text-[12px] font-bold text-white">
          {foco === 0
            ? `${fmtInt(ocupacao.ocupados)} endereços ocupados`
            : foco === 1
              ? `${fmtInt(ocupacao.livres)} posições livres`
              : `${fmtInt(bloqueados)} posições bloqueadas`}
        </p>
      </div>

      <div className="video-sobe mt-3 w-full max-w-xs mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Legenda
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Atributo</th>
              <th className="pb-0.5 text-center font-bold">Und.</th>
              <th className="pb-0.5 text-right font-bold">CD1</th>
              <th className="pb-0.5 text-right font-bold">CD2</th>
              <th className="pb-0.5 rounded-t bg-white/10 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {(ocupacao.detalhes ?? []).map((d, i) => (
              <tr key={`${d.atributo}-${d.unidade}-${i}`} className="border-b border-white/10 last:border-0">
                <td className="py-0.5 text-white/80">{d.atributo}</td>
                <td className="py-0.5 text-center text-white/50">{d.unidade}</td>
                <td className="py-0.5 text-right font-mono font-semibold text-white/80">{fmtInt(d.cd1)}</td>
                <td className="py-0.5 text-right font-mono font-semibold text-white/80">{fmtInt(d.cd2)}</td>
                <td className="py-0.5 text-right font-mono font-bold text-white bg-white/10">{fmtInt(d.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * 1.800 kg/posição CD1. * 2.500 kg/posição CD2. * 20 volumes/posição.
        </p>
      </div>

      <TotaisDestacados
        cards={[
          { label: "Ocupado", cor: COR_OCUPADO, linhas: [`${fmtInt(ocupacao.ocupados)} end.`, `${fmtBrMax(total > 0 ? (ocupacao.ocupados / total) * 100 : ocupacao.pct * 100, 1)}%`, `de ${fmtInt(total)} posições`] },
          { label: "Livre", cor: COR_LIVRE, linhas: [`${fmtInt(ocupacao.livres)} pos.`, `${fmtBrMax(total > 0 ? (ocupacao.livres / total) * 100 : (1 - ocupacao.pct) * 100, 1)}%`, `de ${fmtInt(total)} posições`] },
        ]}
      />
    </div>
  );
}
