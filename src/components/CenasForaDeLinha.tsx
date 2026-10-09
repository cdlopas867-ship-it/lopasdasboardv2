import { cn } from "@/lib/utils";
import { fmtInt, fmtMoeda, fmtPct, fmtPeso } from "@/lib/format";
import {
  ITENS_FORA_DE_LINHA,
  POSICAO_EM_LINHA,
  POSICAO_FORA_DE_LINHA,
  POSICAO_TOTAL as POSICAO_TOTAL_FIXO,
  type ItemForaDeLinha,
  type PosicaoEstoque,
} from "@/data/fora-de-linha";

/* Cenas da apresentação Fora de linha — mesmas animações das outras telas.
   Cena 0: resumo (título, KPIs e comparativo em linha x fora de linha).
   Cena 1: lista interativa com busca e filtros. */

const CATEGORIAS = [...new Set(ITENS_FORA_DE_LINHA.map((i) => i.categoria))].sort();
const ORIGENS = [...new Set(ITENS_FORA_DE_LINHA.map((i) => i.origem))].sort();

const CAT_CURTO: Record<string, string> = {
  "UNIDADE GUARDA ROUPAS": "Guarda-Roupas",
  "UNIDADE DE SALAS": "Salas",
  "UNIDADE DE COMPLEMENTOS": "Complementos",
  "EMBALAGEM JOGO DE PES": "Embalagem",
};

const CONTROL_CLS =
  "rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white backdrop-blur-md outline-none focus:border-primary/60";

type Props = {
  cena: number;
  anim: boolean;
  busca: string;
  setBusca: (v: string) => void;
  categoria: string;
  setCategoria: (v: string) => void;
  origem: string;
  setOrigem: (v: string) => void;
  itens: ItemForaDeLinha[];
  valorFiltrado: number;
  totalItens?: number;
  posicoes?: { emLinha: PosicaoEstoque; fora: PosicaoEstoque; total: PosicaoEstoque };
};

function KpiCard({
  rotulo,
  valor,
  detalhe,
  delay,
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
  delay: string;
}) {
  return (
    <div
      className="video-sobe rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md"
      style={{ animationDelay: delay }}
    >
      <p className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">{rotulo}</p>
      <p className="mt-1 font-serif text-3xl tracking-tight text-white">{valor}</p>
      <p className="mt-1 text-xs leading-relaxed text-white/70">{detalhe}</p>
    </div>
  );
}

function Comparativo({ POSICAO_EM_LINHA, POSICAO_FORA_DE_LINHA, POSICAO_TOTAL }: { POSICAO_EM_LINHA: PosicaoEstoque; POSICAO_FORA_DE_LINHA: PosicaoEstoque; POSICAO_TOTAL: PosicaoEstoque }) {
  const fatias = [
    { nome: "Em linha", pos: POSICAO_EM_LINHA, cor: "bg-primary" },
    { nome: "Fora de linha", pos: POSICAO_FORA_DE_LINHA, cor: "bg-brand-amber" },
  ];
  const metricas: [string, (i: typeof POSICAO_EM_LINHA) => number][] = [
    ["Itens", (i) => i.itens],
    ["Valor em estoque", (i) => i.valorEstoque],
    ["Peso total", (i) => i.pesoTon],
  ];
  return (
    <div
      className="video-sobe rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md"
      style={{ animationDelay: "0.36s" }}
    >
      <p className="text-[10px] font-semibold tracking-widest text-primary uppercase">
        Posição de estoque · Em linha x Fora de linha
      </p>
      <div className="mt-4 space-y-5">
        {metricas.map(([rotulo, get]) => {
          const total = get(POSICAO_TOTAL);
          return (
            <div key={rotulo}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold tracking-widest text-white/60 uppercase">{rotulo}</span>
                <span className="text-white/50">base: {fmtInt(total)}</span>
              </div>
              <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-white/15">
                {fatias.map((f) => (
                  <div
                    key={f.nome}
                    className={cn("h-full", f.cor)}
                    style={{ width: `${(get(f.pos) / total) * 100}%` }}
                    title={`${f.nome}: ${fmtInt(get(f.pos))}`}
                  />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs">
                {fatias.map((f) => (
                  <span key={f.nome} className="flex items-center gap-1.5 text-white/70">
                    <span className={cn("size-2 rounded-full", f.cor)} />
                    {f.nome} · {fmtInt(get(f.pos))} ({fmtPct(get(f.pos) / total)})
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: ItemForaDeLinha }) {
  return (
    <tr className="border-t border-white/10 transition-colors hover:bg-white/5">
      <td className="px-3 py-3 font-mono text-xs whitespace-nowrap">{item.chave}</td>
      <td className="max-w-[22rem] px-3 py-3">
        <p className="truncate text-sm font-semibold text-white" title={item.desc}>
          {item.desc}
        </p>
        <p className="truncate text-xs text-white/50" title={item.mascara}>
          {item.mascara}
        </p>
      </td>
      <td className="px-3 py-3 text-xs whitespace-nowrap text-white/70">
        {CAT_CURTO[item.categoria] ?? item.categoria}
      </td>
      <td className="px-3 py-3 text-xs whitespace-nowrap text-white/70">{item.origem}</td>
      <td className="px-3 py-3 text-right font-mono text-sm whitespace-nowrap">{fmtInt(item.saldoFocco)}</td>
      <td className="px-3 py-3 text-right font-mono text-sm whitespace-nowrap">
        {fmtInt(item.disponivel)}
      </td>
      <td className="px-3 py-3 text-right font-mono text-sm whitespace-nowrap text-white/70">
        {fmtPeso(item.pesoKg)}
      </td>
      <td className="px-3 py-3 text-right font-mono text-sm whitespace-nowrap text-primary">
        {fmtMoeda(item.valorEstoque)}
      </td>
    </tr>
  );
}

function CenaResumo({ posicoes }: { posicoes?: Props["posicoes"] }) {
  const POSICAO_TOTAL = posicoes?.total ?? POSICAO_TOTAL_FIXO;
  const pos = posicoes?.fora ?? POSICAO_FORA_DE_LINHA;
  const emLinha = posicoes?.emLinha ?? POSICAO_EM_LINHA;
  return (
    <div className="py-4">
      <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
        Centro de Distribuição · Posição de estoque
      </p>
      <h1
        className="video-sobe mt-2 font-serif text-4xl tracking-tight text-white sm:text-5xl"
        style={{ animationDelay: "0.08s" }}
      >
        Itens fora de linha
      </h1>
      <p
        className="video-sobe mt-3 max-w-2xl text-sm leading-relaxed text-white/70"
        style={{ animationDelay: "0.16s" }}
      >
        {fmtInt(pos.itens)} itens descontinuados ainda ocupam o CD — {fmtMoeda(pos.valorEstoque)} em
        custo ({fmtPct(pos.valorEstoque / Math.max(POSICAO_TOTAL.valorEstoque, 1))} do valor total) e{" "}
        {fmtPeso(pos.pesoTon * 1000)} de massa ({fmtPct(pos.pesoTon / POSICAO_TOTAL.pesoTon)} do peso
        total).
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div style={{ animationDelay: "0.2s" }}>
          <KpiCard
            rotulo="Itens fora de linha"
            valor={fmtInt(pos.itens)}
            detalhe={`${fmtPct(pos.itens / POSICAO_TOTAL.itens)} do catálogo total de ${fmtInt(POSICAO_TOTAL.itens)} itens.`}
            delay="0s"
          />
        </div>
        <div style={{ animationDelay: "0.24s" }}>
          <KpiCard
            rotulo="Valor em estoque"
            valor={fmtMoeda(pos.valorEstoque)}
            detalhe={`R$ ${fmtInt(pos.valorReservado)} já reservados para vendas.`}
            delay="0s"
          />
        </div>
        <div style={{ animationDelay: "0.28s" }}>
          <KpiCard
            rotulo="Massa reservada"
            valor={fmtPeso(pos.pesoReservadoTon * 1000)}
            detalhe={`De ${fmtPeso(pos.pesoTon * 1000)} de massa total, ${fmtPct(pos.pesoReservadoTon / pos.pesoTon)} está reservada nas posições do CD.`}
            delay="0s"
          />
        </div>
        <div style={{ animationDelay: "0.32s" }}>
          <KpiCard
            rotulo="Saldo físico"
            valor={fmtInt(pos.saldoFocco)}
            detalhe={`${fmtInt(pos.disponivel)} disponíveis e ${fmtInt(pos.reservas)} reservados (+${fmtInt(pos.saldoFull)} só no FullSoft).`}
            delay="0s"
          />
        </div>
      </div>

      <div className="mt-6">
        <Comparativo POSICAO_EM_LINHA={emLinha} POSICAO_FORA_DE_LINHA={pos} POSICAO_TOTAL={POSICAO_TOTAL} />
      </div>
    </div>
  );
}

function CenaLista({
  busca,
  setBusca,
  categoria,
  setCategoria,
  origem,
  setOrigem,
  itens,
  valorFiltrado,
  totalItens,
}: Omit<Props, "cena" | "anim">) {
  return (
    <div className="py-4">
      <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
        Lista de itens · {itens.length} de {totalItens ?? ITENS_FORA_DE_LINHA.length}
      </p>
      <p
        className="video-sobe mt-1 text-xs text-white/50"
        style={{ animationDelay: "0.08s" }}
      >
        Valor filtrado: <span className="font-semibold text-primary">{fmtMoeda(valorFiltrado)}</span>
      </p>

      <div className="video-sobe mt-4 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ animationDelay: "0.16s" }}>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar item, chave ou máscara…"
          className={cn(CONTROL_CLS, "flex-1 placeholder:text-white/40")}
        />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={CONTROL_CLS}>
          <option value="" className="bg-brand-dark">
            Todas as categorias
          </option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c} className="bg-brand-dark">
              {CAT_CURTO[c] ?? c}
            </option>
          ))}
        </select>
        <select value={origem} onChange={(e) => setOrigem(e.target.value)} className={CONTROL_CLS}>
          <option value="" className="bg-brand-dark">
            Todas as origens
          </option>
          {ORIGENS.map((o) => (
            <option key={o} value={o} className="bg-brand-dark">
              {o}
            </option>
          ))}
        </select>
      </div>

      <div className="video-sobe mt-4 overflow-x-auto" style={{ animationDelay: "0.24s" }}>
        <table className="w-full min-w-[48rem] text-left">
          <thead>
            <tr className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
              <th className="px-3 pb-2">Chave</th>
              <th className="px-3 pb-2">Descrição / máscara</th>
              <th className="px-3 pb-2">Categoria</th>
              <th className="px-3 pb-2">Origem</th>
              <th className="px-3 pb-2 text-right">Saldo</th>
              <th className="px-3 pb-2 text-right">Disponível</th>
              <th className="px-3 pb-2 text-right">Peso</th>
              <th className="px-3 pb-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <ItemRow key={item.chave} item={item} />
            ))}
            {!itens.length && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-sm text-white/50">
                  Nenhum item encontrado com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-center text-[9px] font-medium tracking-[0.2em] text-white/40 uppercase">
        Fonte: planilha Estoque Em Linha x Fora de Linha · CD Móveis Lopas
      </p>
    </div>
  );
}

export default function CenasForaDeLinha(props: Props) {
  const { cena } = props;
  return (
    <>
      {cena === 0 && <CenaResumo posicoes={props.posicoes} />}
      {cena === 1 && <CenaLista {...props} />}
    </>
  );
}
