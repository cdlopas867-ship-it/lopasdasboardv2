/* Importação automática do Google Drive no servidor.
 *
 * O painel importa planilhas do Drive no cliente (navegador) a cada 5 min,
 * mas isso só acontece quando alguém está autenticado e vendo o dashboard.
 * Este módulo roda no servidor, independentemente de clientes, e salva
 * registros no histórico de estoque (peso, valor, reserva) a cada importação.
 *
 * Assim o card "Histórico · Peso (t)" sempre mostra os dados mais recentes
 * do Drive, mesmo sem ninguém com o painel aberto. */

import * as XLSX from "xlsx";
import { addRegistro, getHistorico } from "./historico-store";
import { setData, getLatestData, setSincronizacao } from "./sync-store";
import { lerReservados, calcularReservados, resumirReservados, calcularPrevisaoReservados } from "./reservados";
import { lerPendentes } from "./pendentes";
import { calcularPendentesResumo } from "./pendentes-resumo";
import { lerAvarias, mesclarAvarias } from "./avarias";
import { calcularAvariasResumo } from "./avarias-resumo";
import { buscarCarregamentoMensal, lerCarregadoMensal, lerUltimaDataCarregado, CARREGADO_SEM_DRIVE } from "./carregamento";
import { calcularRecebimento } from "./recebimento";
import { calcularProducaoSemanal, calcularRecebidoPorDia, type ProducaoSemanalDia } from "./producao-semanal";
import { lerItensEstoque } from "./base-estoque";
import { lerPaletes, calcularResumoPaletes } from "./paletes";
import { faturadoPorUnidade, VALOR_FATURADO_MEDIO } from "@/data/valor-faturado";
import { existsSync, readFileSync } from "./fs-compat";
import { fmtInt, fmtTonDec, fmtMi } from "./format";
import { processarViagensWb } from "./viagens-store";
import { lerForaDeLinha, aplicarCustos, rebuildForaDeLinhaFromItens } from "./fora-de-linha-import";
import { lerItensFocco, calcularSaldoComparativo } from "./saldo-comparativo-import";

/* Planilha analise-estoque não traz custo: usa o custo médio da planilha de reservas. */
function comCustos(
  fdl: NonNullable<ReturnType<typeof lerForaDeLinha>>,
  res: ReturnType<typeof calcularReservados> | null,
) {
  if (!res) return fdl;
  const custos = new Map<string, number>();
  for (const i of res.itens) {
    if (!(i.custoMedio > 0)) continue;
    const id = i.mascara.match(/\((\d+)\)/)?.[1] ?? "";
    custos.set(`${i.cod}|${id}`, i.custoMedio);
    if (!custos.has(i.cod)) custos.set(i.cod, i.custoMedio);
  }
  const porKg = res.totalPesoEstoque > 0 ? res.totalValorEstoque / (res.totalPesoEstoque * 1000) : 0;
  return aplicarCustos(fdl, custos, porKg);
}


import type { Avaria } from "./avarias";
import type { PendenteProducao } from "./pendentes";
import type { ItemEstoque } from "./base-estoque";
import type { SaldoComparativo } from "@/data/saldo-comparativo";

const FOLDER_ID = "16WJaYavcR8B1QgpVsT51Kg0_ADJsSGtQ";
const DRIVE_GATEWAY = "https://connector-gateway.lovable.dev/google_drive/drive/v3";
const PLANILHAS_HISTORICAS = ["1KJ7LbljnIPqa6caCtqyt6T418Q0-Xgpk"];

/* Planilhas locais em public/planilhas/ — processadas além das do Drive.
   Último recurso: se o Drive estiver indisponível, os dados locais garantem
   que o painel tenha conteúdo atualizado. */
const PLANILHAS_LOCAIS = [
  "public/planilhas/avarias.xlsx",
  "public/planilhas/carregado.xlsx",
  "public/planilhas/estoque.xlsx",
  "public/planilhas/paletes.xlsx",
  "public/planilhas/estoque-em-linha.xlsx",
  "public/planilhas/ocupacao-cd.xlsx",
];

type ArquivoDrive = { id: string; nome: string; modificado?: string | undefined };

function gatewayHeaders(): HeadersInit | null {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const driveKey = process.env["GOOGLE_DRIVE_API_KEY"];
  if (!lovableKey || !driveKey) return null;
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": driveKey,
  };
}

/* Converte o horário de modificação exibido pelo Drive em um objeto Date.
   Formatos do Drive: "11:25 am" (hoje), "Sep 22" (data sem hora),
   "Sep 22, 2025" (data com ano). Assume o fuso do servidor (TZ=America/Sao_Paulo). */
function parseModificado(mod: string): Date | undefined {
  if (!mod) return undefined;
  // ISO 8601 — formato retornado pela API do Google Drive (gateway),
  // ex: "2026-09-22T11:25:00.000Z". Preserva a hora real de modificação.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(mod)) {
    const d = new Date(mod);
    if (!isNaN(d.getTime())) return d;
  }
  const now = new Date();
  const timeMatch = mod.match(/(\d+):(\d+)\s*(am|pm)/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]!, 10);
    const minutes = parseInt(timeMatch[2]!, 10);
    const isPM = /pm/i.test(timeMatch[3]!);
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    /* Hora exibida pelo Drive está no fuso de São Paulo (UTC-3), mesmo quando
       o servidor publicado roda em UTC. */
    const sp = new Date(now.getTime() - 3 * 3600_000);
    return new Date(Date.UTC(sp.getUTCFullYear(), sp.getUTCMonth(), sp.getUTCDate(), hours + 3, minutes));
  }
  const meses: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const dateMatch = mod.match(/^(\w{3})\s+(\d+)(?:,?\s+(\d{4}))?/);
  if (dateMatch) {
    const month = meses[dateMatch[1]!];
    const day = parseInt(dateMatch[2]!, 10);
    const year = dateMatch[3] ? parseInt(dateMatch[3]!, 10) : now.getFullYear();
    if (month !== undefined) return new Date(year, month, day);
  }
  return undefined;
}

/* Lista os arquivos .xlsx de uma pasta pública do Drive com nome e
   horário de última modificação. Fallback: coleta os IDs por regex direta do HTML
   em vez de depender de uma estrutura HTML específica do Google. */
async function listarPlanilhasDaPasta(folderId: string): Promise<ArquivoDrive[]> {
  const headers = gatewayHeaders();
  if (headers) {
    /* A conexão do Drive no gateway pode expirar ou ser revogada. A pasta é
       pública, então, se o gateway falhar, seguimos para a leitura direta do
       HTML em vez de abortar a importação inteira. */
    try {
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "files(id,name,mimeType,modifiedTime)",
        pageSize: "1000",
        orderBy: "modifiedTime desc",
      });
      const apiRes = await fetch(`${DRIVE_GATEWAY}/files?${params}`, {
        headers,
        cache: "no-store",
      });
      if (!apiRes.ok) {
        throw new Error(`Google Drive ${apiRes.status}: ${await apiRes.text()}`);
      }
      const payload = await apiRes.json() as {
        files?: Array<{ id?: string; name?: string; mimeType?: string; modifiedTime?: string }>;
      };
      return (payload.files ?? [])
        .filter((file) => file.id && (
          file.mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          file.mimeType === "application/vnd.ms-excel" ||
          file.mimeType === "application/vnd.google-apps.spreadsheet"
        ))
        .map((file) => ({
          id: file.id ?? "",
          nome: file.name ?? "",
          modificado: file.modifiedTime,
        }));
    } catch (e) {
      console.warn(`[auto-import] gateway do Drive indisponível — lendo a pasta pública: ${(e as Error).message}`);
    }
  }

  const res = await fetch(
    `https://drive.google.com/embeddedfolderview?id=${folderId}#list`,
    { redirect: "follow", cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Pasta ${folderId}: ${res.status}`);

  const html = await res.text();
  const arquivos: ArquivoDrive[] = [];
  const seen = new Set<string>();

  /* Cada bloco flip-entry traz id, título e o horário de última modificação
     exibido pelo Drive ("3:27 am" quando modificado hoje, "Sep 22" quando mais
     antigo). Divide o HTML por bloco para associar a hora certa a cada arquivo. */
  const blocos = html.split('<div class="flip-entry" id="entry-');
  for (const bloco of blocos.slice(1)) {
    const id = bloco.match(/^([a-zA-Z0-9_-]+)"/)?.[1];
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const nomeRaw = bloco.match(/<div class="flip-entry-title">([^<]*)<\/div>/)?.[1] ?? "";
    const nome = nomeRaw
      .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .trim();
    const modificado = bloco.match(/<div class="flip-entry-last-modified"><div>([^<]*)<\/div>/)?.[1]?.trim();
    arquivos.push({ id, nome, modificado: modificado || undefined });
  }

  /* Fallback: IDs por regex direta caso a estrutura do HTML mude. */
  if (arquivos.length === 0) {
    const idRe = /\/file\/d\/([a-zA-Z0-9_-]+)/g;
    let match: RegExpExecArray | null;
    while ((match = idRe.exec(html)) !== null) {
      const id = match[1]!;
      if (!seen.has(id)) {
        seen.add(id);
        arquivos.push({ id, nome: "", modificado: undefined });
      }
    }
  }

  return arquivos;
}

/* Baixa uma planilha do Drive como ArrayBuffer. */
async function baixarPlanilha(id: string): Promise<ArrayBuffer> {
  const headers = gatewayHeaders();
  if (headers && !PLANILHAS_HISTORICAS.includes(id)) {
    /* Mesmo caso da listagem: se o gateway falhar, tenta o download público
       (docs.google / drive.google) antes de desistir da planilha. */
    try {
      const res = await fetch(`${DRIVE_GATEWAY}/files/${id}?alt=media`, {
        headers,
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Google Drive ${res.status}: ${await res.text()}`);
      }
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf, 0, 2);
      if ((bytes[0] === 0x50 && bytes[1] === 0x4b) || (bytes[0] === 0xd0 && bytes[1] === 0xcf)) {
        return buf;
      }
      throw new Error("conteúdo não é uma planilha Excel");
    } catch (e) {
      console.warn(`[auto-import] download pelo gateway falhou (${id}) — tentando acesso público: ${(e as Error).message}`);
    }
  }

  const urls = [
    `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx&_=${Date.now()}`,
    `https://drive.google.com/uc?export=download&confirm=t&id=${id}&_=${Date.now()}`,
  ];
  let ultimo = 0;
  for (const url of urls) {
    const res = await fetch(url, { redirect: "follow", cache: "no-store" });
    ultimo = res.status;
    if (!res.ok) continue;
    const buf = await res.arrayBuffer();
    const b = new Uint8Array(buf, 0, 2);
    if (b[0] === 0x50 && b[1] === 0x4b) return buf; // arquivo xlsx (zip)
    if (b[0] === 0xd0 && b[1] === 0xcf) return buf; // xls antigo
  }
  throw new Error(`Drive ${id}: ${ultimo}`);
}

type ResumoData = {
  valor: number;
  previsto: number;
  ton: number;
  saldo: number;
  itens: number;
  data: string; // "dd/mm/yyyy"
};

/* Extrai o resumo (linha TOTAL) da aba "Resumo" de uma planilha.
   Suporta dois formatos:
   - Antigo: cabeçalho "Categoria", linha "TOTAL"
   - Novo:    cabeçalho "GRUPO",   linha "TOTAL GERAL"
   Retorna null se a aba não existir ou não tiver o formato esperado. */
function extrairResumo(wb: XLSX.WorkBook): ResumoData | null {
  const ws = wb.Sheets["Resumo"];
  if (!ws) return null;

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  const hi = rows.findIndex((r) =>
    r?.[0] != null && ["CATEGORIA", "GRUPO"].includes(String(r[0]).toUpperCase().trim()),
  );
  if (hi < 0) return null;

  const cab = String(rows[1]?.[0] ?? "");
  const data = cab.match(/\d{2}\/\d{2}\/\d{4}/)?.[0] ?? "";
  const formatoNovo = String(rows[hi]?.[0] ?? "").toUpperCase().trim() === "GRUPO";

  const num = (r: unknown[], i: number) => (i >= 0 ? (typeof r[i] === "number" ? r[i] as number : Number(r[i] ?? 0) || 0) : 0);
  let cItens: number, cSaldo: number, cTon: number, cValor: number, cPrevisto: number;
  if (formatoNovo) {
    const headers = (rows[hi] ?? []).map((c) => String(c ?? "").toUpperCase().trim());
    const findCol = (needles: string[]) =>
      headers.findIndex((h) => needles.some((n) => h === n || h.includes(n)));
    cItens = findCol(["ITENS"]);
    cSaldo = findCol(["SALDO FOCCO", "SALDO"]);
    cTon = findCol(["PESO TOTAL"]);
    cValor = findCol(["VALOR ESTOQUE"]);
    cPrevisto = findCol(["PREVISTO"]);
  } else {
    cItens = 1; cSaldo = 2; cTon = 4; cValor = 5; cPrevisto = 8;
  }

  /* Peso em toneladas de uma linha — usa "Peso (ton)" e cai para
     "Peso (kg) / 1000" quando aquela coluna vem vazia. */
  const tonDaLinha = (r: unknown[]) =>
    formatoNovo ? num(r, cTon) : (num(r, cTon) > 0 ? num(r, cTon) : num(r, 3) / 1000);

  /* Encontra a linha TOTAL ou TOTAL GERAL */
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r[0] == null || String(r[0]).trim() === "") break;
    const label = String(r[0]).toUpperCase().trim();
    if (label === "TOTAL" || label === "TOTAL GERAL") {
      let ton = tonDaLinha(r);
      let valor = num(r, cValor);
      let saldo = num(r, cSaldo);
      let itens = num(r, cItens);
      /* Valor previsto = toneladas × valor faturado por tonelada (R$/t),
         fixado por unidade. A coluna "Valor Previsto" da planilha é
         ignorada — o cálculo parte sempre do peso × faturado fixo. */
      let previsto = 0;

      /* Exportações novas vêm com a linha TOTAL sem valores (só as linhas
         de categoria preenchidas) — soma as categorias acima dela, usando
         o faturado da unidade de cada linha. */
      if (ton === 0 && valor === 0 && saldo === 0 && itens === 0) {
        for (let j = hi + 1; j < i; j++) {
          const cat = rows[j];
          if (!cat || cat[0] == null) break;
          const t = tonDaLinha(cat);
          ton += t;
          valor += num(cat, cValor);
          saldo += num(cat, cSaldo);
          itens += num(cat, cItens);
          previsto += t * faturadoPorUnidade(MAPA_UNIDADES[String(cat[0]).toUpperCase().trim()]);
        }
      }

      /* Quando a linha TOTAL já vem preenchida (sem detalhe por categoria),
         aplica a média do CD sobre o peso total. */
      return { valor, previsto: previsto || ton * VALOR_FATURADO_MEDIO, ton, saldo, itens, data };
    }
  }
  return null;
}

/* Extrai o peso total reservado (toneladas) da aba de reservas.
   Procura a aba com cabeçalho "QUANTIDADE RESERVADA". */
function extrairReservaTon(wb: XLSX.WorkBook): number | undefined {
  let ws: XLSX.WorkSheet | undefined;
  let headerRow = 0;

  const orderedNames = [
    ...wb.SheetNames.filter((n) => /RESERV|PESO|TONELAD/i.test(n)),
    ...wb.SheetNames.filter((n) => !/RESERV|PESO|TONELAD/i.test(n)),
  ];

  for (const name of orderedNames) {
    const candidate = wb.Sheets[name];
    if (!candidate) continue;
    const raw = XLSX.utils.sheet_to_json<unknown[]>(candidate, { header: 1, defval: null });
    for (let i = 0; i < Math.min(raw.length, 10); i++) {
      const row = raw[i] ?? [];
      if (row.some((c) => /QUANTIDADE RESERVADA/i.test(String(c ?? "").trim()))) {
        ws = candidate;
        headerRow = i;
        break;
      }
    }
    if (ws) break;
  }
  if (!ws) return undefined;

  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  if (raw.length <= headerRow) return undefined;

  const header = (raw[headerRow] ?? []).map((c) => String(c ?? "").trim());
  const dataRows = raw.slice(headerRow + 1);

  const findCol = (patterns: RegExp[]) =>
    header.findIndex((c) => patterns.some((p) => p.test(c.toUpperCase())));

  const colPeso = findCol([/PESO/, /^PESO BRT/]);
  const colReserv = findCol([/QUANTIDADE RESERVADA/, /RESERVADA/, /RESERV/]);

  if (colReserv < 0) return undefined;

  const pesoEmToneladas = colPeso >= 0
    ? /TONELAD|TON\b/i.test(header[colPeso]!.toUpperCase())
    : false;

  let totalKg = 0;
  for (const r of dataRows) {
    const qtdReservada = Number(r[colReserv] ?? 0) || 0;
    if (qtdReservada <= 0) continue;
    const pesoBrtRaw = Number(r[colPeso >= 0 ? colPeso : -1] ?? 0) || 0;
    const pesoBrt = pesoEmToneladas ? pesoBrtRaw * 1000 : pesoBrtRaw;
    totalKg += pesoBrt * qtdReservada;
  }

  return totalKg > 0 ? totalKg / 1000 : undefined;
}

/* Extrai o valor total reservado (R$) da aba de reservas.
   Soma CUSTO MEDIO × QUANTIDADE RESERVADA de todos os itens. */
function extrairReservaValor(wb: XLSX.WorkBook): number | undefined {
  let ws: XLSX.WorkSheet | undefined;
  let headerRow = 0;

  const orderedNames = [
    ...wb.SheetNames.filter((n) => /RESERV|PESO|TONELAD/i.test(n)),
    ...wb.SheetNames.filter((n) => !/RESERV|PESO|TONELAD/i.test(n)),
  ];

  for (const name of orderedNames) {
    const candidate = wb.Sheets[name];
    if (!candidate) continue;
    const raw = XLSX.utils.sheet_to_json<unknown[]>(candidate, { header: 1, defval: null });
    for (let i = 0; i < Math.min(raw.length, 10); i++) {
      const row = raw[i] ?? [];
      if (row.some((c) => /QUANTIDADE RESERVADA/i.test(String(c ?? "").trim()))) {
        ws = candidate;
        headerRow = i;
        break;
      }
    }
    if (ws) break;
  }
  if (!ws) return undefined;

  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  if (raw.length <= headerRow) return undefined;

  const header = (raw[headerRow] ?? []).map((c) => String(c ?? "").trim());
  const dataRows = raw.slice(headerRow + 1);

  const findCol = (patterns: RegExp[]) =>
    header.findIndex((c) => patterns.some((p) => p.test(c.toUpperCase())));

  const colCusto = findCol([/CUSTO/]);
  const colReserv = findCol([/QUANTIDADE RESERVADA/, /RESERVADA/, /RESERV/]);

  if (colReserv < 0 || colCusto < 0) return undefined;

  let totalValor = 0;
  for (const r of dataRows) {
    const qtdReservada = Number(r[colReserv] ?? 0) || 0;
    if (qtdReservada <= 0) continue;
    const custoMedio = Number(r[colCusto] ?? 0) || 0;
    totalValor += custoMedio * qtdReservada;
  }

  return totalValor > 0 ? totalValor : undefined;
}

/* Dados por unidade extraídos da aba Resumo. */
type UnidadeResumo = {
  nome: string;
  itens: number;
  saldo: number;
  pesoTon: number;
  valor: number;
  previsto: number;
  share: number;
};

/* Extrai os dados por unidade (Guarda-Roupas, Complementos, Salas) da aba Resumo.
   Mapeia os nomes do Drive para os IDs usados no dashboard. */
function extrairUnidadesResumo(wb: XLSX.WorkBook): UnidadeResumo[] | null {
  const ws = wb.Sheets["Resumo"];
  if (!ws) return null;
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  const hi = rows.findIndex((r) =>
    r?.[0] != null && ["CATEGORIA", "GRUPO"].includes(String(r[0]).toUpperCase().trim()),
  );
  if (hi < 0) return null;
  const formatoNovo = String(rows[hi]?.[0] ?? "").toUpperCase().trim() === "GRUPO";
  const num = (r: unknown[], i: number) => (i >= 0 ? (typeof r[i] === "number" ? r[i] as number : Number(r[i] ?? 0) || 0) : 0);

  const unidades: UnidadeResumo[] = [];
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r[0] == null || String(r[0]).trim() === "") break;
    const label = String(r[0]).toUpperCase().trim();
    if (label === "TOTAL" || label === "TOTAL GERAL") break;
    let cItens: number, cSaldo: number, cTon: number, cValor: number, cPrevisto: number, cShare: number;
    if (formatoNovo) {
      const headers = (rows[hi] ?? []).map((c) => String(c ?? "").toUpperCase().trim());
      const findCol = (needles: string[]) =>
        headers.findIndex((h) => needles.some((n) => h === n || h.includes(n)));
      cItens = findCol(["ITENS"]);
      cSaldo = findCol(["SALDO"]);
      cTon = findCol(["PESO TOTAL"]);
      cValor = findCol(["VALOR ESTOQUE"]);
      cPrevisto = findCol(["PREVISTO"]);
      cShare = findCol(["%"]);
    } else {
      cItens = 1; cSaldo = 2; cTon = 4; cValor = 5; cPrevisto = 8; cShare = 6;
    }
    const ton = formatoNovo ? num(r, cTon) : (num(r, cTon) > 0 ? num(r, cTon) : num(r, 3) / 1000);
    const valor = num(r, cValor);
    unidades.push({
      nome: label,
      itens: num(r, cItens),
      saldo: num(r, cSaldo),
      pesoTon: ton,
      valor,
      /* Valor previsto = toneladas da unidade × valor faturado por tonelada
         (R$/t) fixado por unidade. A coluna "Valor Previsto" da planilha é
         ignorada — o cálculo parte sempre do peso × faturado fixo. */
      previsto: ton * faturadoPorUnidade(MAPA_UNIDADES[label]),
      share: num(r, cShare) * (cShare >= 0 && num(r, cShare) <= 1 ? 100 : 1),
    });
  }

  /* Planilhas novas trazem a coluna "%" vazia — calcula a participação de
     cada unidade pelo valor quando nenhuma linha trouxe percentual. */
  if (unidades.length > 0 && unidades.every((u) => u.share === 0)) {
    const total = unidades.reduce((s, u) => s + u.valor, 0);
    if (total > 0) for (const u of unidades) u.share = (u.valor / total) * 100;
  }
  return unidades.length > 0 ? unidades : null;
}

/* Dados de ocupação do CD extraídos da aba Resumo.
   A planilha traz uma seção "OCUPAÇÃO DO CENTRO DE DISTRIBUIÇÃO" com as
   linhas Livre/Ocupado/TOTAL (quantidade de posições e fração ocupada).
   Retorna null se a seção não existir. */
type OcupacaoData = { pct: number; ocupados: number; livres: number; bloqueados: number; total: number };

/* Extrai a ocupação do CD de uma planilha. Suporta dois formatos:
   1. Aba "Resumo" com seção "Situação" (Livre/Ocupado/TOTAL) — formato antigo.
   2. Aba "Resultado" do relatório WF0126 (Tipo LA, Situação, Quantidade) —
      formato novo com Livre/Ocupado/Bloqueado. */
function extrairOcupacao(wb: XLSX.WorkBook): OcupacaoData | null {
  /* Formato 1: aba "Resumo" com seção "Situação" */
  const wsResumo = wb.Sheets["Resumo"];
  if (wsResumo) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wsResumo, { header: 1, defval: null });
    const hi = rows.findIndex((r) => /SITUAÇ/i.test(String(r?.[0] ?? "").trim()));
    if (hi >= 0) {
      const num = (r: unknown[], i: number) =>
        i >= 0 ? (typeof r[i] === "number" ? (r[i] as number) : Number(r[i] ?? 0) || 0) : 0;
      let ocupados = 0, livres = 0, bloqueados = 0, total = 0, pct = 0;
      for (let i = hi + 1; i < Math.min(hi + 12, rows.length); i++) {
        const r = rows[i] ?? [];
        const label = String(r[0] ?? "").toUpperCase().trim();
        if (!label) break;
        if (label === "TOTAL" || label === "TOTAL GERAL") { total = num(r, 1); break; }
        if (label.includes("OCUPAD")) { ocupados = num(r, 1); pct = num(r, 2); }
        else if (label.includes("LIVRE")) { livres = num(r, 1); }
        else if (label.includes("BLOQUE")) { bloqueados = num(r, 1); }
      }
      if (total <= 0) total = ocupados + livres + bloqueados;
      if (total > 0) {
        if (!pct || pct > 1) pct = ocupados / total;
        return { pct, ocupados, livres, bloqueados, total };
      }
    }
  }

  /* Formato 2: aba "Resultado" do WF0126 — suporta dois subformatos:
     a) Tabela pivô com coluna "Quantidade" (sumarizada por Situação).
     b) Dados crus: uma linha por endereço (Situação, Tipo LA, Endereço) —
        conta as linhas por Situação quando não há coluna Quantidade. */
  const wsResultado = wb.Sheets["Resultado"];
  if (wsResultado) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wsResultado, { header: 1, defval: null });
    const hi = rows.findIndex((r) =>
      r?.some((c) => /SITUAÇ/i.test(String(c ?? "").trim())),
    );
    if (hi >= 0) {
      const headers = (rows[hi] ?? []).map((c) => String(c ?? "").toUpperCase().trim());
      const colSituacao = headers.findIndex((h) => /SITUAÇ/i.test(h));
      const colQtd = headers.findIndex((h) => /QUANTIDADE/i.test(h));
      if (colSituacao >= 0) {
        let ocupados = 0, livres = 0, bloqueados = 0;
        for (let i = hi + 1; i < rows.length; i++) {
          const r = rows[i] ?? [];
          const situacao = String(r[colSituacao] ?? "").toUpperCase().trim();
          if (!situacao) continue;
          if (colQtd >= 0) {
            const qtd = Number(r[colQtd] ?? 0) || 0;
            if (situacao.includes("OCUPAD")) ocupados += qtd;
            else if (situacao.includes("LIVRE")) livres += qtd;
            else if (situacao.includes("BLOQUE")) bloqueados += qtd;
          } else {
            if (situacao.includes("OCUPAD")) ocupados++;
            else if (situacao.includes("LIVRE")) livres++;
            else if (situacao.includes("BLOQUE")) bloqueados++;
          }
        }
        const total = ocupados + livres + bloqueados;
        if (total > 0) {
          return { pct: ocupados / total, ocupados, livres, bloqueados, total };
        }
      }
    }
  }

  return null;
}

/* Constrói o resumo (tons, valor, saldo, itens, previsto) a partir dos
   itens de estoque quando a planilha não tem aba "Resumo" — modelo
   "ESTOQUE 001 - POSIÇÃO DE ESTOQUE" com colunas ITEM, SALDO, PESO LIQ
   TOTAL, CLASSIFICACAO N1 e CUSTO MEDIO. Calcula o valor previsto por
   unidade usando o faturado (R$/t) de cada CLASSIFICAÇÃO N1. */
function resumoDeItens(itens: ItemEstoque[]): { resumo: ResumoData; unidades: UnidadeResumo[] } | null {
  if (!itens.length) return null;
  let ton = 0, valor = 0, saldo = 0, itensCount = 0, previsto = 0;
  const porUnidade = new Map<string, { itens: number; saldo: number; pesoTon: number; valor: number; previsto: number }>();
  for (const it of itens) {
    const pesoTon = it.peso / 1000;
    const v = it.valor > 0 ? it.valor : it.saldo * it.custo;
    ton += pesoTon;
    valor += v;
    saldo += it.saldo;
    itensCount++;
    const id = MAPA_UNIDADES[it.unidade.toUpperCase().trim()];
    const fat = faturadoPorUnidade(id);
    previsto += pesoTon * fat;
    const nome = it.unidade.toUpperCase().trim() || "OUTROS";
    const atual = porUnidade.get(nome) ?? { itens: 0, saldo: 0, pesoTon: 0, valor: 0, previsto: 0 };
    atual.itens++;
    atual.saldo += it.saldo;
    atual.pesoTon += pesoTon;
    atual.valor += v;
    atual.previsto += pesoTon * fat;
    porUnidade.set(nome, atual);
  }
  const unidades: UnidadeResumo[] = [...porUnidade.entries()].map(([nome, u]) => ({
    nome,
    itens: u.itens,
    saldo: u.saldo,
    pesoTon: u.pesoTon,
    valor: u.valor,
    previsto: u.previsto,
    share: valor > 0 ? (u.valor / valor) * 100 : 0,
  }));
  return {
    resumo: { valor, previsto, ton, saldo, itens: itensCount, data: "" },
    unidades,
  };
}

/* Mapeia nome do Drive → ID do dashboard. */
const MAPA_UNIDADES: Record<string, string> = {
  "UNIDADE GUARDA ROUPAS": "guarda-roupas",
  "UNIDADE GUARDA-ROUPAS": "guarda-roupas",
  "UNIDADE DE COMPLEMENTOS": "complementos",
  "UNIDADE COMPLEMENTOS": "complementos",
  "UNIDADE DE SALAS": "salas",
  "UNIDADE SALAS": "salas",
};

/* Recomputa os KPIs a partir dos dados do Drive, atualizando apenas os
   campos `valor` e `extra` — preserva rotulo e detalhe. */
function recomputeKpis(
  kpis: Record<string, unknown>[],
  resumo: ResumoData,
  unidadesData: UnidadeResumo[] | null,
  ocupacaoData: OcupacaoData | null,
): Record<string, unknown>[] {
  return kpis.map((k) => {
    const id = k["id"] as string;
    if (id === "ocupacao" && ocupacaoData) {
      const pctStr = `${(ocupacaoData.pct * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
      const prevExtra = (k["extra"] as [string, string][]) ?? [];
      const subs: Record<string, string> = {
        "Ocupados": fmtInt(ocupacaoData.ocupados),
        "Livres": fmtInt(ocupacaoData.livres),
        "Bloqueados": fmtInt(ocupacaoData.bloqueados),
        "Total de endereços": fmtInt(ocupacaoData.total),
        "POSIÇÕES": `${fmtInt(ocupacaoData.total)} qtd`,
      };
      const extra = prevExtra.map(([lbl, val]) => subs[lbl] ? [lbl, subs[lbl]] as [string, string] : [lbl, val]);
      const detalhe = `${fmtInt(ocupacaoData.ocupados)} endereços ocupados de um total de ${fmtInt(ocupacaoData.total)}. Ainda há ${fmtInt(ocupacaoData.livres)} posições livres — fôlego para o pico de recebimento.`;
      return { ...k, valor: pctStr, detalhe, extra };
    }
    if (id === "valor") {
      const extras = unidadesData?.map((u) => [u.nome.replace("UNIDADE ", "").replace("DE ", ""), fmtMi(u.valor)] as [string, string]) ?? [];
      return { ...k, valor: fmtMi(resumo.valor), extra: extras };
    }
    if (id === "previsto") {
      const extras = unidadesData?.map((u) => [u.nome.replace("UNIDADE ", "").replace("DE ", ""), fmtMi(u.previsto)] as [string, string]) ?? [];
      return { ...k, valor: fmtMi(resumo.previsto), extra: extras };
    }
    if (id === "pecas") {
      const extras: [string, string][] = [["Itens ativos", fmtInt(resumo.itens)]];
      if (unidadesData) {
        for (const u of unidadesData) {
          const nome = u.nome.replace("UNIDADE ", "").replace("DE ", "");
          extras.push([nome, fmtInt(u.saldo)]);
        }
      }
      return { ...k, valor: fmtInt(resumo.saldo), extra: extras };
    }
    if (id === "peso") {
      const extras = unidadesData?.map((u) => [u.nome.replace("UNIDADE ", "").replace("DE ", ""), fmtTonDec(u.pesoTon)] as [string, string]) ?? [];
      return { ...k, valor: fmtTonDec(resumo.ton), extra: extras };
    }
    return k;
  });
}

/* Recomputa as stats das unidades a partir dos dados do Drive. */
function recomputeUnidades(
  unidades: Record<string, unknown>[],
  unidadesData: UnidadeResumo[],
): Record<string, unknown>[] {
  return unidades.map((u) => {
    const id = u["id"] as string;
    const data = unidadesData.find((d) => MAPA_UNIDADES[d.nome] === id);
    if (!data) return u;
    return {
      ...u,
      share: Math.round(data.share * 10) / 10,
      previsto: fmtMi(data.previsto),
      stats: [
        ["Itens", fmtInt(data.itens)],
        ["Saldo", `${fmtInt(data.saldo)} un`],
        ["Peso", fmtTonDec(data.pesoTon)],
        ["Valor", fmtMi(data.valor)],
      ],
    };
  });
}

/* Compara duas datas no formato "dd/mm/yyyy" — retorna a mais recente. */
function dataMaisRecente(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  const [da, ma, ya] = a.split("/").map(Number);
  const [db, mb, yb] = b.split("/").map(Number);
  const ta = new Date(ya!, ma! - 1, da!).getTime();
  const tb = new Date(yb!, mb! - 1, db!).getTime();
  return ta >= tb ? a : b;
}

/* Registro da sincronização exibido no painel: quando a pasta foi lida e
   quais planilhas foram consideradas (com a data de modificação de cada uma). */
function construirSincronizacao(arquivos: ArquivoDrive[]) {
  const planilhas = arquivos
    .filter((a) => a.nome)
    .map((a) => ({
      nome: a.nome,
      ...(a.modificado && parseModificado(a.modificado) ? { modificado: parseModificado(a.modificado)!.toISOString() } : {}),
    }));
  /* Hora real da atualização no Drive: a modificação mais recente entre as
     planilhas da pasta. Sem data conhecida, usa o instante da leitura. */
  const modificados = planilhas
    .map((p) => (p.modificado ? new Date(p.modificado).getTime() : 0))
    .filter((t) => t > 0);
  const em = modificados.length ? new Date(Math.max(...modificados)).toISOString() : new Date().toISOString();
  return { em, planilhas };
}

/* Executa uma importação completa do Drive e salva no histórico.
   Retorna true se um novo registro foi salvo. */
declare global {
  // eslint-disable-next-line no-var
  var __driveImportState: { ultimo: number; assinatura: string; emAndamento: Promise<boolean> | null } | undefined;
}

/* Versão com controle: verifica a pasta no máximo a cada 10 s, só reprocessa
   quando algum arquivo mudou e evita importações simultâneas. Quando nada
   mudou, a checagem é barata (só a listagem da pasta). */
export async function importarSeMudou(forcar = false): Promise<boolean> {
  const st = (globalThis.__driveImportState ??= { ultimo: 0, assinatura: "", emAndamento: null });
  if (st.emAndamento) return st.emAndamento;
  const agora = Date.now();
  if (!forcar && agora - st.ultimo < 5_000) return false;
  st.ultimo = agora;
  st.emAndamento = (async () => {
    try {
      const arquivos = await listarPlanilhasDaPasta(FOLDER_ID);
      const assinatura = arquivos.map((a) => `${a.id}:${a.modificado?.toString() ?? ""}`).sort().join("|");
      const semData = arquivos.some((a) => !a.modificado);
      if (!forcar && assinatura === st.assinatura && !semData) {
        /* Nada mudou no Drive: mantém o carimbo "Sincronizado" do painel atual. */
        setSincronizacao(construirSincronizacao(arquivos));
        return false;
      }
      const ok = await importarDoDriveServidor(arquivos);
      st.assinatura = assinatura;
      return ok;
    } catch (e) {
      console.error("[auto-import] falha:", (e as Error).message);
      return false;
    } finally {
      st.emAndamento = null;
    }
  })();
  return st.emAndamento;
}

export async function importarDoDriveServidor(lista?: ArquivoDrive[]): Promise<boolean> {
  let arquivos: ArquivoDrive[];
  try {
    arquivos = lista ? [...lista] : await listarPlanilhasDaPasta(FOLDER_ID);
  } catch (e) {
    console.error("[auto-import] erro ao listar pasta do Drive:", (e as Error).message);
    return false;
  }
  /* Planilha histórica de avarias (com custos) que já esteve na pasta.
     Mantida como fonte fixa para o histórico não se perder se sair da pasta. */
  for (const extra of PLANILHAS_HISTORICAS) {
    if (!arquivos.some((a) => a.id === extra)) arquivos.push({ id: extra, nome: "", modificado: undefined });
  }

  if (!arquivos.length) {
    console.warn("[auto-import] nenhuma planilha encontrada na pasta do Drive");
    return false;
  }

  /* Baixa e processa todas as planilhas */
  let melhorResumo: ResumoData | null = null;
  /* Registro da sincronização: quando o painel leu a pasta e quais
     planilhas foram consideradas (com a data de modificação de cada uma).
     Exibido no painel para o usuário saber de quando são os dados. */
  const sincronizacao = construirSincronizacao(arquivos);

  let melhorResumoMod: Date | undefined;
  let reservadoTon: number | undefined;
  let reservadoValor: number | undefined;
  let melhorReservados: ReturnType<typeof calcularReservados> | null = null;
  let melhorSemReserva: ReturnType<typeof calcularReservados> | null = null;
  let pendentesResumo: ReturnType<typeof calcularPendentesResumo> | null = null;
  let melhorAvariasResumo: ReturnType<typeof calcularAvariasResumo> | null = null;
  let carregadoDriveMap: Map<string, number> | null = null;
  let carregadoAte: string | null = null;
  const listasAvarias: Avaria[][] = [];
  let melhorAvarias: Avaria[] | null = null;
  let melhorPendentes: PendenteProducao[] | null = null;
  let melhorRecebimento: ReturnType<typeof calcularRecebimento> | null = null;
  let melhorItens: ItemEstoque[] | null = null;
  let melhorItensMod: Date | undefined;
  let itensFocco: Map<string, { saldo: number; desc: string }> | null = null;
  let melhorUnidadesResumo: UnidadeResumo[] | null = null;
  let melhorForaDeLinha: ReturnType<typeof lerForaDeLinha> | null = null;
  let melhorFdlMod = 0;
  let melhorOcupacao: OcupacaoData | null = null;
  let melhorPaletes: ReturnType<typeof lerPaletes> | null = null;
  let wbProducao: XLSX.WorkBook | null = null;
  let melhorRecebidoPorDia: Map<string, { qtd: number; peso: number }> | null = null;

  for (const arq of arquivos) {
    try {
      const buf = await baixarPlanilha(arq.id);
      const wb = XLSX.read(buf, { type: "array" });

      /* Extrai dados de viagens (controle de viagens CD) da planilha */
      processarViagensWb(wb);

      /* Extrai dados de "Fora de Linha" (itens descontinuados) da planilha */
      const fdl = lerForaDeLinha(wb);
      if (fdl) { melhorForaDeLinha = fdl; melhorFdlMod = Math.max(melhorFdlMod, Number(parseModificado(arq.modificado ?? "")) || 0); }

      /* Extrai itens reservados detalhados da planilha */
      const itensReservados = lerReservados(wb);
      if (itensReservados && itensReservados.length > 0) {
        const reservados = calcularReservados(itensReservados);
        if (reservados.itens.length > 0) melhorReservados = reservados;
      }
      /* Itens em estoque sem reserva (saldo disponível) */
      const itensSemReserva = lerReservados(wb, "semReserva");
      if (itensSemReserva && itensSemReserva.length > 0) melhorSemReserva = calcularReservados(itensSemReserva);

      /* Extrai pendências de produção */
      const itensPendentes = lerPendentes(wb);
      if (itensPendentes.length > 0) {
        const resumo = calcularPendentesResumo(itensPendentes);
        if (resumo) pendentesResumo = resumo;
        melhorPendentes = itensPendentes;
      }

      /* Extrai avarias da planilha.
         Há mais de uma planilha com avarias na pasta: a base histórica traz
         custo e peso, e o arquivo de gerenciamento traz os lançamentos mais
         recentes sem custo. Guarda todas para mesclar depois. */
      const avariasRaw = lerAvarias(wb);
      if (avariasRaw.length > 0) listasAvarias.push(avariasRaw);

      /* Extrai recebimento (turnos, dias e itens) da aba Base Recebimento */
      const receb = calcularRecebimento(wb);
      if (receb && receb.dias.length > 0) melhorRecebimento = receb;

      /* Guarda a workbook de produção para processar após ter os itens de estoque */
      const prod = calcularProducaoSemanal(wb, undefined);
      if (prod && prod.length > 0) wbProducao = wb;

      /* Detecta a planilha PESO RECEBIDO POR PERÍODO para cruzar com produção */
      const recebidoPorDia = calcularRecebidoPorDia(wb);
      if (recebidoPorDia && recebidoPorDia.size > (melhorRecebidoPorDia?.size ?? 0)) {
        melhorRecebidoPorDia = recebidoPorDia;
      }

      /* Extrai a base de itens de estoque (Top Produtos, Curva ABC, fichas) */
      const itensEstoque = lerItensEstoque(wb);
      if (itensEstoque.length > (melhorItens?.length ?? 0)) {
        melhorItens = itensEstoque;
        melhorItensMod = parseModificado(arq.modificado ?? "");
      }

      /* Extrai o saldo do Focco (relatório WF0112 - Estoques) para o
         comparativo Full × Focco. O sheet_to_json é feito aqui, onde o XLSX
         funciona sob o SSR, e as linhas vão para lerItensFocco. */
      for (const nome of wb.SheetNames) {
        const ws = wb.Sheets[nome];
        if (!ws) continue;
        const focco = lerItensFocco(XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null }));
        if (focco) {
          itensFocco = focco;
          break;
        }
      }

      /* Extrai dados por unidade (Guarda-Roupas, Complementos, Salas) da aba Resumo */
      const unidadesResumo = extrairUnidadesResumo(wb);
      if (unidadesResumo && unidadesResumo.length > 0) melhorUnidadesResumo = unidadesResumo;

      /* Extrai a ocupação do CD (posições livres/ocupadas) da aba Resumo */
      const ocupacao = extrairOcupacao(wb);
      if (ocupacao) melhorOcupacao = ocupacao;

      /* Procura a melhor aba Resumo — usa a com data mais recente.
         Se houver duas planilhas (antiga + nova), a mais recente vence.
         O Drive lista os arquivos em ordem (típicamente a mais recente por último
         quando há nomes sequenciais como "(58)" e "(59)"), então a última
         aba Resumo encontrada com a mesma data é a versão mais atual. */
      const resumo = extrairResumo(wb);
      if (resumo) {
        const mod = parseModificado(arq.modificado ?? "");
        if (!melhorResumo) {
          melhorResumo = resumo;
          melhorResumoMod = mod;
        } else {
          const recente = dataMaisRecente(resumo.data, melhorResumo.data);
          if (recente === resumo.data && resumo.data !== melhorResumo.data) {
            melhorResumo = resumo;
            melhorResumoMod = mod;
          } else if (resumo.data === melhorResumo.data) {
            melhorResumo = resumo;
            melhorResumoMod = mod;
          }
        }
      }

      /* Extrai carregamento por mês da aba CARREGADO */
      const cargMap = lerCarregadoMensal(wb);
      const cargAte = lerUltimaDataCarregado(wb);
      if (cargAte && (!carregadoAte || cargAte > carregadoAte)) carregadoAte = cargAte;
      if (cargMap && cargMap.size > 0) carregadoDriveMap = cargMap;

      /* Procura reserva em qualquer planilha */
      if (reservadoTon == null) {
        reservadoTon = extrairReservaTon(wb);
      }
      if (reservadoValor == null) {
        reservadoValor = extrairReservaValor(wb);
      }
    } catch (e) {
      console.error(`[auto-import] planilha ${arq.id} ignorada:`, (e as Error).message);
    }
  }

  /* Processa planilhas locais (public/planilhas/) além das do Drive.
     Processadas por último para que seus dados mais recentes prevaleçam. */
  for (const localPath of PLANILHAS_LOCAIS) {
    try {
      if (!existsSync(localPath)) continue;
      const buf = readFileSync(localPath);
      const wb = XLSX.read(buf, { type: "buffer" });

      const avariasRaw = lerAvarias(wb);
      if (avariasRaw.length > 0) listasAvarias.push(avariasRaw);

      /* Lê dados de "Em Linha × Fora de Linha" da planilha local — sem isso
         a pasta do Drive sem a planilha correspondente deixa o bloco fora
         do payload e o app cai no fallback estático (valores desatualizados). */
      const fdl = lerForaDeLinha(wb);
      if (fdl && !melhorForaDeLinha) melhorForaDeLinha = fdl;

      const itensEstoque = lerItensEstoque(wb);
      if (itensEstoque.length > (melhorItens?.length ?? 0)) melhorItens = itensEstoque;

      /* Lê a planilha de paletes (item → tamanho + und/palete) */
      const paletesMap = lerPaletes(wb);
      if (paletesMap.size > (melhorPaletes?.size ?? 0)) melhorPaletes = paletesMap;

      /* Resumo local só é usado se o Drive não encontrou nenhum resumo
         (fallback — o Drive é a fonte de dados principal e atualizada).
         Não define melhorResumoMod: o mtime do arquivo local é o momento do
         checkout (sempre "agora"), o que impediria o recálculo a partir dos
         itens atualizados do Drive. Sem ele, o fallback local fica sempre
         atrás dos itens do Drive, como esperado. */
      const resumo = extrairResumo(wb);
      if (resumo && !melhorResumo) {
        melhorResumo = resumo;
      }

      /* Cópias locais só servem de reserva — a pasta do Drive sempre vence. */
      const cargMap = lerCarregadoMensal(wb);
      const cargAte = lerUltimaDataCarregado(wb);
      if (cargAte && (!carregadoAte || cargAte > carregadoAte)) carregadoAte = cargAte;
      if (cargMap && cargMap.size > 0 && !carregadoDriveMap) carregadoDriveMap = cargMap;

      /* Extrai ocupação do CD do relatório WF0126 local — a planilha local
         de ocupação (ocupacao-cd.xlsx) é a fonte autoritativa quando existe,
         sobrescrevendo a ocupação do Drive. */
      const ocupacao = extrairOcupacao(wb);
      if (ocupacao) melhorOcupacao = ocupacao;
    } catch (e) {
      console.error(`[auto-import] planilha local ${localPath} ignorada:`, (e as Error).message);
    }
  }

  /* Processa a produção da semana agora que os itens de estoque estão disponíveis */
  let melhorProducao: ProducaoSemanalDia[] | null = null;
  if (wbProducao && melhorItens) {
    melhorProducao = calcularProducaoSemanal(wbProducao, melhorItens, melhorRecebidoPorDia);
  }

  /* Mescla as avarias de todas as planilhas (base histórica + lançamentos novos).
     Inclui a lista já gravada, para não perder o histórico (com custos) caso uma
     planilha antiga seja removida da pasta do Drive. */
  const anterior = await getLatestData() as Record<string, unknown> | null;
  const avariasAnteriores = anterior?.["avarias"] as Avaria[] | undefined;
  if (avariasAnteriores?.length) listasAvarias.push(avariasAnteriores);

  if (listasAvarias.length > 0) {
    const avarias = mesclarAvarias(listasAvarias);
    if (avarias.length > 0) {
      melhorAvarias = avarias;
      const resumoAvarias = calcularAvariasResumo(avarias, melhorItens ?? undefined);
      if (resumoAvarias) melhorAvariasResumo = resumoAvarias;
    }
  }

  /* Calcula quantos paletes existem no estoque por tamanho (P/M/G/GG),
     cruzando o saldo de cada item com a configuração de pallet. */
  let resumoPaletes: ReturnType<typeof calcularResumoPaletes> | null = null;
  let resumoPaletesFinal: (ReturnType<typeof calcularResumoPaletes> & {
    recebimento?: ReturnType<typeof calcularResumoPaletes>;
    diasRecebidos?: number;
    diasQtd?: NonNullable<ReturnType<typeof calcularRecebimento>>["diasQtd"];
    mensalQtd?: NonNullable<ReturnType<typeof calcularRecebimento>>["mensalQtd"];
    totalQtdRecebido?: number;
  }) | null = null;
  if (melhorItens && melhorPaletes && melhorPaletes.size > 0) {
    resumoPaletes = calcularResumoPaletes(melhorItens, melhorPaletes);
    console.info(
      `[auto-import] paletes: ${resumoPaletes.totalPaletes} paletes (${resumoPaletes.porTamanho.map((t) => `${t.tamanho}: ${t.paletes}`).join(", ")})`,
    );
    resumoPaletesFinal = { ...resumoPaletes };
    /* Paletes recebidos por tamanho — cruza QTD_RECEBIDA da Base Recebimento
       com a configuração de pallet de cada item. */
    if (melhorRecebimento?.recebimentoQtd?.length) {
      resumoPaletesFinal.recebimento = calcularResumoPaletes(melhorRecebimento.recebimentoQtd, melhorPaletes);
      resumoPaletesFinal.diasRecebidos = melhorRecebimento.diasRecebidos;
      /* QTD (volumes) recebida por dia e por mês — para o relatório
         Recebido × Estoque na seção de Paletes. */
      if (melhorRecebimento.diasQtd?.length) {
        resumoPaletesFinal.diasQtd = melhorRecebimento.diasQtd;
        resumoPaletesFinal.mensalQtd = melhorRecebimento.mensalQtd;
        resumoPaletesFinal.totalQtdRecebido = melhorRecebimento.totalQtdRecebido;
      }
    }
  }

  /* Fallback: se a leitura direta da aba de reservas não encontrou totais,
      usa os totais já calculados a partir dos itens reservados. */
  if (melhorReservados) {
    if (reservadoTon == null && melhorReservados.totalTon > 0) {
      reservadoTon = melhorReservados.totalTon;
    }
    if (reservadoValor == null && melhorReservados.totalValor > 0) {
      reservadoValor = melhorReservados.totalValor;
    }
  }

  /* Busca carregamento e recebimento por mês da planilha separada */
  let mensalData: { mes: string; recebido: number; carregado: number }[] | null = null;
  try {
    const carg = await buscarCarregamentoMensal();
    if (carg && carg.meses.length > 0) mensalData = carg.meses;
  } catch (e) {
    console.error("[auto-import] erro ao buscar carregamento mensal:", (e as Error).message);
  }

  /* Se encontrou carregamento na aba CARREGADO do arquivo do Drive,
      sobrescreve os valores de carregado (mais completos que a planilha externa). */
  if (mensalData && carregadoDriveMap) {
    mensalData = mensalData.map((m) => ({
      mes: m.mes,
      recebido: m.recebido,
      carregado: carregadoDriveMap.get(m.mes) ?? m.carregado,
    }));
  }

  /* Recebido por mês vem da Base Recebimento (Drive) — ano completo e sempre
     atualizado, em vez da planilha externa que só cobre poucos meses e lê a
     coluna errada. O carregado continua vindo da fonte de carregamento acima. */
  if (melhorRecebimento?.mensal?.length) {
    const carregadoPorMes = new Map<string, number>();
    for (const m of mensalData ?? []) carregadoPorMes.set(m.mes, m.carregado);
    mensalData = melhorRecebimento.mensal.map((m) => ({
      mes: m.mes,
      recebido: m.recebido,
      /* Meses sem dados no Drive (jan–abr) usam os valores da planilha
         "Toneladas Mensal" enviada pelo usuário. */
      carregado: carregadoDriveMap?.get(m.mes) ?? carregadoPorMes.get(m.mes) ?? CARREGADO_SEM_DRIVE[m.mes] ?? 0,
    }));
  }

  /* Quando o arquivo de itens (modelo sem aba Resumo) é mais recente que
     o arquivo que forneceu a aba Resumo, recalcula o resumo a partir dos
     itens — o novo formato deve prevalecer sobre a planilha antiga. */
  if (melhorResumo && melhorItens && melhorItens.length > 0 && melhorItensMod &&
      (!melhorResumoMod || melhorItensMod > melhorResumoMod)) {
    const r = resumoDeItens(melhorItens);
    if (r) {
      /* O modelo sem aba Resumo não traz a data no cabeçalho — usa a data de
         modificação do arquivo de itens como data-base do resumo. */
      const d = melhorItensMod;
      const dataItens = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      melhorResumo = { ...r.resumo, data: dataItens };
      melhorUnidadesResumo = r.unidades;
      console.info(`[auto-import] resumo recalculado a partir de ${melhorItens.length} itens (planilha mais recente)`);
    }
  }

  /* Fallback: quando a planilha não tem aba "Resumo" (modelo "ESTOQUE 001
     - POSIÇÃO DE ESTOQUE"), calcula o resumo a partir dos itens lidos. */
  if (!melhorResumo && melhorItens && melhorItens.length > 0) {
    const r = resumoDeItens(melhorItens);
    if (r) {
      melhorResumo = r.resumo;
      if (!melhorUnidadesResumo) melhorUnidadesResumo = r.unidades;
      console.info(`[auto-import] resumo calculado a partir de ${melhorItens.length} itens (sem aba Resumo)`);
    }
  }

  if (!melhorResumo) {
    console.warn("[auto-import] nenhuma aba Resumo válida encontrada");
    return false;
  }

  /* Recomputa o valor previsto total como a soma do previsto por unidade
     (toneladas × faturado por unidade) — mais preciso que tom × média e
     consistente com o detalhamento por unidade exibido no dashboard. */
  if (melhorUnidadesResumo && melhorUnidadesResumo.length > 0) {
    melhorResumo.previsto = melhorUnidadesResumo.reduce((s, u) => s + u.previsto, 0);
  }

  /* Recomputa o valor previsto da reserva por unidade. A planilha de
     reservas nem sempre traz a coluna de unidade, então monta um mapa
     código→unidade a partir da Base Estoque (que tem CLASSIFICAÇÃO N1)
     para classificar os itens reservados e aplicar o faturado por
     unidade em vez da média. */
  if (melhorItens && (melhorReservados || melhorSemReserva)) {
    const unidadePorCod = new Map<string, string>();
    for (const it of melhorItens) {
      const id = MAPA_UNIDADES[it.unidade.toUpperCase().trim()];
      if (id) unidadePorCod.set(it.item, id);
    }
    if (melhorReservados) {
      melhorReservados.previsao = calcularPrevisaoReservados(melhorReservados.itens, melhorReservados.totalTon, unidadePorCod);
    }
    if (melhorSemReserva) {
      melhorSemReserva.previsao = calcularPrevisaoReservados(melhorSemReserva.itens, melhorSemReserva.totalTon, unidadePorCod);
    }
  }

  /* Reconstrói os dados de Fora de Linha a partir dos itens mais recentes do
     Drive, mantendo a classificação em linha / fora de linha da última
     planilha "Em Linha × Fora de Linha". Isso garante que os valores (saldo,
     custo, valor) venham da planilha mais atual do Drive, não de uma
     planilha antiga com dados desatualizados. */
  if (melhorItens && melhorForaDeLinha && melhorForaDeLinha.itens.length > 0) {
    const foraDeLinhaItemSet = new Set(melhorForaDeLinha.itens.map(i => {
      const maskNum = i.mascara.match(/\((\d+)\)/)?.[1] ?? "";
      return `${i.item}|${maskNum}`;
    }));
    const reservadosMap = new Map<string, { qtd: number; custo: number; pesoBrt: number }>();
    if (melhorReservados) {
      for (const r of melhorReservados.itens) {
        const maskNum = r.mascara.match(/\((\d+)\)/)?.[1] ?? "";
        const entry = { qtd: r.qtdReservada, custo: r.custoMedio, pesoBrt: r.pesoBrt };
        reservadosMap.set(`${r.cod}|${maskNum}`, entry);
        if (!reservadosMap.has(r.cod)) reservadosMap.set(r.cod, entry);
      }
    }
    const rebuilt = rebuildForaDeLinhaFromItens(melhorItens, foraDeLinhaItemSet, reservadosMap);
    if (rebuilt) {
      melhorForaDeLinha = rebuilt;
      console.info(`[auto-import] Fora de Linha reconstruído a partir de ${melhorItens.length} itens do Drive (valores atualizados)`);
    }
  }

  /* Comparativo de saldo Full (posição de estoque) × Focco (relatório WF0112). */
  let saldoComparativo: SaldoComparativo | null = null;
  if (melhorItens && itensFocco) {
    saldoComparativo = calcularSaldoComparativo(
      melhorItens,
      itensFocco,
      melhorResumo.data || new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    );
    if (saldoComparativo) {
      console.info(
        `[auto-import] saldo Full × Focco: ${fmtInt(saldoComparativo.full.itens)} × ${fmtInt(saldoComparativo.focco.itens)} itens · ` +
          `acuracidade ${saldoComparativo.comparativo.pctAcuracia}% · só Focco ${fmtInt(saldoComparativo.alertas.soFocco)}`,
      );
    }
  }

  if (melhorOcupacao) {
    console.info(`[auto-import] ocupação: ${fmtInt(melhorOcupacao.ocupados)} ocupados, ${fmtInt(melhorOcupacao.livres)} livres, ${fmtInt(melhorOcupacao.bloqueados)} bloqueados, ${fmtInt(melhorOcupacao.total)} total (${(melhorOcupacao.pct * 100).toFixed(1)}%)`);
  } else {
    console.warn("[auto-import] ocupação: não encontrada em nenhuma planilha");
  }

  /* Recomputa KPIs e unidades a partir dos dados do Drive, substituindo
     os valores estáticos do initialSyncData pelos valores reais atualizados. */
  const existingForKpis = await getLatestData() as Record<string, unknown> | null;
  const kpisAtualizados = (existingForKpis?.["kpis"] as Record<string, unknown>[] | undefined) ?? [];
  const unidadesAtualizadas = (existingForKpis?.["unidades"] as Record<string, unknown>[] | undefined) ?? [];
  const kpisRecomputed = kpisAtualizados.length > 0 && melhorResumo
    ? recomputeKpis(kpisAtualizados, melhorResumo, melhorUnidadesResumo, melhorOcupacao)
    : kpisAtualizados;
  const unidadesRecomputed = unidadesAtualizadas.length > 0 && melhorUnidadesResumo
    ? recomputeUnidades(unidadesAtualizadas, melhorUnidadesResumo)
    : unidadesAtualizadas;

  /* Blocos de dados vindos do Drive que substituem os dados iniciais
     embutidos no app (avarias, pendências, reservas, recebimento e itens). */
  const extras: Record<string, unknown> = {
    ...(pendentesResumo ? { pendentesResumo } : {}),
    ...(melhorAvariasResumo ? { avariasResumo: melhorAvariasResumo } : {}),
    ...(mensalData ? { mensal: mensalData } : {}),
    ...(carregadoAte ? { carregadoAte } : {}),
    ...(melhorAvarias ? { avarias: melhorAvarias } : {}),
    ...(melhorPendentes ? { pendentes: melhorPendentes } : {}),
    ...(melhorReservados ? { reservados: melhorReservados.itens } : {}),
    ...(melhorItens ? { itens: melhorItens } : {}),
    ...(resumoPaletes ? { paletas: resumoPaletesFinal } : {}),
    ...((() => {
      if (!melhorRecebimento?.diasItemQtd?.length || !melhorPaletes || melhorPaletes.size === 0) return {};
      const nomes = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const recebimentoSemanal = melhorRecebimento.diasItemQtd.map((d) => {
        const itensEstoque = d.porItem.map(({ item, qtd }) => ({ item, saldo: qtd }));
        const resumo = calcularResumoPaletes(itensEstoque, melhorPaletes);
        const dia = melhorRecebimento.dias.find((x) => x.iso === d.iso);
        return {
          iso: d.iso,
          dia: dia?.dia ?? nomes[new Date(`${d.iso}T12:00:00Z`).getUTCDay()]!,
          data: dia?.data ?? `${d.iso.slice(8, 10)}/${d.iso.slice(5, 7)}/${d.iso.slice(2, 4)}`,
          ton: dia?.ton ?? 0,
          meta: 330,
          pctMeta: dia ? (dia.ton / 330) * 100 : 0,
          porTamanho: resumo.porTamanho,
          totalQtd: resumo.porTamanho.reduce((s, t) => s + t.und, 0),
          totalPaletes: resumo.totalPaletes,
        };
      });
      return { recebimentoSemanal };
    })()),
    ...(melhorRecebimento
      ? {
          dias: melhorRecebimento.dias,
          turnos: melhorRecebimento.turnos,
          recebimentoItens: melhorRecebimento.recebimentoItens,
        }
      : {}),
    ...(melhorProducao ? { producaoSemanal: melhorProducao } : {}),
    ...(kpisRecomputed.length > 0 ? { kpis: kpisRecomputed } : {}),
    ...(unidadesRecomputed.length > 0 ? { unidades: unidadesRecomputed } : {}),
    ...(() => {
      /* Importação manual (ferramenta Análise de estoque) prevalece até que
         o Drive traga uma planilha de fora de linha mais nova que ela. */
      const manual = existingForKpis?.["foraDeLinha"] as { importadoEm?: string } | undefined;
      const manualEm = manual?.importadoEm ? Date.parse(manual.importadoEm) : 0;
      if (manualEm && manualEm >= melhorFdlMod) return { foraDeLinha: manual };
      /* Se o Fora de Linha foi reconstruído a partir dos itens do Drive, os
         valores já estão corretos. Caso contrário (planilha antida sem
         custos), aplica os custos da planilha de reservas. */
      if (!melhorForaDeLinha) return {};
      const foiReconstruido = melhorItens && melhorForaDeLinha.itens.length > 0
        && melhorForaDeLinha.posicaoTotal.valorEstoque > 0
        && melhorItens.some(it => (it.valor > 0 || it.custo > 0));
      return { foraDeLinha: foiReconstruido ? melhorForaDeLinha : comCustos(melhorForaDeLinha, melhorReservados) };
    })(),
    ...(saldoComparativo ? { saldoComparativo } : {}),
    ...(melhorOcupacao ? { ocupacao: melhorOcupacao } : {}),
    ...(melhorOcupacao
      ? {
          ocupacaoDetalhes: (existingForKpis?.["ocupacaoDetalhes"] as Record<string, unknown>[] ?? []).map((d) =>
            d["atributo"] === "POSIÇÕES" ? { ...d, total: melhorOcupacao!.total } : d,
          ),
        }
      : {}),
  };

  /* Só grava um novo registro se os valores mudaram desde a última importação.
     Compara os campos principais — se nada mudou, não cria registro duplicado. */
  const historico = await getHistorico();
  const ultimo = historico[historico.length - 1];
  /* Compara apenas os valores centrais do estoque — reservadoTon/Valor
     podem flutuar conforme o parse da planilha encontra ou não a aba de
     reservas, e não devem gerar registros duplicados no histórico. */
  const mudou =
    !ultimo ||
    ultimo.ton !== melhorResumo.ton ||
    ultimo.valor !== melhorResumo.valor ||
    ultimo.saldo !== melhorResumo.saldo ||
    ultimo.itens !== melhorResumo.itens ||
    ultimo.previsto !== melhorResumo.previsto;

  if (!mudou) {
    console.info("[auto-import] sem mudanças no histórico — atualizando sync-store apenas");
    const existing2 = await getLatestData() as Record<string, unknown> | null;
    if (melhorReservados || Object.keys(extras).length > 0) {
      const reservadosResumo2 = melhorReservados ? resumirReservados(melhorReservados) : (existing2?.["reservadosResumo"] ?? undefined);
      const semReservaResumo2 = melhorSemReserva ? resumirReservados(melhorSemReserva) : (existing2?.["semReservaResumo"] ?? undefined);

      await setData({
        ...(existing2 ?? {}),
        ...(melhorResumo.data ? { atualizadoEm: melhorResumo.data } : {}),
        ...(reservadosResumo2 ? { reservadosResumo: reservadosResumo2 } : {}),
        ...(semReservaResumo2 ? { semReservaResumo: semReservaResumo2 } : {}),
        sincronizacao,
        ...extras,
      });
    }
    return false;
  }

  /* Salva no histórico apenas quando houve mudança real.
     Usa o horário de modificação do arquivo no Drive como timestamp
     (em vez do horário do servidor) para refletir quando o dado mudou. */
  await addRegistro({
    valor: melhorResumo.valor,
    previsto: melhorResumo.previsto,
    ton: melhorResumo.ton,
    saldo: melhorResumo.saldo,
    itens: melhorResumo.itens,
    ...(reservadoTon != null ? { reservadoTon } : {}),
    ...(reservadoValor != null ? { reservadoValor } : {}),
    ...(melhorResumo.data ? { data: melhorResumo.data } : {}),
  }, melhorResumoMod?.toISOString());

  /* Atualiza o sync-store com os dados do resumo e dos reservados.
     Se já houver dados completos do cliente (KPIs, unidades, etc.),
     preserva-os e apenas atualiza resumo + reservadosResumo. */
  const existing = await getLatestData() as Record<string, unknown> | null;

  if (melhorReservados) {
    const reservadosResumo = resumirReservados(melhorReservados);
    const semReservaResumo = melhorSemReserva ? resumirReservados(melhorSemReserva) : (existing?.["semReservaResumo"] ?? undefined);

    await setData({
      ...(existing ?? {}),
      atualizadoEm: melhorResumo.data,
      resumo: {
        valor: melhorResumo.valor,
        ton: melhorResumo.ton,
        saldo: melhorResumo.saldo,
        itens: melhorResumo.itens,
        previsto: melhorResumo.previsto,
      },
      reservadosResumo,
      ...(semReservaResumo ? { semReservaResumo } : {}),
      sincronizacao,
      ...extras,
    });
  } else {
    await setData({
      ...(existing ?? {}),
      atualizadoEm: melhorResumo.data,
      resumo: {
        valor: melhorResumo.valor,
        ton: melhorResumo.ton,
        saldo: melhorResumo.saldo,
        itens: melhorResumo.itens,
        previsto: melhorResumo.previsto,
      },
      sincronizacao,
      ...extras,
    });
  }

  console.info(
    `[auto-import] histórico salvo: ${melhorResumo.data} · ${melhorResumo.ton.toFixed(1)} t` +
    (reservadoTon != null ? ` · reserva ${reservadoTon.toFixed(1)} t` : "") +
    (reservadoValor != null ? ` · R$ ${reservadoValor.toFixed(0)}` : "") +
    (melhorReservados ? ` · ${melhorReservados.itens.length} itens reservados` : "") +
    (pendentesResumo ? ` · ${pendentesResumo.itens} pendências` : "") +
    (melhorAvariasResumo ? ` · ${melhorAvariasResumo.total} avarias` : "") +
    (mensalData ? ` · ${mensalData.length} meses carregamento` : ""),
  );
  return true;
}

/* Inicia o ciclo de importação automática no servidor.
   Roda imediatamente e a cada 5 minutos.
   Usa flag global para evitar duplicar o intervalo em HMR. */
declare global {
  // eslint-disable-next-line no-var
  var __driveAutoImportStarted: boolean | undefined;
}

export function iniciarAutoImport() {
  if (globalThis.__driveAutoImportStarted) return;
  globalThis.__driveAutoImportStarted = true;

  /* Primeira execução após 10s (deixa o servidor subir) */
  setTimeout(() => {
    importarSeMudou().catch((e) =>
      console.error("[auto-import] falha na execução inicial:", e),
    );
  }, 10_000);

  /* A cada 15 s — detecta mudanças no Drive o mais rápido possível */
  setInterval(() => {
    importarSeMudou().catch((e) =>
      console.error("[auto-import] falha no ciclo:", e),
    );
  }, 5 * 1000);

  console.info("[auto-import] ciclo de importação automática do Drive iniciado (a cada 5 s)");
}
