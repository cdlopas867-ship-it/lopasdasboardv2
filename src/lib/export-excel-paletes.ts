/* Exportação Excel analítica da cena "Paletes em Estoque".
   Gera um .xlsx profissional com fórmulas (SUM, divisão para %)
   para fins analíticos. Usa exceljs carregado dinamicamente no clique. */

import type { VideoPaletas } from "@/components/VideoResumoDashboard";

const CORES = {
  P: "33D953",
  M: "337DD9",
  G: "D98E33",
  GG: "A533D9",
};

const VERDE_LOPAS = "76A035";

type ItemExport = {
  item: string;
  desc: string;
  saldo: number;
  paletes: number;
  undPorPalete: number;
  enderecos: string[];
};

export async function exportarExcelPaletes(paletas: VideoPaletas) {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "Painel Lopas";
  wb.created = new Date();

  const tamanhos = paletas?.porTamanho ?? [];
  const itensPorTamanho = paletas?.itensPorTamanho ?? {};

  /* ── Aba Resumo ── */
  const ws = wb.addWorksheet("Resumo", {
    views: [{ showGridLines: false }],
  });

  ws.columns = [
    { width: 14 },
    { width: 14 },
    { width: 12 },
    { width: 12 },
  ];

  // Título
  ws.mergeCells("A1:D1");
  const titulo = ws.getCell("A1");
  titulo.value = "Paletes em Estoque — CD Lopas";
  titulo.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  titulo.alignment = { horizontal: "center", vertical: "middle" };
  titulo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${VERDE_LOPAS}` } };
  ws.getRow(1).height = 28;

  // Subtítulo — data
  ws.mergeCells("A2:D2");
  const sub = ws.getCell("A2");
  const agora = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  sub.value = `Atualizado em ${agora}`;
  sub.font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF888888" } };
  sub.alignment = { horizontal: "center" };

  // Cabeçalho da tabela (linha 4)
  const headers = ["Tamanho", "Paletes", "Itens", "%"];
  const rowHead = 4;
  headers.forEach((h, i) => {
    const cell = ws.getCell(rowHead, i + 1);
    cell.value = h;
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: i === 0 ? "left" : "right", vertical: "middle" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF333333" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FF555555" } },
      bottom: { style: "thin", color: { argb: "FF555555" } },
      left: { style: "thin", color: { argb: "FF555555" } },
      right: { style: "thin", color: { argb: "FF555555" } },
    };
  });

  // Linhas de dados
  const firstDataRow = rowHead + 1;
  tamanhos.forEach((t, i) => {
    const r = firstDataRow + i;
    const cor = CORES[t.tamanho as keyof typeof CORES] ?? "6B7280";

    const cTam = ws.getCell(r, 1);
    cTam.value = t.tamanho;
    cTam.font = { name: "Calibri", size: 10, bold: true, color: { argb: `FF${cor}` } };

    const cPal = ws.getCell(r, 2);
    cPal.value = t.paletes;
    cPal.numFmt = "#,##0";
    cPal.alignment = { horizontal: "right" };

    const cIte = ws.getCell(r, 3);
    cIte.value = t.itens;
    cIte.numFmt = "#,##0";
    cIte.alignment = { horizontal: "right" };

    // % com fórmula: =B{r}/B{totalRow}
    const totalRow = firstDataRow + tamanhos.length;
    const cPct = ws.getCell(r, 4);
    cPct.value = { formula: `B${r}/B${totalRow}` };
    cPct.numFmt = "0.0%";
    cPct.alignment = { horizontal: "right" };
    cPct.font = { name: "Calibri", size: 10, bold: true, color: { argb: `FF${cor}` } };

    // Bordas
    for (let col = 1; col <= 4; col++) {
      ws.getCell(r, col).border = {
        top: { style: "hair", color: { argb: "FFCCCCCC" } },
        bottom: { style: "hair", color: { argb: "FFCCCCCC" } },
      };
    }
  });

  // Linha Total com fórmulas SUM
  const totalRow = firstDataRow + tamanhos.length;
  const cTotalLabel = ws.getCell(totalRow, 1);
  cTotalLabel.value = "Total";
  cTotalLabel.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  cTotalLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${VERDE_LOPAS}` } };

  const cTotalPal = ws.getCell(totalRow, 2);
  cTotalPal.value = { formula: `SUM(B${firstDataRow}:B${totalRow - 1})` };
  cTotalPal.numFmt = "#,##0";
  cTotalPal.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  cTotalPal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${VERDE_LOPAS}` } };
  cTotalPal.alignment = { horizontal: "right" };

  const cTotalIte = ws.getCell(totalRow, 3);
  cTotalIte.value = { formula: `SUM(C${firstDataRow}:C${totalRow - 1})` };
  cTotalIte.numFmt = "#,##0";
  cTotalIte.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  cTotalIte.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${VERDE_LOPAS}` } };
  cTotalIte.alignment = { horizontal: "right" };

  const cTotalPct = ws.getCell(totalRow, 4);
  cTotalPct.value = 1;
  cTotalPct.numFmt = "0.0%";
  cTotalPct.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  cTotalPct.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${VERDE_LOPAS}` } };
  cTotalPct.alignment = { horizontal: "right" };

  for (let col = 1; col <= 4; col++) {
    ws.getCell(totalRow, col).border = {
      top: { style: "thin", color: { argb: `FF${VERDE_LOPAS}` } },
      bottom: { style: "thin", color: { argb: `FF${VERDE_LOPAS}` } },
    };
  }

  /* ── Aba detalhada por tamanho ── */
  for (const t of tamanhos) {
    const itens: ItemExport[] = itensPorTamanho[t.tamanho] ?? [];
    if (itens.length === 0) continue;

    const sheetName = `Tamanho ${t.tamanho}`.slice(0, 31);
    const wsDet = wb.addWorksheet(sheetName, {
      views: [{ showGridLines: false }],
    });

    wsDet.columns = [
      { width: 16 },
      { width: 48 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 40 },
    ];

    // Título
    wsDet.mergeCells("A1:F1");
    const tDet = wsDet.getCell("A1");
    tDet.value = `Itens — Tamanho ${t.tamanho}`;
    const cor = CORES[t.tamanho as keyof typeof CORES] ?? "6B7280";
    tDet.font = { name: "Calibri", size: 14, bold: true, color: { argb: `FF${cor}` } };
    tDet.alignment = { horizontal: "center", vertical: "middle" };
    wsDet.getRow(1).height = 24;

    // Cabeçalho
    const detHeaders = ["Item", "Descrição", "Saldo", "Und/Palete", "Paletes", "Endereços"];
    const detHeadRow = 3;
    detHeaders.forEach((h, i) => {
      const cell = wsDet.getCell(detHeadRow, i + 1);
      cell.value = h;
      cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: i <= 1 ? "left" : "right", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF333333" } };
      cell.border = {
        top: { style: "thin", color: { argb: "FF555555" } },
        bottom: { style: "thin", color: { argb: "FF555555" } },
      };
    });

    // Dados
    const detFirstRow = detHeadRow + 1;
    itens.forEach((it, i) => {
      const r = detFirstRow + i;

      wsDet.getCell(r, 1).value = it.item;
      wsDet.getCell(r, 1).font = { name: "Calibri", size: 10, bold: true };

      wsDet.getCell(r, 2).value = it.desc;
      wsDet.getCell(r, 2).font = { name: "Calibri", size: 9 };
      wsDet.getCell(r, 2).alignment = { wrapText: false };

      const cSaldo = wsDet.getCell(r, 3);
      cSaldo.value = it.saldo;
      cSaldo.numFmt = "#,##0";
      cSaldo.alignment = { horizontal: "right" };

      const cUnd = wsDet.getCell(r, 4);
      cUnd.value = it.undPorPalete;
      cUnd.numFmt = "#,##0";
      cUnd.alignment = { horizontal: "right" };

      // Paletes com fórmula: =CEILING(C{r}/D{r},1) — arredonda para cima
      const cPal = wsDet.getCell(r, 5);
      cPal.value = { formula: `ROUNDUP(C${r}/D${r},0)` };
      cPal.numFmt = "#,##0";
      cPal.alignment = { horizontal: "right" };
      cPal.font = { name: "Calibri", size: 10, bold: true, color: { argb: `FF${cor}` } };

      // Endereços
      const cEnd = wsDet.getCell(r, 6);
      cEnd.value = it.enderecos.join(", ");
      cEnd.font = { name: "Calibri", size: 9 };
      cEnd.alignment = { wrapText: true, vertical: "top" };

      for (let col = 1; col <= 6; col++) {
        wsDet.getCell(r, col).border = {
          top: { style: "hair", color: { argb: "FFEEEEEE" } },
          bottom: { style: "hair", color: { argb: "FFEEEEEE" } },
        };
      }
    });

    // Total com fórmulas SUM
    const detTotalRow = detFirstRow + itens.length;
    wsDet.getCell(detTotalRow, 1).value = "Total";
    wsDet.getCell(detTotalRow, 1).font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    wsDet.getCell(detTotalRow, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${cor}` } };

    const cTS = wsDet.getCell(detTotalRow, 3);
    cTS.value = { formula: `SUM(C${detFirstRow}:C${detTotalRow - 1})` };
    cTS.numFmt = "#,##0";
    cTS.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cTS.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${cor}` } };
    cTS.alignment = { horizontal: "right" };

    const cTP = wsDet.getCell(detTotalRow, 5);
    cTP.value = { formula: `SUM(E${detFirstRow}:E${detTotalRow - 1})` };
    cTP.numFmt = "#,##0";
    cTP.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cTP.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${cor}` } };
    cTP.alignment = { horizontal: "right" };

    for (let col = 1; col <= 6; col++) {
      wsDet.getCell(detTotalRow, col).border = {
        top: { style: "thin", color: { argb: `FF${cor}` } },
        bottom: { style: "thin", color: { argb: `FF${cor}` } },
      };
    }

    // Auto-filtro
    wsDet.autoFilter = {
      from: { row: detHeadRow, column: 1 },
      to: { row: detTotalRow - 1, column: 6 },
    };
  }

  /* ── Download ── */
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Paletes-Estoque-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
