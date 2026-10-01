import { useState } from "react";
import { cn } from "@/lib/utils";
import { fmtInt, fmtBrMax } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { GraficoMotivoMensal } from "@/components/GraficoMotivoMensal";
import { imagemAvaria, temImagemAvaria } from "@/data/avarias-imagens";
import type { VideoAvarias } from "./VideoResumoDashboard";

/* Cena única de Avarias — junta total, gráfico mensal, cards de tipos com
   imagens e motivo mais frequente por mês em uma só tela. Clicar num tipo
   abre o modal com o gráfico detalhado mês a mês. */
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
  const maxMotivo = Math.max(...avarias.motivoMes.map((m) => m.qtd), 1);

  return (
    <div className="w-full">
      {/* Cabeçalho — título + total + custo */}
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Avarias
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto="Volumes avariados registrados no CD. Total de 3.276 volumes (Soma de Quantidade). Distribuição mensal conferida com a tabela oficial. Custos parciais (em apuração). Fonte: planilha de avarias + tabela de referência de motivos. Janeiro a setembro de 2026."
        />
      </div>

      <div className="video-sobe mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
        <p className="font-serif text-2xl text-white sm:text-3xl">
          {fmtInt(avarias.total)}{" "}
          <span className="text-sm text-white/60 sm:text-base">volumes</span>
        </p>
        {avarias.referenciaParcial && (
          <span className="text-[10px] text-white/50">custos parciais · em apuração</span>
        )}
      </div>

      {/* Gráfico mensal — barras compactas */}
      <div className="mt-4">
        <p className="mb-1.5 text-[9px] font-bold tracking-[0.3em] text-white/50 uppercase">
          Por mês
        </p>
        <div className="flex h-20 items-end justify-between gap-1 sm:gap-1.5">
          {avarias.meses.map((m, i) => {
            const destaque = m.mes.toUpperCase().startsWith("AGO");
            return (
              <div key={m.mes} className="flex h-full flex-1 flex-col justify-end">
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
                    "video-barra-y w-full rounded-t-md",
                    destaque
                      ? "bg-gradient-to-t from-brand-amber/80 to-brand-amber shadow-[0_0_12px_rgba(241,196,15,0.3)]"
                      : "bg-gradient-to-t from-red-500/50 to-red-400",
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
      </div>

      {/* Tipos de avaria — grid com imagens */}
      {avarias.tipos?.length ? (
        <div className="mt-4">
          <p className="mb-1.5 text-[9px] font-bold tracking-[0.3em] text-white/50 uppercase">
            Por tipo · clique para detalhar
          </p>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {avarias.tipos.map((t, i) => {
              const maxTMes = Math.max(...t.meses.map((m) => m.qtd), 1);
              const imagem = imagemAvaria(t.tipo);
              const temImg = temImagemAvaria(t.tipo);
              return (
                <button
                  type="button"
                  key={t.tipo}
                  onClick={() => {
                    setTipoSel(i);
                    onPausar?.();
                  }}
                  className="video-sobe group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-white/15 bg-white/5 text-left transition-all hover:border-primary/50 hover:bg-white/10"
                  style={{ animationDelay: `${0.1 * i + 0.4}s` }}
                >
                  {temImg ? (
                    <div className="relative h-8 overflow-hidden sm:h-10">
                      <img src={imagem} alt={t.tipo} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <p className="absolute bottom-0 left-1 right-1 truncate text-[7px] font-bold tracking-wider text-white uppercase">
                        {t.tipo}
                      </p>
                    </div>
                  ) : (
                    <div className="px-1 pt-1">
                      <p className="truncate text-[7px] font-bold tracking-wider text-white uppercase">
                        {t.tipo}
                      </p>
                    </div>
                  )}
                  <div className="p-1 sm:p-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="font-serif text-sm text-white sm:text-base">{fmtInt(t.total)}</span>
                      <span className="font-mono text-[8px] font-bold text-white/55">{fmtBrMax(t.pct, 1)}%</span>
                    </div>
                    <div className="my-0.5 h-0.5 rounded-full" style={{ background: t.cor }} />
                    <div className="flex h-5 items-stretch gap-0.5">
                      {t.meses.map((m, mi) => (
                        <div key={m.mes} className="flex h-full flex-1 flex-col items-center justify-end">
                          <div
                            className={cn("video-barra-y w-full rounded-t-sm", !anim && "video-pausada")}
                            style={{
                              height: `${Math.max((m.qtd / maxTMes) * 100, 6)}%`,
                              background: t.cor,
                              animationDelay: `${0.1 * i + 0.5 + 0.05 * mi}s`,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Motivo mais frequente por mês — faixa compacta */}
      <div className="mt-4">
        <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/50 uppercase">
          Motivo mais frequente
        </p>
        <div className="flex flex-wrap gap-1">
          {avarias.motivoMes.map((m, i) => {
            const destaque = m.mes.toUpperCase().startsWith("AGO");
            return (
              <div
                key={m.mes}
                className="video-sobe flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5"
                style={{ animationDelay: `${0.08 * i + 0.6}s` }}
              >
                <span
                  className={cn(
                    "text-[8px] font-bold uppercase",
                    destaque ? "text-brand-amber" : "text-white/50",
                  )}
                >
                  {m.mes.slice(0, 3)}
                </span>
                <span className="text-[8px] text-white/70">{m.motivo}</span>
                <span className="font-mono text-[8px] font-bold text-white">{fmtInt(m.qtd)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal — gráfico mês a mês do tipo selecionado */}
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
