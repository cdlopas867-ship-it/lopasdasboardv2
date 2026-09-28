/* Parser da aba "SAIDAS CD" do arquivo DADOSGERENCIAMENTO.xlsx.
 *
 * A aba tem duas seções:
 *  1. Resumo mensal (linhas iniciais): Mês → Motivo, Toelada, Faturado
 *  2. Detalhamento por NFe: NFe, Data Emissão, Mês, Qtd Volumes, Motivo,
 *     Peso Liquido, Tanelada, Valor Liquido
 *
 * Agregamos o detalhamento por mês e por motivo para alimentar o dashboard. */

import * as XLSX from "xlsx";

export type SaidaCDMotivo = {
  motivo: string;
  tonelada: number;
  faturado: number;
};

export type SaidaCDMes = {
  mes: string; // "Mai", "Jun", ...
  tonelada: number;
  faturado: number;
  motivos: SaidaCDMotivo[];
};

export type SaidasCD = {
  meses: SaidaCDMes[];
  totalTonelada: number;
  totalFaturado: number;
};

const MESES_LINHA: Record<string, string> = {
  JANEIRO: "Jan", FEVEREIRO: "Fev", "MARÇO": "Mar", MARCO: "Mar", ABRIL: "Abr",
  MAIO: "Mai", JUNHO: "Jun", JULHO: "Jul", AGOSTO: "Ago",
  SETEMBRO: "Set", OUTUBRO: "Out", NOVEMBRO: "Nov", DEZEMBRO: "Dez",
};

function mesCurto(mes: string): string {
  return MESES_LINHA[mes.toUpperCase().trim()] ?? mes;
}

/* Lê a aba SAIDAS CD e agrega por mês e motivo.
   Retorna null se a aba não existir ou não tiver dados. */
export function lerSaidasCD(wb: XLSX.WorkBook): SaidasCD | null {
  /* Procura a aba SAIDAS CD em qualquer posição */
  let ws: XLSX.WorkSheet | undefined;
  for (const name of wb.SheetNames) {
    if (/SAIDAS?\s*CD/i.test(name)) { ws = wb.Sheets[name]; break; }
  }
  if (!ws) return null;

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  if (!rows.length) return null;

  /* Encontra o cabeçalho do detalhamento (NFe, Data Emissão, ...)).
     O cabeçalho "NFe" pode estar em qualquer coluna (em alguns layouts
     as colunas iniciais ficam vazias). */
  const headerIdx = rows.findIndex((r) =>
    r?.some((c) => c != null && String(c).toUpperCase().includes("NFE")),
  );
  if (headerIdx < 0) return null;

  const headers = rows[headerIdx]!.map((c) => String(c ?? "").toUpperCase().trim());
  const col = (needle: string) => headers.findIndex((h) => h === needle);
  const colIncl = (needle: string) => headers.findIndex((h) => h.includes(needle));

  const cMes = Math.max(col("MÊS"), col("MES"));
  const cMotivo = col("MOTIVO");
  const cTonelada = colIncl("TANELADA");
  const cValor = colIncl("VALOR LIQUIDO");

  if (cMes < 0 || cMotivo < 0) return null;

  const num = (r: unknown[] | undefined, i: number) => (i >= 0 ? Number(r?.[i] ?? 0) : 0);
  const str = (r: unknown[] | undefined, i: number) => (i >= 0 ? String(r?.[i] ?? "").trim() : "");

  /* Agrega por mês */
  const porMes = new Map<string, { tonelada: number; faturado: number; motivos: Map<string, { tonelada: number; faturado: number }> }>();

  for (const r of rows.slice(headerIdx + 1)) {
    if (!r || !r[cMes]) continue;
    const mesNome = str(r, cMes);
    if (!mesNome) continue;
    const mesKey = mesCurto(mesNome);
    const motivo = str(r, cMotivo) || "Sem motivo";
    const tonelada = num(r, cTonelada);
    const faturado = num(r, cValor);

    if (!porMes.has(mesKey)) {
      porMes.set(mesKey, { tonelada: 0, faturado: 0, motivos: new Map() });
    }
    const mes = porMes.get(mesKey)!;
    mes.tonelada += tonelada;
    mes.faturado += faturado;
    if (!mes.motivos.has(motivo)) {
      mes.motivos.set(motivo, { tonelada: 0, faturado: 0 });
    }
    const m = mes.motivos.get(motivo)!;
    m.tonelada += tonelada;
    m.faturado += faturado;
  }

  if (!porMes.size) return null;

  /* Ordena meses cronologicamente */
  const ordem: Record<string, number> = {
    Jan: 1, Fev: 2, Mar: 3, Abr: 4, Mai: 5, Jun: 6,
    Jul: 7, Ago: 8, Set: 9, Out: 10, Nov: 11, Dez: 12,
  };

  const meses: SaidaCDMes[] = [...porMes.entries()]
    .sort((a, b) => (ordem[a[0]] ?? 99) - (ordem[b[0]] ?? 99))
    .map(([mes, d]) => ({
      mes,
      tonelada: d.tonelada,
      faturado: d.faturado,
      motivos: [...d.motivos.entries()]
        .map(([motivo, m]) => ({ motivo, tonelada: m.tonelada, faturado: m.faturado }))
        .sort((a, b) => b.tonelada - a.tonelada),
    }));

  const totalTonelada = meses.reduce((s, m) => s + m.tonelada, 0);
  const totalFaturado = meses.reduce((s, m) => s + m.faturado, 0);

  return { meses, totalTonelada, totalFaturado };
}
