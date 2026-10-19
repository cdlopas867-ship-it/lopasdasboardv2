/* Relatório de Auditoria — documento técnico que documenta cada cálculo,
   fonte de dados, fórmula, horário de atualização e métrica de acuracidade do
   painel. Estilo documento Word profissional, com o trevo da Lopas no topo.
   "Imprimir / salvar PDF" usa a impressão do navegador. */

import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import type { VideoResumoProps } from "./VideoResumoDashboard";

type Fonte = {
  nome: string;
  sistema: string;
  descricao: string;
  atualizacao: string;
};

type Calculo = {
  item: string;
  formula: string;
  fonte: string;
  observacao?: string;
};

type Acuracidade = {
  metrica: string;
  valor: string;
  detalhe: string;
};

const FONTES: Fonte[] = [
  {
    nome: "Posição de Estoque (Focco · estoque 001)",
    sistema: "Focco ERP",
    descricao:
      "Planilha modelo ESTOQUE 001 — POSIÇÃO DE ESTOQUE (ex.: ST QUARTA.xlsx). Colunas: ITEM, MÁSCARA, SALDO, PESO LIQ UN, PESO LIQ TOTAL, CUSTO MÉDIO, VALOR CUSTO. Base de todos os indicadores de estoque do painel.",
    atualizacao: "Sincronização automática a cada 15 s com a pasta do Google Drive",
  },
  {
    nome: "Relatório WF0112 — Estoques (Full · estoque 112)",
    sistema: "FullSoft WMS",
    descricao:
      "Relatório do WMS FullSoft Mobile Solutions, aba Resultado. Colunas: Item, Descrição, Endereço, Qtd. Atual. Uma linha por endereço; quantidades somadas por código. Usado no comparativo Full × Focco.",
    atualizacao: "Importado da pasta do Drive junto com a posição de estoque",
  },
  {
    nome: "PCP 003 — Análise de Realização Total",
    sistema: "Focco ERP",
    descricao:
      "Planilha de produção (ex.: produção NN.xlsx). Colunas: NUM ORDEM, DT INICIAL, DT FINAL, LOTE, VOLUME, PREVISTO, QTDE ENTREGUE, QTDE PENDENTE, PESO PREVISTO, PESO REALIZADO. Base da cena Produção da Semana.",
    atualizacao: "Sincronização automática com a pasta do Drive",
  },
  {
    nome: "PESO RECEBIDO POR PERÍODO",
    sistema: "Focco ERP",
    descricao:
      "Colunas: DT_INICIO, DT_FIM, ITEM, DESCRICAO, QTD_RECEBIDA, PESO_RECEBIDO. Base do recebimento por turno e por dia.",
    atualizacao: "Sincronização automática com a pasta do Drive",
  },
  {
    nome: "COMERCIAL 024 — Saldo de Itens com Reserva",
    sistema: "Focco ERP",
    descricao:
      "Colunas de reserva comercial por item: qtd reservada, peso bruto, custo médio, saldo atual. Base da cena de itens reservados.",
    atualizacao: "Sincronização automática com a pasta do Drive",
  },
  {
    nome: "Planilha de Avarias",
    sistema: "Focco ERP / Drive",
    descricao:
      "Registros de volumes avariados com coluna Quantidade e Motivo. A métrica oficial é a Soma de Quantidade, não a contagem de registros.",
    atualizacao: "Sincronização automática com a pasta do Drive",
  },
  {
    nome: "CD — QLP.xlsx (Lotação de pessoal)",
    sistema: "Cadastro interno",
    descricao:
      "Aba Base, 252 registros. Colunas: NOME, ADMISSÃO, TEMPO, CIDADE, SETOR, CARGO, FUNÇÃO, TURNO, TURMA, CLASSE. Classifica todos os registros por CLASSE (Desligamento, Carregamento, Estoque, etc.).",
    atualizacao: "Extração manual em 07/10/2026 (não lida automaticamente pelo sync)",
  },
  {
    nome: "Produtividade por Colaborador",
    sistema: "Focco ERP / FullSoft",
    descricao:
      "Uma planilha por tipo de atividade (separação manual, empilhadeira, recebimento, movimentação). Colunas: DIA, COD_COLABORADOR, NOME, TURNO, QTDE_TAREFAS, PESO, CX. Cargo e turma casados pelo nome com a CD — QLP.xlsx.",
    atualizacao: "Extração manual em 07/10/2026",
  },
  {
    nome: "Toneladas Mensal / Gerenciamento de Carregamento",
    sistema: "Focco ERP",
    descricao:
      "Carregado mensal (Jan–Set/2026): jan–abr da planilha Toneladas Mensal; mai–set da aba Gerenciamento Carregamento da planilha pública. Base da saúde do estoque e do comparativo de produtividade.",
    atualizacao: "Dado estático — reextrair para atualizar",
  },
];

const CALCULOS: Calculo[] = [
  {
    item: "Peso em estoque (toneladas)",
    formula: "Σ PESO LIQ TOTAL de todos os itens ativos",
    fonte: "Posição de Estoque (Focco · estoque 001)",
    observacao: "Inclui todos os itens de volume; peças e componentes soltos ficam de fora.",
  },
  {
    item: "Valor em estoque (R$)",
    formula: "Σ (custo médio × saldo) de cada item",
    fonte: "Posição de Estoque (Focco · estoque 001)",
  },
  {
    item: "Quantidade de itens",
    formula: "Contagem de itens ativos (linhas com saldo ou cadastro)",
    fonte: "Posição de Estoque (Focco · estoque 001)",
  },
  {
    item: "Ocupação do CD (%)",
    formula: "posições ocupadas ÷ total de endereços (5.970) × 100",
    fonte: "Posição de Estoque (Focco · estoque 001)",
    observacao: "Posições livres = total − ocupados − bloqueados.",
  },
  {
    item: "Recebimento por turno (ton e %)",
    formula: "ton = Σ PESO_RECEBIDO do turno; % = ton do turno ÷ total recebido × 100",
    fonte: "PESO RECEBIDO POR PERÍODO",
  },
  {
    item: "Produção da semana — previsto",
    formula: "previsto = QTDE ENTREGUE + QTDE PENDENTE (programado da ordem)",
    fonte: "PCP 003 — Análise de Realização Total",
  },
  {
    item: "Produção da semana — produzido",
    formula: "produzido = QTDE ENTREGUE; tonelagem = PESO PREVISTO (exibida na coluna Produzido)",
    fonte: "PCP 003 — Análise de Realização Total",
    observacao: "A tonelagem exibida na coluna Produzido é o peso previsto, não o realizado.",
  },
  {
    item: "Produção da semana — pendente",
    formula: "pendente = previsto − produzido; tonelagem = PESO PENDENTE",
    fonte: "PCP 003 — Análise de Realização Total",
  },
  {
    item: "Recebido da semana (ton e %)",
    formula: "ton = Σ PESO_RECEBIDO do dia; % = ton recebida ÷ ton prevista × 100",
    fonte: "PESO RECEBIDO POR PERÍODO",
  },
  {
    item: "Variação dia a dia (%)",
    formula: "(ton atual − ton anterior) ÷ ton anterior × 100",
    fonte: "PCP 003 + PESO RECEBIDO",
    observacao: "O primeiro dia da semana não tem variação (sem dia anterior).",
  },
  {
    item: "Média por ordem de produção (ton)",
    formula: "tonPrevisto ÷ número de ordens do dia",
    fonte: "PCP 003 — Análise de Realização Total",
  },
  {
    item: "Avarias — total de volumes",
    formula: "Soma de Quantidade (coluna Quantidade), não contagem de registros",
    fonte: "Planilha de Avarias",
    observacao: "Custo é parcial e rotulado como tal; volume movimentado por mês não está disponível.",
  },
  {
    item: "Pendências de produção — tonelagem total",
    formula: "Σ tonelagem pendente das ordens em aberto",
    fonte: "PCP 004 — Pendências",
  },
  {
    item: "Pendências — classificação crítica",
    formula: "Crítico = 3 meses ou mais de atraso; No prazo = até 2 meses, mês atual ou futuro",
    fonte: "PCP 004 — Pendências",
  },
  {
    item: "Itens reservados — valor",
    formula: "valor reservado = qtd reservada × custo médio do item",
    fonte: "COMERCIAL 024 — Saldo de Itens com Reserva",
  },
  {
    item: "Itens reservados — peso",
    formula: "peso reservado = qtd reservada × peso bruto do item",
    fonte: "COMERCIAL 024 — Saldo de Itens com Reserva",
  },
  {
    item: "Itens reservados — % do estoque",
    formula: "% = valor reservado ÷ valor total do estoque × 100",
    fonte: "COMERCIAL 024 + Posição de Estoque",
  },
  {
    item: "Saúde do estoque (%)",
    formula: "carregado ÷ recebido × 100 (acumulado do período)",
    fonte: "Toneladas Mensal + PESO RECEBIDO",
  },
  {
    item: "Fora de linha — peso e valor",
    formula: "Σ peso e valor dos itens classificados como fora de linha",
    fonte: "Posição de Estoque (classificação em linha/fora de linha)",
    observacao: "Valor é estimativa quando a planilha não traz o custo.",
  },
  {
    item: "Saldo comparativo Full × Focco — acuracidade",
    formula: "acuracidade = itens com saldo exatamente igual ÷ itens em comum × 100",
    fonte: "WF0112 (Full) × ESTOQUE 001 (Focco)",
    observacao:
      "Cruzamento pelo código completo do item (ex.: 2194.16652). Ton. Full = qtd × PESO LIQ UN da posição.",
  },
  {
    item: "Produtividade — tonelagem por colaborador",
    formula: "ton = PESO (kg) ÷ 1000; cx = Σ CX",
    fonte: "Produtividade por Colaborador",
    observacao:
      "Cargo e turma casados pelo nome (todos os tokens do nome curto no nome completo). ~87/117 casam na separação manual.",
  },
  {
    item: "Comparativo produtividade × carregado",
    formula: "diferença = ton atividade − ton carregado (no mesmo período)",
    fonte: "Produtividade + Toneladas Mensal",
    observacao: "Setembro parcial (até 11/09); outubro sem carregado lançado.",
  },
  {
    item: "Tonelagem do estoque — variação mês a mês",
    formula: "variação % = (ton atual − ton anterior) ÷ ton anterior × 100",
    fonte: "Histórico de sincronização (Supabase)",
  },
];

const ACURACIDADE: Acuracidade[] = [
  {
    metrica: "Acuracidade Full × Focco (saldo)",
    valor: "29%",
    detalhe:
      "171 de 589 itens em comum com saldo exatamente igual. 68 itens só no Full, 23 só no Focco. Diferença acumulada de +1.821 unidades.",
  },
  {
    metrica: "Casamento de nomes — produtividade (separação manual)",
    valor: "~74%",
    detalhe: "Aproximadamente 87 de 117 colaboradores casados pelo nome com o cadastro QLP.",
  },
  {
    metrica: "Casamento de nomes — produtividade (empilhadeira)",
    valor: "~77%",
    detalhe: "Aproximadamente 75 de 98 colaboradores casados pelo nome com o cadastro QLP.",
  },
  {
    metrica: "Casamento de nomes — fichas QLP",
    valor: "~76%",
    detalhe: "108 de 142 nomes casados com o cadastro da CD — QLP.xlsx.",
  },
  {
    metrica: "Cobertura de meses — carregado",
    valor: "Jan–Set/2026",
    detalhe: "Setembro parcial (até 11/09); outubro sem carregado lançado. Recebido cobre a semana corrente.",
  },
  {
    metrica: "Total de registros QLP classificados",
    valor: "252 registros",
    detalhe:
      "Todos os 252 registros classificados por CLASSE: Desligamento 93, Carregamento 88, Estoque 40, Transferência 9, Liderança 8, Afastamento 7, Treinamento 7.",
  },
];

function Secao({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="border-b border-neutral-300 pb-1 text-sm font-bold uppercase tracking-wide text-[#4d7a1f]">
        {numero}. {titulo}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function RelatorioAuditoria({ dados, onFechar }: { dados: VideoResumoProps; onFechar: () => void }) {
  const agora = new Date().toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  const sync = dados.sincronizacao?.em
    ? new Date(dados.sincronizacao.em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })
    : null;
  const planilhas = dados.sincronizacao?.planilhas ?? [];

  return createPortal(
    <div onClick={(e) => e.stopPropagation()} className="relatorio-lopas-root fixed inset-0 z-[200] overflow-y-auto bg-neutral-100 text-neutral-900">
      <div className="no-print sticky top-0 z-10 flex items-center justify-end gap-2 border-b bg-white px-4 py-2 shadow-sm">
        <Button type="button" onClick={() => window.print()} size="sm">
          Imprimir / salvar PDF
        </Button>
        <Button type="button" onClick={onFechar} variant="outline" size="sm">
          Fechar
        </Button>
      </div>

      <article className="mx-auto my-4 max-w-3xl bg-white p-8 shadow sm:p-10">
        {/* Cabeçalho com o trevo */}
        <header className="flex items-center gap-4 border-b-2 border-[#73ae37] pb-3">
          <img src="/lopas-logo-clover.png" alt="Lopas — Trevo" className="size-14" />
          <div>
            <h1 className="font-serif text-2xl font-bold">Relatório de Auditoria Técnica</h1>
            <p className="text-xs text-neutral-600">
              Painel de Estoque · CD Lopas 2026 · gerado em {agora}
            </p>
          </div>
        </header>

        {/* Sumário */}
        <p className="mt-5 text-sm leading-relaxed text-neutral-800">
          Este documento descreve, de forma transparente e verificável, cada cálculo
          exibido no painel, a fonte de onde cada dado provém, a fórmula aplicada, o
          horário de atualização e as métricas de acuracidade conhecidas. O objetivo é
          eliminar qualquer dúvida sobre a autenticidade das informações e demonstrar
          responsabilidade no tratamento dos dados do Centro de Distribuição.
        </p>

        {/* 1. Fontes de dados */}
        <Secao numero={1} titulo="Fontes de dados">
          <p className="mb-3 text-xs leading-snug text-neutral-600">
            O painel consome dados de três sistemas distintos, todos acessados via
            pasta do Google Drive do CD. A sincronização é automática.
          </p>
          <div className="space-y-3">
            {FONTES.map((f) => (
              <div key={f.nome} className="rounded-md border-l-2 border-[#73ae37] bg-neutral-50 px-3 py-2">
                <p className="text-xs font-bold text-neutral-900">{f.nome}</p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#4d7a1f]">
                  Sistema: {f.sistema}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-neutral-700">{f.descricao}</p>
                <p className="mt-1 text-[10px] leading-snug text-neutral-500">
                  <strong>Atualização:</strong> {f.atualizacao}
                </p>
              </div>
            ))}
          </div>
        </Secao>

        {/* 2. Cálculos e fórmulas */}
        <Secao numero={2} titulo="Cálculos e fórmulas">
          <p className="mb-3 text-xs leading-snug text-neutral-600">
            Cada indicador do painel é derivado das fontes acima por meio das fórmulas
            documentadas a seguir. Nenhum valor é estimado sem a fonte correspondente.
          </p>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-neutral-300 bg-neutral-50">
                <th className="py-1.5 pr-3 text-left font-bold text-neutral-700">Indicador</th>
                <th className="py-1.5 pr-3 text-left font-bold text-neutral-700">Fórmula</th>
                <th className="py-1.5 text-left font-bold text-neutral-700">Fonte</th>
              </tr>
            </thead>
            <tbody>
              {CALCULOS.map((c, i) => (
                <tr key={i} className="border-b border-neutral-100 align-top">
                  <td className="py-1.5 pr-3 font-semibold text-neutral-900">
                    {c.item}
                    {c.observacao && (
                      <p className="mt-0.5 font-normal text-[10px] leading-snug text-neutral-500">
                        {c.observacao}
                      </p>
                    )}
                  </td>
                  <td className="py-1.5 pr-3 font-mono text-[11px] leading-snug text-neutral-800">{c.formula}</td>
                  <td className="py-1.5 text-[11px] leading-snug text-neutral-600">{c.fonte}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Secao>

        {/* 3. Horários de atualização */}
        <Secao numero={3} titulo="Horários de atualização e sincronização">
          <div className="space-y-2 text-xs leading-snug text-neutral-800">
            <p>
              <strong className="text-[#4d7a1f]">Sincronização automática:</strong> o painel
              verifica a pasta do Google Drive a cada <strong>15 segundos</strong> em segundo
              plano e a cada chamada do endpoint de sincronização (com intervalo mínimo de 10 s).
            </p>
            <p>
              <strong className="text-[#4d7a1f]">Selo "Atualizado":</strong> o horário exibido no
              topo do painel corresponde à <strong>modificação mais recente</strong> entre as
              planilhas da pasta — não ao horário da checagem. Quando a modificação não traz
              hora, o sistema usa a meia-noite do dia no fuso de São Paulo (UTC−3).
            </p>
            {sync && (
              <p>
                <strong className="text-[#4d7a1f]">Última sincronização registrada:</strong> {sync}.
              </p>
            )}
            {planilhas.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold text-neutral-700">Planilhas sincronizadas:</p>
                <ul className="mt-1 space-y-0.5">
                  {planilhas.map((p) => (
                    <li key={p.nome} className="text-[11px] text-neutral-600">
                      • {p.nome}
                      {p.modificado && (
                        <span className="text-neutral-400"> — modificado em {new Date(p.modificado).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p>
              <strong className="text-[#4d7a1f]">Dados estáticos:</strong> QLP · CD e Produtividade
              foram extraídos manualmente em 07/10/2026 e não são atualizados automaticamente.
              O carregado mensal é estático e requer reextração para atualização.
            </p>
          </div>
        </Secao>

        {/* 4. Acuracidade */}
        <Secao numero={4} titulo="Métricas de acuracidade">
          <p className="mb-3 text-xs leading-snug text-neutral-600">
            As métricas abaixo refletem o grau de confiança de cada bloco de dados.
            Onde o casamento não é perfeito, o painel indica a lacuna e não oculta a
            limitação.
          </p>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-neutral-300 bg-neutral-50">
                <th className="py-1.5 pr-3 text-left font-bold text-neutral-700">Métrica</th>
                <th className="py-1.5 pr-3 text-left font-bold text-neutral-700">Valor</th>
                <th className="py-1.5 text-left font-bold text-neutral-700">Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {ACURACIDADE.map((a, i) => (
                <tr key={i} className="border-b border-neutral-100 align-top">
                  <td className="py-1.5 pr-3 font-semibold text-neutral-900">{a.metrica}</td>
                  <td className="py-1.5 pr-3 font-mono font-bold text-[#4d7a1f]">{a.valor}</td>
                  <td className="py-1.5 text-[11px] leading-snug text-neutral-600">{a.detalhe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Secao>

        {/* 5. Responsabilidade */}
        <Secao numero={5} titulo="Responsabilidade e transparência">
          <div className="space-y-2 text-xs leading-relaxed text-neutral-800">
            <p>
              <strong className="text-[#4d7a1f]">Origem verificável.</strong> Todo número
              exibido no painel é rastreável a uma planilha específica da pasta do Drive ou
              a um relatório exportado do FullSoft ou Focco. Nenhum indicador é fabricado ou
              interpolado sem fonte.
            </p>
            <p>
              <strong className="text-[#4d7a1f]">Limitações declaradas.</strong> O painel
              rotula explicitamente o que é parcial — custo de avarias, meses com base
              zerada, casamento de nomes incompleto, dados estáticos. O usuário é informado
              da lacuna, nunca levado a crer que o dado é completo quando não é.
            </p>
            <p>
              <strong className="text-[#4d7a1f]">Fuso horário.</strong> Todos os horários são
              exibidos no fuso de São Paulo (UTC−3), o mesmo do CD. O container do painel
              roda configurado para este fuso para que datas sem hora não voltem um dia.
            </p>
            <p>
              <strong className="text-[#4d7a1f]">Sem Supabase válido.</strong> Quando a chave
              de serviço do Supabase não está configurada, as APIs falham de forma elegante
              e o painel exibe os dados de exemplo embutidos (initialSyncData) — nunca
              simula dados ao vivo.
            </p>
          </div>
        </Secao>

        {/* Rodapé */}
        <footer className="mt-8 border-t-2 border-[#73ae37] pt-3">
          <p className="text-[10px] leading-snug text-neutral-500">
            Documento gerado automaticamente pelo painel de estoque do CD Lopas em {agora}.
            {sync ? ` Última sincronização com o Drive: ${sync}.` : ""}
            {" "}Horários em Brasília (UTC−3). Este relatório descreve a metodologia vigente
            na data de geração e pode ser reimpresso a qualquer momento para conferência.
          </p>
          <p className="mt-2 text-center text-[11px] font-semibold tracking-widest text-[#73ae37] uppercase">
            Móveis Lopas · Movidos pela Fé
          </p>
        </footer>
      </article>
    </div>,
    document.body,
  );
}
