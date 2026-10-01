import { fmtBr, fmtInt, fmtTonDec, fmtBrMax } from "@/lib/format";
import type { VideoUnidade, VideoOcupacao, VideoMes, VideoAvarias, VideoPendentes, VideoReservados } from "@/components/VideoResumoDashboard";
import type { VideoForaDeLinha } from "@/components/CenasApresentacao";

type Resumo = { valor: number; previsto: number; ton: number; saldo: number; itens: number };
type Segmento = { t: string; n?: boolean };
type Mensagem = Segmento[];

export type InterpretadorProps = {
  resumo?: Resumo | null;
  unidades: VideoUnidade[];
  ocupacao: VideoOcupacao;
  semana: { rotulo: string; total: string; dias: { dia: string; ton: number; meta: number }[] } | null;
  mensal?: VideoMes[];
  avarias?: VideoAvarias;
  pendentes?: VideoPendentes;
  reservados?: VideoReservados;
  foraDeLinha?: VideoForaDeLinha | null;
  valorFaturado?: number;
};

const num = (v: number | string): Segmento => ({ t: String(v), n: true });
const txt = (s: string): Segmento => ({ t: s });

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const SAUDACOES: Mensagem[] = [
  [txt("Olá, seja bem-vindo ao painel do estoque Lopas.")],
  [txt("Bem-vindo de volta ao painel de controle do CD Lopas.")],
  [txt("Olá! Vamos ao panorama do estoque Lopas neste momento.")],
  [txt("Bom dia no CD Lopas — aqui está o resumo do estoque.")],
  [txt("Chegou a hora de conferir os números do CD. Bem-vindo.")],
  [txt("Olá! O painel do estoque Lopas está pronto para você.")],
];

const ENCERRAMENTOS: Mensagem[] = [
  [txt("Tudo pronto para acompanhar o painel. Bom trabalho.")],
  [txt("Painel carregado — bom turno a todos.")],
  [txt("Esses são os números do momento. Bom trabalho.")],
  [txt("Dados atualizados e prontos para ação. Vamos trabalhar.")],
  [txt("O painel está no ar. Bom trabalho e mãos à obra.")],
];

/** Gera mensagens variadas interpretando os dados de estoque — sem API externa. */
export function interpretarLocal(p: InterpretadorProps): Mensagem[] {
  const blocos: Mensagem[] = [];

  // ── Massa + valor estimado ──
  if (p.resumo) {
    const vEst = `R$ ${fmtBr(p.resumo.previsto / 1e6, 2)} mi`;
    blocos.push(pick([
      [txt("Nosso estoque hoje soma "), num(fmtTonDec(p.resumo.ton)), txt(", com valor previsto de "), num(vEst), txt(" em potencial de venda.")],
      [txt("A massa total do CD é de "), num(fmtTonDec(p.resumo.ton)), txt(" — um valor previsto de "), num(vEst), txt(" em mercadoria.")],
      [txt("Somando "), num(fmtTonDec(p.resumo.ton)), txt(" em estoque, o potencial de venda chega a "), num(vEst), txt(".")],
      [txt("Hoje o CD acumula "), num(fmtTonDec(p.resumo.ton)), txt(" de produto, valendo previstos "), num(vEst), txt(" em venda.")],
    ]));

    blocos.push(pick([
      [txt("São "), num(fmtInt(p.resumo.saldo)), txt(" peças em "), num(fmtInt(p.resumo.itens)), txt(" itens ativos do catálogo.")],
      [txt("Temos "), num(fmtInt(p.resumo.saldo)), txt(" peças distribuídas em "), num(fmtInt(p.resumo.itens)), txt(" itens do CD.")],
      [txt("O catálogo conta com "), num(fmtInt(p.resumo.itens)), txt(" itens ativos e "), num(fmtInt(p.resumo.saldo)), txt(" peças em saldo.")],
      [txt("Ao todo, "), num(fmtInt(p.resumo.itens)), txt(" itens somam "), num(fmtInt(p.resumo.saldo)), txt(" peças no CD.")],
    ]));
  }

  // ── Ocupação ──
  const pctTxt = `${fmtBr(p.ocupacao.pct * 100, 1)}%`;
  const totalPos = p.ocupacao.ocupados + p.ocupacao.livres;
  blocos.push(pick([
    [txt("A ocupação do CD está em "), num(pctTxt), txt(" — "), num(fmtInt(p.ocupacao.ocupados)), txt(" endereços ocupados de "), num(fmtInt(totalPos)), txt(" totais.")],
    [txt("Com "), num(pctTxt), txt(" de ocupação, "), num(fmtInt(p.ocupacao.ocupados)), txt(" de "), num(fmtInt(totalPos)), txt(" posições estão em uso.")],
    [txt("O CD opera a "), num(pctTxt), txt(" de capacidade — "), num(fmtInt(p.ocupacao.livres)), txt(" posições ainda livres.")],
    [txt("A ocupação atual é de "), num(pctTxt), txt(", com "), num(fmtInt(totalPos)), txt(" posições no total do armazém.")],
  ]));

  // ── Em linha vs Fora de linha ──
  if (p.foraDeLinha) {
    const em = p.foraDeLinha.posicaoEmLinha;
    const fora = p.foraDeLinha.posicaoForaDeLinha;
    blocos.push(pick([
      [txt("Em linha: "), num(fmtTonDec(em.pesoTon)), txt(" em "), num(fmtInt(em.itens)), txt(" itens ativos — a espinha dorsal do CD.")],
      [txt("O estoque em linha soma "), num(fmtTonDec(em.pesoTon)), txt(" distribuídos em "), num(fmtInt(em.itens)), txt(" itens ativos.")],
      [txt("Temos "), num(fmtTonDec(em.pesoTon)), txt(" em linha, espalhados por "), num(fmtInt(em.itens)), txt(" itens do catálogo.")],
    ]));

    blocos.push(pick([
      [txt("Fora de linha: "), num(fmtTonDec(fora.pesoTon)), txt(" em "), num(fmtInt(fora.itens)), txt(" itens — opportunity de revisão para giro ou baixa.")],
      [txt("Há "), num(fmtTonDec(fora.pesoTon)), txt(" fora de linha em "), num(fmtInt(fora.itens)), txt(" itens — vale uma revisão de giro.")],
      [txt("Fora de linha acumulamos "), num(fmtTonDec(fora.pesoTon)), txt(" em "), num(fmtInt(fora.itens)), txt(" itens sem giro ativo.")],
    ]));
  }

  // ── Recebimento da semana ──
  if (p.semana) {
    const aceitos = p.semana.dias.filter((d) => d.ton >= d.meta).length;
    const tonSemana = p.semana.dias.reduce((s, d) => s + d.ton, 0);
    blocos.push(pick([
      [txt("Na última semana recebemos "), num(fmtTonDec(tonSemana)), txt(", com "), num(aceitos), txt(" de "), num(p.semana.dias.length), txt(" dias batendo a meta.")],
      [txt("O recebimento da semana foi de "), num(fmtTonDec(tonSemana)), txt(" — "), num(aceitos), txt(" de "), num(p.semana.dias.length), txt(" dias acima da meta.")],
      [txt("Recebemos "), num(fmtTonDec(tonSemana)), txt(" nos últimos dias, com "), num(aceitos), txt(" de "), num(p.semana.dias.length), txt(" dias no verde.")],
    ]));
  }

  // ── Recebido vs carregado (mensal) ──
  if (p.mensal?.length) {
    const totRec = p.mensal.reduce((s, m) => s + m.recebido, 0);
    const totCar = p.mensal.reduce((s, m) => s + m.carregado, 0);
    const eficiencia = fmtBrMax((totCar / Math.max(totRec, 1)) * 100, 1);
    blocos.push(pick([
      [txt("De "), num(fmtTonDec(totRec)), txt(" recebidas este ano, "), num(fmtTonDec(totCar)), txt(" já foram carregadas — "), num(`${eficiencia}%`), txt(" de eficiência.")],
      [txt("Este ano recebemos "), num(fmtTonDec(totRec)), txt(" e carregamos "), num(fmtTonDec(totCar)), txt(" — eficiência de "), num(`${eficiencia}%`), txt(".")],
      [txt("O fluxo do ano soma "), num(fmtTonDec(totRec)), txt(" recebidas contra "), num(fmtTonDec(totCar)), txt(" carregadas — "), num(`${eficiencia}%`), txt(" de aproveitamento.")],
    ]));
  }

  // ── Estoque reservado ──
  if (p.reservados) {
    blocos.push(pick([
      [txt("Estoque reservado: "), num(fmtTonDec(p.reservados.totalTon)), txt(" em "), num(fmtInt(p.reservados.totalQtd)), txt(" peças — "), num(`R$ ${fmtBr(p.reservados.totalValor / 1e6, 2)} mi`), txt(" em vendas futuras.")],
      [txt("Temos "), num(fmtTonDec(p.reservados.totalTon)), txt(" reservados em "), num(fmtInt(p.reservados.totalQtd)), txt(" peças, somando "), num(`R$ ${fmtBr(p.reservados.totalValor / 1e6, 2)} mi`), txt(".")],
      [txt("O reservado totaliza "), num(fmtTonDec(p.reservados.totalTon)), txt(" — "), num(`R$ ${fmtBr(p.reservados.totalValor / 1e6, 2)} mi`), txt(" comprometidos em vendas.")],
    ]));
  }

  // ── Avarias ──
  if (p.avarias?.total) {
    const custoSeg = p.avarias.custo ? [txt(" — custo de "), num(p.avarias.custo)] : [];
    blocos.push(pick([
      [txt("Avarias registradas: "), num(fmtInt(p.avarias.total)), txt(" volumes no ano"), ...custoSeg, txt(".")],
      [txt("Acumulamos "), num(fmtInt(p.avarias.total)), txt(" volumes com avaria no ano"), ...custoSeg, txt(".")],
      [txt("Ocorrências de avaria somam "), num(fmtInt(p.avarias.total)), txt(" volumes neste ano"), ...custoSeg, txt(".")],
    ]));
  }

  // ── Pendentes ──
  if (p.pendentes?.itens) {
    blocos.push(pick([
      [txt("Pendentes de produção: "), num(fmtInt(p.pendentes.itens)), txt(" lotes somando "), num(fmtTonDec(p.pendentes.totalTon)), txt(" — meses anteriores em estado crítico, o mês atual no prazo.")],
      [txt("Há "), num(fmtInt(p.pendentes.itens)), txt(" lotes pendentes totalizando "), num(fmtTonDec(p.pendentes.totalTon)), txt(" — os meses anteriores estão críticos, mas o atual segue no prazo.")],
      [txt("Produção pendente: "), num(fmtInt(p.pendentes.itens)), txt(" lotes com "), num(fmtTonDec(p.pendentes.totalTon)), txt(" — meses anteriores críticos, mês atual dentro do prazo.")],
    ]));
  }

  // ── Categoria destaque ──
  if (p.unidades.length) {
    const top = [...p.unidades].sort((a, b) => b.share - a.share)[0];
    blocos.push(pick([
      [txt("Guarda-Roupas lidera com "), num(`${fmtBr(top.share, 1)}%`), txt(" de participação, seguido por Salas e Complementos.")],
      [txt("A categoria Guarda-Roupas representa "), num(`${fmtBr(top.share, 1)}%`), txt(" do estoque — a maior do CD.")],
      [txt("Com "), num(`${fmtBr(top.share, 1)}%`), txt(" de participação, Guarda-Roupas segue como a unidade destaque.")],
    ]));
  }

  // Embaralha a ordem dos blocos do meio e monta com saudação + encerramento
  const meio = shuffle(blocos);
  return [pick(SAUDACOES), ...meio, pick(ENCERRAMENTOS)];
}
