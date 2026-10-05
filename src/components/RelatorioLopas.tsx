/* Relatório Lopas — documento completo e sempre atualizado: cada tópico do
   painel é explicado e resumido a partir dos mesmos dados exibidos nas cenas,
   com resumo executivo no final. "Imprimir / salvar PDF" usa a impressão do navegador. */

import { createPortal } from "react-dom";
import { fmtBrMax, fmtInt, fmtMoeda, fmtTonDec } from "@/lib/format";
import type { VideoResumoProps } from "./VideoResumoDashboard";

type Linha = [string, string];
type Secao = { titulo: string; explicacao: string; linhas: Linha[]; resumo: string };

const pct = (v: number) => `${fmtBrMax(v, 1)}%`;

function montarSecoes(d: VideoResumoProps): { secoes: Secao[]; destaques: string[] } {
  const secoes: Secao[] = [];
  const destaques: string[] = [];

  if (d.resumo) {
    const r = d.resumo;
    secoes.push({
      titulo: "Posição geral do estoque",
      explicacao: "Retrato consolidado do CD: valor a custo, valor previsto de venda, peso em toneladas, saldo em unidades e quantidade de itens ativos.",
      linhas: [["Valor em estoque", fmtMoeda(r.valor)], ["Valor previsto", fmtMoeda(r.previsto)], ["Peso", fmtTonDec(r.ton)], ["Saldo (un)", fmtInt(r.saldo)], ["Itens", fmtInt(r.itens)]],
      resumo: `O CD mantém ${fmtInt(r.saldo)} unidades em ${fmtInt(r.itens)} itens, somando ${fmtTonDec(r.ton)} e ${fmtMoeda(r.valor)} a custo.`,
    });
    destaques.push(`Estoque de ${fmtMoeda(r.valor)} e ${fmtTonDec(r.ton)}.`);
  }

  if (d.kpis.length) {
    secoes.push({
      titulo: "Indicadores principais",
      explicacao: "Indicadores-chave exibidos no painel, com a leitura de cada um.",
      linhas: d.kpis.map((k) => [k.rotulo, k.valor] as Linha),
      resumo: d.kpis.map((k) => k.detalhe).filter(Boolean).join(" "),
    });
  }

  if (d.unidades.length) {
    secoes.push({
      titulo: "Distribuição por unidade",
      explicacao: "Participação de cada unidade de negócio (Guarda-Roupas, Complementos, Salas…) no valor do estoque.",
      linhas: d.unidades.map((u) => [u.nome, `${u.valor} (${pct(u.share)})`] as Linha),
      resumo: `A maior concentração está em ${[...d.unidades].sort((a, b) => b.share - a.share)[0]!.nome}.`,
    });
  }

  secoes.push({
    titulo: "Ocupação do CD",
    explicacao: "Percentual de posições de armazenagem ocupadas, considerando os dois centros de distribuição.",
    linhas: [["Ocupação", pct(d.ocupacao.pct)], ["Posições ocupadas", fmtInt(d.ocupacao.ocupados)], ["Posições livres", fmtInt(d.ocupacao.livres)]],
    resumo: `${pct(d.ocupacao.pct)} das posições estão ocupadas; ${fmtInt(d.ocupacao.livres)} seguem livres.`,
  });
  destaques.push(`Ocupação do CD em ${pct(d.ocupacao.pct)}.`);

  if (d.semana) {
    secoes.push({
      titulo: `Recebimento da semana (${d.semana.rotulo})`,
      explicacao: "Toneladas recebidas por dia comparadas à meta diária, mais a divisão por turno.",
      linhas: [
        ["Total da semana", d.semana.total],
        ...d.semana.dias.map((x) => [`${x.dia} ${x.data}`, `${fmtBrMax(x.ton, 1)} t (meta ${fmtBrMax(x.meta, 1)} t)`] as Linha),
        ...d.turnos.map((t) => [`Turno ${t.nome}`, pct(t.pct)] as Linha),
      ],
      resumo: `Recebimento total da semana: ${d.semana.total}.`,
    });
  }

  const mes = (d.mensal ?? []).filter((m) => m.recebido > 0 || m.carregado > 0);
  if (mes.length) {
    const rec = mes.reduce((s, m) => s + m.recebido, 0);
    const car = mes.reduce((s, m) => s + m.carregado, 0);
    const saude = rec > 0 ? (car / rec) * 100 : 0;
    secoes.push({
      titulo: "Saúde do estoque (recebido × carregado)",
      explicacao: "Saúde = toneladas carregadas ÷ toneladas recebidas. Perto de 100% o estoque gira no mesmo ritmo em que entra; abaixo, ele acumula.",
      linhas: [...mes.map((m) => [m.mes, `rec. ${fmtBrMax(m.recebido, 1)} t · carr. ${fmtBrMax(m.carregado, 1)} t`] as Linha), ["Saúde acumulada", pct(saude)]],
      resumo: `Foram recebidas ${fmtTonDec(rec)} e carregadas ${fmtTonDec(car)} — saúde de ${pct(saude)}.`,
    });
    destaques.push(`Saúde do estoque em ${pct(saude)} (carregado ÷ recebido).`);
  }

  if (d.avarias) {
    secoes.push({
      titulo: "Avarias",
      explicacao: "Volumes danificados (soma da quantidade), com custo e distribuição mensal.",
      linhas: [["Total de volumes", fmtInt(d.avarias.total)], ["Custo", d.avarias.custo], ...d.avarias.meses.map((m) => [m.mes, fmtInt(m.qtd)] as Linha)],
      resumo: `${fmtInt(d.avarias.total)} volumes avariados no período.`,
    });
    destaques.push(`${fmtInt(d.avarias.total)} volumes avariados.`);
  }

  if (d.pendentes) {
    secoes.push({
      titulo: "Produção pendente",
      explicacao: "Ordens de produção em aberto no sistema, com toneladas totais e média mensal.",
      linhas: [["Itens pendentes", fmtInt(d.pendentes.itens)], ["Total", fmtTonDec(d.pendentes.totalTon)], ["Média mensal", fmtTonDec(d.pendentes.mediaTon)]],
      resumo: `${fmtInt(d.pendentes.itens)} itens pendentes somam ${fmtTonDec(d.pendentes.totalTon)}.`,
    });
  }

  if (d.reservados) {
    const r = d.reservados;
    const s = d.semReserva;
    secoes.push({
      titulo: "Estoque reservado × sem reserva",
      explicacao: "Reservado = itens com reserva comercial. Sem reserva = saldo disponível (saldo − reservado). Valores calculados por item (quantidade × custo médio e × peso).",
      linhas: [
        ["Reservado · quantidade", fmtInt(r.totalQtd)], ["Reservado · peso", fmtTonDec(r.totalTon)], ["Reservado · valor", fmtMoeda(r.totalValor)],
        ...(s ? [["Sem reserva · quantidade", fmtInt(s.totalQtd)], ["Sem reserva · peso", fmtTonDec(s.totalTon)], ["Sem reserva · valor", fmtMoeda(s.totalValor)]] as Linha[] : []),
        ...(d.valorFaturado ? [["Valor previsto da reserva", fmtMoeda(r.totalTon * d.valorFaturado)]] as Linha[] : []),
      ],
      resumo: `${fmtTonDec(r.totalTon)} (${fmtMoeda(r.totalValor)}) estão reservadas${s ? ` e ${fmtTonDec(s.totalTon)} (${fmtMoeda(s.totalValor)}) seguem disponíveis sem reserva` : ""}.`,
    });
    destaques.push(`Reservado: ${fmtTonDec(r.totalTon)}${s ? ` · Sem reserva: ${fmtTonDec(s.totalTon)}` : ""}.`);
  }

  if (d.foraDeLinha) {
    const e = d.foraDeLinha.posicaoEmLinha;
    const f = d.foraDeLinha.posicaoForaDeLinha;
    const t = d.foraDeLinha.posicaoTotal;
    const p = t.valorEstoque > 0 ? (e.valorEstoque / t.valorEstoque) * 100 : 0;
    secoes.push({
      titulo: "Em linha × fora de linha",
      explicacao: "Compara itens ativos (em linha) com descontinuados (fora de linha): quantidade de itens, saldo, peso e valor.",
      linhas: [
        ["Em linha · itens", fmtInt(e.itens)], ["Em linha · saldo", fmtInt(e.saldoFocco)], ["Em linha · peso", fmtTonDec(e.pesoTon)], ["Em linha · valor", fmtMoeda(e.valorEstoque)],
        ["Fora de linha · itens", fmtInt(f.itens)], ["Fora de linha · saldo", fmtInt(f.saldoFocco)], ["Fora de linha · peso", fmtTonDec(f.pesoTon)], ["Fora de linha · valor", fmtMoeda(f.valorEstoque)],
      ],
      resumo: `${pct(p)} do valor está em linha; ${fmtMoeda(f.valorEstoque)} estão em itens fora de linha.`,
    });
    destaques.push(`${pct(p)} do valor do estoque está em linha.`);
  }

  if (d.saidasCD) {
    secoes.push({
      titulo: "Saídas do CD",
      explicacao: "Toneladas expedidas e valor faturado por mês.",
      linhas: [...d.saidasCD.meses.map((m) => [m.mes, `${fmtBrMax(m.tonelada, 1)} t · ${fmtMoeda(m.faturado)}`] as Linha), ["Total", `${fmtTonDec(d.saidasCD.totalTonelada)} · ${fmtMoeda(d.saidasCD.totalFaturado)}`]],
      resumo: `Saíram ${fmtTonDec(d.saidasCD.totalTonelada)}, faturando ${fmtMoeda(d.saidasCD.totalFaturado)}.`,
    });
  }

  if (d.paletas && d.paletas.totalPaletes > 0) {
    secoes.push({
      titulo: "Paletes",
      explicacao: "Paletes armazenados por tamanho, com itens e unidades.",
      linhas: [...d.paletas.porTamanho.map((x) => [x.tamanho, `${fmtInt(x.paletes)} paletes · ${fmtInt(x.und)} un`] as Linha), ["Total", `${fmtInt(d.paletas.totalPaletes)} paletes`]],
      resumo: `${fmtInt(d.paletas.totalPaletes)} paletes com ${fmtInt(d.paletas.totalItens)} itens.`,
    });
  }

  if (d.abc?.estoque?.length) {
    secoes.push({
      titulo: "Curva ABC do estoque",
      explicacao: "Classifica os itens pelo valor: A concentra a maior parte do valor com poucos itens; C tem muitos itens de baixo valor.",
      linhas: d.abc.estoque.map((c) => [`Classe ${c.classe}`, `${fmtInt(c.itens)} itens (${pct(c.pctItens)}) · ${pct(c.pctValor)} do valor`] as Linha),
      resumo: "Priorize controle e acuracidade nos itens da classe A.",
    });
  }

  return { secoes, destaques };
}

export default function RelatorioLopas({ dados, onFechar }: { dados: VideoResumoProps; onFechar: () => void }) {
  const { secoes, destaques } = montarSecoes(dados);
  const agora = new Date().toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
  const sync = dados.sincronizacao?.em
    ? new Date(dados.sincronizacao.em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    : null;

  return createPortal(
    <div onClick={(e) => e.stopPropagation()} className="relatorio-lopas-root fixed inset-0 z-[200] overflow-y-auto bg-neutral-100 text-neutral-900">
      <div className="no-print sticky top-0 z-10 flex items-center justify-end gap-2 border-b bg-white px-4 py-2 shadow-sm">
        <button type="button" onClick={() => window.print()} className="cursor-pointer rounded-full bg-[#73ae37] px-4 py-1.5 text-xs font-bold tracking-widest text-white uppercase hover:opacity-90">
          Imprimir / salvar PDF
        </button>
        <button type="button" onClick={onFechar} className="cursor-pointer rounded-full border px-4 py-1.5 text-xs font-bold tracking-widest uppercase hover:bg-neutral-100">
          Fechar
        </button>
      </div>

      <article className="mx-auto my-4 max-w-3xl bg-white p-8 shadow sm:p-12">
        <header className="flex items-center gap-4 border-b-2 border-[#73ae37] pb-4">
          <img src="/logo-lopas-trevo.png" alt="Lopas" className="size-16" />
          <div>
            <h1 className="font-serif text-2xl font-bold">Relatório de Estoque — CD Lopas</h1>
            <p className="text-xs text-neutral-600">Gerado em {agora}{sync ? ` · dados sincronizados em ${sync}` : ""}</p>
            <p className="text-[10px] font-semibold tracking-[0.25em] text-[#73ae37] uppercase">Movidos pela fé</p>
          </div>
        </header>

        {secoes.map((s, i) => (
          <section key={s.titulo} className="mt-6">
            <h2 className="text-base font-bold text-[#4d7a1f]">{i + 1}. {s.titulo}</h2>
            <p className="mt-1 text-xs text-neutral-600">{s.explicacao}</p>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {s.linhas.map(([k, v], j) => (
                  <tr key={j} className="border-b border-neutral-200">
                    <td className="py-1 pr-4">{k}</td>
                    <td className="py-1 text-right font-mono font-semibold">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 rounded bg-[#73ae37]/10 px-3 py-2 text-xs"><strong>Resumo:</strong> {s.resumo}</p>
          </section>
        ))}

        <section className="mt-8 border-t-2 border-[#73ae37] pt-4">
          <h2 className="text-lg font-bold text-[#4d7a1f]">Resumo executivo</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {destaques.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </section>
      </article>
    </div>,
    document.body,
  );
}
