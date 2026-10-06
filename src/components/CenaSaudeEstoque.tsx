/* Cena Saúde do Estoque — donut interativo com toggle Carregado / Recebido.
   Mesmo padrão da CenaRecebimentoTurno: donut + toggle + tabela de legenda. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtTonDec } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import type { VideoMes } from "./VideoResumoDashboard";

const COR_CARREGADO = "#00FFCC";
const COR_SALDO = "#FFA500";

export default function CenaSaudeEstoque({
  anim,
  mensal,
  cena,
  onPausar,
}: {
  anim: boolean;
  mensal: VideoMes[];
  cena: number;
  onPausar?: () => void;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);

  const totRecebido = mensal.reduce((s, m) => s + m.recebido, 0);
  const totCarregado = mensal.reduce((s, m) => s + m.carregado, 0);
  const saldo = Math.abs(totRecebido - totCarregado);
  const saudePct = totRecebido > 0 ? (totCarregado / totRecebido) * 100 : 0;
  const saldoPct = 100 - saudePct;

  const hoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const periodo = `01/01 – ${hoje.slice(0, 5)}`;

  const secoes: SecaoDonut[] = [
    { id: "carregado", label: "carregado", cor: COR_CARREGADO, pct: saudePct },
    { id: "recebido", label: "recebido", cor: COR_SALDO, pct: saldoPct },
  ];

  /* Tabela: Recebido (total), Carregado (foco 0), Saldo (foco 1) */
  const linhas = [
    { rotulo: "Recebido", periodo, ton: totRecebido, pct: 100, idx: -1 },
    { rotulo: "Carregado", periodo, ton: totCarregado, pct: saudePct, idx: 0 },
    { rotulo: "Recebido", periodo: "—", ton: saldo, pct: saldoPct, idx: 1 },
  ];

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Saúde do Estoque
        </p>
        <InfoTooltip onOpen={onPausar} texto="Eficiência do fluxo de estoque = toneladas carregadas ÷ toneladas recebidas × 100. Período acumulado de 2026. Fonte: sistema Focco." />
      </div>

      <DonutInterativo
        secoes={secoes}
        foco={foco}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />
      <ToggleSecoes secoes={secoes} foco={foco} onChange={setFoco} />

      <div className="mt-2 w-full max-w-xs mx-auto rounded-lg bg-white/10 px-4 py-2 text-center">
        <p className="text-[12px] font-bold text-white">
          {foco === 0
            ? `${fmtTonDec(totCarregado)} carregadas`
            : `${fmtTonDec(saldo)} recebido`}
        </p>
      </div>

      <div className="video-sobe mt-3 w-full max-w-xs mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Legenda
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Indicador</th>
              <th className="pb-0.5 text-center font-bold">Período</th>
              <th className="pb-0.5 text-right font-bold">Ton.</th>
              <th className="pb-0.5 text-right font-bold">%</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const highlighted = l.idx === foco;
              const cor = l.idx >= 0 ? secoes[l.idx]?.cor : undefined;
              return (
                <tr
                  key={`${l.rotulo}-${l.idx}`}
                  className={cn(
                    "border-b border-white/10 last:border-0 transition-all duration-300",
                    highlighted ? "bg-white/[0.04]" : l.idx >= 0 ? "opacity-35" : "",
                  )}
                >
                  <td className="py-0.5" style={highlighted ? { color: cor } : undefined}>{l.rotulo}</td>
                  <td className="py-0.5 text-center text-white/50">{l.periodo}</td>
                  <td className="py-0.5 text-right font-mono font-semibold" style={highlighted ? { color: cor } : undefined}>
                    {fmtTonDec(l.ton)}
                  </td>
                  <td className="py-0.5 text-right font-mono font-bold" style={highlighted ? { color: cor } : undefined}>
                    {fmtBrMax(l.pct, 1)}%
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-white/40 bg-white/10 font-bold">
              <td className="py-1 text-white">Total</td>
              <td />
              <td className="py-1 text-right font-mono text-white">{fmtTonDec(totRecebido)}</td>
              <td className="py-1 text-right font-mono text-white">100%</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * Eficiência = carregado ÷ recebido × 100. Fonte: sistema Focco. Período acumulado de 2026.
        </p>
      </div>
    </div>
  );
}
