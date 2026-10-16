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
 * Os valores abaixo são o FALLBACK estático (data-base 16/10/2026). Em execução
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
    /* Tonelagem dos itens de cada situação. As `ton*` são o peso da posição do
       Focco (PESO LIQ TOTAL) — "tonSoFocco" fica com os itens que só existem
       lá. As `tonFull*` são a quantidade do Full × o PESO LIQ UN do item na
       posição do Focco (o relatório do Full não traz peso) — "tonFullSoFull"
       cobre os itens que só existem no Full. */
    tonExato: number;
    tonDiferenca: number;
    tonSoFocco: number;
    tonFullExato: number;
    tonFullDiferenca: number;
    tonFullSoFull: number;
  };
  alertas: {
    soFull: number;
    soFocco: number;
    diferencaTotal: number;
  };
  topDiferencas: DiferencaSaldo[];
};

export const SALDO_COMPARATIVO: SaldoComparativo = {
  dataBase: "16/10/2026",
  full: {
    itens: 663,
    saldo: 134510
  },
  focco: {
    itens: 611,
    saldo: 136052,
    valor: 17114480.08
  },
  comparativo: {
    itensEmComum: 594,
    itensSoFull: 69,
    itensSoFocco: 17,
    qtdExata: 161,
    qtdDiferenca: 433,
    pctAcuracia: 27.1,
    tonExato: 196.5,
    tonDiferenca: 3809.6,
    tonSoFocco: 1.2,
    tonFullExato: 196.5,
    tonFullDiferenca: 3778.4,
    tonFullSoFull: 18.4
  },
  alertas: {
    soFull: 69,
    soFocco: 17,
    diferencaTotal: 1542
  },
  topDiferencas: [
    {
      item: "72596",
      desc: "VOL CX ESPELHO C/4 ESP 900X235X3 C/8 SUP CROMADO 0,960X0,295X0,046",
      full: 1408,
      focco: 1845,
      diff: 437
    },
    {
      item: "87626.93315",
      desc: "VOL CX ASSENTO/ENCOSTO CAD LAINI C/2 0,585X0,370X0,430",
      full: 86,
      focco: 440,
      diff: 354
    },
    {
      item: "87646.93332",
      desc: "VOL CX CADEIRA LAINI C/02 0,515X0,235X0,158",
      full: 309,
      focco: 660,
      diff: 351
    },
    {
      item: "154.16634",
      desc: "VOL KIT PES C/8 PES LOPAS PVC 0,338X0,140X0,069",
      full: 2678,
      focco: 3003,
      diff: 325
    },
    {
      item: "2194.16652",
      desc: "VOL KIT PES C/10 PES LOPAS PVC 0,420X0,160X0,140",
      full: 1626,
      focco: 1944,
      diff: 318
    },
    {
      item: "154.16635",
      desc: "VOL KIT PES C/8 PES LOPAS PVC 0,338X0,140X0,069",
      full: 159,
      focco: 357,
      diff: 198
    },
    {
      item: "86392.74072",
      desc: "VOL CX BASE MESA 1,70 EASY TOWER/1,60 LAINI 0,938X0,437X0,097",
      full: 166,
      focco: 323,
      diff: 157
    },
    {
      item: "87470.91617",
      desc: "VOL CX KIT C/8 PUXADORES GR SERENATA 0,370X0,140X0,075",
      full: 492,
      focco: 613,
      diff: 121
    },
    {
      item: "87462.91603",
      desc: "VOL CX GR 8PTS SERENATA DIV/COSTAS 1,970X0,595X0,080",
      full: 599,
      focco: 719,
      diff: 120
    },
    {
      item: "87460.91599",
      desc: "VOL CX GR 8PTS SERENATA TAMPO/LATERAL 2,425X0,468X0,095",
      full: 522,
      focco: 642,
      diff: 120
    },
    {
      item: "87560.93191",
      desc: "VOL CX GR 6PTS SUAVITA DIV/PRAT 2,230X0,490X0,090",
      full: 887,
      focco: 1004,
      diff: 117
    },
    {
      item: "73189.16641",
      desc: "VOL CX SAPATEIRA ESTHELA 2024 1,898X0,625X0,107",
      full: 862,
      focco: 966,
      diff: 104
    }
  ]
};
