/* Cena Acertos de Estoque — tipos, endereços com/sem acerto, médias. */

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
const CORES_TIPOS = ["#00FFCC", "#FFB800", "#FF6B35"];

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

  const maxMes = Math.max(...d.porMes.map((m) => m.count));
  const maxCom = Math.max(...d.ruas.map((r) => r.comAcerto));

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

      {/* Donut com/sem acerto */}
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

      {/* Tipos de acerto */}
      <div
        className="video-sobe mt-3 w-full max-w-sm mx-auto"
        style={{ animationDelay: "0.5s" }}
      >
        <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Tipos de acerto
        </p>
        <div className="space-y-1.5">
          {d.tipos.map((t, i) => (
            <div key={t.tipo} className="flex items-center gap-2.5">
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ background: CORES_TIPOS[i] ?? "#888" }}
              />
              <span className="flex-1 text-[11px] text-white/80">{t.tipo}</span>
              <span className="font-mono text-[11px] font-bold text-white">
                {fmtInt(t.count)}
              </span>
              <span
                className="w-10 text-right font-mono text-[10px] font-bold"
                style={{ color: CORES_TIPOS[i] ?? "#888" }}
              >
                {fmtBrMax(t.pct, 1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Lista dinâmica — com acerto (ruas) / sem acerto (endereços) */}
      <div
        className="video-sobe mt-3 w-full max-w-sm mx-auto"
        style={{ animationDelay: "0.6s" }}
      >
        <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          {foco === 0 ? "Ruas com acerto" : "Endereços sem acerto"}
        </p>
        {foco === 0 ? (
          <div className="space-y-1">
            {d.ruas
              .slice()
              .sort((a, b) => b.comAcerto - a.comAcerto)
              .slice(0, 10)
              .map((r) => (
                <div key={r.rua} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-[10px] text-white/70">{r.rua}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-sm bg-white/10">
                    <div
                      className="h-full rounded-sm transition-all duration-700"
                      style={{
                        width: `${(r.comAcerto / maxCom) * 100}%`,
                        background: COR_COM_ACERTO,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-[10px] font-bold text-white">
                    {fmtInt(r.comAcerto)}
                  </span>
                </div>
              ))}
            <p className="pt-0.5 text-[8px] leading-tight text-white/40">
              Top 10 de {d.ruas.length} ruas · {fmtInt(d.totalEnderecosComAcerto)} endereços com acerto
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {d.enderecosSemAcertoLista.slice(0, 12).map((e) => (
              <div key={e.endereco} className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-white/70">{e.endereco}</span>
                <span className="ml-auto text-[9px] text-white/40">{e.rua}</span>
              </div>
            ))}
            <p className="pt-0.5 text-[8px] leading-tight text-white/40">
              {fmtInt(d.enderecosSemAcertoLista.length)} endereços sem acerto · {fmtInt(d.totalEnderecosCD)} endereços totais do CD
            </p>
          </div>
        )}
      </div>

      {/* Médias */}
      <div
        className="video-sobe mt-3 w-full max-w-sm mx-auto"
        style={{ animationDelay: "0.7s" }}
      >
        <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Médias no período
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-center">
            <p className="font-mono text-lg font-bold text-white">
              {fmtInt(d.mediaPorMes)}
            </p>
            <p className="text-[9px] tracking-wider text-white/50 uppercase">acertos / mês</p>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-center">
            <p className="font-mono text-lg font-bold text-white">
              {fmtInt(d.mediaPorDia)}
            </p>
            <p className="text-[9px] tracking-wider text-white/50 uppercase">acertos / dia</p>
          </div>
        </div>
        <p className="mt-1 text-[9px] leading-tight text-white/40">
          {fmtInt(d.totalAcertos)} acertos em {d.diasNoPeriodo} dias
        </p>
      </div>

      {/* Acertos por mês — gráfico + tabela */}
      <div
        className="video-sobe mt-3 w-full max-w-sm mx-auto"
        style={{ animationDelay: "0.8s" }}
      >
        <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Acertos por mês
        </p>
        <div className="flex items-end justify-between gap-1 h-16">
          {d.porMes.map((m) => (
            <div key={m.mes} className="flex flex-1 flex-col items-center gap-0.5">
              <span className="font-mono text-[7px] text-white/50">{m.count}</span>
              <div
                className="w-full rounded-t-sm transition-all duration-700"
                style={{
                  height: `${(m.count / maxMes) * 100}%`,
                  background: COR_COM_ACERTO,
                  minHeight: "2px",
                  opacity: 0.7,
                }}
              />
              <span className="text-[7px] text-white/50">{m.mes}</span>
            </div>
          ))}
        </div>
        {/* Tabela mensal — acertos e % por mês */}
        <div className="mt-2 space-y-0.5">
          <div className="grid grid-cols-3 gap-x-3 text-[8px] font-bold text-white/40 uppercase tracking-wider">
            <div>Mês</div>
            <div className="text-right">Acertos</div>
            <div className="text-right">%</div>
          </div>
          {d.porMes.map((m) => (
            <div key={m.mes} className="grid grid-cols-3 gap-x-3 text-[9px]">
              <div className="text-white/70">{m.mes}</div>
              <div className="text-right font-mono text-white">{fmtInt(m.count)}</div>
              <div className="text-right font-mono font-bold" style={{ color: COR_COM_ACERTO }}>
                {fmtBrMax(m.pct, 1)}%
              </div>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-x-3 border-t border-white/15 pt-0.5 text-[9px] font-bold">
            <div className="text-white/70">Total</div>
            <div className="text-right font-mono text-white">{fmtInt(d.totalAcertos)}</div>
            <div className="text-right font-mono text-white">100%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
