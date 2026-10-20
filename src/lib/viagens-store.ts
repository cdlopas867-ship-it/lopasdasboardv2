/* Store em memória no servidor para o controle de viagens.
 *
 * Lê a planilha CDEVIAGENS.xlsx da pasta pública do Google Drive
 * (mesma pasta do estoque) e também do arquivo local em /app/public.
 * Atualiza a cada ciclo de importação automática do Drive. */

import * as XLSX from "xlsx";
import { existsSync, readFileSync } from "./fs-compat";

const FOLDER_ID = "16WJaYavcR8B1QgpVsT51Kg0_ADJsSGtQ";
const LOCAL_FILE = "/app/public/CDEVIAGENS.xlsx";

export type Viagem = {
  data: string; // "dd/mm/yyyy"
  inicio: string; // "HH:mm:ss"
  fim: string; // "HH:mm:ss"
  turno: string; // "DIA" | "NOITE"
  totalViagens: number;
  duracaoHoras: number;
};

export type ResumoViagens = {
  viagens: Viagem[];
  totalViagens: number;
  mediaViagens: number;
  totalDias: number;
  mediaPorTurno: { turno: string; media: number; total: number; pct: number }[];
  viagensPorDia: { data: string; total: number }[];
};

const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0) || 0);
const str = (v: unknown) => (v == null ? "" : String(v).trim());

/* Converte serial Excel ou string de tempo para "HH:mm:ss" */
function fmtHora(v: unknown): string {
  if (typeof v === "number") {
    const totalSeg = Math.round(v * 86400);
    const h = Math.floor(totalSeg / 3600) % 24;
    const m = Math.floor(totalSeg / 60) % 60;
    const s = totalSeg % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return str(v);
}

/* Converte data (serial Excel ou string) para "dd/mm/yyyy" */
function fmtData(v: unknown): string {
  if (typeof v === "number") {
    const d = new Date(Math.round((v - 25569) * 86400000));
    return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
  }
  const s = str(v);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return s;
}

/* Calcula duração em horas entre início e fim (lida com virada de dia) */
function calcDuracaoHoras(inicio: string, fim: string): number {
  const [hi = 0, mi = 0, si = 0] = inicio.split(":").map(Number);
  const [hf = 0, mf = 0, sf = 0] = fim.split(":").map(Number);
  if ([hi, mi, si, hf, mf, sf].some(isNaN)) return 0;
  let segsIni = hi * 3600 + mi * 60 + si;
  let segsFim = hf * 3600 + mf * 60 + sf;
  if (segsFim < segsIni) segsFim += 86400;
  return (segsFim - segsIni) / 3600;
}

export function parseSheet(wb: XLSX.WorkBook): Viagem[] {
  const name =
    wb.SheetNames.find((n) => /VIAGENS|VIAGEM/i.test(n)) ?? wb.SheetNames[0];
  if (!name) return [];
  const ws = wb.Sheets[name];
  if (!ws) return [];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  const hi = rows.findIndex((r) => r && r.some((c) => /DATA/i.test(str(c))));
  if (hi < 0) return [];

  const header = (rows[hi] ?? []).map((c) => str(c).toUpperCase());
  const dataRows = rows.slice(hi + 1);

  const findCol = (patterns: RegExp[]) =>
    header.findIndex((c) => patterns.some((p) => p.test(c)));

  const colData = findCol([/^DATA/]);
  const colInicio = findCol([/^IN[ÍI]CIO/]);
  const colFim = findCol([/^FIM/]);
  const colTurno = findCol([/^TURNO/]);
  const colTotal = findCol([/TOTAL.*VIAGENS/, /^TOTAL/, /VIAGENS/]);

  /* Assinatura do controle de viagens: DATA + INÍCIO + FIM + TURNO + TOTAL.
     Sem essas colunas, não é a planilha CDEVIAGENS — evita que relatórios com
     colunas parecidas (DIA/NOME/TURNO da produtividade) sejam lidos como viagens. */
  if (colData < 0 || colInicio < 0 || colFim < 0 || colTurno < 0 || colTotal < 0) return [];

  const viagens: Viagem[] = [];
  for (const r of dataRows) {
    const data = fmtData(r[colData]);
    if (!data || data === "undefined" || /CONTROLE|VIAGENS/i.test(data)) continue;
    const inicio = fmtHora(r[colInicio]);
    const fim = fmtHora(r[colFim]);
    const turno = str(r[colTurno]).toUpperCase().trim();
    const totalViagens = num(r[colTotal]);
    if (!totalViagens && !inicio) continue;
    viagens.push({
      data,
      inicio,
      fim,
      turno: turno || "—",
      totalViagens,
      duracaoHoras: calcDuracaoHoras(inicio, fim),
    });
  }
  return viagens;
}

function calcularResumo(viagens: Viagem[]): ResumoViagens {
  const totalViagens = viagens.reduce((s, v) => s + v.totalViagens, 0);
  const mediaViagens = viagens.length ? totalViagens / viagens.length : 0;

  const porTurno = new Map<string, { total: number; count: number }>();
  for (const v of viagens) {
    const t = v.turno || "—";
    const cur = porTurno.get(t) ?? { total: 0, count: 0 };
    cur.total += v.totalViagens;
    cur.count += 1;
    porTurno.set(t, cur);
  }
  const mediaPorTurno = [...porTurno.entries()]
    .map(([turno, { total, count }]) => ({
      turno,
      media: count ? total / count : 0,
      total,
      pct: totalViagens > 0 ? (total / totalViagens) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const porDia = new Map<string, number>();
  for (const v of viagens) {
    porDia.set(v.data, (porDia.get(v.data) ?? 0) + v.totalViagens);
  }
  const viagensPorDia = [...porDia.entries()]
    .map(([data, total]) => ({ data, total }))
    .sort((a, b) => {
      const [da, ma, ya] = a.data.split("/").map(Number);
      const [db, mb, yb] = b.data.split("/").map(Number);
      return new Date(ya!, ma! - 1, da!).getTime() - new Date(yb!, mb! - 1, db!).getTime();
    });

  return {
    viagens,
    totalViagens,
    mediaViagens,
    totalDias: viagensPorDia.length,
    mediaPorTurno,
    viagensPorDia,
  };
}

let cache: ResumoViagens | null = null;

/* Processa um workbook já baixado e atualiza o cache se encontrar viagens.
   Evita baixar novamente as planilhas quando chamado pelo auto-import do Drive. */
export function processarViagensWb(wb: XLSX.WorkBook): boolean {
  const viagens = parseSheet(wb);
  if (viagens.length > 0) {
    cache = calcularResumo(viagens);
    return true;
  }
  return false;
}

async function listarPlanilhasDaPasta(folderId: string): Promise<string[]> {
  const res = await fetch(
    `https://drive.google.com/embeddedfolderview?id=${folderId}#list`,
    { redirect: "follow" },
  );
  if (!res.ok) throw new Error(`Pasta ${folderId}: ${res.status}`);
  const html = await res.text();
  const ids: string[] = [];
  const re = /\/file\/d\/([a-zA-Z0-9_-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (!ids.includes(m[1]!)) ids.push(m[1]!);
  }
  return ids;
}

/* Atualiza o cache de viagens lendo do Drive (prioridade) ou do arquivo local. */
export async function atualizarViagens(): Promise<ResumoViagens | null> {
  try {
    const ids = await listarPlanilhasDaPasta(FOLDER_ID);
    for (const id of ids) {
      try {
        const res = await fetch(
          `https://drive.google.com/uc?export=download&confirm=t&id=${id}&_=${Date.now()}`,
          { redirect: "follow", cache: "no-store" },
        );
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const viagens = parseSheet(wb);
        if (viagens.length > 0) {
          cache = calcularResumo(viagens);
          return cache;
        }
      } catch {
        /* ignora planilhas que não são de viagens */
      }
    }
  } catch {
    /* Drive indisponível — usa arquivo local */
  }

  if (!cache && existsSync(LOCAL_FILE)) {
    try {
      const buf = readFileSync(LOCAL_FILE);
      const wb = XLSX.read(buf, { type: "buffer" });
      const viagens = parseSheet(wb);
      if (viagens.length > 0) cache = calcularResumo(viagens);
    } catch {
      /* arquivo inválido */
    }
  }

  return cache;
}

export function getViagens(): ResumoViagens | null {
  return cache;
}

/* Inicializa o cache lendo o arquivo local na primeira chamada. */
export function initViagens() {
  if (cache) return;
  if (existsSync(LOCAL_FILE)) {
    try {
      const buf = readFileSync(LOCAL_FILE);
      const wb = XLSX.read(buf, { type: "buffer" });
      const viagens = parseSheet(wb);
      if (viagens.length > 0) cache = calcularResumo(viagens);
    } catch {
      /* arquivo inválido */
    }
  }
}
