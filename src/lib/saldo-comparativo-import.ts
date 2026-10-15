/* Importação e comparação de saldo entre Full (FullSoft) e Focco (ERP).
 *
 * Full  = relatório "WF0112 - Estoques" (aba Resultado) do FullSoft — o WMS do
 *         CD (estoque 112) —, colunas Item / Descrição / Endereço / Qtd. Atual.
 *         Como o relatório traz uma linha por endereço, as quantidades são
 *         somadas por código. Entra só itens de volume, com descrição começando
 *         por "VOL" (ver isVolume) — em qualquer endereço, inclusive os da ASTEC
 *         (fornecedor de ferragens), que também guarda volumes e por isso entra
 *         no saldo da comparação.
 * Focco = itens da posição de estoque 001 (lerItensEstoque) do ERP Focco —
 *         planilha "ESTOQUE 001 - POSIÇÃO DE ESTOQUE" —, com a chave código +
 *         máscara (ex.: "2194.16652").
 *
 * Os dois lados são cruzados pelo código completo do item: os que existem nos
 * dois sistemas são comparados pelo saldo, os demais viram alertas.
 *
 * A tonelagem vem em dois lados: a do Focco é o peso dos itens daquela situação
 * na posição 001 (PESO LIQ TOTAL); a do Full é a quantidade do relatório WF0112
 * × o PESO LIQ UN do item na posição do Focco (o relatório do Full não traz
 * peso). A posição lista também os itens zerados, o que dá peso aos itens que
 * só existem no Full.
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

/* Chave do item no Focco: código + número da máscara (ex.: 2194 + "(16652)…"). */
function chaveItem(item: string, mascara: string): string {
  const maskNum = mascara.match(/\((\d+)\)/)?.[1] ?? "";
  return maskNum ? `${item}.${maskNum}` : item;
}

const LIMITE_DIFERENCAS = 12;

/* Só itens de volume entram na comparação: a posição do CD é em volumes
   (descrição começando por "VOL"), enquanto o relatório do Full traz também
   peças e componentes soltos (e linhas de rodapé do relatório) que não
   correspondem a volume nenhum. */
const isVolume = (desc: string) => /^VOL/.test(desc.toUpperCase());

/* Lê o relatório WF0112 - Estoques (FullSoft) e devolve o saldo por código de
   item. Só reconhece a aba que tem Item + Endereço + Qtd. Atual, para não
   confundir com as outras planilhas da pasta do Drive. */
export function lerItensFull(
  rows: unknown[][],
): Map<string, { saldo: number; desc: string }> | null {
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

/* Peso unitário (kg por volume) de cada item da posição do Focco. A posição
   traz o PESO LIQ UN de todos os itens, inclusive dos zerados — é a única
   fonte de peso dos itens que só existem no relatório do Full. */
export function lerPesosPosicao(rows: unknown[][]): Map<string, number> | null {
  const hi = rows.findIndex((r) => {
    const h = (r ?? []).map(norm);
    return h.includes("ITEM") && h.includes("SALDO") && h.some((x) => x.startsWith("PESO") && x.includes("UN"));
  });
  if (hi < 0) return null;

  const h = (rows[hi] ?? []).map(norm);
  const cItem = h.indexOf("ITEM");
  const cMasc = h.findIndex((x) => x.startsWith("MASCARA"));
  const cPesoUn = h.findIndex((x) => x.startsWith("PESO") && x.includes("UN"));
  if (cItem < 0 || cPesoUn < 0) return null;

  const pesos = new Map<string, number>();
  for (const r of rows.slice(hi + 1)) {
    if (!r) continue;
    const item = str(r[cItem]);
    if (!item) continue;
    const pesoUn = num(r[cPesoUn]);
    if (pesoUn <= 0) continue;
    const chave = chaveItem(item, cMasc >= 0 ? str(r[cMasc]) : "");
    if (!pesos.has(chave)) pesos.set(chave, pesoUn);
  }
  return pesos.size > 0 ? pesos : null;
}

/* Monta o comparativo Full × Focco a partir dos itens dos dois sistemas.
   `pesosPosicao` é o PESO LIQ UN por item da posição do Focco, usado para
   pesar a quantidade do Full (o relatório dele não traz peso). */
export function calcularSaldoComparativo(
  itensFocco: ItemEstoque[],
  itensFull: Map<string, { saldo: number; desc: string }>,
  pesosPosicao: Map<string, number>,
  dataBase: string,
): SaldoComparativo | null {
  if (!itensFocco.length || itensFull.size === 0) return null;

  const foccoMap = new Map<string, { saldo: number; desc: string; valor: number; peso: number }>();
  for (const it of itensFocco) {
    if (!it.item) continue;
    const chave = chaveItem(it.item, it.mascara);
    const atual = foccoMap.get(chave) ?? { saldo: 0, desc: it.desc, valor: 0, peso: 0 };
    atual.saldo += it.saldo;
    atual.peso += it.peso;
    atual.valor += it.valor > 0 ? it.valor : it.saldo * it.custo;
    if (!atual.desc) atual.desc = it.desc;
    foccoMap.set(chave, atual);
  }
  if (foccoMap.size === 0) return null;

  let itensEmComum = 0;
  let itensSoFull = 0;
  let itensSoFocco = 0;
  let qtdExata = 0;
  let qtdDiferenca = 0;
  let pesoExato = 0;
  let pesoDiferenca = 0;
  let pesoSoFocco = 0;
  let pesoFullExato = 0;
  let pesoFullDiferenca = 0;
  let pesoFullSoFull = 0;
  const diferencas: DiferencaSaldo[] = [];

  /* Peso do item na posição do Focco — aplicado à quantidade do Full. */
  const pesoUn = (chave: string) => pesosPosicao.get(chave) ?? 0;

  for (const [chave, f] of foccoMap) {
    const fu = itensFull.get(chave);
    if (!fu) {
      itensSoFocco++;
      pesoSoFocco += f.peso;
      continue;
    }
    itensEmComum++;
    const diff = f.saldo - fu.saldo;
    const pesoFull = fu.saldo * pesoUn(chave);
    if (diff === 0) {
      qtdExata++;
      pesoExato += f.peso;
      pesoFullExato += pesoFull;
    } else {
      qtdDiferenca++;
      pesoDiferenca += f.peso;
      pesoFullDiferenca += pesoFull;
      diferencas.push({ item: chave, desc: f.desc, full: fu.saldo, focco: f.saldo, diff });
    }
  }
  for (const [chave, fu] of itensFull) {
    if (foccoMap.has(chave)) continue;
    itensSoFull++;
    pesoFullSoFull += fu.saldo * pesoUn(chave);
  }

  diferencas.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const foccoSaldo = [...foccoMap.values()].reduce((s, v) => s + v.saldo, 0);
  const foccoValor = [...foccoMap.values()].reduce((s, v) => s + v.valor, 0);
  const fullSaldo = [...itensFull.values()].reduce((s, v) => s + v.saldo, 0);

  return {
    dataBase,
    full: { itens: itensFull.size, saldo: +fullSaldo.toFixed(2) },
    focco: { itens: foccoMap.size, saldo: foccoSaldo, valor: +foccoValor.toFixed(2) },
    comparativo: {
      itensEmComum,
      itensSoFull,
      itensSoFocco,
      qtdExata,
      qtdDiferenca,
      pctAcuracia: itensEmComum > 0 ? +((qtdExata / itensEmComum) * 100).toFixed(1) : 0,
      tonExato: +(pesoExato / 1000).toFixed(1),
      tonDiferenca: +(pesoDiferenca / 1000).toFixed(1),
      tonSoFocco: +(pesoSoFocco / 1000).toFixed(1),
      tonFullExato: +(pesoFullExato / 1000).toFixed(1),
      tonFullDiferenca: +(pesoFullDiferenca / 1000).toFixed(1),
      tonFullSoFull: +(pesoFullSoFull / 1000).toFixed(1),
    },
    alertas: {
      soFull: itensSoFull,
      soFocco: itensSoFocco,
      diferencaTotal: +(foccoSaldo - fullSaldo).toFixed(2),
    },
    topDiferencas: diferencas.slice(0, LIMITE_DIFERENCAS),
  };
}
