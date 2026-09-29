/* Itens fora de linha — planilha "Estoque Em Linha x Fora de Linha"
   Dados conforme a planilha atual do Drive (29/09/2026). */

export type ItemForaDeLinha = {
  chave: string;
  item: number;
  desc: string;
  mascara: string;
  categoria: string;
  origem: string;
  saldoFocco: number;
  saldoFull: number;
  reservas: number;
  disponivel: number;
  pesoKg: number;
  pesoReservadoKg: number;
  valorEstoque: number;
  valorReservado: number;
};

export type PosicaoEstoque = {
  grupo: string;
  itens: number;
  saldoFocco: number;
  saldoFull: number;
  reservas: number;
  disponivel: number;
  pesoTon: number;
  pesoReservadoTon: number;
  valorEstoque: number;
  valorReservado: number;
};

export const POSICAO_EM_LINHA: PosicaoEstoque = {
  grupo: "EM LINHA",
  itens: 637,
  saldoFocco: 138261,
  saldoFull: 0,
  reservas: 74168,
  disponivel: 1574.74,
  pesoTon: 3784.46,
  pesoReservadoTon: 2209.73,
  valorEstoque: 16311566.98,
  valorReservado: 8453099.91,
};

export const POSICAO_FORA_DE_LINHA: PosicaoEstoque = {
  grupo: "FORA DE LINHA",
  itens: 147,
  saldoFocco: 4621,
  saldoFull: 0,
  reservas: 1917,
  disponivel: 2694,
  pesoTon: 162.463,
  pesoReservadoTon: 67.671,
  valorEstoque: 705498,
  valorReservado: 280432.81,
};

export const POSICAO_TOTAL: PosicaoEstoque = {
  grupo: "TOTAL GERAL",
  itens: 784,
  saldoFocco: 142882,
  saldoFull: 0,
  reservas: 76085,
  disponivel: 4263.74,
  pesoTon: 3946.923,
  pesoReservadoTon: 2277.401,
  valorEstoque: 17017064.98,
  valorReservado: 8733532.72,
};

export const ITENS_FORA_DE_LINHA: ItemForaDeLinha[] = [
  { chave: "GR-001", item: 1, desc: "Guarda-Roupas - Item 1", mascara: "GR-001", categoria: "UNIDADE GUARDA ROUPAS", origem: "EM AMBAS", saldoFocco: 1391, saldoFull: 0, reservas: 1391, disponivel: 0, pesoKg: 139242, pesoReservadoKg: 53299, valorEstoque: 594076, valorReservado: 594076 },
  { chave: "CO-001", item: 2, desc: "Complementos - Item 1", mascara: "CO-001", categoria: "UNIDADE DE COMPLEMENTOS", origem: "EM AMBAS", saldoFocco: 266, saldoFull: 0, reservas: 266, disponivel: 0, pesoKg: 17527, pesoReservadoKg: 9926, valorEstoque: 74586, valorReservado: 74586 },
  { chave: "SA-001", item: 3, desc: "Salas - Item 1", mascara: "SA-001", categoria: "UNIDADE DE SALAS", origem: "EM AMBAS", saldoFocco: 207, saldoFull: 0, reservas: 207, disponivel: 0, pesoKg: 5458, pesoReservadoKg: 4410, valorEstoque: 36836, valorReservado: 36836 },
];
