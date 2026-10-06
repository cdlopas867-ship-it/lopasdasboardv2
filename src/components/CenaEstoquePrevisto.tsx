/* Cena Estoque × Previsto — donut interativo com toggle Estoque / Previsto.
   Mesmo padrão da CenaOcupação: donut + botões + tabela de resumo. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt, fmtMoeda, fmtMoeda2, fmtTonDec } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";

const COR_ESTOQUE = "#00FFCC";
const COR_PREVISTO = "#FFA500";

type ResumoEstoque = { valor: number; previsto: number; ton: number; saldo: number; itens: number };

export default function CenaEstoquePrevisto({
  anim,
  resumo,
  valorFaturado,
  cena,
  onPausar,
}: {
  anim: boolean;
  resumo: ResumoEstoque;
  valorFaturado?: number;
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

  const linhas =
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
            {linhas.map((l, i) => {
              const cor = foco === 0 ? COR_ESTOQUE : COR_PREVISTO;
              return (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-white/10 last:border-0 transition-all duration-300",
                  )}
                >
                  <td className="py-0.5 text-white/80">{l.rotulo}</td>
                  <td className="py-0.5 text-right font-mono font-semibold text-white">{l.valor}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * Estoque: valor atual do estoque. Previsto: toneladas × R$/t faturado. Clique no gráfico para alternar.
        </p>
      </div>
    </div>
  );
}
