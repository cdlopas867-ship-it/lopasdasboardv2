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

/* Extrai o tamanho (P/M/G/GG) e as unidades por pallet da coluna
   "PALLET FORRO". Padrões encontrados:
     "TAM P= 4 PILHAS C/2UND= 8UND"   → P, 8
     "PALETE P: 11 UND"               → P, 11
     "PALETE G=38UN"                  → G, 38
     "PALETE GG= 24UN"                → GG, 24
     "PALETE GG: 120 UND"             → GG, 120
     "TAM GG= 1 PILHA C/18 UND"       → GG, 18  (sem = final, pega C/N)
*/
function parsePalletInfo(
  text: string,
): { tamanho: "P" | "M" | "G" | "GG"; undPorPalete: number } | null {
  const s = text.toUpperCase().trim();
  if (!s) return null;

  /* Tamanho — GG antes de G para não capturar G primeiro */
  const sizeMatch = s.match(/\b(GG|G|M|P)\b\s*[=:]?/);
  if (!sizeMatch) return null;
  const tamanho = sizeMatch[1] as "P" | "M" | "G" | "GG";

  /* Unidades por pallet — número antes de UND? no fim da string */
  const endMatch = s.match(/(\d+)\s*UND?\s*$/);
  if (endMatch) return { tamanho, undPorPalete: Number(endMatch[1]) };

  /* Fallback: ": N UN" (ex.: "PALETE P: 11 UND") */
  const colonMatch = s.match(/:\s*(\d+)\s*UN/);
  if (colonMatch) return { tamanho, undPorPalete: Number(colonMatch[1]) };

  /* Fallback: "C/NUND" sem = final (ex.: "C/18 UND") */
  const cslash = s.match(/C\/\s*(\d+)\s*UN/);
  if (cslash) return { tamanho, undPorPalete: Number(cslash[1]) };

  return null;
}

/* Lê a planilha de paletes e retorna um mapa item → { tamanho, undPorPalete }. */
export function lerPaletes(wb: XLSX.WorkBook): Map<string, PalletItem> {
  const mapa = new Map<string, PalletItem>();

  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });

    /* Procura o cabeçalho com "COD ITEM" e "PALLET FORRO" */
    const headerIdx = rows.findIndex((r) =>
      r?.some(
        (c) =>
          String(c ?? "").toUpperCase().includes("COD ITEM") ||
          String(c ?? "").toUpperCase().includes("PALLET FORRO"),
      ),
    );
    if (headerIdx < 0) continue;

    const headers = rows[headerIdx]!.map((c) => String(c ?? "").toUpperCase().trim());
    const cItem = headers.findIndex((h) => h === "COD ITEM" || h.includes("COD ITEM"));
    const cPallet = headers.findIndex((h) => h.includes("PALLET"));

    if (cItem < 0 || cPallet < 0) continue;

    for (const r of rows.slice(headerIdx + 1)) {
      if (!r) continue;
      const item = String(r[cItem] ?? "").trim();
      if (!item) continue;
      const palletStr = String(r[cPallet] ?? "").trim();
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
  const porTamanho = new Map<
    string,
    { paletes: number; itens: number; und: number }
  >();

  for (const it of itensEstoque) {
    const pallet = paletes.get(it.item);
    if (!pallet || pallet.undPorPalete <= 0) continue;
    const paletesItem = Math.round(it.saldo / pallet.undPorPalete);
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
