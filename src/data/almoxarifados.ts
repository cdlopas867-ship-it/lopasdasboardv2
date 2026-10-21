/* Controle de almoxarifados — relatório FOCCOERP REST0330 "Relatório de Saldo
 * dos Itens" (Sintético, Layout Por Almoxarifado, Pasta Estoque, itens ativos,
 * saldos positivos e negativos), emitido em 21/10/2026 10:52:41.
 * `saldo` em unidades; `valor` em R$. Dado estático — para atualizar,
 * reextrair o REST0330 mais recente. */

export type Almoxarifado = {
  cod: string;
  nome: string;
  saldo: number;
  valor: number;
};

export const ALMOXARIFADOS_DATA_BASE = "21/10/2026";

export const ALMOXARIFADOS: Almoxarifado[] = [
  { cod: "11", nome: "Expedição WMS", saldo: 211420.71, valor: 18055334.109 },
  { cod: "999", nome: "Acerto de Inventário", saldo: 3952, valor: 191553.626 },
  { cod: "1012", nome: "Interm Saída WMS", saldo: 1375, valor: 147068.037 },
  { cod: "105", nome: "Em Trânsito", saldo: 1288, valor: 167505.212 },
  { cod: "1013", nome: "Almox Madeira", saldo: 1171, valor: 165802.768 },
  { cod: "40", nome: "EPI", saldo: 909, valor: 31089.742 },
  { cod: "1011", nome: "Interm Entrada WMS", saldo: 906, valor: 136487.314 },
  { cod: "101", nome: "Almox Repasse", saldo: 444, valor: 62521.673 },
  { cod: "104", nome: "Almox Qualidade Filial CD", saldo: 124, valor: 5861.091 },
  { cod: "13", nome: "Volumes Faltantes Comercial", saldo: 97, valor: 10651.961 },
  { cod: "103", nome: "Almox Auditoria Devolução", saldo: 68, valor: 1966.833 },
  { cod: "100", nome: "Almox Movimentação OFC", saldo: 26, valor: 10902.664 },
  { cod: "41", nome: "Remessa para Feira", saldo: 24, valor: 3259.449 },
];

/* Totais do rodapé do relatório (conferência). */
export const ALMOXARIFADOS_TOTAL = { saldo: 221804.71, valor: 18990004.479 };
