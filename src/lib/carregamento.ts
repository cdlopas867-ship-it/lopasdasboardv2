/* Busca dados de recebimento e carregamento por mês de uma planilha pública
   do Google Sheets. Reutilizado pelo auto-import do Drive e pela API
   /api/carregamento-mensal. */

import * as XLSX from "xlsx";

const SHEET_ID = "1cvc8dD1_jDPZ7bXWnyw7cwQEniS0LI2V";

export type MesData = {
  mes: string;
  recebido: number;
  carregado: number;
};

/* Converte número no formato pt-BR ("382,52") ou en ("382.52") para float. */
function parseNum(v: string): number {
  if (typeof v === "number") return v;
  const s = String(v ?? "").trim();
  if (!s) return 0;
  const limpo = s.replace(/[R$\s]/g, "");
  if (limpo.includes(",") && limpo.includes(".")) {
    return Number(limpo.replace(/\./g, "").replace(",", ".")) || 0;
  }
  if (limpo.includes(",")) {
    return Number(limpo.replace(",", ".")) || 0;
  }
  return Number(limpo) || 0;
}

/* Parser CSV que respeita aspas. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else { field += ch; }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else { field += ch; }
    }
  }
  if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

async function fetchSheetCsv(sheetName: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Falha ao buscar aba ${sheetName}: ${res.status}`);
  return parseCsv(await res.text());
}

const MESES_ABAS = [
  { mes: "Mai", aba: "Maio" },
  { mes: "Jun", aba: "Junho" },
  { mes: "Jul", aba: "Julho" },
  { mes: "Ago", aba: "Agosto" },
  { mes: "Set", aba: "Setembro" },
];

export async function buscarCarregamentoMensal(): Promise<{
  meses: MesData[];
  totalRecebido: number;
  totalCarregado: number;
} | null> {
  const [cargResult, ...mesResults] = await Promise.allSettled([
    fetchSheetCsv("Gerenciamento Carregamento"),
    ...MESES_ABAS.map((m) => fetchSheetCsv(m.aba)),
  ]);

  const carregadoPorMes = new Map<string, number>();
  if (cargResult.status === "fulfilled") {
    for (const r of cargResult.value.slice(1)) {
      const mesNome = (r[2] ?? "").trim().toUpperCase();
      const toneladas = parseNum(r[4] ?? "0");
      if (!mesNome || toneladas <= 0) continue;
      carregadoPorMes.set(mesNome, (carregadoPorMes.get(mesNome) ?? 0) + toneladas);
    }
  }

  const meses: MesData[] = MESES_ABAS.map(({ mes, aba }, i) => {
    let recebido = 0;
    const res = mesResults[i]!;
    if (res.status === "fulfilled") {
      for (const r of res.value.slice(1)) {
        const val = parseNum(r[5] ?? "0");
        if (val > 0) recebido += val;
      }
    }
    const carregado = carregadoPorMes.get(aba.toUpperCase()) ?? 0;
    return { mes, recebido, carregado };
  });

  const totalRecebido = meses.reduce((s, m) => s + m.recebido, 0);
  const totalCarregado = meses.reduce((s, m) => s + m.carregado, 0);

  if (totalRecebido === 0 && totalCarregado === 0) return null;
  return { meses, totalRecebido, totalCarregado };
}

/* Carregado dos meses que ainda não constam na planilha do Drive (que
   começa em maio) — valores da planilha "Toneladas Mensal" enviada pelo
   usuário. Usados apenas quando o Drive não traz o mês. */
export const CARREGADO_SEM_DRIVE: Record<string, number> = {
  Jan: 3805,
  Fev: 3535,
  Mar: 6607,
  Abr: 6671,
};

/* Mapeia nome do mês em português (MAIO, SETEMBRO, etc.) para a forma curta. */
const MES_LINHA_PARA_CURTO: Record<string, string> = {
  MAIO: "Mai", JUNHO: "Jun", JULHO: "Jul", AGOSTO: "Ago",
  SETEMBRO: "Set", OUTUBRO: "Out", NOVEMBRO: "Nov", DEZEMBRO: "Dez",
  JANEIRO: "Jan", FEVEREIRO: "Fev", "MARÇO": "Mar", MARCO: "Mar", ABRIL: "Abr",
};

/* Lê a aba "CARREGADO" de um workbook do Drive e agrega toneladas por mês.
   Retorna um Map<mesCurto, toneladas> ou null se a aba não existir. */
export function lerCarregadoMensal(wb: XLSX.WorkBook): Map<string, number> | null {
  let ws: XLSX.WorkSheet | undefined;
  for (const name of wb.SheetNames) {
    if (/CARREGADO/i.test(name)) { ws = wb.Sheets[name]; break; }
  }
  /* Fallback: se nenhuma aba com nome "CARREGADO", procura em todas as
     abas uma que tenha os cabeçalhos "MÊS" e "TONELADAS". */
  if (!ws) {
    for (const name of wb.SheetNames) {
      const candidate = wb.Sheets[name];
      if (!candidate) continue;
      const raw = XLSX.utils.sheet_to_json<unknown[]>(candidate, { header: 1, defval: null });
      const hasHeaders = raw.some((r) =>
        r?.some((c) => String(c ?? "").toUpperCase().trim() === "MÊS") &&
        r?.some((c) => String(c ?? "").toUpperCase().trim() === "TONELADAS"),
      );
      if (hasHeaders) { ws = candidate; break; }
    }
  }
  if (!ws) return null;

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  /* Encontra a linha de cabeçalho com "Mês" e "Toneladas" */
  const headerIdx = rows.findIndex((r) =>
    r?.some((c) => String(c ?? "").toUpperCase().trim() === "MÊS") &&
    r?.some((c) => String(c ?? "").toUpperCase().trim() === "TONELADAS"),
  );
  if (headerIdx < 0) return null;

  const headers = rows[headerIdx]!.map((c) => String(c ?? "").toUpperCase().trim());
  const cMes = headers.findIndex((h) => h === "MÊS");
  const cTon = headers.findIndex((h) => h === "TONELADAS");
  if (cMes < 0 || cTon < 0) return null;

  const porMes = new Map<string, number>();
  for (const r of rows.slice(headerIdx + 1)) {
    if (!r || !r[cMes]) continue;
    const mesNome = String(r[cMes] ?? "").trim().toUpperCase();
    const mesCurto = MES_LINHA_PARA_CURTO[mesNome];
    if (!mesCurto) continue;
    const ton = Number(r[cTon] ?? 0) || 0;
    if (ton <= 0) continue;
    porMes.set(mesCurto, (porMes.get(mesCurto) ?? 0) + ton);
  }

  return porMes.size > 0 ? porMes : null;
}

/* Última data (ISO yyyy-mm-dd) com carregamento na aba/planilha de carregado. */
export function lerUltimaDataCarregado(wb: XLSX.WorkBook): string | null {
  let melhor: string | null = null;
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
    const hIdx = rows.findIndex((r) =>
      r?.some((c) => String(c ?? "").toUpperCase().trim() === "DATA") &&
      r?.some((c) => String(c ?? "").toUpperCase().trim() === "TONELADAS"),
    );
    if (hIdx < 0) continue;
    const hs = rows[hIdx]!.map((c) => String(c ?? "").toUpperCase().trim());
    const cData = hs.indexOf("DATA");
    const cTon = hs.indexOf("TONELADAS");
    for (const r of rows.slice(hIdx + 1)) {
      const v = r?.[cData];
      if (!r || (Number(r[cTon] ?? 0) || 0) <= 0) continue;
      let iso: string | null = null;
      if (typeof v === "number") iso = new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 10);
      else if (v instanceof Date) iso = v.toISOString().slice(0, 10);
      else {
        const m = String(v ?? "").match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (m) iso = `${m[3]}-${m[2]}-${m[1]}`;
      }
      if (iso && (!melhor || iso > melhor)) melhor = iso;
    }
  }
  return melhor;
}
