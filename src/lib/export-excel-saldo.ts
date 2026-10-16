/* Exporta o .xlsx do Controle de Saldo — Full × Focco.
   O exceljs é carregado só no clique (import dinâmico) para não pesar o bundle. */

import type { SaldoComparativo } from "@/data/saldo-comparativo";

type Cell = { valor: string | number; bold?: boolean; cor?: string; fill?: string };

type WSCell = {
  value: string | number;
  font?: Record<string, unknown>;
  fill?: Record<string, unknown>;
  alignment?: Record<string, unknown>;
  border?: Record<string, unknown>;
};

type WS = {
  getColumn: (i: number) => { width: number };
  getRow: (i: number) => { height: number };
  mergeCells: (r1: number, c1: number, r2: number, c2: number) => void;
  getCell: (r: number, c: number) => WSCell;
};

function estilizar(ws: WS, linha: number, coluna: number, cell: Cell) {
  const c = ws.getCell(linha, coluna);
  c.value = cell.valor;
  c.font = { name: "Calibri", size: 11, bold: cell.bold ?? false, color: { argb: cell.cor ?? "FF111111" } };
  if (cell.fill) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: cell.fill } };
  c.alignment = { vertical: "middle", horizontal: typeof cell.valor === "number" ? "right" : "left" };
  c.border = {
    top: { style: "thin", color: { argb: "FFD0D0D0" } },
    bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
    left: { style: "thin", color: { argb: "FFD0D0D0" } },
    right: { style: "thin", color: { argb: "FFD0D0D0" } },
  };
}

export async function exportarExcelSaldo(d: SaldoComparativo): Promise<void> {
  const modulo = (await import("exceljs")) as unknown as {
    Workbook?: new () => { addWorksheet: (nome: string, opts?: { views?: { state: string }[] }) => WS; xlsx: { writeBuffer: () => Promise<ArrayBuffer> } };
    default?: { Workbook?: new () => { addWorksheet: (nome: string, opts?: { views?: { state: string }[] }) => WS; xlsx: { writeBuffer: () => Promise<ArrayBuffer> } } };
  };
  const WorkbookCtor = modulo.Workbook ?? modulo.default?.Workbook;
  if (!WorkbookCtor) throw new Error("Biblioteca de Excel indisponível");

  const wb = new WorkbookCtor();
  wb.creator = "CD Lopas · Controle de Saldo";
  wb.created = new Date();

  const c = d.comparativo;
  const totalItens = c.itensEmComum + c.itensSoFull + c.itensSoFocco;

  /* ── Aba única: Saldo Full x Focco ── */
  const ws = wb.addWorksheet("Saldo Full x Focco", { views: [{ state: "frozen" }] });
  ws.getColumn(1).width = 42;
  ws.getColumn(2).width = 22;
  ws.getColumn(3).width = 22;
  ws.getColumn(4).width = 22;
  ws.getColumn(5).width = 22;

  let row = 1;
  ws.mergeCells(row, 1, row, 5);
  estilizar(ws, row, 1, { valor: "CD LOPAS · CONTROLE DE SALDO — FULL × FOCCO", bold: true, cor: "FFFFFFFF", fill: "FF1B4332" });
  ws.getRow(row).height = 28;
  row++;

  ws.mergeCells(row, 1, row, 5);
  estilizar(ws, row, 1, { valor: `Data-base: ${d.dataBase}`, cor: "FF666666" });
  row += 2;

  /* Indicadores gerais */
  const indicadores: [string, string | number][] = [
    ["Itens em comum", c.itensEmComum],
    ["Itens só Full", c.itensSoFull],
    ["Itens só Focco", c.itensSoFocco],
    ["Total de itens", totalItens],
    ["Itens com saldo exato", c.qtdExata],
    ["Itens com diferença", c.qtdDiferenca],
    ["Acuracidade (%)", `${c.pctAcuracia.toFixed(1)}%`],
  ];
  for (const [label, val] of indicadores) {
    estilizar(ws, row, 1, { valor: label, bold: true });
    estilizar(ws, row, 2, { valor: val });
    row++;
  }
  row++;

  /* Full e Focco */
  ws.mergeCells(row, 1, row, 5);
  estilizar(ws, row, 1, { valor: "Sistemas", bold: true, cor: "FFFFFFFF", fill: "FF2D6A4F" });
  row++;
  for (const [label, val] of [
    ["Full (estoque 112) — itens", d.full.itens],
    ["Full (estoque 112) — saldo", d.full.saldo],
    ["Focco (estoque 001) — itens", d.focco.itens],
    ["Focco (estoque 001) — saldo", d.focco.saldo],
    ["Focco (estoque 001) — valor (R$)", d.focco.valor],
  ] as [string, number][]) {
    estilizar(ws, row, 1, { valor: label });
    estilizar(ws, row, 2, { valor: val });
    row++;
  }
  row++;

  /* Legenda */
  ws.mergeCells(row, 1, row, 5);
  estilizar(ws, row, 1, { valor: "Legenda — distribuição dos itens", bold: true, cor: "FFFFFFFF", fill: "FF2D6A4F" });
  row++;
  const headers = ["Situação", "Itens", "Ton. Full", "Ton. Focco", "%"];
  for (let i = 0; i < headers.length; i++) estilizar(ws, row, i + 1, { valor: headers[i], bold: true, fill: "FFE8F5E9" });
  row++;
  const linhas: [string, number, number | null, number | null, number][] = [
    ["Exato", c.qtdExata, c.tonFullExato, c.tonExato, (totalItens > 0 ? (c.qtdExata / totalItens) * 100 : 0)],
    ["Diferença", c.qtdDiferenca, c.tonFullDiferenca, c.tonDiferenca, (totalItens > 0 ? (c.qtdDiferenca / totalItens) * 100 : 0)],
    ["Só Full", c.itensSoFull, c.tonFullSoFull, null, (totalItens > 0 ? (c.itensSoFull / totalItens) * 100 : 0)],
    ["Só Focco", c.itensSoFocco, null, c.tonSoFocco, (totalItens > 0 ? (c.itensSoFocco / totalItens) * 100 : 0)],
  ];
  for (const [label, itens, tonFull, tonFocco, pctVal] of linhas) {
    estilizar(ws, row, 1, { valor: label });
    estilizar(ws, row, 2, { valor: itens });
    estilizar(ws, row, 3, { valor: tonFull == null ? "—" : tonFull });
    estilizar(ws, row, 4, { valor: tonFocco == null ? "—" : tonFocco });
    estilizar(ws, row, 5, { valor: `${pctVal.toFixed(1)}%` });
    row++;
  }
  const tonTotalFull = c.tonFullExato + c.tonFullDiferenca + c.tonFullSoFull;
  const tonTotalFocco = c.tonExato + c.tonDiferenca + c.tonSoFocco;
  estilizar(ws, row, 1, { valor: "Total", bold: true, fill: "FFF0F0F0" });
  estilizar(ws, row, 2, { valor: totalItens, bold: true, fill: "FFF0F0F0" });
  estilizar(ws, row, 3, { valor: tonTotalFull, bold: true, fill: "FFF0F0F0" });
  estilizar(ws, row, 4, { valor: tonTotalFocco, bold: true, fill: "FFF0F0F0" });
  estilizar(ws, row, 5, { valor: "100%", bold: true, fill: "FFF0F0F0" });
  row += 2;

  /* Alertas */
  ws.mergeCells(row, 1, row, 5);
  estilizar(ws, row, 1, { valor: "Alertas", bold: true, cor: "FFFFFFFF", fill: "FF2D6A4F" });
  row++;
  for (const [label, val] of [
    ["Itens só Full", d.alertas.soFull],
    ["Itens só Focco", d.alertas.soFocco],
    ["Diferença total de saldo", d.alertas.diferencaTotal],
  ] as [string, number][]) {
    estilizar(ws, row, 1, { valor: label });
    estilizar(ws, row, 2, { valor: val });
    row++;
  }
  row += 2;

  /* Maiores divergências */
  ws.mergeCells(row, 1, row, 5);
  estilizar(ws, row, 1, { valor: "Maiores divergências", bold: true, cor: "FFFFFFFF", fill: "FF2D6A4F" });
  row++;
  const divHeaders = ["Item", "Descrição", "Full", "Focco", "Diferença"];
  for (let i = 0; i < divHeaders.length; i++) estilizar(ws, row, i + 1, { valor: divHeaders[i], bold: true, fill: "FFE8F5E9" });
  row++;
  for (const it of d.topDiferencas) {
    estilizar(ws, row, 1, { valor: it.item });
    estilizar(ws, row, 2, { valor: it.desc });
    estilizar(ws, row, 3, { valor: it.full });
    estilizar(ws, row, 4, { valor: it.focco });
    estilizar(ws, row, 5, { valor: it.diff });
    row++;
  }

  /* Download */
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `LOPAS-saldo-full-x-focco-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
