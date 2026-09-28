import type { VideoAvarias } from "@/components/VideoResumoDashboard";
import { imagemAvaria } from "@/data/avarias-imagens";

/* Matriz de contagem de Motivo conferida na tabela dinâmica oficial do
   usuário (2.324 ocorrências · jan–set 2026) — usada para o detalhamento
   por tipo e para o motivo predominante de cada mês.

   Fontes da matriz:
   - Jan: detalhe por motivo da tabela dinâmica (365).
   - Fev–Ago: lançamentos das planilhas do Drive (batem exatamente com os
     totais mensais da tabela: 336, 370, 270, 292, 149, 212, 173).
   - Set: resto aritmético da tabela (157 no mês) — total por motivo menos
     jan (tabela) e fev–ago (planilhas).
   A matriz confere com os totais por motivo e por mês da tabela dinâmica. */
const MESES_REF = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set"] as const;

const REFERENCIA: ReadonlyArray<readonly [string, ...readonly number[]]> = [
  //                Jan  Fev  Mar  Abr  Mai  Jun  Jul  Ago  Set
  ["PREGO NO PALETE", 189, 97, 143, 113, 119, 56, 82, 74, 92], // 965
  ["DANIFICADO",       79, 101, 113, 75, 70, 52, 73, 53, 32], // 648
  ["ESPELHO QUEBRADO", 46, 52, 60, 70, 85, 37, 56, 30, 17], // 453
  ["MOLHADO",          36, 85, 54, 12, 9, 1, 0, 6, 10], // 213
  ["SEPARAÇÃO",        10, 0, 0, 0, 9, 3, 1, 0, 1], // 24
  ["EMPILHADEIRA",     0, 0, 0, 0, 0, 0, 0, 8, 1], // 9
  ["CONFERENTE CARGA", 1, 0, 0, 0, 0, 0, 0, 2, 4], // 7
  ["ETIQUETA TROCADA", 4, 1, 0, 0, 0, 0, 0, 0, 0], // 5
] as const;

/* Total de contagem (ocorrências) da matriz — base do % por tipo. */
const TOTAL_CONTAGEM_REF = REFERENCIA.reduce(
  (s, [, ...meses]) => s + meses.reduce((a, b) => a + b, 0),
  0,
);

/* Soma de Quantidade por mês — tabela dinâmica oficial do usuário
   (total geral 3.276 volumes avariados · jan–set 2026). */
const MESES_QTD_OFICIAL: readonly number[] = [771, 540, 494, 321, 338, 172, 244, 211, 185];
const TOTAL_QTD_OFICIAL = 3276;

export function aplicarReferenciaMotivos(avarias: VideoAvarias): VideoAvarias {
  if (!avarias || avarias.total >= TOTAL_QTD_OFICIAL) return avarias;

  /* Totais por mês — Soma de Quantidade da tabela oficial */
  const meses = MESES_REF.map((mes, i) => ({
    mes,
    qtd: MESES_QTD_OFICIAL[i]!,
    ordem: i + 1,
  }));

  /* Motivo predominante de cada mês (maior contagem) */
  const motivoMes = MESES_REF.map((mes, i) => {
    const [motivo, qtd] = REFERENCIA.reduce(
      ([bM, bQ], [tipo, ...ms]) => (ms[i]! > bQ ? [tipo, ms[i]!] : [bM, bQ]),
      ["", 0] as [string, number],
    );
    return { mes, motivo, qtd };
  });

  return {
    ...avarias,
    total: TOTAL_QTD_OFICIAL,
    referenciaParcial: true,
    meses,
    motivoMes,
    tipos: REFERENCIA.map(([tipo, ...ms]) => {
      const anterior = avarias.tipos?.find((t) => t.tipo === tipo);
      const total = ms.reduce((a, b) => a + b, 0);
      return {
        tipo,
        imagem: anterior?.imagem ?? imagemAvaria(tipo),
        cor: anterior?.cor ?? "#6b7280",
        total,
        pct: (total / TOTAL_CONTAGEM_REF) * 100,
        meses: MESES_REF.map((mes, i) => ({ mes, qtd: ms[i]! })),
      };
    }),
  };
}
