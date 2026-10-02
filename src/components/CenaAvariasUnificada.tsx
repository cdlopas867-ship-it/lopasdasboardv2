import { useState } from "react";
import { cn } from "@/lib/utils";
import { fmtInt, fmtBrMax, fmtPeso } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { GraficoMotivoMensal } from "@/components/GraficoMotivoMensal";
import { imagemAvaria, temImagemAvaria } from "@/data/avarias-imagens";
import type { VideoAvarias } from "./VideoResumoDashboard";

/* Cena única de Avarias — layout limpo e organizado:
   1. Cabeçalho com total de volumes
   2. Gráfico mensal de barras
   3. Tipos de avaria em lista compacta (imagens só no modal)
   4. Motivo mais frequente por mês em 2 colunas
   Clicar num tipo abre o modal com imagem + gráfico detalhado. */
export default function CenaAvariasUnificada({
  anim,
  avarias,
  onPausar,
}: {
  anim: boolean;
  avarias?: VideoAvarias | undefined;
  onPausar?: (() => void) | undefined;
}) {
  const [tipoSel, setTipoSel] = useState<number | null>(null);
  const [mesHover, setMesHover] = useState<number | null>(null);

  if (!avarias) {
    return (
      <div className="flex w-full flex-col items-center py-6 text-center">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Avarias
        </p>
        <p className="video-sobe mt-4 font-serif text-2xl text-white/70">
          Sem registros de avarias.
        </p>
      </div>
    );
  }

  const maxMes = Math.max(...avarias.meses.map((m) => m.qtd), 1);

  return (
    <div className="flex w-full flex-col">
      {/* ── Cabeçalho ── */}
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Avarias
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto="Volumes avariados registrados no CD. Total de 3.312 volumes (Soma de Quantidade). Distribuição mensal conferida com a tabela oficial. Custos parciais (em apuração). Fonte: planilha de avarias + tabela de referência de motivos. Janeiro a setembro de 2026."
        />
      </div>

      <div className="video-sobe mt-2 flex items-baseline gap-3">
        <p className="font-serif text-3xl text-white sm:text-4xl">
          {fmtInt(avarias.total)}
        </p>
        <span className="text-sm text-white/60">volumes</span>
        {avarias.referenciaParcial && (
          <span className="text-[10px] text-white/45">· custos parciais em apuração</span>
        )}
      </div>

      {/* ── Gráfico mensal ── */}
      <div className="relative mt-4">
        <p className="mb-1.5 text-[9px] font-bold tracking-[0.3em] text-white/50 uppercase">
          Por mês
        </p>
        <div className="flex h-20 items-end justify-between gap-1.5 sm:gap-2">
          {avarias.meses.map((m, i) => {
            const destaque = m.mes.toUpperCase().startsWith("AGO");
            return (
              <div
                key={m.mes}
                className="flex h-full flex-1 flex-col justify-end"
                onMouseEnter={() => setMesHover(i)}
                onMouseLeave={() => setMesHover(null)}
              >
                <p
                  className={cn(
                    "video-sobe mb-0.5 text-center font-mono text-[9px] font-bold",
                    destaque ? "text-brand-amber" : "text-white/80",
                  )}
                  style={{ animationDelay: `${0.1 * i + 0.3}s` }}
                >
                  {fmtInt(m.qtd)}
                </p>
                <div
                  className={cn(
                    "video-barra-y w-full rounded-t-md transition-opacity",
                    destaque
                      ? "bg-gradient-to-t from-brand-amber/80 to-brand-amber shadow-[0_0_12px_rgba(241,196,15,0.3)]"
                      : "bg-gradient-to-t from-red-500/50 to-red-400",
                    mesHover === i && "opacity-70",
                    !anim && "video-pausada",
                  )}
                  style={{
                    height: `${Math.max((m.qtd / maxMes) * 100, 4)}%`,
                    animationDelay: `${0.1 * i + 0.15}s`,
                  }}
                />
                <p
                  className={cn(
                    "mt-1 truncate text-center text-[8px] font-bold uppercase",
                    destaque ? "text-brand-amber" : "text-white/60",
                  )}
                >
                  {m.mes.slice(0, 3)}
                  {destaque && " ★"}
                </p>
              </div>
            );
          })}
        </div>

        {/* Tooltip de hover — resumo do mês */}
        {mesHover !== null && avarias.meses[mesHover] && (
          <div
            className="pointer-events-none absolute -top-1 z-30 w-44 rounded-xl border border-white/20 bg-[#1e2c10]/95 p-3 text-left shadow-xl backdrop-blur-md"
            style={{
              left: `${((mesHover + 0.5) / avarias.meses.length) * 100}%`,
              transform:
                mesHover === 0
                  ? "translateX(0)"
                  : mesHover === avarias.meses.length - 1
                    ? "translateX(-100%)"
                    : "translateX(-50%)",
            }}
          >
            <p className="mb-1.5 font-serif text-sm font-bold tracking-wide text-white uppercase">
              {avarias.meses[mesHover].mes}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-lg font-bold text-white">
                {fmtInt(avarias.meses[mesHover].qtd)}
              </span>
              <span className="text-[9px] font-semibold tracking-widest text-white/50 uppercase">volumes</span>
            </div>
            {avarias.meses[mesHover].peso ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-sm font-bold text-brand-amber">
                  {fmtPeso(avarias.meses[mesHover].peso!)}
                </span>
                <span className="text-[9px] font-semibold tracking-widest text-white/50 uppercase">peso</span>
              </div>
            ) : null}
            {(() => {
              const tiposMes = (avarias.tipos ?? [])
                .map((t) => ({
                  tipo: t.tipo,
                  cor: t.cor,
                  qtd: t.meses.find((mm) => mm.mes === avarias.meses[mesHover].mes)?.qtd ?? 0,
                }))
                .filter((t) => t.qtd > 0)
                .sort((a, b) => b.qtd - a.qtd);
              if (!tiposMes.length) return null;
              return (
                <div className="mt-2 border-t border-white/10 pt-1.5">
                  <p className="mb-1 text-[8px] font-bold tracking-widest text-white/40 uppercase">Tipos</p>
                  <div className="space-y-0.5">
                    {tiposMes.map((t) => (
                      <div key={t.tipo} className="flex items-center gap-1.5">
                        <span className="size-1.5 shrink-0 rounded-full" style={{ background: t.cor }} />
                        <span className="flex-1 truncate text-[9px] text-white/80">{t.tipo}</span>
                        <span className="font-mono text-[9px] font-bold text-white/60">{fmtInt(t.qtd)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── Tipos de avaria — lista compacta ── */}
      {avarias.tipos?.length ? (
        <div className="mt-4">
          <p className="mb-1.5 text-[9px] font-bold tracking-[0.3em] text-white/50 uppercase">
            Por tipo · clique para detalhar
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {avarias.tipos.map((t, i) => {
              const maxTMes = Math.max(...t.meses.map((m) => m.qtd), 1);
              return (
                <button
                  type="button"
                  key={t.tipo}
                  onClick={() => {
                    setTipoSel(i);
                    onPausar?.();
                  }}
                  className="video-sobe group flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-left transition-all hover:border-primary/40 hover:bg-white/10"
                  style={{ animationDelay: `${0.06 * i + 0.4}s` }}
                >
                  <span className="size-2 shrink-0 rounded-full" style={{ background: t.cor }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[9px] font-bold tracking-wide text-white/85 uppercase">
                      {t.tipo}
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-serif text-sm text-white">{fmtInt(t.total)}</span>
                      <span className="font-mono text-[8px] font-bold text-white/50">{fmtBrMax(t.pct, 1)}%</span>
                    </div>
                  </div>
                  <div className="flex h-5 w-8 shrink-0 items-stretch gap-px">
                    {t.meses.map((m, mi) => (
                      <div key={m.mes} className="flex h-full flex-1 flex-col items-center justify-end">
                        <div
                          className={cn("video-barra-y w-full rounded-t-sm", !anim && "video-pausada")}
                          style={{
                            height: `${Math.max((m.qtd / maxTMes) * 100, 6)}%`,
                            background: t.cor,
                            animationDelay: `${0.06 * i + 0.5 + 0.04 * mi}s`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {tipoSel !== null && avarias.tipos?.[tipoSel] && (
        <GraficoMotivoMensal
          titulo={avarias.tipos[tipoSel].tipo}
          imagem={imagemAvaria(avarias.tipos[tipoSel].tipo)}
          cor={avarias.tipos[tipoSel].cor}
          meses={avarias.tipos[tipoSel].meses}
          total={avarias.tipos[tipoSel].total}
          pct={avarias.tipos[tipoSel].pct}
          onClose={() => setTipoSel(null)}
        />
      )}
    </div>
  );
}
