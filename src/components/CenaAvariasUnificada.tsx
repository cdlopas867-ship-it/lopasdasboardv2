import { useState } from "react";
import { cn } from "@/lib/utils";
import { fmtInt, fmtBrMax, fmtPeso, fmtMoeda } from "@/lib/format";
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
          texto={`Volumes avariados registrados no CD. Total de ${avarias.total.toLocaleString("pt-BR")} volumes (Soma de Quantidade). Distribuição mensal conferida com a tabela oficial. Custos parciais (em apuração). Fonte: planilha de avarias + tabela de referência de motivos. Janeiro a ${avarias.meses[avarias.meses.length - 1]?.mes ?? ""} de 2026.`}
        />
      </div>

      <div className="video-sobe mt-2 flex items-baseline gap-3">
        <p className="font-serif text-3xl text-white sm:text-4xl">
          {fmtInt(avarias.total)}
        </p>
        <span className="text-sm text-white/60">volumes</span>
        {(() => {
          const totalPeso = avarias.meses.reduce((s, m) => s + (m.peso ?? 0), 0);
          return totalPeso > 0 ? (
            <>
              <span className="text-[10px] font-bold text-white/30">·</span>
              <p className="font-mono text-lg font-bold text-brand-amber">{fmtPeso(totalPeso)}</p>
            </>
          ) : null;
        })()}
        {avarias.referenciaParcial && (
          <span className="text-[10px] text-white/45">· custos parciais em apuração</span>
        )}
      </div>

      {/* ── Gráfico mensal ── */}
      <div className="mt-4">
        <p className="mb-1.5 text-[9px] font-bold tracking-[0.3em] text-white/50 uppercase">
          Por mês
        </p>
        <div className="relative">
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
          {mesHover !== null && avarias.meses[mesHover] && (() => {
            const mes = avarias.meses[mesHover];
            const destaque = mes.mes.toUpperCase().startsWith("AGO");
            const tiposMes = (avarias.tipos ?? [])
              .map((t) => ({
                tipo: t.tipo,
                cor: t.cor,
                qtd: t.meses.find((mm) => mm.mes === mes.mes)?.qtd ?? 0,
              }))
              .filter((t) => t.qtd > 0)
              .sort((a, b) => b.qtd - a.qtd);
            const maxTipo = Math.max(...tiposMes.map((t) => t.qtd), 1);
            return (
              <div
                className="pointer-events-none absolute top-0 z-30 w-64"
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
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#161f0b]/95 shadow-2xl backdrop-blur-xl">
                  {/* faixa de cor do mês */}
                  <div
                    className="h-0.5 w-full"
                    style={{ background: destaque ? "#e38e12" : "linear-gradient(90deg, #f56868, #d94f4f)" }}
                  />
                  {/* cabeçalho */}
                  <div className="px-3.5 pb-2 pt-2.5">
                    <p className="font-serif text-sm font-bold tracking-wide text-white uppercase">
                      {mes.mes}
                    </p>
                  </div>
                  {/* stats em mini-cards */}
                  <div className="grid grid-cols-3 gap-px bg-white/5">
                    <div className="bg-[#161f0b] px-2 py-1.5">
                      <p className="text-[8px] font-bold tracking-widest text-white/35 uppercase">Volumes</p>
                      <p className="whitespace-nowrap font-mono text-xs font-bold text-white">{fmtInt(mes.qtd)}</p>
                    </div>
                    <div className="bg-[#161f0b] px-2 py-1.5">
                      <p className="text-[8px] font-bold tracking-widest text-brand-amber/60 uppercase">Peso</p>
                      <p className="whitespace-nowrap font-mono text-xs font-bold text-brand-amber">
                        {mes.peso ? fmtPeso(mes.peso) : "—"}
                      </p>
                    </div>
                    <div className="bg-[#161f0b] px-2 py-1.5">
                      <p className="text-[8px] font-bold tracking-widest text-emerald-400/60 uppercase">Valor</p>
                      <p className="whitespace-nowrap font-mono text-xs font-bold text-emerald-400">
                        {mes.custo ? fmtMoeda(mes.custo) : "—"}
                      </p>
                    </div>
                  </div>
                  {/* tipos com mini-barras proporcionais */}
                  {tiposMes.length > 0 && (
                    <div className="px-3.5 pb-2.5 pt-2">
                      <p className="mb-1.5 text-[8px] font-bold tracking-widest text-white/35 uppercase">
                        Tipos de avaria
                      </p>
                      <div className="space-y-1">
                        {tiposMes.map((t) => (
                          <div key={t.tipo} className="flex items-center gap-1.5">
                            <span className="size-1.5 shrink-0 rounded-full" style={{ background: t.cor }} />
                            <span className="flex-1 truncate text-[9px] leading-none text-white/75">{t.tipo}</span>
                            <div className="h-1 w-8 overflow-hidden rounded-full bg-white/8">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${(t.qtd / maxTipo) * 100}%`, background: t.cor }}
                              />
                            </div>
                            <span className="w-6 text-right font-mono text-[9px] font-bold text-white/55">{fmtInt(t.qtd)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* seta apontando para a barra */}
                <div
                  className="mx-auto -mt-px h-2 w-2 rotate-45 border-b border-r border-white/10 bg-[#161f0b]"
                />
              </div>
            );
          })()}
        </div>
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
