/* Exportação Excel do comparativo Full × Focco — gera um .xlsx com:
   - Aba Resumo: indicadores gerais
   - Aba Itens: relação COMPLETA de todos os itens com Saldo Full, Focco,
     Diferença, Reservados e Disponíveis
   - Aba Reservados: itens reservados (se houver dados)
   Carrega o exceljs só no clique para não pesar o bundle. */

import type { SaldoComparativo } from "@/data/saldo-comparativo";
import type { VideoReservados } from "@/components/VideoResumoDashboard";

export async function exportarExcelSaldo(
  comparativo: SaldoComparativo,
  reservados?: VideoReservados | null,
) {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "Lopas · Painel CD";
  wb.created = new Date();

  const HEADER_FONT = { bold: true, color: { argb: "FFFFFFFF" } };
  const HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1E3A5F" } };
  const TOTAL_FONT = { bold: true };

  /* --- Aba 1: Resumo --- */
  const resumo = wb.addWorksheet("Resumo");
  resumo.columns = [
    { header: "Indicador", key: "ind", width: 32 },
    { header: "Valor", key: "val", width: 22 },
  ];
  resumo.getRow(1).font = HEADER_FONT;
  resumo.getRow(1).fill = HEADER_FILL;

  const c = comparativo.comparativo;
  const totalItens = c.itensEmComum + c.itensSoFull + c.itensSoFocco;

  const linhasResumo: [string, string | number][] = [
    ["Data-base", comparativo.dataBase],
    ["", ""],
    ["Full — itens", comparativo.full.itens],
    ["Full — saldo total", comparativo.full.saldo],
    ["", ""],
    ["Focco — itens", comparativo.focco.itens],
    ["Focco — saldo total", comparativo.focco.saldo],
    ["Focco — valor (R$)", comparativo.focco.valor],
    ["", ""],
    ["Itens em comum", c.itensEmComum],
    ["Itens só Full", c.itensSoFull],
    ["Itens só Focco", c.itensSoFocco],
    ["Itens exatos", c.qtdExata],
    ["Itens com diferença", c.qtdDiferenca],
    ["Acuracidade (%)", c.pctAcuracia],
    ["Diferença total de saldo", comparativo.alertas.diferencaTotal],
    ["", ""],
    ["Reservados — quantidade", reservados?.totalQtd ?? "—"],
    ["Reservados — tonelagem", reservados?.totalTon ?? "—"],
    ["Reservados — valor (R$)", reservados?.totalValor ?? "—"],
    ["Reservados — % do saldo", reservados?.pctQtd ?? "—"],
  ];
  for (const [ind, val] of linhasResumo) {
    resumo.addRow({ ind, val });
  }

  /* --- Aba 2: Itens (relação completa) --- */
  const itens = wb.addWorksheet("Itens");
  itens.columns = [
    { header: "Item", key: "item", width: 18 },
    { header: "Descrição", key: "desc", width: 60 },
    { header: "Situação", key: "sit", width: 14 },
    { header: "Saldo Full", key: "full", width: 14 },
    { header: "Saldo Focco", key: "focco", width: 14 },
    { header: "Diferença", key: "diff", width: 14 },
    { header: "Reservados", key: "reserv", width: 14 },
    { header: "Disponíveis", key: "disp", width: 14 },
  ];
  itens.getRow(1).font = HEADER_FONT;
  itens.getRow(1).fill = HEADER_FILL;

  const SIT_LABEL: Record<string, string> = {
    exato: "Exato",
    diferenca: "Diferença",
    "so-full": "Só Full",
    "so-focco": "Só Focco",
  };

  const todos = comparativo.todosItens ?? [];
  for (const it of todos) {
    itens.addRow({
      item: it.item,
      desc: it.desc,
      sit: SIT_LABEL[it.situacao] ?? it.situacao,
      full: it.full,
      focco: it.focco,
      diff: it.diff,
      reserv: it.reservados,
      disp: it.disponiveis,
    });
  }

  /* Linha de totais com fórmula SUM */
  const lastRow = itens.rowCount;
  itens.addRow({
    item: "Total",
    desc: "",
    sit: "",
    full: { formula: `SUM(D2:D${lastRow})` },
    focco: { formula: `SUM(E2:E${lastRow})` },
    diff: { formula: `SUM(F2:F${lastRow})` },
    reserv: { formula: `SUM(G2:G${lastRow})` },
    disp: { formula: `SUM(H2:H${lastRow})` },
  });
  itens.getRow(lastRow + 1).font = TOTAL_FONT;

  /* Filtros automáticos nas colunas */
  itens.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: lastRow, column: 8 },
  };

  /* --- Aba 3: Reservados (se houver dados) --- */
  if (reservados?.topItens?.length) {
    const res = wb.addWorksheet("Reservados");
    res.columns = [
      { header: "Código", key: "cod", width: 14 },
      { header: "Descrição", key: "desc", width: 55 },
      { header: "Qtd. Reservada", key: "qtd", width: 16 },
      { header: "Peso Reservado (kg)", key: "peso", width: 18 },
      { header: "Valor Reservado (R$)", key: "valor", width: 20 },
      { header: "Saldo Atual", key: "saldo", width: 14 },
      { header: "% Reservado", key: "pct", width: 14 },
    ];
    res.getRow(1).font = HEADER_FONT;
    res.getRow(1).fill = HEADER_FILL;

    for (const it of reservados.topItens) {
      res.addRow({
        cod: it.cod,
        desc: it.desc,
        qtd: it.qtdReservada,
        peso: it.pesoReservado,
        valor: it.valorReservado,
        saldo: it.saldoAtual,
        pct: it.pctReservado,
      });
    }
  }

  /* Download */
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `saldo-full-focco-${comparativo.dataBase.replace(/\//g, "-")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
