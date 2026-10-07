/* QLP · CD Lopas — Quadro de Lotação de Pessoal.
   Extraído da planilha "CD-QLP.xlsx" (aba Base), atualizada em 07/10/2026.
   `cidades` e `turnos` contam apenas colaboradores ativos (CONTADOR = 1).
   `lat`/`lng` são as posições geográficas reais de cada cidade, usadas para
   desenhar o mapa na cena QLP · CD. */

export type QlpCidade = { cidade: string; pessoas: number; lat: number; lng: number };

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
    { cidade: "Cataguases", pessoas: 94, lat: -21.3892, lng: -42.6967 },
    { cidade: "Guarani", pessoas: 15, lat: -21.3597, lng: -43.0469 },
    { cidade: "Rodeiro", pessoas: 10, lat: -21.2003, lng: -42.865 },
    { cidade: "Divinésia", pessoas: 7, lat: -20.99, lng: -43.0049 },
    { cidade: "Piraúba", pessoas: 5, lat: -21.2756, lng: -43.0144 },
    { cidade: "Astolfo Dutra", pessoas: 5, lat: -21.3153, lng: -42.8622 },
    { cidade: "Ubá", pessoas: 5, lat: -21.1204, lng: -42.9426 },
    { cidade: "Dona Euzébia", pessoas: 2, lat: -21.3167, lng: -42.8083 },
    { cidade: "Santana do Campestre", pessoas: 1, lat: -21.2683, lng: -42.9364 },
  ] as QlpCidade[],
};
