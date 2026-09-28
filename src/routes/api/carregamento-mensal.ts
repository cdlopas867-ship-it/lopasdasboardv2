import { createFileRoute } from "@tanstack/react-router";
import { requireApiAccess } from "@/lib/gate.server";

/* Planilha pública do Google Sheets com os dados de recebimento e carregamento. */
const SHEET_ID = "1cvc8dD1_jDPZ7bXWnyw7cwQEniS0LI2V";

type MesData = {
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

/* Busca uma aba específica via gviz/tq (exportação CSV por nome de aba). */
async function fetchSheetCsv(sheetName: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Falha ao buscar aba ${sheetName}: ${res.status}`);
  const text = await res.text();
  return parseCsv(text);
}

/* Meses e suas abas na planilha (ordem cronológica). */
const MESES_ABAS = [
  { mes: "Mai", aba: "Maio" },
  { mes: "Jun", aba: "Junho" },
  { mes: "Jul", aba: "Julho" },
  { mes: "Ago", aba: "Agosto" },
  { mes: "Set", aba: "Setembro" },
];

export const Route = createFileRoute("/api/carregamento-mensal")({
  server: {
    handlers: {
      GET: async () => {
        const denied = await requireApiAccess();
        if (denied) return denied;
        try {
          // Busca a aba de carregamento + todas as abas mensais em paralelo
          // (antes eram 6 fetches sequenciais ~15s — estourava o timeout do
          // serverless e devolvia um 500 não tratado).
          const [cargResult, ...mesResults] = await Promise.allSettled([
            fetchSheetCsv("Gerenciamento Carregamento"),
            ...MESES_ABAS.map((m) => fetchSheetCsv(m.aba)),
          ]);

          // 1. Carregado por mês — aba "Gerenciamento Carregamento"
          //    Colunas: B=Data, C=Mês, D=Peso, E=Toneladas, F=Qtd Cargas
          const carregadoPorMes = new Map<string, number>();
          if (cargResult.status === "fulfilled") {
            for (const r of cargResult.value.slice(1)) {
              const mesNome = (r[2] ?? "").trim().toUpperCase();
              const toneladas = parseNum(r[4] ?? "0");
              if (!mesNome || toneladas <= 0) continue;
              carregadoPorMes.set(mesNome, (carregadoPorMes.get(mesNome) ?? 0) + toneladas);
            }
          }

          // 2. Recebido por mês nas abas mensais
          //    Coluna F (index 5) = "Realizado" toneladas
          const mesesData: MesData[] = MESES_ABAS.map(({ mes, aba }, i) => {
            let recebido = 0;
            const res = mesResults[i]!;
            if (res.status === "fulfilled") {
              for (const r of res.value.slice(1)) {
                const val = parseNum(r[5] ?? "0");
                if (val > 0) recebido += val;
              }
            }
            // Mapear nome do mês para o formato usado na aba de carregamento
            const mesFull = aba.toUpperCase();
            const carregado = carregadoPorMes.get(mesFull) ?? 0;
            return { mes, recebido, carregado };
          });

          const totalRecebido = mesesData.reduce((s, m) => s + m.recebido, 0);
          const totalCarregado = mesesData.reduce((s, m) => s + m.carregado, 0);

          return Response.json({ meses: mesesData, totalRecebido, totalCarregado });
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
