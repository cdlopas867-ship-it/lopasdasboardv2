/* Cena — Saúde do Estoque (interativa)
 * Donut com toggle Carregado / Saldo. Clique para alternar o destaque. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtTonDec } from "@/lib/format";
import { DonutInterativo, ToggleSecoes, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import type { VideoMes } from "./VideoResumoDashboard";

const COR_CARREGADO = "#00FFCC";
const COR_SALDO = "#FFA500";

type Props = {
  anim: boolean;
  mensal?: VideoMes[] | undefined;
  cena?: number;
};

export default function CenaSaudeEstoque({ anim, mensal, cena = 8 }: Props) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);

  const listaMes = (mensal ?? []).filter((m) => m.recebido > 0 || m.carregado > 0);
  const totRecebido = listaMes.reduce((s, m) => s + m.recebido, 0);
  const totCarregado = listaMes.reduce((s, m) => s + m.carregado, 0);
  const saude = totRecebido > 0 ? (totCarregado / totRecebido) * 100 : 0;
  const pctGrafico = Math.min(saude, 100);

  const secoes: SecaoDonut[] = [
    { id: "carregado", label: "carregado", cor: COR_CARREGADO, pct: pctGrafico },
    { id: "saldo", label: "saldo", cor: COR_SALDO, pct: Math.max(100 - pctGrafico, 0) },
  ];

  const linhas = [
    { focoIdx: null, rotulo: "Recebido", valor: fmtTonDec(totRecebido) },
    { focoIdx: 0, rotulo: "Carregado", valor: fmtTonDec(totCarregado) },
    { focoIdx: 1, rotulo: "Saldo", valor: fmtTonDec(Math.abs(totRecebido - totCarregado)) },
    { focoIdx: 0, rotulo: "Saúde", valor: `${fmtBrMax(saude, 1)}%` },
  ];

  return (
    <div className="flex w-full flex-col items-center">
      <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
        Saúde do Estoque
      </p>

      <DonutInterativo
        secoes={secoes}
        foco={foco}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />
      <ToggleSecoes secoes={secoes} foco={foco} onChange={setFoco} />

      <div className="video-sobe mt-3 w-full max-w-xs mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Resumo do período
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Indicador</th>
              <th className="pb-0.5 text-right font-bold">Valor</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => {
              const ativa = l.focoIdx === foco;
              const cor = l.focoIdx !== null ? secoes[l.focoIdx]?.cor : undefined;
              return (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-white/10 last:border-0 transition-all duration-300",
                    ativa ? "bg-white/[0.04]" : l.focoIdx !== null ? "opacity-35" : "",
                  )}
                >
                  <td className="py-0.5" style={ativa && cor ? { color: cor } : undefined}>
                    {l.rotulo}
                  </td>
                  <td
                    className="py-0.5 text-right font-mono font-bold"
                    style={ativa && cor ? { color: cor } : undefined}
                  >
                    {l.valor}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * Saúde = carregado ÷ recebido × 100. Janeiro a setembro de 2026.
        </p>
      </div>
    </div>
  );
}
