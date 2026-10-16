/* Acertos de Estoque — relatório "WF0097 - Acerto de estoque" (aba Resultado)
 * do WMS do CD (FullSoft, estoque 112). Período: 02/01/2026 a 16/10/2026.
 *
 * Cada linha é um acerto de inventário: Data, Almoxarifado, Item, Descrição,
 * Colaborador, Endereço, Qtd. Antes/Acerto/Depois, Tipo Movimentação, Lote,
 * Validade e Observação.
 *
 * Endereços ASTEC (ASTEC-1-1, ASTEC-2-1, ASTEC-4-1) foram desconsiderados
 * (1.170 linhas removidas). O tipo "SAIDA DE AVARIAS ASTECA - INTEGRA FOCCO"
 * também foi excluído (era quase todo em endereços ASTEC).
 *
 * Os valores abaixo são o FALLBACK estático (data-base 16/10/2026), extraídos
 * da planilha "Acertodeestoque-WF0097-2026-10-16.xlsx" com um script Node/xlsx
 * dentro do container. Para atualizar, reextrair a planilha da pasta do Drive.
 */

export type TipoAcerto = {
  tipo: string;
  count: number;
  pct: number;
};

export type ColaboradorAcerto = {
  nome: string;
  total: number;
  pct: number;
  meses: Record<string, number>;
};

export type AcertoMensal = {
  mes: string;
  count: number;
  pct: number;
};

export type AcertosEstoque = {
  periodoInicio: string;
  periodoFim: string;
  totalAcertos: number;
  tipos: TipoAcerto[];
  colaboradores: ColaboradorAcerto[];
  totalColaboradores: number;
  totalEnderecosComAcerto: number;
  totalEnderecosCD: number;
  enderecosSemAcerto: number;
  pctComAcerto: number;
  pctSemAcerto: number;
  porMes: AcertoMensal[];
};

export const ACERTOS_ESTOQUE: AcertosEstoque = {
  periodoInicio: "02/01/2026",
  periodoFim: "16/10/2026",
  totalAcertos: 19885,
  tipos: [
    { tipo: "ENTRADA", count: 10522, pct: 52.9 },
    { tipo: "SAIDA", count: 6629, pct: 33.3 },
    { tipo: "SAIDA DE AVARIAS - INTEGRA FOCCO", count: 2734, pct: 13.8 },
  ],
  colaboradores: [
    { nome: "DANIEL BRAGA (Desktop)", total: 2702, pct: 13.6, meses: { "01": 45, "02": 31, "03": 353, "04": 372, "05": 523, "06": 177, "07": 428, "08": 250, "09": 298, "10": 225 } },
    { nome: "DANIEL FURTADO", total: 2107, pct: 10.6, meses: { "01": 569, "02": 363, "03": 594, "04": 303, "05": 148, "06": 32, "07": 32, "08": 37, "09": 28, "10": 1 } },
    { nome: "CLEITON BRUM", total: 1547, pct: 7.8, meses: { "01": 24, "02": 140, "03": 378, "04": 473, "05": 263, "06": 127, "07": 51, "08": 49, "09": 22, "10": 20 } },
    { nome: "ROMILDO CAETANO", total: 1428, pct: 7.2, meses: { "01": 89, "02": 275, "03": 164, "04": 434, "05": 140, "06": 149, "07": 33, "08": 82, "09": 24, "10": 38 } },
    { nome: "FELIPE RIBEIRO", total: 1379, pct: 6.9, meses: { "01": 336, "02": 305, "03": 274, "04": 132, "05": 84, "06": 56, "07": 54, "08": 81, "09": 55, "10": 2 } },
    { nome: "ADALBERTO", total: 1239, pct: 6.2, meses: { "05": 407, "06": 284, "07": 180, "08": 15, "09": 283, "10": 70 } },
    { nome: "MATHEUS CHAVES", total: 1107, pct: 5.6, meses: { "05": 240, "06": 220, "07": 247, "08": 218, "09": 157, "10": 25 } },
    { nome: "VINICIUS CABRAL", total: 1098, pct: 5.5, meses: { "04": 481, "05": 362, "06": 232, "08": 2, "09": 20, "10": 1 } },
    { nome: "ADILSON", total: 946, pct: 4.8, meses: { "06": 114, "07": 154, "08": 277, "09": 282, "10": 119 } },
    { nome: "LUCAS FRANCA", total: 670, pct: 3.4, meses: { "01": 21, "03": 117, "05": 65, "06": 61, "07": 111, "08": 177, "09": 75, "10": 43 } },
    { nome: "NATALIA (Desktop)", total: 662, pct: 3.3, meses: { "01": 39, "02": 190, "03": 203, "04": 89, "05": 9, "06": 29, "07": 8, "08": 82, "09": 12, "10": 1 } },
    { nome: "BRENER SOUZA", total: 623, pct: 3.1, meses: { "05": 74, "06": 180, "07": 174, "08": 89, "09": 70, "10": 36 } },
    { nome: "VICTOR HENRIQUE", total: 373, pct: 1.9, meses: { "07": 94, "08": 163, "09": 95, "10": 21 } },
    { nome: "ABRAAO OTAVIO", total: 368, pct: 1.9, meses: { "01": 1, "05": 31, "06": 36, "07": 55, "08": 159, "09": 58, "10": 28 } },
    { nome: "RONIVALDO SOARES", total: 327, pct: 1.6, meses: { "01": 64, "03": 37, "05": 35, "06": 41, "07": 41, "08": 42, "09": 39, "10": 28 } },
    { nome: "GELSON GOMES", total: 326, pct: 1.6, meses: { "01": 141, "03": 10, "05": 82, "06": 31, "07": 25, "08": 22, "09": 13, "10": 2 } },
    { nome: "RENATO BRAGA", total: 274, pct: 1.4, meses: { "01": 209, "02": 37, "03": 28 } },
    { nome: "FABIO CALDI", total: 195, pct: 1.0, meses: { "01": 20, "02": 143, "03": 32 } },
    { nome: "DIEGO LEONARDO", total: 163, pct: 0.8, meses: { "05": 23, "06": 18, "07": 26, "08": 33, "09": 46, "10": 17 } },
    { nome: "MARCONES RODRIGUES", total: 151, pct: 0.8, meses: { "05": 32, "06": 24, "07": 40, "08": 36, "09": 12, "10": 7 } },
  ],
  totalColaboradores: 66,
  totalEnderecosComAcerto: 2704,
  totalEnderecosCD: 5970,
  enderecosSemAcerto: 3266,
  pctComAcerto: 45.3,
  pctSemAcerto: 54.7,
  porMes: [
    { mes: "Jan", count: 2140, pct: 10.8 },
    { mes: "Fev", count: 1524, pct: 7.7 },
    { mes: "Mar", count: 2496, pct: 12.6 },
    { mes: "Abr", count: 2364, pct: 11.9 },
    { mes: "Mai", count: 2605, pct: 13.1 },
    { mes: "Jun", count: 1881, pct: 9.5 },
    { mes: "Jul", count: 1960, pct: 9.9 },
    { mes: "Ago", count: 2250, pct: 11.3 },
    { mes: "Set", count: 1880, pct: 9.5 },
    { mes: "Out", count: 786, pct: 4.0 },
  ],
};
