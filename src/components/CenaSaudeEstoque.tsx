/* Cena Saúde do Estoque — donut interativo com toggle Carregado / Recebido.
   Mostra a participação do MÊS ATUAL no total recebido até agora (base
   acumulada de 2026), em vez dos totais acumulados. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtTonDec } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import type { VideoMes } from "./VideoResumoDashboard";

const COR_CARREGADO = "#00FFCC";
const COR_SALDO = "#FFA500";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

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
  /* Base = "recebida até agora" (total recebido no ano); fallback p/ carregado
     quando não há dados de recebimento (ex.: sample data). */
  const base = totRecebido > 0 ? totRecebido : totCarregado;

  /* Mês atual — mês calendário corrente, ou o último mês com dados. */
  const mesAtualLabel = MESES[new Date().getMonth()];
  const mesAtual =
    mensal.find((m) => m.mes === mesAtualLabel) ?? mensal[mensal.length - 1] ?? mensal[0] ?? { mes: mesAtualLabel, recebido: 0, carregado: 0 };

  const pctRecebidoMes = base > 0 ? (mesAtual.recebido / base) * 100 : 0;
  const pctCarregadoMes = base > 0 ? (mesAtual.carregado / base) * 100 : 0;

  const hoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const periodoAcumulado = `01/01 – ${hoje.slice(0, 5)}`;

  const secoes: SecaoDonut[] = [
    { id: "carregado", label: "carregado", cor: COR_CARREGADO, pct: pctCarregadoMes },
    { id: "recebido", label: "recebido", cor: COR_SALDO, pct: pctRecebidoMes },
  ];

  /* Tabela: % do mês atual de Recebido e Carregado (base = recebida até agora). */
  const linhas = [
    { rotulo: "Recebido", periodo: mesAtual.mes, ton: mesAtual.recebido, pct: pctRecebidoMes, idx: -1 },
    { rotulo: "Carregado", periodo: mesAtual.mes, ton: mesAtual.carregado, pct: pctCarregadoMes, idx: 0 },
  ];

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Saúde do Estoque
        </p>
        <InfoTooltip onOpen={onPausar} texto="% do mês atual sobre o total recebido até agora (base acumulada de 2026). Carregado e Recebido mostram a participação do mês corrente no total. Fonte: sistema Focco." />
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
            ? `${fmtBrMax(pctCarregadoMes, 1)}% carregado em ${mesAtual.mes}`
            : `${fmtBrMax(pctRecebidoMes, 1)}% recebido em ${mesAtual.mes}`}
        </p>
      </div>

      <div className="video-sobe mt-3 w-full max-w-xs mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          % do mês · {mesAtual.mes}
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Indicador</th>
              <th className="pb-0.5 text-center font-bold">Mês</th>
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
              <td className="py-1 text-white">Recebido até agora</td>
              <td className="py-1 text-center text-white/50">{periodoAcumulado}</td>
              <td className="py-1 text-right font-mono text-white">{fmtTonDec(base)}</td>
              <td className="py-1 text-right font-mono text-white">100%</td>
            </tr>
            <tr className="border-b border-white/10 bg-white/[0.06] font-bold">
              <td className="py-1" style={{ color: COR_CARREGADO }}>Carregado até agora</td>
              <td className="py-1 text-center text-white/50">{periodoAcumulado}</td>
              <td className="py-1 text-right font-mono" style={{ color: COR_CARREGADO }}>{fmtTonDec(totCarregado)}</td>
              <td className="py-1 text-right font-mono" style={{ color: COR_CARREGADO }}>{base > 0 ? fmtBrMax((totCarregado / base) * 100, 1) : 0}%</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * % do mês ({mesAtual.mes}) sobre o total recebido até agora. Fonte: sistema Focco.
        </p>
      </div>
    </div>
  );
}
