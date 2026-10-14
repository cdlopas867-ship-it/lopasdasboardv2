/* Importação e comparação de saldo entre Full (FullSoft) e Focco (ERP).
 *
 * Full: itens lidos pela planilha de posição de estoque (lerItensEstoque),
 *   agrupados por código de item (saldo somado).
 * Focco: planilha WF0112 - Estoques (aba "Resultado"), colunas
 *   Item / Descrição / Endereço / Qtd. Atual. Os códigos do Focco podem ter
 *   decimais (ex.: "77092.36318") — o agrupamento é pelo código base (antes
 *   do ponto), somando a quantidade de todos os subitens.
 *
 * O cruzamento é feito pelo código base do item: itens que existem nos dois
 * sistemas são comparados pelo saldo; os que só existem em um lado viram
 * alertas. */

import * as XLSX from "xlsx";
import type { ItemEstoque } from "./base-estoque";
import type { SaldoComparativo, DiferencaSaldo } from "@/data/saldo-comparativo";

/* Lê os itens do Focco (WF0112) de uma workbook.
   Retorna um mapa: código base → { saldo, desc }. */
export function lerItensFocco(wb: XLSX.WorkBook): Map<string, { saldo: number; desc: string }> | null {
  const ws = wb.Sheets["Resultado"];
  if (!ws) return null;

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  const hi = rows.findIndex((r) =>
    r && r.some((c) => String(c ?? "").toUpperCase().trim() === "ITEM"),
  );
  if (hi < 0) return null;

  const headers = rows[hi]!.map((c) => String(c ?? "").toUpperCase().trim());
  const cItem = headers.indexOf("ITEM");
  const cDesc = headers.findIndex((h) => h.includes("DESC"));
  const cQtd = headers.findIndex((h) => h.includes("QTD") && h.includes("ATUAL"));

  if (cItem < 0 || cQtd < 0) return null;

  const mapa = new Map<string, { saldo: number; desc: string }>();
  for (const r of rows.slice(hi + 1)) {
    if (!r || !r[cItem]) continue;
    const itemRaw = String(r[cItem]).trim();
    if (!itemRaw) continue;
    /* Código base = parte antes do ponto (ex.: "77092.36318" → "77092"). */
    const base = itemRaw.split(".")[0]!;
    const qtd = Number(r[cQtd]) || 0;
    const desc = cDesc >= 0 ? String(r[cDesc] ?? "").trim() : "";
    const existing = mapa.get(base) ?? { saldo: 0, desc };
    existing.saldo += qtd;
    if (!existing.desc) existing.desc = desc;
    mapa.set(base, existing);
  }
  return mapa.size > 0 ? mapa : null;
}

/* Calcula o comparativo Full × Focco a partir dos itens de ambos os sistemas.
   Retorna null se não houver itens suficientes. */
export function calcularSaldoComparativo(
  itensFull: ItemEstoque[],
  itensFocco: Map<string, { saldo: number; desc: string }>,
  dataBase: string,
): SaldoComparativo | null {
  if (!itensFull.length || !itensFocco.size) return null;

  /* Agrupa itens do Full por código, somando saldo e valor. */
  const fullMap = new Map<string, { saldo: number; desc: string; valor: number }>();
  for (const it of itensFull) {
    const item = it.item.trim();
    if (!item) continue;
    const existing = fullMap.get(item) ?? { saldo: 0, desc: it.desc, valor: 0 };
    existing.saldo += it.saldo;
    existing.valor += it.valor > 0 ? it.valor : it.saldo * it.custo;
    if (!existing.desc) existing.desc = it.desc;
    fullMap.set(item, existing);
  }

  const fullItens = fullMap.size;
  const fullSaldo = [...fullMap.values()].reduce((s, v) => s + v.saldo, 0);
  const fullValor = [...fullMap.values()].reduce((s, v) => s + v.valor, 0);

  const foccoItens = itensFocco.size;
  const foccoSaldo = [...itensFocco.values()].reduce((s, v) => s + v.saldo, 0);

  /* Cruzamento por código base. */
  let emComum = 0, soFull = 0, soFocco = 0, exata = 0, diferenca = 0;
  const diffs: DiferencaSaldo[] = [];

  for (const [item, f] of fullMap) {
    if (itensFocco.has(item)) {
      emComum++;
      const fo = itensFocco.get(item)!;
      const diff = f.saldo - fo.saldo;
      if (diff === 0) {
        exata++;
      } else {
        diferenca++;
        diffs.push({ item, desc: f.desc, full: f.saldo, focco: fo.saldo, diff });
      }
    } else {
      soFull++;
    }
  }
  for (const item of itensFocco.keys()) {
    if (!fullMap.has(item)) soFocco++;
  }

  diffs.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  const topDiferencas = diffs.slice(0, 15);

  const totalItens = emComum + soFull + soFocco;
  const pctMatch = totalItens > 0 ? +(exata / totalItens * 100).toFixed(1) : 0;
  const diferencaTotal = fullSaldo - foccoSaldo;

  return {
    dataBase,
    full: { itens: fullItens, saldo: fullSaldo, valor: +fullValor.toFixed(2) },
    focco: { itens: foccoItens, saldo: +foccoSaldo.toFixed(2) },
    comparativo: {
      itensEmComum: emComum,
      itensSoFull: soFull,
      itensSoFocco: soFocco,
      qtdExata: exata,
      qtdDiferenca: diferenca,
      pctMatch,
    },
    alertas: {
      soFull,
      soFocco,
      diferencaTotal: +diferencaTotal.toFixed(2),
    },
    topDiferencas,
  };
}
