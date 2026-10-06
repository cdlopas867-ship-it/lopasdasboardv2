/* Valor faturado por tonelada (R$/t) fixado pelo usuário — base do cálculo
 * do valor previsto do estoque e da reserva:
 *   valor previsto = toneladas × valor faturado por unidade.
 *
 * Substitui o antigo fator de markup (FATOR_PREVISTO ≈ 1,594× sobre o valor
 * de custo) por um valor por unidade, garantindo previsão consistente mesmo
 * quando a planilha não traz a coluna "Valor Previsto" preenchida.
 *
 * Valores confirmados pelo usuário (out/2026):
 *   Guarda-Roupas 6.799,08 · Salas 9.013,20 · Complementos 6.132,45
 *   Média do CD 7.314,91 (fallback quando a unidade não é identificada). */

/* Valor faturado (R$/t) por id de unidade. */
export const VALOR_FATURADO_POR_UNIDADE: Record<string, number> = {
  "guarda-roupas": 6799.08,
  salas: 9013.2,
  complementos: 6132.45,
};

/* Média ponderada do CD — fallback quando a unidade não é identificada. */
export const VALOR_FATURADO_MEDIO = 7314.91;

/* Nomes usados nas planilhas (aba Resumo / CLASSIFICAÇÃO N1) → id de unidade. */
export const MAPA_NOME_UNIDADE: Record<string, string> = {
  "UNIDADE GUARDA ROUPAS": "guarda-roupas",
  "UNIDADE GUARDA-ROUPAS": "guarda-roupas",
  "UNIDADE DE COMPLEMENTOS": "complementos",
  "UNIDADE COMPLEMENTOS": "complementos",
  "UNIDADE DE SALAS": "salas",
  "UNIDADE SALAS": "salas",
};

/* Devolve o id de unidade a partir do nome usado na planilha. */
export function idUnidade(nome?: string): string | undefined {
  if (!nome) return undefined;
  return MAPA_NOME_UNIDADE[nome.toUpperCase().trim()];
}

/* Valor faturado de uma unidade (média se o id for desconhecido). */
export function faturadoPorUnidade(id?: string): number {
  return (id ? VALOR_FATURADO_POR_UNIDADE[id] : undefined) ?? VALOR_FATURADO_MEDIO;
}

/* Valor previsto = toneladas × valor faturado da unidade (média se indefinida). */
export function preverValor(ton: number, id?: string): number {
  return ton * faturadoPorUnidade(id);
}
