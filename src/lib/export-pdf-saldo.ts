/* Exportação PDF do comparativo Full × Focco — substitui o Excel antigo por
   um relatório bem apresentado, com o logo da Lopas, cabeçalho com o resumo
   dos totais (saldo, itens e peso em toneladas) e a data/hora de cada
   planilha usada no cruzamento:
   - Itens sob risco: reservados que o Full/Focco não têm saldo para atender
     (SEM a coluna de peso — o peso total fica no resumo do cabeçalho)
   - Endereços: os endereços de cada item sob risco no relatório do Full
     (WF0112), com a quantidade em cada um
   Carrega jspdf/jspdf-autotable só no clique para não pesar o bundle. */

import type { SaldoComparativo } from "@/data/saldo-comparativo";
import { fmtInt, fmtBrMax, fmtMi } from "@/lib/format";

/* Logo da Lopas (servido de public/ — mesmo arquivo do painel). */
const LOGO_URL = "/logo-lopas.jpg";
const VERDE = "#78AE34";
const VERDE_ESCURO = "#4A6B20";
const CINZA_TXT = "#4B5563";
const CINZA_CLARO = "#9CA3AF";

type PlanilhaSync = { nome: string; modificado?: string };

const fmtDataHora = (iso?: string) => {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* Planilhas usadas no cruzamento, classificadas pelo nome do arquivo no
   Drive (WF0112 = Full 112 · estoque 001 = posição do Focco · reserv* = a
   carteira reservada usada no bloco "sob risco"). */
function planilhasUsadas(planilhas: PlanilhaSync[] | undefined) {
  const usadas: { rotulo: string; nome: string; modificado?: string }[] = [];
  const pega = (re: RegExp, rotulo: string) => {
    const p = planilhas?.find((x) => re.test(x.nome) && !usadas.some((u) => u.nome === x.nome));
    if (p) usadas.push({ rotulo, nome: p.nome, modificado: p.modificado });
  };
  pega(/wf0112/i, "Full · estoque 112");
  pega(/reserv/i, "Reservas da carteira");
  pega(/estoque/i, "Focco · estoque 001");
  return usadas;
}

/* Imagem do logo como dataURL (o jsPDF precisa do dado, não da URL). */
async function logoDataUrl(): Promise<{ url: string; formato: "JPEG" | "PNG" } | null> {
  try {
    const resp = await fetch(LOGO_URL);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    const url = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
    return { url, formato: blob.type.includes("png") ? "PNG" : "JPEG" };
  } catch {
    return null;
  }
}

/* Monta o documento PDF completo (cabeçalho, resumo, tabelas e rodapé) e
   devolve o próprio doc — separado do download para poder ser testado fora
   do navegador. */
export async function construirPdfSaldo(
  comparativo: SaldoComparativo,
  sincronizacao?: { em?: string; planilhas?: PlanilhaSync[] },
) {
  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableMod.default;

  const d = comparativo;
  const c = d.comparativo;
  const geradoEm = fmtDataHora(new Date().toISOString());
  const tonTotalFull = c.tonFullExato + c.tonFullDiferenca + c.tonFullSoFull;
  const tonTotalFocco = c.tonExato + c.tonDiferenca + c.tonSoFocco;
  const risco = d.risco ?? { itens: 0, qtdReservada: 0, tonReservada: 0 };

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;

  /* --- Cabeçalho com o logo da Lopas --- */
  const logo = await logoDataUrl();
  let y = M;
  if (logo) {
    doc.addImage(logo.url, logo.formato, M, y, 20, 20);
  }
  const xTitulo = M + 26;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(VERDE_ESCURO);
  doc.text("Comparativo de Saldo", xTitulo, y + 8);
  doc.setFontSize(10.5);
  doc.setTextColor(VERDE);
  doc.text("Focco (estoque 001) × Full (estoque 112)", xTitulo, y + 14.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(CINZA_TXT);
  doc.text(`Data-base das planilhas: ${d.dataBase}`, xTitulo, y + 20.5);

  doc.setFontSize(8.5);
  doc.setTextColor(CINZA_TXT);
  doc.text(`Gerado em ${geradoEm}`, W - M, y + 4, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text("Painel CD · Lopas", W - M, y + 10, { align: "right" });

  /* Planilhas usadas, com data e hora de cada uma */
  const usadas = planilhasUsadas(sincronizacao?.planilhas);
  y += 27;
  doc.setDrawColor(VERDE);
  doc.setLineWidth(0.4);
  doc.line(M, y, W - M, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(VERDE_ESCURO);
  doc.text("PLANILHAS UTILIZADAS", M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(CINZA_TXT);
  if (usadas.length) {
    for (const p of usadas) {
      y += 4.4;
      doc.text(`${p.rotulo}:`, M + 2, y);
      doc.setFont("helvetica", "bold");
      doc.text(`${p.nome}`, M + 42, y);
      doc.setFont("helvetica", "normal");
      doc.text(`atualizada em ${fmtDataHora(p.modificado)}`, W - M - 2, y, { align: "right" });
    }
  } else {
    y += 4.4;
    doc.text(`Pasta do Drive atualizada em ${fmtDataHora(sincronizacao?.em)}`, M + 2, y);
  }

  /* --- Resumo dos totais (cabeçalho) --- */
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(VERDE_ESCURO);
  doc.text("RESUMO GERAL", M, y);

  const totalItens = c.itensEmComum + c.itensSoFull + c.itensSoFocco;
  const cards: { titulo: string; cor: string; linhas: string[] }[] = [
    {
      titulo: "Full · Estoque 112",
      cor: "#DC2626",
      linhas: [`${fmtInt(d.full.saldo)} un · ${fmtInt(d.full.itens)} itens`, `Peso: ${fmtBrMax(tonTotalFull, 1)} t`],
    },
    {
      titulo: "Focco · Estoque 001",
      cor: "#2563EB",
      linhas: [
        `${fmtInt(d.focco.saldo)} un · ${fmtInt(d.focco.itens)} itens`,
        `Peso: ${fmtBrMax(tonTotalFocco, 1)} t · ${fmtMi(d.focco.valor)}`,
      ],
    },
    {
      titulo: "Reservados sob risco",
      cor: "#DC2626",
      linhas: [
        `${fmtInt(risco.itens)} itens · ${fmtInt(risco.qtdReservada)} un`,
        `Peso reservado: ${fmtBrMax(risco.tonReservada, 1)} t`,
      ],
    },
  ];

  y += 2.5;
  const cardW = (W - M * 2 - 6) / 3;
  const cardH = 17;
  cards.forEach((card, i) => {
    const x = M + i * (cardW + 3);
    doc.setFillColor("#F6F8F3");
    doc.setDrawColor("#E2E8DC");
    doc.roundedRect(x, y, cardW, cardH, 1.5, 1.5, "FD");
    doc.setFillColor(card.cor);
    doc.roundedRect(x, y, 1.6, cardH, 0.8, 0.8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(CINZA_CLARO);
    doc.text(card.titulo.toUpperCase(), x + 4, y + 4.6);
    doc.setFontSize(9);
    doc.setTextColor("#111827");
    doc.text(card.linhas[0], x + 4, y + 10);
    doc.setFontSize(8);
    doc.setTextColor(CINZA_TXT);
    doc.text(card.linhas[1], x + 4, y + 14.6);
  });

  y += cardH + 4;
  doc.setFontSize(7.5);
  const chips: { rotulo: string; valor: string; cor: string }[] = [
    { rotulo: "SALDO EXATO", valor: `${fmtInt(c.qtdExata)} itens · ${fmtBrMax(c.pctAcuracia, 1)}% acur.`, cor: "#16A34A" },
    { rotulo: "COM DIFERENÇA", valor: `${fmtInt(c.qtdDiferenca)} itens`, cor: "#F97316" },
    { rotulo: "SÓ NO FULL", valor: `${fmtInt(d.alertas.soFull)} itens`, cor: "#DC2626" },
    { rotulo: "SÓ NO FOCCO", valor: `${fmtInt(d.alertas.soFocco)} itens`, cor: "#2563EB" },
    {
      rotulo: "DIF. DE SALDO",
      valor: `${d.alertas.diferencaTotal < 0 ? "−" : "+"}${fmtInt(Math.abs(d.alertas.diferencaTotal))} un`,
      cor: "#B45309",
    },
  ];
  const chipW = (W - M * 2 - 12) / 5;
  chips.forEach((chip, i) => {
    const x = M + i * (chipW + 3);
    doc.setFillColor("#FFFFFF");
    doc.setDrawColor("#E5E7EB");
    doc.roundedRect(x, y, chipW, 11, 1.5, 1.5, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(chip.cor);
    doc.text(chip.rotulo, x + 2.5, y + 4);
    doc.setFontSize(7.5);
    doc.setTextColor("#111827");
    doc.text(chip.valor, x + 2.5, y + 8.6);
  });

  /* --- Tabela: itens sob risco (sem coluna de peso) --- */
  const MOTIVO: Record<string, string> = {
    "sem-full": "Reservado sem saldo no Full",
    "full-insuficiente": "Full não cobre a reserva",
    "focco-insuficiente": "Reserva maior que o saldo no Focco",
  };
  const riscos = (d.itensRisco ?? []).filter((it) => it.risco && it.reservados > 0);
  autoTable(doc, {
    startY: y + 15,
    head: [
      [{ content: "Itens sob risco — reserva não coberta pelo Full/Focco", colSpan: 7, styles: { halign: "left", fontSize: 8.5, textColor: [255, 255, 255] } }],
      ["Item", "Descrição", "Motivo do risco", "Qtd. Reservada", "Focco (001)", "Full (112)", "Disponível"],
    ],
    body: riscos.length
      ? riscos.map((it) => [
          it.item,
          it.desc,
          MOTIVO[it.risco!] ?? it.risco,
          fmtInt(it.reservados),
          fmtInt(it.focco),
          fmtInt(it.full),
          fmtInt(it.disponiveis),
        ])
      : [["Nenhum item sob risco nesta base", "", "", "", "", "", ""]],
    foot: [
      [
        "Total",
        "",
        "",
        fmtInt(riscos.reduce((s, it) => s + it.reservados, 0)),
        fmtInt(riscos.reduce((s, it) => s + it.focco, 0)),
        fmtInt(riscos.reduce((s, it) => s + it.full, 0)),
        fmtInt(riscos.reduce((s, it) => s + it.disponiveis, 0)),
      ],
    ],
    columnStyles: {
      0: { cellWidth: 24, fontStyle: "bold", textColor: "#111827" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 34, fontSize: 7.5 },
      3: { cellWidth: 16, halign: "right" },
      4: { cellWidth: 16, halign: "right" },
      5: { cellWidth: 16, halign: "right" },
      6: { cellWidth: 17, halign: "right" },
    },
    headStyles: { fillColor: [30, 58, 95], fontSize: 7, fontStyle: "bold", textColor: [255, 255, 255], halign: "center" },
    footStyles: { fillColor: [241, 244, 238], textColor: [17, 24, 39], fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 247] },
    styles: { fontSize: 7.5, cellPadding: 1.6, overflow: "linebreak", textColor: [55, 65, 81] },
    margin: { left: M, right: M },
  });

  /* --- Tabela: endereços dos itens sob risco (relatório WF0112 do Full) --- */
  let yEnd = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  const linhasEnd = riscos.flatMap((it) => {
    const lista = it.enderecos ?? [];
    if (!lista.length) return [[it.item, it.desc, "—", "0", fmtInt(it.reservados)]];
    return lista.map((e) => [it.item, it.desc, e.endereco, fmtInt(e.qtd), fmtInt(it.reservados)]);
  });
  autoTable(doc, {
    startY: yEnd,
    head: [
      [{ content: "Endereços dos itens sob risco — relatório WF0112 (Full)", colSpan: 5, styles: { halign: "left", fontSize: 8.5, textColor: [255, 255, 255] } }],
      ["Item", "Descrição", "Endereço", "Qtd. no Endereço", "Qtd. Reservada"],
    ],
    body: linhasEnd.length ? linhasEnd : [["Nenhum endereço para listar nesta base", "", "", "", ""]],
    foot: [
      [
        "Total",
        "",
        "",
        fmtInt(riscos.reduce((s, it) => s + (it.enderecos ?? []).reduce((q, e) => q + e.qtd, 0), 0)),
        fmtInt(riscos.reduce((s, it) => s + it.reservados, 0)),
      ],
    ],
    columnStyles: {
      0: { cellWidth: 24, fontStyle: "bold", textColor: "#111827" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 30 },
      3: { cellWidth: 20, halign: "right" },
      4: { cellWidth: 22, halign: "right" },
    },
    headStyles: { fillColor: [30, 58, 95], fontSize: 8, fontStyle: "bold" },
    footStyles: { fillColor: [241, 244, 238], textColor: [17, 24, 39], fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 247] },
    styles: { fontSize: 7.5, cellPadding: 1.6, overflow: "linebreak", textColor: [55, 65, 81] },
    margin: { left: M, right: M },
  });

  /* --- Rodapé em todas as páginas --- */
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(CINZA_CLARO);
    doc.text("Comparativo de Saldo · Focco × Full — Painel CD Lopas", M, H - 7);
    doc.text(`Página ${i} de ${total} · Gerado em ${geradoEm}`, W - M, H - 7, { align: "right" });
  }

  return doc;
}

/* Download do arquivo pronto. */
export async function exportarPdfSaldo(
  comparativo: SaldoComparativo,
  sincronizacao?: { em?: string; planilhas?: PlanilhaSync[] },
) {
  const doc = await construirPdfSaldo(comparativo, sincronizacao);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `comparativo-focco-full-${comparativo.dataBase.replace(/\//g, "-")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
