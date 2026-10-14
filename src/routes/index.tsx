import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useDadosSync } from "@/hooks/use-dados-sync";
import { initialSyncData } from "@/lib/initial-sync-data";
import VideoResumoDashboard, { type VideoAvarias, type VideoDia, type VideoKpi, type VideoMes, type VideoOcupacao, type VideoPaletas, type VideoPendentes, type VideoReservados, type VideoTurno, type VideoUnidade, type RecebimentoSemanalDia } from "@/components/VideoResumoDashboard";
import type { VideoForaDeLinha } from "@/components/CenasApresentacao";
import type { SaldoComparativo } from "@/data/saldo-comparativo";

import LoadingApresentacao from "@/components/LoadingApresentacao";
import { calcularAvariasResumo } from "@/lib/avarias-resumo";
import { aplicarReferenciaMotivos } from "@/lib/avarias-referencia";
import { normalizarDiasExibicao } from "@/lib/recebimento";
import { calcularPendentesResumo } from "@/lib/pendentes-resumo";
import type { PendenteProducao } from "@/lib/pendentes";
import { MENSAL_FIXO_JAN_ABR, PENDENTES_RESUMO_FIXO, PALETAS_FIXO } from "@/data/valores-fixos";
import type { ProducaoSemanalDia } from "@/lib/producao-semanal";
import { fmtBrMax, fmtTonDec } from "@/lib/format";

export const Route = createFileRoute("/")({ head: () => ({ meta: [{ title: "Painel de Estoque · Lopas 2026" }, { name: "description", content: "Indicadores de estoque, ocupação e recebimento do Centro de Distribuição Lopas." }, { property: "og:title", content: "Painel de Estoque · Lopas 2026" }, { property: "og:description", content: "Indicadores do Centro de Distribuição Lopas em uma apresentação interativa." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: DashboardHome });
type Painel = typeof initialSyncData & Record<string, unknown>;
function DashboardHome() {
  const { autenticado, pronto, logout } = useAuth(); const navigate = useNavigate();
  const { dados, loaded } = useDadosSync<Painel>(initialSyncData as Painel);
  const [valorFaturado, setValorFaturado] = useState<number>();
  useEffect(() => { if (pronto && !autenticado) navigate({ to: "/login", replace: true }); }, [pronto, autenticado, navigate]);
  useEffect(() => { if (autenticado) fetch("/api/valor-faturado").then(r => r.json()).then(d => setValorFaturado(d.valor)).catch(() => {}); }, [autenticado]);
  const presentation = useMemo(() => {
    const p = dados as unknown as Record<string, any>; const resumo = p["resumo"] ?? {};
    const kpis = (p["kpis"] ?? []) as VideoKpi[];
    const unidades = ((p["unidades"] ?? []) as any[]).map(u => ({ nome: u.nome, share: Number(u.share ?? 0), valor: u.stats?.find((x: string[]) => x[0] === "Valor")?.[1] ?? "—", ...(u.stats ? { stats: u.stats as [string, string][] } : {}), ...(u.previsto ? { previsto: u.previsto } : {}) })) as VideoUnidade[];
    const detalhe = (p["ocupacaoDetalhes"] ?? []) as VideoOcupacao["detalhes"];
    const ocup = p["ocupacao"] as { pct?: number; ocupados?: number; livres?: number; bloqueados?: number; total?: number } | undefined;
    const pos = detalhe?.find(x => x.atributo === "POSIÇÕES"); const ocupacaoKpi = kpis.find(k => k.rotulo.includes("Ocupação"));
    const pct = ocup?.pct ?? Number(String(ocupacaoKpi?.valor ?? "0").replace("%", "").replace(",", ".")) / 100;
    const ocupados = ocup?.ocupados ?? (pos ? Math.round(pos.total * pct) : 0);
    const bloqueados = ocup?.bloqueados ?? 0;
    const livres = ocup?.livres ?? (pos ? Math.round(pos.total * (1-pct)) - bloqueados : 0);
    const ocupacao: VideoOcupacao = { pct, ocupados, livres, ...(bloqueados ? { bloqueados } : {}), ...(detalhe ? { detalhes: detalhe } : {}) };
    const dias = normalizarDiasExibicao((p["dias"] ?? []) as VideoDia[]); const semana = dias.length ? { rotulo: "Recebimento", total: `${dias.reduce((s,d)=>s+d.ton,0).toLocaleString("pt-BR",{maximumFractionDigits:1})} t`, dias } : null;
    const turnos = ((p["turnos"] ?? []) as any[]).map(t => ({ nome: t.nome, faixa: t.faixa, ton: Number(t.ton ?? 0), pct: Number(t.pct) })) as VideoTurno[];
    const avarias = aplicarReferenciaMotivos(
      (p["avarias"]?.length ? calcularAvariasResumo(p["avarias"], p["itens"]) : null)
        ?? p["avariasResumo"] as VideoAvarias | undefined ?? null,
    );
    const pendentesCalc = p["pendentesResumo"] as VideoPendentes | undefined ?? calcularPendentesResumo(p["pendentes"] as PendenteProducao[] | undefined);
    const pendBase = pendentesCalc ?? PENDENTES_RESUMO_FIXO;
    const pendRegs = p["pendentes"] as PendenteProducao[] | undefined;
    const pendentes = pendBase && pendRegs?.length ? { ...pendBase, registros: pendRegs } : pendBase;
    /* Mescla os meses fixos (jan–abr) com os meses vindos do sync (mai–set).
       O carregado de jan–abr vem da planilha do usuário (valores-fixos);
       o recebido vem do sync (Base Recebimento do Drive) quando disponível. */
    const mensalSync = (p["mensal"] as VideoMes[] | undefined) ?? [];
    const syncPorMes = new Map(mensalSync.map((m) => [m.mes, m]));
    const mesesFixos = new Set(MENSAL_FIXO_JAN_ABR.map((m) => m.mes));
    const mensal = [
      ...MENSAL_FIXO_JAN_ABR.map((m) => {
        const sync = syncPorMes.get(m.mes);
        return sync && sync.recebido > 0 ? { ...m, recebido: sync.recebido } : m;
      }),
      ...mensalSync.filter((m) => !mesesFixos.has(m.mes)),
    ];
    /* KPI de Saúde do Estoque — carregado ÷ recebido × 100 */
    const totRec = mensal.reduce((s, m) => s + m.recebido, 0);
    const totCar = mensal.reduce((s, m) => s + m.carregado, 0);
    const saudePct = totRec > 0 ? (totCar / totRec) * 100 : 0;
    const fmtIso = (iso?: string) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : undefined);
    const recebidoAte = fmtIso((dias as { iso?: string }[]).map((d) => d.iso ?? "").sort().pop());
    const carregadoAte = fmtIso(p["carregadoAte"] as string | undefined);
    const periodoTxt = `Período: 01/01/2026 a ${(p["atualizadoEm"] as string | undefined) ?? new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`;
    const saudeKpi: VideoKpi = {
      id: "saude",
      rotulo: "Saúde do Estoque",
      valor: `${fmtBrMax(saudePct, 1)}%`,
      detalhe: `De ${fmtTonDec(totRec)} recebidas, ${fmtTonDec(totCar)} foram carregadas — ${fmtBrMax(saudePct, 1)}% de eficiência no fluxo de estoque. ${periodoTxt}`,
      extra: [[`Recebido${recebidoAte ? ` · 01/01 – ${recebidoAte.slice(0, 5)}` : ""}`, fmtTonDec(totRec)], [`Carregado${carregadoAte ? ` · 01/01 – ${carregadoAte.slice(0, 5)}` : ""}`, fmtTonDec(totCar)], ["Saldo", fmtTonDec(Math.abs(totRec - totCar))]],
    };
    const kpisComSaude = [...kpis, saudeKpi];
    /* Paletes: usa o resumo lido do Drive quando disponível; PALETAS_FIXO
       permanece apenas como fallback. */
    const paletasSync = p["paletas"] as VideoPaletas | undefined;
    const paletas = paletasSync && paletasSync.totalPaletes > 0 ? paletasSync : PALETAS_FIXO;
    return { kpis: kpisComSaude, unidades, ocupacao, semana, turnos, mensal, avarias, pendentes, reservados: p["reservadosResumo"] as VideoReservados | undefined, semReserva: p["semReservaResumo"] as VideoReservados | undefined, foraDeLinha: p["foraDeLinha"] as VideoForaDeLinha | undefined, saldoComparativo: p["saldoComparativo"] as SaldoComparativo | undefined, paletas: paletas as VideoPaletas, recebimentoSemanal: (p["recebimentoSemanal"] as RecebimentoSemanalDia[] | undefined) ?? dias.map(d => ({ iso: d.iso ?? "", dia: d.dia, data: d.data, ton: d.ton, meta: d.meta, pctMeta: (d.ton / d.meta) * 100, porTamanho: [], totalQtd: 0, totalPaletes: 0 })) as RecebimentoSemanalDia[], producaoSemanal: (p["producaoSemanal"] as ProducaoSemanalDia[] | undefined) ?? undefined, sincronizacao: p["sincronizacao"] as { em?: string; planilhas?: { nome: string; modificado?: string }[] } | undefined, resumo };
  }, [dados]);
  if (!pronto || !autenticado) return null;
  if (!loaded) return <LoadingApresentacao />;
  return <VideoResumoDashboard {...presentation} {...(valorFaturado !== undefined ? { valorFaturado } : {})} onLogout={async () => { await logout(); navigate({ to: "/login", replace: true }); }} />;
}
