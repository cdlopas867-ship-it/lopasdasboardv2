/* QLP · CD Lopas — Quadro de Lotação de Pessoal.
   Extraído da planilha "CD-QLP.xlsx" (aba Base), atualizada em 07/10/2026.
   `cidades` e `turnos` contam apenas colaboradores ativos (CONTADOR = 1). */

export type QlpCidade = { cidade: string; pessoas: number };

export const QLP_CD = {
  atualizadoEm: "07/10/2026",
  total: 254,
  ativos: 144,
  demitidos: 93,
  afastados: 7,
  transferidos: 9,
  turnos: [
    { nome: "1º turno", pessoas: 90 },
    { nome: "2º turno", pessoas: 54 },
  ],
  cidades: [
    { cidade: "Cataguases", pessoas: 94 },
    { cidade: "Guarani", pessoas: 15 },
    { cidade: "Rodeiro", pessoas: 10 },
    { cidade: "Divinésia", pessoas: 7 },
    { cidade: "Piraúba", pessoas: 5 },
    { cidade: "Astolfo Dutra", pessoas: 5 },
    { cidade: "Ubá", pessoas: 5 },
    { cidade: "Dona Euzébia", pessoas: 2 },
    { cidade: "Santana do Campestre", pessoas: 1 },
  ] as QlpCidade[],
};
