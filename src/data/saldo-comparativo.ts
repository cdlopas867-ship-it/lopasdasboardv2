/* Controle de Saldo — Full (FullSoft) × Focco (ERP, estoque 001).
   Cruzamento: ITENS_PADRAO (FullSoft, aba COMPARATIVO FULLSOFT) ×
   WF0112-Estoques (Focco, aba Resultado). Data-base: 14/10/2026. */

export type DiferencaSaldo = {
  item: string;
  desc: string;
  full: number;
  focco: number;
  diff: number;
};

export type SaldoComparativo = {
  dataBase: string;
  full: {
    itens: number;
    saldo: number;
    valor: number;
  };
  focco: {
    itens: number;
    saldo: number;
  };
  comparativo: {
    itensEmComum: number;
    itensSoFull: number;
    itensSoFocco: number;
    qtdExata: number;
    qtdDiferenca: number;
    pctMatch: number;
  };
  alertas: {
    soFull: number;
    soFocco: number;
    diferencaTotal: number;
  };
  topDiferencas: DiferencaSaldo[];
};

export const SALDO_COMPARATIVO: SaldoComparativo = {
  dataBase: "14/10/2026",
  full: {
    itens: 295,
    saldo: 149550,
    valor: 17191643.41,
  },
  focco: {
    itens: 2241,
    saldo: 190638.05,
  },
  comparativo: {
    itensEmComum: 286,
    itensSoFull: 9,
    itensSoFocco: 1955,
    qtdExata: 27,
    qtdDiferenca: 259,
    pctMatch: 9.4,
  },
  alertas: {
    soFull: 9,
    soFocco: 1955,
    diferencaTotal: -41088.05,
  },
  topDiferencas: [
    { item: "217", desc: "VOL CX ASSENTO/ENCOSTO CAD APOGEU C/2  0,585X0,370X0,430", full: 10978, focco: 6558, diff: 4420 },
    { item: "72596", desc: "VOL CX ESPELHO C/4 ESP 900X235X3 C/8 SUP CROMADO 0,960X0,295", full: 3554, focco: 1404, diff: 2150 },
    { item: "84488", desc: "VOL CX GR 6PTS EASY SLIM 2025 TAMPO/LATERAL 2,125X0,460X0,10", full: 868, focco: 2898, diff: -2030 },
    { item: "84495", desc: "VOL CX GR 6PTS EASY SLIM 2025 PTS/COSTA 1,96X0,605X0,077", full: 911, focco: 2903, diff: -1992 },
    { item: "154", desc: "VOL KIT PES C/8 PES LOPAS PVC 0,338X0,140X0,069", full: 5556, focco: 3726, diff: 1830 },
    { item: "73226", desc: "VOL CX ESPELHO C/1 ESP 1795X385X3 SAP.ESTHELA 1,930X0,570X0,", full: 1876, focco: 3397, diff: -1521 },
    { item: "2194", desc: "VOL KIT PES C/10 PES LOPAS PVC 0,420X0,160X0,140", full: 4246, focco: 2885, diff: 1361 },
    { item: "2162", desc: "VOL CX CAB/PES CAMA CASAL ATHENAS PLUS 1,290X0,460X0,057", full: 1747, focco: 707, diff: 1040 },
    { item: "2161", desc: "VOL CX BARRA ATHENAS  CASAL 2022 1,975X0,340X0,080", full: 1744, focco: 726, diff: 1018 },
    { item: "73152", desc: "VOL CX CAB/PES ATHENAS SOLT 0,90 PLUS 0,790X0,470X0,056", full: 1738, focco: 732, diff: 1006 },
    { item: "73145", desc: "VOL CX PES  ATHENAS  SOLT 0,90 PLUS 1,210X0,275X0,100", full: 1740, focco: 750, diff: 990 },
    { item: "73141", desc: "VOL CX BARRA ATHENAS  SOLT 0,90 2022 1,975X0,395X0,045", full: 1734, focco: 753, diff: 981 },
    { item: "2163", desc: "VOL CX PES  ATHENAS  CASAL PLUS 1,625X0,200X0,100", full: 1741, focco: 772, diff: 969 },
    { item: "81713", desc: "VOL CX MESA C/4 CAD EASY LINE 1,435X0,732X0,104", full: 219, focco: 1129, diff: -910 },
    { item: "2239", desc: "VOL CX GR 6 PTS JAZZ 2023 PORTAS 2,030X0,338X0,103", full: 960, focco: 89, diff: 871 },
  ],
};
