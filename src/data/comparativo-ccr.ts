/* Comparativo entre ESTOQUE 001 (Focco ERP, posição de estoque) e ESTOQUE CCR
   (relatório de volumes do CD). Dados extraídos da planilha CCRLOPAS.xlsx
   enviada pelo usuário em 19/10/2026. */

export type ComparativoCcr = {
  dataBase: string;
  estoque001: { itens: number; saldo: number; pesoTon: number };
  ccr: { itens: number; saldo: number; pesoTon: number };
  diferenca: {
    pesoTon: number;
    pesoPct: number;
    saldoUn: number;
    saldoPct: number;
  };
  porUnidade: {
    nome: string;
    peso001: number;
    pesoCcr: number;
    difTon: number;
    difPct: number;
  }[];
  itensEmComum: number;
  itensSo001: number;
  itensSoCcr: number;
  topDiferencas: {
    item: string;
    desc: string;
    peso001: number;
    pesoCcr: number;
    difTon: number;
  }[];
};

export const COMPARATIVO_CCR: ComparativoCcr = {
  dataBase: "19/10/2026",
  estoque001: { itens: 358, saldo: 141617, pesoTon: 4315.6 },
  ccr: { itens: 316, saldo: 148147, pesoTon: 4603.8 },
  diferenca: {
    pesoTon: 288.2,
    pesoPct: 6.7,
    saldoUn: 6530,
    saldoPct: 4.6,
  },
  porUnidade: [
    { nome: "Guarda-Roupas", peso001: 2861.7, pesoCcr: 3052.8, difTon: 191.1, difPct: 6.7 },
    { nome: "Complementos", peso001: 915.6, pesoCcr: 979.9, difTon: 64.3, difPct: 7.0 },
    { nome: "Salas", peso001: 538.3, pesoCcr: 571.1, difTon: 32.8, difPct: 6.1 },
  ],
  itensEmComum: 315,
  itensSo001: 43,
  itensSoCcr: 1,
  topDiferencas: [
    { item: "72594", desc: "VOL CX GR 8 PTS EASY SLIM/ANDARA TAMPO/LATERAL 2,4", peso001: 246.4, pesoCcr: 269.3, difTon: -22.8 },
    { item: "2320", desc: "VOL CX GR 3 PTS NICE PORTAS 2,150X0,940X0,055", peso001: 18.2, pesoCcr: 40.7, difTon: -22.5 },
    { item: "2107", desc: "VOL CX GR 6 PTS BERTHA T/F 2,775X0,510X0,068", peso001: 40.2, pesoCcr: 60.7, difTon: -20.5 },
    { item: "72595", desc: "VOL CX GR 8 PTS EASY SLIM/ANDARA SOFT PORTAS/COSTA", peso001: 276.4, pesoCcr: 296.0, difTon: -19.6 },
    { item: "73189", desc: "VOL CX SAPATEIRA ESTHELA 2024 1,898X0,625X0,107", peso001: 44.6, pesoCcr: 54.2, difTon: -9.6 },
  ],
};
