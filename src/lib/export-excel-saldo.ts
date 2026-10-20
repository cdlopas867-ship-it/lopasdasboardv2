/* Exportação Excel do comparativo Full × Focco — gera um .xlsx com:
   - Aba Sob Risco: itens reservados que o Full/Focco não têm saldo para
     atender (se houver)
   - Aba Endereços: os endereços de cada item sob risco no relatório do
     Full (WF0112), com a quantidade em cada um
   Carrega o exceljs só no clique para não pesar o bundle. */

import type { SaldoComparativo } from "@/data/saldo-comparativo";

export async function exportarExcelSaldo(comparativo: SaldoComparativo) {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "Lopas · Painel CD";
  wb.created = new Date();

  const HEADER_FONT = { bold: true, color: { argb: "FFFFFFFF" } };
  const HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1E3A5F" } };
  const TOTAL_FONT = { bold: true };

  /* --- Aba 1: Itens sob risco (reservados que o Full/Focco não cobrem) --- */
  const MOTIVO_RISCO: Record<string, string> = {
    "sem-full": "Reservado sem saldo no Full",
    "full-insuficiente": "Full não cobre a reserva",
    "focco-insuficiente": "Reserva maior que o saldo no Focco",
  };

  const riscos = (comparativo.itensRisco ?? []).filter((it) => it.risco && it.reservados > 0);
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

  const coresMotivo: Record<string, { color: { argb: string } }> = {
    "sem-full": { color: { argb: "FFDC2626" } },
    "full-insuficiente": { color: { argb: "FFC2410C" } },
    "focco-insuficiente": { color: { argb: "FFB45309" } },
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
  if (lastRisco > 1) {
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
  }

  ris.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: lastRisco, column: 8 },
  };

  /* --- Aba 2: Endereços dos itens sob risco (relatório WF0112 do Full) --- */
  const end = wb.addWorksheet("Endereços");
  end.columns = [
    { header: "Item", key: "item", width: 18 },
    { header: "Descrição", key: "desc", width: 60 },
    { header: "Endereço", key: "endereco", width: 22 },
    { header: "Qtd. no Endereço", key: "qtd", width: 17 },
    { header: "Qtd. Reservada", key: "reserv", width: 15 },
  ];
  end.getRow(1).font = HEADER_FONT;
  end.getRow(1).fill = HEADER_FILL;

  for (const it of riscos) {
    const lista = it.enderecos ?? [];
    if (lista.length === 0) {
      /* Sem endereço no relatório do Full (saldo Full zero) — mantém o item
         visível na aba para fechar com a lista de sob risco. */
      end.addRow({ item: it.item, desc: it.desc, endereco: "—", qtd: 0, reserv: it.reservados });
      continue;
    }
    for (const e of lista) {
      end.addRow({
        item: it.item,
        desc: it.desc,
        endereco: e.endereco,
        qtd: e.qtd,
        reserv: it.reservados,
      });
    }
  }

  const lastEnd = end.rowCount;
  if (lastEnd > 1) {
    end.addRow({
      item: "Total",
      desc: "",
      endereco: "",
      qtd: { formula: `SUM(D2:D${lastEnd})` },
      reserv: "",
    });
    end.getRow(lastEnd + 1).font = TOTAL_FONT;
  }

  end.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: lastEnd, column: 5 },
  };

  /* Download */
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sob-risco-${comparativo.dataBase.replace(/\//g, "-")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
