/* Ferramenta "Análise de estoque": lê a planilha de posição de estoque
   (Estoque Em Linha x Fora de Linha) item a item e recalcula tudo a partir
   das linhas — sem depender de totais prontos nem de dados fixos. */
import * as XLSX from "xlsx";
import type { ItemForaDeLinha, PosicaoEstoque } from "@/data/fora-de-linha";

export type Situacao = "EM LINHA" | "FORA DE LINHA";
export type StatusReserva = "SEM RESERVA" | "PARCIAL" | "TOTAL";
export type ItemAnalise = ItemForaDeLinha & { situacao: Situacao; reserva: StatusReserva };

export type Conferencia = { rotulo: string; planilha: number; calculado: number; ok: boolean };
export type ResultadoAnalise = {
  itens: ItemAnalise[];
  emLinha: PosicaoEstoque;
  foraDeLinha: PosicaoEstoque;
  total: PosicaoEstoque;
  conferencia: Conferencia[];
  avisos: string[];
  abaUsada: string;
};

const norm = (v: unknown) =>
  String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
const num = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v ?? "").trim();
  if (!s) return 0;
  const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown) => (v == null ? "" : String(v).trim());

const vazio = (grupo: string): PosicaoEstoque => ({ grupo, itens: 0, saldoFocco: 0, saldoFull: 0, reservas: 0, disponivel: 0, pesoTon: 0, pesoReservadoTon: 0, valorEstoque: 0, valorReservado: 0 });

function statusReserva(saldo: number, reservas: number): StatusReserva {
  if (reservas <= 0) return "SEM RESERVA";
  if (saldo > 0 && reservas >= saldo) return "TOTAL";
  return "PARCIAL";
}

type Linhas = unknown[][];
const linhasDe = (wb: XLSX.WorkBook, nome: string): Linhas =>
  XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[nome]!, { header: 1, defval: null });

function achaCabecalho(rows: Linhas): number {
  return rows.findIndex((r) => {
    const h = (r ?? []).map(norm);
    return h.includes("CHAVE") || (h.includes("ITEM") && h.some((c) => c.startsWith("SALDO")));
  });
}

function lerItens(rows: Linhas, situacaoPadrao: Situacao | null): ItemAnalise[] {
  const hi = achaCabecalho(rows);
  if (hi < 0) return [];
  const h = rows[hi]!.map(norm);
  const col = (...nomes: string[]) => h.findIndex((c) => nomes.some((n) => c === n || c.startsWith(n)));
  const c = {
    chave: col("CHAVE"), item: col("ITEM"), desc: col("DESCRICAO"), masc: col("MASCARA"),
    cat: col("CATEGORIA"), sit: col("SITUACAO"), orig: col("ORIGEM"), focco: col("SALDO FOCCO", "SALDO"),
    full: col("SALDO FULL"), res: col("RESERVAS", "RESERVA"), disp: col("DISPONIVEL"),
    peso: col("PESO TOTAL"), pesoUn: col("PESO UN"), pesoRes: col("PESO RESERVADO"),
    valor: col("VALOR ESTOQUE"), valorRes: col("VALOR RESERVADO"),
  };
  if (c.sit < 0 && !situacaoPadrao) return [];
  const out: ItemAnalise[] = [];
  for (const r of rows.slice(hi + 1)) {
    if (!r) continue;
    const chave = str(r[c.chave >= 0 ? c.chave : 0]);
    const item = num(r[c.item]);
    if (!chave && !item) continue;
    if (/TOTAL/.test(norm(chave))) continue;
    const sitTxt = c.sit >= 0 ? norm(r[c.sit]) : "";
    const situacao: Situacao = sitTxt.includes("FORA") ? "FORA DE LINHA" : sitTxt ? "EM LINHA" : situacaoPadrao ?? "EM LINHA";
    const saldoFocco = num(r[c.focco]);
    const reservas = num(r[c.res]);
    const pesoKg = c.peso >= 0 ? num(r[c.peso]) : num(r[c.pesoUn]) * saldoFocco;
    out.push({
      chave: chave || String(item), item, desc: str(r[c.desc]), mascara: str(r[c.masc]),
      categoria: str(r[c.cat]) || "SEM CATEGORIA", origem: str(r[c.orig]) || "NAO INFORMADO",
      saldoFocco, saldoFull: num(r[c.full]), reservas,
      disponivel: c.disp >= 0 ? num(r[c.disp]) : saldoFocco - reservas,
      pesoKg, pesoReservadoKg: num(r[c.pesoRes]),
      valorEstoque: num(r[c.valor]), valorReservado: num(r[c.valorRes]),
      situacao, reserva: statusReserva(saldoFocco, reservas),
    });
  }
  return out;
}

function lerResumo(wb: XLSX.WorkBook): Record<string, number[]> | null {
  const nome = wb.SheetNames.find((n) => norm(n) === "RESUMO");
  if (!nome) return null;
  const out: Record<string, number[]> = {};
  for (const r of linhasDe(wb, nome)) {
    const k = norm(r?.[0]);
    if ((k === "EM LINHA" || k === "FORA DE LINHA" || k === "TOTAL GERAL") && !out[k]) out[k] = r.slice(1, 10).map(num);
  }
  return Object.keys(out).length ? out : null;
}

export function somar(itens: ItemAnalise[], grupo: string): PosicaoEstoque {
  const p = vazio(grupo);
  for (const i of itens) {
    p.itens++; p.saldoFocco += i.saldoFocco; p.saldoFull += i.saldoFull; p.reservas += i.reservas;
    p.disponivel += i.disponivel; p.pesoTon += i.pesoKg / 1000; p.pesoReservadoTon += i.pesoReservadoKg / 1000;
    p.valorEstoque += i.valorEstoque; p.valorReservado += i.valorReservado;
  }
  return p;
}

export function analisarPlanilha(buf: ArrayBuffer): ResultadoAnalise {
  const wb = XLSX.read(buf, { type: "array" });
  const avisos: string[] = [];
  let itens: ItemAnalise[] = [];
  let abaUsada = "";

  /* 1º: aba com coluna SITUAÇÃO (ex.: "Base Completa") — fonte mais confiável. */
  const ordem = [...wb.SheetNames].sort((a, b) => (norm(b).includes("BASE") ? 1 : 0) - (norm(a).includes("BASE") ? 1 : 0));
  for (const nome of ordem) {
    const lidos = lerItens(linhasDe(wb, nome), null);
    if (lidos.length) { itens = lidos; abaUsada = nome; break; }
  }
  /* 2º: abas separadas "Em Linha" e "Fora de Linha". */
  if (!itens.length) {
    const em = wb.SheetNames.find((n) => norm(n) === "EM LINHA");
    const fora = wb.SheetNames.find((n) => norm(n) === "FORA DE LINHA");
    if (em) itens.push(...lerItens(linhasDe(wb, em), "EM LINHA"));
    if (fora) itens.push(...lerItens(linhasDe(wb, fora), "FORA DE LINHA"));
    abaUsada = [em, fora].filter(Boolean).join(" + ");
  }
  if (!itens.length) throw new Error("Não encontrei itens nesta planilha. Ela precisa ter uma aba com as colunas CHAVE/ITEM, SALDO e SITUAÇÃO (ou as abas 'Em Linha' e 'Fora de Linha').");

  /* Itens repetidos (mesma chave) contam uma vez só. */
  const vistos = new Map<string, ItemAnalise>();
  let dup = 0;
  for (const i of itens) { if (vistos.has(i.chave)) dup++; else vistos.set(i.chave, i); }
  if (dup) avisos.push(`${dup} linha(s) repetida(s) com a mesma chave foram ignoradas.`);
  itens = [...vistos.values()];

  const semSaldo = itens.filter((i) => i.saldoFocco <= 0).length;
  if (semSaldo) avisos.push(`${semSaldo} item(ns) estão com saldo zerado no Focco (mantidos na lista).`);
  const resMaior = itens.filter((i) => i.reservas > i.saldoFocco && i.saldoFocco > 0).length;
  if (resMaior) avisos.push(`${resMaior} item(ns) têm mais reserva do que saldo — conferir.`);

  const emLinha = somar(itens.filter((i) => i.situacao === "EM LINHA"), "EM LINHA");
  const foraDeLinha = somar(itens.filter((i) => i.situacao === "FORA DE LINHA"), "FORA DE LINHA");
  const total = somar(itens, "TOTAL GERAL");

  const conferencia: Conferencia[] = [];
  const resumo = lerResumo(wb);
  if (resumo) {
    const cmp = (rotulo: string, planilha: number | undefined, calculado: number, tol: number) => {
      if (planilha == null) return;
      conferencia.push({ rotulo, planilha, calculado, ok: Math.abs(planilha - calculado) <= tol });
    };
    for (const [k, pos] of [["EM LINHA", emLinha], ["FORA DE LINHA", foraDeLinha], ["TOTAL GERAL", total]] as const) {
      const r = resumo[k];
      if (!r) continue;
      cmp(`${k} · itens`, r[0], pos.itens, 0);
      cmp(`${k} · saldo`, r[1], pos.saldoFocco, 0.5);
      cmp(`${k} · reservas`, r[3], pos.reservas, 0.5);
      cmp(`${k} · peso (t)`, r[5], pos.pesoTon, 0.05);
      cmp(`${k} · valor (R$)`, r[7], pos.valorEstoque, 1);
    }
  } else avisos.push("A planilha não tem aba 'Resumo' — os totais foram calculados só pelos itens.");

  return { itens, emLinha, foraDeLinha, total, conferencia, avisos, abaUsada };
}
