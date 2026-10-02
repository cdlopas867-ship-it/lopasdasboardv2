/* Gera o resumo de avarias (avariasResumo) a partir dos registros brutos,
   no formato esperado pelo VideoResumoDashboard / CenasApresentacao. */

import type { Avaria } from "./avarias";
import { ordemMes, ORDEM_MESES } from "./avarias";
import { fmtMoeda } from "./format";
import type { VideoAvarias, VideoAvariaTipo } from "@/components/VideoResumoDashboard";
import { imagemAvaria } from "@/data/avarias-imagens";
import type { ItemEstoque } from "./base-estoque";

const MESES_CURTO: Record<string, string> = {
  JANEIRO: "Jan", JANIERO: "Jan", FEVEREIRO: "Fev", "MARÇO": "Mar", MARCO: "Mar", ABRIL: "Abr",
  MAIO: "Mai", JUNHO: "Jun", JULHO: "Jul", AGOSTO: "Ago",
  SETEMBRO: "Set", OUTUBRO: "Out", NOVEMBRO: "Nov", DEZEMBRO: "Dez",
};

const CORES_AVARIA: Record<string, string> = {
  "PREGO NO PALETE": "#8B4513",
  "DANIFICADO": "#dc2626",
  "ESPELHO QUEBRADO": "#06b6d4",
  "MOLHADO": "#3b82f6",
  "EMPILHADEIRA": "#f97316",
  "SEPARAÇÃO": "#a855f7",
  "CONFERENTE CARGA": "#22c55e",
  "ETIQUETA TROCADA": "#eab308",
};

/* Constrói mapa item → { pesoUnit, custoUnit } a partir da base de estoque,
   para enriquecer as avarias com peso e custo quando não vierem da planilha. */
function mapEstoqueUnidades(itens: ItemEstoque[] | undefined): Map<string, { pesoUnit: number; custoUnit: number }> {
  const mapa = new Map<string, { peso: number; custo: number; saldo: number; n: number }>();
  if (!itens?.length) return new Map();
  for (const it of itens) {
    const atual = mapa.get(it.item) ?? { peso: 0, custo: 0, saldo: 0, n: 0 };
    atual.peso += it.peso;
    atual.custo += it.custo;
    atual.saldo += it.saldo;
    atual.n += 1;
    mapa.set(it.item, atual);
  }
  const result = new Map<string, { pesoUnit: number; custoUnit: number }>();
  for (const [item, v] of mapa) {
    result.set(item, {
      pesoUnit: v.saldo > 0 ? v.peso / v.saldo : 0,
      custoUnit: v.n > 0 ? v.custo / v.n : 0,
    });
  }
  return result;
}

export function calcularAvariasResumo(
  avarias: Avaria[] | undefined,
  estoqueItens?: ItemEstoque[],
): VideoAvarias {
  if (!avarias?.length) return null;

  const estoqueMap = mapEstoqueUnidades(estoqueItens);

  const validas = avarias.filter((a) => {
    const key = a.mes?.toUpperCase().trim();
    return key && key in MESES_CURTO;
  });
  if (!validas.length) return null;

  /* Agrupa por mês */
  const porMes = new Map<string, Avaria[]>();
  for (const a of validas) {
    const key = a.mes.toUpperCase().trim();
    if (!porMes.has(key)) porMes.set(key, []);
    porMes.get(key)!.push(a);
  }
  const mesesOrdenados = [...porMes.keys()].sort((a, b) => ordemMes(a) - ordemMes(b));

  /* A tabela dinâmica oficial usa SOMA DE QUANTIDADE (total 3.312 volumes),
     não contagem de linhas. Linhas sem motivo não entram na soma.
     Peso e custo são calculados a partir da base de estoque: pesoUnit × qtd
     para o peso de cada lançamento, e custoUnit (custo médio) para o custo. */
  const comMotivo = validas.filter((a) => a.motivo?.trim());
  const total = comMotivo.reduce((s, a) => s + a.quantidade, 0);

  /* Peso unitário por item a partir do estoque; fallback para o pesoTotal
     já existente na planilha de avarias quando o item não estiver no estoque. */
  const pesoDe = (a: Avaria): number => {
    const est = estoqueMap.get(a.item);
    if (est && est.pesoUnit > 0) return est.pesoUnit * a.quantidade;
    return a.pesoTotal;
  };
  /* Custo médio por item a partir do estoque; fallback para o custoMedio
     já existente na planilha de avarias quando o item não estiver no estoque. */
  const custoDe = (a: Avaria): number => {
    const est = estoqueMap.get(a.item);
    if (est && est.custoUnit > 0) return est.custoUnit * a.quantidade;
    return a.custo;
  };

  const custoTotal = validas.reduce((s, a) => s + custoDe(a), 0);

  const meses = mesesOrdenados.map((m) => {
    const items = porMes.get(m)!;
    const comMot = items.filter((a) => a.motivo?.trim());
    return {
      mes: MESES_CURTO[m] ?? m,
      qtd: comMot.reduce((s, a) => s + a.quantidade, 0),
      peso: comMot.reduce((s, a) => s + pesoDe(a), 0),
      ordem: ordemMes(m),
    };
  });

  /* motivoMes: motivo predominante de cada mês (por Soma de Quantidade) */
  const motivoMes = mesesOrdenados.map((m) => {
    const items = porMes.get(m)!;
    const motivosMap = new Map<string, number>();
    for (const a of items) {
      const mot = a.motivo?.trim();
      if (!mot) continue;
      motivosMap.set(mot, (motivosMap.get(mot) ?? 0) + a.quantidade);
    }
    const [motivo, qtd] = [...motivosMap.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
    return {
      mes: MESES_CURTO[m] ?? m,
      motivo,
      qtd,
    };
  });

  /* Tipos: Soma de Quantidade por motivo, como na tabela dinâmica oficial. */
  const motivosGlobais = new Map<string, number>();
  for (const a of validas) {
    const mot = a.motivo?.trim();
    if (!mot) continue;
    motivosGlobais.set(mot, (motivosGlobais.get(mot) ?? 0) + a.quantidade);
  }

  const tipos: VideoAvariaTipo[] = [...motivosGlobais.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([motivo, totalTipo]) => {
      const cor = CORES_AVARIA[motivo];
      const mesesTipo = mesesOrdenados.map((m) => {
        const items = porMes.get(m)!;
        const qtd = items
          .filter((a) => a.motivo?.trim() === motivo)
          .reduce((s, a) => s + a.quantidade, 0);
        return { mes: MESES_CURTO[m] ?? m, qtd };
      });
      return {
        tipo: motivo,
        imagem: imagemAvaria(motivo),
        cor: cor ?? "#6b7280",
        total: totalTipo,
        pct: total > 0 ? (totalTipo / total) * 100 : 0,
        meses: mesesTipo,
      };
    });

  return {
    total,
    custo: fmtMoeda(custoTotal),
    meses,
    motivoMes,
    tipos,
  };
}
