/* Cena Estoque × Previsto — donut interativo com toggle Estoque / Previsto.
   Mesmo padrão da CenaOcupação: donut + botões + tabela de resumo.
   Inclui breakdown por categoria (Guarda-Roupas, Salas, Complementos). */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt, fmtMoeda, fmtMoeda2, fmtTonDec } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import type { VideoUnidade } from "./VideoResumoDashboard";

const COR_ESTOQUE = "#00FFCC";
const COR_PREVISTO = "#FFA500";

type ResumoEstoque = { valor: number; previsto: number; ton: number; saldo: number; itens: number };

/* Extrai um valor numérico de um stat (ex: "75.274 un" → 75274). */
function statNum(stats: [string, string][] | undefined, chave: string): number | undefined {
  const s = stats?.find(([k]) => k === chave);
  if (!s) return undefined;
  return Number(s[1].replace(/[^\d,-]/g, "").replace(",", "."));
}

export default function CenaEstoquePrevisto({
  anim,
  resumo,
  valorFaturado,
  unidades,
  cena,
  onPausar,
}: {
  anim: boolean;
  resumo: ResumoEstoque;
  valorFaturado?: number;
  unidades?: VideoUnidade[];
  cena: number;
  onPausar?: () => void;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);

  const total = resumo.valor + resumo.previsto;
  const pctEstoque = total > 0 ? (resumo.valor / total) * 100 : 0;
  const pctPrevisto = total > 0 ? (resumo.previsto / total) * 100 : 0;

  const secoes: SecaoDonut[] = [
    { id: "estoque", label: "estoque", cor: COR_ESTOQUE, pct: pctEstoque },
    { id: "previsto", label: "previsto", cor: COR_PREVISTO, pct: pctPrevisto },
  ];

  /* Linhas base do resumo (estoque ou previsto) */
  const linhasBase =
    foco === 0
      ? [
          { rotulo: "Valor em estoque", valor: fmtMoeda(resumo.valor) },
          { rotulo: "Toneladas", valor: fmtTonDec(resumo.ton) },
          { rotulo: "Itens", valor: fmtInt(resumo.itens) },
          { rotulo: "Saldo", valor: fmtInt(resumo.saldo) },
        ]
      : [
          { rotulo: "Valor previsto", valor: fmtMoeda(resumo.previsto) },
          { rotulo: "Toneladas", valor: fmtTonDec(resumo.ton) },
          ...(valorFaturado
            ? [{ rotulo: "R$/t faturado", valor: fmtMoeda2(valorFaturado) }]
            : []),
          { rotulo: "Cálculo", valor: `${fmtTonDec(resumo.ton)} × ${valorFaturado ? fmtMoeda2(valorFaturado) : "—"}` },
        ];

  /* Breakdown por categoria */
  const cats = (unidades ?? []).filter((u) => u.stats?.length);
  const temCategorias = cats.length > 0;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Estoque × Previsto
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto="Valor em estoque = custo médio × saldo de cada item. Valor previsto = toneladas em estoque × R$/t faturado. O gráfico mostra a participação de cada parcela no total (estoque + previsto). Clique para alternar."
        />
      </div>

      <DonutInterativo
        secoes={secoes}
        foco={foco}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />
      <ToggleSecoes secoes={secoes} foco={foco} onChange={setFoco} />

      {/* Resumo rápido da seção ativa */}
      <p className="mt-1.5 text-center text-[11px] text-white/70">
        {foco === 0
          ? `${fmtMoeda(resumo.valor)} em estoque`
          : `${fmtMoeda(resumo.previsto)} valor previsto`}
      </p>

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
                <td className="py-0.5 text-right font-mono font-semibold text-white">{l.valor}</td>
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
                        <span className="ml-1.5 text-[9px] font-bold" style={{ color: foco === 0 ? COR_ESTOQUE : COR_PREVISTO }}>
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
          * Estoque: valor atual do estoque. Previsto: toneladas × R$/t faturado. Clique no gráfico para alternar.
        </p>
      </div>
    </div>
  );
}
