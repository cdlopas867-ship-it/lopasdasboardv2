/* Parser da planilha "Estoque Em Linha x Fora de Linha" do Google Drive.
 *
 * Lê as abas "Fora de Linha" (itens descontinuados) e "Resumo" (visão geral
 * EM LINHA / FORA DE LINHA / TOTAL GERAL) de um workbook baixado do Drive
 * e retorna os dados estruturados no mesmo formato do módulo estático
 * src/data/fora-de-linha.ts.
 */

import * as XLSX from "xlsx";
import type { ItemForaDeLinha, PosicaoEstoque } from "@/data/fora-de-linha";

const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0) || 0);
const str = (v: unknown) => (v == null ? "" : String(v).trim());

/* Encontra a linha de cabeçalho em uma aba procurando por uma célula
   que case com um dos termos esperados. */
function encontrarHeader(rows: unknown[][], needles: string[]): number {
  return rows.findIndex((r) =>
    r?.some((c) => needles.some((n) => String(c ?? "").toUpperCase().trim() === n)),
  );
}

/* Lê a aba "Resumo" e extrai as posições EM LINHA, FORA DE LINHA e TOTAL. */
function lerResumo(wb: XLSX.WorkBook): {
  emLinha: PosicaoEstoque | null;
  foraDeLinha: PosicaoEstoque | null;
  total: PosicaoEstoque | null;
} {
  const ws = wb.Sheets["Resumo"];
  if (!ws) return { emLinha: null, foraDeLinha: null, total: null };

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  const hi = encontrarHeader(rows, ["GRUPO"]);
  if (hi < 0) return { emLinha: null, foraDeLinha: null, total: null };

  const headers = (rows[hi] ?? []).map((c) => str(c).toUpperCase());
  const findCol = (needles: string[]) =>
    headers.findIndex((h) => needles.some((n) => h === n || h.includes(n)));

  const cItens = findCol(["ITENS"]);
  const cSaldoFocco = findCol(["SALDO FOCCO"]);
  const cSaldoFull = findCol(["SALDO FULL"]);
  const cReservas = findCol(["RESERVAS"]);
  const cDisponivel = findCol(["DISPONÍVEL"]);
  const cPesoTon = findCol(["PESO TOTAL"]);
  const cPesoReserv = findCol(["PESO RESERVADO"]);
  const cValorEstoque = findCol(["VALOR ESTOQUE"]);
  const cValorReservado = findCol(["VALOR RESERVADO"]);

  const parseRow = (r: unknown[]): PosicaoEstoque => ({
    grupo: str(r[0]).toUpperCase(),
    itens: num(r[cItens >= 0 ? cItens : 1]),
    saldoFocco: num(r[cSaldoFocco >= 0 ? cSaldoFocco : 2]),
    saldoFull: num(r[cSaldoFull >= 0 ? cSaldoFull : 3]),
    reservas: num(r[cReservas >= 0 ? cReservas : 4]),
    disponivel: num(r[cDisponivel >= 0 ? cDisponivel : 5]),
    pesoTon: num(r[cPesoTon >= 0 ? cPesoTon : 6]),
    pesoReservadoTon: num(r[cPesoReserv >= 0 ? cPesoReserv : 7]),
    valorEstoque: num(r[cValorEstoque >= 0 ? cValorEstoque : 8]),
    valorReservado: num(r[cValorReservado >= 0 ? cValorReservado : 9]),
  });

  let emLinha: PosicaoEstoque | null = null;
  let foraDeLinha: PosicaoEstoque | null = null;
  let total: PosicaoEstoque | null = null;

  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0] || str(r[0]) === "") continue;
    const label = str(r[0]).toUpperCase();
    if (label === "EM LINHA") emLinha = parseRow(r);
    else if (label === "FORA DE LINHA") foraDeLinha = parseRow(r);
    else if (label === "TOTAL GERAL" || label === "TOTAL") total = parseRow(r);
  }

  return { emLinha, foraDeLinha, total };
}

/* Lê a aba "Fora de Linha" e extrai os itens descontinuados. */
function lerItens(wb: XLSX.WorkBook): ItemForaDeLinha[] | null {
  const ws = wb.Sheets["Fora de Linha"];
  if (!ws) return null;

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  const hi = encontrarHeader(rows, ["CHAVE"]);
  if (hi < 0) return null;

  const headers = (rows[hi] ?? []).map((c) => str(c).toUpperCase());
  const findCol = (needles: string[]) =>
    headers.findIndex((h) => needles.some((n) => h === n || h.includes(n)));

  const cChave = findCol(["CHAVE"]);
  const cItem = findCol(["ITEM"]);
  const cDesc = findCol(["DESCRIÇÃO"]);
  const cMascara = findCol(["MÁSCARA"]);
  const cCategoria = findCol(["CATEGORIA"]);
  const cOrigem = findCol(["ORIGEM"]);
  const cSaldoFocco = findCol(["SALDO FOCCO"]);
  const cSaldoFull = findCol(["SALDO FULL"]);
  const cReservas = findCol(["RESERVAS"]);
  const cDisponivel = findCol(["DISPONÍVEL"]);
  const cPesoKg = findCol(["PESO TOTAL"]);
  const cPesoReservKg = findCol(["PESO RESERVADO"]);
  const cValorEstoque = findCol(["VALOR ESTOQUE"]);
  const cValorReservado = findCol(["VALOR RESERVADO"]);

  const itens: ItemForaDeLinha[] = [];
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0] || str(r[0]) === "") continue;
    const chave = str(r[cChave >= 0 ? cChave : 0]);
    if (!chave || !chave.includes(".")) continue;
    itens.push({
      chave,
      item: num(r[cItem >= 0 ? cItem : 1]),
      desc: str(r[cDesc >= 0 ? cDesc : 2]),
      mascara: str(r[cMascara >= 0 ? cMascara : 3]),
      categoria: str(r[cCategoria >= 0 ? cCategoria : 4]).toUpperCase(),
      origem: str(r[cOrigem >= 0 ? cOrigem : 5]).toUpperCase(),
      saldoFocco: num(r[cSaldoFocco >= 0 ? cSaldoFocco : 6]),
      saldoFull: num(r[cSaldoFull >= 0 ? cSaldoFull : 7]),
      reservas: num(r[cReservas >= 0 ? cReservas : 8]),
      disponivel: num(r[cDisponivel >= 0 ? cDisponivel : 9]),
      pesoKg: num(r[cPesoKg >= 0 ? cPesoKg : 10]),
      pesoReservadoKg: num(r[cPesoReservKg >= 0 ? cPesoReservKg : 11]),
      valorEstoque: num(r[cValorEstoque >= 0 ? cValorEstoque : 12]),
      valorReservado: num(r[cValorReservado >= 0 ? cValorReservado : 13]),
    });
  }

  return itens.length > 0 ? itens : null;
}

export type ForaDeLinhaData = {
  itens: ItemForaDeLinha[];
  posicaoEmLinha: PosicaoEstoque;
  posicaoForaDeLinha: PosicaoEstoque;
  posicaoTotal: PosicaoEstoque;
};

/* Processa um workbook e retorna os dados de fora de linha.
   Retorna null se a planilha não contiver as abas esperadas. */
export function lerForaDeLinha(wb: XLSX.WorkBook): ForaDeLinhaData | null {
  const resumo = lerResumo(wb);
  const itens = lerItens(wb);

  /* Precisa de pelo menos os itens ou o resumo para ser válido */
  if (!itens && !resumo.foraDeLinha) return null;

  return {
    itens: itens ?? [],
    posicaoEmLinha: resumo.emLinha ?? { grupo: "EM LINHA", itens: 0, saldoFocco: 0, saldoFull: 0, reservas: 0, disponivel: 0, pesoTon: 0, pesoReservadoTon: 0, valorEstoque: 0, valorReservado: 0 },
    posicaoForaDeLinha: resumo.foraDeLinha ?? { grupo: "FORA DE LINHA", itens: 0, saldoFocco: 0, saldoFull: 0, reservas: 0, disponivel: 0, pesoTon: 0, pesoReservadoTon: 0, valorEstoque: 0, valorReservado: 0 },
    posicaoTotal: resumo.total ?? { grupo: "TOTAL GERAL", itens: 0, saldoFocco: 0, saldoFull: 0, reservas: 0, disponivel: 0, pesoTon: 0, pesoReservadoTon: 0, valorEstoque: 0, valorReservado: 0 },
  };
}
