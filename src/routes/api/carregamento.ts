import { createFileRoute } from "@tanstack/react-router";
import { requireApiAccess } from "@/lib/gate.server";

/* Planilha pública do Google Sheets com os dados de recebimento e carregamento. */
const SHEET_ID = "1cvc8dD1_jDPZ7bXWnyw7cwQEniS0LI2V";

type DiaCarregamento = {
  data: string;
  recebido: number;
  carregado: number;
  cargas: number;
};

/* Converte data "m/d/yyyy" (formato do Google Sheets em inglês) para "dd/mm". */
function normalizarData(v: string): string {
  const s = String(v ?? "").trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return s;
  return `${m[1]!.padStart(2, "0")}/${m[2]!.padStart(2, "0")}`;
}

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

/* Parser CSV que respeita aspas — campos entre aspas podem conter vírgulas. */
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
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += ch;
      }
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export const Route = createFileRoute("/api/carregamento")({
  server: {
    handlers: {
      GET: async () => {
        const denied = await requireApiAccess();
        if (denied) return denied;
        try {
          const res = await fetch(
            `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`,
            { redirect: "follow" },
          );
          if (!res.ok) {
            return Response.json(
              { error: `Falha ao buscar planilha: ${res.status}` },
              { status: 502 },
            );
          }
          const csv = await res.text();
          const rows = parseCsv(csv);

          /* Estrutura do CSV (por posição, já que há colunas "Data" e "Tonelada"
             repetidas em diferentes blocos):
             col 1: Recebido Data
             col 3: Recebido Toneladas
             col 10: Carregamento Data
             col 11: Carregamento Tonelada
             col 12: N° Cargas
          */
          const COL_REC_DATA = 1;
          const COL_REC_TON = 3;
          const COL_CARG_DATA = 10;
          const COL_CARG_TON = 11;
          const COL_CARGAS = 12;

          /* Encontra a linha de cabeçalho (contém "Qtd Volumes") */
          const headerIdx = rows.findIndex(
            (r) => r.some((c) => /Qtd Volumes/i.test(c)),
          );
          if (headerIdx < 0) {
            return Response.json(
              { error: "Cabeçalho não encontrado na planilha" },
              { status: 422 },
            );
          }

          const dias: DiaCarregamento[] = [];
          for (let i = headerIdx + 1; i < rows.length; i++) {
            const r = rows[i]!;
            const dataRaw = (r[COL_REC_DATA] ?? "").trim();
            // Para quando achar linha de total (sem data válida)
            if (!dataRaw || !/\d{1,2}\/\d{1,2}/.test(dataRaw)) continue;

            const data = normalizarData(dataRaw);
            const recebido = parseNum(r[COL_REC_TON] ?? "0");
            const carregado = parseNum(r[COL_CARG_TON] ?? "0");
            const cargas = parseNum(r[COL_CARGAS] ?? "0");

            dias.push({ data, recebido, carregado, cargas });
          }

          const totalRecebido = dias.reduce((s, d) => s + d.recebido, 0);
          const totalCarregado = dias.reduce((s, d) => s + d.carregado, 0);
          const totalCargas = dias.reduce((s, d) => s + d.cargas, 0);
          const mediaPct = totalRecebido > 0 ? (totalCarregado / totalRecebido) * 100 : 0;

          return Response.json({
            dias,
            totalRecebido,
            totalCarregado,
            totalCargas,
            mediaPct,
          });
        } catch (e) {
          return Response.json(
            { error: `Erro interno: ${(e as Error).message}` },
            { status: 500 },
          );
        }
      },
    },
  },
});
