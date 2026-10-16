/* Cena Acertos de Estoque — endereços com e sem acerto no período. */

import { fmtInt, fmtBrMax } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import {
  DonutInterativo,
  ToggleSecoes,
  BannerResumo,
  useFocoCena,
  type SecaoDonut,
} from "@/components/cena-interativa";
import { ACERTOS_ESTOQUE, type AcertosEstoque } from "@/data/acertos-estoque";

const COR_COM_ACERTO = "#00FFCC";
const COR_SEM_ACERTO = "#6B7280";

export default function CenaAcertosEstoque({
  anim,
  cena,
  onPausar,
  acertos,
}: {
  anim: boolean;
  cena: number;
  onPausar?: (() => void) | undefined;
  acertos?: AcertosEstoque | null | undefined;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);
  const d = acertos ?? ACERTOS_ESTOQUE;

  const secoes: SecaoDonut[] = [
    { id: "com-acerto", label: "com acerto", cor: COR_COM_ACERTO, pct: d.pctComAcerto },
    { id: "sem-acerto", label: "sem acerto", cor: COR_SEM_ACERTO, pct: d.pctSemAcerto },
  ];

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Acertos de Estoque
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto={`Endereços do CD com e sem acerto de inventário no período de ${d.periodoInicio} a ${d.periodoFim} (relatório WF0097 do WMS FullSoft, cruzado com WF0112). Endereços ASTEC desconsiderados.`}
        />
      </div>

      <p className="video-sobe mt-1 text-[10px] text-white/50" style={{ animationDelay: "0.1s" }}>
        {d.periodoInicio} a {d.periodoFim}
      </p>

      <div className="mt-2">
        <DonutInterativo
          secoes={secoes}
          foco={foco}
          onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
          anim={anim}
        />
      </div>
      <ToggleSecoes secoes={secoes} foco={foco} onChange={setFoco} />

      <BannerResumo
        delay="0.4s"
        texto={
          foco === 0
            ? `${fmtInt(d.totalEnderecosComAcerto)} endereços com acerto`
            : `${fmtInt(d.enderecosSemAcerto)} endereços sem acerto`
        }
      />

      <div className="video-sobe mt-3 w-full max-w-sm mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Endereços do CD
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: COR_COM_ACERTO }} />
            <span className="flex-1 text-[11px] text-white/80">Endereços com acerto</span>
            <span className="font-mono text-[11px] font-bold text-white">
              {fmtInt(d.totalEnderecosComAcerto)}
            </span>
            <span
              className="w-10 text-right font-mono text-[10px] font-bold"
              style={{ color: COR_COM_ACERTO }}
            >
              {fmtBrMax(d.pctComAcerto, 1)}%
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: COR_SEM_ACERTO }} />
            <span className="flex-1 text-[11px] text-white/80">Endereços sem acerto</span>
            <span className="font-mono text-[11px] font-bold text-white">
              {fmtInt(d.enderecosSemAcerto)}
            </span>
            <span
              className="w-10 text-right font-mono text-[10px] font-bold"
              style={{ color: COR_SEM_ACERTO }}
            >
              {fmtBrMax(d.pctSemAcerto, 1)}%
            </span>
          </div>
          <p className="pt-1 text-[9px] leading-tight text-white/40">
            {fmtInt(d.totalEnderecosCD)} endereços totais do CD · cruzamento com a planilha de
            estoques (WF0112). ASTEC desconsiderado.
          </p>
        </div>
      </div>
    </div>
  );
}
