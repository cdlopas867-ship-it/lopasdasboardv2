/* Cena Fora de Linha por categoria — classifica os itens descontinuados por
   unidade (Guarda-Roupas, Salas, Complementos) com cards de KPI e
   tabela-resumo compacta, no mesmo estilo das demais cenas da apresentação.
   Layout enxuto para caber na tela sem cortar. */

import { cn } from "@/lib/utils";
import { fmtInt, fmtMoeda, fmtPct, fmtPeso, fmtBrMax } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import {
  ITENS_FORA_DE_LINHA,
  POSICAO_EM_LINHA,
  POSICAO_FORA_DE_LINHA,
  POSICAO_TOTAL,
  type ItemForaDeLinha,
  type PosicaoEstoque,
} from "@/data/fora-de-linha";

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
  "EMBALAGEM JOGO DE PES": "Embalagem",
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
  valorEstoque: number;
  valorReservado: number;
};

export function calcularForaDeLinhaPorCategoria(itens: ItemForaDeLinha[] = ITENS_FORA_DE_LINHA): CatResumo[] {
  const map = new Map<string, CatResumo>();
  for (const item of itens) {
    /* Embalagem removida — só Guarda-Roupas, Salas e Complementos */
    if (item.categoria === "EMBALAGEM JOGO DE PES") continue;
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
        valorEstoque: 0,
        valorReservado: 0,
      });
    }
    const c = map.get(item.categoria)!;
    c.itens++;
    c.saldoFocco += item.saldoFocco;
    c.disponivel += item.disponivel;
    c.reservas += item.reservas;
    c.pesoKg += item.pesoKg;
    c.pesoReservadoKg += item.pesoReservadoKg;
    c.valorEstoque += item.valorEstoque;
    c.valorReservado += item.valorReservado;
  }
  return [...map.values()].sort((a, b) => b.valorEstoque - a.valorEstoque);
}

export default function CenaForaDeLinha({ anim, foraDeLinha, onPausar }: { anim: boolean; foraDeLinha?: ForaDeLinhaProp | null; onPausar?: () => void }) {
  const itens = foraDeLinha?.itens ?? ITENS_FORA_DE_LINHA;
  const posicaoEmLinha = foraDeLinha?.posicaoEmLinha ?? POSICAO_EM_LINHA;
  const posicaoFora = foraDeLinha?.posicaoForaDeLinha ?? POSICAO_FORA_DE_LINHA;
  const posicaoTotal = foraDeLinha?.posicaoTotal ?? POSICAO_TOTAL;
  const cats = calcularForaDeLinhaPorCategoria(itens);
  const totalValor = cats.reduce((s, c) => s + c.valorEstoque, 0);
  const totalItens = cats.reduce((s, c) => s + c.itens, 0);
  const totalSaldo = cats.reduce((s, c) => s + c.saldoFocco, 0);
  const totalDisponivel = cats.reduce((s, c) => s + c.disponivel, 0);
  const totalReservas = cats.reduce((s, c) => s + c.reservas, 0);
  const totalPesoKg = cats.reduce((s, c) => s + c.pesoKg, 0);
  const totalPesoReservadoKg = cats.reduce((s, c) => s + c.pesoReservadoKg, 0);
  const maxValor = Math.max(...cats.map((c) => c.valorEstoque), 1);

  /* Dados para comparação Em Linha × Fora de Linha */
  const grupos = [
    { pos: posicaoEmLinha, cor: "#34d399", rotulo: "Em Linha" },
    { pos: posicaoFora, cor: "#fbbf24", rotulo: "Fora de Linha" },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Em Linha × Fora de Linha
        </p>
        <InfoTooltip onOpen={onPausar} texto="Comparativo entre itens em linha (ativos) e fora de linha (descontinuados). Inclui itens, saldo, valor em estoque, reservas e massa. Fonte: planilha 'Estoque Em Linha x Fora de Linha'. Atualizado em 24/09/2026." />
      </div>

      {/* Comparação Em Linha × Fora de Linha */}
      <div className="video-sobe mt-3 grid grid-cols-2 gap-2.5" style={{ animationDelay: "0.1s" }}>
        {grupos.map((g) => {
          const pctValor = g.pos.valorEstoque / posicaoTotal.valorEstoque;
          const pctItens = g.pos.itens / posicaoTotal.itens;
          return (
            <div
              key={g.rotulo}
              className="rounded-xl border border-white/15 bg-white/5 p-2.5"
              style={{ borderColor: `${g.cor}40` }}
            >
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: g.cor }} />
                <p className="text-[10px] font-bold tracking-widest text-white/70 uppercase">{g.rotulo}</p>
              </div>
              <p className="mt-1.5 font-serif text-xl text-white sm:text-2xl">
                {fmtInt(g.pos.itens)} <span className="text-[10px] text-white/50">itens</span>
              </p>
              <div className="mt-1.5 space-y-0.5 text-[10px] text-white/70">
                <div className="flex justify-between">
                  <span className="text-white/45">Valor</span>
                  <span className="font-mono font-semibold text-white">{fmtMoeda(g.pos.valorEstoque)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/45">Saldo</span>
                  <span className="font-mono font-semibold text-white">{fmtInt(g.pos.saldoFocco)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/45">Reservado</span>
                  <span className="font-mono font-semibold text-white">{fmtMoeda(g.pos.valorReservado)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/45">Massa</span>
                  <span className="font-mono font-semibold text-white">{fmtBrMax(g.pos.pesoTon, 1)} t</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-0.5">
                  <span className="text-white/45">% valor</span>
                  <span className="font-mono font-bold" style={{ color: g.cor }}>{fmtPct(pctValor)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/45">% itens</span>
                  <span className="font-mono font-bold" style={{ color: g.cor }}>{fmtPct(pctItens)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de proporção do valor */}
      <div className="video-sobe mt-2" style={{ animationDelay: "0.2s" }}>
        <div className="flex h-3 overflow-hidden rounded-full">
          <div
            className={cn("video-barra-x h-full", !anim && "video-pausada")}
            style={{ width: `${(posicaoEmLinha.valorEstoque / posicaoTotal.valorEstoque) * 100}%`, background: "#34d399", animationDelay: "0.3s" }}
          />
          <div
            className={cn("video-barra-x h-full", !anim && "video-pausada")}
            style={{ width: `${(posicaoFora.valorEstoque / posicaoTotal.valorEstoque) * 100}%`, background: "#fbbf24", animationDelay: "0.4s" }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[9px] font-bold text-white/50">
          <span className="text-emerald-400">{fmtPct(posicaoEmLinha.valorEstoque / posicaoTotal.valorEstoque)} em linha</span>
          <span className="text-brand-amber">{fmtPct(posicaoFora.valorEstoque / posicaoTotal.valorEstoque)} fora de linha</span>
        </div>
      </div>

      {/* Tabela resumo — barras inline no valor */}
      <div className="video-sobe mt-3 overflow-x-auto" style={{ animationDelay: "0.6s" }}>
        <table className="w-full min-w-[34rem] text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/50 uppercase">
              <th className="pb-1 font-bold">Categoria</th>
              <th className="pb-1 text-right font-bold">Itens</th>
              <th className="pb-1 text-right font-bold">Saldo</th>
              <th className="pb-1 text-right font-bold">Disponível</th>
              <th className="pb-1 text-right font-bold">Reservas</th>
              <th className="pb-1 text-right font-bold">Massa</th>
              <th className="pb-1 text-right font-bold">Valor</th>
              <th className="pb-1 text-right font-bold">% valor</th>
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
                <td className="py-1 text-right">
                  <span className="relative inline-block">
                    <span
                      className={cn("absolute inset-y-0 right-0 rounded-sm opacity-25", !anim && "video-pausada")}
                      style={{
                        width: `${(c.valorEstoque / maxValor) * 100}%`,
                        background: c.cor,
                        animationDelay: "0.4s",
                      }}
                    />
                    <span className="relative font-mono font-semibold">{fmtMoeda(c.valorEstoque)}</span>
                  </span>
                </td>
                <td className="py-1 text-right font-mono font-bold" style={{ color: c.cor }}>
                  {fmtPct(c.valorEstoque / totalValor)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-white/30 font-bold">
              <td className="py-1 text-white">Total</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(totalItens)}</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(totalSaldo)}</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(totalDisponivel)}</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(totalReservas)}</td>
              <td className="py-1 text-right font-mono text-white">{fmtPeso(totalPesoKg)}</td>
              <td className="py-1 text-right font-mono text-brand-amber">{fmtMoeda(totalValor)}</td>
              <td className="py-1 text-right font-mono text-brand-amber">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
