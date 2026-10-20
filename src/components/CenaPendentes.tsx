/* Cena Pendências de Produção — donut interativo com Crítico × No prazo,
   no mesmo padrão visual das demais cenas (cena-interativa: donut + toggle +
   destaque + tabela Legenda). Mantém o filtro por data final, o card de
   saúde da produção e o detalhe por mês. */

import { fmtBrMax, fmtInt } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import {
  DonutInterativo,
  ToggleSecoes,
  DestaqueGradiente,
  useFocoCena,
  type SecaoDonut,
} from "@/components/cena-interativa";
import type { VideoPendentes } from "@/components/VideoResumoDashboard";

export default function CenaPendentes({
  anim,
  cena,
  pend,
  totRecebido,
  pendDe,
  pendAte,
  setPendDe,
  setPendAte,
  onPausar,
}: {
  anim: boolean;
  cena: number;
  pend: VideoPendentes | null | undefined;
  totRecebido: number;
  pendDe: string;
  pendAte: string;
  setPendDe: (v: string) => void;
  setPendAte: (v: string) => void;
  onPausar?: (() => void) | undefined;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);

  const totalTon = pend?.totalTon ?? 0;
  const secoes: SecaoDonut[] = (pend?.fatias ?? []).map((f) => ({
    id: f.rotulo,
    label: f.rotulo,
    cor: f.cor,
    pct: totalTon > 0 ? (f.ton / totalTon) * 100 : 0,
  }));
  const focoSecao = secoes[foco] ?? secoes[0];
  const focoFatia = focoSecao ? pend?.fatias.find((f) => f.rotulo === focoSecao.id) : undefined;

  const saudePct = totRecebido + totalTon > 0 ? (totRecebido / (totRecebido + totalTon)) * 100 : 0;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Pendências de produção
        </p>
        <InfoTooltip onOpen={onPausar} texto="Ordens de produção pendentes no sistema. Tonelagem total e média mensal das ordens em aberto. Saúde da produção = toneladas recebidas no estoque ÷ (recebidas + pendentes). Toneladas recebidas vêm do recebimento do CD. Crítico = ordens com data final 3 meses ou mais antes do mês atual. No prazo = ordens com até 2 meses de atraso, mês atual ou futuro. Fonte: sistema Focco. Dados de 2026." />
      </div>

      <div
        className="video-sobe mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/70"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="font-bold tracking-widest uppercase text-white/55">Filtrar data final</span>
        <label className="flex items-center gap-1">de
          <input type="date" value={pendDe} onChange={(e) => { setPendDe(e.target.value); onPausar?.(); }}
            className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-white [color-scheme:dark]" />
        </label>
        <label className="flex items-center gap-1">até
          <input type="date" value={pendAte} onChange={(e) => { setPendAte(e.target.value); onPausar?.(); }}
            className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-white [color-scheme:dark]" />
        </label>
        {(pendDe || pendAte) && (
          <button type="button" onClick={() => { setPendDe(""); setPendAte(""); }}
            className="rounded border border-white/20 px-2 py-0.5 text-white/80 hover:bg-white/10">Limpar</button>
        )}
      </div>

      {pend ? (
        <>
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
                numero={focoSecao ? `${fmtBrMax(focoSecao.pct, 1)}%` : undefined}
                rotulo={focoSecao ? `Pendências · ${focoSecao.label}` : undefined}
              />
            </div>
            <p className="text-center text-[10px] text-white/55">
              <span className="font-bold text-white/90">{fmtBrMax(focoFatia?.ton ?? 0, 1)} t</span>
              {" "}de {fmtBrMax(totalTon, 1)} t em aberto
            </p>
            <div className="rounded-lg bg-white/5 px-4 py-1.5 text-center">
              <p className="text-[12px] font-bold text-white">
                {fmtInt(pend.itens)} ordens em aberto · média mensal {fmtBrMax(pend.mediaTon, 1)} t
              </p>
            </div>
          </div>

          {/* Saúde da produção — toneladas pendentes × recebidas no estoque */}
          <div
            className="video-sobe mt-3 flex items-center gap-5 rounded-xl border border-white/10 bg-white/5 p-3.5"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="relative flex shrink-0 items-center justify-center">
              <svg viewBox="0 0 200 200" className="size-16 sm:size-20">
                <circle cx="100" cy="100" r="70" fill="none" strokeWidth="18" className="stroke-white/15" />
                <circle
                  cx="100" cy="100" r="70" fill="none" strokeWidth="18" strokeLinecap="round"
                  stroke="white"
                  transform="rotate(-90 100 100)"
                  style={{
                    strokeDasharray: 2 * Math.PI * 70,
                    strokeDashoffset: anim ? 2 * Math.PI * 70 * (1 - saudePct / 100) : 2 * Math.PI * 70,
                    transition: "stroke-dashoffset 1.3s cubic-bezier(0.22,1,0.36,1)",
                    filter: "drop-shadow(0 0 8px rgba(255,255,255,0.35))",
                  }}
                />
              </svg>
              <div className="absolute text-center">
                <p className="font-serif text-sm text-white sm:text-base">{fmtBrMax(saudePct, 1)}%</p>
                <p className="text-[7px] font-bold tracking-widest text-white/55 uppercase">saúde</p>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-[10px] font-bold tracking-[0.3em] text-white/60 uppercase">Saúde da Produção</p>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] text-white/70">
                  <span className="size-2.5 rounded-sm bg-brand-amber" />
                  Toneladas pendentes
                </span>
                <span className="font-mono text-sm font-bold text-brand-amber">{fmtBrMax(totalTon, 1)} t</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] text-white/70">
                  <span className="size-2.5 rounded-sm bg-white" />
                  Toneladas recebidas no estoque
                </span>
                <span className="font-mono text-sm font-bold text-white">{fmtBrMax(totRecebido, 1)} t</span>
              </div>
              <p className="text-[9px] leading-tight text-white/40">
                Crítico = 3 meses ou mais de atraso · No prazo = até 2 meses, mês atual ou futuro
              </p>
            </div>
          </div>

          {/* Legenda — detalhe por mês (tonelagem, %, data final, lotes e ordens) */}
          {pend.meses?.length > 0 && (
            <div className="video-sobe mt-3 w-full max-w-md mx-auto" style={{ animationDelay: "0.5s" }}>
              <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
                Legenda · Por mês
              </p>
              <table className="w-full text-left text-[11px] text-white">
                <thead>
                  <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
                    <th className="pb-0.5 font-bold">Mês</th>
                    <th className="pb-0.5 text-right font-bold">Ordens</th>
                    <th className="pb-0.5 text-right font-bold">Ton.</th>
                    <th className="pb-0.5 text-right font-bold">%</th>
                    <th className="pb-0.5 text-right font-bold">Lotes</th>
                    <th className="pb-0.5 text-right font-bold">Dt. final</th>
                  </tr>
                </thead>
                <tbody>
                  {pend.meses.map((m) => (
                    <tr key={m.mes} className="border-b border-white/10 last:border-0">
                      <td className="py-0.5 font-bold text-white/90">{m.mes}</td>
                      <td className="py-0.5 text-right font-mono font-semibold">{fmtInt(m.itens)}</td>
                      <td className="py-0.5 text-right font-mono font-semibold">{fmtBrMax(m.ton, 1)}</td>
                      <td className="py-0.5 text-right font-mono font-bold text-brand-amber">{fmtBrMax(m.pct, 0)}%</td>
                      <td className="py-0.5 text-right font-mono text-white/70">{m.lotes ?? 0}</td>
                      <td className="py-0.5 text-right font-mono text-white/70">
                        {m.dtFinal ? `${m.dtInicial ? `${m.dtInicial.slice(8, 10)}/${m.dtInicial.slice(5, 7)}–` : ""}${m.dtFinal.slice(8, 10)}/${m.dtFinal.slice(5, 7)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <p className="video-sobe mt-8 font-serif text-3xl text-white/70">
          {pendDe || pendAte ? "Nenhuma pendência nesse período." : "Nenhuma pendência de produção."}
        </p>
      )}
    </div>
  );
}
