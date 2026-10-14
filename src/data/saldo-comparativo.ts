/* Controle de saldo — Full × Focco.
 *
 * Full  = posição de estoque do CD no sistema FullSoft (planilha "ESTOQUE 001 -
 *         POSIÇÃO DE ESTOQUE", ex.: "ST QUARTA.xlsx"). A chave do item é o
 *         código + o número da máscara (ex.: item 2194 + máscara "(16652)…" →
 *         "2194.16652"), o mesmo formato do ERP.
 * Focco = relatório "WF0112 - Estoques" (aba Resultado) do ERP Focco, com a
 *         quantidade atual por item e endereço. O código do item já vem com o
 *         sufixo da máscara (ex.: "77092.36318") e é comparado como está.
 *
 * O cruzamento é pelo código completo: itens com o mesmo código nos dois
 * sistemas são comparados pelo saldo; os que existem em apenas um lado viram
 * alertas. Do relatório do Focco entra apenas o estoque do **CD**: as linhas
 * com endereço fora do CD (a ASTEC, fornecedor de ferragens) ficam de fora —
 * com elas o saldo do Focco ficava inflado em ~3,1 mil itens que não estão no
 * CD — e só entram itens de **volume** (descrição começando por "VOL"); o
 * restante são peças e componentes soltos. A acuracidade é a parcela dos itens
 * em comum com saldo exatamente igual.
 *
 * Os valores abaixo são o FALLBACK estático (data-base 14/10/2026). Em execução
 * o painel usa o comparativo calculado pelo drive-auto-import a partir das
 * planilhas da pasta do Drive (src/lib/saldo-comparativo-import.ts). Para
 * atualizar o fallback, reextrair as três planilhas da pasta (ST QUARTA,
 * WF0112 - Estoques e RESERVAS QUARTAS) com um script Node que use o xlsx do
 * container e regravar este arquivo.
 */

export type DiferencaSaldo = {
  item: string;
  desc: string;
  full: number;
  focco: number;
  diff: number;
};

export type SaldoReservado = {
  qtd: number;
  saldo: number;
  pctSaldo: number;
  ton: number;
  valor: number;
};

export type SaldoComparativo = {
  dataBase: string;
  full: { itens: number; saldo: number; valor: number };
  focco: { itens: number; saldo: number };
  reservados: SaldoReservado;
  comparativo: {
    itensEmComum: number;
    itensSoFull: number;
    itensSoFocco: number;
    qtdExata: number;
    qtdDiferenca: number;
    pctAcuracia: number;
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
    itens: 612,
    saldo: 136125,
    valor: 17061917.77
  },
  focco: {
    itens: 656,
    saldo: 134303
  },
  reservados: {
    qtd: 76860,
    saldo: 149580,
    pctSaldo: 51.4,
    ton: 2395.2,
    valor: 9891312.67
  },
  comparativo: {
    itensEmComum: 588,
    itensSoFull: 24,
    itensSoFocco: 68,
    qtdExata: 170,
    qtdDiferenca: 418,
    pctAcuracia: 28.9
  },
  alertas: {
    soFull: 24,
    soFocco: 68,
    diferencaTotal: 1822
  },
  topDiferencas: [
    {
      item: "2194.16652",
      desc: "VOL KIT PES C/10 PES LOPAS PVC 0,420X0,160X0,140",
      full: 3169,
      focco: 2493,
      diff: 676
    },
    {
      item: "72596",
      desc: "VOL CX ESPELHO C/4 ESP 900X235X3 C/8 SUP CROMADO 0,960X0,2",
      full: 1974,
      focco: 1404,
      diff: 570
    },
    {
      item: "72594.12814",
      desc: "VOL CX GR 8 PTS EASY SLIM/ANDARA TAMPO/LATERAL 2,430X0,460",
      full: 1840,
      focco: 1372,
      diff: 468
    },
    {
      item: "154.16634",
      desc: "VOL KIT PES C/8 PES LOPAS PVC 0,338X0,140X0,069",
      full: 3546,
      focco: 3317,
      diff: 229
    },
    {
      item: "154.16635",
      desc: "VOL KIT PES C/8 PES LOPAS PVC 0,338X0,140X0,069",
      full: 381,
      focco: 187,
      diff: 194
    },
    {
      item: "2085.12720",
      desc: "VOL CX GR 4 PTS ALONZO LAT/DIV 2,315X0,460X0,075",
      full: 789,
      focco: 615,
      diff: 174
    },
    {
      item: "187.15487",
      desc: "VOL KIT PES C/6 PES LOPAS PVC 0,282X0,140X0,069",
      full: 1742,
      focco: 1575,
      diff: 167
    },
    {
      item: "72595.12820",
      desc: "VOL CX GR 8 PTS EASY SLIM/ANDARA SOFT PORTAS/COSTAS 1,950X",
      full: 971,
      focco: 822,
      diff: 149
    },
    {
      item: "73026.16485",
      desc: "VOL KIT PES C/4 PES LOPAS PVC 0,185X0,140X0,075",
      full: 610,
      focco: 494,
      diff: 116
    },
    {
      item: "74198.31905",
      desc: "VOL CX MESA DE CABECEIRA C/3 GAV BAIAO 2021 0,665X0,385X0,",
      full: 349,
      focco: 237,
      diff: 112
    },
    {
      item: "85462.46365",
      desc: "VOL CX CADEIRA APOGEU/RAYLA 2025 C/06 0,545X0,435X0,183",
      full: 1127,
      focco: 1021,
      diff: 106
    },
    {
      item: "2084.12865",
      desc: "VOL CX GR 4 PTS ALONZO 2021 T/F 1,345X0,460X0,110",
      full: 765,
      focco: 665,
      diff: 100
    }
  ]
};
