/* Relatório Lopas — documento do painel em formato enxuto: números grandes,
   tabela compacta e uma leitura curta por tópico. "Imprimir / salvar PDF"
   usa a impressão do navegador. */

import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { fmtBrMax, fmtInt, fmtMoeda, fmtTonDec } from "@/lib/format";
import type { VideoResumoProps } from "./VideoResumoDashboard";

type Linha = [string, string];
type Destaque = { valor: string; rotulo: string; nota?: string };
type Secao = {
  titulo: string;
  grandes: Destaque[];
  linhas: Linha[];
  resumo: string;
};

const pct = (v: number) => `${fmtBrMax(v, 1)}%`;

function montarSecoes(d: VideoResumoProps): { secoes: Secao[]; hero: Destaque[]; acoes: string[] } {
  const secoes: Secao[] = [];
  const hero: Destaque[] = [];
  const acoes: string[] = [];

  if (d.resumo) {
    const r = d.resumo;
    hero.push({ valor: fmtTonDec(r.ton), rotulo: "Em estoque (peso)", nota: `${fmtMoeda(r.valor)} · ${fmtInt(r.itens)} itens` });
    secoes.push({
      titulo: "Posição geral do estoque",
      grandes: [
        { valor: fmtTonDec(r.ton), rotulo: "Peso em estoque", nota: `${fmtInt(r.itens)} itens` },
      ],
      linhas: [["Saldo (un)", fmtInt(r.saldo)], ["Itens ativos", fmtInt(r.itens)], ["Valor em estoque", fmtMoeda(r.valor)], ["Valor previsto", fmtMoeda(r.previsto)]],
      resumo: `${fmtTonDec(r.ton)} distribuídos em ${fmtInt(r.itens)} itens e dependem da saída para voltar ao caixa. O valor previsto é estimativa de venda, não faturamento realizado.`,
    });
  }

  if (d.kpis.length) {
    secoes.push({
      titulo: "Indicadores principais",
      grandes: d.kpis.slice(0, 3).map((k) => ({ valor: k.valor, rotulo: k.rotulo })),
      linhas: d.kpis.slice(3).map((k) => [k.rotulo, k.valor] as Linha),
      resumo: "Os indicadores apontam onde aprofundar; ocupação, reservas e movimentação precisam ser lidas juntas.",
    });
  }

  if (d.unidades.length) {
    const maior = [...d.unidades].sort((a, b) => b.share - a.share)[0];
    if (maior) {
      hero.push({ valor: pct(maior.share), rotulo: `Concentração · ${maior.nome}`, nota: "do valor do estoque" });
      secoes.push({
        titulo: "Distribuição por unidade",
        grandes: [{ valor: pct(maior.share), rotulo: maior.nome, nota: "maior participação no valor" }],
        linhas: d.unidades.map((u) => [u.nome, `${u.valor} (${pct(u.share)})`] as Linha),
        resumo: `${maior.nome} concentra ${pct(maior.share)} do valor. Uma melhora de giro ali libera mais capital, mas vale cruzar com pedidos antes de mexer na produção.`,
      });
    }
  }

  {
    hero.push({ valor: pct(d.ocupacao.pct * 100), rotulo: "Ocupação do CD", nota: `${fmtInt(d.ocupacao.livres)} posições livres` });
    secoes.push({
      titulo: "Ocupação do CD",
      grandes: [
        { valor: pct(d.ocupacao.pct * 100), rotulo: "Ocupado", nota: `${fmtInt(d.ocupacao.ocupados)} posições` },
        { valor: fmtInt(d.ocupacao.livres), rotulo: "Posições livres" },
        ...(d.ocupacao.bloqueados ? [{ valor: fmtInt(d.ocupacao.bloqueados), rotulo: "Bloqueadas", nota: "fora da capacidade útil" }] : []),
      ],
      linhas: [],
      resumo: `A folga de ${fmtInt(d.ocupacao.livres)} posições é física: o tamanho dos paletes e a distribuição entre endereços também limitam o próximo recebimento.`,
    });
  }

  if (d.semana) {
    const dias = d.semana.dias;
    const atingidos = dias.filter((x) => x.ton >= x.meta).length;
    const meta = dias.reduce((s, x) => s + x.meta, 0);
    const total = dias.reduce((s, x) => s + x.ton, 0);
    secoes.push({
      titulo: `Recebimento da semana (${d.semana.rotulo})`,
      grandes: [
        { valor: fmtTonDec(total), rotulo: "Recebido na semana", nota: meta > 0 ? `${pct((total / meta) * 100)} da meta` : undefined },
        { valor: `${atingidos}/${dias.length}`, rotulo: "Dias com meta atingida" },
      ],
      linhas: [
        ...dias.map((x) => [`${x.dia} ${x.data}`, `${fmtBrMax(x.ton, 1)} t (meta ${fmtBrMax(x.meta, 1)} t)`] as Linha),
        ...d.turnos.map((t) => [`Turno ${t.nome}`, pct(t.pct)] as Linha),
      ],
      resumo: `A meta foi alcançada em ${atingidos} de ${dias.length} dias. Os dias abaixo merecem conferência da programação, sem atribuir a diferença à equipe antes de entender o que estava previsto.`,
    });
  }

  const mes = (d.mensal ?? []).filter((m) => m.recebido > 0 || m.carregado > 0);
  if (mes.length) {
    const rec = mes.reduce((s, m) => s + m.recebido, 0);
    const car = mes.reduce((s, m) => s + m.carregado, 0);
    const saude = rec > 0 ? (car / rec) * 100 : 0;
    hero.push({ valor: pct(saude), rotulo: "Saúde do estoque", nota: "carregado ÷ recebido" });
    secoes.push({
      titulo: "Saúde do estoque (recebido × carregado)",
      grandes: [
        { valor: pct(saude), rotulo: "Saúde acumulada" },
        { valor: fmtTonDec(rec), rotulo: "Recebido no período" },
        { valor: fmtTonDec(car), rotulo: "Carregado no período" },
      ],
      linhas: mes.map((m) => [m.mes, `rec. ${fmtBrMax(m.recebido, 1)} t · carr. ${fmtBrMax(m.carregado, 1)} t`] as Linha),
      resumo: `${car > rec ? `As saídas superam as entradas em ${fmtTonDec(car - rec)}, o que pode incluir estoque de períodos anteriores.` : car < rec ? `As entradas superam as saídas em ${fmtTonDec(rec - car)}, indicando pressão de aumento sobre o estoque.` : "Entradas e saídas têm o mesmo volume."} ${mes.some((m) => m.recebido === 0 || m.carregado === 0) ? "Há meses com uma das bases zerada: confirme se os registros estão completos antes de concluir sobre o giro." : ""}`,
    });
  }

  if (d.avarias) {
    const pico = [...d.avarias.meses].sort((a, b) => b.qtd - a.qtd)[0];
    const motivo = [...(d.avarias.tipos ?? [])].sort((a, b) => b.total - a.total)[0];
    hero.push({ valor: fmtInt(d.avarias.total), rotulo: "Volumes avariados", nota: "soma das quantidades" });
    secoes.push({
      titulo: "Avarias",
      grandes: [
        { valor: fmtInt(d.avarias.total), rotulo: "Volumes", nota: "pela soma das quantidades" },
        ...(pico ? [{ valor: fmtInt(pico.qtd), rotulo: `Pico · ${pico.mes}` }] : []),
        ...(motivo ? [{ valor: fmtInt(motivo.total), rotulo: "Maior motivo", nota: motivo.tipo }] : []),
      ],
      linhas: [
        ["Custo (parcial)", d.avarias.custo],
        ...d.avarias.meses.map((m) => [m.mes, fmtInt(m.qtd)] as Linha),
      ],
      resumo: `${motivo ? `${motivo.tipo} é o motivo de maior volume e o melhor ponto de partida para revisar manuseio e embalagem.` : ""} O custo é parcial e o volume movimentado de cada mês não está disponível, então não dá para afirmar se a taxa melhorou.`,
    });
    if (motivo) acoes.push(`Revisar manuseio e embalagem a partir de ${motivo.tipo}, o motivo de maior volume.`);
  }

  if (d.pendentes) {
    const critico = d.pendentes.fatias.filter((x) => /cr[ií]tico/i.test(x.rotulo)).reduce((s, x) => s + x.ton, 0);
    const maior = [...d.pendentes.meses].sort((a, b) => b.ton - a.ton)[0];
    hero.push({ valor: fmtTonDec(d.pendentes.totalTon), rotulo: "Pendências", nota: `${fmtInt(d.pendentes.itens)} itens em aberto` });
    secoes.push({
      titulo: "Produção pendente",
      grandes: [
        { valor: fmtTonDec(d.pendentes.totalTon), rotulo: "Em aberto", nota: `${fmtInt(d.pendentes.itens)} itens` },
        ...(critico > 0 ? [{ valor: fmtTonDec(critico), rotulo: "Críticos", nota: "conferir primeiro" }] : []),
        ...(maior ? [{ valor: fmtTonDec(maior.ton), rotulo: `Maior mês · ${maior.mes}` }] : []),
      ],
      linhas: [
        ["Média mensal", fmtTonDec(d.pendentes.mediaTon)],
        ...d.pendentes.meses.map((m) => [`${m.mes}${m.dtInicial || m.dtFinal ? ` (${m.dtInicial ?? "—"} a ${m.dtFinal ?? "—"})` : ""}`, fmtTonDec(m.ton)] as Linha),
      ],
      resumo: `${critico > 0 ? `${fmtTonDec(critico)} estão classificados como críticos e devem ser conferidos primeiro. ` : ""}As datas são períodos registrados nas ordens, não promessa de entrega ao cliente.`,
    });
    acoes.push(`Validar as pendências que bloqueiam pedidos reservados, começando por ${critico > 0 ? `${fmtTonDec(critico)} classificadas como críticas` : "critérios críticos"}.`);
  }

  if (d.reservados) {
    const r = d.reservados;
    const s = d.semReserva;
    hero.push({ valor: fmtTonDec(r.totalTon), rotulo: "Com reserva", nota: s ? `${fmtTonDec(s.totalTon)} sem reserva` : undefined });
    secoes.push({
      titulo: "Estoque reservado × sem reserva",
      grandes: [
        { valor: fmtTonDec(r.totalTon), rotulo: "Reservado", nota: fmtMoeda(r.totalValor) },
        ...(s ? [{ valor: fmtTonDec(s.totalTon), rotulo: "Sem reserva", nota: fmtMoeda(s.totalValor) }] : []),
      ],
      linhas: [
        ["Reservado · quantidade", fmtInt(r.totalQtd)],
        ...(s ? [["Sem reserva · quantidade", fmtInt(s.totalQtd)] as Linha] : []),
        ...(d.valorFaturado ? [["Previsto da reserva", fmtMoeda(r.previsao ?? r.totalTon * d.valorFaturado)] as Linha] : []),
      ],
      resumo: `A reserva é demanda vinculada, mas só vira saída e faturamento quando o pedido é atendido. ${s ? `${fmtTonDec(s.totalTon)} seguem sem destinação comercial registrada.` : ""}`,
    });
    acoes.push("Conferir os pedidos reservados que já estão completos e podem seguir para carregamento.");
  }

  if (d.foraDeLinha) {
    const e = d.foraDeLinha.posicaoEmLinha;
    const f = d.foraDeLinha.posicaoForaDeLinha;
    const t = d.foraDeLinha.posicaoTotal;
    const p = t.valorEstoque > 0 ? (e.valorEstoque / t.valorEstoque) * 100 : 0;
    hero.push({ valor: fmtTonDec(f.pesoTon), rotulo: "Fora de linha (peso)", nota: `${fmtInt(f.saldoFocco)} unidades · ${pct(100 - p)} do valor` });
    secoes.push({
      titulo: "Em linha × fora de linha",
      grandes: [
        { valor: fmtTonDec(f.pesoTon), rotulo: "Fora de linha (peso)", nota: `${fmtInt(f.itens)} itens` },
        { valor: fmtTonDec(e.pesoTon), rotulo: "Em linha (peso)", nota: `${fmtInt(e.itens)} itens` },
      ],
      linhas: [
        ["Em linha · saldo", fmtInt(e.saldoFocco)],
        ["Fora de linha · saldo", fmtInt(f.saldoFocco)],
        ["Em linha · valor", fmtMoeda(e.valorEstoque)],
        ["Fora de linha · valor", fmtMoeda(f.valorEstoque)],
        ["Valor em linha", pct(p)],
      ],
      resumo: "Fora de linha não faz mais parte da linha ativa: precisa de plano próprio de saída e não deve ser reposto. O valor é estimativa quando a planilha não traz o custo.",
    });
    acoes.push("Definir destino comercial para os itens fora de linha antes de qualquer reposição.");
  }

  if (d.paletas && d.paletas.totalPaletes > 0) {
    const media = d.paletas.diasRecebidos ? d.paletas.recebimento!.totalPaletes / d.paletas.diasRecebidos : 0;
    secoes.push({
      titulo: "Paletes por tamanho",
      grandes: [
        { valor: fmtInt(d.paletas.totalPaletes), rotulo: "Paletes em estoque" },
        ...(d.paletas.recebimento ? [{ valor: fmtInt(d.paletas.recebimento.totalPaletes), rotulo: "Recebidos", nota: media > 0 ? `${fmtBrMax(media, 1)} por dia` : undefined }] : []),
      ],
      linhas: d.paletas.porTamanho.map((x) => [x.tamanho, `${fmtInt(x.paletes)} paletes · ${fmtInt(x.und)} un`] as Linha),
      resumo: "A distribuição ajuda a preparar endereços pelo tamanho recebido. A contagem depende dos produtos mapeados e pode ficar abaixo do real.",
    });
  }

  if (!acoes.length && d.resumo) {
    acoes.push(`Transformar ${fmtTonDec(d.resumo.ton)} em saldo aplicado em pedidos atendidos, sem confundir valor previsto com faturamento.`);
  }

  return { secoes, hero, acoes };
}

export default function RelatorioLopas({ dados, onFechar }: { dados: VideoResumoProps; onFechar: () => void }) {
  const { secoes, hero, acoes } = montarSecoes(dados);
  const agora = new Date().toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  const sync = dados.sincronizacao?.em
    ? new Date(dados.sincronizacao.em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })
    : null;

  const meses = (dados.mensal ?? []).filter((m) => m.recebido > 0 || m.carregado > 0).map((m) => m.mes);
  const periodo = [
    dados.semana ? `semana ${dados.semana.rotulo}` : null,
    meses.length ? `meses de ${meses[0]}${meses.length > 1 ? ` a ${meses[meses.length - 1]}` : ""}` : null,
  ].filter(Boolean).join(" · ");

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
          <img src="/logo-lopas-trevo.png" alt="Lopas" className="size-14" />
          <div>
            <h1 className="font-serif text-2xl font-bold">Relatório de Estoque — CD Lopas</h1>
            <p className="text-xs text-neutral-600">
              {periodo ? `${periodo} · ` : ""}gerado em {agora}
              {sync ? ` · dados sincronizados em ${sync}` : ""}
            </p>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {hero.map((h) => (
            <div key={h.rotulo} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{h.rotulo}</p>
              <p className="mt-1 text-2xl font-bold leading-none tabular-nums text-[#4d7a1f]">{h.valor}</p>
              {h.nota && <p className="mt-1 text-[10px] leading-tight text-neutral-600">{h.nota}</p>}
            </div>
          ))}
        </section>

        {secoes.map((s, i) => (
          <section key={s.titulo} className="mt-6">
            <h2 className="border-b border-neutral-200 pb-1 text-sm font-bold uppercase tracking-wide text-[#4d7a1f]">
              {i + 1}. {s.titulo}
            </h2>
            {s.grandes.length > 0 && (
              <div className={`mt-2 grid gap-2 ${s.grandes.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
                {s.grandes.map((g) => (
                  <div key={g.rotulo} className="rounded-md border-l-2 border-[#73ae37] bg-neutral-50 px-3 py-2">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{g.rotulo}</p>
                    <p className="mt-0.5 text-xl font-bold leading-none tabular-nums text-neutral-900">{g.valor}</p>
                    {g.nota && <p className="mt-1 text-[10px] leading-tight text-neutral-600">{g.nota}</p>}
                  </div>
                ))}
              </div>
            )}
            {s.linhas.length > 0 && (
              <table className="mt-2 w-full text-xs">
                <tbody>
                  {s.linhas.map(([k, v], j) => (
                    <tr key={j} className="border-b border-neutral-100">
                      <td className="py-0.5 pr-4 text-neutral-600">{k}</td>
                      <td className="py-0.5 text-right font-mono font-semibold tabular-nums">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="mt-2 text-xs leading-snug text-neutral-800">
              <strong className="text-[#4d7a1f]">Leitura. </strong>
              {s.resumo}
            </p>
          </section>
        ))}

        <section className="mt-7 border-t-2 border-[#73ae37] pt-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#4d7a1f]">Para a próxima conferência</h2>
          <ol className="mt-2 space-y-1 text-xs leading-snug text-neutral-800">
            {acoes.map((t, i) => (
              <li key={t} className="flex gap-2">
                <span className="font-bold tabular-nums text-[#73ae37]">{i + 1}.</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[10px] leading-snug text-neutral-500">
            Sem histórico comparável, idade do estoque e cobertura completa das movimentações, não é possível afirmar tendências, causas ou prazo de escoamento. Horários em Brasília (UTC−3).
            {sync ? ` Última sincronização: ${sync}.` : " A data da última sincronização não está disponível."}
          </p>
        </section>
      </article>
    </div>,
    document.body,
  );
}
