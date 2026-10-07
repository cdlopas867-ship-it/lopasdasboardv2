/* QLP · CD Lopas — Quadro de Lotação de Pessoal.
   Extraído da planilha "CD - QLP.xlsx" (aba Base), atualizada em 07/10/2026.
   `pessoas` e os campos por cidade contam apenas colaboradores ativos
   (CONTADOR = 1). `demitidos` conta todas as linhas com DEMITIDOS preenchido.
   `lat`/`lng` são as posições geográficas reais de cada cidade, usadas para
   desenhar o mapa na cena QLP · CD. */

export type QlpCidade = {
  cidade: string;
  pessoas: number;
  lat: number;
  lng: number;
  turmas: number;
  funcoes: number;
  setores: number;
  cargos: number;
  turno1: number;
  turno2: number;
  admissao: string;
  demitidos: number;
};

export const QLP_CD = {
  atualizadoEm: "07/10/2026",
  total: 254,
  ativos: 144,
  demitidos: 87,
  afastados: 7,
  transferidos: 10,
  turnos: [
    { nome: "1º turno", pessoas: 90 },
    { nome: "2º turno", pessoas: 54 },
  ],
  cidades: [
    { cidade: "Cataguases", pessoas: 94, lat: -21.3892, lng: -42.6967, turmas: 20, funcoes: 16, setores: 3, cargos: 16, turno1: 47, turno2: 47, admissao: "08/06/26", demitidos: 63 },
    { cidade: "Guarani", pessoas: 15, lat: -21.3597, lng: -43.0469, turmas: 10, funcoes: 8, setores: 2, cargos: 8, turno1: 14, turno2: 1, admissao: "08/04/26", demitidos: 5 },
    { cidade: "Rodeiro", pessoas: 10, lat: -21.2003, lng: -42.865, turmas: 8, funcoes: 8, setores: 2, cargos: 7, turno1: 6, turno2: 4, admissao: "08/10/25", demitidos: 6 },
    { cidade: "Divinésia", pessoas: 7, lat: -20.99, lng: -43.0049, turmas: 5, funcoes: 4, setores: 2, cargos: 4, turno1: 7, turno2: 0, admissao: "23/04/25", demitidos: 1 },
    { cidade: "Piraúba", pessoas: 5, lat: -21.2756, lng: -43.0144, turmas: 3, funcoes: 4, setores: 2, cargos: 5, turno1: 5, turno2: 0, admissao: "03/04/23", demitidos: 2 },
    { cidade: "Astolfo Dutra", pessoas: 5, lat: -21.3153, lng: -42.8622, turmas: 4, funcoes: 3, setores: 2, cargos: 4, turno1: 3, turno2: 2, admissao: "21/07/25", demitidos: 5 },
    { cidade: "Ubá", pessoas: 5, lat: -21.1204, lng: -42.9426, turmas: 5, funcoes: 4, setores: 2, cargos: 5, turno1: 5, turno2: 0, admissao: "22/04/26", demitidos: 2 },
    { cidade: "Dona Euzébia", pessoas: 2, lat: -21.3167, lng: -42.8083, turmas: 2, funcoes: 1, setores: 1, cargos: 2, turno1: 2, turno2: 0, admissao: "24/10/22", demitidos: 1 },
    { cidade: "Santana do Campestre", pessoas: 1, lat: -21.2683, lng: -42.9364, turmas: 1, funcoes: 1, setores: 1, cargos: 1, turno1: 1, turno2: 0, admissao: "10/02/25", demitidos: 0 },
  ] as QlpCidade[],
};
