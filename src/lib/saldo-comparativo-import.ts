/* Importação e comparação de saldo entre Full (FullSoft) e Focco (ERP).
 *
 * Full  = itens da posição de estoque do CD (lerItensEstoque), com a chave
 *         código + máscara (ex.: "2194.16652").
 * Focco = relatório "WF0112 - Estoques" (aba Resultado), colunas
 *         Item / Descrição / Endereço / Qtd. Atual. Como o relatório traz uma
 *         linha por endereço, as quantidades são somadas por código.
 *         Entra só itens de volume, com descrição começando por "VOL" (ver
 *         isVolume) — em qualquer endereço, inclusive os da ASTEC (fornecedor
 *         de ferragens), que também guarda volumes e por isso entra no saldo
 *         e no peso da comparação.
 *
 * Os dois lados são cruzados pelo código completo do item: os que existem nos
 * dois sistemas são comparados pelo saldo, os demais viram alertas.
 *
 * As linhas chegam já lidas da workbook (array de arrays) porque o XLSX é
 * importado em drive-auto-import.ts, onde funciona sob o SSR do Vite.
 */

import type { ItemEstoque } from "./base-estoque";
import type { DiferencaSaldo, SaldoComparativo } from "@/data/saldo-comparativo";

const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0) || 0);
const str = (v: unknown) => (v == null ? "" : String(v).trim());

/* Cabeçalhos vêm com acento e pontuação ("Qtd. Atual", "Endereço"). */
function norm(v: unknown): string {
  return str(v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

/* Chave do item no Full: código + número da máscara (ex.: 2194 + "(16652)…"). */
function chaveItem(item: string, mascara: string): string {
  const maskNum = mascara.match(/\((\d+)\)/)?.[1] ?? "";
  return maskNum ? `${item}.${maskNum}` : item;
}

const LIMITE_DIFERENCAS = 12;

/* Só itens de volume entram na comparação: a posição do CD é em volumes
   (descrição começando por "VOL"), enquanto o relatório do Focco traz também
   peças e componentes soltos (e linhas de rodapé do relatório) que não
   correspondem a volume nenhum. */
const isVolume = (desc: string) => /^VOL/.test(desc.toUpperCase());

/* Lê o relatório WF0112 - Estoques e devolve o saldo por código de item.
   Só reconhece a aba que tem Item + Endereço + Qtd. Atual, para não confundir
   com as outras planilhas da pasta do Drive. */
export function lerItensFocco(rows: unknown[][]): Map<string, { saldo: number; desc: string }> | null {
  const hi = rows.findIndex((r) => {
    const h = (r ?? []).map(norm);
    return (
      h.includes("ITEM") &&
      h.some((x) => x.includes("ENDERECO")) &&
      h.some((x) => x.includes("QTD") && x.includes("ATUAL"))
    );
  });
  if (hi < 0) return null;

  const h = (rows[hi] ?? []).map(norm);
  const cItem = h.indexOf("ITEM");
  const cDesc = h.findIndex((x) => x.startsWith("DESC"));
  const cQtd = h.findIndex((x) => x.includes("QTD") && x.includes("ATUAL"));
  if (cItem < 0 || cQtd < 0 || cDesc < 0) return null;

  const mapa = new Map<string, { saldo: number; desc: string }>();
  for (const r of rows.slice(hi + 1)) {
    if (!r) continue;
    const chave = str(r[cItem]);
    if (!chave) continue;
    /* Só itens de volume (descrição começando por "VOL"), em qualquer endereço. */
    if (!isVolume(str(r[cDesc]))) continue;
    const atual = mapa.get(chave) ?? { saldo: 0, desc: cDesc >= 0 ? str(r[cDesc]) : "" };
    atual.saldo += num(r[cQtd]);
    if (!atual.desc) atual.desc = cDesc >= 0 ? str(r[cDesc]) : "";
    mapa.set(chave, atual);
  }
  return mapa.size > 0 ? mapa : null;
}

/* Monta o comparativo Full × Focco a partir dos itens dos dois sistemas. */
export function calcularSaldoComparativo(
  itensFull: ItemEstoque[],
  itensFocco: Map<string, { saldo: number; desc: string }>,
  dataBase: string,
): SaldoComparativo | null {
  if (!itensFull.length || itensFocco.size === 0) return null;

  const fullMap = new Map<string, { saldo: number; desc: string; valor: number }>();
  for (const it of itensFull) {
    if (!it.item) continue;
    const chave = chaveItem(it.item, it.mascara);
    const atual = fullMap.get(chave) ?? { saldo: 0, desc: it.desc, valor: 0 };
    atual.saldo += it.saldo;
    atual.valor += it.valor > 0 ? it.valor : it.saldo * it.custo;
    if (!atual.desc) atual.desc = it.desc;
    fullMap.set(chave, atual);
  }
  if (fullMap.size === 0) return null;

  let itensEmComum = 0;
  let itensSoFull = 0;
  let itensSoFocco = 0;
  let qtdExata = 0;
  let qtdDiferenca = 0;
  const diferencas: DiferencaSaldo[] = [];

  for (const [chave, f] of fullMap) {
    const fo = itensFocco.get(chave);
    if (!fo) {
      itensSoFull++;
      continue;
    }
    itensEmComum++;
    const diff = f.saldo - fo.saldo;
    if (diff === 0) {
      qtdExata++;
    } else {
      qtdDiferenca++;
      diferencas.push({ item: chave, desc: f.desc, full: f.saldo, focco: fo.saldo, diff });
    }
  }
  for (const chave of itensFocco.keys()) {
    if (!fullMap.has(chave)) itensSoFocco++;
  }

  diferencas.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const fullSaldo = [...fullMap.values()].reduce((s, v) => s + v.saldo, 0);
  const fullValor = [...fullMap.values()].reduce((s, v) => s + v.valor, 0);
  const foccoSaldo = [...itensFocco.values()].reduce((s, v) => s + v.saldo, 0);

  return {
    dataBase,
    full: { itens: fullMap.size, saldo: fullSaldo, valor: +fullValor.toFixed(2) },
    focco: { itens: itensFocco.size, saldo: +foccoSaldo.toFixed(2) },
    comparativo: {
      itensEmComum,
      itensSoFull,
      itensSoFocco,
      qtdExata,
      qtdDiferenca,
      pctAcuracia: itensEmComum > 0 ? +((qtdExata / itensEmComum) * 100).toFixed(1) : 0,
    },
    alertas: {
      soFull: itensSoFull,
      soFocco: itensSoFocco,
      diferencaTotal: +(fullSaldo - foccoSaldo).toFixed(2),
    },
    topDiferencas: diferencas.slice(0, LIMITE_DIFERENCAS),
  };
}
