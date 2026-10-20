/* Exportação Excel do comparativo Full × Focco — gera um .xlsx com:
   - Aba Resumo: indicadores gerais
   - Aba Itens: relação COMPLETA de todos os itens com Saldo Full, Focco,
     Diferença, Reservados e Disponíveis
   - Aba Sob Risco: itens reservados que o Full/Focco não têm saldo para
     atender (se houver)
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
    ["", ""],
    ["Itens reservados sob risco", comparativo.risco?.itens ?? 0],
    ["Reservados sob risco — quantidade", comparativo.risco?.qtdReservada ?? 0],
    ["Reservados sob risco — tonelagem", comparativo.risco?.tonReservada ?? 0],
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

  /* --- Aba 3: Itens sob risco (reservados que o Full/Focco não cobrem) --- */
  const MOTIVO_RISCO: Record<string, string> = {
    "sem-full": "Reservado sem saldo no Full",
    "full-insuficiente": "Full não cobre a reserva",
    "focco-insuficiente": "Reserva maior que o saldo no Focco",
  };

  const riscos = (comparativo.itensRisco ?? []).filter((it) => it.risco && it.reservados > 0);
  if (riscos.length > 0) {
    const ris = wb.addWorksheet("Sob Risco");
    ris.columns = [
      { header: "Item", key: "item", width: 18 },
      { header: "Descrição", key: "desc", width: 60 },
      { header: "Motivo do risco", key: "motivo", width: 30 },
      { header: "Qtd. Reservada", key: "reserv", width: 15 },
      { header: "Ton. Reservada", key: "ton", width: 15 },
      { header: "Saldo Focco (001)", key: "focco", width: 17 },
      { header: "Saldo Full (112)", key: "full", width: 16 },
      { header: "Disponível Focco", key: "disp", width: 16 },
    ];
    ris.getRow(1).font = HEADER_FONT;
    ris.getRow(1).fill = HEADER_FILL;

    const coresMotivo: Record<string, { font: { color: { argb: string } } }> = {
      "sem-full": { font: { color: { argb: "FFDC2626" } } },
      "full-insuficiente": { font: { color: { argb: "FFC2410C" } } },
      "focco-insuficiente": { font: { color: { argb: "FFB45309" } } },
    };

    for (const it of riscos) {
      const row = ris.addRow({
        item: it.item,
        desc: it.desc,
        motivo: MOTIVO_RISCO[it.risco!] ?? it.risco,
        reserv: it.reservados,
        ton: it.tonReservada ?? 0,
        focco: it.focco,
        full: it.full,
        disp: it.disponiveis,
      });
      /* Motivo em cor própria (risco em vermelho/âmbar) e saldos em vermelho
         quando o Full não tem nada do item. */
      row.getCell("motivo").font = coresMotivo[it.risco!] ?? TOTAL_FONT;
      if (it.full <= 0) {
        row.getCell("full").font = { bold: true, color: { argb: "FFDC2626" } };
      }
    }

    /* Linha de totais com fórmula SUM */
    const lastRisco = ris.rowCount;
    ris.addRow({
      item: "Total",
      desc: "",
      motivo: "",
      reserv: { formula: `SUM(D2:D${lastRisco})` },
      ton: { formula: `SUM(E2:E${lastRisco})` },
      focco: { formula: `SUM(F2:F${lastRisco})` },
      full: { formula: `SUM(G2:G${lastRisco})` },
      disp: { formula: `SUM(H2:H${lastRisco})` },
    });
    ris.getRow(lastRisco + 1).font = TOTAL_FONT;

    ris.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: lastRisco, column: 8 },
    };
  }

  /* --- Aba 4: Reservados (se houver dados) --- */
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
