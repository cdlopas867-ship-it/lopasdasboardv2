/* Importação do relatório do CCR (volumes do CD) do Google Drive.
 *
 * O relatório do CCR chega na pasta do Drive como planilha do gerador de
 * relatórios do Focco ("BASE ESTOQUE CCR" — .xlsx, ou .xls exportado em
 * HTML). O parser lê a aba com "CCR" no nome, agrega por código de item e
 * compara com a posição do estoque 001 (Focco ERP, lerItensEstoque) para
 * montar o ComparativoCcr da cena "Estoque 001 × CCR".
 *
 * Assim o CCR é atualizado automaticamente a cada mudança na pasta do
 * Drive, como as outras cenas — sem depender do fallback estático.
 *
 * As linhas chegam já lidas da workbook (array de arrays) porque o XLSX é
 * importado em drive-auto-import.ts, onde funciona sob o SSR do Vite.
 */

import type { ItemEstoque } from "./base-estoque";
import type { ComparativoCcr } from "@/data/comparativo-ccr";

const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0) || 0);
const str = (v: unknown) => (v == null ? "" : String(v).trim());

/* Cabeçalhos vêm com acento e pontuação ("DESCRIÇÃO", "Peso Líq. Total"). */
function norm(v: unknown): string {
  return str(v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

/* Só itens de volume entram (a posição do CD é em volumes — descrição "VOL"). */
const isVolume = (desc: string) => /^VOL/.test(desc.toUpperCase());

/* Rótulos das unidades exibidos na cena (mesmos do fallback estático). */
const ROTULO_UNIDADE: Record<string, string> = {
  "UNIDADE GUARDA ROUPAS": "Guarda-Roupas",
  "UNIDADE GUARDA-ROUPAS": "Guarda-Roupas",
  "UNIDADE DE COMPLEMENTOS": "Complementos",
  "UNIDADE COMPLEMENTOS": "Complementos",
  "UNIDADE DE SALAS": "Salas",
  "UNIDADE SALAS": "Salas",
};

function rotuloUnidade(unidade: string): string | null {
  return ROTULO_UNIDADE[unidade.toUpperCase().trim()] ?? null;
}

/* Item do CCR: o relatório traz uma linha por endereço/código, então os
   saldos e pesos são somados por código. */
export type ItemCcr = { desc: string; saldo: number; pesoKg: number; unidade: string };

/* Lê a base do CCR de uma aba: reconhece o cabeçalho com ITEM/COD + DESC +
   SALDO/QTD (+ PESO quando o relatório traz peso). Retorna o mapa por
   código, ou null quando a aba não é a base do CCR. */
export function lerItensCcr(nomeAba: string, rows: unknown[][]): Map<string, ItemCcr> | null {
  if (!/CCR/i.test(nomeAba)) return null;

  const hi = rows.findIndex((r) => {
    const h = (r ?? []).map(norm);
    return (
      (h.some((x) => x === "ITEM" || x.startsWith("COD") || x.includes("ITEM") || x.includes("COD ALMOX"))) &&
      h.some((x) => x.startsWith("DESC")) &&
      (h.some((x) => x.includes("SALDO")) || h.some((x) => x.includes("QTD")))
    );
  });
  if (hi < 0) return null;

  const h = (rows[hi] ?? []).map(norm);
  const findCol = (test: (x: string) => boolean) => h.findIndex(test);
  /* O código do item é a coluna "ITEM" (ou "COD") — não o "COD ALMOX" do
     endereço, que também existe no relatório do Focco. */
  const cItem = findCol((x) => x === "ITEM") >= 0
    ? findCol((x) => x === "ITEM")
    : findCol((x) => x === "COD") >= 0
      ? findCol((x) => x === "COD")
      : findCol((x) => x.startsWith("COD") || x.includes("ITEM"));
  const cDesc = findCol((x) => x.startsWith("DESC"));
  const cSaldo = findCol((x) => x.includes("SALDO") || x.includes("QTD"));
  const cPesoTotal = findCol((x) => x.includes("PESO LIQ TOTAL") || x.includes("PESO TOTAL") || x.includes("PESO EST KG"));
  const cPesoUn = findCol((x) => x.includes("PESO LIQ UN") || x.includes("PESO UN"));
  const cUnidade = findCol(
    (x) => x.includes("CLASSIFICACAO N1") || x.startsWith("CLASSIFICACAO") || x.includes("UNIDADE") || x.includes("GRUPO"),
  );
  if (cItem < 0 || cDesc < 0 || cSaldo < 0) return null;

  const mapa = new Map<string, ItemCcr>();
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i] ?? [];
    const cod = str(r[cItem]);
    if (!cod) continue;
    const saldo = num(r[cSaldo]);
    const pesoKg = cPesoTotal >= 0
      ? num(r[cPesoTotal])
      : cPesoUn >= 0
        ? saldo * num(r[cPesoUn])
        : 0;
    const atual = mapa.get(cod) ?? { desc: str(r[cDesc]), saldo: 0, pesoKg: 0, unidade: str(r[cUnidade]) };
    atual.saldo += saldo;
    atual.pesoKg += pesoKg;
    mapa.set(cod, atual);
  }
  return mapa.size > 0 ? mapa : null;
}

/* Monta o ComparativoCcr cruzando a posição do estoque 001 (Focco ERP) com
   os itens do CCR pelo código de item. Igual ao fallback estático: só as
   três unidades do CD (Guarda-Roupas, Complementos, Salas) e só volumes.
   Retorna null quando nada casa (relatório não reconhecido). */
export function calcularComparativoCcr(
  itens001: ItemEstoque[],
  ccrMap: Map<string, ItemCcr>,
  dataBase: string,
): ComparativoCcr | null {
  /* Posição 001 agregada por código (somando as linhas por máscara). */
  const pos001 = new Map<string, { saldo: number; pesoKg: number; unidade: string; desc: string }>();
  for (const it of itens001) {
    if (!isVolume(it.desc) || !rotuloUnidade(it.unidade)) continue;
    const atual = pos001.get(it.item) ?? { saldo: 0, pesoKg: 0, unidade: it.unidade, desc: it.desc };
    atual.saldo += it.saldo;
    atual.pesoKg += it.peso;
    pos001.set(it.item, atual);
  }
  if (pos001.size === 0 || ccrMap.size === 0) return null;

  const arred1 = (v: number) => Math.round(v * 10) / 10;

  let emComum = 0, so001 = 0, soCcr = 0;
  let saldo001 = 0, peso001Kg = 0, saldoCcr = 0, pesoCcrKg = 0;
  const porUnidade = new Map<string, { peso001: number; pesoCcr: number }>();
  const diferencas: ComparativoCcr["topDiferencas"] = [];

  for (const [cod, a] of pos001) {
    saldo001 += a.saldo;
    peso001Kg += a.pesoKg;
    const b = ccrMap.get(cod);
    if (!b) { so001++; continue; }
    emComum++;
    saldoCcr += b.saldo;
    pesoCcrKg += b.pesoKg;
    const rótulo = rotuloUnidade(a.unidade);
    if (rótulo) {
      const u = porUnidade.get(rótulo) ?? { peso001: 0, pesoCcr: 0 };
      u.peso001 += a.pesoKg;
      u.pesoCcr += b.pesoKg;
      porUnidade.set(rótulo, u);
    }
    diferencas.push({
      item: cod,
      desc: b.desc || a.desc,
      peso001: a.pesoKg / 1000,
      pesoCcr: b.pesoKg / 1000,
      difTon: 0, // preenchido abaixo (peso001 − pesoCcr)
    });
  }

  /* Itens só no CCR entram nos totais sempre — o relatório do CCR é todo de
     volumes do CD, mesmo quando a classificação não é uma das 3 unidades do
     estoque 001 (ex.: "EMBALAGEM JOGO DE PES", "VIDRO/ESPELHO"). Sem isso o
     peso do lado do CCR ficava menor que a soma real do arquivo. */
  for (const [cod, b] of ccrMap) {
    if (pos001.has(cod)) continue;
    soCcr++;
    saldoCcr += b.saldo;
    pesoCcrKg += b.pesoKg;
    const rótulo = rotuloUnidade(b.unidade);
    if (rótulo) {
      const u = porUnidade.get(rótulo) ?? { peso001: 0, pesoCcr: 0 };
      u.pesoCcr += b.pesoKg;
      porUnidade.set(rótulo, u);
    }
  }

  if (emComum === 0) return null;

  for (const d of diferencas) d.difTon = d.peso001 - d.pesoCcr;
  diferencas.sort((x, y) => Math.abs(y.difTon) - Math.abs(x.difTon));

  const peso001Ton = peso001Kg / 1000;
  const pesoCcrTon = pesoCcrKg / 1000;
  const difPesoTon = pesoCcrTon - peso001Ton;
  const difSaldoUn = saldoCcr - saldo001;

  return {
    dataBase,
    estoque001: { itens: pos001.size, saldo: saldo001, pesoTon: arred1(peso001Ton) },
    ccr: { itens: ccrMap.size, saldo: saldoCcr, pesoTon: arred1(pesoCcrTon) },
    diferenca: {
      pesoTon: arred1(difPesoTon),
      pesoPct: peso001Ton > 0 ? arred1((difPesoTon / peso001Ton) * 100) : 0,
      saldoUn: difSaldoUn,
      saldoPct: saldo001 > 0 ? arred1((difSaldoUn / saldo001) * 100) : 0,
    },
    porUnidade: [...porUnidade.entries()]
      .sort((a, b) => b[1].peso001 - a[1].peso001)
      .map(([nome, u]) => {
        const difKg = u.pesoCcr - u.peso001;
        return {
          nome,
          peso001: arred1(u.peso001 / 1000),
          pesoCcr: arred1(u.pesoCcr / 1000),
          difTon: arred1(difKg / 1000),
          difPct: u.peso001 > 0 ? arred1((difKg / u.peso001) * 100) : 0,
        };
      }),
    itensEmComum: emComum,
    itensSo001: so001,
    itensSoCcr: soCcr,
    topDiferencas: diferencas.slice(0, 5).map((d) => ({
      item: d.item,
      desc: d.desc,
      peso001: arred1(d.peso001),
      pesoCcr: arred1(d.pesoCcr),
      difTon: arred1(d.difTon),
    })),
  };
}

/* Comparativo quando a pasta do Drive não tem mais o relatório do CCR:
   o lado do ESTOQUE 001 é calculado ao vivo com a posição atual (mesmas
   regras de calcularComparativoCcr — só volumes das 3 unidades do CD) e o
   lado do CCR fica na última base extraída (`base`, COMPARATIVO_CCR).
   Por unidade compara o peso vivo do 001 com os totais da base do CCR;
   nas Maiores divergências o peso do 001 de cada item da base é atualizado
   ao vivo (itens que saíram da posição ficam de fora). */
export function comparativoMistoCcr(
  itens001: ItemEstoque[],
  base: ComparativoCcr,
  dataBase001: string,
): ComparativoCcr | null {
  const pos001 = new Map<string, { saldo: number; pesoKg: number; unidade: string }>();
  for (const it of itens001) {
    if (!isVolume(it.desc) || !rotuloUnidade(it.unidade)) continue;
    const atual = pos001.get(it.item) ?? { saldo: 0, pesoKg: 0, unidade: it.unidade };
    atual.saldo += it.saldo;
    atual.pesoKg += it.peso;
    pos001.set(it.item, atual);
  }
  if (pos001.size === 0) return null;

  const arred1 = (v: number) => Math.round(v * 10) / 10;

  let saldo001 = 0;
  let peso001Kg = 0;
  const pesoPorUnidade = new Map<string, number>();
  for (const a of pos001.values()) {
    saldo001 += a.saldo;
    peso001Kg += a.pesoKg;
    const rótulo = rotuloUnidade(a.unidade)!;
    pesoPorUnidade.set(rótulo, (pesoPorUnidade.get(rótulo) ?? 0) + a.pesoKg);
  }

  const peso001Ton = peso001Kg / 1000;
  const difPesoTon = base.ccr.pesoTon - peso001Ton;
  const difSaldoUn = base.ccr.saldo - saldo001;

  return {
    dataBase: `001 ${dataBase001} · CCR ${base.dataBase}`,
    estoque001: { itens: pos001.size, saldo: saldo001, pesoTon: arred1(peso001Ton) },
    ccr: base.ccr,
    diferenca: {
      pesoTon: arred1(difPesoTon),
      pesoPct: peso001Ton > 0 ? arred1((difPesoTon / peso001Ton) * 100) : 0,
      saldoUn: difSaldoUn,
      saldoPct: saldo001 > 0 ? arred1((difSaldoUn / saldo001) * 100) : 0,
    },
    porUnidade: base.porUnidade
      .map((u) => {
        const peso001 = pesoPorUnidade.get(u.nome) ?? 0;
        const difKg = u.pesoCcr * 1000 - peso001;
        return {
          nome: u.nome,
          peso001: arred1(peso001 / 1000),
          pesoCcr: u.pesoCcr,
          difTon: arred1(difKg / 1000),
          difPct: peso001 > 0 ? arred1((difKg / peso001) * 100) : 0,
        };
      })
      .sort((a, b) => b.peso001 - a.peso001),
    /* O cruzamento item a item só existe na extração da base do CCR; os
       contados aqui são os da base, rotulados na data-base mista. */
    itensEmComum: base.itensEmComum,
    itensSo001: base.itensSo001,
    itensSoCcr: base.itensSoCcr,
    topDiferencas: base.topDiferencas
      .map((t) => {
        const vivo = pos001.get(t.item);
        if (!vivo) return null;
        return {
          item: t.item,
          desc: t.desc,
          peso001: arred1(vivo.pesoKg / 1000),
          pesoCcr: t.pesoCcr,
          difTon: arred1(vivo.pesoKg / 1000 - t.pesoCcr),
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null),
  };
}
