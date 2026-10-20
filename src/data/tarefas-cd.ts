/* Tarefas do CD — relatório "Manutenção de Tarefas do CD - WF0008" (WMS FullSoft),
   exportado em 20/10/2026 com o período 01/10/2026 a 19/10/2026 (coluna Data Tarefa).
   A aba `Resultado` traz uma linha por tarefa e é precedida por 3 linhas de título,
   legenda/cabeçalho (Tarefa, Tipo, Onda, Data Inicial, Data Final, Item, Origem,
   Destino, Qtd., Emb., Exec., Prio., Lib., Tar. Bloq., Prio. B., Bloqs., Pedido,
   Aut. Receb., Data Tarefa, Lote, Almoxarifado, Carga, Unitizador,
   ITELOG_ITEM_COD_ITEM, TARCD_COD_TAREFA_CD, Área Mov.) e termina com o rodapé
   "Copyright © FullSoft Mobile Solutions".

   REGRAS DE EXTRAÇÃO (usadas para gerar este arquivo):
   - ignorar o rodapé e as linhas de título (só linhas com Tarefa numérica);
   - `tarefas` = quantidade de linhas do tipo; `qtd` = soma da coluna `Qtd.`;
   - `naoExecutadas` = linhas com `Exec.` exatamente igual a 0 (tarefa não iniciada);
     `executadas` = todas as demais (o `Exec.` também conta execuções parciais,
     por isso não serve como contagem de tarefas e a coluna `Emb.` é ignorada —
     traz valores escalados (ex.: 1.120.000 para 112 volumes);
   - `bloqueadas` = linhas com `Bloqs.` > 0 (tarefa esperando outra tarefa);
   - `liberadas` = linhas com `Lib.` = "Sim".

   Os dados são ESTÁTICOS (o `drive-auto-import` não lê este relatório). Para
   atualizar: baixar o WF0008 mais recente e reextrair com um script Node usando o
   xlsx do container (`docker compose cp` do .xlsx e do script, depois
   `node /tmp/gen.mjs`) aplicando as regras acima, regravando este arquivo. */

export type TarefaCdTipo = {
  id: string;
  nome: string;
  /** rótulo curto do tipo, usado nos botões do toggle */
  curto: string;
  /** código do tipo de tarefa no WMS (o número entre parênteses do relatório) */
  codigo: number;
  cor: string;
  tarefas: number;
  qtd: number;
  executadas: number;
  naoExecutadas: number;
  bloqueadas: number;
  liberadas: number;
};

export type TarefaCdDia = {
  /** DD/MM/AAAA (Data Tarefa) */
  data: string;
  /** DD/MM — rótulo curto das barras */
  dia: string;
  tarefas: number;
  executadas: number;
  bloqueadas: number;
  qtd: number;
};

export const TAREFAS_CD = {
  atualizadoEm: "20/10/2026",
  fonte: "WF0008 · Manutenção de Tarefas do CD (FullSoft)",
  periodo: { inicial: "01/10/2026", final: "19/10/2026" },
  total: {
    tarefas: 86459,
    executadas: 84952,
    naoExecutadas: 1507,
    bloqueadas: 9110,
    liberadas: 326,
    qtd: 724303,
    ondas: 3181,
    pedidos: 3071,
    dias: 15,
  },
  tipos: [
    { id: "separacao-manual", nome: "Separação manual", curto: "Sep. manual", codigo: 4, cor: "#22c55e", tarefas: 41095, qtd: 177996, executadas: 41065, naoExecutadas: 30, bloqueadas: 8958, liberadas: 1 },
    { id: "conferencia", nome: "Conferência", curto: "Conferência", codigo: 10, cor: "#3b82f6", tarefas: 29593, qtd: 123020, executadas: 28126, naoExecutadas: 1467, bloqueadas: 0, liberadas: 324 },
    { id: "transferencia", nome: "Transferência", curto: "Transferência", codigo: 9, cor: "#f97316", tarefas: 6546, qtd: 144590, executadas: 6546, naoExecutadas: 0, bloqueadas: 0, liberadas: 0 },
    { id: "movimentacao-pulmao", nome: "Movimentação pulmão", curto: "Mov. pulmão", codigo: 2, cor: "#a855f7", tarefas: 5582, qtd: 131232, executadas: 5582, naoExecutadas: 0, bloqueadas: 0, liberadas: 0 },
    { id: "recebimento", nome: "Recebimento", curto: "Recebimento", codigo: 1, cor: "#14b8a6", tarefas: 2242, qtd: 131274, executadas: 2232, naoExecutadas: 10, bloqueadas: 0, liberadas: 1 },
    { id: "separacao-empilhadeira", nome: "Separação c/ empilhadeira", curto: "Sep. empilh.", codigo: 7, cor: "#eab308", tarefas: 1314, qtd: 15962, executadas: 1314, naoExecutadas: 0, bloqueadas: 152, liberadas: 0 },
    { id: "recebimento-devolucao", nome: "Receb. devolução", curto: "Rec. devol.", codigo: 25, cor: "#ec4899", tarefas: 68, qtd: 184, executadas: 68, naoExecutadas: 0, bloqueadas: 0, liberadas: 0 },
    { id: "guarda-devolucao", nome: "Guard. devolução", curto: "Guard. devol.", codigo: 26, cor: "#64748b", tarefas: 19, qtd: 45, executadas: 19, naoExecutadas: 0, bloqueadas: 0, liberadas: 0 },
  ] as TarefaCdTipo[],
  dias: [
    { data: "01/10/2026", dia: "01/10", tarefas: 6921, executadas: 6780, bloqueadas: 583, qtd: 51907 },
    { data: "02/10/2026", dia: "02/10", tarefas: 6581, executadas: 6461, bloqueadas: 625, qtd: 49184 },
    { data: "03/10/2026", dia: "03/10", tarefas: 713, executadas: 615, bloqueadas: 37, qtd: 3330 },
    { data: "05/10/2026", dia: "05/10", tarefas: 6356, executadas: 6275, bloqueadas: 709, qtd: 62975 },
    { data: "06/10/2026", dia: "06/10", tarefas: 6824, executadas: 6784, bloqueadas: 734, qtd: 64433 },
    { data: "07/10/2026", dia: "07/10", tarefas: 7397, executadas: 7318, bloqueadas: 700, qtd: 60963 },
    { data: "08/10/2026", dia: "08/10", tarefas: 6320, executadas: 6220, bloqueadas: 580, qtd: 57582 },
    { data: "09/10/2026", dia: "09/10", tarefas: 6678, executadas: 6437, bloqueadas: 660, qtd: 56987 },
    { data: "10/10/2026", dia: "10/10", tarefas: 574, executadas: 574, bloqueadas: 40, qtd: 4356 },
    { data: "13/10/2026", dia: "13/10", tarefas: 6500, executadas: 6441, bloqueadas: 783, qtd: 55802 },
    { data: "14/10/2026", dia: "14/10", tarefas: 7489, executadas: 7282, bloqueadas: 828, qtd: 63155 },
    { data: "15/10/2026", dia: "15/10", tarefas: 7815, executadas: 7737, bloqueadas: 923, qtd: 65030 },
    { data: "16/10/2026", dia: "16/10", tarefas: 8275, executadas: 8133, bloqueadas: 1082, qtd: 54851 },
    { data: "17/10/2026", dia: "17/10", tarefas: 1737, executadas: 1712, bloqueadas: 69, qtd: 23210 },
    { data: "19/10/2026", dia: "19/10", tarefas: 6279, executadas: 6183, bloqueadas: 757, qtd: 50538 },
  ] as TarefaCdDia[],
};

/** % de tarefas de cada tipo sobre o total do período. */
export function pctDoTipo(t: TarefaCdTipo): number {
  return TAREFAS_CD.total.tarefas > 0 ? (t.tarefas / TAREFAS_CD.total.tarefas) * 100 : 0;
}
