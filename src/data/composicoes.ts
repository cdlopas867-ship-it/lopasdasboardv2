/* Composição de Estoque x FullSoft x Curva ABC — base de composições da Lopas.
   O padrão vem de public/composicoes.json (planilha de 17/08/2026); ao carregar
   uma planilha nova com a aba "COMPOSIÇÕES", o Dashboard passa a lista via props. */

export type VolumeComposicao = {
  item: string;
  desc: string;
  mascara: string;
  curva: string;
  unidade: string;
  saldo: number;
  fullsoft: number;
};

export type Composicao = {
  nome: string;
  cod: string;
  curva: string;
  produto: string;
  saldo: number;
  custo: number;
  volumes: VolumeComposicao[];
};

export type BaseComposicoes = { geradoEm: string; composicoes: Composicao[] };

export async function carregarComposicoes(): Promise<BaseComposicoes | null> {
  const r = await fetch("/composicoes.json");
  if (!r.ok) return null;
  const d = (await r.json()) as BaseComposicoes;
  return d?.composicoes?.length ? d : null;
}
