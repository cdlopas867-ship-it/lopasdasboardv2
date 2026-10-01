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

/* Resumo fixo de pendências de produção — calculado a partir das 115 ordens
 * pendentes em initialSyncData, incluindo número de lotes por mês. */
export const PENDENTES_RESUMO_FIXO: VideoPendentes = {
  itens: 115,
  totalTon: 67.0,
  mediaTon: 16.7,
  fatias: [
    { rotulo: "Crítico", ton: 9.3, cor: "#c0473a" },
    { rotulo: "No prazo", ton: 57.7, cor: "#6B8E23" },
  ],
  meses: [
    { mes: "Jun/26", ton: 1.0, pct: 2, itens: 6, dtFinal: "2026-06-30", lotes: 3 },
    { mes: "Jul/26", ton: 8.3, pct: 12, itens: 21, dtFinal: "2026-07-28", lotes: 8 },
    { mes: "Ago/26", ton: 18.9, pct: 28, itens: 39, dtFinal: "2026-08-28", lotes: 11 },
    { mes: "Set/26", ton: 38.8, pct: 58, itens: 49, dtFinal: "2026-09-11", lotes: 13 },
  ],
};
