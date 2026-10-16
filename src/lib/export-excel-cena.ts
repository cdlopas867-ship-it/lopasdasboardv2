/* Exporta um .xlsx com os dados da cena ativa do painel.
   O exceljs é carregado só no clique (import dinâmico) para não pesar o bundle. */

import type { VideoResumoProps } from "@/components/VideoResumoDashboard";
import type { VideoForaDeLinha } from "@/components/CenasApresentacao";
import type { SaldoComparativo } from "@/data/saldo-comparativo";
import type { ItemForaDeLinha, PosicaoEstoque } from "@/data/fora-de-linha";

type WS = {
  getColumn: (i: number) => { width: number };
  getRow: (i: number) => { height: number };
  mergeCells: (r1: number, c1: number, r2: number, c2: number) => void;
  getCell: (r: number, c: number) => {
    value: string | number;
    font?: Record<string, unknown>;
    fill?: Record<string, unknown>;
    alignment?: Record<string, unknown>;
    border?: Record<string, unknown>;
  };
};

const VERDE = "FF2F4415";
const VERDE_MEDIO = "FF4A6B20";
const BRANCO = "FFFFFFFF";
const BORDA = { style: "thin" as const, color: { argb: "FFD0D0D0" } };

function titulo(ws: WS, texto: string, colunas: number, row: number) {
  ws.mergeCells(row, 1, row, colunas);
  const c = ws.getCell(row, 1);
  c.value = texto;
  c.font = { name: "Calibri", size: 14, bold: true, color: { argb: BRANCO } };
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VERDE } };
  c.alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(row).height = 26;
}

function header(ws: WS, row: number, vals: string[]) {
  for (let i = 0; i < vals.length; i++) {
    const c = ws.getCell(row, i + 1);
    c.value = vals[i];
    c.font = { name: "Calibri", size: 10, bold: true, color: { argb: VERDE_MEDIO } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9EFDC" } };
    c.alignment = { vertical: "middle", horizontal: "left" };
    c.border = { top: BORDA, bottom: BORDA, left: BORDA, right: BORDA };
  }
}

function linha(ws: WS, row: number, vals: (string | number)[]) {
  for (let i = 0; i < vals.length; i++) {
    const c = ws.getCell(row, i + 1);
    c.value = vals[i];
    c.font = { name: "Calibri", size: 10, color: { argb: "FF1F2418" } };
    c.alignment = { vertical: "middle", horizontal: typeof vals[i] === "number" ? "right" : "left" };
    c.border = { top: BORDA, bottom: BORDA, left: BORDA, right: BORDA };
  }
}

function setLarguras(ws: WS, larguras: number[]) {
  for (let i = 0; i < larguras.length; i++) ws.getColumn(i + 1).width = larguras[i];
}

const NOMES_CENAS = [
  "Estoque × Previsto",
  "Ocupação do CD",
  "Recebimento por Turno",
  "Paletes em Estoque",
  "Produção da Semana",
  "Avarias",
  "Pendências de Produção",
  "Reservas",
  "Fora de Linha",
  "Tonelagem do Estoque",
  "Saldo Full × Focco",
];

export async function exportarExcelCena(
  cena: number,
  dados: VideoResumoProps,
): Promise<void> {
  /* Cena 10 (Saldo) tem exportador próprio */
  if (cena === 10 && dados.saldoComparativo) {
    const { exportarExcelSaldo } = await import("@/lib/export-excel-saldo");
    return exportarExcelSaldo(dados.saldoComparativo);
  }

  const modulo = (await import("exceljs")) as unknown as {
    Workbook?: new () => { addWorksheet: (nome: string, opts?: { views?: { state: string }[] }) => WS; xlsx: { writeBuffer: () => Promise<ArrayBuffer> } };
    default?: { Workbook?: new () => { addWorksheet: (nome: string, opts?: { views?: { state: string }[] }) => WS; xlsx: { writeBuffer: () => Promise<ArrayBuffer> } } };
  };
  const WorkbookCtor = modulo.Workbook ?? modulo.default?.Workbook;
  if (!WorkbookCtor) throw new Error("Biblioteca de Excel indisponível");

  const wb = new WorkbookCtor();
  wb.creator = "CD Lopas · Painel de Estoque";
  wb.created = new Date();
  const nomeCena = NOMES_CENAS[cena] ?? `Cena ${cena + 1}`;
  const ws = wb.addWorksheet(nomeCena.slice(0, 28), { views: [{ state: "frozen" }] });

  let row = 1;
  titulo(ws, `CD LOPAS · ${nomeCena.toUpperCase()}`, 6, row);
  row += 2;

  switch (cena) {
    /* ── Cena 0: Estoque × Previsto ── */
    case 0: {
      setLarguras(ws, [32, 22, 22, 22, 22, 22]);
      if (dados.resumo) {
        const r = dados.resumo;
        const resumoLinhas: [string, string | number][] = [
          ["Itens", r.itens], ["Saldo físico", r.saldo], ["Tonelagem (t)", r.ton],
          ["Valor em estoque (R$)", r.valor], ["Valor previsto (R$)", r.previsto],
        ];
        for (const [label, val] of resumoLinhas) { linha(ws, row, [label, val]); row++; }
        row++;
      }
      header(ws, row, ["Indicador", "Valor", "Detalhe"]); row++;
      for (const k of dados.kpis) { linha(ws, row, [k.rotulo, k.valor, k.detalhe ?? ""]); row++; }
      row++;
      header(ws, row, ["Unidade", "Share (%)", "Valor", "Stats"]); row++;
      for (const u of dados.unidades) {
        linha(ws, row, [u.nome, u.share, u.valor, (u.stats ?? []).map((s) => s.join(": ")).join(" · ")]); row++;
      }
      break;
    }

    /* ── Cena 1: Ocupação do CD ── */
    case 1: {
      setLarguras(ws, [28, 14, 14, 14, 14, 14]);
      const o = dados.ocupacao;
      linha(ws, row, ["Ocupação (%)", o.pct]); row++;
      linha(ws, row, ["Endereços ocupados", o.ocupados]); row++;
      linha(ws, row, ["Endereços livres", o.livres]); row++;
      linha(ws, row, ["Endereços bloqueados", o.bloqueados ?? 0]); row++;
      row++;
      if (o.detalhes?.length) {
        header(ws, row, ["Atributo", "Unidade", "CD1", "CD2", "Total"]); row++;
        for (const d of o.detalhes) { linha(ws, row, [d.atributo, d.unidade, d.cd1, d.cd2, d.total]); row++; }
      }
      break;
    }

    /* ── Cena 2: Recebimento por Turno ── */
    case 2: {
      setLarguras(ws, [20, 18, 14, 14, 14, 14]);
      header(ws, row, ["Turno", "Faixa", "Tonelagem", "%"]); row++;
      for (const t of dados.turnos) { linha(ws, row, [t.nome, t.faixa ?? "", t.ton ?? 0, t.pct]); row++; }
      row++;
      if (dados.mensal?.length) {
        header(ws, row, ["Mês", "Recebido (t)", "Carregado (t)"]); row++;
        for (const m of dados.mensal) { linha(ws, row, [m.mes, m.recebido, m.carregado]); row++; }
      }
      break;
    }

    /* ── Cena 3: Paletes em Estoque ── */
    case 3: {
      setLarguras(ws, [20, 18, 18, 18, 18, 18]);
      if (dados.paletas) {
        const p = dados.paletas;
        linha(ws, row, ["Total de paletes", p.totalPaletes]); row++;
        linha(ws, row, ["Total de itens", p.totalItens]); row++;
        row++;
        header(ws, row, ["Tamanho", "Paletes", "Itens", "Unidades"]); row++;
        for (const t of p.porTamanho) { linha(ws, row, [t.tamanho, t.paletes, t.itens, t.und]); row++; }
        if (p.recebimento) {
          row++;
          linha(ws, row, ["Recebimento", ""]); row++;
          header(ws, row, ["Tamanho", "Paletes", "Itens", "Unidades"]); row++;
          for (const t of p.recebimento.porTamanho) { linha(ws, row, [t.tamanho, t.paletes, t.itens, t.und]); row++; }
        }
      }
      break;
    }

    /* ── Cena 4: Produção da Semana ── */
    case 4: {
      setLarguras(ws, [16, 14, 14, 14, 14, 14]);
      if (dados.producaoSemanal?.length) {
        header(ws, row, ["Data", "Ton. Previsto", "Ton. Produzido", "Un. Produzida", "Ton. Recebido", "Un. Recebida"]); row++;
        for (const d of dados.producaoSemanal) {
          linha(ws, row, [d.data ?? d.iso ?? "", d.tonPrevisto ?? 0, d.tonProduzido ?? 0, d.unProduzida ?? 0, d.tonRecebido ?? 0, d.unRecebida ?? 0]); row++;
        }
      }
      break;
    }

    /* ── Cena 5: Avarias ── */
    case 5: {
      setLarguras(ws, [20, 18, 18, 18, 18, 18]);
      if (dados.avarias) {
        const a = dados.avarias;
        linha(ws, row, ["Total de avarias", a.total]); row++;
        linha(ws, row, ["Custo", a.custo]); row++;
        row++;
        header(ws, row, ["Mês", "Quantidade", "Peso (kg)", "Custo (R$)"]); row++;
        for (const m of a.meses) { linha(ws, row, [m.mes, m.qtd, m.peso ?? 0, m.custo ?? 0]); row++; }
        row++;
        if (a.tipos?.length) {
          header(ws, row, ["Tipo", "Total", "%"]); row++;
          for (const t of a.tipos) { linha(ws, row, [t.tipo, t.total, t.pct]); row++; }
        }
      }
      break;
    }

    /* ── Cena 6: Pendências de Produção ── */
    case 6: {
      setLarguras(ws, [20, 18, 14, 14, 18, 18]);
      if (dados.pendentes) {
        const p = dados.pendentes;
        linha(ws, row, ["Total de ordens", p.itens]); row++;
        linha(ws, row, ["Tonelagem total (t)", p.totalTon]); row++;
        linha(ws, row, ["Média mensal (t)", p.mediaTon]); row++;
        row++;
        if (p.meses?.length) {
          header(ws, row, ["Mês", "Tonelagem (t)", "%", "Itens", "Data Final"]); row++;
          for (const m of p.meses) { linha(ws, row, [m.mes, m.ton, m.pct, m.itens, m.dtFinal ?? ""]); row++; }
        }
      }
      break;
    }

    /* ── Cena 7: Reservas ── */
    case 7: {
      setLarguras(ws, [16, 40, 18, 18, 18, 18]);
      if (dados.reservados) {
        const r = dados.reservados;
        linha(ws, row, ["Total reservado (qtd)", r.totalQtd]); row++;
        linha(ws, row, ["Total reservado (ton)", r.totalTon]); row++;
        linha(ws, row, ["Total reservado (R$)", r.totalValor]); row++;
        linha(ws, row, ["% Quantidade", r.pctQtd]); row++;
        linha(ws, row, ["% Valor", r.pctValor]); row++;
        row++;
        header(ws, row, ["Código", "Descrição", "Qtd Reservada", "Peso Reservado (kg)", "Valor Reservado (R$)", "% Reservado"]); row++;
        for (const it of r.topItens) { linha(ws, row, [it.cod, it.desc, it.qtdReservada, it.pesoReservado, it.valorReservado, it.pctReservado]); row++; }
      }
      break;
    }

    /* ── Cena 8: Fora de Linha ── */
    case 8: {
      setLarguras(ws, [14, 44, 14, 14, 14, 14]);
      const f = dados.foraDeLinha as VideoForaDeLinha | undefined;
      if (f) {
        const pos = (p: PosicaoEstoque) => [
          ["Itens", p.itens], ["Saldo Focco", p.saldoFocco], ["Saldo Full", p.saldoFull],
          ["Reservas", p.reservas], ["Disponível", p.disponivel], ["Peso (ton)", p.pesoTon],
          ["Valor estoque (R$)", p.valorEstoque],
        ];
        linha(ws, row, ["Posição Em Linha", ""]); row++;
        for (const [label, val] of pos(f.posicaoEmLinha)) { linha(ws, row, [label, val]); row++; }
        row++;
        linha(ws, row, ["Posição Fora de Linha", ""]); row++;
        for (const [label, val] of pos(f.posicaoForaDeLinha)) { linha(ws, row, [label, val]); row++; }
        row++;
        header(ws, row, ["Item", "Descrição", "Saldo Focco", "Saldo Full", "Reservas", "Disponível"]); row++;
        for (const it of f.itens as ItemForaDeLinha[]) {
          linha(ws, row, [it.item, it.desc, it.saldoFocco, it.saldoFull, it.reservas, it.disponivel]); row++;
        }
      }
      break;
    }

    /* ── Cena 9: Tonelagem do Estoque ── */
    case 9: {
      setLarguras(ws, [32, 22, 22, 22, 22, 22]);
      if (dados.resumo) {
        const r = dados.resumo;
        linha(ws, row, ["Tonelagem atual (t)", r.ton]); row++;
        linha(ws, row, ["Valor em estoque (R$)", r.valor]); row++;
        linha(ws, row, ["Valor previsto (R$)", r.previsto]); row++;
        linha(ws, row, ["Itens", r.itens]); row++;
        linha(ws, row, ["Saldo físico", r.saldo]); row++;
      }
      break;
    }

    default:
      linha(ws, row, ["Sem dados para exportar nesta cena."]);
      break;
  }

  /* Download */
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `LOPAS-${nomeCena.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
