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
 * Os valores abaixo são o FALLBACK estático (data-base 19/10/2026). Em execução
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

/* Item individual do comparativo — usado na exportação Excel completa.
   `situacao` classifica o item no cruzamento Full × Focco. */
export type ItemSaldoCompleto = {
  item: string;
  desc: string;
  full: number;
  focco: number;
  diff: number;
  reservados: number;
  disponiveis: number;
  situacao: "exato" | "diferenca" | "so-full" | "so-focco";
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
  /* Relação completa de todos os itens (em comum + só Full + só Focco) para
     a exportação Excel detalhada. */
  todosItens: ItemSaldoCompleto[];
};

export const SALDO_COMPARATIVO: SaldoComparativo = {
  dataBase: "19/10/2026",
  full: {
    itens: 663,
    saldo: 138747
  },
  focco: {
    itens: 611,
    saldo: 141617,
    valor: 18144692.33
  },
  comparativo: {
    itensEmComum: 594,
    itensSoFull: 69,
    itensSoFocco: 17,
    qtdExata: 168,
    qtdDiferenca: 426,
    pctAcuracia: 28.3,
    tonExato: 249.2,
    tonDiferenca: 4065.1,
    tonSoFocco: 1.2,
    tonFullExato: 249.2,
    tonFullDiferenca: 3987.1,
    tonFullSoFull: 18.4
  },
  alertas: {
    soFull: 69,
    soFocco: 17,
    diferencaTotal: 2870
  },
  todosItens: [],
  topDiferencas: [
    {
      item: "87470.91617",
      desc: "VOL CX KIT C/8 PUXADORES GR SERENATA 0,370X0,140X0,075",
      full: 378,
      focco: 1138,
      diff: 760
    },
    {
      item: "154.16634",
      desc: "VOL KIT PES C/8 PES LOPAS PVC 0,338X0,140X0,069",
      full: 2247,
      focco: 2666,
      diff: 419
    },
    {
      item: "2194.16652",
      desc: "VOL KIT PES C/10 PES LOPAS PVC 0,420X0,160X0,140",
      full: 1097,
      focco: 1416,
      diff: 319
    },
    {
      item: "187.15487",
      desc: "VOL KIT PES C/6 PES LOPAS PVC 0,282X0,140X0,069",
      full: 1906,
      focco: 2142,
      diff: 236
    },
    {
      item: "72594.12814",
      desc: "VOL CX GR 8 PTS EASY SLIM/ANDARA TAMPO/LATERAL 2,430X0,460X0,128",
      full: 2900,
      focco: 3133,
      diff: 233
    },
    {
      item: "217.16140",
      desc: "VOL CX ASSENTO/ENCOSTO CAD APOGEU/TESSERA C/20,585X0,370X0,430",
      full: 1427,
      focco: 1626,
      diff: 199
    },
    {
      item: "154.16635",
      desc: "VOL KIT PES C/8 PES LOPAS PVC 0,338X0,140X0,069",
      full: 150,
      focco: 348,
      diff: 198
    },
    {
      item: "72596",
      desc: "VOL CX ESPELHO C/4 ESP 900X235X3 C/8 SUP CROMADO 0,960X0,295X0,046",
      full: 1766,
      focco: 1932,
      diff: 166
    },
    {
      item: "85594.67929",
      desc: "VOL CX CADEIRA BONNA C/2 0,580X0,440X0,365",
      full: 348,
      focco: 493,
      diff: 145
    },
    {
      item: "97189.99485",
      desc: "VOL CX GR SUAVITA 6PTS COSTAS 2,185X0,905X0,010",
      full: 735,
      focco: 880,
      diff: 145
    },
    {
      item: "308",
      desc: "VOL CX ESPELHO C/4 ESP 900X300X3 C/8 SUP CROMADO 0,960X0,360X0,036",
      full: 834,
      focco: 978,
      diff: 144
    },
    {
      item: "2085.12720",
      desc: "VOL CX GR 4 PTS ALONZO LAT/DIV 2,315X0,460X0,075",
      full: 433,
      focco: 569,
      diff: 136
    }
  ]
};
