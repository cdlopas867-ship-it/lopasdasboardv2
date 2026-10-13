/* Cena Estoque × Em Linha — donut interativo com toggle Estoque / Em Linha.
   Mostra a proporção do peso que está em linha de produção vs fora de linha.
   Inclui breakdown por categoria (Guarda-Roupas, Salas, Complementos). */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt, fmtMoeda, fmtTonDec } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, DestaqueGradiente, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import type { VideoUnidade } from "./VideoResumoDashboard";
import { POSICAO_EM_LINHA, POSICAO_TOTAL, POSICAO_FORA_DE_LINHA, type PosicaoEstoque } from "@/data/fora-de-linha";

const COR_ESTOQUE = "#00FFCC";
const COR_EM_LINHA = "#38BDF8";

type ResumoEstoque = { valor: number; previsto: number; ton: number; saldo: number; itens: number };

type ForaDeLinhaProp = {
  posicaoTotal: PosicaoEstoque;
  posicaoEmLinha: PosicaoEstoque;
  posicaoForaDeLinha: PosicaoEstoque;
} | null;

/* Extrai um valor numérico de um stat (ex: "75.274 un" → 75274). */
function statNum(stats: [string, string][] | undefined, chave: string): number | undefined {
  const s = stats?.find(([k]) => k === chave);
  if (!s) return undefined;
  return Number(s[1].replace(/[^\d,-]/g, "").replace(",", "."));
}

export default function CenaEstoquePrevisto({
  anim,
  resumo,
  unidades,
  foraDeLinha,
  cena,
  onPausar,
}: {
  anim: boolean;
  resumo: ResumoEstoque;
  valorFaturado?: number;
  unidades?: VideoUnidade[];
  foraDeLinha?: ForaDeLinhaProp;
  cena: number;
  onPausar?: () => void;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);

  const posTotal = foraDeLinha?.posicaoTotal ?? POSICAO_TOTAL;
  const posEmLinha = foraDeLinha?.posicaoEmLinha ?? POSICAO_EM_LINHA;
  const posFora = foraDeLinha?.posicaoForaDeLinha ?? POSICAO_FORA_DE_LINHA;

  const pesoTotal = posTotal.pesoTon;
  const pesoEmLinha = posEmLinha.pesoTon;
  const pesoFora = posFora.pesoTon;

  const pctEmLinha = pesoTotal > 0 ? (pesoEmLinha / pesoTotal) * 100 : 0;
  const pctEstoque = pesoTotal > 0 ? (pesoFora / pesoTotal) * 100 : 0;

  const secoes: SecaoDonut[] = [
    { id: "estoque", label: "estoque", cor: COR_ESTOQUE, pct: pctEstoque },
    { id: "emLinha", label: "em linha", cor: COR_EM_LINHA, pct: pctEmLinha },
  ];

  /* Linhas base do resumo (estoque fora de linha ou em linha) */
  const linhasBase =
    foco === 0
      ? [
          { rotulo: "Peso fora de linha", valor: `${fmtTonDec(pesoFora)}`, destaque: true },
          { rotulo: "Itens", valor: fmtInt(posFora.itens) },
          { rotulo: "Saldo", valor: fmtInt(posFora.saldoFocco) },
          { rotulo: "Valor", valor: fmtMoeda(posFora.valorEstoque) },
        ]
      : [
          { rotulo: "Peso em linha", valor: `${fmtTonDec(pesoEmLinha)}`, destaque: true },
          { rotulo: "Itens", valor: fmtInt(posEmLinha.itens) },
          { rotulo: "Saldo", valor: fmtInt(posEmLinha.saldoFocco) },
          { rotulo: "Valor", valor: fmtMoeda(posEmLinha.valorEstoque) },
        ];

  /* Breakdown por categoria */
  const cats = (unidades ?? []).filter((u) => u.stats?.length);
  const temCategorias = cats.length > 0;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Estoque × Em Linha
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto="Peso total do estoque dividido entre itens em linha de produção e itens fora de linha. Em linha = itens ativos no catálogo. Fora de linha = itens descontinuados que ainda ocupam o CD. Os % são sobre o peso total. Clique para alternar."
        />
      </div>

      <DonutInterativo
        secoes={secoes}
        foco={foco}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />
      <ToggleSecoes secoes={secoes} foco={foco} onChange={setFoco} />

      {/* Resumo rápido da seção ativa — destaque em gradiente */}
      <div className="mt-2 flex w-full justify-center">
        <DestaqueGradiente
          numero={`${fmtBrMax(foco === 0 ? pctEstoque : pctEmLinha, 1)}%`}
          rotulo={foco === 0 ? " fora de linha" : " em linha"}
        />
      </div>

      {/* Tabela de detalhes */}
      <div className="video-sobe mt-3 w-full max-w-sm mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Resumo
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Indicador</th>
              <th className="pb-0.5 text-right font-bold">Valor</th>
            </tr>
          </thead>
          <tbody>
            {linhasBase.map((l, i) => (
              <tr key={i} className="border-b border-white/10 last:border-0">
                <td className="py-0.5 text-white/80">{l.rotulo}</td>
                <td className={cn("py-0.5 text-right font-mono", l.destaque ? "font-extrabold text-base text-white" : "font-semibold text-white")}>{l.valor}</td>
              </tr>
            ))}

            {/* Breakdown por categoria */}
            {temCategorias && (
              <>
                <tr className="border-b border-white/20">
                  <td colSpan={2} className="pt-2 pb-0.5 text-[8px] font-bold tracking-[0.3em] text-white/55 uppercase">
                    % por categoria
                  </td>
                </tr>
                {cats.map((u, i) => {
                  const saldo = statNum(u.stats, "Saldo");
                  const itens = statNum(u.stats, "Itens");
                  const peso = statNum(u.stats, "Peso");
                  const valor = foco === 0 ? u.valor : (u.previsto ?? "—");
                  return (
                    <tr key={i} className="border-b border-white/10 last:border-0">
                      <td className="py-0.5">
                        <span className="text-white/80">{u.nome}</span>
                        <span className="ml-1.5 text-[9px] font-bold" style={{ color: foco === 0 ? COR_ESTOQUE : COR_EM_LINHA }}>
                          {fmtBrMax(u.share, 1)}%
                        </span>
                      </td>
                      <td className="py-0.5 text-right font-mono font-semibold text-white">
                        {valor}
                        {saldo !== undefined && (
                          <span className="ml-1 text-[9px] text-white/45">
                            · {fmtInt(saldo)} un
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {/* Linha de totais por categoria */}
                {temCategorias && (
                  <tr className="border-t-2 border-white/40 bg-white/10 font-bold last:border-0">
                    <td className="py-1 text-[9px] font-bold tracking-widest text-white uppercase">
                      Qtd total
                    </td>
                    <td className="py-1 text-right font-mono text-[10px] text-white">
                      {fmtInt(cats.reduce((s, u) => s + (statNum(u.stats, "Saldo") ?? 0), 0))} un
                      {" · "}
                      {fmtTonDec(cats.reduce((s, u) => s + (statNum(u.stats, "Peso") ?? 0), 0))}
                      {" · "}
                      {fmtInt(cats.reduce((s, u) => s + (statNum(u.stats, "Itens") ?? 0), 0))} itens
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * Em linha: itens ativos no catálogo. Fora de linha: itens descontinuados ainda no CD. % sobre o peso total. Clique no gráfico para alternar.
        </p>
      </div>

    </div>
  );
}
