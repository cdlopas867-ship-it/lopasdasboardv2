/* Itens fora de linha — planilha "Estoque Em Linha x Fora de Linha"
   (aba "Fora de Linha", 147 itens; aba "Resumo" para a visão geral).
   Dados conforme aba Resumo da planilha do Drive. */

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
  valorReservado: 280432.81,
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
  valorReservado: 8733532.72,
};

export const ITENS_FORA_DE_LINHA: ItemForaDeLinha[] = [
  {"chave": "2102.12836", "item": 2102, "desc": "VOL CX GR 6 PTS ARIES 2021 TAMPO 2,470X0,510X0,087", "mascara": "(12836)BRANCO", "categoria": "UNIDADE GUARDA ROUPAS", "origem": "EM AMBAS", "saldoFocco": 15, "saldoFull": 0, "reservas": 0, "disponivel": 15, "pesoKg": 79.86, "pesoReservadoKg": 0, "valorEstoque": 37461.9, "valorReservado": 0},
  {"chave": "2103.13947", "item": 2103, "desc": "VOL CX GR 6 PTS ARIES 2021 LAT 2,440X0,510X0,055", "mascara": "(13947)BRANCO", "categoria": "UNIDADE GUARDA ROUPAS", "origem": "EM AMBAS", "saldoFocco": 13, "saldoFull": 0, "reservas": 0, "disponivel": 13, "pesoKg": 76.2, "pesoReservadoKg": 0, "valorEstoque": 31854.25, "valorReservado": 0},
  {"chave": "2104.13959", "item": 2104, "desc": "VOL CX GR 6 PTS ARIES 2021 DIV 1,800X0,510X0,100", "mascara": "(13959)BRANCO", "categoria": "UNIDADE GUARDA ROUPAS", "origem": "EM AMBAS", "saldoFocco": 17, "saldoFull": 0, "reservas": 0, "disponivel": 17, "pesoKg": 88.2, "pesoReservadoKg": 0, "valorEstoque": 42177.5, "valorReservado": 0},
  {"chave": "2246.12516", "item": 2246, "desc": "VOL CX GR LEDER/VINCE/OLLIE/CALEB COSTAS 2,245X0,910X0,018", "mascara": "(12516)AMENDOA CLEAN", "categoria": "UNIDADE GUARDA ROUPAS", "origem": "EM AMBAS", "saldoFocco": 18, "saldoFull": 0, "reservas": 0, "disponivel": 18, "pesoKg": 44.6, "pesoReservadoKg": 0, "valorEstoque": 35690.2, "valorReservado": 0},
  {"chave": "2275.13753", "item": 2275, "desc": "VOL CX GR 6 PTS LOOP DIV/PRAT 2,305X0,520X0,103", "mascara": "(13753)FRASSINO", "categoria": "UNIDADE GUARDA ROUPAS", "origem": "EM AMBAS", "saldoFocco": 21, "saldoFull": 0, "reservas": 0, "disponivel": 21, "pesoKg": 109.3, "pesoReservadoKg": 0, "valorEstoque": 46825.4, "valorReservado": 0},
  {"chave": "2318.12318", "item": 2318, "desc": "VOL CX GR 3 PTS NICE LAT 2,375X0,580X0,057", "mascara": "(12318)FRASSINO", "categoria": "UNIDADE GUARDA ROUPAS", "origem": "EM AMBAS", "saldoFocco": 14, "saldoFull": 0, "reservas": 0, "disponivel": 14, "pesoKg": 53.7, "pesoReservadoKg": 0, "valorEstoque": 32660.1, "valorReservado": 0},
  {"chave": "2319.12526", "item": 2319, "desc": "VOL CX GR 3 PTS NICE DIV/PRAT 2,155X0,430X0,107", "mascara": "(12526)FRASSINO", "categoria": "UNIDADE GUARDA ROUPAS", "origem": "EM AMBAS", "saldoFocco": 16, "saldoFull": 0, "reservas": 0, "disponivel": 16, "pesoKg": 54.1, "pesoReservadoKg": 0, "valorEstoque": 34569.4, "valorReservado": 0},
  {"chave": "2320.13076", "item": 2320, "desc": "VOL CX GR 3 PTS NICE PORTAS 2,150X0,940X0,055", "mascara": "(13076)FRASSINO/OFF WHITE", "categoria": "UNIDADE GUARDA ROUPAS", "origem": "EM AMBAS", "saldoFocco": 12, "saldoFull": 0, "reservas": 0, "disponivel": 12, "pesoKg": 42.3, "pesoReservadoKg": 0, "valorEstoque": 29370.8, "valorReservado": 0},
  {"chave": "75841.13222", "item": 75841, "desc": "VOL CX GR 6 PTS LOOP 2024 TAMPO 2,735X0,515X0,083", "mascara": "(13222)FRASSINO/SALVIA", "categoria": "UNIDADE GUARDA ROUPAS", "origem": "EM AMBAS", "saldoFocco": 7, "saldoFull": 0, "reservas": 0, "disponivel": 7, "pesoKg": 31.4, "pesoReservadoKg": 0, "valorEstoque": 15569.9, "valorReservado": 0},
  {"chave": "75868.13792", "item": 75868, "desc": "VOL CX GR 6 PTS LOOP 2024 PORTA 2,400X0,417X0,103", "mascara": "(13792)SALVIA", "categoria": "UNIDADE GUARDA ROUPAS", "origem": "EM AMBAS", "saldoFocco": 5, "saldoFull": 0, "reservas": 0, "disponivel": 5, "pesoKg": 19.2, "pesoReservadoKg": 0, "valorEstoque": 12985.0, "valorReservado": 0},
  {"chave": "72829.16467", "item": 72829, "desc": "VOL CX BARRA CAMA CASAL 1,60 LOOP/LEDER", "mascara": "(16467)FRASSINO", "categoria": "UNIDADE DE COMPLEMENTOS", "origem": "SO ELIANE", "saldoFocco": 266, "saldoFull": 0, "reservas": 266, "disponivel": 0, "pesoKg": 9.926, "pesoReservadoKg": 9.926, "valorEstoque": 74586, "valorReservado": 74586},
  {"chave": "73233.15555", "item": 73233, "desc": "VOL CX MESA DE CABECEIRA C/2 GAV LEDER 0,625X0,437X0,133", "mascara": "(15555)AMENDOA CLEAN", "categoria": "UNIDADE DE SALAS", "origem": "SO ELIANE", "saldoFocco": 207, "saldoFull": 0, "reservas": 207, "disponivel": 0, "pesoKg": 4.41, "pesoReservadoKg": 4.41, "valorEstoque": 36371, "valorReservado": 36371},
];
