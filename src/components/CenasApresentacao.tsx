import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt, fmtMoeda, fmtPct, fmtPeso } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { calcularPendentesResumo } from "@/lib/pendentes-resumo";
import type { PendenteProducao } from "@/lib/pendentes";
import CenaForaDeLinha from "@/components/CenaForaDeLinha";
import CenaTonelagemEstoque from "@/components/CenaTonelagemEstoque";
import CenaAvariasUnificada from "@/components/CenaAvariasUnificada";
import CenaOcupacao from "@/components/CenaOcupacao";
import CenaRecebimentoTurno from "@/components/CenaRecebimentoTurno";
import CenaReservados from "@/components/CenaReservados";
import CenaEstoquePrevisto from "@/components/CenaEstoquePrevisto";
import CenaPaletes from "@/components/CenaPaletes";
import CenaProducaoSemana from "@/components/CenaProducaoSemana";
import CenaSaldoComparativo from "@/components/CenaSaldoComparativo";
import CenaAcertosEstoque from "@/components/CenaAcertosEstoque";
import type { SaldoComparativo } from "@/data/saldo-comparativo";
import type { AcertosEstoque } from "@/data/acertos-estoque";

import { POSICAO_FORA_DE_LINHA, POSICAO_TOTAL, type ItemForaDeLinha, type PosicaoEstoque } from "@/data/fora-de-linha";

export type VideoForaDeLinha = {
  itens: ItemForaDeLinha[];
  posicaoEmLinha: PosicaoEstoque;
  posicaoForaDeLinha: PosicaoEstoque;
  posicaoTotal: PosicaoEstoque;
} | null;
import type {
  VideoAvarias,
  VideoDia,
  VideoKpi,
  VideoMes,
  VideoOcupacao,
  VideoPaletas,
  VideoPendentes,
  VideoReservados,
  VideoTurno,
  VideoUnidade,
  RecebimentoSemanalDia,
} from "./VideoResumoDashboard";
import { semanaAtual, type ProducaoSemanalDia } from "@/lib/producao-semanal";

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
  pendentes?: VideoPendentes | undefined;
  reservados?: VideoReservados | undefined;
  semReserva?: VideoReservados | undefined;
  valorFaturado?: number | undefined;
  foraDeLinha?: VideoForaDeLinha | undefined;
  paletas?: VideoPaletas | undefined;
  recebimentoSemanal?: RecebimentoSemanalDia[] | undefined;
  producaoSemanal?: ProducaoSemanalDia[] | undefined;
  resumo?: { valor: number; previsto: number; ton: number; saldo: number; itens: number } | null;
  saldoComparativo?: SaldoComparativo | null | undefined;
  acertosEstoque?: AcertosEstoque | null | undefined;
  onReiniciar: () => void;
  onGerarRelatorio?: (() => void) | undefined;
  onExportarExcel?: (() => void) | undefined;
  exportando?: boolean | undefined;
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
  avarias,
  pendentes,
  reservados,
  semReserva,
  valorFaturado,
  foraDeLinha,
  paletas,
  recebimentoSemanal,
  producaoSemanal,
  resumo,
  saldoComparativo,
  acertosEstoque,
  onReiniciar,
  onGerarRelatorio,
  onExportarExcel,
  exportando,
  onPausar,
}: Props) {
  /* Mostra todos os meses com recebimento ou carregamento — meses sem
     carregado no Drive (jan–abr) agora têm valores da planilha do usuário. */
  const listaMes = (mensal ?? []).filter((m) => m.recebido > 0 || m.carregado > 0);
  const totRecebido = listaMes.reduce((s, m) => s + m.recebido, 0);

  /* Filtro por data das pendências (DT FINAL entre "de" e "até") */
  const [pendDe, setPendDe] = useState("");
  const [pendAte, setPendAte] = useState("");
  const pend = useMemo(() => {
    if (!pendentes || (!pendDe && !pendAte)) return pendentes;
    const dentro = (d?: string) => !!d && (!pendDe || d >= pendDe) && (!pendAte || d <= pendAte);
    const regs = pendentes.registros as PendenteProducao[] | undefined;
    if (regs?.length) return calcularPendentesResumo(regs.filter((r) => dentro(r.dtFinal)));
    const meses = pendentes.meses.filter((m) => dentro(m.dtFinal));
    if (!meses.length) return null;
    const totalTon = meses.reduce((s, m) => s + m.ton, 0);
    return {
      ...pendentes,
      itens: meses.reduce((s, m) => s + m.itens, 0),
      totalTon,
      mediaTon: totalTon / meses.length,
      meses: meses.map((m) => ({ ...m, pct: totalTon > 0 ? (m.ton / totalTon) * 100 : 0 })),
    };
  }, [pendentes, pendDe, pendAte]);

  return (
    <>
      {/* Cena 1 — Estoque × Previsto (donut interativo com toggle) */}
      {cena === 0 && resumo && (
        <CenaEstoquePrevisto anim={anim} resumo={resumo} valorFaturado={valorFaturado} unidades={unidades} foraDeLinha={foraDeLinha} cena={cena} onPausar={onPausar} />
      )}

      {/* Cena 1 fallback — sem dados de resumo */}
      {cena === 0 && !resumo && (
        <div className="flex flex-col items-center py-6 text-center">
          <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
            Estoque × Previsto
          </p>
          <p className="video-sobe font-serif text-3xl text-white/70">
            Sem dados de estoque.
          </p>
        </div>
      )}

      {/* Cena 2 — ocupação (donut interativo) */}
      {cena === 1 && (
        <CenaOcupacao anim={anim} ocupacao={ocupacao} cena={cena} onPausar={onPausar} />
      )}

      {/* Cena 3 — recebimento por turno (donut interativo) */}
      {cena === 2 && (
        <CenaRecebimentoTurno anim={anim} turnos={turnos} cena={cena} onPausar={onPausar} />
      )}

      {/* Cena 4 — Paletes em Estoque (donut interativo com toggle por tamanho) */}
      {cena === 3 && paletas && paletas.totalPaletes > 0 && (
        <CenaPaletes anim={anim} paletas={paletas} cena={cena} onPausar={onPausar} />
      )}

      {/* Cena 5 — Produção da Semana (donut interativo com toggle Entregue/Pendente) */}
      {cena === 4 && producaoSemanal && producaoSemanal.length > 0 && (
        <CenaProducaoSemana anim={anim} dias={producaoSemanal} cena={cena} onPausar={onPausar} />
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
            <InfoTooltip onOpen={onPausar} texto="Ordens de produção pendentes no sistema. Tonelagem total e média mensal das ordens em aberto. Saúde da produção = toneladas recebidas no estoque ÷ (recebidas + pendentes). Toneladas recebidas vêm do recebimento do CD. Crítico = ordens com data final 3 meses ou mais antes do mês atual. No prazo = ordens com até 2 meses de atraso, mês atual ou futuro. Fonte: sistema Focco. Dados de 2026." />
          </div>
          <div
            className="video-sobe mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/70"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="font-bold tracking-widest uppercase text-white/55">Filtrar data final</span>
            <label className="flex items-center gap-1">de
              <input type="date" value={pendDe} onChange={(e) => { setPendDe(e.target.value); onPausar?.(); }}
                className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-white [color-scheme:dark]" />
            </label>
            <label className="flex items-center gap-1">até
              <input type="date" value={pendAte} onChange={(e) => { setPendAte(e.target.value); onPausar?.(); }}
                className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-white [color-scheme:dark]" />
            </label>
            {(pendDe || pendAte) && (
              <button type="button" onClick={() => { setPendDe(""); setPendAte(""); }}
                className="rounded border border-white/20 px-2 py-0.5 text-white/80 hover:bg-white/10">Limpar</button>
            )}
            {(pendDe || pendAte) && pend && (
              <span className="font-bold text-brand-amber">
                · Peso total: {fmtBrMax(pend.totalTon, 1)} t
              </span>
            )}
          </div>
          {pend ? (
            <>
              <p className="video-sobe mt-3 font-serif text-3xl text-white sm:text-5xl">
                {fmtBrMax(pend.totalTon, 1)} t{" "}
                <span className="text-base text-white/60 sm:text-lg">
                  · {fmtInt(pend.itens)} ordens
                </span>
              </p>
              {(pendDe || pendAte) && (
                <p className="video-sobe mt-1 text-sm text-white/50">
                  {pendDe && pendAte
                    ? `${pendDe.slice(8, 10)}/${pendDe.slice(5, 7)} – ${pendAte.slice(8, 10)}/${pendAte.slice(5, 7)}`
                    : pendDe
                      ? `A partir de ${pendDe.slice(8, 10)}/${pendDe.slice(5, 7)}`
                      : `Até ${pendAte.slice(8, 10)}/${pendAte.slice(5, 7)}`}
                </p>
              )}
              <p className="video-sobe mt-1 text-sm text-white/50">
                Média mensal: <span className="font-bold text-brand-amber">{fmtBrMax(pend.mediaTon, 1)} t</span>
              </p>

              {/* Saúde da produção — toneladas pendentes × recebidas no estoque */}
              {(() => {
                const pendente = pend.totalTon;
                const produzido = totRecebido;
                const total = pendente + produzido;
                const saudePct = total > 0 ? (produzido / total) * 100 : 0;
                const Rs = 70;
                const CIRCs = 2 * Math.PI * Rs;
                return (
                  <div
                    className="video-sobe mt-4 flex items-center gap-5 rounded-xl border border-white/10 bg-white/5 p-3.5"
                    style={{ animationDelay: "0.4s" }}
                  >
                    <div className="relative flex shrink-0 items-center justify-center">
                      <svg viewBox="0 0 200 200" className="size-20 sm:size-24">
                        <circle cx="100" cy="100" r={Rs} fill="none" strokeWidth="18" className="stroke-white/15" />
                        <circle
                          cx="100" cy="100" r={Rs} fill="none" strokeWidth="18" strokeLinecap="round"
                          stroke="white"
                          transform="rotate(-90 100 100)"
                          style={{
                            strokeDasharray: CIRCs,
                            strokeDashoffset: anim ? CIRCs * (1 - saudePct / 100) : CIRCs,
                            transition: "stroke-dashoffset 1.3s cubic-bezier(0.22,1,0.36,1)",
                            filter: "drop-shadow(0 0 8px rgba(255,255,255,0.35))",
                          }}
                        />
                      </svg>
                      <div className="absolute text-center">
                        <p className="font-serif text-lg text-white sm:text-xl">{fmtBrMax(saudePct, 1)}%</p>
                        <p className="text-[7px] font-bold tracking-widest text-white/55 uppercase">saúde</p>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-[10px] font-bold tracking-[0.3em] text-white/60 uppercase">Saúde da Produção</p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[11px] text-white/70">
                          <span className="size-2.5 rounded-sm bg-brand-amber" />
                          Toneladas pendentes
                        </span>
                        <span className="font-mono text-sm font-bold text-brand-amber">{fmtBrMax(pendente, 1)} t</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[11px] text-white/70">
                          <span className="size-2.5 rounded-sm bg-white" />
                          Toneladas recebidas no estoque
                        </span>
                        <span className="font-mono text-sm font-bold text-white">{fmtBrMax(produzido, 1)} t</span>
                      </div>
                      <p className="text-[9px] leading-tight text-white/40">
                        Crítico = 3 meses ou mais de atraso · No prazo = até 2 meses, mês atual ou futuro
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Detalhe por mês — tonelagem, %, data final, lotes e ordens */}
              {pend.meses?.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-bold tracking-[0.3em] text-white/50 uppercase">
                    Por mês
                  </p>
                  <div className="space-y-2">
                    {pend.meses.map((m, i) => {
                      const maxMes = Math.max(...pend.meses.map((x) => x.ton), 1);
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
              {pendDe || pendAte ? "Nenhuma pendência nesse período." : "Nenhuma pendência de produção."}
            </p>
          )}
        </div>
      )}

      {/* Cena 8 — itens reservados: donut interativo com toggle Peso/Qtd/Valor */}
      {cena === 7 && reservados && (
        <CenaReservados anim={anim} reservados={reservados} semReserva={semReserva} valorFaturado={valorFaturado} cena={cena} onPausar={onPausar} />
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
        <CenaForaDeLinha anim={anim} foraDeLinha={foraDeLinha} cena={cena} onPausar={onPausar} />
      )}

      {/* Cena 10 — Tonelagem do estoque mês a mês com variação % */}
      {cena === 9 && (
        <CenaTonelagemEstoque anim={anim} tonAtual={resumo?.ton} />
      )}

      {/* Cena 11 — Controle de saldo Full × Focco */}
      {cena === 10 && (
        <CenaSaldoComparativo anim={anim} cena={cena} onPausar={onPausar} saldoComparativo={saldoComparativo} onExportarExcel={onExportarExcel} exportando={exportando} />
      )}

      {/* Cena 12 — Acertos de Estoque (WF0097) */}
      {cena === 11 && (
        <CenaAcertosEstoque anim={anim} cena={cena} onPausar={onPausar} acertos={acertosEstoque} onExportarExcel={onExportarExcel} exportando={exportando} />
      )}

      {/* Cena 13 — encerramento */}
      {cena === 12 && (
        <div className="flex flex-col items-center py-4 text-center">
          <p className="video-sobe font-serif text-4xl tracking-tight text-white sm:text-5xl" style={{ animationDelay: "0.1s" }}>
            Fim do <span className="italic text-brand-amber">resumo</span>.
          </p>
          <p className="video-sobe mt-2 text-sm text-white/60" style={{ animationDelay: "0.35s" }}>
            A apresentação reinicia automaticamente.
          </p>
          <div className="video-sobe mt-6 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "0.45s" }}>
            <button
              type="button"
              onClick={onReiniciar}
              className="cursor-pointer rounded-full bg-white px-8 py-3 text-xs font-bold tracking-widest text-brand-dark uppercase shadow-xl transition-transform hover:scale-105"
            >
              ↻ Reiniciar agora
            </button>
          </div>
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
  paletas,
  producaoSemanal,
  onPausar,
}: {
  kpis: VideoKpi[];
  foraDeLinha?: VideoForaDeLinha | undefined;
  paletas?: VideoPaletas | undefined;
  producaoSemanal?: ProducaoSemanalDia[] | undefined;
  onPausar?: (() => void) | undefined;
}) {
  const temProducao = !!(producaoSemanal && producaoSemanal.length > 0);
  const total = kpis.length + 1 + (paletas && paletas.totalPaletes > 0 ? 1 : 0) + (temProducao ? 1 : 0); // +1 Fora de linha, +1 Paletes, +1 Produção
  const [foco, setFoco] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado) return;
    const t = setTimeout(() => setFoco((f) => (f + 1) % total), 4800);
    return () => clearTimeout(t);
  }, [foco, pausado, total]);

  /* Navegação por teclado: seta direita = próximo, seta esquerda = anterior,
     espaço pausa/retoma o carrossel de cards */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setPausado((p) => !p);
      } else if (e.key === "ArrowRight") setFoco((f) => (f + 1) % total);
      else if (e.key === "ArrowLeft") setFoco((f) => (f - 1 + total) % total);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  const ehForaDeLinha = foco === kpis.length;
  const ehPaletas = foco === kpis.length + 1;
  const ehProducao = temProducao && foco === kpis.length + 2;
  const kpi = foco < kpis.length ? kpis[foco] : null;
  const togglePausar = () => {
    const next = !pausado;
    setPausado(next);
    if (next) onPausar?.();
  };
  const avancar = () => setFoco((f) => (f + 1) % total);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center gap-2">
        <p className="video-sobe text-[11px] font-medium tracking-[0.4em] text-white/70 uppercase">
          Resumo do CD · {new Date().getFullYear()}
        </p>
        <InfoTooltip onOpen={onPausar} texto="Indicadores principais do CD Lopas. Valor em estoque = custo médio × saldo de cada item. Peças e massa somadas de todos os itens ativos. Ocupação = posições ocupadas ÷ total de endereços (5.970). Fonte: planilha de saldo de itens do Google Drive. Atualizado em 28/09/2026." />
      </div>

      {/* Apenas o card aberto aparece, centralizado e em destaque */}
      <div className="relative mt-10 flex w-full max-w-[23rem] items-center justify-center">
        {/* halo suave atrás do card para destacar sem peso */}
        <div className="card-foco-halo pointer-events-none absolute inset-0" aria-hidden />
        {/* Seta esquerda */}
        <button
          type="button"
          onClick={() => setFoco((f) => (f - 1 + total) % total)}
          className="absolute -left-10 z-10 flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 backdrop-blur-sm transition-colors hover:bg-white/15 hover:text-white sm:-left-12"
          aria-label="Card anterior"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div key={foco} className="card-foco-entra relative w-full">
          {kpi ? (
            <CardFocoKpi kpi={kpi} onTogglePausar={togglePausar} />
          ) : ehPaletas ? (
            <CardFocoPaletas paletas={paletas} onTogglePausar={togglePausar} />
          ) : ehProducao ? (
            <CardFocoProducao dias={producaoSemanal} onTogglePausar={togglePausar} />
          ) : (
            <CardFocoForaDeLinha foraDeLinha={foraDeLinha} onTogglePausar={togglePausar} />
          )}
        </div>
        {/* Seta direita */}
        <button
          type="button"
          onClick={avancar}
          className="absolute -right-10 z-10 flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 backdrop-blur-sm transition-colors hover:bg-white/15 hover:text-white sm:-right-12"
          aria-label="Próximo card"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
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
        Clique no card para pausar · use as setas ← →
      </p>
    </div>
  );
}

/* Vidro refinado compartilhado pelos cards de destaque */
const cardFocoBase =
  "group block w-full cursor-pointer rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5 text-center backdrop-blur-xl shadow-[0_20px_50px_-36px_rgba(0,0,0,0.7)] transition-all duration-500 hover:border-white/20 hover:bg-white/[0.06] sm:p-6";

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
              <dt className="flex items-center gap-2 text-white/45">
                {k.split(" · ")[0]}
                {k.includes(" · ") && (
                  <span className="whitespace-nowrap rounded bg-white/10 px-1.5 py-0.5 text-center font-mono text-[10px] font-semibold text-white/75">
                    {k.split(" · ")[1]}
                  </span>
                )}
              </dt>
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
  const pctPeso = total.pesoTon > 0 ? pos.pesoTon / total.pesoTon : 0;
  return (
    <button
      type="button"
      onClick={onTogglePausar}
      className={cn(cardFocoBase, "border-brand-amber/20 bg-brand-amber/[0.05] hover:border-brand-amber/35 hover:bg-brand-amber/[0.08]")}
    >
      <p className="font-serif text-[1.75rem] leading-none tracking-tight text-white sm:text-[2.125rem]">
        {fmtPct(pctPeso)}
      </p>
      <p className="mt-1.5 text-[8px] font-medium tracking-[0.4em] text-brand-amber/80 uppercase">
        Fora de linha
      </p>
      <p className="mt-3 text-left text-[11px] leading-relaxed text-white/60 sm:text-[12px]">
        {fmtInt(pos.itens)} itens descontinuados ainda ocupam o CD — {fmtPeso(pos.pesoTon * 1000)} de
        massa ({fmtPct(pctPeso)} do peso total) e {fmtMoeda(pos.valorEstoque)} em custo.
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

/* Card de "paletes em estoque" em destaque — mostra o total de paletes
   e o breakdown por tamanho (P, M, G, GG). */
const CORES_TAMANHO: Record<string, string> = {
  P: "#22c55e",
  M: "#3b82f6",
  G: "#f97316",
  GG: "#a855f7",
};

function CardFocoPaletas({
  paletas,
  onTogglePausar,
}: {
  paletas?: VideoPaletas | undefined;
  onTogglePausar: () => void;
}) {
  const total = paletas?.totalPaletes ?? 0;
  const itens = paletas?.totalItens ?? 0;
  return (
    <button
      type="button"
      onClick={onTogglePausar}
      className={cn(cardFocoBase, "border-primary/20 bg-primary/[0.05] hover:border-primary/35 hover:bg-primary/[0.08]")}
    >
      <p className="font-serif text-[1.75rem] leading-none tracking-tight text-white sm:text-[2.125rem]">
        {fmtInt(total)}
      </p>
      <p className="mt-1.5 text-[8px] font-medium tracking-[0.4em] text-primary/80 uppercase">
        Paletes em Estoque
      </p>
      <p className="mt-3 text-left text-[11px] leading-relaxed text-white/60 sm:text-[12px]">
        {fmtInt(itens)} itens mapeados distribuídos em {fmtInt(total)} paletes,
        organizados por tamanho de pallet.
      </p>
      {paletas?.porTamanho?.length ? (
        <dl className="mt-3 divide-y divide-white/[0.07] border-t border-white/[0.07] text-left">
          {paletas.porTamanho.map((t) => {
            const cor = CORES_TAMANHO[t.tamanho] ?? "#6b7280";
            const pct = total > 0 ? (t.paletes / total) * 100 : 0;
            return (
              <div key={t.tamanho} className="flex items-baseline justify-between py-1 text-[10px] sm:text-[11px]">
                <dt className="flex items-center gap-1.5 text-white/45">
                  <span className="size-2 rounded-full" style={{ background: cor }} />
                  Tamanho {t.tamanho}
                </dt>
                <dd className="font-medium text-white/90">
                  {fmtInt(t.paletes)} <span className="text-white/40">({fmtBrMax(pct, 0)}%)</span>
                </dd>
              </div>
            );
          })}
        </dl>
      ) : null}
    </button>
  );
}

/* Card de "produção da semana" em destaque — mostra tonelagem prevista,
   pendente, % entregue e breakdown por dia. */
function CardFocoProducao({
  dias,
  onTogglePausar,
}: {
  dias?: ProducaoSemanalDia[] | undefined;
  onTogglePausar: () => void;
}) {
  const semana = semanaAtual(dias);
  const totalPrevisto = semana.reduce((s, d) => s + d.previsto, 0);
  const totalEntregue = semana.reduce((s, d) => s + d.entregue, 0);
  const totalPendente = semana.reduce((s, d) => s + d.pendente, 0);
  const totalTonPrev = semana.reduce((s, d) => s + d.tonPrevisto, 0);
  const totalTonPend = semana.reduce((s, d) => s + d.tonPendente, 0);
  const totalOrdens = semana.reduce((s, d) => s + d.ordens, 0);
  const pctEntregue = totalPrevisto > 0 ? (totalEntregue / totalPrevisto) * 100 : 0;

  return (
    <button
      type="button"
      onClick={onTogglePausar}
      className={cn(cardFocoBase, "border-brand-amber/20 bg-brand-amber/[0.05] hover:border-brand-amber/35 hover:bg-brand-amber/[0.08]")}
    >
      <p className="font-serif text-[1.75rem] leading-none tracking-tight text-white sm:text-[2.125rem]">
        {fmtBrMax(totalTonPrev, 1)} t
      </p>
      <p className="mt-1.5 text-[8px] font-medium tracking-[0.4em] text-brand-amber/80 uppercase">
        Produção da Semana
      </p>
      <p className="mt-3 text-left text-[11px] leading-relaxed text-white/60 sm:text-[12px]">
        {fmtInt(totalOrdens)} ordens de produção programadas para os próximos{" "}
        {semana.length} dias — {fmtBrMax(totalTonPend, 1)} t a descer.
      </p>
      <dl className="mt-2.5 divide-y divide-white/[0.07] border-t border-white/[0.07] text-left">
        <div className="flex items-baseline justify-between py-1 text-[10px] sm:text-[11px]">
          <dt className="text-white/45">Programado</dt>
          <dd className="font-medium text-white/90">{fmtInt(totalPrevisto)} un · {fmtBrMax(totalTonPrev, 1)} t</dd>
        </div>
        <div className="flex items-baseline justify-between py-1 text-[10px] sm:text-[11px]">
          <dt className="text-white/45">Recebido</dt>
          <dd className="font-medium text-green-400">{fmtInt(totalEntregue)} un ({fmtBrMax(pctEntregue, 0)}%)</dd>
        </div>
        <div className="flex items-baseline justify-between py-1 text-[10px] sm:text-[11px]">
          <dt className="text-white/45">Previsto</dt>
          <dd className="font-medium text-brand-amber">{fmtInt(totalPendente)} un · {fmtBrMax(totalTonPend, 1)} t</dd>
        </div>
        <div className="flex items-baseline justify-between py-1 text-[10px] sm:text-[11px]">
          <dt className="text-white/45">Ordens</dt>
          <dd className="font-medium text-white/90">{fmtInt(totalOrdens)}</dd>
        </div>
      </dl>
    </button>
  );
}
