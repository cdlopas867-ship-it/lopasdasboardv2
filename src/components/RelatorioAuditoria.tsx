/* Relatório de Auditoria — documento técnico que mostra os DADOS ATUAIS do
   painel com cada valor, fórmula aplicada e fonte de origem. Estilo Word
   profissional, com o trevo da Lopas no topo. "Imprimir / salvar PDF" usa a
   impressão do navegador. */

import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { fmtBrMax, fmtInt, fmtMoeda, fmtTonDec } from "@/lib/format";
import type { VideoResumoProps } from "./VideoResumoDashboard";

type CardIndicador = {
  nome: string;
  valor: string;
  formula: string;
  fonte: string;
  observacao?: string;
};

type CardTema = {
  tema: string;
  indicadores: CardIndicador[];
};

function montarCardsTematicos(d: VideoResumoProps): CardTema[] {
  const temas: CardTema[] = [];

  /* Estoque */
  const estoque: CardIndicador[] = [];
  if (d.resumo) {
    const r = d.resumo;
    estoque.push({
      nome: "Peso em estoque",
      valor: fmtTonDec(r.ton),
      formula: "Σ PESO LIQ TOTAL de todos os itens ativos",
      fonte: "Posição de Estoque (Focco · estoque 001)",
    });
    estoque.push({
      nome: "Valor em estoque",
      valor: fmtMoeda(r.valor),
      formula: "Σ (custo médio × saldo) de cada item",
      fonte: "Posição de Estoque (Focco · estoque 001)",
    });
    estoque.push({
      nome: "Itens ativos",
      valor: fmtInt(r.itens),
      formula: "Contagem de itens com saldo ou cadastro",
      fonte: "Posição de Estoque (Focco · estoque 001)",
    });
  }
  estoque.push({
    nome: "Ocupação do CD",
    valor: `${fmtBrMax(d.ocupacao.pct * 100, 1)}%`,
    formula: "posições ocupadas ÷ total de endereços (5.970) × 100",
    fonte: "Posição de Estoque (Focco · estoque 001)",
    observacao: `Ocupados: ${fmtInt(d.ocupacao.ocupados)} · Livres: ${fmtInt(d.ocupacao.livres)}${d.ocupacao.bloqueados ? ` · Bloqueadas: ${fmtInt(d.ocupacao.bloqueados)}` : ""}`,
  });
  if (estoque.length) temas.push({ tema: "Estoque", indicadores: estoque });

  /* Produção */
  const producao: CardIndicador[] = [];
  if (d.semana) {
    const total = d.semana.dias.reduce((s, x) => s + x.ton, 0);
    const meta = d.semana.dias.reduce((s, x) => s + x.meta, 0);
    producao.push({
      nome: `Recebimento da semana (${d.semana.rotulo})`,
      valor: fmtTonDec(total),
      formula: "Σ PESO_RECEBIDO de cada dia da semana",
      fonte: "PESO RECEBIDO POR PERÍODO (Drive)",
      observacao: meta > 0 ? `Meta: ${fmtTonDec(meta)}` : undefined,
    });
  }
  if (d.producaoSemanal?.length) {
    const totalProduzido = d.producaoSemanal.reduce((s, x) => s + x.produzido, 0);
    const totalPendente = d.producaoSemanal.reduce((s, x) => s + x.pendente, 0);
    const totalTonPend = d.producaoSemanal.reduce((s, x) => s + x.tonPendente, 0);
    const totalOrdens = d.producaoSemanal.reduce((s, x) => s + x.ordens, 0);
    producao.push({
      nome: "Produção — produzido",
      valor: `${fmtInt(totalProduzido)} un`,
      formula: "produzido = QTDE ENTREGUE da produção",
      fonte: "PCP 003 — Análise de Realização Total (Drive)",
    });
    producao.push({
      nome: "Produção — pendente",
      valor: `${fmtInt(totalPendente)} un · ${fmtBrMax(totalTonPend, 1)} t`,
      formula: "pendente = previsto − produzido; ton = PESO PENDENTE",
      fonte: "PCP 003 — Análise de Realização Total (Drive)",
      observacao: `${fmtInt(totalOrdens)} ordens de produção`,
    });
  }
  if (d.pendentes) {
    producao.push({
      nome: "Pendências — tonelagem total",
      valor: fmtTonDec(d.pendentes.totalTon),
      formula: "Σ tonelagem pendente das ordens em aberto",
      fonte: "PCP 004 — Pendências (Drive)",
      observacao: `${fmtInt(d.pendentes.itens)} itens em aberto · média ${fmtTonDec(d.pendentes.mediaTon)}`,
    });
  }
  if (producao.length) temas.push({ tema: "Produção", indicadores: producao });

  /* Acuracidade */
  const acuracidade: CardIndicador[] = [];
  if (d.saldoComparativo) {
    const c = d.saldoComparativo.comparativo;
    acuracidade.push({
      nome: "Saldo Full × Focco — acuracidade",
      valor: `${fmtBrMax(c.pctAcuracia, 1)}%`,
      formula: "itens com saldo exatamente igual ÷ itens em comum × 100",
      fonte: "WF0112 (Full · estoque 112) × ESTOQUE 001 (Focco)",
      observacao: `${fmtInt(c.qtdExata)} exatos de ${fmtInt(c.itensEmComum)} em comum`,
    });
    acuracidade.push({
      nome: "Saldo Full — itens e saldo",
      valor: `${fmtInt(d.saldoComparativo.full.itens)} itens · ${fmtInt(d.saldoComparativo.full.saldo)} un`,
      formula: "Σ Qtd. Atual do relatório WF0112 (somado por código)",
      fonte: "WF0112 — Estoques (FullSoft WMS · estoque 112)",
    });
    acuracidade.push({
      nome: "Saldo Focco — itens e saldo",
      valor: `${fmtInt(d.saldoComparativo.focco.itens)} itens · ${fmtInt(d.saldoComparativo.focco.saldo)} un`,
      formula: "Σ SALDO da posição de estoque 001",
      fonte: "ESTOQUE 001 — Posição de Estoque (Focco)",
      observacao: fmtMoeda(d.saldoComparativo.focco.valor),
    });
  }
  const mes = (d.mensal ?? []).filter((m) => m.recebido > 0 || m.carregado > 0);
  if (mes.length) {
    const rec = mes.reduce((s, m) => s + m.recebido, 0);
    const car = mes.reduce((s, m) => s + m.carregado, 0);
    const saude = rec > 0 ? (car / rec) * 100 : 0;
    acuracidade.push({
      nome: "Saúde do estoque",
      valor: `${fmtBrMax(saude, 1)}%`,
      formula: "carregado ÷ recebido × 100 (acumulado do período)",
      fonte: "Toneladas Mensal + PESO RECEBIDO",
      observacao: `Recebido: ${fmtTonDec(rec)} · Carregado: ${fmtTonDec(car)}`,
    });
  }
  if (acuracidade.length) temas.push({ tema: "Acuracidade", indicadores: acuracidade });

  /* Avarias */
  const avarias: CardIndicador[] = [];
  if (d.avarias) {
    avarias.push({
      nome: "Avarias — total de volumes",
      valor: fmtInt(d.avarias.total),
      formula: "Soma de Quantidade (coluna Quantidade), não contagem de registros",
      fonte: "Planilha de Avarias (Drive)",
      observacao: `Custo: ${d.avarias.custo}${d.avarias.referenciaParcial ? " (parcial)" : ""}`,
    });
  }
  if (d.reservados) {
    avarias.push({
      nome: "Itens reservados — valor",
      valor: fmtMoeda(d.reservados.totalValor),
      formula: "valor reservado = qtd reservada × custo médio do item",
      fonte: "COMERCIAL 024 — Saldo de Itens com Reserva (Drive)",
      observacao: `${fmtBrMax(d.reservados.pctValor, 1)}% do valor do estoque`,
    });
  }
  if (d.foraDeLinha) {
    const f = d.foraDeLinha.posicaoForaDeLinha;
    avarias.push({
      nome: "Fora de linha — valor",
      valor: fmtMoeda(f.valorEstoque),
      formula: "Σ valor dos itens fora de linha (estimativa quando sem custo)",
      fonte: "Posição de Estoque (Focco · estoque 001)",
    });
  }
  if (d.valorFaturado) {
    avarias.push({
      nome: "Valor faturado (referência)",
      valor: fmtMoeda(d.valorFaturado),
      formula: "Consultado via API /api/valor-faturado (Supabase)",
      fonte: "Supabase — store de valor faturado",
    });
  }
  if (avarias.length) temas.push({ tema: "Avarias", indicadores: avarias });

  return temas;
}

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
  const cards = montarCardsTematicos(dados);
  const ultimoFull = cards.length % 2 === 1;

  return createPortal(
    <div onClick={(e) => e.stopPropagation()} className="relatorio-lopas-root fixed inset-0 z-[200] overflow-y-auto bg-neutral-100 text-neutral-900">
      <style>{`
        @keyframes auditArrive { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        .audit-card { animation: auditArrive .55s cubic-bezier(.2,.75,.25,1) both; }
        .audit-card:nth-child(2) { animation-delay: .07s }
        .audit-card:nth-child(3) { animation-delay: .14s }
        .audit-card:nth-child(4) { animation-delay: .21s }
        .audit-card:nth-child(5) { animation-delay: .28s }
        @media print { .audit-card { animation: none !important; opacity: 1 !important; transform: none !important; } }
      `}</style>

      <div className="no-print sticky top-0 z-10 flex items-center justify-end gap-2 border-b bg-white px-4 py-2 shadow-sm">
        <Button type="button" onClick={() => window.print()} size="sm">
          Imprimir / salvar PDF
        </Button>
        <Button type="button" onClick={onFechar} variant="outline" size="sm">
          Fechar
        </Button>
      </div>

      <article className="mx-auto my-4 max-w-3xl bg-white p-8 shadow sm:p-10">
        <header className="flex items-center gap-4 border-b-2 border-[#73ae37] pb-3">
          <img src="/lopas-logo-clover.png" alt="Lopas — Trevo" className="size-14" />
          <div>
            <h1 className="font-serif text-2xl font-bold">Relatório de Auditoria — Dados Atuais</h1>
            <p className="text-xs text-neutral-600">
              Painel de Estoque · CD Lopas 2026 · gerado em {agora}
            </p>
          </div>
        </header>

        <p className="mt-5 text-sm leading-relaxed text-neutral-800">
          Este documento lista cada indicador exibido no painel com o{" "}
          <strong>valor atual</strong>, a <strong>fórmula</strong> aplicada e a{" "}
          <strong>fonte</strong> de onde o dado provém. Todos os valores abaixo
          correspondem aos dados carregados no momento da geração.
          {sync ? ` Última sincronização: ${sync}.` : ""}
        </p>

        <Secao numero={1} titulo="Indicadores atuais — valor, fórmula e fonte">
          <div className="grid grid-cols-1 gap-6 rounded-[18px] bg-[#f4f6f3] p-6 sm:grid-cols-2">
            {cards.map((card, i) => (
              <article
                key={card.tema}
                className="audit-card flex flex-col justify-between gap-6 rounded-[18px] border border-[#dce5df] bg-white px-[34px] py-[32px] shadow-[0_10px_30px_rgba(27,55,42,0.07)]"
                style={ultimoFull && i === cards.length - 1 ? { gridColumn: "1 / -1" } : undefined}
              >
                <h2 className="text-[25px] font-[680] leading-[1.2] tracking-[-0.035em] text-[#18372c]">
                  {card.tema}
                </h2>
                <div className="grid gap-[18px]">
                  {card.indicadores.map((ind, j) => (
                    <div key={j} className={j > 0 ? "border-t border-[#e8ede9] pt-[18px]" : ""}>
                      <span className="text-sm font-semibold text-[#182d27]">{ind.nome}</span>
                      <p className="mt-1 font-mono text-xl font-bold tabular-nums text-[#28674d]">{ind.valor}</p>
                      <div className="mb-2 mt-3 h-[3px] w-[34px] rounded-[2px] bg-[#80a995]" />
                      <p className="text-[16px] leading-[1.5] text-[#52655c]">{ind.formula}</p>
                      <p className="mt-[14px] border-t border-[#e8ede9] pt-[14px] text-[16px] leading-[1.5] text-[#718078]">{ind.fonte}</p>
                      {ind.observacao && (
                        <p className="mt-2 text-[#28674d] font-[650]">{ind.observacao}</p>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Secao>

        <Secao numero={2} titulo="Horários de atualização">
          <div className="space-y-2 text-xs leading-snug text-neutral-800">
            <p>
              <strong className="text-[#4d7a1f]">Sincronização automática:</strong> a cada{" "}
              <strong>15 segundos</strong> com a pasta do Google Drive.
            </p>
            <p>
              <strong className="text-[#4d7a1f]">Selo "Atualizado":</strong> mostra a{" "}
              <strong>modificação mais recente</strong> entre as planilhas — não o horário da checagem.
            </p>
            {sync && (
              <p>
                <strong className="text-[#4d7a1f]">Última sincronização:</strong> {sync}.
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
                        <span className="text-neutral-400">
                          {" "}— modificado em {new Date(p.modificado).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Secao>

        <Secao numero={3} titulo="Responsabilidade e transparência">
          <div className="space-y-2 text-xs leading-relaxed text-neutral-800">
            <p>
              <strong className="text-[#4d7a1f]">Origem verificável.</strong> Todo número
              exibido é rastreável a uma planilha da pasta do Drive ou relatório do
              FullSoft/Focco. Nenhum valor é fabricado sem fonte.
            </p>
            <p>
              <strong className="text-[#4d7a1f]">Limitações declaradas.</strong> O painel
              rotula o que é parcial — custo de avarias, meses com base zerada, dados
              estáticos. O usuário é informado da lacuna.
            </p>
            <p>
              <strong className="text-[#4d7a1f]">Fuso horário.</strong> Horários em Brasília
              (UTC−3), mesmo fuso do CD.
            </p>
          </div>
        </Secao>

        <footer className="mt-8 border-t-2 border-[#73ae37] pt-3">
          <p className="text-[10px] leading-snug text-neutral-500">
            Documento gerado em {agora}.{sync ? ` Dados sincronizados em ${sync}.` : ""}{" "}
            Horários em Brasília (UTC−3).
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
