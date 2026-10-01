import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt, fmtTonDec, fmtMoeda, fmtMoeda2, fmtPct, fmtPeso } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import CenaForaDeLinha from "@/components/CenaForaDeLinha";
import CenaTonelagemEstoque from "@/components/CenaTonelagemEstoque";
import CenaSaudeEstoque from "@/components/CenaSaudeEstoque";
import CenaAvariasUnificada from "@/components/CenaAvariasUnificada";

import { POSICAO_FORA_DE_LINHA, POSICAO_EM_LINHA, POSICAO_TOTAL, ITENS_FORA_DE_LINHA, type ItemForaDeLinha, type PosicaoEstoque } from "@/data/fora-de-linha";

export type VideoForaDeLinha = {
  itens: ItemForaDeLinha[];
  posicaoEmLinha: PosicaoEstoque;
  posicaoForaDeLinha: PosicaoEstoque;
  posicaoTotal: PosicaoEstoque;
} | null;
import type {
  VideoAbc,
  VideoAvarias,
  VideoDia,
  VideoKpi,
  VideoMes,
  VideoOcupacao,
  VideoPendentes,
  VideoReservados,
  VideoSaidasCD,
  VideoTurno,
  VideoUnidade,
} from "./VideoResumoDashboard";

/* Cenas da apresentação — conteúdo de cada slide, isolado em um componente
   para permitir renderizar também a cópia da cena que sai na transição suave. */

type Props = {
  cena: number;
  anim: boolean;
  kpis: VideoKpi[];
  unidades: VideoUnidade[];
  ocupacao: VideoOcupacao;
  semana: { rotulo: string; total: string; dias: VideoDia[] } | null;
  turnos: VideoTurno[];
  mensal?: VideoMes[] | undefined;
  avarias?: VideoAvarias | undefined;
  abc?: VideoAbc | undefined;
  pendentes?: VideoPendentes | undefined;
  reservados?: VideoReservados | undefined;
  valorFaturado?: number | undefined;
  saidasCD?: VideoSaidasCD | undefined;
  foraDeLinha?: VideoForaDeLinha | undefined;
  onReiniciar: () => void;
  onPausar?: (() => void) | undefined;
};

export default function CenasApresentacao({
  cena,
  anim,
  kpis,
  unidades,
  ocupacao,
  semana,
  turnos,
  mensal,
  abc,
  avarias,
  pendentes,
  reservados,
  valorFaturado,
  saidasCD,
  foraDeLinha,
  onReiniciar,
  onPausar,
}: Props) {
  const maxDia = semana ? Math.max(...semana.dias.map((d) => d.ton), 1) : 1;
  const totalTurnoTon = turnos.reduce((s, t) => s + (t.ton ?? 0), 0);
  const turnoPrincipal = turnos.length ? turnos.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
  /* Mostra todos os meses com recebimento ou carregamento — meses sem
     carregado no Drive (jan–abr) agora têm valores da planilha do usuário. */
  const listaMes = (mensal ?? []).filter((m) => m.recebido > 0 || m.carregado > 0);
  const totRecebido = listaMes.reduce((s, m) => s + m.recebido, 0);
  const totCarregado = listaMes.reduce((s, m) => s + m.carregado, 0);
  const R = 84;
  const CIRC = 2 * Math.PI * R;

  return (
    <>
      {/* Cena 1 — KPIs de abertura em destaque (um card por vez, centralizado) */}
      {cena === 0 && (
        <CenaKpisFoco kpis={kpis} foraDeLinha={foraDeLinha} onPausar={onPausar} />
      )}

      {/* Cena 3 — ocupação (donut) */}
      {cena === 1 && (
        <div className="flex w-full flex-col items-center">
          <div className="flex items-center gap-2">
            <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
              Ocupação do CD
            </p>
            <InfoTooltip onOpen={onPausar} texto="Taxa de ocupação das posições de armazenagem. Cálculo: posições ocupadas ÷ total de posições (5.970). Capacidades: CD1 = 1.800 kg/posição, CD2 = 2.500 kg/posição, 20 volumes/posição. Área total: 18.300 m². Fonte: inventário físico do CD. Atualizado em 28/09/2026." />
          </div>
          <div className="video-pop relative mt-2 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="size-28 sm:size-32">
              <circle
                cx="100"
                cy="100"
                r={R}
                fill="none"
                strokeWidth="16"
                className="stroke-white/15"
              />
              <circle
                cx="100"
                cy="100"
                r={R}
                fill="none"
                strokeWidth="16"
                strokeLinecap="round"
                stroke="white"
                transform="rotate(-90 100 100)"
                style={{
                  strokeDasharray: CIRC,
                  strokeDashoffset: anim ? CIRC * (1 - ocupacao.pct) : CIRC,
                  transition: "stroke-dashoffset 1.3s cubic-bezier(0.22,1,0.36,1)",
                  filter: "drop-shadow(0 0 8px rgba(255,255,255,0.35))",
                }}
              />
            </svg>
            <div className="absolute text-center">
              <p className="font-serif text-2xl text-white">
                {fmtBrMax(ocupacao.pct * 100, 1)}%
              </p>
              <p className="text-[8px] font-bold tracking-widest text-white/55 uppercase">
                ocupado
              </p>
            </div>
          </div>
          <div
            className="video-sobe mt-3 w-full max-w-xs mx-auto"
            style={{ animationDelay: "0.5s" }}
          >
            <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
              Legenda
            </p>
            <table className="w-full text-left text-[11px] text-white">
              <thead>
                <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
                  <th className="pb-0.5 font-bold">Atributo</th>
                  <th className="pb-0.5 text-center font-bold">Und.</th>
                  <th className="pb-0.5 text-right font-bold">CD1</th>
                  <th className="pb-0.5 text-right font-bold">CD2</th>
                  <th className="pb-0.5 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {(ocupacao.detalhes ?? []).map((d, i) => (
                  <tr key={`${d.atributo}-${d.unidade}-${i}`} className="border-b border-white/10 last:border-0">
                    <td className="py-0.5 text-white/80">{d.atributo}</td>
                    <td className="py-0.5 text-center text-white/50">{d.unidade}</td>
                    <td className="py-0.5 text-right font-mono font-semibold text-white/80">{fmtInt(d.cd1)}</td>
                    <td className="py-0.5 text-right font-mono font-semibold text-white/80">{fmtInt(d.cd2)}</td>
                    <td className="py-0.5 text-right font-mono font-bold text-white">{fmtInt(d.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1.5 text-[8px] leading-tight text-white/40">
              * 1.800 kg/posição CD1. * 2.500 kg/posição CD2. * 20 volumes/posição.
            </p>
          </div>
        </div>
      )}

      {/* Cena 4 — recebimento da semana (barras por dia) */}
      {cena === 2 && semana && (
        <div className="w-full">
          <div className="flex items-center gap-2">
            <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
              Recebimento · Semana {semana.rotulo}
            </p>
            <InfoTooltip onOpen={onPausar} texto="Tonelagem recebida por dia útil. Meta diária: 330 toneladas (linha tracejada). Cada barra representa um dia de recebimento. Fonte: sistema de recebimento Focco. Período: 10/09 a 22/09/2026." />
          </div>
          <p className="video-sobe mt-3 font-serif text-3xl text-white sm:text-5xl">
            {semana.total}
          </p>
          <div className="relative mt-10 flex h-48 items-end justify-between gap-2 sm:gap-4">
            {/* linha da meta */}
            <div
              className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-brand-amber"
              style={{ bottom: `${Math.min((semana.dias[0]?.meta ?? 330) / maxDia, 1) * 100}%` }}
            >
              <span className="absolute -top-5 right-0 text-[9px] font-bold tracking-widest text-brand-amber uppercase">
                meta
              </span>
            </div>
            {semana.dias.map((d, i) => (
              <div key={d.data} className="flex h-full flex-1 flex-col justify-end">
                <p
                  className="video-sobe mb-1.5 text-center font-mono text-[11px] font-bold text-white/85"
                  style={{ animationDelay: `${0.12 * i + 0.5}s` }}
                >
                  {fmtTonCurto(d.ton)}
                </p>
                <div
                  className={cn(
                    "video-barra-y w-full rounded-t-lg",
                    d.ton >= d.meta
                      ? "bg-gradient-to-t from-white/80 to-white shadow-[0_0_16px_rgba(255,255,255,0.25)]"
                      : "bg-gradient-to-t from-brand-amber/70 to-brand-amber",
                    !anim && "video-pausada",
                  )}
                  style={{
                    height: `${Math.max((d.ton / maxDia) * 100, 4)}%`,
                    animationDelay: `${0.12 * i + 0.2}s`,
                  }}
                />
                <p className="mt-2 text-center text-[10px] font-bold text-white/70 uppercase">
                  {d.data}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cena 5 — recebimento por turno (formato ocupação do CD) */}
      {cena === 3 && (
        <div className="flex w-full flex-col items-center">
          <div className="flex items-center gap-2">
            <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
              Recebimento por turno
            </p>
            <InfoTooltip onOpen={onPausar} texto="Distribuição do recebimento entre turnos. Turno dia: 06:00–17:59. Turno noite: 18:00–02:30. Percentual = tonelagem do turno ÷ total recebido. Fonte: sistema Focco. Período acumulado de 2026." />
          </div>
          {turnoPrincipal && (
            <div className="video-pop relative mt-2 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="size-28 sm:size-32">
                <circle
                  cx="100"
                  cy="100"
                  r={R}
                  fill="none"
                  strokeWidth="16"
                  className="stroke-white/15"
                />
                <circle
                  cx="100"
                  cy="100"
                  r={R}
                  fill="none"
                  strokeWidth="16"
                  strokeLinecap="round"
                  stroke="white"
                  transform="rotate(-90 100 100)"
                  style={{
                    strokeDasharray: CIRC,
                    strokeDashoffset: anim ? CIRC * (1 - turnoPrincipal.pct / 100) : CIRC,
                    transition: "stroke-dashoffset 1.3s cubic-bezier(0.22,1,0.36,1)",
                    filter: "drop-shadow(0 0 8px rgba(255,255,255,0.35))",
                  }}
                />
              </svg>
              <div className="absolute text-center">
                <p className="font-serif text-2xl text-white">
                  {fmtBrMax(turnoPrincipal.pct, 1)}%
                </p>
                <p className="text-[8px] font-bold tracking-widest text-white/55 uppercase">
                  turno {turnoPrincipal.nome}
                </p>
              </div>
            </div>
          )}
          <div
            className="video-sobe mt-3 w-full max-w-xs mx-auto"
            style={{ animationDelay: "0.5s" }}
          >
            <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
              Legenda
            </p>
            <table className="w-full text-left text-[11px] text-white">
              <thead>
                <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
                  <th className="pb-0.5 font-bold">Turno</th>
                  <th className="pb-0.5 text-center font-bold">Faixa</th>
                  <th className="pb-0.5 text-right font-bold">Ton.</th>
                  <th className="pb-0.5 text-right font-bold">%</th>
                </tr>
              </thead>
              <tbody>
                {turnos.map((t) => (
                  <tr key={t.nome} className="border-b border-white/10 last:border-0">
                    <td className="py-0.5 text-white/80">{t.nome}</td>
                    <td className="py-0.5 text-center text-white/50">{t.faixa ?? "—"}</td>
                    <td className="py-0.5 text-right font-mono font-semibold text-white/80">
                      {t.ton ? fmtTonDec(t.ton) : "—"}
                    </td>
                    <td className="py-0.5 text-right font-mono font-bold text-white">
                      {fmtBrMax(t.pct, 1)}%
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-white/30 font-bold">
                  <td className="py-0.5 text-white">Total</td>
                  <td />
                  <td className="py-0.5 text-right font-mono text-white">
                    {totalTurnoTon ? fmtTonDec(totalTurnoTon) : "—"}
                  </td>
                  <td className="py-0.5 text-right font-mono text-white">100%</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-1.5 text-[8px] leading-tight text-white/40">
              * Turno dia: 06:00–17:59. * Turno noite: 18:00–02:30. Fonte: sistema Focco.
            </p>
          </div>
        </div>
      )}

      {/* Cena 6 — recebido × carregado por mês (destaque: agosto) */}
      {cena === 4 && (
        <div className="w-full">
          <div className="flex items-center gap-2">
            <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
              Recebido × Carregado · por mês
            </p>
            <InfoTooltip onOpen={onPausar} texto="Comparativo mensal de tonelagem recebida e carregada. Eficiência = carregado ÷ recebido × 100. Variação = (carregado do mês ÷ carregado do mês anterior − 1) × 100. Agosto em destaque. Fonte: planilhas de recebimento e carregamento do Drive. Janeiro a setembro de 2026." />
          </div>
          {listaMes.length ? (
            <>
              <div className="video-sobe mt-3 flex flex-wrap items-baseline gap-x-8 gap-y-1">
                <p className="font-serif text-2xl text-white sm:text-4xl">
                  {fmtTonDec(totRecebido)}{" "}
                  <span className="text-sm text-white/60 sm:text-base">recebidas</span>
                </p>
                <p className="font-serif text-2xl text-brand-amber sm:text-4xl">
                  {fmtTonDec(totCarregado)}{" "}
                  <span className="text-sm text-white/60 sm:text-base">carregadas</span>
                </p>
                <p className="font-serif text-2xl sm:text-4xl">
                  <span className={cn(totRecebido - totCarregado >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {fmtTonDec(Math.abs(totRecebido - totCarregado))}
                  </span>{" "}
                  <span className="text-sm text-white/60 sm:text-base">saldo</span>
                </p>
              </div>

              <div className="mt-8 flex h-44 items-end justify-between gap-3 sm:gap-5">
                {listaMes.map((m, i) => {
                  const max = Math.max(
                    ...listaMes.map((x) => Math.max(x.recebido, x.carregado)),
                    1,
                  );
                  const destaque = m.mes.toUpperCase().startsWith("AGO");
                  /* Desempenho do mês: eficiência (carregado/recebido) e variação vs. mês anterior */
                  const pct = m.recebido > 0 ? (m.carregado / m.recebido) * 100 : 0;
                  const anterior = listaMes[i - 1];
                  const delta = anterior?.carregado
                    ? ((m.carregado - anterior.carregado) / anterior.carregado) * 100
                    : null;
                  return (
                    <div key={m.mes} className="flex h-full flex-1 flex-col justify-end">
                      <div className="flex h-full items-end justify-center gap-1.5">
                        <div className="flex h-full flex-1 flex-col items-center justify-end">
                          <p
                            className="video-sobe mb-1 text-center font-mono text-[10px] font-bold text-white/85"
                            style={{ animationDelay: `${0.12 * i + 0.5}s` }}
                          >
                            {fmtInt(m.recebido)}
                          </p>
                          <div
                            className={cn(
                              "video-barra-y w-full rounded-t-lg bg-gradient-to-t from-brand-amber/70 to-brand-amber",
                              !anim && "video-pausada",
                            )}
                            style={{
                              height: `${Math.max((m.recebido / max) * 100, 3)}%`,
                              animationDelay: `${0.12 * i + 0.2}s`,
                            }}
                          />
                        </div>
                        <div className="flex h-full flex-1 flex-col items-center justify-end">
                          <p
                            className="video-sobe mb-1 text-center font-mono text-[10px] font-bold text-white/85"
                            style={{ animationDelay: `${0.12 * i + 0.55}s` }}
                          >
                            {fmtInt(m.carregado)}
                          </p>
                          <div
                            className={cn(
                              "video-barra-y w-full rounded-t-lg",
                              destaque
                                ? "bg-gradient-to-t from-white/90 to-white shadow-[0_0_18px_rgba(255,255,255,0.35)]"
                                : "bg-gradient-to-t from-white/50 to-white/80",
                              !anim && "video-pausada",
                            )}
                            style={{
                              height: `${Math.max((m.carregado / max) * 100, 3)}%`,
                              animationDelay: `${0.12 * i + 0.3}s`,
                            }}
                          />
                        </div>
                      </div>
                      <p
                        className={cn(
                          "mt-2 truncate text-center text-[10px] font-bold uppercase",
                          destaque ? "text-brand-amber" : "text-white/70",
                        )}
                      >
                        {m.mes}
                        {destaque && " ★"}
                      </p>
                      <p
                        className="video-sobe mt-1 text-center font-mono text-[10px] font-bold text-white/85"
                        style={{ animationDelay: `${0.12 * i + 0.65}s` }}
                      >
                        {fmtBrMax(pct, 0)}%
                      </p>
                      <p
                        className={cn(
                          "video-sobe text-center text-[9px] font-bold",
                          delta === null
                            ? "text-white/30"
                            : delta >= 0
                              ? "text-emerald-400"
                              : "text-red-400",
                        )}
                        style={{ animationDelay: `${0.12 * i + 0.7}s` }}
                      >
                        {delta === null
                          ? "—"
                          : `${delta >= 0 ? "▲" : "▼"} ${fmtBrMax(Math.abs(delta), 1)}%`}
                      </p>
                      {/* Diferença recebido − carregado do mês */}
                      {(() => {
                        const diff = m.recebido - m.carregado;
                        return (
                          <p
                            className={cn(
                              "video-sobe text-center font-mono text-[8px] font-bold",
                              diff >= 0 ? "text-emerald-400/80" : "text-red-400/80",
                            )}
                            style={{ animationDelay: `${0.12 * i + 0.75}s` }}
                          >
                            {diff >= 0 ? "+" : "−"}{fmtInt(Math.abs(diff))}
                          </p>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
              <div
                className="video-sobe mt-5 flex flex-wrap items-center justify-center gap-3 text-[9px] font-bold tracking-widest uppercase sm:gap-6 sm:text-[10px]"
                style={{ animationDelay: "0.6s" }}
              >
                <span className="flex items-center gap-2 text-white/70">
                  <span className="size-2.5 rounded-sm bg-brand-amber" /> Recebido
                </span>
                <span className="flex items-center gap-2 text-white/70">
                  <span className="size-2.5 rounded-sm bg-white" /> Carregado
                </span>
                <span className="text-white/50">
                  <span className="text-emerald-400">▲</span>/<span className="text-red-400">▼</span> vs. mês anterior
                </span>
                <span className="text-white/50">% carregado/recebido</span>
                <span className="text-white/50">
                  <span className="text-emerald-400">+</span>/<span className="text-red-400">−</span> saldo mês
                </span>
                <span className="text-brand-amber">★ Agosto em destaque</span>
              </div>
            </>
          ) : (
            <p className="video-sobe mt-8 font-serif text-3xl text-white/70">
              Sem dados de carregamento por mês.
            </p>
          )}
        </div>
      )}

      {/* Cena 6 — avarias unificada (total, gráfico mensal, tipos com imagens, motivo) */}
      {cena === 5 && (
        <CenaAvariasUnificada anim={anim} avarias={avarias} onPausar={onPausar} />
      )}

      {/* Cena 7 — pendências de produção */}
      {cena === 6 && (
        <div className="w-full">
          <div className="flex items-center gap-2">
            <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
              Pendências de produção
            </p>
            <InfoTooltip onOpen={onPausar} texto="Ordens de produção pendentes no sistema. Tonelagem total e média mensal das ordens em aberto. Crítico = ordens com data final em qualquer mês anterior ao atual. No prazo = apenas ordens do mês atual ou futuro. Fonte: sistema Focco. Dados de 2026." />
          </div>
          {pendentes ? (
            <>
              <p className="video-sobe mt-3 font-serif text-3xl text-white sm:text-5xl">
                {fmtBrMax(pendentes.totalTon, 1)} t{" "}
                <span className="text-base text-white/60 sm:text-lg">
                  · {fmtInt(pendentes.itens)} ordens
                </span>
              </p>
              <p className="video-sobe mt-1 text-sm text-white/50">
                Média mensal: <span className="font-bold text-brand-amber">{fmtBrMax(pendentes.mediaTon, 1)} t</span>
              </p>

              {/* Resumo por status (crítico = mês passado · no prazo = mês atual/futuro) */}
              <div className="mt-5 space-y-3">
                {pendentes.fatias.map((f, i) => {
                  const max = Math.max(...pendentes.fatias.map((x) => x.ton), 1);
                  return (
                    <div
                      key={f.rotulo}
                      className="video-sobe flex items-center gap-3"
                      style={{ animationDelay: `${0.12 * i}s` }}
                    >
                      <span className="w-16 shrink-0 text-[10px] font-bold tracking-wider text-white/70 uppercase sm:w-20">
                        {f.rotulo}
                      </span>
                      <div className="h-6 flex-1 overflow-hidden rounded-lg bg-white/15">
                        <div
                          className={cn("video-barra-x h-full rounded-lg", !anim && "video-pausada")}
                          style={{
                            width: `${(f.ton / max) * 100}%`,
                            background: f.cor,
                            animationDelay: `${0.12 * i + 0.15}s`,
                          }}
                        />
                      </div>
                      <span className="w-14 text-right font-mono text-[11px] font-bold text-white">
                        {fmtBrMax(f.ton, 1)} t
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Detalhe por mês — tonelagem, %, data final, lotes e ordens */}
              {pendentes.meses?.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-[10px] font-bold tracking-[0.3em] text-white/50 uppercase">
                    Por mês
                  </p>
                  <div className="space-y-2">
                    {pendentes.meses.map((m, i) => {
                      const maxMes = Math.max(...pendentes.meses.map((x) => x.ton), 1);
                      return (
                        <div
                          key={m.mes}
                          className="video-sobe flex items-center gap-3"
                          style={{ animationDelay: `${0.12 * i + 0.3}s` }}
                        >
                          <span className="w-14 shrink-0 font-mono text-[11px] font-bold text-white/80">
                            {m.mes}
                          </span>
                          <div className="h-5 flex-1 overflow-hidden rounded-md bg-white/15">
                            <div
                              className={cn("video-barra-x h-full rounded-md bg-gradient-to-r from-brand-amber/70 to-brand-amber", !anim && "video-pausada")}
                              style={{
                                width: `${(m.ton / maxMes) * 100}%`,
                                animationDelay: `${0.12 * i + 0.4}s`,
                              }}
                            />
                          </div>
                          <span className="w-14 text-right font-mono text-[11px] font-bold text-white">
                            {fmtBrMax(m.ton, 1)} t
                          </span>
                          <span className="w-12 text-right font-mono text-[10px] font-bold text-brand-amber">
                            {fmtBrMax(m.pct, 0)}%
                          </span>
                          <span className="w-28 shrink-0 whitespace-nowrap rounded bg-white/10 px-1.5 py-0.5 text-center font-mono text-[10px] font-semibold text-white/75">
                            {m.dtFinal ? `${m.dtInicial ? `${m.dtInicial.slice(8, 10)}/${m.dtInicial.slice(5, 7)} – ` : ""}${m.dtFinal.slice(8, 10)}/${m.dtFinal.slice(5, 7)}` : "—"}
                          </span>
                          <span className="w-10 text-right text-[9px] text-white/45">
                            {m.lotes ?? 0} lot
                          </span>
                          <span className="w-10 text-right text-[9px] text-white/45">
                            {fmtInt(m.itens)} ord
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="video-sobe mt-8 font-serif text-3xl text-white/70">
              Nenhuma pendência de produção.
            </p>
          )}
        </div>
      )}

      {/* Cena 8 — itens reservados: cruzamento peso, quantidade e valor */}
      {cena === 7 && reservados && (
        <div className="flex w-full flex-col items-center">
          <div className="flex items-center gap-2">
            <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
              Estoque Reservado
            </p>
            <InfoTooltip onOpen={onPausar} texto="Itens com reserva comercial. % do valor = valor reservado ÷ valor total do estoque × 100. Cálculo por item: qtd reservada × custo médio = valor reservado; qtd reservada × peso bruto = peso reservado. Fonte: planilha 'COMERCIAL 024 - SALDO DE ITENS COM RESERVA' do Drive. Atualizado em 28/09/2026." />
          </div>

          {/* Anel circular de progresso — % do valor reservado */}
          <div className="video-pop relative mt-2 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="size-28 sm:size-32">
              <circle
                cx="100"
                cy="100"
                r={R}
                fill="none"
                strokeWidth="16"
                className="stroke-white/15"
              />
              <circle
                cx="100"
                cy="100"
                r={R}
                fill="none"
                strokeWidth="16"
                strokeLinecap="round"
                stroke="white"
                transform="rotate(-90 100 100)"
                style={{
                  strokeDasharray: CIRC,
                  strokeDashoffset: anim ? CIRC * (1 - reservados.pctValor / 100) : CIRC,
                  transition: "stroke-dashoffset 1.3s cubic-bezier(0.22,1,0.36,1)",
                  filter: "drop-shadow(0 0 8px rgba(255,255,255,0.35))",
                }}
              />
            </svg>
            <div className="absolute text-center">
              <p className="font-serif text-2xl text-white">
                {fmtBrMax(reservados.pctValor, 1)}%
              </p>
              <p className="text-[8px] font-bold tracking-widest text-white/55 uppercase">
                reservado
              </p>
            </div>
          </div>

          {/* Tabela de cruzamento — peso, quantidade e valor */}
          <div
            className="video-sobe mt-3 w-full max-w-xs mx-auto"
            style={{ animationDelay: "0.5s" }}
          >
            <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
              Legenda
            </p>
            <table className="w-full text-left text-[11px] text-white">
              <thead>
                <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
                  <th className="pb-0.5 font-bold">Atributo</th>
                  <th className="pb-0.5 text-center font-bold">Und.</th>
                  <th className="pb-0.5 text-right font-bold">Reserv.</th>
                  <th className="pb-0.5 text-right font-bold">Estoque</th>
                  <th className="pb-0.5 text-right font-bold">%</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="py-0.5 text-white/80">Peso</td>
                  <td className="py-0.5 text-center text-white/50">t</td>
                  <td className="py-0.5 text-right font-mono font-semibold text-white/80">{fmtBrMax(reservados.totalTon, 1)}</td>
                  <td className="py-0.5 text-right font-mono font-semibold text-white/80">{fmtBrMax(reservados.totalPesoEstoque, 1)}</td>
                  <td className="py-0.5 text-right font-mono font-bold text-brand-amber">{fmtBrMax(reservados.pctPeso, 1)}%</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-0.5 text-white/80">Quantidade</td>
                  <td className="py-0.5 text-center text-white/50">un</td>
                  <td className="py-0.5 text-right font-mono font-semibold text-white/80">{fmtInt(reservados.totalQtd)}</td>
                  <td className="py-0.5 text-right font-mono font-semibold text-white/80">{fmtInt(reservados.totalSaldo)}</td>
                  <td className="py-0.5 text-right font-mono font-bold text-brand-amber">{fmtBrMax(reservados.pctQtd, 1)}%</td>
                </tr>
                <tr className="border-b border-white/10 last:border-0">
                  <td className="py-0.5 text-white/80">Valor</td>
                  <td className="py-0.5 text-center text-white/50">R$</td>
                  <td className="py-0.5 text-right font-mono font-semibold text-white/80">{fmtBrMax(reservados.totalValor / 1e6, 2)} mi</td>
                  <td className="py-0.5 text-right font-mono font-semibold text-white/80">{fmtBrMax(reservados.totalValorEstoque / 1e6, 2)} mi</td>
                  <td className="py-0.5 text-right font-mono font-bold text-brand-amber">{fmtBrMax(reservados.pctValor, 1)}%</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-1.5 text-[8px] leading-tight text-white/40">
              * Valores em milhões de reais. Toneladas com 1 casa decimal.
            </p>
          </div>

          {/* Valor previsto da reserva — integrado na mesma cena */}
          {valorFaturado && (
            <div className="video-sobe mt-5 w-full max-w-sm mx-auto border-t border-white/10 pt-5" style={{ animationDelay: "0.7s" }}>
              <div className="flex items-center justify-center gap-2">
                <p className="text-[10px] font-bold tracking-[0.3em] text-white/60 uppercase">
                  Valor Previsto da Reserva
                </p>
                <InfoTooltip onOpen={onPausar} texto="Valor previsto da reserva = toneladas reservadas × valor faturado por tonelada. O valor faturado por tonelada é configurado manualmente. Fonte: dados de reservados × valor faturado. Atualizado em 28/09/2026." />
              </div>
              <p className="mt-2 text-center font-serif text-3xl text-primary sm:text-4xl">
                {fmtMoeda(reservados.totalTon * valorFaturado)}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-center">
                  <p className="font-serif text-base text-white sm:text-lg">{fmtTonDec(reservados.totalTon)}</p>
                  <p className="text-[7px] font-bold tracking-widest text-white/50 uppercase">Ton. reserv.</p>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-center">
                  <p className="font-serif text-base text-white sm:text-lg">× {fmtMoeda2(valorFaturado)}</p>
                  <p className="text-[7px] font-bold tracking-widest text-white/50 uppercase">R$/t faturado</p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-2.5 text-center">
                  <p className="font-serif text-base text-primary sm:text-lg">{fmtBrMax(reservados.pctValor, 1)}%</p>
                  <p className="text-[7px] font-bold tracking-widest text-primary uppercase">do valor</p>
                </div>
              </div>
              <p className="mt-2 text-center text-[9px] text-white/40">
                Toneladas reservadas × valor faturado = valor previsto da reserva
              </p>
            </div>
          )}
        </div>
      )}

      {/* Cena 8 fallback — sem dados de reservados */}
      {cena === 7 && !reservados && (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="flex items-center gap-2">
            <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
              Estoque Reservado
            </p>
            <InfoTooltip onOpen={onPausar} texto="Itens com reserva comercial. % do valor = valor reservado ÷ valor total do estoque × 100. Cálculo por item: qtd reservada × custo médio = valor reservado; qtd reservada × peso bruto = peso reservado. Fonte: planilha 'COMERCIAL 024 - SALDO DE ITENS COM RESERVA' do Drive. Atualizado em 28/09/2026." />
          </div>
          <p className="video-sobe font-serif text-3xl text-white/70">
            Sem dados de itens reservados.
          </p>
          <p className="video-sobe mt-2 text-sm text-white/50" style={{ animationDelay: "0.15s" }}>
            Adicione a planilha de reservados na pasta do Google Drive.
          </p>
        </div>
      )}

      {/* Cena 9 — Fora de linha por categoria */}
      {cena === 8 && (
        <CenaForaDeLinha anim={anim} foraDeLinha={foraDeLinha} onPausar={onPausar} />
      )}

      {/* Cena 10 — Tonelagem do estoque mês a mês com variação % */}
      {cena === 9 && (
        <CenaTonelagemEstoque anim={anim} />
      )}

      {/* Cena 11 — Saúde do estoque (donut) */}
      {cena === 10 && (
        <CenaSaudeEstoque anim={anim} mensal={mensal} />
      )}

      {/* Cena 12 — encerramento */}
      {cena === 11 && (
        <div className="flex flex-col items-center py-4 text-center">
          <p className="video-sobe font-serif text-4xl tracking-tight text-white sm:text-5xl" style={{ animationDelay: "0.1s" }}>
            Fim do <span className="italic text-brand-amber">resumo</span>.
          </p>
          <p className="video-sobe mt-2 text-sm text-white/60" style={{ animationDelay: "0.35s" }}>
            A apresentação reinicia automaticamente.
          </p>
          <button
            type="button"
            onClick={onReiniciar}
            className="video-sobe mt-6 cursor-pointer rounded-full bg-white px-8 py-3 text-xs font-bold tracking-widest text-brand-dark uppercase shadow-xl transition-transform hover:scale-105"
            style={{ animationDelay: "0.45s" }}
          >
            ↻ Reiniciar agora
          </button>
        </div>
      )}

    </>
  );
}

/* Cena 1 — carrossel de destaque: os cards abrem um a um e só o card aberto
   aparece centralizado na tela, ganhando todo o destaque. Avança sozinho e
   também por clique nos indicadores; clicar no card pausa/retoma o ciclo. */
function CenaKpisFoco({
  kpis,
  foraDeLinha,
  onPausar,
}: {
  kpis: VideoKpi[];
  foraDeLinha?: VideoForaDeLinha | undefined;
  onPausar?: (() => void) | undefined;
}) {
  const total = kpis.length + 1; // +1 = card Fora de linha
  const [foco, setFoco] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado) return;
    const t = setTimeout(() => setFoco((f) => (f + 1) % total), 4800);
    return () => clearTimeout(t);
  }, [foco, pausado, total]);

  const ehForaDeLinha = foco >= kpis.length;
  const kpi = !ehForaDeLinha ? kpis[foco] : null;
  const togglePausar = () => {
    const next = !pausado;
    setPausado(next);
    if (next) onPausar?.();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center gap-2">
        <p className="video-sobe text-[11px] font-medium tracking-[0.4em] text-white/70 uppercase">
          Resumo do CD · {new Date().getFullYear()}
        </p>
        <InfoTooltip onOpen={onPausar} texto="Indicadores principais do CD Lopas. Valor em estoque = custo médio × saldo de cada item. Peças e massa somadas de todos os itens ativos. Ocupação = posições ocupadas ÷ total de endereços (5.970). Fonte: planilha de saldo de itens do Google Drive. Atualizado em 28/09/2026." />
      </div>

      {/* Apenas o card aberto aparece, centralizado e em destaque */}
      <div className="relative mt-10 flex w-full max-w-[19rem] items-center justify-center">
        {/* halo suave atrás do card para destacar sem peso */}
        <div className="card-foco-halo pointer-events-none absolute inset-0" aria-hidden />
        <div key={foco} className="card-foco-entra relative w-full">
          {kpi ? (
            <CardFocoKpi kpi={kpi} onTogglePausar={togglePausar} />
          ) : (
            <CardFocoForaDeLinha foraDeLinha={foraDeLinha} onTogglePausar={togglePausar} />
          )}
        </div>
      </div>

      {/* Indicadores — pílulas delicadas, a ativa alonga-se */}
      <div className="mt-8 flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setFoco(i)}
            aria-label={`Card ${i + 1}`}
            className={cn(
              "h-1 rounded-full transition-all duration-500",
              i === foco ? "w-7 bg-primary" : "w-3 bg-white/20 hover:bg-white/40",
            )}
          />
        ))}
      </div>
      <p className="mt-4 text-[8px] font-medium tracking-[0.4em] text-white/30 uppercase">
        {pausado ? "Pausado · toque no card para retomar" : "Toque no card para pausar"}
      </p>
    </div>
  );
}

/* Vidro refinado compartilhado pelos cards de destaque */
const cardFocoBase =
  "group block w-full cursor-pointer rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 text-center backdrop-blur-xl shadow-[0_20px_50px_-36px_rgba(0,0,0,0.7)] transition-all duration-500 hover:border-white/20 hover:bg-white/[0.06] sm:p-5";

/* Card de KPI em destaque — centralizado, grande, com o resumo sempre aberto */
function CardFocoKpi({
  kpi,
  onTogglePausar,
}: {
  kpi: VideoKpi;
  onTogglePausar: () => void;
}) {
  return (
    <button type="button" onClick={onTogglePausar} className={cardFocoBase}>
      <p className="font-serif text-[1.75rem] leading-none tracking-tight text-white sm:text-[2.125rem]">
        {kpi.valor}
      </p>
      <p className="mt-1.5 text-[8px] font-medium tracking-[0.4em] text-primary/80 uppercase">
        {kpi.rotulo}
      </p>
      {kpi.detalhe && (
        <p className="mt-3 text-left text-[11px] leading-relaxed text-white/60 sm:text-[12px]">
          {kpi.detalhe}
        </p>
      )}
      {kpi.extra?.length ? (
        <dl className="mt-3 divide-y divide-white/[0.07] border-t border-white/[0.07] text-left">
          {kpi.extra.map(([k, v], ki) => (
            <div key={`${k}-${ki}`} className="flex items-baseline justify-between py-1.5 text-[10px] sm:text-[11px]">
              <dt className="text-white/45">{k}</dt>
              <dd className="font-medium text-white/90">{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </button>
  );
}

/* Card de "fora de linha" em destaque — acento âmbar, resumo aberto */
function CardFocoForaDeLinha({
  foraDeLinha,
  onTogglePausar,
}: {
  foraDeLinha?: VideoForaDeLinha | undefined;
  onTogglePausar: () => void;
}) {
  const pos = foraDeLinha?.posicaoForaDeLinha ?? POSICAO_FORA_DE_LINHA;
  const total = foraDeLinha?.posicaoTotal ?? POSICAO_TOTAL;
  const pctValor = pos.valorEstoque / total.valorEstoque;
  return (
    <button
      type="button"
      onClick={onTogglePausar}
      className={cn(cardFocoBase, "border-brand-amber/20 bg-brand-amber/[0.05] hover:border-brand-amber/35 hover:bg-brand-amber/[0.08]")}
    >
      <p className="font-serif text-[1.75rem] leading-none tracking-tight text-white sm:text-[2.125rem]">
        {fmtPct(pctValor)}
      </p>
      <p className="mt-1.5 text-[8px] font-medium tracking-[0.4em] text-brand-amber/80 uppercase">
        Fora de linha
      </p>
      <p className="mt-3 text-left text-[11px] leading-relaxed text-white/60 sm:text-[12px]">
        {fmtInt(pos.itens)} itens descontinuados ainda ocupam o CD — {fmtMoeda(pos.valorEstoque)} em
        custo ({fmtPct(pctValor)} do valor total) e {fmtPeso(pos.pesoTon * 1000)} de massa
        ({fmtPct(pos.pesoTon / total.pesoTon)} do peso total).
      </p>
      <dl className="mt-2.5 divide-y divide-white/[0.07] border-t border-white/[0.07] text-left">
        <div className="flex items-baseline justify-between py-1 text-[10px] sm:text-[11px]">
          <dt className="text-white/45">Itens fora de linha</dt>
          <dd className="font-medium text-white/90">{fmtInt(pos.itens)}</dd>
        </div>
        <div className="flex items-baseline justify-between py-1 text-[10px] sm:text-[11px]">
          <dt className="text-white/45">Valor em estoque</dt>
          <dd className="font-medium text-white/90">{fmtMoeda(pos.valorEstoque)}</dd>
        </div>
        <div className="flex items-baseline justify-between py-1 text-[10px] sm:text-[11px]">
          <dt className="text-white/45">Valor reservado</dt>
          <dd className="font-medium text-white/90">{fmtMoeda(pos.valorReservado)}</dd>
        </div>
        <div className="flex items-baseline justify-between py-1 text-[10px] sm:text-[11px]">
          <dt className="text-white/45">Massa total</dt>
          <dd className="font-medium text-brand-amber">{fmtPeso(pos.pesoTon * 1000)}</dd>
        </div>
        <div className="flex items-baseline justify-between py-1 text-[10px] sm:text-[11px]">
          <dt className="text-white/45">Massa reservada</dt>
          <dd className="font-medium text-brand-amber">{fmtPeso(pos.pesoReservadoTon * 1000)}</dd>
        </div>
        <div className="flex items-baseline justify-between py-1 text-[10px] sm:text-[11px]">
          <dt className="text-white/45">Saldo físico</dt>
          <dd className="font-medium text-white/90">{fmtInt(pos.saldoFocco)} un</dd>
        </div>
        <div className="flex items-baseline justify-between py-1 text-[10px] sm:text-[11px]">
          <dt className="text-white/45">Disponível</dt>
          <dd className="font-medium text-white/90">{fmtInt(pos.disponivel)} un</dd>
        </div>
      </dl>
    </button>
  );
}

/* Toneladas em formato curto — "327" ou "1.234" */
function fmtTonCurto(ton: number) {
  return fmtInt(ton);
}
