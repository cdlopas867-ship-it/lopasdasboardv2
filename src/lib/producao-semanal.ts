import * as XLSX from "xlsx";
import type { ItemEstoque } from "./base-estoque";

/* Produção da semana — "o que vai descer" da fábrica.
 * Lê a planilha de produção (NUM ORDEM, DT INICIAL, DT FINAL, LOTE,
 * VOLUME, PREVISTO, QTDE ENTREGUE, QTDE PENDENTE, PESO PREVISTO,
 * PESO REALIZADO) e agrupa por DT FINAL (dia em que a produção fica
 * pronta). O peso por dia vem das colunas PESO PREVISTO / PESO REALIZADO
 * (kg) quando presentes; senão é calculado cruzando o código do item
 * (extraído do campo VOLUME) com o peso unitário da Base Estoque. */

export type ProducaoSemanalDia = {
  iso: string;
  dia: string;
  data: string;
  previsto: number; // unidades programadas
  produzido: number; // unidades produzidas (QTDE ENTREGUE da produção)
  entregue: number; // unidades recebidas no estoque (planilha PESO RECEBIDO)
  pendente: number; // unidades a produzir (previsto − produzido)
  tonPrevisto: number; // toneladas programadas
  tonProduzido: number; // toneladas produzidas (PESO REALIZADO)
  tonEntregue: number; // toneladas recebidas no estoque
  tonPendente: number; // toneladas a produzir
  ordens: number; // número de ordens de produção
  lotes: number; // número de lotes únicos
  linhas?: ProducaoLinha[]; // ordens cruas do dia (DT FINAL, LOTE, VOLUME e pesos)
};

/* Uma linha crua da planilha de produção (PCP 003), como sai do sistema Focco. */
export type ProducaoLinha = {
  data: string; // DT FINAL (dd/mm/aa)
  lote: string;
  volume: string;
  pesoPrevisto: number; // PESO PREVISTO (kg)
  pesoRealizado: number; // PESO REALIZADO (kg)
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    /* Remove espaços, underlines e pontos: a planilha PESO RECEBIDO usa
       "DT_INICIO"/"PESO_RECEBIDO", a de produção usa espaços e a de
       recebimentos (WF0072) usa "Dt. autorização"/"Qtd. Itens". */
    .replace(/[._\s]+/g, "")
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
  if (!itens) return new Map<string, number>();
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

/* Calcula o total recebido no estoque por dia a partir da planilha
 * "PESO RECEBIDO POR PERÍODO" (DT_INICIO, DT_FIM, ITEM, QTD_RECEBIDA,
 * PESO_RECEBIDO). Retorna um mapa ISO → { qtd, peso } para cruzar
 * com as datas de produção (DT FINAL). */
export function calcularRecebidoPorDia(
  wb: XLSX.WorkBook,
): Map<string, { qtd: number; peso: number }> | null {
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
    if (!rows.length) continue;

    const headerIdx = rows.findIndex((r) =>
      r?.some((c) => normalizeHeader(c) === "DTINICIO"),
    );
    if (headerIdx < 0) continue;

    const headers = rows[headerIdx]!.map((c) => normalizeHeader(c));
    const colFim = headers.findIndex((h) => h.includes("DTFIM"));
    const colInicio = headers.findIndex((h) => h.includes("DTINICIO"));
    const colQtd = headers.findIndex((h) => h.includes("QTDRECEBIDA"));
    const colPeso = headers.findIndex((h) => h.includes("PESORECEBIDO"));

    /* Precisa de pelo menos data e peso para ser a planilha certa */
    if ((colFim < 0 && colInicio < 0) || colPeso < 0) continue;

    const porDia = new Map<string, { qtd: number; peso: number }>();

    for (const r of rows.slice(headerIdx + 1)) {
      if (!r) continue;
      const iso = serialToIso(r[colFim >= 0 ? colFim : colInicio]);
      if (!iso) continue;

      const qtd = colQtd >= 0 ? (Number(r[colQtd] ?? 0) || 0) : 0;
      const peso = Number(r[colPeso] ?? 0) || 0;

      const atual = porDia.get(iso) ?? { qtd: 0, peso: 0 };
      atual.qtd += qtd;
      atual.peso += peso;
      porDia.set(iso, atual);
    }

    if (porDia.size === 0) continue;
    return porDia;
  }

  return null;
}

/* Calcula o total recebido por dia a partir da planilha
 * "Gerenciamento dos recebimentos" (relatório WF0072 do WMS: Autorização,
 * Placa, Box, Dt. autorização, Situação, Fornecedor, Nro. doc., Almoxarifado,
 * Itens, Qtd. Itens, Qtd. Embs., Peso, Cubagem…). Agrupa pela data da
 * autorização e soma o Peso (kg) e a Qtd. Itens — a cena usa toneladas.
 * É a fonte preferida do "recebido" no comparativo recebimento × produção. */
export function calcularRecebidoGerenciamento(
  wb: XLSX.WorkBook,
): Map<string, { qtd: number; peso: number }> | null {
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
    if (!rows.length) continue;

    /* Cabeçalho: Autorização + Dt. autorização + Peso */
    const headerIdx = rows.findIndex((r) => {
      if (!r) return false;
      const up = r.map((c) => normalizeHeader(c));
      return (
        up.includes("AUTORIZACAO") &&
        up.includes("DTAUTORIZACAO") &&
        up.includes("PESO")
      );
    });
    if (headerIdx < 0) continue;

    const headers = rows[headerIdx]!.map((c) => normalizeHeader(c));
    const colData = headers.indexOf("DTAUTORIZACAO");
    const colPeso = headers.indexOf("PESO");
    const colQtd = headers.indexOf("QTDITENS");
    if (colData < 0 || colPeso < 0) continue;

    const porDia = new Map<string, { qtd: number; peso: number }>();
    for (const r of rows.slice(headerIdx + 1)) {
      if (!r) continue;
      const iso = serialToIso(r[colData]);
      if (!iso) continue;
      const peso = Number(r[colPeso] ?? 0) || 0;
      const qtd = colQtd >= 0 ? Number(r[colQtd] ?? 0) || 0 : 0;
      const atual = porDia.get(iso) ?? { qtd: 0, peso: 0 };
      atual.qtd += qtd;
      atual.peso += peso;
      porDia.set(iso, atual);
    }

    if (porDia.size === 0) continue;
    return porDia;
  }

  return null;
}

/* Lê a planilha de produção e retorna os dias com métricas.
 * Detecta a aba pelos cabeçalhos NUM ORDEM + DT INICIAL + PENDENTE.
 * `produzido` = QTDE ENTREGUE da produção; `entregue` (recebido) vem da
 * planilha de recebimentos (Gerenciamento dos recebimentos · WF0072 ou, na
 * falta dela, PESO RECEBIDO POR PERÍODO) quando fornecida (senão assume o
 * produzido). O PENDENTE (a produzir) = PREVISTO − PRODUZIDO. */
export function calcularProducaoSemanal(
  wb: XLSX.WorkBook,
  itensEstoque: ItemEstoque[] | undefined,
  recebidoPorDia?: Map<string, { qtd: number; peso: number }> | null,
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

    /* Ignora a planilha de pendências (PCP 004 - Realização Pendente): ela
       também traz DT INICIAL/PENDENTE e seria confundida com a produção.
       Identifica-se pela coluna "PESO PENDENTE" (a produção usa PESO PREVISTO). */
    if (col("PESOPENDENTE") >= 0 && col("PESOPREVISTO") < 0) continue;

    const cDtFim = col("DTFINAL");
    const cOrdem = col("NUMORDEM");
    const cVolume = col("VOLUME");
    const cPrev = col("PREVISTO");
    const cEntg = col("ENTREGUE");
    const cPend = col("PENDENTE");
    const cLote = col("LOTE");
    /* Peso da própria planilha (kg) — PESO PREVISTO / PESO REALIZADO. */
    const cPesoPrev = headers.findIndex((h) => h.includes("PESOPREVISTO"));
    const cPesoReal = headers.findIndex((h) => h.includes("PESOREALIZADO"));

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
        produzido: number;
        entregue: number;
        pendente: number;
        tonPrevisto: number;
        tonProduzido: number;
        tonEntregue: number;
        tonPendente: number;
        ordens: Set<string>;
        lotes: Set<string>;
        linhas: ProducaoLinha[];
      }
    >();

    for (const r of rows.slice(headerIdx + 1)) {
      if (!r) continue;
      const iso = serialToIso(r[cDtFim]);
      if (!iso) continue;

      const previsto = num(r, cPrev);
      const produzido = num(r, cEntg); // QTDE ENTREGUE = produzido
      const pendente = num(r, cPend);
      if (previsto <= 0 && produzido <= 0 && pendente <= 0) continue;

      const codItem = cVolume >= 0 ? extrairCodItem(str(r, cVolume)) : "";
      const pesoUnd = codItem ? (pesoUnit.get(codItem) ?? 0) : 0;

      /* Peso da própria planilha (kg) — mais preciso que o cruzamento com a
         Base Estoque. Usado quando presente; senão cai no peso unitário. */
      const pesoPrevSheet = num(r, cPesoPrev);
      const pesoRealSheet = num(r, cPesoReal);

      const dia = porDia.get(iso) ?? {
        previsto: 0,
        produzido: 0,
        entregue: 0,
        pendente: 0,
        tonPrevisto: 0,
        tonProduzido: 0,
        tonEntregue: 0,
        tonPendente: 0,
        ordens: new Set<string>(),
        lotes: new Set<string>(),
        linhas: [],
      };
      dia.previsto += previsto;
      dia.produzido += produzido;
      dia.pendente += pendente;
      dia.tonPrevisto += (pesoPrevSheet > 0 ? pesoPrevSheet : previsto * pesoUnd) / 1000;
      dia.tonProduzido += (pesoRealSheet > 0 ? pesoRealSheet : produzido * pesoUnd) / 1000;
      /* Linha crua da planilha — alimenta a tabela detalhada da cena. */
      dia.linhas.push({
        data: `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(2, 4)}`,
        lote: str(r, cLote),
        volume: str(r, cVolume),
        pesoPrevisto: +pesoPrevSheet.toFixed(1),
        pesoRealizado: +pesoRealSheet.toFixed(1),
      });
      if (cOrdem >= 0) dia.ordens.add(str(r, cOrdem));
      if (cLote >= 0) dia.lotes.add(str(r, cLote));
      porDia.set(iso, dia);
    }

    /* Cruzamento: o "recebido" vem da planilha PESO RECEBIDO POR PERÍODO
       (o que efetivamente chegou ao estoque). Sem ela, o recebido assume o
       produzido da própria planilha de produção. "A produzir" = previsto −
       produzido (o que ainda falta sair da fábrica). */
    for (const [iso, dia] of porDia) {
      const rec = recebidoPorDia?.get(iso);
      dia.entregue = recebidoPorDia ? (rec?.qtd ?? 0) : dia.produzido;
      dia.tonEntregue = recebidoPorDia ? (rec ? rec.peso / 1000 : 0) : dia.tonProduzido;
      dia.pendente = Math.max(0, dia.previsto - dia.produzido);
      dia.tonPendente = Math.max(0, dia.tonPrevisto - dia.tonProduzido);
    }

    if (porDia.size === 0) continue;

    const dias: ProducaoSemanalDia[] = [...porDia.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([iso, d]) => {
        const dt = new Date(`${iso}T12:00:00Z`);
        return {
          iso,
          dia: NOMES_DIA[dt.getUTCDay()]!,
          data: `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(2, 4)}`,
          previsto: d.previsto,
          produzido: d.produzido,
          entregue: d.entregue,
          pendente: d.pendente,
          tonPrevisto: +d.tonPrevisto.toFixed(1),
          tonProduzido: +d.tonProduzido.toFixed(1),
          tonEntregue: +d.tonEntregue.toFixed(1),
          tonPendente: +d.tonPendente.toFixed(1),
          ordens: d.ordens.size,
          lotes: d.lotes.size,
          linhas: d.linhas,
        };
      });

    return dias;
  }

  return null;
}

/* Seleciona os dias da semana atual (seg–dom) — mistura o que já foi
   produzido/recebido (dias passados) com o que ainda falta produzir (dias
   futuros). Cai para os 7 últimos dias disponíveis quando a planilha não
   cobre a semana atual (planilha antiga ou só com dias futuros). */
export function semanaAtual(dias: ProducaoSemanalDia[] | undefined): ProducaoSemanalDia[] {
  const lista = dias ?? [];
  if (lista.length === 0) return [];
  const hoje = new Date();
  const dow = (hoje.getDay() + 6) % 7; // 0 = segunda-feira
  const seg = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - dow);
  const dom = new Date(seg.getFullYear(), seg.getMonth(), seg.getDate() + 6);
  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const ini = iso(seg);
  const fim = iso(dom);
  const daSemana = lista.filter((d) => d.iso >= ini && d.iso <= fim);
  return daSemana.length > 0 ? daSemana : lista.slice(-7);
}
