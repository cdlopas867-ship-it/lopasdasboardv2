/* Cena Paletes em Estoque — donut interativo com toggle por tamanho.
   Mesmo padrão da CenaRecebimentoTurno: donut + toggle + tabela de legenda.
   Ao clicar num tamanho, abre a lista de itens com totais e endereços. */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, BannerResumo, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
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
  const [expandido, setExpandido] = useState(false);

  const total = paletas?.totalPaletes ?? 0;
  const itens = paletas?.totalItens ?? 0;
  const tamanhos = paletas?.porTamanho ?? [];

  const secoes: SecaoDonut[] = tamanhos.map((t) => ({
    id: t.tamanho,
    label: `tamanho ${t.tamanho}`,
    cor: CORES_TAMANHO[t.tamanho] ?? "#6b7280",
    pct: total > 0 ? (t.paletes / total) * 100 : 0,
  }));

  const focoIdx = Math.min(foco, tamanhos.length - 1);
  const tamanhoAtivo = tamanhos[focoIdx]?.tamanho ?? "";
  const corAtiva = CORES_TAMANHO[tamanhoAtivo] ?? "#6b7280";
  const itensLista = paletas?.itensPorTamanho?.[tamanhoAtivo] ?? [];

  const abrirLista = () => {
    onPausar?.();
    setExpandido((v) => !v);
  };

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
        foco={focoIdx}
        onToggle={() => { setFoco((f) => (f + 1) % secoes.length); setExpandido(true); }}
        anim={anim}
      />
      <ToggleSecoes secoes={secoes} foco={focoIdx} onChange={(i) => { setFoco(i); setExpandido(true); }} />

      {/* Resumo rápido da seção ativa — destaque em gradiente */}
      <BannerResumo
        delay="0.4s"
        texto={(() => { const t = tamanhos[focoIdx]; return t ? `${fmtInt(t.itens)} itens em ${fmtInt(t.paletes)} paletes` : `${fmtInt(itens)} itens em ${fmtInt(total)} paletes`; })()}
      />

      {/* Botão para abrir/fechar a lista de itens do tamanho ativo */}
      {itensLista.length > 0 && (
        <button
          type="button"
          onClick={abrirLista}
          className="video-sobe mt-2 w-full max-w-xs mx-auto rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold tracking-widest text-white/80 uppercase backdrop-blur-sm transition-colors hover:bg-white/10"
          style={{ ...(expandido ? { borderColor: corAtiva, color: corAtiva } : {}), animationDelay: "0.45s" }}
        >
          {expandido ? "▲ Fechar itens" : "▼ Ver itens do tamanho"}
        </button>
      )}

      <div className="video-sobe mt-3 w-full max-w-xs mx-auto" style={{ animationDelay: "0.55s" }}>
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
              const highlighted = i === focoIdx;
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

      </div>

      {/* Lista de itens do tamanho ativo */}
      {expandido && itensLista.length > 0 && (
        <div className="video-sobe mt-2 w-full max-w-md" style={{ animationDelay: "0.1s" }}>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[9px] font-bold tracking-[0.3em] uppercase" style={{ color: corAtiva }}>
              Itens tamanho {tamanhoAtivo}
            </p>
            <span className="text-[9px] text-white/40">{fmtInt(itensLista.length)} itens</span>
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {itensLista.map((it, i) => (
              <div
                key={`${it.item}-${i}`}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-2"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold text-white/90">{it.item}</span>
                  <span className="font-mono text-[10px] font-bold" style={{ color: corAtiva }}>
                    {fmtInt(it.paletes)} pal
                  </span>
                </div>
                {it.desc && (
                  <p className="mt-0.5 text-[9px] leading-tight text-white/55 line-clamp-2">{it.desc}</p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[9px] text-white/45">
                  <span>Saldo: <span className="font-mono font-semibold text-white/70">{fmtInt(it.saldo)}</span></span>
                  <span>Und/pal: <span className="font-mono font-semibold text-white/70">{fmtInt(it.undPorPalete)}</span></span>
                </div>
                {it.enderecos.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {it.enderecos.map((end, j) => (
                      <span
                        key={`${end}-${j}`}
                        className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[8px] font-semibold text-white/65"
                      >
                        {end}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
