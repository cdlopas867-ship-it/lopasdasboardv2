import * as XLSX from "xlsx";

/* Pallet configuration per item — lida da planilha
   "ENGENHARIA 014 - PALLET DOS ITENS" (public/planilhas/paletes.xlsx).
   Cada linha traz o código do item, a descrição e a configuração de pallet
   com o tamanho (P, M, G, GG) e quantas unidades cabem por pallet. */

export type PalletItem = {
  item: string;
  tamanho: "P" | "M" | "G" | "GG";
  undPorPalete: number;
};

export type ResumoPaletes = {
  porTamanho: { tamanho: string; paletes: number; itens: number; und: number }[];
  totalPaletes: number;
  totalItens: number;
};

function normalizarTexto(value: unknown): string {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function extrairTamanho(texto: string): "P" | "M" | "G" | "GG" | null {
  const s = normalizarTexto(texto);
  if (!s) return null;

  const match = s.match(/\b(GG|G|M|P)\b/);
  if (!match) return null;

  return match[1] as "P" | "M" | "G" | "GG";
}

function extrairUnidadesPorPalete(texto: string): number | null {
  const s = normalizarTexto(texto);
  if (!s) return null;

  const candidatos: number[] = [];

  for (const regex of [
    /(\d+)\s*(?:UN|UND|UNIDADES?)\b/gi,
    /(?:C\/|C\\/)\s*(\d+)\s*(?:UN|UND|UNIDADES?)\b/gi,
    /(?:=|:|\/)\s*(\d+)\s*(?:UN|UND|UNIDADES?)\b/gi,
  ]) {
    for (const match of s.matchAll(regex)) {
      const value = Number(match[1]);
      if (Number.isFinite(value) && value > 0) candidatos.push(value);
    }
  }

  if (candidatos.length === 0) return null;
  return candidatos[candidatos.length - 1];
}

/* Extrai o tamanho (P/M/G/GG) e as unidades por pallet da coluna
   "PALLET FORRO". Aceita variações como:
     "TAM P= 4 PILHAS C/2UND= 8UND" -> P, 8
     "PALETE P: 11 UND"            -> P, 11
     "PALETE G=38UN"               -> G, 38
     "PALETE GG= 24UN"             -> GG, 24
     "TAM GG= 1 PILHA C/18 UND"    -> GG, 18
*/
function parsePalletInfo(
  text: string,
): { tamanho: "P" | "M" | "G" | "GG"; undPorPalete: number } | null {
  const s = normalizarTexto(text);
  if (!s) return null;

  const tamanho = extrairTamanho(s);
  if (!tamanho) return null;

  const undPorPalete = extrairUnidadesPorPalete(s);
  if (undPorPalete == null || undPorPalete <= 0) return null;

  return { tamanho, undPorPalete };
}

function encontraColuna(headers: string[], aliases: string[]): number {
  return headers.findIndex((h) => aliases.some((alias) => h === alias || h.includes(alias)));
}

/* Lê a planilha de paletes e retorna um mapa item → { tamanho, undPorPalete }. */
export function lerPaletes(wb: XLSX.WorkBook): Map<string, PalletItem> {
  const mapa = new Map<string, PalletItem>();

  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws) continue;

    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });

    const headerIdx = rows.findIndex((r) => {
      if (!r) return false;
      const headers = r.map((c) => normalizarTexto(c));
      return (
        headers.some(
          (h) =>
            h === "COD ITEM" ||
            h === "ITEM" ||
            h.includes("CODIGO ITEM") ||
            h.includes("COD ITEM"),
        ) &&
        headers.some(
          (h) => h.includes("PALLET") || h.includes("PALETE") || h.includes("TAMANHO"),
        )
      );
    });

    if (headerIdx < 0) continue;

    const headers = rows[headerIdx]!.map((c) => normalizarTexto(c));
    const cItem = encontraColuna(headers, ["COD ITEM", "CODIGO ITEM", "ITEM"]);
    const cPallet = encontraColuna(headers, [
      "PALLET",
      "PALETE",
      "PALLET FORRO",
      "PALETE FORRO",
      "TAMANHO PALLET",
    ]);

    if (cItem < 0 || cPallet < 0) continue;

    for (const r of rows.slice(headerIdx + 1)) {
      if (!r || !Array.isArray(r)) continue;
      const item = normalizarTexto(r[cItem]).replace(/\s+/g, "").trim();
      if (!item) continue;

      const palletStr = String(r[cPallet] ?? "").trim();
      if (!palletStr) continue;

      const info = parsePalletInfo(palletStr);
      if (!info) continue;

      mapa.set(item, { item, ...info });
    }
  }

  return mapa;
}

/* Calcula quantos paletes existem no estoque por tamanho, cruzando
   o saldo de cada item (base de estoque) com a configuração de pallet. */
export function calcularResumoPaletes(
  itensEstoque: { item: string; saldo: number }[],
  paletes: Map<string, PalletItem>,
): ResumoPaletes {
  const porTamanho = new Map<string, { paletes: number; itens: number; und: number }>();

  for (const it of itensEstoque) {
    const chave = normalizarTexto(it.item).replace(/\s+/g, "").trim();
    if (!chave) continue;

    const pallet = paletes.get(chave);
    if (!pallet || pallet.undPorPalete <= 0) continue;

    const paletesItem = Math.ceil(it.saldo / pallet.undPorPalete);
    const atual = porTamanho.get(pallet.tamanho) ?? {
      paletes: 0,
      itens: 0,
      und: 0,
    };
    atual.paletes += paletesItem;
    atual.itens += 1;
    atual.und += it.saldo;
    porTamanho.set(pallet.tamanho, atual);
  }

  const ordem = ["P", "M", "G", "GG"];
  const lista = ordem
    .filter((t) => porTamanho.has(t))
    .map((t) => ({ tamanho: t, ...porTamanho.get(t)! }));

  return {
    porTamanho: lista,
    totalPaletes: lista.reduce((s, t) => s + t.paletes, 0),
    totalItens: lista.reduce((s, t) => s + t.itens, 0),
  };
}
