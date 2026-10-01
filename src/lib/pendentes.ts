import * as XLSX from "xlsx";

export type PendenteProducao = {
  dtInicial: string;
  dtFinal: string;
  lote: string;
  numOrdem: string;
  codItem: string;
  descItem: string;
  previsto: number;
  entregue: number;
  pendente: number;
  perc: number;
  pesoPendente: number;
};

export type AlertaPendente = "critico" | "prazo";

function parseDate(s: string): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(+m[1]!, +m[2]! - 1, +m[3]!);
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

/* Converte valor de data (serial Excel, ISO ou dd/mm/aaaa) para ISO aaaa-mm-dd */
function serialToIso(v: unknown): string {
  if (typeof v === "number")
    return new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 10);
  const s = String(v ?? "").trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const n = Number(s);
  if (!isNaN(n) && n > 30000)
    return new Date(Math.round((n - 25569) * 86400000)).toISOString().slice(0, 10);
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return s;
}

/* Classifica a pendência pelo mês da DT FINAL: CRÍTICO quando a data final
   está 3 ou mais meses atrás do mês atual, NO PRAZO caso contrário. */
export function alertaPorData(dtFinal: string): AlertaPendente {
  const data = parseDate(dtFinal);
  if (!data) return "prazo";
  const agora = new Date();
  const diffMeses =
    (agora.getFullYear() - data.getFullYear()) * 12 +
    (agora.getMonth() - data.getMonth());
  if (diffMeses >= 3) return "critico";
  return "prazo";
}

/* Lê a planilha "PCP 004 - Análise de Realização Pendente".
 * Busca em todas as abas que contenham os cabeçalhos principais e filtra itens
 * com QTDE PENDENTE > 0. */
export function lerPendentes(wb: XLSX.WorkBook): PendenteProducao[] {
  const matches = wb.SheetNames
    .map((name) => wb.Sheets[name])
    .filter(Boolean) as XLSX.WorkSheet[];

  for (const ws of matches) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
    if (!rows.length) continue;

    const headerIdx = rows.findIndex((r) =>
      r?.some((c) => {
        const h = normalizeHeader(c);
        return h.includes("DTINICIAL") || h.includes("DATAINICIAL");
      }),
    );
    if (headerIdx < 0) continue;

    const headers = rows[headerIdx]!.map((c) => normalizeHeader(c));
    const col = (needle: string) => headers.findIndex((h) => h.includes(needle));

    const cPend = col("QTDEPENDENTE");
    const cPeso = col("PESOPENDENTE");
    if (cPend < 0 || cPeso < 0) continue;

    const cDtIni = col("DTINICIAL");
    const cDtFim = col("DTFINAL");
    const cLote = col("LOTE");
    const cOrdem = col("NUMORDEM");
    const cCod = col("CODITEM");
    const cDesc = col("DESCITEM");
    const cPrev = col("PREVISTO");
    const cEntg = col("ENTREGUE");
    const cPrevFix = headers.findIndex((h) => h === "PREVISTO");
    const cPerc = headers.findIndex((h) => h === "PERC");

    const num = (r: unknown[] | undefined, i: number) => Number(r?.[i] ?? 0);
    const str = (r: unknown[] | undefined, i: number) => String(r?.[i] ?? "").trim();

    const result: PendenteProducao[] = [];
    for (const r of rows.slice(headerIdx + 1)) {
      const pendente = num(r, cPend);
      if (pendente <= 0) continue;
      result.push({
        dtInicial: serialToIso(r?.[cDtIni >= 0 ? cDtIni : 0]),
        dtFinal: serialToIso(r?.[cDtFim >= 0 ? cDtFim : 0]),
        lote: str(r, cLote >= 0 ? cLote : 0),
        numOrdem: str(r, cOrdem >= 0 ? cOrdem : 0),
        codItem: str(r, cCod >= 0 ? cCod : 0),
        descItem: str(r, cDesc >= 0 ? cDesc : 0),
        previsto: num(r, cPrevFix >= 0 ? cPrevFix : cPrev >= 0 ? cPrev : 0),
        entregue: num(r, cEntg >= 0 ? cEntg : 0),
        pendente,
        perc: num(r, cPerc >= 0 ? cPerc : 0),
        pesoPendente: num(r, cPeso),
      });
    }
    if (result.length) return result;
  }

  return [];
}
