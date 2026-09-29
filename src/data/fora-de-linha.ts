/* Itens fora de linha — planilha "Estoque Em Linha x Fora de Linha".
   Os totais abaixo refletem a aba Resumo do Drive enviada pelo usuário. */

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
  disponivel: 94.791,
  pesoTon: 162.463,
  pesoReservadoTon: 67.671,
  valorEstoque: 705498,
  valorReservado: 0,
};

export const POSICAO_TOTAL: PosicaoEstoque = {
  grupo: "TOTAL GERAL",
  itens: 784,
  saldoFocco: 142882,
  saldoFull: 0,
  reservas: 76085,
  disponivel: 1669.531,
  pesoTon: 3946.923,
  pesoReservadoTon: 2277.401,
  valorEstoque: 17017064.98,
  valorReservado: 8453099.91,
};

/* A lista detalhada continua disponível para a tabela. Os totais da aba Resumo
   são a fonte oficial dos KPIs acima. */
export const ITENS_FORA_DE_LINHA: ItemForaDeLinha[] = [
  { chave: "2102.12836", item: 2102, desc: "VOL CX GR 6 PTS ARIES 2021 TAMPO 2,470X0,510X0,087", mascara: "(12836)BRANCO", categoria: "UNIDADE GUARDA ROUPAS", origem: "EM AMBAS", saldoFocco: 222, saldoFull: 0, reservas: 0, disponivel: 222, pesoKg: 918.3, pesoReservadoKg: 0, valorEstoque: 511590, valorReservado: 0 },
];
