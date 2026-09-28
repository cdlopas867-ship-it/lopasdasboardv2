import * as XLSX from "xlsx";

/* Item da aba "Base Estoque" — usado nas telas de Top Produtos,
 * Curva ABC, Fichas Técnicas e composição por unidade. */
export type ItemEstoque = {
  item: string;
  desc: string;
  mascara: string;
  saldo: number;
  peso: number;
  custo: number;
  valor: number;
  unidade: string;
  curva: string;
};

/* Lê a base de itens de estoque de qualquer aba da planilha.
 * Detecta o cabeçalho pela presença de "SALDO" + "CUSTO MEDIO"/"CUSTO MÉDIO". */
export function lerItensEstoque(wb: XLSX.WorkBook): ItemEstoque[] {
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
    const headerIdx = rows.findIndex((r) => {
      if (!r) return false;
      const up = r.map((c) => String(c ?? "").toUpperCase().trim());
      return (
        up.some((h) => h === "SALDO" || h === "SALDO FOCCO") &&
        up.some((h) => h.includes("CUSTO MEDIO") || h.includes("CUSTO MÉDIO")) &&
        up.some((h) => h === "ITEM")
      );
    });
    if (headerIdx < 0) continue;

    const headers = rows[headerIdx]!.map((c) => String(c ?? "").toUpperCase().trim());
    const col = (...needles: string[]) =>
      headers.findIndex((h) => needles.some((n) => h === n));
    const colIncl = (...needles: string[]) =>
      headers.findIndex((h) => needles.some((n) => h.includes(n)));

    const cItem = col("ITEM");
    const cDesc = colIncl("DESC");
    const cMasc = colIncl("MASCARA", "MÁSCARA");
    const cSaldo = col("SALDO", "SALDO FOCCO");
    const cPeso = colIncl("PESO LIQ TOTAL", "PESO TOTAL");
    const cCusto = colIncl("CUSTO MEDIO", "CUSTO MÉDIO");
    const cValor = colIncl("VALOR ESTOQUE", "VALOR");
    const cUnid = colIncl("CLASSIFICACAO N1", "CLASSIFICAÇÃO N1", "CATEGORIA");
    const cCurva = colIncl("CURVA");

    if (cItem < 0 || cSaldo < 0) continue;

    const num = (r: unknown[], i: number) => (i >= 0 ? Number(r[i] ?? 0) || 0 : 0);
    const str = (r: unknown[], i: number) => (i >= 0 ? String(r[i] ?? "").trim() : "");

    const itens: ItemEstoque[] = [];
    for (const r of rows.slice(headerIdx + 1)) {
      if (!r) continue;
      const item = str(r, cItem);
      if (!item) continue;
      const saldo = num(r, cSaldo);
      if (!saldo) continue;
      itens.push({
        item,
        desc: str(r, cDesc),
        mascara: str(r, cMasc),
        saldo,
        peso: num(r, cPeso),
        custo: num(r, cCusto),
        valor: num(r, cValor),
        unidade: str(r, cUnid),
        curva: str(r, cCurva),
      });
    }
    if (itens.length > 0) return itens;
  }
  return [];
}

export type ClasseAbc = { classe: string; itens: number; pctItens: number; pctValor: number; ton: number };

/* Agrupa itens de estoque por curva ABC (A, B, C), com a tonelagem de cada
   classe — a curva C representa o estoque de giro mais lento. */
export function curvaAbcEstoque(itens: ItemEstoque[]): ClasseAbc[] {
  const mapa = new Map<string, { itens: number; valor: number; peso: number }>();
  for (const i of itens) {
    const classe = (i.curva || "-").toUpperCase();
    const atual = mapa.get(classe) ?? { itens: 0, valor: 0, peso: 0 };
    atual.itens += 1;
    atual.valor += i.valor;
    atual.peso += i.peso;
    mapa.set(classe, atual);
  }
  const totalItens = itens.length;
  const totalValor = itens.reduce((s, i) => s + i.valor, 0);
  return [...mapa.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([classe, v]) => ({
      classe,
      itens: v.itens,
      pctItens: totalItens > 0 ? (v.itens / totalItens) * 100 : 0,
      pctValor: totalValor > 0 ? (v.valor / totalValor) * 100 : 0,
      ton: +(v.peso / 1000).toFixed(1),
    }));
}

/* Agrupa o recebimento por curva ABC a partir da aba Base Recebimento.
 * O percentual usa o peso recebido de cada classe. */
export function curvaAbcRecebimento(wb: XLSX.WorkBook): ClasseAbc[] {
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
    const headerIdx = rows.findIndex((r) =>
      r?.some((c) => String(c ?? "").toUpperCase().trim() === "DT_INICIO"),
    );
    if (headerIdx < 0) continue;
    const headers = rows[headerIdx]!.map((c) => String(c ?? "").toUpperCase().trim());
    const cCurva = headers.findIndex((h) => h.includes("CURVA"));
    const cPeso = headers.findIndex((h) => h.includes("PESO"));
    const cItem = headers.findIndex((h) => h === "ITEM");
    if (cCurva < 0 || cPeso < 0) continue;

    const mapa = new Map<string, { itens: Set<string>; peso: number }>();
    for (const r of rows.slice(headerIdx + 1)) {
      if (!r) continue;
      const classe = String(r[cCurva] ?? "").toUpperCase().trim();
      if (!classe) continue;
      const peso = Number(r[cPeso] ?? 0) || 0;
      const atual = mapa.get(classe) ?? { itens: new Set<string>(), peso: 0 };
      atual.peso += peso;
      if (cItem >= 0) atual.itens.add(String(r[cItem] ?? "").trim());
      mapa.set(classe, atual);
    }
    if (!mapa.size) continue;

    const totalItens = [...mapa.values()].reduce((s, v) => s + v.itens.size, 0);
    const totalPeso = [...mapa.values()].reduce((s, v) => s + v.peso, 0);
    return [...mapa.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([classe, v]) => ({
        classe,
        itens: v.itens.size,
        pctItens: totalItens > 0 ? (v.itens.size / totalItens) * 100 : 0,
        pctValor: totalPeso > 0 ? (v.peso / totalPeso) * 100 : 0,
        ton: +(v.peso / 1000).toFixed(1),
      }));
  }
  return [];
}
