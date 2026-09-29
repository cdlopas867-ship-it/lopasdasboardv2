/* Cena Fora de Linha por categoria — classifica os itens descontinuados por
   unidade (Guarda-Roupas, Salas, Complementos e Outros) com cards de KPI e
   tabela-resumo compacta, no mesmo estilo das demais cenas da apresentação.
   Layout operacional sem valores financeiros. */

import { fmtInt, fmtPeso } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { ITENS_FORA_DE_LINHA, type ItemForaDeLinha, type PosicaoEstoque } from "@/data/fora-de-linha";

export type ForaDeLinhaProp = {
  itens: ItemForaDeLinha[];
  posicaoEmLinha: PosicaoEstoque;
  posicaoForaDeLinha: PosicaoEstoque;
  posicaoTotal: PosicaoEstoque;
} | null;

const CAT_CURTO: Record<string, string> = {
  "UNIDADE GUARDA ROUPAS": "Guarda-Roupas",
  "UNIDADE DE SALAS": "Salas",
  "UNIDADE DE COMPLEMENTOS": "Complementos",
  "EMBALAGEM JOGO DE PES": "Outros",
};

const CAT_COR: Record<string, string> = {
  "UNIDADE GUARDA ROUPAS": "#fbbf24",
  "UNIDADE DE SALAS": "#34d399",
  "UNIDADE DE COMPLEMENTOS": "#60a5fa",
  "EMBALAGEM JOGO DE PES": "#f472b6",
};

type CatResumo = {
  nome: string;
  curto: string;
  cor: string;
  itens: number;
  saldoFocco: number;
  disponivel: number;
  reservas: number;
  pesoKg: number;
  pesoReservadoKg: number;
};

export function calcularForaDeLinhaPorCategoria(itens: ItemForaDeLinha[] = ITENS_FORA_DE_LINHA): CatResumo[] {
  const map = new Map<string, CatResumo>();
  for (const item of itens) {
    const curto = CAT_CURTO[item.categoria] ?? item.categoria;
    if (!map.has(item.categoria)) {
      map.set(item.categoria, {
        nome: item.categoria,
        curto,
        cor: CAT_COR[item.categoria] ?? "#9ca3af",
        itens: 0,
        saldoFocco: 0,
        disponivel: 0,
        reservas: 0,
        pesoKg: 0,
        pesoReservadoKg: 0,
      });
    }
    const c = map.get(item.categoria)!;
    c.itens++;
    c.saldoFocco += item.saldoFocco;
    c.disponivel += item.disponivel;
    c.reservas += item.reservas;
    c.pesoKg += item.pesoKg;
    c.pesoReservadoKg += item.pesoReservadoKg;
  }
  return [...map.values()].sort((a, b) => b.pesoKg - a.pesoKg);
}

export default function CenaForaDeLinha({
  anim,
  foraDeLinha,
  onPausar,
}: {
  anim: boolean;
  foraDeLinha?: ForaDeLinhaProp | null;
  onPausar?: () => void;
}) {
  const itens = foraDeLinha?.itens ?? ITENS_FORA_DE_LINHA;
  const cats = calcularForaDeLinhaPorCategoria(itens);
  const totalItens = cats.reduce((s, c) => s + c.itens, 0);
  const totalSaldo = cats.reduce((s, c) => s + c.saldoFocco, 0);
  const totalDisponivel = cats.reduce((s, c) => s + c.disponivel, 0);
  const totalReservas = cats.reduce((s, c) => s + c.reservas, 0);
  const totalPesoKg = cats.reduce((s, c) => s + c.pesoKg, 0);
  const totalPesoReservadoKg = cats.reduce((s, c) => s + c.pesoReservadoKg, 0);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Fora de Linha · por categoria
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto="Itens descontinuados que ainda ocupam espaço no CD. Fonte: planilha de estoque."
        />
      </div>

      <div className="video-sobe mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1" style={{ animationDelay: "0.1s" }}>
        <p className="font-serif text-2xl text-white sm:text-3xl">
          {fmtInt(totalItens)} <span className="text-sm text-white/60 sm:text-base">itens</span>
        </p>
        <span className="rounded-full border border-brand-amber/40 bg-brand-amber/15 px-2.5 py-0.5 text-xs font-semibold text-brand-amber sm:text-sm">
          {fmtPeso(totalPesoReservadoKg)} reservados
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {cats.map((c, i) => (
          <div
            key={c.nome}
            className="video-sobe rounded-xl border border-white/15 bg-white/5 px-2 py-2 text-center sm:px-3"
            style={{ animationDelay: `${0.15 * (i + 1)}s` }}
          >
            <div className="flex items-center justify-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: c.cor }} />
              <p className="truncate text-[9px] font-bold tracking-widest text-white/60 uppercase sm:text-[10px]">
                {c.curto}
              </p>
            </div>
            <p className="mt-1 font-serif text-lg text-white sm:text-xl">
              {fmtInt(c.itens)} <span className="text-[9px] text-white/45">itens</span>
            </p>
            <div className="mt-1 font-mono text-[10px] text-white/55">{fmtPeso(c.pesoKg)}</div>
          </div>
        ))}
      </div>

      <div className="video-sobe mt-3 overflow-x-auto" style={{ animationDelay: "0.6s" }}>
        <table className="w-full min-w-[30rem] text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/50 uppercase">
              <th className="pb-1 font-bold">Categoria</th>
              <th className="pb-1 text-right font-bold">Itens</th>
              <th className="pb-1 text-right font-bold">Saldo</th>
              <th className="pb-1 text-right font-bold">Disponível</th>
              <th className="pb-1 text-right font-bold">Reservas</th>
              <th className="pb-1 text-right font-bold">Massa</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.nome} className="border-b border-white/10 last:border-0">
                <td className="flex items-center gap-1.5 py-1">
                  <span className="size-2 rounded-full" style={{ background: c.cor }} />
                  <span className="font-semibold text-white/80">{c.curto}</span>
                </td>
                <td className="py-1 text-right font-mono">{fmtInt(c.itens)}</td>
                <td className="py-1 text-right font-mono text-white/70">{fmtInt(c.saldoFocco)}</td>
                <td className="py-1 text-right font-mono text-white/70">{fmtInt(c.disponivel)}</td>
                <td className="py-1 text-right font-mono text-white/70">{fmtInt(c.reservas)}</td>
                <td className="py-1 text-right font-mono text-white/70">{fmtPeso(c.pesoKg)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-white/30 font-bold">
              <td className="py-1 text-white">Total</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(totalItens)}</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(totalSaldo)}</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(totalDisponivel)}</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(totalReservas)}</td>
              <td className="py-1 text-right font-mono text-white">{fmtPeso(totalPesoKg)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-center text-[9px] font-medium tracking-[0.2em] text-white/40 uppercase">
        Fonte: planilha Estoque Em Linha x Fora de Linha · CD Móveis Lopas
      </p>
    </div>
  );
}
