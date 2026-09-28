import * as XLSX from "xlsx";

export type Turno = { nome: string; faixa: string; ton: number; pct: number };
export type Dia = { dia: string; data: string; ton: number; meta: number; iso?: string };

/* Normaliza os dias de recebimento para o gráfico da semana:
 *  - junta o domingo (Dom) no sábado (Sáb) imediatamente anterior (domingo
 *    não aparece como barra própria);
 *  - formata as datas como DD/MM/YY.
 * Idempotente: dados já normalizados (importação recente) saem inalterados,
 * então funciona tanto para dados antigos já armazenados quanto para novos. */
export function normalizarDiasExibicao<T extends Dia>(dias: T[]): T[] {
  if (!dias.length) return dias;
  const porIso = new Map<string, T>();
  for (const d of dias) {
    const iso =
      d.iso ??
      `20${d.data.slice(6, 8)}-${d.data.slice(3, 5)}-${d.data.slice(0, 2)}`;
    porIso.set(iso, { ...d, iso });
  }
  for (const iso of [...porIso.keys()]) {
    if (new Date(`${iso}T12:00:00Z`).getUTCDay() !== 0) continue;
    const sab = new Date(new Date(`${iso}T12:00:00Z`).getTime() - 86400000)
      .toISOString()
      .slice(0, 10);
    const alvo = porIso.get(sab);
    const dom = porIso.get(iso);
    if (alvo && dom) {
      alvo.ton = +(alvo.ton + dom.ton).toFixed(2);
      porIso.delete(iso);
    }
  }
  return [...porIso.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([iso, d]) => ({
      ...d,
      data: `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(2, 4)}`,
    }));
}

/* Turnos fixos — parâmetro imutável.
 * Dia (06h–18h) concentra o maior volume de recebimento; Noite (18h–06h) abrange
 * a madrugada. Quando h1 < h0 o turno ultrapassa a meia-noite. */
export const TURNOS_FIXOS = [
  { nome: "Dia", faixa: "06:00–17:59", h0: 6, h1: 18 },
  { nome: "Noite", faixa: "18:00–05:59", h0: 18, h1: 6 },
] as const;

/* Extrai a hora (0–23) diretamente da string — independente de fuso horário */
function extrairHora(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") {
    const frac = v - Math.floor(v);
    return Math.floor(Math.round(frac * 86400) / 3600) % 24;
  }
  const m = String(v).match(/(\d{2}):(\d{2}):(\d{2})/);
  return m ? +m[1]! : null;
}

/* Extrai a data ISO (aaaa-mm-dd) diretamente da string */
function extrairIso(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "number")
    return new Date(Math.floor(v - 25569) * 86400000).toISOString().slice(0, 10);
  const s = String(v).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return br ? `${br[3]}-${br[2]}-${br[1]}` : null;
}

function encontrarSheet(wb: XLSX.WorkBook): XLSX.WorkSheet | null {
  return wb.Sheets["Base Recebimento"] ?? wb.Sheets["Resultado"] ?? null;
}

/* Calcula turnos, dias e itens a partir dos dados de recebimento.
 * Usa DT_FIM (horário em que o caminhão terminou de descarregar) para definir
 * o turno e o dia. Recebimento em andamento (sem DT_FIM) cai no DT_INICIO.
 * Encontra a linha de cabeçalho dinamicamente (pode haver título antes). */
export function calcularRecebimento(
  wb: XLSX.WorkBook,
): { turnos: Turno[]; dias: Dia[]; recebimentoItens: { nome: string; ton: number }[]; mensal: { mes: string; recebido: number }[]; totalRecebido: number } | null {
  const ws = encontrarSheet(wb);
  if (!ws) return null;

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  if (!rows.length) return null;

  /* Localiza a linha de cabeçalho (contém "DT_INICIO") */
  const headerIdx = rows.findIndex((r) =>
    r?.some((c) => String(c ?? "").toUpperCase().trim() === "DT_INICIO"),
  );
  if (headerIdx < 0) return null;

  const headers = rows[headerIdx]!.map((c) => String(c ?? "").trim());
  const dataRows = rows.slice(headerIdx + 1);

  const colFim = headers.findIndex((h) => /^DT.*FIM/i.test(h));
  const colInicio = headers.findIndex((h) => /^DT.*INICIO/i.test(h));
  const colItem = headers.findIndex((h) => /^(ITEM|COD|C[ÓO]DIGO)/i.test(h));
  const colDesc = headers.findIndex((h) => /(DESC|PRODUTO|DESCRI)/i.test(h));
  const colPeso = headers.findIndex((h) => /PESO.*RECEBIDO/i.test(h));

  if ((colFim < 0 && colInicio < 0) || colPeso < 0) return null;

  const pesoTurno = TURNOS_FIXOS.map((t) => ({ ...t, ton: 0 }));
  const porDia = new Map<string, number>();
  const porItem = new Map<string, { nome: string; ton: number }>();

  for (const r of dataRows) {
    const valFim = colFim >= 0 ? r?.[colFim] : null;
    const valInicio = colInicio >= 0 ? r?.[colInicio] : null;
    const hora = extrairHora(valFim) ?? extrairHora(valInicio);
    const iso = extrairIso(valFim) ?? extrairIso(valInicio);
    if (hora == null || !iso) continue;

    const peso = Number(r?.[colPeso] ?? 0);
    if (!peso) continue;

    const turno = pesoTurno.find((t) =>
      t.h1 > t.h0 ? hora >= t.h0 && hora < t.h1 : hora >= t.h0 || hora < t.h1,
    );
    if (turno) turno.ton += peso / 1000;

    porDia.set(iso, (porDia.get(iso) ?? 0) + peso);

    if (colItem >= 0) {
      const chave = String(r?.[colItem] ?? "").trim();
      if (chave) {
        const item = porItem.get(chave) ?? {
          nome: colDesc >= 0 ? `${chave} · ${String(r?.[colDesc] ?? "").trim()}` : chave,
          ton: 0,
        };
        item.ton += peso / 1000;
        porItem.set(chave, item);
      }
    }
  }

  const total = pesoTurno.reduce((s, t) => s + t.ton, 0);
  if (total <= 0) return null;

  const turnos: Turno[] = pesoTurno.map((t) => ({
    nome: t.nome,
    faixa: t.faixa,
    ton: +t.ton.toFixed(2),
    pct: +((t.ton / total) * 100).toFixed(1),
  }));

  /* Junta o recebimento de domingo (Dom) no sábado (Sáb) imediatamente
     anterior — domingo não aparece como barra própria no gráfico. */
  for (const iso of [...porDia.keys()]) {
    if (new Date(`${iso}T12:00:00Z`).getUTCDay() !== 0) continue;
    const sab = new Date(new Date(`${iso}T12:00:00Z`).getTime() - 86400000)
      .toISOString()
      .slice(0, 10);
    porDia.set(sab, (porDia.get(sab) ?? 0) + (porDia.get(iso) ?? 0));
    porDia.delete(iso);
  }

  const nomes = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const dias: Dia[] = [...porDia.entries()]
    .sort()
    .slice(-12)
    .map(([iso, peso]) => ({
      dia: nomes[new Date(`${iso}T12:00:00Z`).getUTCDay()]!,
      data: `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(2, 4)}`,
      ton: +(peso / 1000).toFixed(2),
      meta: 330,
      iso,
    }));

  const recebimentoItens = [...porItem.values()].sort((a, b) => b.ton - a.ton);

  /* Agrega o recebido por mês a partir de TODOS os dias da Base Recebimento
     (não só os últimos 12) — alimenta o gráfico "Recebido × Carregado por mês"
     e o total geral, que precisam do ano completo, sempre atualizados. */
  const MESES_CURTO = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const porMes = new Map<number, number>();
  let totalKg = 0;
  for (const [iso, peso] of porDia) {
    const mi = parseInt(iso.slice(5, 7), 10) - 1;
    if (mi < 0 || mi > 11) continue;
    porMes.set(mi, (porMes.get(mi) ?? 0) + peso);
    totalKg += peso;
  }
  const mensal = [...porMes.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([mi, peso]) => ({ mes: MESES_CURTO[mi]!, recebido: +(peso / 1000).toFixed(1) }));
  const totalRecebido = +(totalKg / 1000).toFixed(1);

  return { turnos, dias, recebimentoItens, mensal, totalRecebido };
}
