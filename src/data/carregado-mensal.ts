/* Toneladas carregadas por mês em 2026 — base para comparar a atividade
   produtiva (separação/recebimento/movimentação) com o volume efetivamente
   carregado, no mesmo período. Jan–Abr vêm da planilha "Toneladas Mensal"
   (mesmos valores de CARREGADO_SEM_DRIVE em src/lib/carregamento.ts); Mai–Set
   vêm da aba "Gerenciamento Carregamento" da planilha pública do Google
   Sheets (1cvc8dD1_jDPZ7bXWnyw7cwQEniS0LI2V), lida em 07/10/2026. Setembro
   está parcial (lançamentos até 11/09). */

export type CarregadoMes = { mes: string; ton: number };

export const CARREGADO_MENSAL: CarregadoMes[] = [
  { mes: "Jan", ton: 3805 },
  { mes: "Fev", ton: 3535 },
  { mes: "Mar", ton: 6607 },
  { mes: "Abr", ton: 6671 },
  { mes: "Mai", ton: 7283.6 },
  { mes: "Jun", ton: 7296.8 },
  { mes: "Jul", ton: 7765.1 },
  { mes: "Ago", ton: 6950.8 },
  { mes: "Set", ton: 2834.7 },
];

/* Soma as toneladas carregadas dos meses dentro de um período
   "dd/mm/aaaa a dd/mm/aaaa". Meses sem lançamento não entram. */
export function carregadoNoPeriodo(periodo: string): { ton: number; meses: string[] } {
  const m = periodo.match(/(\d{2})\/(\d{2})\/(\d{4})\s*a\s*(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return { ton: 0, meses: [] };
  const ini = Number(m[2]);
  const fim = Number(m[5]);
  const dentro = CARREGADO_MENSAL.filter((_, i) => {
    const mes = i + 1;
    return mes >= ini && mes <= fim;
  });
  return {
    ton: Math.round(dentro.reduce((s, x) => s + x.ton, 0) * 10) / 10,
    meses: dentro.map((x) => x.mes),
  };
}
