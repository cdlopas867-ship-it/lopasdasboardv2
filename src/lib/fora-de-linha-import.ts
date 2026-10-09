/* Parser da planilha "Estoque Em Linha x Fora de Linha" do Google Drive.
 *
 * Lê as abas "Fora de Linha" (itens descontinuados) e "Resumo" (visão geral
 * EM LINHA / FORA DE LINHA / TOTAL GERAL) de um workbook baixado do Drive
 * e retorna os dados estruturados no mesmo formato do módulo estático
 * src/data/fora-de-linha.ts.
 */

import * as XLSX from "xlsx";
import type { ItemForaDeLinha, PosicaoEstoque } from "@/data/fora-de-linha";

const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0) || 0);
const str = (v: unknown) => (v == null ? "" : String(v).trim());

/* Encontra a linha de cabeçalho em uma aba procurando por uma célula
   que case com um dos termos esperados. */
function encontrarHeader(rows: unknown[][], needles: string[]): number {
  return rows.findIndex((r) =>
    r?.some((c) => needles.some((n) => String(c ?? "").toUpperCase().trim() === n)),
  );
}

/* Lê a aba "Resumo" e extrai as posições EM LINHA, FORA DE LINHA e TOTAL. */
function lerResumo(wb: XLSX.WorkBook): {
  emLinha: PosicaoEstoque | null;
  foraDeLinha: PosicaoEstoque | null;
  total: PosicaoEstoque | null;
} {
  const ws = wb.Sheets["Resumo"];
  if (!ws) return { emLinha: null, foraDeLinha: null, total: null };

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  const hi = encontrarHeader(rows, ["GRUPO"]);
  if (hi < 0) return { emLinha: null, foraDeLinha: null, total: null };

  const headers = (rows[hi] ?? []).map((c) => str(c).toUpperCase());
  const findCol = (needles: string[]) =>
    headers.findIndex((h) => needles.some((n) => h === n || h.includes(n)));

  const cItens = findCol(["ITENS"]);
  const cSaldoFocco = findCol(["SALDO FOCCO"]);
  const cSaldoFull = findCol(["SALDO FULL"]);
  const cReservas = findCol(["RESERVAS"]);
  const cDisponivel = findCol(["DISPONÍVEL"]);
  const cPesoTon = findCol(["PESO TOTAL"]);
  const cPesoReserv = findCol(["PESO RESERVADO"]);
  const cValorEstoque = findCol(["VALOR ESTOQUE"]);
  const cValorReservado = findCol(["VALOR RESERVADO"]);

  const parseRow = (r: unknown[]): PosicaoEstoque => ({
    grupo: str(r[0]).toUpperCase(),
    itens: num(r[cItens >= 0 ? cItens : 1]),
    saldoFocco: num(r[cSaldoFocco >= 0 ? cSaldoFocco : 2]),
    saldoFull: num(r[cSaldoFull >= 0 ? cSaldoFull : 3]),
    reservas: num(r[cReservas >= 0 ? cReservas : 4]),
    disponivel: num(r[cDisponivel >= 0 ? cDisponivel : 5]),
    pesoTon: num(r[cPesoTon >= 0 ? cPesoTon : 6]),
    pesoReservadoTon: num(r[cPesoReserv >= 0 ? cPesoReserv : 7]),
    valorEstoque: num(r[cValorEstoque >= 0 ? cValorEstoque : 8]),
    valorReservado: num(r[cValorReservado >= 0 ? cValorReservado : 9]),
  });

  let emLinha: PosicaoEstoque | null = null;
  let foraDeLinha: PosicaoEstoque | null = null;
  let total: PosicaoEstoque | null = null;

  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0] || str(r[0]) === "") continue;
    const label = str(r[0]).toUpperCase();
    if (label === "EM LINHA") emLinha = parseRow(r);
    else if (label === "FORA DE LINHA") foraDeLinha = parseRow(r);
    else if (label === "TOTAL GERAL" || label === "TOTAL") total = parseRow(r);
  }

  return { emLinha, foraDeLinha, total };
}

/* Lê a aba "Fora de Linha" e extrai os itens descontinuados. */
function lerItens(wb: XLSX.WorkBook): ItemForaDeLinha[] | null {
  const ws = wb.Sheets["Fora de Linha"];
  if (!ws) return null;

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  const hi = encontrarHeader(rows, ["CHAVE"]);
  if (hi < 0) return null;

  const headers = (rows[hi] ?? []).map((c) => str(c).toUpperCase());
  const findCol = (needles: string[]) =>
    headers.findIndex((h) => needles.some((n) => h === n || h.includes(n)));

  const cChave = findCol(["CHAVE"]);
  const cItem = findCol(["ITEM"]);
  const cDesc = findCol(["DESCRIÇÃO"]);
  const cMascara = findCol(["MÁSCARA"]);
  const cCategoria = findCol(["CATEGORIA"]);
  const cOrigem = findCol(["ORIGEM"]);
  const cSaldoFocco = findCol(["SALDO FOCCO"]);
  const cSaldoFull = findCol(["SALDO FULL"]);
  const cReservas = findCol(["RESERVAS"]);
  const cDisponivel = findCol(["DISPONÍVEL"]);
  const cPesoKg = findCol(["PESO TOTAL"]);
  const cPesoReservKg = findCol(["PESO RESERVADO"]);
  const cValorEstoque = findCol(["VALOR ESTOQUE"]);
  const cValorReservado = findCol(["VALOR RESERVADO"]);

  const itens: ItemForaDeLinha[] = [];
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0] || str(r[0]) === "") continue;
    const chave = str(r[cChave >= 0 ? cChave : 0]);
    if (!chave || !chave.includes(".")) continue;
    itens.push({
      chave,
      item: num(r[cItem >= 0 ? cItem : 1]),
      desc: str(r[cDesc >= 0 ? cDesc : 2]),
      mascara: str(r[cMascara >= 0 ? cMascara : 3]),
      categoria: str(r[cCategoria >= 0 ? cCategoria : 4]).toUpperCase(),
      origem: str(r[cOrigem >= 0 ? cOrigem : 5]).toUpperCase(),
      saldoFocco: num(r[cSaldoFocco >= 0 ? cSaldoFocco : 6]),
      saldoFull: num(r[cSaldoFull >= 0 ? cSaldoFull : 7]),
      reservas: num(r[cReservas >= 0 ? cReservas : 8]),
      disponivel: num(r[cDisponivel >= 0 ? cDisponivel : 9]),
      pesoKg: num(r[cPesoKg >= 0 ? cPesoKg : 10]),
      pesoReservadoKg: num(r[cPesoReservKg >= 0 ? cPesoReservKg : 11]),
      valorEstoque: num(r[cValorEstoque >= 0 ? cValorEstoque : 12]),
      valorReservado: num(r[cValorReservado >= 0 ? cValorReservado : 13]),
    });
  }

  return itens.length > 0 ? itens : null;
}

export type ForaDeLinhaData = {
  itens: ItemForaDeLinha[];
  posicaoEmLinha: PosicaoEstoque;
  posicaoForaDeLinha: PosicaoEstoque;
  posicaoTotal: PosicaoEstoque;
};

/* Processa um workbook e retorna os dados de fora de linha.
   Retorna null se a planilha não contiver as abas esperadas. */
const normH = (v: unknown) =>
  str(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

const CAT_LONGO: Record<string, string> = {
  "GUARDA-ROUPAS": "UNIDADE GUARDA ROUPAS",
  SALAS: "UNIDADE DE SALAS",
  COMPLEMENTOS: "UNIDADE DE COMPLEMENTOS",
  OUTROS: "OUTROS",
};

const vazio = (grupo: string): PosicaoEstoque => ({ grupo, itens: 0, saldoFocco: 0, saldoFull: 0, reservas: 0, disponivel: 0, pesoTon: 0, pesoReservadoTon: 0, valorEstoque: 0, valorReservado: 0 });

/* Formato novo "analise-estoque-AAAA-MM-DD": abas Resumo (Situação/Categoria/TOTAL)
   e "Fora de linha" (Item, Descrição, Cor, Saldo (pç), Peso (t)...). Não traz valor. */
function lerFormatoAnalise(wb: XLSX.WorkBook): ForaDeLinhaData | null {
  const nomeFdl = wb.SheetNames.find((n) => normH(n) === "FORA DE LINHA");
  const ws = nomeFdl ? wb.Sheets[nomeFdl] : undefined;
  if (!ws) return null;
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  const hi = rows.findIndex((r) => r?.some((c) => normH(c) === "SITUACAO"));
  if (hi < 0) return null;
  const h = (rows[hi] ?? []).map(normH);
  const c = (n: string) => h.findIndex((x) => x.startsWith(n));
  const cCat = c("CATEGORIA"), cItem = c("ITEM"), cDesc = c("DESCRICAO"), cCor = c("COR");
  const cSaldo = c("SALDO"), cPesoUn = c("PESO UN"), cPeso = h.findIndex((x) => x === "PESO (T)");
  const cRes = h.findIndex((x) => x.startsWith("RESERVADO")), cPesoRes = c("PESO RESERVADO"), cDisp = c("DISPONIVEL");
  if (cItem < 0) return null;
  const itens: ItemForaDeLinha[] = [];
  for (const r of rows.slice(hi + 1)) {
    const item = str(r?.[cItem]);
    if (!item) continue;
    const cat = str(r[cCat]).toUpperCase();
    const pesoT = num(r[cPeso]);
    itens.push({
      chave: `${item}.${str(r[cCor]).match(/\((\d+)\)/)?.[1] ?? itens.length}`,
      item: num(item),
      desc: str(r[cDesc]),
      mascara: str(r[cCor]),
      categoria: CAT_LONGO[cat] ?? cat,
      origem: "CD",
      saldoFocco: num(r[cSaldo]),
      saldoFull: 0,
      reservas: num(r[cRes]),
      disponivel: num(r[cDisp]),
      pesoKg: cPeso >= 0 ? pesoT * 1000 : num(r[cPesoUn]) * num(r[cSaldo]),
      pesoReservadoKg: num(r[cPesoRes]) * 1000,
      valorEstoque: 0,
      valorReservado: 0,
    });
  }
  /* Resumo: linhas "<Situação> | TOTAL" */
  const pos = { em: vazio("EM LINHA"), fora: vazio("FORA DE LINHA") };
  const nomeRes = wb.SheetNames.find((n) => normH(n) === "RESUMO");
  const wr = nomeRes ? wb.Sheets[nomeRes] : undefined;
  if (wr) {
    for (const r of XLSX.utils.sheet_to_json<unknown[]>(wr, { header: 1, defval: null })) {
      if (normH(r?.[1]) !== "TOTAL") continue;
      const alvo = normH(r[0]) === "EM LINHA" ? pos.em : normH(r[0]) === "FORA DE LINHA" ? pos.fora : null;
      if (!alvo) continue;
      alvo.itens = num(r[2]); alvo.saldoFocco = num(r[3]); alvo.pesoTon = num(r[4]);
      alvo.reservas = num(r[5]); alvo.pesoReservadoTon = num(r[6]); alvo.disponivel = alvo.saldoFocco - alvo.reservas;
    }
  }
  if (!pos.fora.itens) {
    pos.fora.itens = itens.length;
    pos.fora.saldoFocco = itens.reduce((s, i) => s + i.saldoFocco, 0);
    pos.fora.reservas = itens.reduce((s, i) => s + i.reservas, 0);
    pos.fora.disponivel = itens.reduce((s, i) => s + i.disponivel, 0);
    pos.fora.pesoTon = itens.reduce((s, i) => s + i.pesoKg, 0) / 1000;
    pos.fora.pesoReservadoTon = itens.reduce((s, i) => s + i.pesoReservadoKg, 0) / 1000;
  }
  const soma = (k: keyof PosicaoEstoque) => (pos.em[k] as number) + (pos.fora[k] as number);
  const total: PosicaoEstoque = { grupo: "TOTAL GERAL", itens: soma("itens"), saldoFocco: soma("saldoFocco"), saldoFull: 0, reservas: soma("reservas"), disponivel: soma("disponivel"), pesoTon: soma("pesoTon"), pesoReservadoTon: soma("pesoReservadoTon"), valorEstoque: 0, valorReservado: 0 };
  return { itens, posicaoEmLinha: pos.em, posicaoForaDeLinha: pos.fora, posicaoTotal: total };
}

/* Formato "Estoque_EmLinha_x_ForaDeLinha": abas Estoque (itens com SITUAÇÃO vazia),
   Linha (cadastro CHAVE→SITUAÇÃO) e Reservas (QTD RESERVADA por item).
   Cruza os três para montar os itens fora de linha com saldo, reserva e valor. */
function lerFormatoEstoqueLinha(wb: XLSX.WorkBook): ForaDeLinhaData | null {
  const wsEst = wb.Sheets["Estoque"];
  const wsLinha = wb.Sheets["Linha"];
  if (!wsEst || !wsLinha) return null;

  const rowsEst = XLSX.utils.sheet_to_json<unknown[]>(wsEst, { header: 1, defval: null });
  const hiEst = rowsEst.findIndex((r) => r?.some((c) => str(c).toUpperCase().trim() === "CHAVE"));
  if (hiEst < 0) return null;
  const hEst = (rowsEst[hiEst] ?? []).map((c) => str(c).toUpperCase());
  const cEst = (n: string) => hEst.findIndex((x) => x === n || x.startsWith(n));
  const cItem = cEst("ITEM");
  const cDesc = cEst("DESCRIÇÃO");
  const cMascara = cEst("MÁSCARA");
  const cCategoria = cEst("CATEGORIA");
  const cSaldoFocco = cEst("SALDO FOCCO");
  const cPesoUn = cEst("PESO UN");
  const cCusto = cEst("CUSTO MÉDIO");
  if (cItem < 0 || cSaldoFocco < 0) return null;

  /* 1. Ler cadastro Linha → CHAVE → SITUAÇÃO */
  const rowsLinha = XLSX.utils.sheet_to_json<unknown[]>(wsLinha, { header: 1, defval: null });
  const hiLinha = rowsLinha.findIndex((r) => r?.some((c) => str(c).toUpperCase().trim() === "CHAVE"));
  const situacaoMap = new Map<string, string>();
  if (hiLinha >= 0) {
    const hLinha = (rowsLinha[hiLinha] ?? []).map((c) => str(c).toUpperCase());
    const cSit = hLinha.findIndex((x) => x.includes("SITUA"));
    for (let i = hiLinha + 1; i < rowsLinha.length; i++) {
      const r = rowsLinha[i];
      if (!r || !r[0]) continue;
      const chave = str(r[0]);
      const sit = cSit >= 0 ? str(r[cSit]).toUpperCase() : "";
      if (chave && sit) situacaoMap.set(chave, sit);
    }
  }
  if (situacaoMap.size === 0) return null;

  /* 2. Ler Reservas → (item|maskNum) → qtdReservada total */
  const reservasMap = new Map<string, number>();
  const wsRes = wb.Sheets["Reservas"];
  if (wsRes) {
    const rowsRes = XLSX.utils.sheet_to_json<unknown[]>(wsRes, { header: 1, defval: null });
    const hiRes = rowsRes.findIndex((r) => r?.some((c) => /QTD.*RESERV/i.test(str(c))));
    if (hiRes >= 0) {
      const hRes = (rowsRes[hiRes] ?? []).map((c) => str(c).toUpperCase());
      const cCodRes = hRes.findIndex((x) => x.includes("COD ITEM") || x === "ITEM");
      const cMaskRes = hRes.findIndex((x) => x.includes("MASCARA"));
      const cQtdRes = hRes.findIndex((x) => /QTD.*RESERV/.test(x));
      if (cCodRes >= 0 && cQtdRes >= 0) {
        for (let i = hiRes + 1; i < rowsRes.length; i++) {
          const r = rowsRes[i];
          if (!r) continue;
          const cod = str(r[cCodRes]);
          const maskNum = cMaskRes >= 0 ? (str(r[cMaskRes]).match(/\((\d+)\)/)?.[1] ?? "") : "";
          const qtd = num(r[cQtdRes]);
          if (cod && qtd > 0) {
            const key = `${cod}|${maskNum}`;
            reservasMap.set(key, (reservasMap.get(key) ?? 0) + qtd);
          }
        }
      }
    }
  }

  /* 3. Ler Estoque, cruzar SITUAÇÃO + reservas, filtrar fora de linha */
  const itens: ItemForaDeLinha[] = [];
  const posEm = vazio("EM LINHA");
  const posFora = vazio("FORA DE LINHA");
  for (let i = hiEst + 1; i < rowsEst.length; i++) {
    const r = rowsEst[i];
    if (!r || !r[0] || str(r[0]) === "") continue;
    const chave = str(r[0]);
    if (!chave.includes(".")) continue;

    const situacao = situacaoMap.get(chave) ?? "";
    if (!situacao) continue; // só itens cadastrados (EM LINHA ou FORA DE LINHA)
    const item = num(r[cItem]);
    const mascara = cMascara >= 0 ? str(r[cMascara]) : "";
    const maskNum = mascara.match(/\((\d+)\)/)?.[1] ?? "";
    const saldoFocco = num(r[cSaldoFocco]);
    const pesoUn = cPesoUn >= 0 ? num(r[cPesoUn]) : 0;
    const custo = cCusto >= 0 ? num(r[cCusto]) : 0;
    const reservas = reservasMap.get(`${item}|${maskNum}`) ?? 0;
    const pesoKg = pesoUn * saldoFocco;
    const valorEstoque = custo * saldoFocco;
    const valorReservado = custo * reservas;

    const acc = situacao === "FORA DE LINHA" ? posFora : posEm;
    acc.itens++;
    acc.saldoFocco += saldoFocco;
    acc.reservas += reservas;
    acc.disponivel += saldoFocco - reservas;
    acc.pesoTon += pesoKg / 1000;
    acc.pesoReservadoTon += pesoUn * reservas / 1000;
    acc.valorEstoque += valorEstoque;
    acc.valorReservado += valorReservado;

    if (situacao === "FORA DE LINHA") {
      itens.push({
        chave,
        item,
        desc: cDesc >= 0 ? str(r[cDesc]) : "",
        mascara,
        categoria: cCategoria >= 0 ? str(r[cCategoria]).toUpperCase() : "",
        origem: "CD",
        saldoFocco,
        saldoFull: 0,
        reservas,
        disponivel: saldoFocco - reservas,
        pesoKg,
        pesoReservadoKg: pesoUn * reservas,
        valorEstoque,
        valorReservado,
      });
    }
  }

  if (itens.length === 0) return null;

  const soma = (k: keyof PosicaoEstoque) => (posEm[k] as number) + (posFora[k] as number);
  const total: PosicaoEstoque = {
    grupo: "TOTAL GERAL", itens: soma("itens"), saldoFocco: soma("saldoFocco"), saldoFull: 0,
    reservas: soma("reservas"), disponivel: soma("disponivel"), pesoTon: soma("pesoTon"),
    pesoReservadoTon: soma("pesoReservadoTon"), valorEstoque: soma("valorEstoque"), valorReservado: soma("valorReservado"),
  };

  return { itens, posicaoEmLinha: posEm, posicaoForaDeLinha: posFora, posicaoTotal: total };
}

/* Preenche valores (custo) usando o custo médio por item da planilha de reservas. */
export function aplicarCustos(
  fdl: ForaDeLinhaData,
  custos: Map<string, number>,
  custoMedioGeral: number,
): ForaDeLinhaData {
  if (fdl.itens.some((i) => i.valorEstoque > 0)) return fdl;
  const itens = fdl.itens.map((i) => {
    const kgUn = i.saldoFocco > 0 ? i.pesoKg / i.saldoFocco : 0;
    const cu = custos.get(`${i.item}|${i.mascara.match(/\((\d+)\)/)?.[1] ?? ""}`) ?? custos.get(String(i.item)) ?? kgUn * custoMedioGeral;
    return { ...i, valorEstoque: cu * i.saldoFocco, valorReservado: cu * i.reservas };
  });
  const vFora = itens.reduce((s, i) => s + i.valorEstoque, 0);
  const rFora = itens.reduce((s, i) => s + i.valorReservado, 0);
  const fora = { ...fdl.posicaoForaDeLinha, valorEstoque: vFora, valorReservado: rFora };
  const em = { ...fdl.posicaoEmLinha, valorEstoque: fdl.posicaoEmLinha.pesoTon * 1000 * custoMedioGeral, valorReservado: fdl.posicaoEmLinha.pesoReservadoTon * 1000 * custoMedioGeral };
  const total = { ...fdl.posicaoTotal, valorEstoque: em.valorEstoque + vFora, valorReservado: em.valorReservado + rFora };
  return { itens, posicaoEmLinha: em, posicaoForaDeLinha: fora, posicaoTotal: total };
}

export function lerForaDeLinha(wb: XLSX.WorkBook): ForaDeLinhaData | null {
  const estoqueLinha = lerFormatoEstoqueLinha(wb);
  if (estoqueLinha) return estoqueLinha;
  const novo = lerFormatoAnalise(wb);
  if (novo) return novo;
  const resumo = lerResumo(wb);
  const itens = lerItens(wb);

  /* Precisa de pelo menos os itens ou o resumo para ser válido */
  if (!itens && !resumo.foraDeLinha) return null;

  return {
    itens: itens ?? [],
    posicaoEmLinha: resumo.emLinha ?? vazio("EM LINHA"),
    posicaoForaDeLinha: resumo.foraDeLinha ?? vazio("FORA DE LINHA"),

    posicaoTotal: resumo.total ?? vazio("TOTAL GERAL"),
  };
}
