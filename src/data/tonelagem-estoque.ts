/* Tonelagem mensal do estoque (PESO BRT total) — planilha do usuário.
 * Valores em toneladas por mês, usados no card de evolução mês a mês. */

export type TonelagemMes = {
  mes: string;
  ton: number;
};

export const TONELAGEM_ESTOQUE_MENSAL: TonelagemMes[] = [
  { mes: "Dez/25", ton: 3497 },
  { mes: "Jan/26", ton: 3953 },
  { mes: "Fev/26", ton: 3724 },
  { mes: "Mar/26", ton: 4426 },
  { mes: "Abr/26", ton: 4279 },
  { mes: "Mai/26", ton: 4334 },
  { mes: "Jun/26", ton: 4108 },
  { mes: "Jul/26", ton: 4275 },
  { mes: "Ago/26", ton: 3930 },
];
