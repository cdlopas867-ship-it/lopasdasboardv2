/* Exporta o comparativo de saldo Full × Focco para um .xlsx simples. */
import type { SaldoComparativo } from "@/data/saldo-comparativo";

export async function exportarSaldoComparativoExcel(d: SaldoComparativo) {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "CD Lopas";
  wb.created = new Date();

  const ws = wb.addWorksheet("Saldo Full x Focco", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws.columns = [
    { header: "Situação", key: "situacao", width: 14 },
    { header: "Itens", key: "itens", width: 10 },
    { header: "Ton. Full", key: "tonFull", width: 12 },
    { header: "Ton. Focco", key: "tonFocco", width: 12 },
    { header: "%", key: "pct", width: 8 },
  ];

  const c = d.comparativo;
  const total = c.itensEmComum + c.itensSoFull + c.itensSoFocco;
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  const linhas = [
    { situacao: "Exato", itens: c.qtdExata, tonFull: c.tonFullExato, tonFocco: c.tonExato, pct: pct(c.qtdExata) },
    { situacao: "Diferença", itens: c.qtdDiferenca, tonFull: c.tonFullDiferenca, tonFocco: c.tonDiferenca, pct: pct(c.qtdDiferenca) },
    { situacao: "Só Full", itens: c.itensSoFull, tonFull: c.tonFullSoFull, tonFocco: null, pct: pct(c.itensSoFull) },
    { situacao: "Só Focco", itens: c.itensSoFocco, tonFull: null, tonFocco: c.tonSoFocco, pct: pct(c.itensSoFocco) },
  ];

  linhas.forEach((l) => {
    const row = ws.addRow(l);
    row.getCell(5).numFmt = '0,0"%"';
    row.getCell(2).numFmt = "#,##0";
    row.getCell(3).numFmt = "#,##0.0";
    row.getCell(4).numFmt = "#,##0.0";
  });

  /* Total */
  ws.addRow({
    situacao: "Total",
    itens: total,
    tonFull: c.tonFullExato + c.tonFullDiferenca + c.tonFullSoFull,
    tonFocco: c.tonExato + c.tonDiferenca + c.tonSoFocco,
    pct: 100,
  }).font = { bold: true };

  /* Indicadores */
  ws.addRow([]);
  ws.addRow(["Indicadores"]).font = { bold: true };
  ws.addRow(["Full · Itens", d.full.itens]);
  ws.addRow(["Full · Saldo", d.full.saldo]);
  ws.addRow(["Focco · Itens", d.focco.itens]);
  ws.addRow(["Focco · Saldo", d.focco.saldo]);
  ws.addRow(["Focco · Valor", d.focco.valor]).getCell(2).numFmt = '"R$" #,##0.00';
  ws.addRow(["Acuracidade", `${c.pctAcuracia}%`]);
  ws.addRow(["Itens em comum", c.itensEmComum]);

  /* Alertas */
  ws.addRow([]);
  ws.addRow(["Alertas"]).font = { bold: true };
  ws.addRow(["Só Full", d.alertas.soFull]);
  ws.addRow(["Só Focco", d.alertas.soFocco]);
  ws.addRow(["Diferença de saldo", d.alertas.diferencaTotal]);

  /* Maiores divergências */
  ws.addRow([]);
  ws.addRow(["Maiores divergências"]).font = { bold: true };
  const wsDiv = wb.addWorksheet("Divergências");
  wsDiv.columns = [
    { header: "Item", key: "item", width: 16 },
    { header: "Descrição", key: "desc", width: 60 },
    { header: "Full", key: "full", width: 10 },
    { header: "Focco", key: "focco", width: 10 },
    { header: "Diferença", key: "diff", width: 12 },
  ];
  d.topDiferencas.forEach((it) => wsDiv.addRow(it));

  /* Cabeçalho estilado */
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B4D1B" } };
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  const nome = `Saldo-Full-x-Focco-${d.dataBase.replace(/\//g, "-")}.xlsx`;
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}
