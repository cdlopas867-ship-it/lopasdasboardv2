/* Cena Produção da Semana — donut interativo com Produzido × Recebido ×
   A produzir. Mesmo padrão da CenaRecebimentoTurno: donut + toggle + tabela.
   A tonelagem (peso em toneladas) fica em destaque no card e na tabela. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import { semanaAtual, type ProducaoSemanalDia } from "@/lib/producao-semanal";

const COR_PRODUZIDO = "#33D953"; // verde
const COR_RECEBIDO = "#38BDF8"; // azul
const COR_A_PRODUZIR = "#FFA500"; // laranja

const ROTULOS = ["Produzido", "Recebido", "A produzir"];

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
  const totalProduzido = semana.reduce((s, d) => s + (d.produzido ?? 0), 0);
  const totalRecebido = semana.reduce((s, d) => s + d.entregue, 0);
  const totalPendente = semana.reduce((s, d) => s + d.pendente, 0);
  const totalTonPrev = semana.reduce((s, d) => s + d.tonPrevisto, 0);
  const totalTonProd = semana.reduce((s, d) => s + (d.tonProduzido ?? 0), 0);
  const totalTonRec = semana.reduce((s, d) => s + d.tonEntregue, 0);
  const totalTonPend = semana.reduce((s, d) => s + d.tonPendente, 0);
  const totalOrdens = semana.reduce((s, d) => s + d.ordens, 0);

  const pct = (v: number) => (totalPrevisto > 0 ? (v / totalPrevisto) * 100 : 0);
  const pctProduzido = pct(totalProduzido);
  const pctRecebido = pct(totalRecebido);
  const pctPendente = pct(totalPendente);
  /* % média = média entre o produzido e o recebido em relação ao programado. */
  const pctMedia = (pctProduzido + pctRecebido) / 2;

  const secoes: SecaoDonut[] = [
    { id: "produzido", label: "produzido", cor: COR_PRODUZIDO, pct: pctProduzido },
    { id: "recebido", label: "recebido", cor: COR_RECEBIDO, pct: pctRecebido },
    { id: "produzir", label: "a produzir", cor: COR_A_PRODUZIR, pct: pctPendente },
  ];

  /* Tabela: Programado (total) + Produzido / Recebido / A produzir. */
  const linhas = [
    { rotulo: "Programado", cor: undefined as string | undefined, un: totalPrevisto, ton: totalTonPrev, pct: 100, idx: -1 },
    { rotulo: "Produzido", cor: COR_PRODUZIDO, un: totalProduzido, ton: totalTonProd, pct: pctProduzido, idx: 0 },
    { rotulo: "Recebido", cor: COR_RECEBIDO, un: totalRecebido, ton: totalTonRec, pct: pctRecebido, idx: 1 },
    { rotulo: "A produzir", cor: COR_A_PRODUZIR, un: totalPendente, ton: totalTonPend, pct: pctPendente, idx: 2 },
  ];

  const focoSecao = secoes[foco] ?? secoes[0]!;
  const focoLinha = linhas[foco + 1]!;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Produção da Semana
        </p>
        <InfoTooltip onOpen={onPausar} texto="Ordens de produção da semana atual (seg–dom). Programado = total planejado. Produzido = já saiu da fábrica (QTDE ENTREGUE / PESO REALIZADO). Recebido = o que efetivamente chegou ao estoque (planilha PESO RECEBIDO POR PERÍODO). A produzir = o que ainda falta produzir. Peso em toneladas destacado. Fonte: sistema Focco." />
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
            {fmtInt(focoLinha.un)} de {fmtInt(totalPrevisto)} un ·{" "}
            <span className="font-bold text-white/90">{fmtBrMax(focoLinha.ton, 1)} t</span>
          </p>
        </div>
        <div className="rounded-lg bg-white/5 px-4 py-1.5 text-center">
          <p className="text-[12px] font-bold text-white">
            {fmtInt(totalOrdens)} ordens · {fmtBrMax(totalTonPrev, 1)} t programadas · média {fmtBrMax(pctMedia, 1)}%
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
          * Programado: ordens dos próximos 7 dias. Produzido: já saiu da fábrica. Recebido: já chegou ao estoque. A produzir: o que falta descer. Tonelagem em toneladas (t). Fonte: sistema Focco.
        </p>
      </div>

    </div>
  );
}
