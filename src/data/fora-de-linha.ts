/* Itens fora de linha — planilha "Estoque Em Linha x Fora de Linha"
   (aba "Fora de Linha", 147 itens; aba "Resumo" para a visão geral). */

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
  saldoFocco: 140953,
  saldoFull: 0,
  reservas: 63876,
  disponivel: 77077,
  pesoTon: 3728.6,
  pesoReservadoTon: 1929.7,
  valorEstoque: 16311566.98,
  valorReservado: 8453099.91,
};

export const POSICAO_FORA_DE_LINHA: PosicaoEstoque = {
  grupo: "FORA DE LINHA",
  itens: 21,
  saldoFocco: 222,
  saldoFull: 0,
  reservas: 0,
  disponivel: 222,
  pesoTon: 0.9183,
  pesoReservadoTon: 0,
  valorEstoque: 511590,
  valorReservado: 0,
};

export const POSICAO_TOTAL: PosicaoEstoque = {
  grupo: "TOTAL GERAL",
  itens: 21,
  saldoFocco: 222,
  saldoFull: 0,
  reservas: 0,
  disponivel: 222,
  pesoTon: 0.9183,
  pesoReservadoTon: 0,
  valorEstoque: 511590,
  valorReservado: 0,
};

export const ITENS_FORA_DE_LINHA: ItemForaDeLinha[] = [
  {"chave":"2102.12836","item":2102,"desc":"VOL CX GR 6 PTS ARIES 2021 TAMPO 2,470X0,510X0,087","mascara":"(12836)BRANCO","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":222,"saldoFull":0,"reservas":0,"disponivel":222,"pesoKg":918.3,"pesoReservadoKg":0,"valorEstoque":511590,"valorReservado":0},
  {"chave":"2103.13947","item":2103,"desc":"VOL CX GR 6 PTS ARIES 2021 LAT 2,440X0,510X0,055","mascara":"(13947)BRANCO","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"2104.13959","item":2104,"desc":"VOL CX GR 6 PTS ARIES 2021 DIV 1,800X0,510X0,100","mascara":"(13959)BRANCO","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"2246.12516","item":2246,"desc":"VOL CX GR LEDER/VINCE/OLLIE/CALEB COSTAS 2,245X0,910X0,018","mascara":"(12516)AMENDOA CLEAN","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"2275.13753","item":2275,"desc":"VOL CX GR 6 PTS LOOP DIV/PRAT 2,305X0,520X0,103","mascara":"(13753)FRASSINO","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"2318.12318","item":2318,"desc":"VOL CX GR 3 PTS NICE LAT 2,375X0,580X0,057","mascara":"(12318)FRASSINO","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"2319.12526","item":2319,"desc":"VOL CX GR 3 PTS NICE DIV/PRAT 2,155X0,430X0,107","mascara":"(12526)FRASSINO","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"2320.13076","item":2320,"desc":"VOL CX GR 3 PTS NICE PORTAS 2,150X0,940X0,055","mascara":"(13076)FRASSINO/OFF WHITE","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"75841.13222","item":75841,"desc":"VOL CX GR 6 PTS LOOP 2024 TAMPO 2,735X0,515X0,083","mascara":"(13222)FRASSINO/SALVIA","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"75868.13792","item":75868,"desc":"VOL CX GR 6 PTS LOOP 2024 PORTA 2,400X0,417X0,103","mascara":"(13792)SALVIA","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"75871.13621","item":75871,"desc":"VOL CX GR 6 PTS LOOP 2024 COSTAS 2,270X0,940X0,010","mascara":"(13621)FRASSINO","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"76348.13617","item":76348,"desc":"VOL CX GR 6 PTS LOOP 2024 LATERAL 2,335X0,550X0,083","mascara":"(13617)FRASSINO","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"84635.31549","item":84635,"desc":"VOL CX TAMPO GR 06 PTS 2,40 STYLE 2,450X0,510X0,092","mascara":"(31549)FRASSINO","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"84688.31337","item":84688,"desc":"VOL CX LATERAL GR 06 PTS 2,40 STYLE 2,395X0,555X0,073","mascara":"(31337)FRASSINO","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"84701.32131","item":84701,"desc":"VOL CX DIVISAO GR 06PTS 2,40 STYLE 2,250X0,510X0,073","mascara":"(32131)FRASSINO","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"84712.31797","item":84712,"desc":"VOL CX COSTAS GR 6PTS 2,40 STYLE 2,207X0,803X0,012","mascara":"(31797)FRASSINO","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"84715.31343","item":84715,"desc":"VOL CX PORTAS GR 6PTS 2,40 STYLE 2,292X0,410X0,102","mascara":"(31343)OFF WHITE","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"84800.43035","item":84800,"desc":"VOL CX LAT GR 06 PTS LOOP 2025 2,340X0,555X0,083","mascara":"(43035)FRASSINO","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"84809.42186","item":84809,"desc":"VOL CX DIV/PRAT GR 06 PTS LOOP 2025 2,310X0,525X0,103","mascara":"(42186)FRASSINO","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"84836.30749","item":84836,"desc":"VOL CX LAT GR 03/06 PTS OLLIE II 2025 2,375X0,550X0,078","mascara":"(30749)AMENDOA CLEAN","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0},
  {"chave":"84860.30884","item":84860,"desc":"VOL CX TAMPO GR 06 PTS OLLIE II 2025 2,775X0,550X0,092","mascara":"(30884)AMENDOA CLEAN","categoria":"UNIDADE GUARDA ROUPAS","origem":"EM AMBAS","saldoFocco":0,"saldoFull":0,"reservas":0,"disponivel":0,"pesoKg":0,"pesoReservadoKg":0,"valorEstoque":0,"valorReservado":0}
];
