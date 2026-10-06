/* Cena Paletes em Estoque — donut interativo com toggle por tamanho.
   Mesmo padrão da CenaRecebimentoTurno: donut + toggle + tabela de legenda. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import type { VideoPaletas } from "./VideoResumoDashboard";

const CORES_TAMANHO: Record<string, string> = {
  P: "#33D953",
  M: "#337DD9",
  G: "#D98E33",
  GG: "#A533D9",
};

export default function CenaPaletes({
  anim,
  paletas,
  cena,
  onPausar,
}: {
  anim: boolean;
  paletas: VideoPaletas;
  cena: number;
  onPausar?: () => void;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);

  const total = paletas.totalPaletes ?? 0;
  const itens = paletas.totalItens ?? 0;
  const tamanhos = paletas.porTamanho ?? [];

  const secoes: SecaoDonut[] = tamanhos.map((t) => ({
    id: t.tamanho,
    label: `tamanho ${t.tamanho}`,
    cor: CORES_TAMANHO[t.tamanho] ?? "#6b7280",
    pct: total > 0 ? (t.paletes / total) * 100 : 0,
  }));

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Paletes em Estoque
        </p>
        <InfoTooltip onOpen={onPausar} texto="Distribuição de paletes por tamanho no CD. Percentual = paletes do tamanho ÷ total de paletes. Fonte: mapeamento de endereços do CD." />
      </div>

      <DonutInterativo
        secoes={secoes}
        foco={Math.min(foco, secoes.length - 1)}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />
      <ToggleSecoes secoes={secoes} foco={Math.min(foco, secoes.length - 1)} onChange={setFoco} />

      <p className="mt-1.5 text-center text-[11px] text-white/70">
        {fmtInt(itens)} itens em {fmtInt(total)} paletes
      </p>

      <div className="video-sobe mt-3 w-full max-w-xs mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Legenda
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Tamanho</th>
              <th className="pb-0.5 text-right font-bold">Paletes</th>
              <th className="pb-0.5 text-right font-bold">Itens</th>
              <th className="pb-0.5 text-right font-bold">%</th>
            </tr>
          </thead>
          <tbody>
            {tamanhos.map((t, i) => {
              const cor = CORES_TAMANHO[t.tamanho] ?? "#6b7280";
              const pct = total > 0 ? (t.paletes / total) * 100 : 0;
              const highlighted = i === foco;
              return (
                <tr
                  key={t.tamanho}
                  className={cn(
                    "border-b border-white/10 last:border-0 transition-all duration-300",
                    highlighted ? "bg-white/[0.04]" : "opacity-35",
                  )}
                >
                  <td className="py-0.5" style={highlighted ? { color: cor } : undefined}>
                    <span className="mr-1.5 inline-block size-2 rounded-full align-middle" style={{ background: cor }} />
                    {t.tamanho}
                  </td>
                  <td className="py-0.5 text-right font-mono font-semibold" style={highlighted ? { color: cor } : undefined}>
                    {fmtInt(t.paletes)}
                  </td>
                  <td className="py-0.5 text-right font-mono text-white/50">{fmtInt(t.itens)}</td>
                  <td className="py-0.5 text-right font-mono font-bold" style={highlighted ? { color: cor } : undefined}>
                    {fmtBrMax(pct, 0)}%
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-white/40 bg-white/10 font-bold">
              <td className="py-1 text-white">Total</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(total)}</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(itens)}</td>
              <td className="py-1 text-right font-mono text-white">100%</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * Paletes distribuídos por tamanho no CD Lopas. Clique no gráfico para alternar.
        </p>
      </div>
    </div>
  );
}
