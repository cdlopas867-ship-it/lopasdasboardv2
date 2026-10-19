/* Relatório de Auditoria — documento técnico que mostra os DADOS ATUAIS do
   painel com cada valor, fórmula aplicada e fonte de origem. Estilo Word
   profissional, com o trevo da Lopas no topo. "Imprimir / salvar PDF" usa a
   impressão do navegador. */

import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { fmtBrMax, fmtInt, fmtMoeda, fmtTonDec } from "@/lib/format";
import type { VideoResumoProps } from "./VideoResumoDashboard";

type LinhaCalc = {
  indicador: string;
  valor: string;
  formula: string;
  fonte: string;
  observacao?: string;
};

function montarCalculos(d: VideoResumoProps): LinhaCalc[] {
  const linhas: LinhaCalc[] = [];

  if (d.resumo) {
    const r = d.resumo;
    linhas.push({
      indicador: "Peso em estoque",
      valor: fmtTonDec(r.ton),
      formula: "Σ PESO LIQ TOTAL de todos os itens ativos",
      fonte: "Posição de Estoque (Focco · estoque 001)",
    });
    linhas.push({
      indicador: "Valor em estoque",
      valor: fmtMoeda(r.valor),
      formula: "Σ (custo médio × saldo) de cada item",
      fonte: "Posição de Estoque (Focco · estoque 001)",
    });
    linhas.push({
      indicador: "Itens ativos",
      valor: fmtInt(r.itens),
      formula: "Contagem de itens com saldo ou cadastro",
      fonte: "Posição de Estoque (Focco · estoque 001)",
    });
    linhas.push({
      indicador: "Saldo físico (un)",
      valor: fmtInt(r.saldo),
      formula: "Σ SALDO de todos os itens",
      fonte: "Posição de Estoque (Focco · estoque 001)",
    });
    linhas.push({
      indicador: "Valor previsto",
      valor: fmtMoeda(r.previsto),
      formula: "Estimativa de venda (não faturamento realizado)",
      fonte: "Posição de Estoque (Focco · estoque 001)",
    });
  }

  linhas.push({
    indicador: "Ocupação do CD",
    valor: `${fmtBrMax(d.ocupacao.pct * 100, 1)}%`,
    formula: "posições ocupadas ÷ total de endereços (5.970) × 100",
    fonte: "Posição de Estoque (Focco · estoque 001)",
    observacao: `Ocupados: ${fmtInt(d.ocupacao.ocupados)} · Livres: ${fmtInt(d.ocupacao.livres)}${d.ocupacao.bloqueados ? ` · Bloqueadas: ${fmtInt(d.ocupacao.bloqueados)}` : ""}`,
  });

  if (d.semana) {
    const dias = d.semana.dias;
    const total = dias.reduce((s, x) => s + x.ton, 0);
    const meta = dias.reduce((s, x) => s + x.meta, 0);
    linhas.push({
      indicador: `Recebimento da semana (${d.semana.rotulo})`,
      valor: fmtTonDec(total),
      formula: "Σ PESO_RECEBIDO de cada dia da semana",
      fonte: "PESO RECEBIDO POR PERÍODO (Drive)",
      observacao: meta > 0 ? `Meta: ${fmtTonDec(meta)} · ${fmtBrMax((total / meta) * 100, 0)}% da meta` : undefined,
    });
    dias.forEach((x) => {
      linhas.push({
        indicador: `  ${x.dia} ${x.data}`,
        valor: `${fmtBrMax(x.ton, 1)} t`,
        formula: "Σ PESO_RECEBIDO do dia",
        fonte: "PESO RECEBIDO POR PERÍODO (Drive)",
        observacao: `Meta: ${fmtBrMax(x.meta, 1)} t`,
      });
    });
  }

  if (d.turnos?.length) {
    d.turnos.forEach((t) => {
      linhas.push({
        indicador: `  Turno ${t.nome}${t.faixa ? ` (${t.faixa})` : ""}`,
        valor: `${fmtBrMax(t.pct, 1)}%${t.ton ? ` · ${fmtBrMax(t.ton, 1)} t` : ""}`,
        formula: "ton = Σ PESO_RECEBIDO do turno; % = ton turno ÷ total × 100",
        fonte: "PESO RECEBIDO POR PERÍODO (Drive)",
      });
    });
  }

  if (d.producaoSemanal?.length) {
    const totalPrev = d.producaoSemanal.reduce((s, x) => s + x.previsto, 0);
    const totalProduzido = d.producaoSemanal.reduce((s, x) => s + x.produzido, 0);
    const totalEntregue = d.producaoSemanal.reduce((s, x) => s + x.entregue, 0);
    const totalPendente = d.producaoSemanal.reduce((s, x) => s + x.pendente, 0);
    const totalTonPrev = d.producaoSemanal.reduce((s, x) => s + x.tonPrevisto, 0);
    const totalTonPend = d.producaoSemanal.reduce((s, x) => s + x.tonPendente, 0);
    const totalOrdens = d.producaoSemanal.reduce((s, x) => s + x.ordens, 0);
    linhas.push({
      indicador: "Produção — programado",
      valor: `${fmtInt(totalPrev)} un · ${fmtBrMax(totalTonPrev, 1)} t`,
      formula: "previsto = QTDE ENTREGUE + QTDE PENDENTE; ton = PESO PREVISTO",
      fonte: "PCP 003 — Análise de Realização Total (Drive)",
    });
    linhas.push({
      indicador: "Produção — produzido",
      valor: `${fmtInt(totalProduzido)} un`,
      formula: "produzido = QTDE ENTREGUE da produção",
      fonte: "PCP 003 — Análise de Realização Total (Drive)",
    });
    linhas.push({
      indicador: "Produção — recebido no estoque",
      valor: `${fmtInt(totalEntregue)} un`,
      formula: "entregue = recebido da planilha PESO RECEBIDO POR PERÍODO",
      fonte: "PESO RECEBIDO POR PERÍODO (Drive)",
    });
    linhas.push({
      indicador: "Produção — pendente",
      valor: `${fmtInt(totalPendente)} un · ${fmtBrMax(totalTonPend, 1)} t`,
      formula: "pendente = previsto − produzido; ton = PESO PENDENTE",
      fonte: "PCP 003 — Análise de Realização Total (Drive)",
      observacao: `${fmtInt(totalOrdens)} ordens de produção`,
    });
  }

  if (d.avarias) {
    linhas.push({
      indicador: "Avarias — total de volumes",
      valor: fmtInt(d.avarias.total),
      formula: "Soma de Quantidade (coluna Quantidade), não contagem de registros",
      fonte: "Planilha de Avarias (Drive)",
      observacao: `Custo: ${d.avarias.custo}${d.avarias.referenciaParcial ? " (parcial)" : ""}`,
    });
    d.avarias.meses.forEach((m) => {
      linhas.push({
        indicador: `  ${m.mes}`,
        valor: fmtInt(m.qtd),
        formula: "Soma de Quantidade do mês",
        fonte: "Planilha de Avarias (Drive)",
      });
    });
  }

  if (d.pendentes) {
    linhas.push({
      indicador: "Pendências — tonelagem total",
      valor: fmtTonDec(d.pendentes.totalTon),
      formula: "Σ tonelagem pendente das ordens em aberto",
      fonte: "PCP 004 — Pendências (Drive)",
      observacao: `${fmtInt(d.pendentes.itens)} itens em aberto · média ${fmtTonDec(d.pendentes.mediaTon)}`,
    });
    d.pendentes.meses.forEach((m) => {
      linhas.push({
        indicador: `  ${m.mes}`,
        valor: fmtTonDec(m.ton),
        formula: "Σ tonelagem pendente do mês",
        fonte: "PCP 004 — Pendências (Drive)",
        observacao: `${fmtBrMax(m.pct, 0)}% · ${fmtInt(m.itens)} ordens${m.lotes ? ` · ${m.lotes} lotes` : ""}`,
      });
    });
  }

  if (d.reservados) {
    const r = d.reservados;
    linhas.push({
      indicador: "Itens reservados — quantidade",
      valor: fmtInt(r.totalQtd),
      formula: "Σ qtd reservada de todos os itens",
      fonte: "COMERCIAL 024 — Saldo de Itens com Reserva (Drive)",
    });
    linhas.push({
      indicador: "Itens reservados — peso",
      valor: fmtTonDec(r.totalTon),
      formula: "peso reservado = qtd reservada × peso bruto do item",
      fonte: "COMERCIAL 024 — Saldo de Itens com Reserva (Drive)",
    });
    linhas.push({
      indicador: "Itens reservados — valor",
      valor: fmtMoeda(r.totalValor),
      formula: "valor reservado = qtd reservada × custo médio do item",
      fonte: "COMERCIAL 024 — Saldo de Itens com Reserva (Drive)",
      observacao: `${fmtBrMax(r.pctValor, 1)}% do valor do estoque`,
    });
  }

  if (d.semReserva) {
    linhas.push({
      indicador: "Itens sem reserva — peso",
      valor: fmtTonDec(d.semReserva.totalTon),
      formula: "Σ peso dos itens sem reserva comercial",
      fonte: "COMERCIAL 024 — Saldo de Itens com Reserva (Drive)",
      observacao: fmtMoeda(d.semReserva.totalValor),
    });
  }

  if (d.foraDeLinha) {
    const f = d.foraDeLinha.posicaoForaDeLinha;
    const e = d.foraDeLinha.posicaoEmLinha;
    const t = d.foraDeLinha.posicaoTotal;
    const pctPeso = t.pesoTon > 0 ? (f.pesoTon / t.pesoTon) * 100 : 0;
    linhas.push({
      indicador: "Fora de linha — peso",
      valor: fmtTonDec(f.pesoTon),
      formula: "Σ peso dos itens classificados como fora de linha",
      fonte: "Posição de Estoque (classificação em linha/fora de linha)",
      observacao: `${fmtInt(f.itens)} itens · ${fmtBrMax(pctPeso, 1)}% do peso total`,
    });
    linhas.push({
      indicador: "Fora de linha — valor",
      valor: fmtMoeda(f.valorEstoque),
      formula: "Σ valor dos itens fora de linha (estimativa quando sem custo)",
      fonte: "Posição de Estoque (Focco · estoque 001)",
    });
    linhas.push({
      indicador: "Em linha — peso",
      valor: fmtTonDec(e.pesoTon),
      formula: "Σ peso dos itens classificados como em linha",
      fonte: "Posição de Estoque (Focco · estoque 001)",
      observacao: `${fmtInt(e.itens)} itens`,
    });
  }

  if (d.saldoComparativo) {
    const sc = d.saldoComparativo;
    const c = sc.comparativo;
    linhas.push({
      indicador: "Saldo Full × Focco — acuracidade",
      valor: `${fmtBrMax(c.pctAcuracia, 1)}%`,
      formula: "itens com saldo exatamente igual ÷ itens em comum × 100",
      fonte: "WF0112 (Full · estoque 112) × ESTOQUE 001 (Focco)",
      observacao: `${fmtInt(c.qtdExata)} exatos de ${fmtInt(c.itensEmComum)} em comum`,
    });
    linhas.push({
      indicador: "Saldo Full × Focco — só Full",
      valor: fmtInt(c.itensSoFull),
      formula: "itens que só existem no relatório WF0112 (peças/componentes)",
      fonte: "WF0112 (Full · estoque 112)",
    });
    linhas.push({
      indicador: "Saldo Full × Focco — só Focco",
      valor: fmtInt(c.itensSoFocco),
      formula: "itens que só existem na posição de estoque 001",
      fonte: "ESTOQUE 001 (Focco)",
    });
    linhas.push({
      indicador: "Saldo Full — itens e saldo",
      valor: `${fmtInt(sc.full.itens)} itens · ${fmtInt(sc.full.saldo)} un`,
      formula: "Σ Qtd. Atual do relatório WF0112 (somado por código)",
      fonte: "WF0112 — Estoques (FullSoft WMS · estoque 112)",
    });
    linhas.push({
      indicador: "Saldo Focco — itens e saldo",
      valor: `${fmtInt(sc.focco.itens)} itens · ${fmtInt(sc.focco.saldo)} un`,
      formula: "Σ SALDO da posição de estoque 001",
      fonte: "ESTOQUE 001 — Posição de Estoque (Focco)",
      observacao: fmtMoeda(sc.focco.valor),
    });
  }

  if (d.paletas && d.paletas.totalPaletes > 0) {
    linhas.push({
      indicador: "Paletes em estoque",
      valor: fmtInt(d.paletas.totalPaletes),
      formula: "Σ paletes por tamanho (P, M, G, GG) dos itens mapeados",
      fonte: "Posição de Estoque (Focco · estoque 001)",
      observacao: `${fmtInt(d.paletas.totalItens)} itens mapeados`,
    });
    d.paletas.porTamanho.forEach((t) => {
      linhas.push({
        indicador: `  Tamanho ${t.tamanho}`,
        valor: `${fmtInt(t.paletes)} paletes`,
        formula: "paletes do tamanho = Σ ceil(saldo ÷ un por palete)",
        fonte: "Posição de Estoque (Focco · estoque 001)",
        observacao: `${fmtInt(t.und)} un · ${fmtInt(t.itens)} itens`,
      });
    });
  }

  const mes = (d.mensal ?? []).filter((m) => m.recebido > 0 || m.carregado > 0);
  if (mes.length) {
    const rec = mes.reduce((s, m) => s + m.recebido, 0);
    const car = mes.reduce((s, m) => s + m.carregado, 0);
    const saude = rec > 0 ? (car / rec) * 100 : 0;
    linhas.push({
      indicador: "Saúde do estoque",
      valor: `${fmtBrMax(saude, 1)}%`,
      formula: "carregado ÷ recebido × 100 (acumulado do período)",
      fonte: "Toneladas Mensal + PESO RECEBIDO",
      observacao: `Recebido: ${fmtTonDec(rec)} · Carregado: ${fmtTonDec(car)}`,
    });
    mes.forEach((m) => {
      linhas.push({
        indicador: `  ${m.mes}`,
        valor: `rec. ${fmtBrMax(m.recebido, 1)} t · carr. ${fmtBrMax(m.carregado, 1)} t`,
        formula: "recebido e carregado somados do mês",
        fonte: "Toneladas Mensal / Gerenciamento de Carregamento",
      });
    });
  }

  if (d.valorFaturado) {
    linhas.push({
      indicador: "Valor faturado (referência)",
      valor: fmtMoeda(d.valorFaturado),
      formula: "Consultado via API /api/valor-faturado (Supabase)",
      fonte: "Supabase — store de valor faturado",
    });
  }

  return linhas;
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
  const calculos = montarCalculos(dados);

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
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-neutral-300 bg-neutral-50">
                <th className="py-1.5 pr-3 text-left font-bold text-neutral-700">Indicador</th>
                <th className="py-1.5 pr-3 text-right font-bold text-neutral-700">Valor atual</th>
                <th className="py-1.5 pr-3 text-left font-bold text-neutral-700">Fórmula</th>
                <th className="py-1.5 text-left font-bold text-neutral-700">Fonte</th>
              </tr>
            </thead>
            <tbody>
              {calculos.map((c, i) => (
                <tr key={i} className="border-b border-neutral-100 align-top">
                  <td className="py-1.5 pr-3 font-semibold text-neutral-900">
                    {c.indicador}
                    {c.observacao && (
                      <p className="mt-0.5 font-normal text-[10px] leading-snug text-neutral-500">
                        {c.observacao}
                      </p>
                    )}
                  </td>
                  <td className="py-1.5 pr-3 text-right font-mono font-bold tabular-nums text-[#4d7a1f] whitespace-nowrap">
                    {c.valor}
                  </td>
                  <td className="py-1.5 pr-3 font-mono text-[11px] leading-snug text-neutral-700">{c.formula}</td>
                  <td className="py-1.5 text-[11px] leading-snug text-neutral-600">{c.fonte}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
