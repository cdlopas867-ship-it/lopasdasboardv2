/* Excel analítico LOPAS — monta um único .xlsx com as abas do painel (capa,
   resumo consolidado, estoque, recebimento, reservas, fora de linha, saídas do
   CD, avarias, curva ABC, pendentes, produção, produtividade e QLP · CD) no
   visual da marca e com FÓRMULAS do Excel: o resumo e os totais apontam para as
   abas com referências e `=SUM()`, então o arquivo continua vivo depois de
   aberto — quem editar uma linha base vê o resumo recalcular.

   O ExcelJS entra só no clique (import dinâmico), para não pesar o bundle. */

import type { CellValue, Workbook, Worksheet } from "exceljs";
import type { VideoResumoProps } from "@/components/VideoResumoDashboard";
import { PRODUTIVIDADE } from "@/data/produtividade";
import { QLP_CD } from "@/data/qlp-cd";
import {
  ITENS_FORA_DE_LINHA,
  POSICAO_EM_LINHA,
  POSICAO_FORA_DE_LINHA,

  POSICAO_TOTAL,
  type PosicaoEstoque,
} from "@/data/fora-de-linha";

/* ---------- paleta da marca (a mesma das cenas) ---------- */

const VERDE = "FF2F4415";
const VERDE_MEDIO = "FF4A6B20";
const VERDE_CLARO = "FFE9EFDC";
const VERDE_BANDA = "FFF2F6E7";
const AMBAR = "FFE08A28";
const AMBAR_CLARO = "FFFBF0DD";
const ZEBRA = "FFF6F8F1";
const BORDA = "FFC7D0B4";
const BORDA_FINA = "FFDDE3D0";
const BRANCO = "FFFFFFFF";
const TEXTO = "FF1F2418";
const CINZA = "FF6B7566";
const CINZA_CLARO = "FF9CA59A";

/* ---------- formatos numéricos ---------- */

const MOEDA = '"R$" #,##0.00';
const MOEDA0 = '"R$" #,##0';
const INT = "#,##0";
const TON = "#,##0.0";
const PCT = '0.0"%"';
const ANOS = '0.0" anos"';

/* ---------- tipos auxiliares ---------- */

type Formula = { formula: string; result?: number | string };
type Valor = string | number | Formula | null | undefined;
type ItemLista = [string, Valor, (string | undefined)?, (string | undefined)?];
type Coluna = { titulo: string; fmt?: string; align?: "left" | "center" | "right" };
type Refs = Record<string, string>;

const LINHA_INICIAL = 6;

/** Fórmula com valor em cache — o arquivo abre com número mesmo sem recalcular. */
const f = (formula: string, result?: number | string): Formula =>
  result === undefined ? { formula } : { formula, result };

/** Referência entre abas, entre aspas (válido para qualquer nome de aba). */
const ref = (aba: string, linha: number, coluna: number): string =>
  `'${aba}'!${letraColuna(coluna)}${linha}`;

function letraColuna(indice: number): string {
  let letra = "";
  let n = indice;
  while (n > 0) {
    const resto = (n - 1) % 26;
    letra = String.fromCharCode(65 + resto) + letra;
    n = Math.floor((n - 1) / 26);
  }
  return letra;
}

function dataHora(iso?: string): string {
  const data = iso ? new Date(iso) : new Date();
  if (Number.isNaN(data.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(data.getDate())}/${p(data.getMonth() + 1)}/${data.getFullYear()} ${p(data.getHours())}:${p(data.getMinutes())}`;
}

/* ---------- escrita ---------- */

function criarAba(wb: Workbook, nome: string, larguras: number[]): Worksheet {
  const ws = wb.addWorksheet(nome);
  larguras.forEach((largura, i) => {
    ws.getColumn(i + 1).width = largura;
  });
  ws.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  ws.pageMargins = { left: 0.5, right: 0.5, top: 0.7, bottom: 0.5, header: 0.3, footer: 0.3 };
  ws.headerFooter = { oddFooter: '&LLOPAS · CD&P&DTHR-Painel de Estoque' };
  return ws;
}

/** Cabeçalho de marca (linhas 1–4) + respiro (linha 5). */
function cabecalho(ws: Worksheet, titulo: string, subtitulo: string, largura: number, congelar = true): void {
  if (congelar) ws.views = [{ state: "frozen", ySplit: LINHA_INICIAL - 1, showGridLines: false }];
  else ws.views = [{ showGridLines: false }];

  /* linha 1 — faixa verde com a marca em texto, sem imagens */
  for (let c = 1; c <= largura; c += 1) {
    const cel = ws.getCell(1, c);
    cel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VERDE } };
    cel.border = { bottom: { style: "medium", color: { argb: AMBAR } } };
  }

  const marca = ws.getCell(1, 1);
  marca.value = "MÓVEIS LOPAS · CONTROLE DE ESTOQUE · CD";
  marca.font = { name: "Calibri", size: 10, bold: true, color: { argb: BRANCO } };
  marca.alignment = { vertical: "middle", indent: 1 };
  ws.mergeCells(1, 1, 1, largura);

  /* linha 2 — título */
  const tit = ws.getCell(2, 1);
  tit.value = titulo;
  tit.font = { name: "Calibri", size: 22, bold: true, color: { argb: VERDE_MEDIO } };
  tit.alignment = { vertical: "middle", indent: 1 };
  ws.mergeCells(2, 1, 2, largura);

  /* linha 3 — subtítulo */
  const sub = ws.getCell(3, 1);
  sub.value = subtitulo;
  sub.font = { name: "Calibri", size: 10, italic: true, color: { argb: CINZA } };
  sub.alignment = { vertical: "middle", wrapText: true, indent: 1 };
  ws.mergeCells(3, 1, 3, largura);

  /* linha 4 — borda âmbar + verde */
  for (let c = 1; c <= largura; c += 1) {
    ws.getCell(4, c).border = {
      top: { style: "thin", color: { argb: AMBAR } },
      bottom: { style: "medium", color: { argb: VERDE_MEDIO } },
    };
  }

  ws.getRow(1).height = 28;
  ws.getRow(2).height = 34;
  ws.getRow(3).height = 20;
  ws.getRow(4).height = 8;
  ws.getRow(5).height = 8;
}

function novaAba(wb: Workbook, nome: string, titulo: string, subtitulo: string, larguras: number[]): Worksheet {
  const ws = criarAba(wb, nome, larguras);
  cabecalho(ws, titulo, subtitulo, larguras.length);
  return ws;
}

function secao(ws: Worksheet, linha: number, texto: string, largura: number): number {
  for (let c = 1; c <= largura; c += 1) {
    const cel = ws.getCell(linha, c);
    cel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VERDE } };
    cel.border = {
      top: { style: "thin", color: { argb: VERDE } },
      bottom: { style: "medium", color: { argb: AMBAR } },
    };
  }
  const celula = ws.getCell(linha, 1);
  celula.value = texto.toUpperCase();
  celula.font = { name: "Calibri", size: 11, bold: true, color: { argb: BRANCO } };
  celula.alignment = { vertical: "middle", indent: 1 };
  ws.mergeCells(linha, 1, linha, largura);
  ws.getRow(linha).height = 24;
  return linha + 1;
}

function nota(ws: Worksheet, linha: number, texto: string, largura: number): number {
  const celula = ws.getCell(linha, 1);
  celula.value = texto;
  celula.font = { name: "Calibri", size: 9, italic: true, color: { argb: CINZA_CLARO } };
  celula.alignment = { vertical: "middle", wrapText: true, indent: 1 };
  ws.mergeCells(linha, 1, linha, largura);
  ws.getRow(linha).height = 16;
  return linha + 1;
}

/** Tabela com cabeçalho verde, zebra e formato por coluna. Devolve a próxima linha livre. */
function tabela(ws: Worksheet, linha: number, colunas: Coluna[], linhas: Valor[][]): number {
  const bordaPadrao = {
    top: { style: "thin" as const, color: { argb: BORDA_FINA } },
    bottom: { style: "thin" as const, color: { argb: BORDA_FINA } },
    left: { style: "thin" as const, color: { argb: BORDA_FINA } },
    right: { style: "thin" as const, color: { argb: BORDA_FINA } },
  };

  colunas.forEach((coluna, i) => {
    const celula = ws.getCell(linha, i + 1);
    celula.value = coluna.titulo;
    celula.font = { name: "Calibri", size: 10, bold: true, color: { argb: BRANCO } };
    celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VERDE_MEDIO } };
    celula.alignment = {
      horizontal: coluna.align ?? (i === 0 ? "left" : "right"),
      vertical: "middle",
      wrapText: true,
      indent: i === 0 && coluna.align !== "center" ? 1 : 0,
    };
    celula.border = {
      ...bordaPadrao,
      bottom: { style: "medium", color: { argb: AMBAR } },
    };
  });
  ws.getRow(linha).height = 22;

  let atual = linha + 1;
  linhas.forEach((valores, indice) => {
    colunas.forEach((coluna, i) => {
      const celula = ws.getCell(atual, i + 1);
      celula.value = (valores[i] ?? null) as CellValue;
      celula.font = { name: "Calibri", size: 10, color: { argb: TEXTO } };
      celula.alignment = {
        horizontal: coluna.align ?? (i === 0 ? "left" : "right"),
        vertical: "middle",
        indent: i === 0 && coluna.align !== "center" ? 1 : 0,
      };
      if (coluna.fmt) celula.numFmt = coluna.fmt;
      if (indice % 2 === 1) {
        celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VERDE_BANDA } };
      }
      celula.border = bordaPadrao;
    });
    ws.getRow(atual).height = 18;
    atual += 1;
  });
  return atual;
}

/** Lista rótulo → valor (com observação opcional na 3ª coluna). Devolve a referência de cada valor. */
function listaValores(
  ws: Worksheet,
  aba: string,
  linha: number,
  itens: ItemLista[],
): { proxima: number; refs: string[] } {
  const refs: string[] = [];
  let atual = linha;
  const bordaPadrao = {
    top: { style: "thin" as const, color: { argb: BORDA_FINA } },
    bottom: { style: "thin" as const, color: { argb: BORDA_FINA } },
    left: { style: "thin" as const, color: { argb: BORDA_FINA } },
    right: { style: "thin" as const, color: { argb: BORDA_FINA } },
  };

  itens.forEach(([rotulo, valor, fmt, observacao], indice) => {
    const fill = indice % 2 === 1
      ? { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: VERDE_BANDA } }
      : undefined;

    const nome = ws.getCell(atual, 1);
    nome.value = rotulo;
    nome.font = { name: "Calibri", size: 10, color: { argb: TEXTO } };
    nome.alignment = { vertical: "middle", indent: 1 };
    nome.border = bordaPadrao;
    if (fill) nome.fill = fill;
    else nome.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VERDE_BANDA } };

    const conteudo = ws.getCell(atual, 2);
    conteudo.value = valor as CellValue;
    conteudo.font = { name: "Calibri", size: 12, bold: true, color: { argb: VERDE } };
    conteudo.alignment = { horizontal: "right", vertical: "middle" };
    if (fmt) conteudo.numFmt = fmt;
    conteudo.border = bordaPadrao;
    if (fill) conteudo.fill = fill;

    if (observacao) {
      const obs = ws.getCell(atual, 3);
      obs.value = observacao;
      obs.font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF8A9280" } };
      obs.alignment = { horizontal: "left", vertical: "middle" };
      obs.border = bordaPadrao;
      if (fill) obs.fill = fill;
    }

    refs.push(ref(aba, atual, 2));
    atual += 1;
  });
  return { proxima: atual, refs };
}

/** Realça uma linha de fechamento (totais). */
function destacarLinha(ws: Worksheet, linha: number, largura: number): void {
  for (let c = 1; c <= largura; c += 1) {
    const celula = ws.getCell(linha, c);
    celula.font = { name: "Calibri", size: 11, bold: true, color: { argb: VERDE } };
    celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VERDE_CLARO } };
    celula.border = {
      top: { style: "medium", color: { argb: VERDE_MEDIO } },
      bottom: { style: "medium", color: { argb: AMBAR } },
      left: { style: "thin", color: { argb: BORDA_FINA } },
      right: { style: "thin", color: { argb: BORDA_FINA } },
    };
  }
  ws.getRow(linha).height = 20;
}

/** Referência de outra aba com valor em cache. */
function liga(endereco: string | undefined, resultado: number): Formula {
  return endereco ? f(`=${endereco}`, resultado) : f("0", resultado);
}

/* ---------- abas ---------- */

function abaEstoque(wb: Workbook, d: VideoResumoProps): Refs {
  const ws = novaAba(
    wb,
    "Estoque",
    "Estoque consolidado",
    "Posição atual do CD Lopas, indicadores e distribuição por unidade.",
    [42, 18, 18, 44],
  );
  const refs: Refs = {};
  let linha = LINHA_INICIAL;

  linha = secao(ws, linha, "Posição geral", 4);
  if (d.resumo) {
    const r = d.resumo;
    const bloco = listaValores(ws, "Estoque", linha, [
      ["Peso em estoque (t)", r.ton, TON],
      ["Saldo em estoque (un)", r.saldo, INT],
      ["Itens ativos", r.itens, INT],
      ["Valor em estoque", r.valor, MOEDA0],
      ["Valor previsto de venda", r.previsto, MOEDA0],
    ]);
    refs["ton"] = bloco.refs[0] ?? "";
    refs["saldo"] = bloco.refs[1] ?? "";
    refs["itens"] = bloco.refs[2] ?? "";
    refs["valor"] = bloco.refs[3] ?? "";
    refs["previsto"] = bloco.refs[4] ?? "";
    linha = bloco.proxima + 1;
  } else {
    linha = nota(ws, linha, "Sem resumo de estoque no payload atual.", 4) + 1;
  }

  linha = secao(ws, linha, "Indicadores", 4);
  if (d.kpis.length) {
    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Indicador", align: "left" },
          { titulo: "Valor", align: "left" },
          { titulo: "Detalhe", align: "left" },
        ],
        d.kpis.map((k) => [k.rotulo, k.valor, k.detalhe ?? ""] as Valor[]),
      ) + 1;
  } else {
    linha = nota(ws, linha, "Sem indicadores.", 4) + 1;
  }

  linha = secao(ws, linha, "Distribuição por unidade", 4);
  if (d.unidades.length) {
    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Unidade", align: "left" },
          { titulo: "Participação", fmt: PCT },
          { titulo: "Valor no estoque", align: "left" },
          { titulo: "Valor previsto", align: "left" },
        ],
        d.unidades.map((u) => [u.nome, u.share, u.valor, u.previsto ?? ""] as Valor[]),
      ) + 1;
  } else {
    linha = nota(ws, linha, "Sem dados por unidade.", 4) + 1;
  }

  linha = secao(ws, linha, "Ocupação do CD", 4);
  const itensOcup: ItemLista[] = [
    ["Posições ocupadas", d.ocupacao.ocupados, INT],
    ["Posições livres", d.ocupacao.livres, INT],
  ];
  if (d.ocupacao.bloqueados) itensOcup.push(["Posições bloqueadas", d.ocupacao.bloqueados, INT]);
  itensOcup.push(["Ocupação", d.ocupacao.pct * 100, PCT]);
  const ocup = listaValores(ws, "Estoque", linha, itensOcup);
  refs["livres"] = ocup.refs[1] ?? "";
  refs["ocupacaoPct"] = ocup.refs[itensOcup.length - 1] ?? "";
  linha = ocup.proxima + 1;

  if (d.ocupacao.detalhes?.length) {
    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Atributo", align: "left" },
          { titulo: "Unidade", align: "left" },
          { titulo: "CD 1", fmt: INT },
          { titulo: "CD 2", fmt: INT },
          { titulo: "Total", fmt: INT },
        ],
        d.ocupacao.detalhes.map((item) => [item.atributo, item.unidade, item.cd1, item.cd2, item.total] as Valor[]),
      ) + 1;
  }

  return refs;
}

function abaRecebimento(wb: Workbook, d: VideoResumoProps): Refs {
  const ws = novaAba(
    wb,
    "Recebimento",
    "Recebimento e fluxo de toneladas",
    "Recebimento da semana, por turno, paletes e o fluxo mensal recebido × carregado.",
    [24, 14, 16, 16, 18],
  );
  const refs: Refs = {};
  let linha = LINHA_INICIAL;

  const dias = d.semana?.dias ?? [];
  linha = secao(ws, linha, `Recebimento · ${d.semana?.rotulo ?? "semana atual"}`, 5);
  if (dias.length) {
    const primeira = linha + 1;
    const ultima = linha + dias.length;
    const linhas: Valor[][] = dias.map((dia, i) => {
      const r = primeira + i;
      const pctMeta = dia.meta > 0 ? (dia.ton / dia.meta) * 100 : 0;
      return [dia.dia, dia.data, dia.ton, dia.meta, f(`IF(D${r}=0,0,C${r}/D${r}*100)`, pctMeta)];
    });
    const totalRec = dias.reduce((s, x) => s + x.ton, 0);
    const totalMeta = dias.reduce((s, x) => s + x.meta, 0);
    const pctMetaTotal = totalMeta > 0 ? (totalRec / totalMeta) * 100 : 0;
    linhas.push([
      "Total da semana",
      "",
      f(`SUM(C${primeira}:C${ultima})`, totalRec),
      f(`SUM(D${primeira}:D${ultima})`, totalMeta),
      f(`IF(D${ultima + 1}=0,0,C${ultima + 1}/D${ultima + 1}*100)`, pctMetaTotal),
    ]);
    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Dia", align: "left" },
          { titulo: "Data", align: "left" },
          { titulo: "Recebido (t)", fmt: TON },
          { titulo: "Meta (t)", fmt: TON },
          { titulo: "% da meta", fmt: PCT },
        ],
        linhas,
      ) + 1;
    destacarLinha(ws, ultima + 1, 5);
    refs["semanaTon"] = ref("Recebimento", ultima + 1, 3);
  } else {
    linha = nota(ws, linha, "Sem recebimento da semana no payload atual.", 5) + 1;
  }

  linha = secao(ws, linha, "Recebimento por turno", 5);
  if (d.turnos.length) {
    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Turno", align: "left" },
          { titulo: "Faixa", align: "left" },
          { titulo: "Toneladas", fmt: TON },
          { titulo: "Participação", fmt: PCT },
        ],
        d.turnos.map((t) => [t.nome, t.faixa ?? "", t.ton ?? 0, t.pct] as Valor[]),
      ) + 1;
  } else {
    linha = nota(ws, linha, "Sem dados por turno.", 5) + 1;
  }

  const mensal = d.mensal ?? [];
  linha = secao(ws, linha, "Fluxo mensal · recebido × carregado", 5);
  if (mensal.length) {
    const primeira = linha + 1;
    const ultima = linha + mensal.length;
    const linhas: Valor[][] = mensal.map((mes, i) => {
      const r = primeira + i;
      return [mes.mes, mes.recebido, mes.carregado, f(`B${r}-C${r}`, mes.recebido - mes.carregado)];
    });
    const totalRec = mensal.reduce((s, m) => s + m.recebido, 0);
    const totalCar = mensal.reduce((s, m) => s + m.carregado, 0);
    linhas.push([
      "Total",
      f(`SUM(B${primeira}:B${ultima})`, totalRec),
      f(`SUM(C${primeira}:C${ultima})`, totalCar),
      f(`SUM(D${primeira}:D${ultima})`, totalRec - totalCar),
    ]);
    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Mês", align: "left" },
          { titulo: "Recebido (t)", fmt: TON },
          { titulo: "Carregado (t)", fmt: TON },
          { titulo: "Saldo (t)", fmt: TON },
        ],
        linhas,
      ) + 1;
    destacarLinha(ws, ultima + 1, 5);
    refs["recebido"] = ref("Recebimento", ultima + 1, 2);
    refs["carregado"] = ref("Recebimento", ultima + 1, 3);
  } else {
    linha = nota(ws, linha, "Sem fluxo mensal no payload atual.", 5) + 1;
  }

  const porTamanho = new Map<string, [number, number, number]>();
  (d.recebimentoSemanal ?? []).forEach((dia) => {
    dia.porTamanho.forEach((tam) => {
      const atual = porTamanho.get(tam.tamanho) ?? [0, 0, 0];
      porTamanho.set(tam.tamanho, [atual[0] + tam.paletes, atual[1] + tam.itens, atual[2] + tam.und]);
    });
  });
  linha = secao(ws, linha, "Recebimento por tamanho de palete", 5);
  if (porTamanho.size) {
    const linhas: Valor[][] = [...porTamanho.entries()]
      .sort((a, b) => b[1][0] - a[1][0])
      .map(([tamanho, valores]) => [tamanho, valores[0], valores[1], valores[2]]);
    const primeira = linha + 1;
    const ultima = linha + linhas.length;
    linhas.push([
      "Total",
      f(`SUM(B${primeira}:B${ultima})`, linhas.reduce((s, l) => s + Number(l[1] ?? 0), 0)),
      f(`SUM(C${primeira}:C${ultima})`, linhas.reduce((s, l) => s + Number(l[2] ?? 0), 0)),
      f(`SUM(D${primeira}:D${ultima})`, linhas.reduce((s, l) => s + Number(l[3] ?? 0), 0)),
    ]);
    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Tamanho", align: "left" },
          { titulo: "Paletes", fmt: INT },
          { titulo: "Itens", fmt: INT },
          { titulo: "Unidades", fmt: INT },
        ],
        linhas,
      ) + 1;
    destacarLinha(ws, ultima + 1, 5);
  } else {
    linha = nota(ws, linha, "Sem recebimento detalhado por tamanho.", 5) + 1;
  }

  const paletes = d.paletas;
  linha = secao(ws, linha, "Paletes recebidos", 5);
  if (paletes?.porTamanho.length) {
    const primeira = linha + 1;
    const ultima = linha + paletes.porTamanho.length;
    const linhas: Valor[][] = paletes.porTamanho.map((p) => [p.tamanho, p.paletes, p.itens, p.und]);
    const totalUndPaletes = paletes.porTamanho.reduce((s, p) => s + p.und, 0);
    linhas.push([
      "Total",
      f(`SUM(B${primeira}:B${ultima})`, paletes.totalPaletes),
      f(`SUM(C${primeira}:C${ultima})`, paletes.totalItens),
      f(`SUM(D${primeira}:D${ultima})`, totalUndPaletes),
    ]);
    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Tamanho", align: "left" },
          { titulo: "Paletes", fmt: INT },
          { titulo: "Itens", fmt: INT },
          { titulo: "Unidades", fmt: INT },
        ],
        linhas,
      ) + 1;
    destacarLinha(ws, ultima + 1, 5);
    refs["paletes"] = ref("Recebimento", ultima + 1, 2);
    if (paletes.diasRecebidos) {
      linha = nota(ws, linha, `Paletes apurados em ${paletes.diasRecebidos} dias de recebimento.`, 5) + 1;
    }
  } else {
    linha = nota(ws, linha, "Sem dados de paletes no payload atual.", 5) + 1;
  }

  return refs;
}

function abaReservas(wb: Workbook, d: VideoResumoProps): Refs {
  const ws = novaAba(
    wb,
    "Reservas",
    "Carteira de reservas",
    "Itens reservados × itens sem reserva, com o topo da carteira por peso reservado.",
    [34, 16, 16, 18, 16, 18, 16, 16],
  );
  const refs: Refs = {};
  let linha = LINHA_INICIAL;

  const blocos: Array<[string, VideoResumoProps["reservados"], boolean]> = [
    ["Carteira reservada", d.reservados, true],
    ["Estoque sem reserva", d.semReserva, false],
  ];

  blocos.forEach(([titulo, dados, principal]) => {
    linha = secao(ws, linha, titulo, 8);
    if (!dados) {
      linha = nota(ws, linha, "Sem dados deste bloco no payload atual.", 8) + 1;
      return;
    }

    const bloco = listaValores(ws, "Reservas", linha, [
      ["Quantidade reservada (un)", dados.totalQtd, INT],
      ["Peso reservado (t)", dados.totalTon, TON],
      ["Valor reservado", dados.totalValor, MOEDA0],
      ["Custo médio ponderado", dados.custoMedioPonderado, MOEDA],
      ["Saldo atual (un)", dados.totalSaldo, INT],
      ["Valor do estoque", dados.totalValorEstoque, MOEDA0],
      ["Peso do estoque (t)", dados.totalPesoEstoque, TON],
      ["Previsão de escoamento (dias)", dados.previsao, INT],
      ["% da quantidade em estoque", dados.pctQtd, PCT],
      ["% do valor em estoque", dados.pctValor, PCT],
      ["% do peso em estoque", dados.pctPeso, PCT],
    ]);
    if (principal) {
      refs["reservadoQtd"] = bloco.refs[0] ?? "";
      refs["reservadoTon"] = bloco.refs[1] ?? "";
      refs["reservadoValor"] = bloco.refs[2] ?? "";
    }
    linha = bloco.proxima + 1;

    if (dados.topItens.length) {
      linha =
        tabela(
          ws,
          linha,
          [
            { titulo: "Código", align: "left" },
            { titulo: "Descrição", align: "left" },
            { titulo: "Máscara", align: "left" },
            { titulo: "Qtd reservada", fmt: INT },
            { titulo: "Peso reservado (kg)", fmt: INT },
            { titulo: "Valor reservado", fmt: MOEDA0 },
            { titulo: "Saldo atual", fmt: INT },
            { titulo: "% do saldo", fmt: PCT },
          ],
          dados.topItens.map(
            (item) =>
              [
                item.cod,
                item.desc,
                item.mascara,
                item.qtdReservada,
                item.pesoReservado,
                item.valorReservado,
                item.saldoAtual,
                item.pctReservado,
              ] as Valor[],
          ),
        ) + 1;
    } else {
      linha = nota(ws, linha, "Sem itens no topo da carteira.", 8) + 1;
    }
    linha += 1;
  });

  return refs;
}

function abaForaDeLinha(wb: Workbook, d: VideoResumoProps): Refs {
  const ws = novaAba(
    wb,
    "ForaDeLinha",
    "Em linha × fora de linha",
    "Posição cruzada de saldos, reservas, peso e valor entre itens em linha e fora de linha.",
    [16, 12, 34, 14, 16, 14, 14, 14, 14, 18, 18],
  );
  const refs: Refs = {};
  let linha = LINHA_INICIAL;

  const drive = d.foraDeLinha;
  const emLinha: PosicaoEstoque = drive?.posicaoEmLinha ?? POSICAO_EM_LINHA;
  const foraDeLinha: PosicaoEstoque = drive?.posicaoForaDeLinha ?? POSICAO_FORA_DE_LINHA;
  const total: PosicaoEstoque = drive?.posicaoTotal ?? POSICAO_TOTAL;

  linha = secao(ws, linha, "Posição por linha", 10);
  const primeira = linha + 1;
  const ultima = linha + 2;
  const linhasPos: Valor[][] = [emLinha, foraDeLinha].map((p) => [
    p.grupo,
    p.itens,
    p.saldoFocco,
    p.reservas,
    p.disponivel,
    p.pesoTon,
    p.pesoReservadoTon,
    p.valorEstoque,
    p.valorReservado,
  ]);
  linhasPos.push([
    "TOTAL GERAL",
    f(`SUM(B${primeira}:B${ultima})`, total.itens),
    f(`SUM(C${primeira}:C${ultima})`, total.saldoFocco),
    f(`SUM(D${primeira}:D${ultima})`, total.reservas),
    f(`SUM(E${primeira}:E${ultima})`, total.disponivel),
    f(`SUM(F${primeira}:F${ultima})`, total.pesoTon),
    f(`SUM(G${primeira}:G${ultima})`, total.pesoReservadoTon),
    f(`SUM(H${primeira}:H${ultima})`, total.valorEstoque),
    f(`SUM(I${primeira}:I${ultima})`, total.valorReservado),
  ]);
  linha =
    tabela(
      ws,
      linha,
      [
        { titulo: "Grupo", align: "left" },
        { titulo: "Itens", fmt: INT },
        { titulo: "Saldo", fmt: INT },
        { titulo: "Reservas", fmt: INT },
        { titulo: "Disponível", fmt: INT },
        { titulo: "Peso (t)", fmt: TON },
        { titulo: "Peso reservado (t)", fmt: TON },
        { titulo: "Valor estoque", fmt: MOEDA0 },
        { titulo: "Valor reservado", fmt: MOEDA0 },
      ],
      linhasPos,
    ) + 1;
  destacarLinha(ws, ultima + 1, 10);
  refs["foraItens"] = ref("ForaDeLinha", ultima + 1, 2);
  refs["foraTon"] = ref("ForaDeLinha", ultima + 1, 6);
  refs["foraValor"] = ref("ForaDeLinha", ultima + 1, 8);

  const itens = drive?.itens ?? ITENS_FORA_DE_LINHA;
  linha = secao(ws, linha, "Itens fora de linha", 10);
  if (itens.length) {
    const primeiraItem = linha + 1;
    const ultimaItem = linha + itens.length;
    const linhas: Valor[][] = itens.map((item) => [
      item.chave,
      item.item,
      item.desc,
      item.mascara,
      item.categoria,
      item.origem,
      item.saldoFocco,
      item.reservas,
      item.disponivel,
      item.pesoKg,
      item.valorEstoque,
    ]);
    linhas.push([
      "Total",
      "",
      "",
      "",
      "",
      "",
      f(`SUM(G${primeiraItem}:G${ultimaItem})`, itens.reduce((s, i) => s + i.saldoFocco, 0)),
      f(`SUM(H${primeiraItem}:H${ultimaItem})`, itens.reduce((s, i) => s + i.reservas, 0)),
      f(`SUM(I${primeiraItem}:I${ultimaItem})`, itens.reduce((s, i) => s + i.disponivel, 0)),
      f(`SUM(J${primeiraItem}:J${ultimaItem})`, itens.reduce((s, i) => s + i.pesoKg, 0)),
      f(`SUM(K${primeiraItem}:K${ultimaItem})`, itens.reduce((s, i) => s + i.valorEstoque, 0)),
    ]);
    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Chave", align: "left" },
          { titulo: "Item", fmt: INT },
          { titulo: "Descrição", align: "left" },
          { titulo: "Máscara", align: "left" },
          { titulo: "Categoria", align: "left" },
          { titulo: "Origem", align: "left" },
          { titulo: "Saldo", fmt: INT },
          { titulo: "Reservas", fmt: INT },
          { titulo: "Disponível", fmt: INT },
          { titulo: "Peso (kg)", fmt: INT },
          { titulo: "Valor estoque", fmt: MOEDA0 },
        ],
        linhas,
      ) + 1;
    destacarLinha(ws, ultimaItem + 1, 11);
  } else {
    linha = nota(ws, linha, "Sem itens fora de linha.", 10) + 1;
  }

  return refs;
}

function abaAvarias(wb: Workbook, d: VideoResumoProps): Refs {
  const ws = novaAba(
    wb,
    "Avarias",
    "Avarias",
    "Volumes avariados por mês e o motivo mais frequente de cada mês.",
    [18, 16, 16, 18, 40],
  );
  const refs: Refs = {};
  let linha = LINHA_INICIAL;

  const avarias = d.avarias;
  linha = secao(ws, linha, "Resumo", 5);
  if (avarias) {
    const bloco = listaValores(ws, "Avarias", linha, [
      ["Volumes avariados", avarias.total, INT],
      ["Custo estimado", avarias.custo, undefined, "Custo parcial, conforme o painel"],
    ]);
    refs["total"] = bloco.refs[0] ?? "";
    linha = bloco.proxima + 1;
    if (avarias.referenciaParcial) {
      linha = nota(ws, linha, "Medição parcial: a base cobre apenas parte das ocorrências.", 5) + 1;
    }
  } else {
    linha = nota(ws, linha, "Sem avarias no payload atual.", 5) + 1;
  }

  const meses = avarias?.meses ?? [];
  linha = secao(ws, linha, "Volumes por mês", 5);
  if (meses.length) {
    const primeira = linha + 1;
    const ultima = linha + meses.length;
    const linhas: Valor[][] = meses.map((mes) => [mes.mes, mes.qtd, mes.peso ?? "", mes.custo ?? ""]);
    linhas.push([
      "Total",
      f(`SUM(B${primeira}:B${ultima})`, meses.reduce((s, m) => s + m.qtd, 0)),
      f(`SUM(C${primeira}:C${ultima})`, meses.reduce((s, m) => s + Number(m.peso ?? 0), 0)),
      f(`SUM(D${primeira}:D${ultima})`, meses.reduce((s, m) => s + Number(m.custo ?? 0), 0)),
    ]);
    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Mês", align: "left" },
          { titulo: "Volumes", fmt: INT },
          { titulo: "Peso (t)", fmt: TON },
          { titulo: "Custo", fmt: MOEDA0 },
        ],
        linhas,
      ) + 1;
    destacarLinha(ws, ultima + 1, 5);
  } else {
    linha = nota(ws, linha, "Sem série mensal de avarias.", 5) + 1;
  }

  const motivoMes = avarias?.motivoMes ?? [];
  linha = secao(ws, linha, "Motivo mais frequente por mês", 5);
  if (motivoMes.length) {
    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Mês", align: "left" },
          { titulo: "Motivo", align: "left" },
          { titulo: "Volumes", fmt: INT },
        ],
        motivoMes.map((item) => [item.mes, item.motivo, item.qtd] as Valor[]),
      ) + 1;
  } else {
    linha = nota(ws, linha, "Sem motivo predominante por mês.", 5) + 1;
  }

  const tipos = avarias?.tipos ?? [];
  linha = secao(ws, linha, "Por tipo de avaria", 5);
  if (tipos.length) {
    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Tipo", align: "left" },
          { titulo: "Volumes", fmt: INT },
          { titulo: "Participação", fmt: PCT },
        ],
        tipos.map((tipo) => [tipo.tipo, tipo.total, tipo.pct] as Valor[]),
      ) + 1;
  } else {
    linha = nota(ws, linha, "Sem abertura por tipo.", 5) + 1;
  }

  return refs;
}

function abaPendentes(wb: Workbook, d: VideoResumoProps): Refs {
  const ws = novaAba(
    wb,
    "Pendentes",
    "Pendências de produção",
    "Ordens pendentes por mês, com peso a produzir e distribuição.",
    [18, 16, 14, 14, 14, 16, 16],
  );
  const refs: Refs = {};
  let linha = LINHA_INICIAL;

  const pendentes = d.pendentes;
  linha = secao(ws, linha, "Resumo", 7);
  if (pendentes) {
    const bloco = listaValores(ws, "Pendentes", linha, [
      ["Ordens pendentes", pendentes.itens, INT],
      ["Peso a produzir (t)", pendentes.totalTon, TON],
      ["Média por mês (t)", pendentes.mediaTon, TON],
    ]);
    refs["itens"] = bloco.refs[0] ?? "";
    refs["ton"] = bloco.refs[1] ?? "";
    linha = bloco.proxima + 1;
  } else {
    linha = nota(ws, linha, "Sem pendências no payload atual.", 7) + 1;
  }

  const fatias = pendentes?.fatias ?? [];
  linha = secao(ws, linha, "Distribuição", 7);
  if (fatias.length) {
    const primeira = linha + 1;
    const ultima = linha + fatias.length;
    const linhas: Valor[][] = fatias.map((fatia) => [fatia.rotulo, fatia.ton]);
    linhas.push(["Total", f(`SUM(B${primeira}:B${ultima})`, fatias.reduce((s, x) => s + x.ton, 0))]);
    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Grupo", align: "left" },
          { titulo: "Toneladas", fmt: TON },
        ],
        linhas,
      ) + 1;
    destacarLinha(ws, ultima + 1, 7);
  } else {
    linha = nota(ws, linha, "Sem distribuição de pendências.", 7) + 1;
  }

  const meses = pendentes?.meses ?? [];
  linha = secao(ws, linha, "Pendências por mês", 7);
  if (meses.length) {
    const primeira = linha + 1;
    const ultima = linha + meses.length;
    const linhas: Valor[][] = meses.map((mes) => [
      mes.mes,
      mes.ton,
      mes.pct,
      mes.itens,
      mes.lotes ?? "",
      mes.dtInicial ?? "",
      mes.dtFinal ?? "",
    ]);
    linhas.push([
      "Total",
      f(`SUM(B${primeira}:B${ultima})`, meses.reduce((s, m) => s + m.ton, 0)),
      "",
      f(`SUM(D${primeira}:D${ultima})`, meses.reduce((s, m) => s + m.itens, 0)),
      f(`SUM(E${primeira}:E${ultima})`, meses.reduce((s, m) => s + Number(m.lotes ?? 0), 0)),
      "",
      "",
    ]);
    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Mês", align: "left" },
          { titulo: "Toneladas", fmt: TON },
          { titulo: "% do total", fmt: PCT },
          { titulo: "Ordens", fmt: INT },
          { titulo: "Lotes", fmt: INT },
          { titulo: "DT inicial", align: "left" },
          { titulo: "DT final", align: "left" },
        ],
        linhas,
      ) + 1;
    destacarLinha(ws, ultima + 1, 7);
  } else {
    linha = nota(ws, linha, "Sem série mensal de pendências.", 7) + 1;
  }

  return refs;
}

function abaProducao(wb: Workbook, d: VideoResumoProps): Refs {
  const ws = novaAba(
    wb,
    "Producao",
    "Produção da semana",
    "Programado × produzido × recebido no estoque, em unidades e toneladas.",
    [14, 14, 16, 16, 16, 16, 16, 16],
  );
  const refs: Refs = {};
  let linha = LINHA_INICIAL;

  const dias = d.producaoSemanal ?? [];
  linha = secao(ws, linha, "Semana atual", 8);
  if (dias.length) {
    const primeira = linha + 1;
    const ultima = linha + dias.length;
    const linhas: Valor[][] = dias.map((dia) => [
      dia.dia,
      dia.data,
      dia.previsto,
      dia.produzido,
      dia.pendente,
      dia.tonPrevisto,
      dia.tonProduzido,
      dia.tonEntregue,
    ]);
    linhas.push([
      "Total",
      "",
      f(`SUM(C${primeira}:C${ultima})`, dias.reduce((s, x) => s + x.previsto, 0)),
      f(`SUM(D${primeira}:D${ultima})`, dias.reduce((s, x) => s + x.produzido, 0)),
      f(`SUM(E${primeira}:E${ultima})`, dias.reduce((s, x) => s + x.pendente, 0)),
      f(`SUM(F${primeira}:F${ultima})`, dias.reduce((s, x) => s + x.tonPrevisto, 0)),
      f(`SUM(G${primeira}:G${ultima})`, dias.reduce((s, x) => s + x.tonProduzido, 0)),
      f(`SUM(H${primeira}:H${ultima})`, dias.reduce((s, x) => s + x.tonEntregue, 0)),
    ]);
    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Dia", align: "left" },
          { titulo: "Data", align: "left" },
          { titulo: "Programado (un)", fmt: INT },
          { titulo: "Produzido (un)", fmt: INT },
          { titulo: "A produzir (un)", fmt: INT },
          { titulo: "Ton. previsto", fmt: TON },
          { titulo: "Ton. produzido", fmt: TON },
          { titulo: "Ton. recebido", fmt: TON },
        ],
        linhas,
      ) + 1;
    destacarLinha(ws, ultima + 1, 8);
    refs["previstoTon"] = ref("Producao", ultima + 1, 6);
    refs["produzidoTon"] = ref("Producao", ultima + 1, 7);
    refs["recebidoTon"] = ref("Producao", ultima + 1, 8);
  } else {
    linha = nota(ws, linha, "Sem produção da semana no payload atual.", 8) + 1;
  }

  return refs;
}

function abaProdutividade(wb: Workbook): Refs {
  const ws = novaAba(
    wb,
    "Produtividade",
    "Produtividade por colaborador e por turma",
    `Fonte: planilhas "PRODUTIVIDADE POR COLABORADOR" da pasta do Drive · ${PRODUTIVIDADE.atualizadoEm}.`,
    [26, 16, 14, 10, 22, 22, 14],
  );
  const refs: Refs = {};
  let linha = LINHA_INICIAL;

  linha = secao(ws, linha, "Geral", 7);
  const geral = listaValores(ws, "Produtividade", linha, [
    ["Tipos de atividade", PRODUTIVIDADE.tipos.length, INT],
    ["Toneladas somadas", PRODUTIVIDADE.tipos.reduce((s, t) => s + t.ton, 0), TON],
    ["Colaboradores somados", PRODUTIVIDADE.tipos.reduce((s, t) => s + t.pessoas, 0), INT],
  ]);
  refs["ton"] = geral.refs[1] ?? "";
  refs["pessoas"] = geral.refs[2] ?? "";
  linha = geral.proxima + 1;

  PRODUTIVIDADE.tipos.forEach((tipo) => {
    linha = secao(ws, linha, `${tipo.nome} · ${tipo.periodo}`, 7);
    linha =
      listaValores(ws, "Produtividade", linha, [
        ["Toneladas", tipo.ton, TON],
        ["Caixas", tipo.cx, INT],
        ["Colaboradores", tipo.pessoas, INT],
      ]).proxima + 1;

    if (tipo.colaboradores.length) {
      const primeira = linha + 1;
      const ultima = linha + tipo.colaboradores.length;
      const linhas: Valor[][] = tipo.colaboradores.map((c) => [
        c.nome,
        c.ton,
        c.cx,
        c.dias,
        c.cargo || "—",
        c.turma || "—",
        c.tempo || "—",
      ]);
      linhas.push([
        `Total · ${tipo.colaboradores.length} colaboradores`,
        f(`SUM(B${primeira}:B${ultima})`, tipo.colaboradores.reduce((s, c) => s + c.ton, 0)),
        f(`SUM(C${primeira}:C${ultima})`, tipo.colaboradores.reduce((s, c) => s + c.cx, 0)),
        f(`SUM(D${primeira}:D${ultima})`, tipo.colaboradores.reduce((s, c) => s + c.dias, 0)),
        "",
        "",
        "",
      ]);
      linha =
        tabela(
          ws,
          linha,
          [
            { titulo: "Colaborador", align: "left" },
            { titulo: "Toneladas", fmt: TON },
            { titulo: "Caixas", fmt: INT },
            { titulo: "Dias", fmt: INT },
            { titulo: "Cargo", align: "left" },
            { titulo: "Turma", align: "left" },
            { titulo: "Tempo de casa", fmt: ANOS },
          ],
          linhas,
        ) + 1;
      destacarLinha(ws, ultima + 1, 7);
    }

    if (tipo.turmas.length) {
      const primeira = linha + 1;
      const ultima = linha + tipo.turmas.length;
      const linhas: Valor[][] = tipo.turmas.map((t) => [t.nome, t.ton, t.cx, t.pessoas]);
      linhas.push([
        "Total",
        f(`SUM(B${primeira}:B${ultima})`, tipo.turmas.reduce((s, x) => s + x.ton, 0)),
        f(`SUM(C${primeira}:C${ultima})`, tipo.turmas.reduce((s, x) => s + x.cx, 0)),
        f(`SUM(D${primeira}:D${ultima})`, tipo.turmas.reduce((s, x) => s + x.pessoas, 0)),
      ]);
      linha =
        tabela(
          ws,
          linha,
          [
            { titulo: "Turma", align: "left" },
            { titulo: "Toneladas", fmt: TON },
            { titulo: "Caixas", fmt: INT },
            { titulo: "Colaboradores", fmt: INT },
          ],
          linhas,
        ) + 1;
      destacarLinha(ws, ultima + 1, 7);
    }
    linha += 1;
  });

  return refs;
}

function abaQlp(wb: Workbook): Refs {
  const ws = novaAba(
    wb,
    "QLP-CD",
    "QLP · CD — lotação de pessoal",
    `Quadro de lotação por classe · fonte "CD - QLP.xlsx" (aba Base) · ${QLP_CD.atualizadoEm}.`,
    [24, 12, 24, 12, 26, 12],
  );
  const refs: Refs = {};
  let linha = LINHA_INICIAL;

  linha = secao(ws, linha, "Quadro geral", 6);
  const geral = listaValores(ws, "QLP-CD", linha, [
    ["Registros classificados", QLP_CD.total, INT],
    ["Desligados", QLP_CD.demitidos, INT],
    ["Afastados", QLP_CD.afastados, INT],
    ["Transferidos", QLP_CD.transferidos, INT],
  ]);
  refs["total"] = geral.refs[0] ?? "";
  refs["demitidos"] = geral.refs[1] ?? "";
  linha = geral.proxima + 1;

  const pareado = (
    a: { nome: string; pessoas: number }[],
    b: { nome: string; pessoas: number }[],
    c: { nome: string; pessoas: number }[],
  ): Valor[][] => {
    const total = Math.max(a.length, b.length, c.length);
    return Array.from({ length: total }, (_, i) => {
      const [x, y, z] = [a[i], b[i], c[i]];
      return [
        x?.nome ?? "",
        x?.pessoas ?? "",
        y?.nome ?? "",
        y?.pessoas ?? "",
        z?.nome ?? "",
        z?.pessoas ?? "",
      ] as Valor[];
    });
  };

  QLP_CD.classes.forEach((classe) => {
    linha = secao(ws, linha, `${classe.nome} · ${classe.pessoas} pessoas`, 6);
    linha =
      listaValores(ws, "QLP-CD", linha, [
        ["Pessoas", classe.pessoas, INT],
        ["Tempo de casa médio", classe.tempoMedio, ANOS],
      ]).proxima + 1;

    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Turno", align: "left" },
          { titulo: "Pessoas", fmt: INT },
          { titulo: "Turma", align: "left" },
          { titulo: "Pessoas", fmt: INT },
          { titulo: "Cargo", align: "left" },
          { titulo: "Pessoas", fmt: INT },
        ],
        pareado(classe.turnos, classe.turmas, classe.cargos),
      ) + 1;

    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Função", align: "left" },
          { titulo: "Pessoas", fmt: INT },
          { titulo: "Cidade", align: "left" },
          { titulo: "Pessoas", fmt: INT },
          { titulo: "Setor", align: "left" },
          { titulo: "Pessoas", fmt: INT },
        ],
        pareado(classe.funcoes, classe.cidades, classe.setores),
      ) + 1;

    linha =
      tabela(
        ws,
        linha,
        [
          { titulo: "Tempo de casa", align: "left" },
          { titulo: "Pessoas", fmt: INT },
        ],
        classe.tempoCasa.map((faixa) => [faixa.nome, faixa.pessoas] as Valor[]),
      ) + 1;
    linha += 1;
  });

  return refs;
}

/* ---------- Capa e Resumo (criadas primeiro, preenchidas no fim) ---------- */

function preencherResumo(ws: Worksheet, d: VideoResumoProps, refs: Record<string, Refs>): void {
  cabecalho(
    ws,
    "Resumo consolidado",
    "Cada número é uma fórmula que aponta para a aba de origem — edite a aba e o resumo recalcula.",
    4,
  );

  const estoque = refs["estoque"] ?? {};
  const recebimento = refs["recebimento"] ?? {};
  const reservas = refs["reservas"] ?? {};
  const fora = refs["fora"] ?? {};
  const avarias = refs["avarias"] ?? {};
  const pendentes = refs["pendentes"] ?? {};
  const producao = refs["producao"] ?? {};
  const produtividade = refs["produtividade"] ?? {};
  const qlp = refs["qlp"] ?? {};

  const rec = d.mensal?.reduce((s, m) => s + m.recebido, 0) ?? 0;
  const car = d.mensal?.reduce((s, m) => s + m.carregado, 0) ?? 0;
  const eficiencia = rec > 0 ? (car / rec) * 100 : 0;
  const refRecebido = recebimento["recebido"];
  const refCarregado = recebimento["carregado"];

  let linha = LINHA_INICIAL;

  linha = secao(ws, linha, "Estoque", 4);
  linha =
    listaValores(ws, "Resumo", linha, [
      ["Peso em estoque (t)", liga(estoque["ton"], d.resumo?.ton ?? 0), TON],
      ["Saldo em estoque (un)", liga(estoque["saldo"], d.resumo?.saldo ?? 0), INT],
      ["Itens ativos", liga(estoque["itens"], d.resumo?.itens ?? 0), INT],
      ["Valor em estoque", liga(estoque["valor"], d.resumo?.valor ?? 0), MOEDA0],
      ["Valor previsto de venda", liga(estoque["previsto"], d.resumo?.previsto ?? 0), MOEDA0],
      ["Ocupação do CD", liga(estoque["ocupacaoPct"], d.ocupacao.pct * 100), PCT],
      ["Posições livres", liga(estoque["livres"], d.ocupacao.livres), INT],
    ]).proxima + 1;

  linha = secao(ws, linha, "Fluxo de toneladas", 4);
  linha =
    listaValores(ws, "Resumo", linha, [
      ["Recebido no período (t)", liga(refRecebido, rec), TON],
      ["Carregado no período (t)", liga(refCarregado, car), TON],
      [
        "Eficiência do fluxo (carregado ÷ recebido)",
        refRecebido && refCarregado
          ? f(`=IF(${refRecebido}=0,0,${refCarregado}/${refRecebido}*100)`, eficiencia)
          : f("0", eficiencia),
        PCT,
      ],
      [
        "Recebido na semana (t)",
        liga(recebimento["semanaTon"], (d.semana?.dias ?? []).reduce((s, x) => s + x.ton, 0)),
        TON,
      ],
      ["Paletes recebidos", liga(recebimento["paletes"], d.paletas?.totalPaletes ?? 0), INT],
      [
        "Produzido na semana (t)",
        liga(producao["produzidoTon"], (d.producaoSemanal ?? []).reduce((s, x) => s + x.tonProduzido, 0)),
        TON,
      ],
      [
        "Recebido da produção (t)",
        liga(producao["recebidoTon"], (d.producaoSemanal ?? []).reduce((s, x) => s + x.tonEntregue, 0)),
        TON,
      ],
    ]).proxima + 1;

  linha = secao(ws, linha, "Comercial e riscos", 4);
  linha =
    listaValores(ws, "Resumo", linha, [
      ["Valor reservado na carteira", liga(reservas["reservadoValor"], d.reservados?.totalValor ?? 0), MOEDA0],
      ["Peso reservado (t)", liga(reservas["reservadoTon"], d.reservados?.totalTon ?? 0), TON],
      [
        "Itens em estoque (em linha + fora)",
        liga(fora["foraItens"], d.foraDeLinha?.posicaoTotal.itens ?? POSICAO_TOTAL.itens),
        INT,
      ],
      [
        "Valor em estoque (em linha + fora)",
        liga(fora["foraValor"], d.foraDeLinha?.posicaoTotal.valorEstoque ?? POSICAO_TOTAL.valorEstoque),
        MOEDA0,
      ],
      ["Volumes avariados", liga(avarias["total"], d.avarias?.total ?? 0), INT],
      ["Ordens pendentes", liga(pendentes["itens"], d.pendentes?.itens ?? 0), INT],
      ["Peso a produzir (t)", liga(pendentes["ton"], d.pendentes?.totalTon ?? 0), TON],
    ]).proxima + 1;

  linha = secao(ws, linha, "Pessoas", 4);
  listaValores(ws, "Resumo", linha, [
    ["Registros no QLP · CD", liga(qlp["total"], QLP_CD.total), INT],
    ["Desligados", liga(qlp["demitidos"], QLP_CD.demitidos), INT],
    [
      "Colaboradores somados (produtividade)",
      liga(produtividade["pessoas"], PRODUTIVIDADE.tipos.reduce((s, t) => s + t.pessoas, 0)),
      INT,
    ],
    [
      "Toneladas somadas (produtividade)",
      liga(produtividade["ton"], PRODUTIVIDADE.tipos.reduce((s, t) => s + t.ton, 0)),
      TON,
    ],
  ]);
}

function preencherCapa(ws: Worksheet, d: VideoResumoProps, refs: Record<string, Refs>): void {
  cabecalho(ws, "Painel de Estoque", "CD Lopas · controle de estoque, fluxo, avarias e pessoas", 5, false);

  const atualizado = ws.getCell(LINHA_INICIAL, 1);
  atualizado.value = `Atualizado na pasta do Drive em ${dataHora(d.sincronizacao?.em)}`;
  atualizado.font = { name: "Calibri", size: 11, bold: true, color: { argb: VERDE_MEDIO } };
  atualizado.alignment = { indent: 1 };
  ws.mergeCells(LINHA_INICIAL, 1, LINHA_INICIAL, 5);

  const gerado = ws.getCell(LINHA_INICIAL + 1, 1);
  gerado.value = `Arquivo gerado em ${dataHora()}`;
  gerado.font = { name: "Calibri", size: 10, color: { argb: CINZA } };
  gerado.alignment = { indent: 1 };
  ws.mergeCells(LINHA_INICIAL + 1, 1, LINHA_INICIAL + 1, 5);

  const estoque = refs["estoque"] ?? {};
  let linha = LINHA_INICIAL + 3;
  linha = secao(ws, linha, "Números-chave", 5);

  /* KPI cards em caixas coloridas — visual executivo */
  const kpis: Array<[string, string, string, number]> = [
    ["Peso em estoque", "t", TON, d.resumo?.ton ?? 0],
    ["Itens ativos", "un", INT, d.resumo?.itens ?? 0],
    ["Valor em estoque", "R$", MOEDA0, d.resumo?.valor ?? 0],
    ["Ocupação do CD", "%", PCT, d.ocupacao.pct * 100],
  ];
  const coresKpi = [VERDE_MEDIO, VERDE_MEDIO, VERDE_MEDIO, AMBAR];
  kpis.forEach(([rotulo, unidade, fmt, valor], i) => {
    /* Caixa: rótulo em verde-claro, valor grande em verde */
    const celRotulo = ws.getCell(linha, 1);
    celRotulo.value = rotulo;
    celRotulo.font = { name: "Calibri", size: 9, bold: true, color: { argb: CINZA } };
    celRotulo.alignment = { vertical: "middle", indent: 1 };
    celRotulo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VERDE_CLARO } };
    celRotulo.border = {
      top: { style: "medium", color: { argb: coresKpi[i] } },
      left: { style: "thin", color: { argb: BORDA_FINA } },
      right: { style: "thin", color: { argb: BORDA_FINA } },
    };

    const celValor = ws.getCell(linha, 2);
    celValor.value = liga(estoque[["ton", "itens", "valor", "ocupacaoPct"][i]], valor) as CellValue;
    celValor.font = { name: "Calibri", size: 16, bold: true, color: { argb: VERDE } };
    celValor.alignment = { horizontal: "right", vertical: "middle" };
    if (fmt) celValor.numFmt = fmt;
    celValor.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VERDE_CLARO } };
    celValor.border = {
      top: { style: "medium", color: { argb: coresKpi[i] } },
      left: { style: "thin", color: { argb: BORDA_FINA } },
      right: { style: "thin", color: { argb: BORDA_FINA } },
    };

    const celUn = ws.getCell(linha, 3);
    celUn.value = unidade;
    celUn.font = { name: "Calibri", size: 9, color: { argb: CINZA } };
    celUn.alignment = { vertical: "middle", indent: 1 };
    celUn.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VERDE_CLARO } };
    celUn.border = {
      top: { style: "medium", color: { argb: coresKpi[i] } },
      right: { style: "thin", color: { argb: BORDA_FINA } },
    };
    ws.mergeCells(linha, 3, linha, 5);

    ws.getRow(linha).height = 32;
    linha += 1;

    /* Linha separadora entre cards */
    for (let c = 1; c <= 5; c += 1) {
      ws.getCell(linha, c).border = { bottom: { style: "hair", color: { argb: BORDA_FINA } } };
    }
    ws.getRow(linha).height = 4;
    linha += 1;
  });
  linha += 1;

  const abas: Array<[string, string, string]> = [
    ["Resumo", "Resumo consolidado", "Todos os totais em fórmulas"],
    ["Estoque", "Estoque consolidado", "Posição, indicadores e unidades"],
    ["Recebimento", "Recebimento e fluxo", "Semana, turnos e mensal"],
    ["Reservas", "Carteira de reservas", "Reservado × sem reserva"],
    ["ForaDeLinha", "Em linha × fora de linha", "Saldos, peso e valor"],
    ["Avarias", "Avarias", "Volumes por mês"],
    ["Pendentes", "Pendências", "A produzir por mês"],
    ["Producao", "Produção da semana", "Programado × produzido"],
    ["Produtividade", "Produtividade", "Por colaborador e turma"],
    ["QLP-CD", "QLP · CD", "Lotação por classe"],
  ];

  linha = secao(ws, linha, "Abas deste arquivo", 5);
  abas.forEach(([aba, tituloAba, descricao], i) => {
    const link = ws.getCell(linha, 1);
    link.value = { text: tituloAba, hyperlink: `#'${aba}'!A1` };
    link.font = { name: "Calibri", size: 10, bold: true, color: { argb: VERDE_MEDIO }, underline: true };
    link.alignment = { indent: 1 };
    link.border = { bottom: { style: "hair", color: { argb: BORDA_FINA } } };

    const obs = ws.getCell(linha, 2);
    obs.value = `${aba} · ${descricao}`;
    obs.font = { name: "Calibri", size: 9, color: { argb: CINZA } };
    obs.alignment = { indent: 1 };
    obs.border = { bottom: { style: "hair", color: { argb: BORDA_FINA } } };
    ws.mergeCells(linha, 2, linha, 5);
    if (i % 2 === 1) {
      const fill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: VERDE_BANDA } };
      link.fill = fill;
      obs.fill = fill;
    }
    ws.getRow(linha).height = 18;
    linha += 1;
  });

  linha += 1;
  for (let c = 1; c <= 5; c += 1) {
    ws.getCell(linha, c).border = { top: { style: "medium", color: { argb: AMBAR } } };
  }
  linha += 1;
  const assinatura = ws.getCell(linha, 1);
  assinatura.value = "Movidos pela fé";
  assinatura.font = { name: "Calibri", size: 12, bold: true, color: { argb: VERDE_MEDIO } };
  assinatura.alignment = { indent: 1 };
}

/* ---------- entrada ---------- */

type ConstrutorWorkbook = new () => Workbook;

/** Monta o .xlsx analítico do painel e dispara o download no navegador. */
export async function exportarExcelLopas(dados: VideoResumoProps): Promise<void> {
  const modulo = (await import("exceljs")) as unknown as {
    Workbook?: ConstrutorWorkbook;
    default?: { Workbook?: ConstrutorWorkbook };
  };
  const Workbook = modulo.Workbook ?? modulo.default?.Workbook;
  if (!Workbook) throw new Error("Biblioteca de Excel indisponível");

  const wb = new Workbook();
  wb.creator = "CD Lopas · Painel de Estoque";
  wb.created = new Date();

  /* Capa e Resumo nascem primeiro para abrir o arquivo; o conteúdo entra no
     fim, quando as outras abas já devolveram as referências das suas células. */
  const capa = criarAba(wb, "Capa", [48, 22, 18, 16, 16]);
  const resumo = criarAba(wb, "Resumo", [48, 22, 18, 46]);

  const refs: Record<string, Refs> = {
    estoque: abaEstoque(wb, dados),
    recebimento: abaRecebimento(wb, dados),
    reservas: abaReservas(wb, dados),
    fora: abaForaDeLinha(wb, dados),
    avarias: abaAvarias(wb, dados),
    pendentes: abaPendentes(wb, dados),
    producao: abaProducao(wb, dados),
    produtividade: abaProdutividade(wb),
    qlp: abaQlp(wb),
  };

  preencherResumo(resumo, dados, refs);
  preencherCapa(capa, dados, refs);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `LOPAS-estoque-analitico-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
