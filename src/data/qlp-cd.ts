/* QLP · CD Lopas — Quadro de Lotação de Pessoal, reorganizado por CLASSE.
   Extraído da planilha "CD - QLP.xlsx" (aba Base), atualizada em 07/10/2026.
   Cada classe reúne TODOS os registros classificados (ativos e status:
   ESTOQUE, CARREGAMENTO, LIDERANÇA, TREINAMENTO, AFASTAMENTO, TRANSFERENCIA
   e DESLIGAMENTO), não só os ativos. Dentro da classe, cada quadro é
   ordenado do maior para o menor. Grafias unificadas (ex.: EXPEDICAO =
   EXPEDIÇAO = Expedição). TEMPO da planilha está em anos (tempo de casa).
   "Sem turma" agrupa TURMA vazia ou de status (DEMITIDO/INSS/TRANSFERIDO).
   Os totais gerais (total/demitidos/afastados/transferidos) consideram todos
   os registros classificados. */

export type QlpLinha = { nome: string; pessoas: number };

export type QlpClasse = {
  nome: string;
  pessoas: number;
  /** tempo de casa médio, em anos */
  tempoMedio: number;
  turnos: QlpLinha[];
  turmas: QlpLinha[];
  cargos: QlpLinha[];
  funcoes: QlpLinha[];
  cidades: QlpLinha[];
  setores: QlpLinha[];
  tempoCasa: QlpLinha[];
};

export const QLP_CD = {
  atualizadoEm: "07/10/2026",
  total: 252,
  demitidos: 87,
  afastados: 7,
  transferidos: 10,
  classes: [
    {
      nome: "Desligamento",
      pessoas: 93,
      tempoMedio: 2.1,
      turnos: [
        { nome: "1º turno", pessoas: 86 },
        { nome: "2º turno", pessoas: 7 },
      ],
      turmas: [
        { nome: "Sem turma", pessoas: 93 },
      ],
      cargos: [
        { nome: "Auxiliar de Expedição", pessoas: 51 },
        { nome: "Expedidor", pessoas: 16 },
        { nome: "Conferente de Estoques", pessoas: 6 },
        { nome: "Arrumador de Caminhões", pessoas: 5 },
        { nome: "Auxiliar de Estoque", pessoas: 4 },
        { nome: "Conferente de Carga e Descarga", pessoas: 3 },
        { nome: "Etiquetador de Mercadoria", pessoas: 3 },
        { nome: "Operador de Empilhadeira", pessoas: 3 },
        { nome: "Supervisor de Expedição", pessoas: 2 },
      ],
      funcoes: [
        { nome: "Auxiliar de Expedição", pessoas: 48 },
        { nome: "Expedidor", pessoas: 18 },
        { nome: "Conferente de Estoques", pessoas: 6 },
        { nome: "Arrumador de Caminhões", pessoas: 5 },
        { nome: "Auxiliar de Estoque", pessoas: 4 },
        { nome: "Conferente de Carga e Descarga", pessoas: 3 },
        { nome: "Etiquetador de Mercadoria", pessoas: 3 },
        { nome: "Operador de Empilhadeira", pessoas: 3 },
        { nome: "Supervisor de Expedição", pessoas: 2 },
        { nome: "Expedidor-Carrega", pessoas: 1 },
      ],
      cidades: [
        { nome: "Cataguases", pessoas: 69 },
        { nome: "Rodeiro", pessoas: 6 },
        { nome: "Astolfo Dutra", pessoas: 5 },
        { nome: "Guarani", pessoas: 5 },
        { nome: "Piraúba", pessoas: 2 },
        { nome: "Ubá", pessoas: 2 },
        { nome: "Diamante", pessoas: 1 },
        { nome: "Divinésia", pessoas: 1 },
        { nome: "Dona Eusébia", pessoas: 1 },
        { nome: "Guidoval", pessoas: 1 },
      ],
      setores: [
        { nome: "CD-Centro Distribuição", pessoas: 70 },
        { nome: "Controle de Estoques", pessoas: 13 },
        { nome: "CD/Easy House", pessoas: 9 },
        { nome: "Recebimento Produtos", pessoas: 1 },
      ],
      tempoCasa: [
        { nome: "Até 1 ano", pessoas: 24 },
        { nome: "1 a 3 anos", pessoas: 58 },
        { nome: "3 a 5 anos", pessoas: 6 },
        { nome: "5 a 10 anos", pessoas: 4 },
        { nome: "10+ anos", pessoas: 1 },
      ],
    },
    {
      nome: "Carregamento",
      pessoas: 88,
      tempoMedio: 3.6,
      turnos: [
        { nome: "1º turno", pessoas: 56 },
        { nome: "2º turno", pessoas: 32 },
      ],
      turmas: [
        { nome: "Separação-CD1", pessoas: 14 },
        { nome: "Carregamento-Mateus", pessoas: 9 },
        { nome: "Separação-Anderson", pessoas: 8 },
        { nome: "Separação-Washin", pessoas: 7 },
        { nome: "Carregamento-Julio Cazal", pessoas: 6 },
        { nome: "Carregamento-Samuel", pessoas: 6 },
        { nome: "Carregamento-Zé Robin", pessoas: 6 },
        { nome: "Etiquetagem", pessoas: 6 },
        { nome: "Etiquetagem Noite", pessoas: 6 },
        { nome: "Separação-Ecommerce Noite", pessoas: 6 },
        { nome: "Carregamento-Easy House", pessoas: 5 },
        { nome: "Carregamento-Luciano", pessoas: 5 },
        { nome: "Separação-Ecommerce", pessoas: 4 },
      ],
      cargos: [
        { nome: "Auxiliar de Expedição", pessoas: 43 },
        { nome: "Expedidor", pessoas: 19 },
        { nome: "Conferente de Carga e Descarga", pessoas: 11 },
        { nome: "Etiquetador de Mercadoria", pessoas: 7 },
        { nome: "Arrumador de Caminhões", pessoas: 5 },
        { nome: "Auxiliar de Estoque", pessoas: 1 },
        { nome: "Líder de Expedição", pessoas: 1 },
        { nome: "Supervisor de Expedição", pessoas: 1 },
      ],
      funcoes: [
        { nome: "Expedidor", pessoas: 36 },
        { nome: "Auxiliar de Expedição", pessoas: 19 },
        { nome: "Etiquetador de Mercadoria", pessoas: 9 },
        { nome: "Conferente de Carga e Descarga", pessoas: 8 },
        { nome: "Expedidor-Carrega", pessoas: 6 },
        { nome: "Arrumador de Caminhões", pessoas: 5 },
        { nome: "Conferente de Separação", pessoas: 2 },
        { nome: "Líder de Expedição", pessoas: 2 },
        { nome: "Supervisor de Expedição", pessoas: 1 },
      ],
      cidades: [
        { nome: "Cataguases", pessoas: 60 },
        { nome: "Guarani", pessoas: 8 },
        { nome: "Divinésia", pessoas: 6 },
        { nome: "Astolfo Dutra", pessoas: 4 },
        { nome: "Rodeiro", pessoas: 3 },
        { nome: "Dona Eusébia", pessoas: 2 },
        { nome: "Piraúba", pessoas: 2 },
        { nome: "Ubá", pessoas: 2 },
        { nome: "Santana do Campestre", pessoas: 1 },
      ],
      setores: [
        { nome: "CD-Centro Distribuição", pessoas: 79 },
        { nome: "CD/Easy House", pessoas: 6 },
        { nome: "Controle de Estoques", pessoas: 3 },
      ],
      tempoCasa: [
        { nome: "Até 1 ano", pessoas: 36 },
        { nome: "1 a 3 anos", pessoas: 27 },
        { nome: "3 a 5 anos", pessoas: 8 },
        { nome: "5 a 10 anos", pessoas: 8 },
        { nome: "10+ anos", pessoas: 9 },
      ],
    },
    {
      nome: "Estoque",
      pessoas: 40,
      tempoMedio: 3.7,
      turnos: [
        { nome: "1º turno", pessoas: 25 },
        { nome: "2º turno", pessoas: 15 },
      ],
      turmas: [
        { nome: "Controle de Estoque", pessoas: 19 },
        { nome: "Estoque Noite", pessoas: 12 },
        { nome: "Recebimento Produtos", pessoas: 6 },
        { nome: "Recebimento Produtos Noite", pessoas: 3 },
      ],
      cargos: [
        { nome: "Conferente de Estoques", pessoas: 13 },
        { nome: "Operador de Empilhadeira I", pessoas: 5 },
        { nome: "Auxiliar de Estoque", pessoas: 4 },
        { nome: "Expedidor", pessoas: 4 },
        { nome: "Assistente de Estoques", pessoas: 3 },
        { nome: "Operador de Empilhadeira Ii", pessoas: 3 },
        { nome: "Operador de Empilhadeira Iii", pessoas: 3 },
        { nome: "Auxiliar de Expedição", pessoas: 2 },
        { nome: "Operador de Empilhadeira", pessoas: 2 },
        { nome: "Líder de Estoque", pessoas: 1 },
      ],
      funcoes: [
        { nome: "Conferente de Estoques", pessoas: 16 },
        { nome: "Operador de Empilhadeira", pessoas: 15 },
        { nome: "Auxiliar de Estoque", pessoas: 4 },
        { nome: "Assistente de Estoque", pessoas: 2 },
        { nome: "Assistente de Estoques", pessoas: 1 },
        { nome: "Expedidor", pessoas: 1 },
        { nome: "Líder de Estoque", pessoas: 1 },
      ],
      cidades: [
        { nome: "Cataguases", pessoas: 20 },
        { nome: "Guarani", pessoas: 6 },
        { nome: "Rodeiro", pessoas: 6 },
        { nome: "Piraúba", pessoas: 3 },
        { nome: "Astolfo Dutra", pessoas: 2 },
        { nome: "Ubá", pessoas: 2 },
        { nome: "Divinésia", pessoas: 1 },
      ],
      setores: [
        { nome: "Controle de Estoques", pessoas: 32 },
        { nome: "CD-Centro Distribuição", pessoas: 8 },
      ],
      tempoCasa: [
        { nome: "Até 1 ano", pessoas: 9 },
        { nome: "1 a 3 anos", pessoas: 17 },
        { nome: "3 a 5 anos", pessoas: 6 },
        { nome: "5 a 10 anos", pessoas: 3 },
        { nome: "10+ anos", pessoas: 5 },
      ],
    },
    {
      nome: "Transferência",
      pessoas: 9,
      tempoMedio: 2.7,
      turnos: [
        { nome: "1º turno", pessoas: 9 },
      ],
      turmas: [
        { nome: "Sem turma", pessoas: 9 },
      ],
      cargos: [
        { nome: "Expedidor", pessoas: 6 },
        { nome: "Auxiliar de Estoque", pessoas: 1 },
        { nome: "Auxiliar de Expedição", pessoas: 1 },
        { nome: "Líder de Estoque", pessoas: 1 },
      ],
      funcoes: [
        { nome: "Expedidor", pessoas: 6 },
        { nome: "Auxiliar de Estoque", pessoas: 1 },
        { nome: "Auxiliar de Expedição", pessoas: 1 },
        { nome: "Líder de Estoque", pessoas: 1 },
      ],
      cidades: [
        { nome: "Cataguases", pessoas: 5 },
        { nome: "Rodeiro", pessoas: 3 },
        { nome: "Divinésia", pessoas: 1 },
      ],
      setores: [
        { nome: "CD-Centro Distribuição", pessoas: 7 },
        { nome: "CD/Easy House", pessoas: 1 },
        { nome: "Controle de Estoques", pessoas: 1 },
      ],
      tempoCasa: [
        { nome: "Até 1 ano", pessoas: 0 },
        { nome: "1 a 3 anos", pessoas: 7 },
        { nome: "3 a 5 anos", pessoas: 1 },
        { nome: "5 a 10 anos", pessoas: 1 },
        { nome: "10+ anos", pessoas: 0 },
      ],
    },
    {
      nome: "Liderança",
      pessoas: 8,
      tempoMedio: 3,
      turnos: [
        { nome: "2º turno", pessoas: 5 },
        { nome: "1º turno", pessoas: 3 },
      ],
      turmas: [
        { nome: "Líder de Operação Turno 2", pessoas: 5 },
        { nome: "Líder de Operação", pessoas: 3 },
      ],
      cargos: [
        { nome: "Conferente de Carga e Descarga", pessoas: 1 },
        { nome: "Conferente de Estoques", pessoas: 1 },
        { nome: "Coordenador de Estoques", pessoas: 1 },
        { nome: "Coordenador de Expedição", pessoas: 1 },
        { nome: "Etiquetador de Mercadoria", pessoas: 1 },
        { nome: "Gerente de Expedição", pessoas: 1 },
        { nome: "Líder de Expedição", pessoas: 1 },
        { nome: "Supervisor de Expedição", pessoas: 1 },
      ],
      funcoes: [
        { nome: "Conferente de Separação", pessoas: 2 },
        { nome: "Supervisor de Expedição", pessoas: 2 },
        { nome: "Coordenador de Estoques", pessoas: 1 },
        { nome: "Coordenador de Expedição", pessoas: 1 },
        { nome: "Gerente de Expedição", pessoas: 1 },
        { nome: "Líder de Estoque", pessoas: 1 },
      ],
      cidades: [
        { nome: "Cataguases", pessoas: 5 },
        { nome: "Guarani", pessoas: 1 },
        { nome: "Rodeiro", pessoas: 1 },
        { nome: "Ubá", pessoas: 1 },
      ],
      setores: [
        { nome: "CD-Centro Distribuição", pessoas: 6 },
        { nome: "CD/Easy House", pessoas: 1 },
        { nome: "Controle de Estoques", pessoas: 1 },
      ],
      tempoCasa: [
        { nome: "Até 1 ano", pessoas: 2 },
        { nome: "1 a 3 anos", pessoas: 3 },
        { nome: "3 a 5 anos", pessoas: 2 },
        { nome: "5 a 10 anos", pessoas: 1 },
        { nome: "10+ anos", pessoas: 0 },
      ],
    },
    {
      nome: "Afastamento",
      pessoas: 7,
      tempoMedio: 10.7,
      turnos: [
        { nome: "1º turno", pessoas: 7 },
      ],
      turmas: [
        { nome: "Sem turma", pessoas: 7 },
      ],
      cargos: [
        { nome: "Auxiliar de Expedição", pessoas: 2 },
        { nome: "Auxiliar de Estoque", pessoas: 1 },
        { nome: "Carregador", pessoas: 1 },
        { nome: "Conferente de Estoques", pessoas: 1 },
        { nome: "Expedidor", pessoas: 1 },
        { nome: "Operador de Empilhadeira", pessoas: 1 },
      ],
      funcoes: [
        { nome: "Auxiliar de Expedição", pessoas: 3 },
        { nome: "Auxiliar de Estoque", pessoas: 1 },
        { nome: "Conferente de Estoques", pessoas: 1 },
        { nome: "Expedidor", pessoas: 1 },
        { nome: "Operador de Empilhadeira", pessoas: 1 },
      ],
      cidades: [
        { nome: "Cataguases", pessoas: 4 },
        { nome: "Dona Eusébia", pessoas: 1 },
        { nome: "Guarani", pessoas: 1 },
        { nome: "Rodeiro", pessoas: 1 },
      ],
      setores: [
        { nome: "CD-Centro Distribuição", pessoas: 4 },
        { nome: "Controle de Estoques", pessoas: 3 },
      ],
      tempoCasa: [
        { nome: "Até 1 ano", pessoas: 0 },
        { nome: "1 a 3 anos", pessoas: 3 },
        { nome: "3 a 5 anos", pessoas: 0 },
        { nome: "5 a 10 anos", pessoas: 0 },
        { nome: "10+ anos", pessoas: 4 },
      ],
    },
    {
      nome: "Treinamento",
      pessoas: 7,
      tempoMedio: 0.7,
      turnos: [
        { nome: "1º turno", pessoas: 7 },
      ],
      turmas: [
        { nome: "Manutenção", pessoas: 1 },
      ],
      cargos: [
        { nome: "Auxiliar de Expedição", pessoas: 6 },
        { nome: "Conferente de Estoques", pessoas: 1 },
      ],
      funcoes: [
        { nome: "Auxiliar de Expedição", pessoas: 5 },
        { nome: "Expedidor", pessoas: 2 },
      ],
      cidades: [
        { nome: "Cataguases", pessoas: 7 },
      ],
      setores: [
        { nome: "CD-Centro Distribuição", pessoas: 7 },
      ],
      tempoCasa: [
        { nome: "Até 1 ano", pessoas: 6 },
        { nome: "1 a 3 anos", pessoas: 1 },
        { nome: "3 a 5 anos", pessoas: 0 },
        { nome: "5 a 10 anos", pessoas: 0 },
        { nome: "10+ anos", pessoas: 0 },
      ],
    },
  ] as QlpClasse[],
};
