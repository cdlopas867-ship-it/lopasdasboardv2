import * as XLSX from "xlsx";

export type Avaria = {
  data: string;
  mes: string;
  colaborador: string;
  origem: string;
  destino: string;
  quantidade: number;
  item: string;
  producao: string;
  descricao: string;
  cor: string;
  motivo: string;
  custoMedio: number;
  custo: number; // CUSTO MEDIO × Quantidade
  pesoTotal: number;
};

export const ORDEM_MESES: Record<string, number> = {
  JANEIRO: 1, JANIERO: 1, FEVEREIRO: 2, "MARÇO": 3, MARCO: 3, ABRIL: 4,
  MAIO: 5, JUNHO: 6, JULHO: 7, AGOSTO: 8,
  SETEMBRO: 9, OUTUBRO: 10, NOVEMBRO: 11, DEZEMBRO: 12,
};

export function ordemMes(mes: string): number {
  return ORDEM_MESES[mes.toUpperCase().trim()] ?? 99;
}

/* Normaliza o nome do mês para a forma canônica (ex.: "JANIERO" → "JANEIRO",
   "MARCO" → "MARÇO"), usando o mapeamento de ordem. */
const MES_CANONICO: Record<number, string> = {};
for (const [nome, ordem] of Object.entries(ORDEM_MESES)) {
  if (!MES_CANONICO[ordem]) MES_CANONICO[ordem] = nome;
}
export function normalizarMes(mes: string): string {
  const key = mes.toUpperCase().trim();
  const ordem = ORDEM_MESES[key];
  return ordem != null ? (MES_CANONICO[ordem] ?? key) : key;
}

/* Lê a planilha de avarias/movimentações de produção.
 * Detecta pelo cabeçalho com "COLABORADOR" e "DESCRIÇÃO".
 * Procura em TODAS as abas — a aba AVARIAS pode não ser a primeira
 * (ex.: arquivo DADOSGERENCIAMENTO.xlsx tem CARREGADO, SAIDAS CD, AVARIAS). */
export function lerAvarias(wb: XLSX.WorkBook): Avaria[] {
  /* Encontra a aba com o cabeçalho de avarias */
  let ws: XLSX.WorkSheet | undefined;
  let rows: unknown[][] = [];
  let headerIdx = -1;
  for (const name of wb.SheetNames) {
    const candidate = wb.Sheets[name];
    if (!candidate) continue;
    const raw = XLSX.utils.sheet_to_json<unknown[]>(candidate, { header: 1, defval: null });
    const idx = raw.findIndex((r) =>
      r?.some((c) => String(c ?? "").toUpperCase().includes("COLABORADOR")),
    );
    if (idx >= 0) { ws = candidate; rows = raw; headerIdx = idx; break; }
  }
  if (!ws || headerIdx < 0 || !rows.length) return [];

  const headers = rows[headerIdx]!.map((c) => String(c ?? "").toUpperCase().trim());
  const col = (needle: string) => headers.findIndex((h) => h === needle);
  const colIncl = (needle: string) => headers.findIndex((h) => h.includes(needle));

  const cColab = col("COLABORADOR");
  const cDesc = col("DESCRIÇÃO");
  if (cColab < 0 || cDesc < 0) return [];

  const cData = colIncl("DATA/HORA");
  const cMes = Math.max(col("MÊS"), col("MES"));
  const cOrig = col("ORIGEM");
  const cDest = col("DESTINO");
  const cQtd = col("QUANTIDADE");
  const cItem = col("ITEM");
  const cProd = Math.max(col("PRODUÇÃO"), colIncl("PRODU"));
  const cCor = col("COR");
  const cMotivo = Math.max(col("MOTIVO"), colIncl("MOTIVO"));
  const cCusto = colIncl("CUSTO MEDIO");
  const cPeso = colIncl("PESO TOTAL");

  const num = (r: unknown[] | undefined, i: number) => (i >= 0 ? Number(r?.[i] ?? 0) : 0);
  const str = (r: unknown[] | undefined, i: number) => (i >= 0 ? String(r?.[i] ?? "").trim() : "");

  const result: Avaria[] = [];
  for (const r of rows.slice(headerIdx + 1)) {
    if (!r || !r[cColab]) continue;
    const quantidade = num(r, cQtd);
    const custoMedio = num(r, cCusto);
    result.push({
      data: str(r, cData),
      mes: normalizarMes(str(r, cMes)),
      colaborador: str(r, cColab),
      origem: str(r, cOrig),
      destino: str(r, cDest),
      quantidade,
      item: String(Math.floor(num(r, cItem))),
      producao: str(r, cProd),
      descricao: str(r, cDesc),
      cor: str(r, cCor),
      motivo: str(r, cMotivo),
      custoMedio,
      custo: custoMedio * quantidade,
      pesoTotal: num(r, cPeso),
    });
  }
  return result;
}

/* Mescla as listas de avarias das várias planilhas da pasta.
 * A base histórica traz CUSTO MEDIO/PESO, e a aba do arquivo de
 * gerenciamento traz os lançamentos mais recentes (ex.: setembro) sem custo.
 * Mantém todos os lançamentos, sem duplicar, e completa custo e peso pelo
 * valor unitário já conhecido do mesmo item. */
export function mesclarAvarias(listas: Avaria[][]): Avaria[] {
  const chave = (a: Avaria) =>
    `${a.data}|${a.item}|${a.origem}|${a.quantidade}|${(a.motivo || "").toUpperCase().trim()}`;

  const mapa = new Map<string, Avaria>();
  for (const lista of listas) {
    for (const a of lista) {
      const k = chave(a);
      const atual = mapa.get(k);
      /* Prefere o lançamento que já tem custo/peso preenchidos */
      if (!atual) { mapa.set(k, a); continue; }
      /* Completa os campos vazios com o que a outra planilha traz */
      mapa.set(k, {
        ...atual,
        motivo: atual.motivo || a.motivo,
        colaborador: atual.colaborador || a.colaborador,
        cor: atual.cor || a.cor,
        descricao: atual.descricao || a.descricao,
        producao: atual.producao || a.producao,
        custoMedio: atual.custoMedio > 0 ? atual.custoMedio : a.custoMedio,
        custo: atual.custo > 0 ? atual.custo : a.custo,
        pesoTotal: atual.pesoTotal > 0 ? atual.pesoTotal : a.pesoTotal,
      });
    }
  }

  /* Valor e peso unitários por item, a partir dos lançamentos com custo */
  const custoUnit = new Map<string, number>();
  const pesoUnit = new Map<string, number>();
  for (const a of mapa.values()) {
    if (a.custoMedio > 0 && !custoUnit.has(a.item)) custoUnit.set(a.item, a.custoMedio);
    if (a.pesoTotal > 0 && a.quantidade > 0 && !pesoUnit.has(a.item)) {
      pesoUnit.set(a.item, a.pesoTotal / a.quantidade);
    }
  }

  const completas = [...mapa.values()].map((a) => {
    const custoMedio = a.custoMedio > 0 ? a.custoMedio : (custoUnit.get(a.item) ?? 0);
    const pesoTotal =
      a.pesoTotal > 0 ? a.pesoTotal : (pesoUnit.get(a.item) ?? 0) * a.quantidade;
    return { ...a, custoMedio, custo: custoMedio * a.quantidade, pesoTotal };
  });

  return completas.sort(
    (x, y) => ordemMes(x.mes) - ordemMes(y.mes) || x.data.localeCompare(y.data),
  );
}
