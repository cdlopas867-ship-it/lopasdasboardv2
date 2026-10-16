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
import { lerItensFull, lerPesosPosicao, calcularSaldoComparativo } from "./saldo-comparativo-import";

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
  const lovableKey = process.env["LOVABLE_API_KEY"] || process.env["LOVABLE_KEY"];
  const driveKey = process.env["GOOGLE_DRIVE_API_KEY"] || process.env["GOOGLE_DRIVE_KEY"];
  if (!lovableKey || !driveKey) return null;
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": driveKey,
  };
}

/* Se true, autoriza o fallback público ao tentar ler a pasta do Drive.
   Por padrão, esse fallback é DESABILITADO em produção — defina
   ALLOW_PUBLIC_DRIVE_FALLBACK=true em ambientes onde a pasta é pública
   e não há gateway configurado. */
const ALLOW_PUBLIC_DRIVE_FALLBACK = String(process.env["ALLOW_PUBLIC_DRIVE_FALLBACK"] ?? "false").toLowerCase() === "true";

function hasGatewayAccess(): boolean {
  return gatewayHeaders() !== null;
}

/* Converte o horário de modificação exibido pelo Drive em um objeto Date.
   Formatos do Drive: "11:25 am" (hoje), "Sep 22" (data sem hora),
   "Sep 22, 2025" (data com ano). Assume o fuso do servidor (TZ=America/Sao_Paulo). */
function parseModificado(mod: string): Date | undefined {
  if (!mod) return undefined;
  // ISO 8601 — formato retornado pela API do Google Drive (gateway), (ex: "2026-09-22T11:25:00.000Z").
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

  // Se não há headers e o fallback público está desabilitado, aborta com erro claro.
  if (!headers && !ALLOW_PUBLIC_DRIVE_FALLBACK) {
    throw new Error(
      "Drive gateway credentials not available and public fallback disabled. " +
      "Set LOVABLE_API_KEY and GOOGLE_DRIVE_API_KEY in your environment, or enable ALLOW_PUBLIC_DRIVE_FALLBACK=true if the folder is public.",
    );
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

  // Se não há headers e o fallback público está desabilitado, aborta com erro claro.
  if (!headers && !ALLOW_PUBLIC_DRIVE_FALLBACK) {
    throw new Error(
      "Drive gateway credentials not available and public fallback disabled. " +
      "Set LOVABLE_API_KEY and GOOGLE_DRIVE_API_KEY in your environment, or enable ALLOW_PUBLIC_DRIVE_FALLBACK=true if the folder is public.",
    );
  }

  const urls = [
    `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx&_= ${Date.now()}`,
    `https://drive.google.com/uc?export=download&confirm=t&id=${id}&_= ${Date.now()}`,
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

/* ... o restante do arquivo permanece igual ... */
