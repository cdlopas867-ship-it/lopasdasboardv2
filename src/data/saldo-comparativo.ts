/* Controle de saldo — Full × Focco.
 *
 * Full  = relatório "WF0112 - Estoques" (aba Resultado) do WMS do CD, o
 *         FullSoft (estoque 112): quantidade atual por item e endereço — o
 *         rodapé da planilha traz "Copyright © FullSoft Mobile Solutions".
 *         O código do item já vem com o sufixo da máscara (ex.: "77092.36318")
 *         e é comparado como está. Entra só item de volume (descrição
 *         começando por "VOL"), em qualquer endereço.
 * Focco = posição de estoque 001 do ERP Focco (planilha "ESTOQUE 001 - POSIÇÃO
 *         DE ESTOQUE", ex.: "ST QUARTA.xlsx"). A chave do item é o código + o
 *         número da máscara (ex.: item 2194 + máscara "(16652)…" → "2194.16652"),
 *         o mesmo formato do relatório do Full.
 *
 * O cruzamento é pelo código completo: itens com o mesmo código nos dois
 * sistemas são comparados pelo saldo; os que existem em apenas um lado viram
 * alertas. A acuracidade é a parcela dos itens em comum com saldo exatamente
 * igual.
 *
 * Os valores abaixo são o FALLBACK estático (data-base 14/10/2026). Em execução
 * o painel usa o comparativo calculado pelo drive-auto-import a partir das
 * planilhas da pasta do Drive (src/lib/saldo-comparativo-import.ts). Para
 * atualizar o fallback, reextrair as duas planilhas da pasta (ST QUARTA e
 * WF0112 - Estoques) com um script Node que use o xlsx do container e regravar
 * este arquivo.
 */

export type DiferencaSaldo = {
  item: string;
  desc: string;
  full: number;
  focco: number;
  diff: number;
};

export type SaldoComparativo = {
  dataBase: string;
  full: { itens: number; saldo: number };
  focco: { itens: number; saldo: number; valor: number };
  comparativo: {
    itensEmComum: number;
    itensSoFull: number;
    itensSoFocco: number;
    qtdExata: number;
    qtdDiferenca: number;
    pctAcuracia: number;
    /* Tonelagem dos itens de cada situação, pelo peso da posição do Focco
       (PESO LIQ TOTAL). O relatório do Full não traz peso, então os itens
       "só Full" ficam sem tonelagem. */
    tonExato: number;
    tonDiferenca: number;
    tonSoFocco: number;
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
    itens: 657,
    saldo: 134304
  },
  focco: {
    itens: 612,
    saldo: 136125,
    valor: 17061917.77
  },
  comparativo: {
    itensEmComum: 589,
    itensSoFull: 68,
    itensSoFocco: 23,
    qtdExata: 171,
    qtdDiferenca: 418,
    pctAcuracia: 29,
    tonExato: 224.1,
    tonDiferenca: 3761.4,
    tonSoFocco: 2.2
  },
  alertas: {
    soFull: 68,
    soFocco: 23,
    diferencaTotal: 1821
  },
  topDiferencas: [
    {
      item: "2194.16652",
      desc: "VOL KIT PES C/10 PES LOPAS PVC 0,420X0,160X0,140",
      full: 2493,
      focco: 3169,
      diff: 676
    },
    {
      item: "72596",
      desc: "VOL CX ESPELHO C/4 ESP 900X235X3 C/8 SUP CROMADO 0,960X0,295X0,046",
      full: 1404,
      focco: 1974,
      diff: 570
    },
    {
      item: "72594.12814",
      desc: "VOL CX GR 8 PTS EASY SLIM/ANDARA TAMPO/LATERAL 2,430X0,460X0,128",
      full: 1372,
      focco: 1840,
      diff: 468
    },
    {
      item: "154.16634",
      desc: "VOL KIT PES C/8 PES LOPAS PVC 0,338X0,140X0,069",
      full: 3317,
      focco: 3546,
      diff: 229
    },
    {
      item: "154.16635",
      desc: "VOL KIT PES C/8 PES LOPAS PVC 0,338X0,140X0,069",
      full: 187,
      focco: 381,
      diff: 194
    },
    {
      item: "2085.12720",
      desc: "VOL CX GR 4 PTS ALONZO LAT/DIV 2,315X0,460X0,075",
      full: 615,
      focco: 789,
      diff: 174
    },
    {
      item: "187.15487",
      desc: "VOL KIT PES C/6 PES LOPAS PVC 0,282X0,140X0,069",
      full: 1575,
      focco: 1742,
      diff: 167
    },
    {
      item: "72595.12820",
      desc: "VOL CX GR 8 PTS EASY SLIM/ANDARA SOFT PORTAS/COSTAS 1,950X0,600X0,096",
      full: 822,
      focco: 971,
      diff: 149
    },
    {
      item: "73026.16485",
      desc: "VOL KIT PES C/4 PES LOPAS PVC 0,185X0,140X0,075",
      full: 494,
      focco: 610,
      diff: 116
    },
    {
      item: "74198.31905",
      desc: "VOL CX MESA DE CABECEIRA C/3 GAV BAIAO 2021 0,665X0,385X0,140",
      full: 237,
      focco: 349,
      diff: 112
    },
    {
      item: "85462.46365",
      desc: "VOL CX CADEIRA APOGEU/RAYLA 2025 C/06 0,545X0,435X0,183",
      full: 1021,
      focco: 1127,
      diff: 106
    },
    {
      item: "2084.12865",
      desc: "VOL CX GR 4 PTS ALONZO 2021 T/F 1,345X0,460X0,110",
      full: 665,
      focco: 765,
      diff: 100
    }
  ]
};
