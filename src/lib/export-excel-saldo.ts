/* Exportação Excel do comparativo Full × Focco — gera um .xlsx com o saldo
   Focco, o saldo Full e os reservados, mais a lista de divergências.
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

  /* --- Aba 1: Resumo --- */
  const resumo = wb.addWorksheet("Resumo");
  resumo.columns = [
    { header: "Indicador", key: "ind", width: 32 },
    { header: "Valor", key: "val", width: 22 },
  ];
  resumo.getRow(1).font = { bold: true, color: "FFFFFF" };
  resumo.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };

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

  /* --- Aba 2: Divergências --- */
  const div = wb.addWorksheet("Divergências");
  div.columns = [
    { header: "Item", key: "item", width: 18 },
    { header: "Descrição", key: "desc", width: 60 },
    { header: "Saldo Full", key: "full", width: 14 },
    { header: "Saldo Focco", key: "focco", width: 14 },
    { header: "Diferença", key: "diff", width: 14 },
  ];
  div.getRow(1).font = { bold: true, color: "FFFFFF" };
  div.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };

  for (const it of comparativo.topDiferencas) {
    div.addRow({ item: it.item, desc: it.desc, full: it.full, focco: it.focco, diff: it.diff });
  }

  /* Linha de totais com fórmula SUM */
  const lastRow = div.rowCount;
  div.addRow({
    item: "Total",
    desc: "",
    full: { formula: `SUM(C2:C${lastRow})` },
    focco: { formula: `SUM(D2:D${lastRow})` },
    diff: { formula: `SUM(E2:E${lastRow})` },
  });
  div.getRow(lastRow + 1).font = { bold: true };

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
    res.getRow(1).font = { bold: true, color: "FFFFFF" };
    res.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };

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
