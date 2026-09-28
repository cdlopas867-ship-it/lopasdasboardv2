import * as XLSX from "xlsx";

/* Parser da planilha "COMERCIAL 024 - SALDO DE ITENS COM RESERVA".
   Aceita pequenas variações de nomes de colunas usadas nas exportações do Drive. */
export type ItemReservado = {
  cod: string;
  desc: string;
  mascara: string;
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

export function lerReservados(wb: XLSX.WorkBook): ItemReservado[] | null {
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
  if (!ws) return null;

  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  const header = (raw[headerRow] ?? []).map(normalizar);
  const rows = raw.slice(headerRow + 1);
  const find = (patterns: RegExp[]) => header.findIndex((h) => patterns.some((p) => p.test(h)));

  const colCod = find([/^COD(IGO)?\s+ITEM/, /^ITEM\b/, /^COD/]);
  const colDesc = find([/DESCRICAO/, /PRODUTO/]);
  const colMascara = find([/MASCARA/]);
  const colPeso = find([/PESO\s*(BRT|BRUTO)?/, /TONELADA/, /^TON\b/]);
  const colCusto = find([/CUSTO\s*MEDIO/, /^CUSTO/]);
  const colValor = find([/VALOR\s*ESTOQUE/, /^VALOR/]);
  const colSaldo = find([/SALDO\s*ATUAL/, /^SALDO/]);
  const colReserv = find([/(QUANTIDADE|QTD|QTDE)\s+RESERV/, /SALDO\s+RESERV/, /^RESERV/]);
  if (colReserv < 0) return null;

  const pesoEmToneladas = colPeso >= 0 && /TON|TONELADA/.test(header[colPeso]!);
  const itens: ItemReservado[] = [];
  for (const r of rows) {
    const cod = str(r[colCod >= 0 ? colCod : 0]);
    const qtdReservada = num(r[colReserv]);
    if (!cod || qtdReservada <= 0) continue;
    const saldoAtual = num(r[colSaldo >= 0 ? colSaldo : -1]);
    const pesoRaw = num(r[colPeso >= 0 ? colPeso : -1]);
    const pesoBrt = pesoEmToneladas ? pesoRaw * 1000 : pesoRaw;
    const custoMedio = num(r[colCusto >= 0 ? colCusto : -1]);
    const valorEstoque = num(r[colValor >= 0 ? colValor : -1]);
    const pesoReservado = pesoBrt * qtdReservada;
    itens.push({
      cod,
      desc: str(r[colDesc >= 0 ? colDesc : -1]),
      mascara: str(r[colMascara >= 0 ? colMascara : -1]) || "—",
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
  return itens.length ? itens.sort((a, b) => b.qtdReservada - a.qtdReservada) : null;
}

export function calcularReservados(itens: ItemReservado[]): Reservados {
  const totalQtd = itens.reduce((s, i) => s + i.qtdReservada, 0);
  const totalTon = itens.reduce((s, i) => s + i.pesoReservado, 0) / 1000;
  const totalValor = itens.reduce((s, i) => s + i.valorReservado, 0);
  const totalSaldo = itens.reduce((s, i) => s + i.saldoAtual, 0);
  const totalValorEstoque = itens.reduce((s, i) => s + i.valorEstoque, 0);
  const totalPesoEstoque = itens.reduce((s, i) => s + i.pesoBrt * i.saldoAtual, 0) / 1000;
  return {
    itens, totalQtd, totalTon, totalValor,
    custoMedioPonderado: totalQtd > 0 ? totalValor / totalQtd : 0,
    totalSaldo, totalValorEstoque, totalPesoEstoque,
    pctQtd: totalSaldo > 0 ? (totalQtd / totalSaldo) * 100 : 0,
    pctValor: totalValorEstoque > 0 ? (totalValor / totalValorEstoque) * 100 : 0,
    pctPeso: totalPesoEstoque > 0 ? (totalTon / totalPesoEstoque) * 100 : 0,
    topItens: [...itens].sort((a, b) => b.pesoReservado - a.pesoReservado).slice(0, 8),
  };
}
