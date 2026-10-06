/* Relatório Lopas — documento completo e sempre atualizado: cada tópico do
   painel é explicado e resumido a partir dos mesmos dados exibidos nas cenas,
   com resumo executivo no final. "Imprimir / salvar PDF" usa a impressão do navegador. */

import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
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
      resumo: `Hoje, ${fmtMoeda(r.valor)} estão aplicados no estoque do CD, distribuídos em ${fmtInt(r.itens)} itens. Esse é o capital que depende da saída dos produtos para voltar ao caixa. Os ${fmtMoeda(r.previsto)} de valor previsto são uma estimativa de venda, não faturamento realizado nem lucro. Para avaliar se esse estoque está bem dimensionado, é preciso acompanhar também a demanda e o tempo de permanência dos itens.`,
    });
    destaques.push(`Estoque de ${fmtMoeda(r.valor)} e ${fmtTonDec(r.ton)}.`);
  }

  if (d.kpis.length) {
    secoes.push({
      titulo: "Indicadores principais",
      explicacao: "Indicadores-chave exibidos no painel, com a leitura de cada um.",
      linhas: d.kpis.map((k) => [k.rotulo, k.valor] as Linha),
      resumo: "Os indicadores ajudam a localizar onde aprofundar a análise. Sozinhos, não mostram a causa de uma mudança: ocupação, reservas e movimentação precisam ser lidas em conjunto. As próximas seções fazem essa leitura sem tratar estimativas como resultados realizados.",
    });
  }

  if (d.unidades.length) {
    secoes.push({
      titulo: "Distribuição por unidade",
      explicacao: "Participação de cada unidade de negócio (Guarda-Roupas, Complementos, Salas…) no valor do estoque.",
      linhas: d.unidades.map((u) => [u.nome, `${u.valor} (${pct(u.share)})`] as Linha),
      resumo: (() => {
        const maior = [...d.unidades].sort((a, b) => b.share - a.share)[0];
        return maior ? `${maior.nome} concentra ${pct(maior.share)} do valor armazenado. É nessa unidade que uma melhora no giro pode liberar mais capital. Antes de reduzir ou reforçar a produção, vale cruzar essa participação com os pedidos e a saída dos produtos; concentração de estoque, por si só, não significa excesso.` : "Não há distribuição por unidade disponível.";
      })(),
    });
  }

  secoes.push({
    titulo: "Ocupação do CD",
    explicacao: "Percentual de posições de armazenagem ocupadas, considerando os dois centros de distribuição.",
    linhas: [
      ["Ocupação", pct(d.ocupacao.pct * 100)],
      ["Posições ocupadas", fmtInt(d.ocupacao.ocupados)],
      ["Posições livres", fmtInt(d.ocupacao.livres)],
      ...(d.ocupacao.bloqueados ? [["Posições bloqueadas", fmtInt(d.ocupacao.bloqueados)] as [string, string]] : []),
    ],
    resumo: `Há ${fmtInt(d.ocupacao.livres)} posições livres, enquanto ${pct(d.ocupacao.pct * 100)} das posições estão ocupadas.${d.ocupacao.bloqueados ? ` Outras ${fmtInt(d.ocupacao.bloqueados)} estão bloqueadas e não devem entrar na capacidade disponível.` : ""} Isso mostra a folga física do CD, mas não garante espaço adequado para qualquer produto: o tamanho dos paletes e a distribuição entre endereços também precisam ser considerados no próximo recebimento.`,
  });
  destaques.push(`Ocupação do CD em ${pct(d.ocupacao.pct * 100)}.`);

  if (d.semana) {
    secoes.push({
      titulo: `Recebimento da semana (${d.semana.rotulo})`,
      explicacao: "Toneladas recebidas por dia comparadas à meta diária, mais a divisão por turno.",
      linhas: [
        ["Total da semana", d.semana.total],
        ...d.semana.dias.map((x) => [`${x.dia} ${x.data}`, `${fmtBrMax(x.ton, 1)} t (meta ${fmtBrMax(x.meta, 1)} t)`] as Linha),
        ...d.turnos.map((t) => [`Turno ${t.nome}`, pct(t.pct)] as Linha),
      ],
      resumo: (() => {
        const dias = d.semana?.dias ?? [];
        const atingidos = dias.filter(x => x.ton >= x.meta).length;
        const meta = dias.reduce((s, x) => s + x.meta, 0);
        const total = dias.reduce((s, x) => s + x.ton, 0);
        return `Nos ${dias.length} dias apresentados, entraram ${fmtTonDec(total)}; a meta foi alcançada em ${atingidos} deles.${meta > 0 ? ` O volume equivale a ${pct(total / meta * 100)} da meta somada desses dias.` : ""} Dias abaixo da meta merecem uma conferência da programação e das entregas efetivas, sem atribuir a diferença à equipe antes de entender o que estava previsto.`;
      })(),
    });
  }

  const mes = (d.mensal ?? []).filter((m) => m.recebido > 0 || m.carregado > 0);
  if (mes.length) {
    const rec = mes.reduce((s, m) => s + m.recebido, 0);
    const car = mes.reduce((s, m) => s + m.carregado, 0);
    const saude = rec > 0 ? (car / rec) * 100 : 0;
    secoes.push({
      titulo: "Saúde do estoque (recebido × carregado)",
      explicacao: "Comparação das entradas e saídas registradas por mês. Meses com zero devem ser conferidos: zero pode representar ausência de movimento ou informação ainda não disponível.",
      linhas: [...mes.map((m) => [m.mes, `rec. ${fmtBrMax(m.recebido, 1)} t · carr. ${fmtBrMax(m.carregado, 1)} t`] as Linha), ["Saúde acumulada", pct(saude)]],
      resumo: `No período apresentado, foram recebidas ${fmtTonDec(rec)} e carregadas ${fmtTonDec(car)}.${rec > 0 ? ` A relação entre saída e entrada foi de ${pct(saude)}.` : " Sem recebimento registrado, não é possível calcular a relação entre saída e entrada."} ${car > rec ? `As saídas superam as entradas em ${fmtTonDec(car - rec)}. Essa diferença pode incluir estoque de períodos anteriores; não deve ser interpretada automaticamente como eficiência.` : car < rec ? `As entradas superam as saídas em ${fmtTonDec(rec - car)}. Se as duas bases cobrem o mesmo período e os mesmos movimentos, isso indica pressão de aumento sobre o estoque.` : "Entradas e saídas têm o mesmo volume registrado."} ${mes.some(m => m.recebido === 0 || m.carregado === 0) ? "Há meses com uma das bases zerada. Antes de concluir sobre o giro, confirme se os registros estão completos." : "A conclusão sobre o giro depende de as duas bases terem a mesma cobertura."}`,
    });
    destaques.push(`Saúde do estoque em ${pct(saude)} (carregado ÷ recebido).`);
  }

  if (d.avarias) {
    secoes.push({
      titulo: "Avarias",
      explicacao: "Volumes danificados (soma da quantidade), com custo e distribuição mensal.",
      linhas: [["Total de volumes", fmtInt(d.avarias.total)], ["Custo", d.avarias.custo],
        ...(d.avarias.tipos ?? []).map((t) => [`Tipo: ${t.tipo}`, `${fmtInt(t.total)} vol. (${pct(t.pct)} de incidência)`] as Linha),
        ...d.avarias.meses.map((m) => [m.mes, fmtInt(m.qtd)] as Linha)],
      resumo: (() => {
        const pico = [...d.avarias.meses].sort((a, b) => b.qtd - a.qtd)[0];
        const motivo = [...(d.avarias.tipos ?? [])].sort((a, b) => b.total - a.total)[0];
        return `Foram registrados ${fmtInt(d.avarias.total)} volumes com avaria, pela soma das quantidades, não pela contagem de ocorrências.${pico ? ` ${pico.mes} concentra o maior volume mensal: ${fmtInt(pico.qtd)}.` : ""}${motivo ? ` O motivo de maior volume é ${motivo.tipo}, com ${fmtInt(motivo.total)} volumes; esse é um bom ponto de partida para revisar manuseio, embalagem e conferência.` : ""} O custo informado é parcial e não representa toda a perda. Sem o volume movimentado de cada mês, também não é possível dizer que a taxa de avarias melhorou ou piorou.`;
      })(),
    });
    destaques.push(`${fmtInt(d.avarias.total)} volumes avariados.`);
  }

  if (d.pendentes) {
    const prod = d.producaoSemanal ?? [];
    secoes.push({
      titulo: "Produção pendente",
      explicacao: "Ordens de produção em aberto no sistema, com toneladas, datas de produção por mês e a programação diária.",
      linhas: [
        ["Itens pendentes", fmtInt(d.pendentes.itens)],
        ["Total", fmtTonDec(d.pendentes.totalTon)],
        ["Média mensal", fmtTonDec(d.pendentes.mediaTon)],
        ...d.pendentes.meses.map((m) => [`${m.mes}${m.dtInicial || m.dtFinal ? ` (${m.dtInicial ?? "—"} a ${m.dtFinal ?? "—"})` : ""}`, fmtTonDec(m.ton)] as Linha),
        ...prod.map((x) => [`${x.dia} ${x.data}`, `${fmtInt(x.ordens)} ordens · prev. ${fmtBrMax(x.tonPrevisto, 1)} t · pend. ${fmtBrMax(x.tonPendente, 1)} t`] as Linha),
      ],
      resumo: (() => {
        const critico = d.pendentes.fatias.filter(x => /cr[ií]tico/i.test(x.rotulo)).reduce((s, x) => s + x.ton, 0);
        const maior = [...d.pendentes.meses].sort((a, b) => b.ton - a.ton)[0];
        return `Ainda estão em aberto ${fmtInt(d.pendentes.itens)} itens, somando ${fmtTonDec(d.pendentes.totalTon)}.${critico > 0 ? ` Desse volume, ${fmtTonDec(critico)} estão classificados como críticos e devem ser conferidos primeiro com a produção.` : ""}${maior ? ` A maior concentração de peso está em ${maior.mes}, com ${fmtTonDec(maior.ton)}.` : ""} As datas abaixo são os períodos registrados nas ordens, não uma promessa de entrega ao cliente. A prioridade é validar quais pendências continuam abertas e quais afetam pedidos reservados.`;
      })(),
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
        ...(d.valorFaturado ? [["Valor previsto da reserva", fmtMoeda(r.previsao ?? r.totalTon * d.valorFaturado)]] as Linha[] : []),
      ],
      resumo: `${fmtTonDec(r.totalTon)} já têm reserva comercial, com ${fmtMoeda(r.totalValor)} a custo.${s ? ` Outros ${fmtTonDec(s.totalTon)} seguem sem reserva, representando ${fmtMoeda(s.totalValor)} ainda sem destinação comercial registrada.` : ""} A reserva indica demanda vinculada, mas só se transforma em saída e faturamento quando o pedido é atendido. Vale conferir primeiro o que já pode ser separado e o que depende de produção, para não manter espaço ocupado por pedidos prontos para embarque.`,
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
      resumo: `Os itens fora de linha somam ${fmtInt(f.saldoFocco)} unidades e ${fmtTonDec(f.pesoTon)}. Como não fazem mais parte da linha ativa, merecem um plano específico de saída: verificar reservas existentes, procurar demanda e avaliar alternativas comerciais antes de produzir ou repor esses itens. O valor de ${fmtMoeda(f.valorEstoque)} deve ser tratado como estimativa quando a planilha não informa o custo; ele não comprova uma perda realizada.`,
    });
    destaques.push(`${pct(p)} do valor do estoque está em linha.`);
  }

  if (d.paletas && d.paletas.totalPaletes > 0) {
    secoes.push({
      titulo: "Paletes",
      explicacao: "Paletes armazenados por tamanho, com itens e unidades.",
      linhas: [...d.paletas.porTamanho.map((x) => [x.tamanho, `${fmtInt(x.paletes)} paletes · ${fmtInt(x.und)} un`] as Linha), ["Total", `${fmtInt(d.paletas.totalPaletes)} paletes`]],
      resumo: `O estoque mapeado ocupa ${fmtInt(d.paletas.totalPaletes)} paletes.${d.paletas.recebimento ? ` O recebimento mapeado soma ${fmtInt(d.paletas.recebimento.totalPaletes)} paletes${d.paletas.diasRecebidos ? ` em ${fmtInt(d.paletas.diasRecebidos)} dias, uma média de ${fmtBrMax(d.paletas.recebimento.totalPaletes / d.paletas.diasRecebidos, 1)} por dia` : ""}.` : ""} Essa distribuição ajuda a preparar os endereços conforme o tamanho recebido. A contagem depende dos produtos encontrados na configuração de paletes e pode ficar abaixo do real se houver itens sem cadastro; não deve ser confundida com a ocupação total de posições.`,
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

  const meses = (dados.mensal ?? []).filter((m) => m.recebido > 0 || m.carregado > 0).map((m) => m.mes);
  const periodo = [
    dados.semana ? `semana ${dados.semana.rotulo}` : null,
    meses.length ? `meses de ${meses[0]}${meses.length > 1 ? ` a ${meses[meses.length - 1]}` : ""}` : null,
  ].filter(Boolean).join(" · ");

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
            {periodo && <p className="text-xs font-semibold text-neutral-800">Período analisado: {periodo}</p>}
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
