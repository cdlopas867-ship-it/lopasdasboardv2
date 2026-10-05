import * as XLSX from "xlsx";
import type { ItemEstoque } from "./base-estoque";

/* Produção da semana — "o que vai descer" da fábrica.
 * Lê a planilha de produção (NUM ORDEM, DT INICIAL, DT FINAL, LOTE,
 * VOLUME, PREVISTO, ENTREGUE, PENDENTE) e agrupa por DT FINAL (dia
 * em que a produção fica pronta). O peso por dia é calculado cruzando
 * o código do item (extraído do campo VOLUME) com o peso unitário
 * da Base Estoque (PESO LIQ TOTAL ÷ SALDO). */

export type ProducaoSemanalDia = {
  iso: string;
  dia: string;
  data: string;
  previsto: number; // unidades previstas
  entregue: number; // unidades entregues
  pendente: number; // unidades pendentes
  tonPrevisto: number; // toneladas previstas
  tonEntregue: number; // toneladas entregues
  tonPendente: number; // toneladas pendentes
  ordens: number; // número de ordens de produção
  lotes: number; // número de lotes únicos
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

/* Converte valor de data (serial Excel, ISO ou dd/mm/aaaa) para ISO aaaa-mm-dd */
function serialToIso(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "number") {
    if (v > 30000)
      return new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 10);
    return null;
  }
  const s = String(v).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return null;
}

/* Extrai o código do item do campo VOLUME.
 * Ex: "72594 VOL CX GR 8 PTS EASY SLIM..." → "72594" */
function extrairCodItem(volume: string): string {
  const m = volume.match(/^(\d+)/);
  return m ? m[1]! : "";
}

/* Constrói mapa item → peso unitário (kg) a partir da Base Estoque.
 * Soma peso e saldo de todas as variantes do mesmo item. */
function mapaPesoUnitario(itens: ItemEstoque[] | undefined): Map<string, number> {
  const mapa = new Map<string, { peso: number; saldo: number }>();
  if (!itens) return mapa;
  for (const it of itens) {
    const cod = it.item.trim();
    if (!cod) continue;
    const atual = mapa.get(cod) ?? { peso: 0, saldo: 0 };
    atual.peso += it.peso;
    atual.saldo += it.saldo;
    mapa.set(cod, atual);
  }
  const result = new Map<string, number>();
  for (const [cod, v] of mapa) {
    if (v.saldo > 0) result.set(cod, v.peso / v.saldo);
  }
  return result;
}

const NOMES_DIA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/* Lê a planilha de produção e retorna os dias com métricas.
 * Detecta a aba pelos cabeçalhos NUM ORDEM + DT INICIAL + PENDENTE. */
export function calcularProducaoSemanal(
  wb: XLSX.WorkBook,
  itensEstoque: ItemEstoque[] | undefined,
): ProducaoSemanalDia[] | null {
  const pesoUnit = mapaPesoUnitario(itensEstoque);

  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
    if (!rows.length) continue;

    const headerIdx = rows.findIndex((r) => {
      if (!r) return false;
      const up = r.map((c) => normalizeHeader(c));
      return (
        up.some((h) => h.includes("NUMORDEM")) &&
        up.some((h) => h.includes("DTINICIAL") || h.includes("DATAINICIAL")) &&
        up.some((h) => h.includes("PENDENTE"))
      );
    });
    if (headerIdx < 0) continue;

    const headers = rows[headerIdx]!.map((c) => normalizeHeader(c));
    const col = (needle: string) => headers.findIndex((h) => h.includes(needle));

    const cDtFim = col("DTFINAL");
    const cOrdem = col("NUMORDEM");
    const cVolume = col("VOLUME");
    const cPrev = col("PREVISTO");
    const cEntg = col("ENTREGUE");
    const cPend = col("PENDENTE");
    const cLote = col("LOTE");

    if (cDtFim < 0 || cPend < 0) continue;

    const num = (r: unknown[] | undefined, i: number) =>
      i >= 0 ? Number(r?.[i] ?? 0) || 0 : 0;
    const str = (r: unknown[] | undefined, i: number) =>
      i >= 0 ? String(r?.[i] ?? "").trim() : "";

    /* Agrupa por dia (DT FINAL) */
    const porDia = new Map<
      string,
      {
        previsto: number;
        entregue: number;
        pendente: number;
        tonPrevisto: number;
        tonEntregue: number;
        tonPendente: number;
        ordens: Set<string>;
        lotes: Set<string>;
      }
    >();

    for (const r of rows.slice(headerIdx + 1)) {
      if (!r) continue;
      const iso = serialToIso(r[cDtFim]);
      if (!iso) continue;

      const previsto = num(r, cPrev);
      const entregue = num(r, cEntg);
      const pendente = num(r, cPend);
      if (previsto <= 0 && entregue <= 0 && pendente <= 0) continue;

      const codItem = cVolume >= 0 ? extrairCodItem(str(r, cVolume)) : "";
      const pesoUnd = codItem ? (pesoUnit.get(codItem) ?? 0) : 0;

      const dia = porDia.get(iso) ?? {
        previsto: 0,
        entregue: 0,
        pendente: 0,
        tonPrevisto: 0,
        tonEntregue: 0,
        tonPendente: 0,
        ordens: new Set<string>(),
        lotes: new Set<string>(),
      };
      dia.previsto += previsto;
      dia.entregue += entregue;
      dia.pendente += pendente;
      dia.tonPrevisto += (previsto * pesoUnd) / 1000;
      dia.tonEntregue += (entregue * pesoUnd) / 1000;
      dia.tonPendente += (pendente * pesoUnd) / 1000;
      if (cOrdem >= 0) dia.ordens.add(str(r, cOrdem));
      if (cLote >= 0) dia.lotes.add(str(r, cLote));
      porDia.set(iso, dia);
    }

    if (porDia.size === 0) continue;

    const dias: ProducaoSemanalDia[] = [...porDia.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10)
      .map(([iso, d]) => {
        const dt = new Date(`${iso}T12:00:00Z`);
        return {
          iso,
          dia: NOMES_DIA[dt.getUTCDay()]!,
          data: `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(2, 4)}`,
          previsto: d.previsto,
          entregue: d.entregue,
          pendente: d.pendente,
          tonPrevisto: +d.tonPrevisto.toFixed(1),
          tonEntregue: +d.tonEntregue.toFixed(1),
          tonPendente: +d.tonPendente.toFixed(1),
          ordens: d.ordens.size,
          lotes: d.lotes.size,
        };
      });

    return dias;
  }

  return null;
}
