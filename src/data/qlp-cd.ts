/* QLP · CD Lopas — Quadro de Lotação de Pessoal.
   Extraído da planilha "CD - QLP.xlsx" (aba Base), atualizada em 07/10/2026.
   Todas as listas por turno contam apenas colaboradores ATIVOS (CONTADOR = 1),
   ordenadas da maior para a menor. Grafias da planilha foram unificadas
   (ex.: EXPEDICAO/EXPEDIÇAO). TEMPO da planilha está em anos (tempo de casa).
   "Sem turma" = ativos com a coluna TURMA vazia ou marcada como DEMITIDO.
   Os totais gerais (total/demitidos/afastados/transferidos) consideram todas
   as linhas com nome. */

export type QlpLinha = { nome: string; pessoas: number };

export type QlpTurno = {
  nome: string;
  pessoas: number;
  /** tempo de casa médio, em anos */
  tempoMedio: number;
  turmas: QlpLinha[];
  cargos: QlpLinha[];
  funcoes: QlpLinha[];
  cidades: QlpLinha[];
  setores: QlpLinha[];
  tempoCasa: QlpLinha[];
};

export const QLP_CD = {
  atualizadoEm: "07/10/2026",
  total: 254,
  ativos: 144,
  demitidos: 87,
  afastados: 7,
  transferidos: 10,
  turnos: [
    {
      nome: "1º turno",
      pessoas: 90,
      tempoMedio: 4.5,
      turmas: [
        { nome: "Controle de Estoque", pessoas: 19 },
        { nome: "Carregamento-Mateus", pessoas: 9 },
        { nome: "Separação-Anderson", pessoas: 8 },
        { nome: "Separação-Washin", pessoas: 7 },
        { nome: "Carregamento-Julio Cazal", pessoas: 6 },
        { nome: "Carregamento-Samuel", pessoas: 6 },
        { nome: "Etiquetagem", pessoas: 6 },
        { nome: "Recebimento Produtos", pessoas: 6 },
        { nome: "Sem turma", pessoas: 6 },
        { nome: "Carregamento-Easy House", pessoas: 5 },
        { nome: "Carregamento-Luciano", pessoas: 5 },
        { nome: "Separação-Ecommerce", pessoas: 4 },
        { nome: "Líder de Operação", pessoas: 3 },
      ],
      cargos: [
        { nome: "Auxiliar de Expedição", pessoas: 25 },
        { nome: "Expedidor", pessoas: 16 },
        { nome: "Conferente de Carga e Descarga", pessoas: 11 },
        { nome: "Conferente de Estoques", pessoas: 10 },
        { nome: "Etiquetador de Mercadoria", pessoas: 5 },
        { nome: "Arrumador de Caminhões", pessoas: 4 },
        { nome: "Auxiliar de Estoque", pessoas: 3 },
        { nome: "Operador de Empilhadeira III", pessoas: 3 },
        { nome: "Assistente de Estoques", pessoas: 2 },
        { nome: "Operador de Empilhadeira I", pessoas: 2 },
        { nome: "Operador de Empilhadeira II", pessoas: 2 },
        { nome: "Supervisor de Expedição", pessoas: 2 },
        { nome: "Coordenador de Estoques", pessoas: 1 },
        { nome: "Gerente de Expedição", pessoas: 1 },
        { nome: "Líder de Estoque", pessoas: 1 },
        { nome: "Líder de Expedição", pessoas: 1 },
        { nome: "Operador de Empilhadeira", pessoas: 1 },
      ],
      funcoes: [
        { nome: "Expedidor", pessoas: 27 },
        { nome: "Auxiliar de Expedição", pessoas: 16 },
        { nome: "Conferente de Estoques", pessoas: 10 },
        { nome: "Operador de Empilhadeira", pessoas: 8 },
        { nome: "Conferente de Carga e Descarga", pessoas: 7 },
        { nome: "Arrumador de Caminhões", pessoas: 4 },
        { nome: "Etiquetador de Mercadoria", pessoas: 4 },
        { nome: "Auxiliar de Estoque", pessoas: 3 },
        { nome: "Assistente de Estoque", pessoas: 2 },
        { nome: "Conferente de Separação", pessoas: 2 },
        { nome: "Líder de Expedição", pessoas: 2 },
        { nome: "Supervisor de Expedição", pessoas: 2 },
        { nome: "Coordenador de Estoques", pessoas: 1 },
        { nome: "Gerente de Expedição", pessoas: 1 },
        { nome: "Líder de Estoque", pessoas: 1 },
      ],
      cidades: [
        { nome: "Cataguases", pessoas: 47 },
        { nome: "Guarani", pessoas: 14 },
        { nome: "Divinésia", pessoas: 7 },
        { nome: "Rodeiro", pessoas: 6 },
        { nome: "Piraúba", pessoas: 5 },
        { nome: "Ubá", pessoas: 5 },
        { nome: "Astolfo Dutra", pessoas: 3 },
        { nome: "Dona Eusébia", pessoas: 2 },
        { nome: "Santana do Campestre", pessoas: 1 },
      ],
      setores: [
        { nome: "CD-Centro Distribuição", pessoas: 63 },
        { nome: "Controle de Estoques", pessoas: 22 },
        { nome: "CD/Easy House", pessoas: 5 },
      ],
      tempoCasa: [
        { nome: "Até 1 ano", pessoas: 29 },
        { nome: "1 a 3 anos", pessoas: 26 },
        { nome: "3 a 5 anos", pessoas: 12 },
        { nome: "5 a 10 anos", pessoas: 9 },
        { nome: "10+ anos", pessoas: 14 },
      ],
    },
    {
      nome: "2º turno",
      pessoas: 54,
      tempoMedio: 1.7,
      turmas: [
        { nome: "Separação-CD1", pessoas: 13 },
        { nome: "Estoque Noite", pessoas: 11 },
        { nome: "Etiquetagem Noite", pessoas: 6 },
        { nome: "Sem turma", pessoas: 6 },
        { nome: "Separação-Ecommerce Noite", pessoas: 6 },
        { nome: "Líder de Operação Turno 2", pessoas: 5 },
        { nome: "Carregamento-Zé Robin", pessoas: 4 },
        { nome: "Recebimento Produtos Noite", pessoas: 3 },
      ],
      cargos: [
        { nome: "Auxiliar de Expedição", pessoas: 28 },
        { nome: "Expedidor", pessoas: 7 },
        { nome: "Conferente de Estoques", pessoas: 4 },
        { nome: "Etiquetador de Mercadoria", pessoas: 3 },
        { nome: "Operador de Empilhadeira I", pessoas: 3 },
        { nome: "Conferente de Carga e Descarga", pessoas: 2 },
        { nome: "Arrumador de Caminhões", pessoas: 1 },
        { nome: "Assistente de Estoques", pessoas: 1 },
        { nome: "Auxiliar de Estoque", pessoas: 1 },
        { nome: "Coordenador de Expedição", pessoas: 1 },
        { nome: "Líder de Expedição", pessoas: 1 },
        { nome: "Operador de Empilhadeira", pessoas: 1 },
        { nome: "Operador de Empilhadeira II", pessoas: 1 },
      ],
      funcoes: [
        { nome: "Expedidor", pessoas: 13 },
        { nome: "Auxiliar de Expedição", pessoas: 9 },
        { nome: "Operador de Empilhadeira", pessoas: 7 },
        { nome: "Conferente de Estoques", pessoas: 5 },
        { nome: "Etiquetador de Mercadoria", pessoas: 5 },
        { nome: "Expedidor-Carrega", pessoas: 5 },
        { nome: "Conferente de Carga e Descarga", pessoas: 2 },
        { nome: "Conferente de Separação", pessoas: 2 },
        { nome: "Arrumador de Caminhões", pessoas: 1 },
        { nome: "Assistente de Estoques", pessoas: 1 },
        { nome: "Auxiliar de Estoque", pessoas: 1 },
        { nome: "Coordenador de Expedição", pessoas: 1 },
        { nome: "Líder de Estoque", pessoas: 1 },
        { nome: "Supervisor de Expedição", pessoas: 1 },
      ],
      cidades: [
        { nome: "Cataguases", pessoas: 47 },
        { nome: "Rodeiro", pessoas: 4 },
        { nome: "Astolfo Dutra", pessoas: 2 },
        { nome: "Guarani", pessoas: 1 },
      ],
      setores: [
        { nome: "CD-Centro Distribuição", pessoas: 38 },
        { nome: "Controle de Estoques", pessoas: 13 },
        { nome: "CD/Easy House", pessoas: 3 },
      ],
      tempoCasa: [
        { nome: "Até 1 ano", pessoas: 24 },
        { nome: "1 a 3 anos", pessoas: 23 },
        { nome: "3 a 5 anos", pessoas: 4 },
        { nome: "5 a 10 anos", pessoas: 3 },
        { nome: "10+ anos", pessoas: 0 },
      ],
    },
  ] as QlpTurno[],
};
