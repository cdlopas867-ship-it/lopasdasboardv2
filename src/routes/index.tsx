import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useDadosSync } from "@/hooks/use-dados-sync";
import { initialSyncData } from "@/lib/initial-sync-data";
import VideoResumoDashboard, { type VideoAbc, type VideoAvarias, type VideoDia, type VideoKpi, type VideoMes, type VideoOcupacao, type VideoPendentes, type VideoReservados, type VideoSaidasCD, type VideoTurno, type VideoUnidade } from "@/components/VideoResumoDashboard";
import type { VideoForaDeLinha } from "@/components/CenasApresentacao";
import ResumoIntro from "@/components/ResumoIntro";
import LoadingApresentacao from "@/components/LoadingApresentacao";
import { calcularAvariasResumo } from "@/lib/avarias-resumo";
import { aplicarReferenciaMotivos } from "@/lib/avarias-referencia";
import { normalizarDiasExibicao } from "@/lib/recebimento";
import { calcularPendentesResumo } from "@/lib/pendentes-resumo";
import type { PendenteProducao } from "@/lib/pendentes";
import { MENSAL_FIXO_JAN_ABR, PENDENTES_RESUMO_FIXO } from "@/data/valores-fixos";
import { fmtBrMax, fmtTonDec } from "@/lib/format";

export const Route = createFileRoute("/")({ head: () => ({ meta: [{ title: "Painel de Estoque · Lopas 2026" }, { name: "description", content: "Indicadores de estoque, ocupação e recebimento do Centro de Distribuição Lopas." }, { property: "og:title", content: "Painel de Estoque · Lopas 2026" }, { property: "og:description", content: "Indicadores do Centro de Distribuição Lopas em uma apresentação interativa." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: DashboardHome });
type Painel = typeof initialSyncData & Record<string, unknown>;
function DashboardHome() {
  const { autenticado, pronto, logout } = useAuth(); const navigate = useNavigate();
  const { dados, loaded } = useDadosSync<Painel>(initialSyncData as Painel);
  const [valorFaturado, setValorFaturado] = useState<number>();
  const [fase, setFase] = useState<"resumo" | "video">("resumo");
  useEffect(() => { if (pronto && !autenticado) navigate({ to: "/login", replace: true }); }, [pronto, autenticado, navigate]);
  useEffect(() => { if (autenticado) fetch("/api/valor-faturado").then(r => r.json()).then(d => setValorFaturado(d.valor)).catch(() => {}); }, [autenticado]);
  const presentation = useMemo(() => {
    const p = dados as unknown as Record<string, any>; const resumo = p["resumo"] ?? {};
    const kpis = (p["kpis"] ?? []) as VideoKpi[];
    const unidades = ((p["unidades"] ?? []) as any[]).map(u => ({ nome: u.nome, share: Number(u.share ?? 0), valor: u.stats?.find((x: string[]) => x[0] === "Valor")?.[1] ?? "—" })) as VideoUnidade[];
    const detalhe = (p["ocupacaoDetalhes"] ?? []) as VideoOcupacao["detalhes"];
    const ocup = p["ocupacao"] as { pct?: number; ocupados?: number; livres?: number; total?: number } | undefined;
    const pos = detalhe?.find(x => x.atributo === "POSIÇÕES"); const ocupacaoKpi = kpis.find(k => k.rotulo.includes("Ocupação"));
    const pct = ocup?.pct ?? Number(String(ocupacaoKpi?.valor ?? "0").replace("%", "").replace(",", ".")) / 100;
    const ocupados = ocup?.ocupados ?? (pos ? Math.round(pos.total * pct) : 0);
    const livres = ocup?.livres ?? (pos ? Math.round(pos.total * (1-pct)) : 0);
    const ocupacao: VideoOcupacao = { pct, ocupados, livres, ...(detalhe ? { detalhes: detalhe } : {}) };
    const dias = normalizarDiasExibicao((p["dias"] ?? []) as VideoDia[]); const semana = dias.length ? { rotulo: "Recebimento", total: `${dias.reduce((s,d)=>s+d.ton,0).toLocaleString("pt-BR",{maximumFractionDigits:1})} t`, dias } : null;
    const turnos = ((p["turnos"] ?? []) as any[]).map(t => ({ nome: t.nome, faixa: t.faixa, ton: Number(t.ton ?? 0), pct: Number(t.pct) })) as VideoTurno[];
    const avarias = aplicarReferenciaMotivos(
      (p["avarias"]?.length ? calcularAvariasResumo(p["avarias"]) : null)
        ?? p["avariasResumo"] as VideoAvarias | undefined ?? null,
    );
    const pendentesCalc = p["pendentesResumo"] as VideoPendentes | undefined ?? calcularPendentesResumo(p["pendentes"] as PendenteProducao[] | undefined);
    const pendentes = pendentesCalc ?? PENDENTES_RESUMO_FIXO;
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
    const saudeKpi: VideoKpi = {
      id: "saude",
      rotulo: "Saúde do Estoque",
      valor: `${fmtBrMax(saudePct, 1)}%`,
      detalhe: `De ${fmtTonDec(totRec)} recebidas, ${fmtTonDec(totCar)} foram carregadas — ${fmtBrMax(saudePct, 1)}% de eficiência no fluxo de estoque. Janeiro a setembro de 2026.`,
      extra: [["Recebido", fmtTonDec(totRec)], ["Carregado", fmtTonDec(totCar)], ["Saldo", fmtTonDec(Math.abs(totRec - totCar))]],
    };
    const kpisComSaude = [...kpis, saudeKpi];
    return { kpis: kpisComSaude, unidades, ocupacao, semana, turnos, mensal, abc: p["abc"] as VideoAbc | undefined, avarias, pendentes, reservados: p["reservadosResumo"] as VideoReservados | undefined, saidasCD: p["saidasCD"] as VideoSaidasCD | undefined, foraDeLinha: p["foraDeLinha"] as VideoForaDeLinha | undefined, sincronizacao: p["sincronizacao"] as { em?: string; planilhas?: { nome: string; modificado?: string }[] } | undefined, resumo };
  }, [dados]);
  if (!pronto || !autenticado) return null;
  if (!loaded) return <LoadingApresentacao />;
  if (fase === "resumo") return <ResumoIntro kpis={presentation.kpis} avarias={presentation.avarias} semana={presentation.semana} pendentes={presentation.pendentes} reservados={presentation.reservados} valorFaturado={valorFaturado} foraDeLinha={presentation.foraDeLinha} onConcluir={() => setFase("video")} />;
  return <VideoResumoDashboard {...presentation} {...(valorFaturado !== undefined ? { valorFaturado } : {})} onLogout={async () => { await logout(); navigate({ to: "/login", replace: true }); }} />;
}
