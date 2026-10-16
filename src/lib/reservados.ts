import * as XLSX from "xlsx";
import { idUnidade, faturadoPorUnidade, VALOR_FATURADO_MEDIO } from "@/data/valor-faturado";

/* Parser da planilha "COMERCIAL 024 - SALDO DE ITENS COM RESERVA".
   Aceita pequenas variações de nomes de colunas usadas nas exportações do Drive. */
export type ItemReservado = {
  cod: string;
  desc: string;
  mascara: string;
  unidade: string;
  pesoBrt: number;
  custoMedio: number;
  saldoAtual: number;
  qtdReservada: number;
  pesoReservado: number;
  valorReservado: number;
  valorEstoque: number;
  pctReservado: number;
};

export type Reservados = {
  itens: ItemReservado[];
  totalQtd: number;
  totalTon: number;
  totalValor: number;
  custoMedioPonderado: number;
  totalSaldo: number;
  totalValorEstoque: number;
  totalPesoEstoque: number;
  pctQtd: number;
  pctValor: number;
  pctPeso: number;
  /* Valor previsto da reserva = Σ (toneladas reservadas × faturado por
     unidade). Itens sem unidade identificada usam a média do CD. */
  previsao: number;
  topItens: ItemReservado[];
};

function normalizar(v: unknown): string {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

/* Planilhas brasileiras podem trazer 1.234,56; as exportações também podem
   trazer números já convertidos pelo XLSX. */
function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v ?? "").trim().replace(/R\$|%/gi, "").replace(/\s/g, "");
  if (!s) return 0;
  if (s.includes(",")) return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
  return Number(s) || 0;
}

const str = (v: unknown) => (v == null ? "" : String(v).trim());

/* modo "semReserva": usa a parcela disponível (saldo − reservado) de cada item;
   o resultado reaproveita o formato de ItemReservado (qtdReservada = qtd sem reserva). */
export function lerReservados(wb: XLSX.WorkBook, modo: "reservado" | "semReserva" = "reservado"): ItemReservado[] | null {
  let ws: XLSX.WorkSheet | undefined;
  let headerRow = 0;

  const nomes = [
    ...wb.SheetNames.filter((n) => /RESERV|COMERCIAL|SALDO|PESO|TONELAD/i.test(n)),
    ...wb.SheetNames.filter((n) => !/RESERV|COMERCIAL|SALDO|PESO|TONELAD/i.test(n)),
  ];

  for (const name of nomes) {
    const candidate = wb.Sheets[name];
    if (!candidate) continue;
    const raw = XLSX.utils.sheet_to_json<unknown[]>(candidate, { header: 1, defval: null });
    for (let i = 0; i < Math.min(raw.length, 20); i++) {
      const texto = (raw[i] ?? []).map(normalizar).join(" ");
      /* Inclui QTD/QTDE RESERVADA e RESERVA, não apenas o cabeçalho antigo. */
      if (/(QUANTIDADE|QTD|QTDE)\s+RESERV/.test(texto) || /SALDO\s+RESERV/.test(texto)) {
        ws = candidate;
        headerRow = i;
        break;
      }
    }
    if (ws) break;
  }
  if (!ws) return lerReservadosPCP004(wb, modo);

  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  const header = (raw[headerRow] ?? []).map(normalizar);
  const rows = raw.slice(headerRow + 1);
  const find = (patterns: RegExp[]) => header.findIndex((h) => patterns.some((p) => p.test(h)));

  const colCod = find([/^COD(IGO)?\s+ITEM/, /^ITEM\b/, /^COD/]);
  /* Planilhas de resumo (ex.: analise-estoque) têm "Qtd reservada" mas não código de item. */
  if (colCod < 0) return null;
  const colDesc = find([/DESCRICAO/, /PRODUTO/]);
  const colMascara = find([/MASCARA/]);
  const colPeso = find([/PESO\s*(BRT|BRUTO)?/, /TONELADA/, /^TON\b/]);
  const colCusto = find([/CUSTO\s*MEDIO/, /^CUSTO/]);
  const colValor = find([/VALOR\s*ESTOQUE/, /^VALOR/]);
  const colSaldo = find([/SALDO\s*ATUAL/, /^SALDO/]);
  const colReserv = find([/(QUANTIDADE|QTD|QTDE)\s+RESERV/, /SALDO\s+RESERV/, /^RESERV/]);
  if (colReserv < 0) return null;
  const colDisp = find([/(QUANTIDADE|QTD|QTDE)\s+DISPONIVEL/, /^DISPONIVEL/]);
  const colUnid = find([/CLASSIFICACAO\s*N1/, /CLASSIFICAÇÃO\s*N1/, /^UNIDADE/, /CATEGORIA/]);

  const pesoEmToneladas = colPeso >= 0 && /TON|TONELADA/.test(header[colPeso]!);
  const itens: ItemReservado[] = [];
  for (const r of rows) {
    const cod = str(r[colCod >= 0 ? colCod : 0]);
    const saldoAtual = num(r[colSaldo >= 0 ? colSaldo : -1]);
    const qtdReservada = modo === "semReserva"
      ? Math.max(0, colDisp >= 0 ? num(r[colDisp]) : saldoAtual - num(r[colReserv]))
      : num(r[colReserv]);
    /* Em "sem reserva" mantém itens totalmente reservados (qtd 0) para que os
       percentuais usem o estoque total como base. */
    if (!cod || (modo === "reservado" && qtdReservada <= 0)) continue;
    const pesoRaw = num(r[colPeso >= 0 ? colPeso : -1]);
    const pesoBrt = pesoEmToneladas ? pesoRaw * 1000 : pesoRaw;
    const custoMedio = num(r[colCusto >= 0 ? colCusto : -1]);
    const valorEstoque = num(r[colValor >= 0 ? colValor : -1]);
    const pesoReservado = pesoBrt * qtdReservada;
    itens.push({
      cod,
      desc: str(r[colDesc >= 0 ? colDesc : -1]),
      mascara: str(r[colMascara >= 0 ? colMascara : -1]) || "—",
      unidade: str(r[colUnid >= 0 ? colUnid : -1]),
      pesoBrt,
      custoMedio,
      saldoAtual,
      qtdReservada,
      pesoReservado,
      valorReservado: custoMedio * qtdReservada,
      valorEstoque: valorEstoque || saldoAtual * custoMedio,
      pctReservado: saldoAtual > 0 ? (qtdReservada / saldoAtual) * 100 : 0,
    });
  }
  if (modo === "semReserva" && !itens.some((i) => i.qtdReservada > 0)) return null;
  return itens.length ? itens.sort((a, b) => b.qtdReservada - a.qtdReservada) : null;
}

/* Parser alternativo para planilhas PCP 004 — "ANALISE DE REALIZAÇÃO
   PENDENTE" (ex.: reservaxza.xlsx do Drive). Esta planilha traz ordens de
   produção pendentes em vez do formato COMERCIAL 024, mas os itens
   pendentes funcionam como "reservados" para a carteira do painel.
   Colunas: COD ITEM, DESC ITEM, PREVISTO, QTDE ENTREGUE, QTDE PENDENTE,
   PESO PENDENTE (peso total pendente em kg, não por unidade). */
function lerReservadosPCP004(wb: XLSX.WorkBook, modo: "reservado" | "semReserva"): ItemReservado[] | null {
  let ws: XLSX.WorkSheet | undefined;
  let headerRow = 0;

  for (const name of wb.SheetNames) {
    const candidate = wb.Sheets[name];
    if (!candidate) continue;
    const raw = XLSX.utils.sheet_to_json<unknown[]>(candidate, { header: 1, defval: null });
    for (let i = 0; i < Math.min(raw.length, 20); i++) {
      const texto = (raw[i] ?? []).map(normalizar).join(" ");
      if (/COD\s*ITEM/.test(texto) && /QTDE\s+PENDENTE/.test(texto) && /PESO\s+PENDENTE/.test(texto)) {
        ws = candidate;
        headerRow = i;
        break;
      }
    }
    if (ws) break;
  }
  if (!ws) return null;

  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  const header = (raw[headerRow] ?? []).map(normalizar);
  const rows = raw.slice(headerRow + 1);
  const find = (patterns: RegExp[]) => header.findIndex((h) => patterns.some((p) => p.test(h)));

  const colCod = find([/^COD(IGO)?\s+ITEM/, /^COD/]);
  if (colCod < 0) return null;
  const colDesc = find([/DESC\s*ITEM/, /DESCRICAO/, /PRODUTO/]);
  const colPrevisto = find([/PREVISTO/]);
  const colEntregue = find([/QTDE\s+ENTREGUE/, /QTD\s+ENTREGUE/]);
  const colPendente = find([/QTDE\s+PENDENTE/, /QTD\s+PENDENTE/]);
  const colPeso = find([/PESO\s+PENDENTE/]);
  if (colPendente < 0) return null;

  const itens: ItemReservado[] = [];
  for (const r of rows) {
    const cod = str(r[colCod]);
    if (!cod) continue;
    const previsto = num(r[colPrevisto >= 0 ? colPrevisto : -1]);
    const pendente = num(r[colPendente]);
    const pesoPendente = num(r[colPeso >= 0 ? colPeso : -1]);
    const entregue = colEntregue >= 0 ? num(r[colEntregue]) : Math.max(0, previsto - pendente);

    const qtdReservada = modo === "semReserva" ? entregue : pendente;
    if (modo === "reservado" && qtdReservada <= 0) continue;
    /* pesoBrt = peso por unidade (PESO PENDENTE ÷ QTDE PENDENTE) */
    const pesoBrt = pendente > 0 ? pesoPendente / pendente : 0;
    const pesoReservado = modo === "reservado" ? pesoPendente : pesoBrt * qtdReservada;

    itens.push({
      cod,
      desc: str(r[colDesc >= 0 ? colDesc : -1]),
      mascara: "—",
      unidade: "",
      pesoBrt,
      custoMedio: 0,
      saldoAtual: previsto,
      qtdReservada,
      pesoReservado,
      valorReservado: 0,
      valorEstoque: 0,
      pctReservado: previsto > 0 ? (qtdReservada / previsto) * 100 : 0,
    });
  }
  if (modo === "semReserva" && !itens.some((i) => i.qtdReservada > 0)) return null;
  return itens.length ? itens.sort((a, b) => b.pesoReservado - a.pesoReservado) : null;
}

/* Valor previsto da reserva = Σ (toneladas reservadas × faturado por
 * unidade). A unidade de cada item vem da coluna CLASSIFICAÇÃO N1 da
 * planilha; quando ausente, cai no mapa código→unidade (montado a partir
 * da Base Estoque); se mesmo assim não identificar, usa a média do CD.
 * `totalTon` é o fallback quando nenhum item tem peso reservado. */
export function calcularPrevisaoReservados(
  itens: ItemReservado[],
  totalTon: number,
  unidadePorCod?: Map<string, string>,
): number {
  const soma = itens.reduce((s, i) => {
    const id = idUnidade(i.unidade) ?? (unidadePorCod ? unidadePorCod.get(i.cod) : undefined);
    return s + (i.pesoReservado / 1000) * faturadoPorUnidade(id);
  }, 0);
  return soma || totalTon * VALOR_FATURADO_MEDIO;
}

export function calcularReservados(itens: ItemReservado[]): Reservados {
  const totalQtd = itens.reduce((s, i) => s + i.qtdReservada, 0);
  const totalTon = itens.reduce((s, i) => s + i.pesoReservado, 0) / 1000;
  const totalValor = itens.reduce((s, i) => s + i.valorReservado, 0);
  const totalSaldo = itens.reduce((s, i) => s + i.saldoAtual, 0);
  const totalValorEstoque = itens.reduce((s, i) => s + i.valorEstoque, 0);
  const totalPesoEstoque = itens.reduce((s, i) => s + i.pesoBrt * i.saldoAtual, 0) / 1000;
  const previsao = calcularPrevisaoReservados(itens, totalTon);
  return {
    itens, totalQtd, totalTon, totalValor,
    custoMedioPonderado: totalQtd > 0 ? totalValor / totalQtd : 0,
    totalSaldo, totalValorEstoque, totalPesoEstoque,
    pctQtd: totalSaldo > 0 ? (totalQtd / totalSaldo) * 100 : 0,
    pctValor: totalValorEstoque > 0 ? (totalValor / totalValorEstoque) * 100 : 0,
    pctPeso: totalPesoEstoque > 0 ? (totalTon / totalPesoEstoque) * 100 : 0,
    previsao,
    topItens: [...itens].sort((a, b) => b.pesoReservado - a.pesoReservado).slice(0, 8),
  };
}

/* Versão enxuta (sem a lista completa de itens) gravada no sync-store. */
export function resumirReservados(r: Reservados) {
  return {
    totalQtd: r.totalQtd,
    totalTon: r.totalTon,
    totalValor: r.totalValor,
    custoMedioPonderado: r.custoMedioPonderado,
    totalSaldo: r.totalSaldo,
    totalValorEstoque: r.totalValorEstoque,
    totalPesoEstoque: r.totalPesoEstoque,
    pctQtd: r.pctQtd,
    pctValor: r.pctValor,
    pctPeso: r.pctPeso,
    previsao: r.previsao,
    topItens: r.topItens.map((i) => ({
      cod: i.cod, desc: i.desc, mascara: i.mascara,
      qtdReservada: i.qtdReservada, pesoReservado: i.pesoReservado,
      valorReservado: i.valorReservado, saldoAtual: i.saldoAtual,
      pctReservado: i.pctReservado,
    })),
  };
}
