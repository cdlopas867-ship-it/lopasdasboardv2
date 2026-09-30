/* Valores fixos de recebido × carregado (jan–abr) e pendências de produção.
 * Usados como fallback quando os dados sincronizados (Supabase/Drive) não
 * trazem essas informações — garantem que o dashboard sempre mostre os números
 * corretos para os meses de janeiro a abril e as pendências com lotes. */

import type { VideoMes, VideoPendentes } from "@/components/VideoResumoDashboard";

/* Tonelagem carregada por mês — jan–abr 2026 (planilha do usuário). */
export const MENSAL_FIXO_JAN_ABR: VideoMes[] = [
  { mes: "Jan", recebido: 0, carregado: 3805 },
  { mes: "Fev", recebido: 0, carregado: 3535 },
  { mes: "Mar", recebido: 0, carregado: 6607 },
  { mes: "Abr", recebido: 0, carregado: 6671 },
];

/* Resumo fixo de pendências de produção — calculado a partir das 153 ordens
 * pendentes em initialSyncData (Jan–Set 2026), incluindo número de lotes por mês. */
export const PENDENTES_RESUMO_FIXO: VideoPendentes = {
  itens: 153,
  totalTon: 73.5,
  mediaTon: 8.2,
  fatias: [
    { rotulo: "Crítico", ton: 34.7, cor: "#c0473a" },
    { rotulo: "No prazo", ton: 38.8, cor: "#6B8E23" },
  ],
  meses: [
    { mes: "Jan/26", ton: 0.3, pct: 0, itens: 3, dtInicial: "2026-01-05", dtFinal: "2026-01-22", lotes: 3 },
    { mes: "Fev/26", ton: 0.5, pct: 1, itens: 5, dtInicial: "2026-02-03", dtFinal: "2026-02-28", lotes: 5 },
    { mes: "Mar/26", ton: 1.1, pct: 2, itens: 8, dtInicial: "2026-03-02", dtFinal: "2026-03-31", lotes: 8 },
    { mes: "Abr/26", ton: 1.8, pct: 3, itens: 10, dtInicial: "2026-04-01", dtFinal: "2026-04-30", lotes: 9 },
    { mes: "Mai/26", ton: 2.8, pct: 4, itens: 12, dtInicial: "2026-05-02", dtFinal: "2026-05-31", lotes: 10 },
    { mes: "Jun/26", ton: 1.0, pct: 1, itens: 6, dtInicial: "2026-06-01", dtFinal: "2026-06-30", lotes: 3 },
    { mes: "Jul/26", ton: 8.3, pct: 11, itens: 21, dtInicial: "2026-07-02", dtFinal: "2026-07-28", lotes: 8 },
    { mes: "Ago/26", ton: 18.9, pct: 26, itens: 39, dtInicial: "2026-08-05", dtFinal: "2026-08-28", lotes: 11 },
    { mes: "Set/26", ton: 38.8, pct: 53, itens: 49, dtInicial: "2026-08-31", dtFinal: "2026-09-11", lotes: 13 },
  ],
};
