import type { VideoAvarias } from "@/components/VideoResumoDashboard";
import { imagemAvaria } from "@/data/avarias-imagens";

/* Matriz de Soma de Quantidade por Motivo conferida na tabela dinâmica
   oficial do usuário (3.312 volumes · jan–set 2026) — usada para o
   detalhamento por tipo e para o motivo predominante de cada mês.

   Totais por tipo (Soma de Quantidade):
     PREGO NO PALETE 1287 · DANIFICADO 773 · MOLHADO 580
     ESPELHO QUEBRADO 568 · ETIQUETA TROCADA 56 · SEPARAÇÃO 28
     EMPILHADEIRA 11 · CONFERENTE CARGA 9  → Total Geral 3.312

   A matriz confere com os totais por motivo e por mês da tabela dinâmica. */
const MESES_REF = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set"] as const;

const REFERENCIA: ReadonlyArray<readonly [string, ...readonly number[]]> = [
  //                   Jan  Fev  Mar  Abr  Mai  Jun  Jul  Ago  Set
  ["PREGO NO PALETE",  355, 114, 184, 138, 130, 71, 92, 79, 124],  // 1287
  ["DANIFICADO",       122, 112, 140, 82, 77, 54, 80, 63, 43],     // 773
  ["MOLHADO",          175, 237, 89, 20, 20, 1, 0, 21, 17],        // 580
  ["ESPELHO QUEBRADO",  53, 73, 81, 81, 102, 43, 71, 36, 28],      // 568
  ["ETIQUETA TROCADA",  52, 4, 0, 0, 0, 0, 0, 0, 0],               // 56
  ["SEPARAÇÃO",        13, 0, 0, 0, 9, 3, 1, 0, 2],                // 28
  ["EMPILHADEIRA",     0, 0, 0, 0, 0, 0, 0, 10, 1],                // 11
  ["CONFERENTE CARGA",  1, 0, 0, 0, 0, 0, 0, 2, 6],                // 9
] as const;

/* Total de Soma de Quantidade da matriz — base do % por tipo. */
const TOTAL_CONTAGEM_REF = REFERENCIA.reduce(
  (s, [, ...meses]) => s + meses.reduce((a, b) => a + b, 0),
  0,
);

/* Soma de Quantidade por mês — tabela dinâmica oficial do usuário
   (total geral 3.312 volumes avariados · jan–set 2026). */
const MESES_QTD_OFICIAL: readonly number[] = [771, 540, 494, 321, 338, 172, 244, 211, 221];
const TOTAL_QTD_OFICIAL = 3312;

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
