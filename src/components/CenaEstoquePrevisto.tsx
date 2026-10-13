/* Cena Estoque × Previsto — donut interativo com toggle Em Linha / Fora de Linha.
   O donut mostra a ocupação do estoque (% da tonelagem em linha vs fora de linha).
   Inclui breakdown por categoria (Guarda-Roupas, Salas, Complementos) e o
   resumo Estoque × Previsto logo abaixo. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt, fmtMoeda, fmtMoeda2, fmtTonDec } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, DestaqueGradiente, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import type { VideoUnidade } from "./VideoResumoDashboard";
import { POSICAO_EM_LINHA, POSICAO_FORA_DE_LINHA, POSICAO_TOTAL, type PosicaoEstoque } from "@/data/fora-de-linha";

const COR_EM_LINHA = "#00FFCC";
const COR_FORA = "#FFA500";

type ResumoEstoque = { valor: number; previsto: number; ton: number; saldo: number; itens: number };

type ForaDeLinhaProp = {
  posicaoEmLinha: PosicaoEstoque;
  posicaoForaDeLinha: PosicaoEstoque;
  posicaoTotal: PosicaoEstoque;
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
  valorFaturado,
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

  /* Ocupação do estoque: em linha vs fora de linha (por tonelagem) */
  const posicaoEmLinha = foraDeLinha?.posicaoEmLinha ?? POSICAO_EM_LINHA;
  const posicaoFora = foraDeLinha?.posicaoForaDeLinha ?? POSICAO_FORA_DE_LINHA;
  const posicaoTotal = foraDeLinha?.posicaoTotal ?? POSICAO_TOTAL;

  const totalTon = posicaoTotal.pesoTon > 0 ? posicaoTotal.pesoTon : posicaoEmLinha.pesoTon + posicaoFora.pesoTon;
  const pctEmLinha = totalTon > 0 ? (posicaoEmLinha.pesoTon / totalTon) * 100 : 0;
  const pctFora = totalTon > 0 ? (posicaoFora.pesoTon / totalTon) * 100 : 0;

  const secoes: SecaoDonut[] = [
    { id: "emLinha", label: "em linha", cor: COR_EM_LINHA, pct: pctEmLinha },
    { id: "foraDeLinha", label: "fora de linha", cor: COR_FORA, pct: pctFora },
  ];

  /* Posição ativa (em linha ou fora de linha) */
  const posicaoAtiva: PosicaoEstoque = foco === 0 ? posicaoEmLinha : posicaoFora;

  /* Linhas do resumo da seção ativa */
  const linhasBase = [
    { rotulo: "Itens", valor: fmtInt(posicaoAtiva.itens) },
    { rotulo: "Saldo físico", valor: fmtInt(posicaoAtiva.saldoFocco) },
    { rotulo: "Tonelagem", valor: fmtTonDec(posicaoAtiva.pesoTon), destaque: true },
    { rotulo: "Valor em estoque", valor: fmtMoeda(posicaoAtiva.valorEstoque) },
    { rotulo: "Reservados qtd", valor: fmtInt(posicaoAtiva.reservas) },
    { rotulo: "Reservados ton", valor: fmtTonDec(posicaoAtiva.pesoReservadoTon) },
    { rotulo: "Reservados R$", valor: fmtMoeda(posicaoAtiva.valorReservado) },
    { rotulo: "Disponível", valor: fmtInt(posicaoAtiva.disponivel) },
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
          texto="Ocupação do estoque: tonelagem em linha (ativos) vs fora de linha (descontinuados). O donut mostra o % de cada parcela sobre o total. Abaixo, o resumo Estoque × Previsto (valor em estoque = custo médio × saldo; valor previsto = toneladas × R$/t faturado). Clique para alternar."
        />
      </div>

      <DonutInterativo
        secoes={secoes}
        foco={foco}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />
      <ToggleSecoes secoes={secoes} foco={foco} onChange={setFoco} />

      {/* Total da seção ativa — destaque em gradiente */}
      <div className="mt-2 flex w-full justify-center">
        <DestaqueGradiente
          numero={fmtBrMax(posicaoAtiva.pesoTon, 1)}
          rotulo={foco === 0 ? " t em linha" : " t fora de linha"}
        />
      </div>

      {/* Tabela de detalhes da seção ativa */}
      <div className="video-sobe mt-3 w-full max-w-sm mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          {foco === 0 ? "Em linha" : "Fora de linha"}
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
            {/* Total geral */}
            <tr className="border-t-2 border-white/40 bg-white/10 font-bold">
              <td className="py-1 text-white">Total geral</td>
              <td className="py-1 text-right font-mono text-white">
                {fmtInt(posicaoTotal.itens)} itens
                {" · "}
                <span className="text-base font-extrabold">{fmtBrMax(posicaoTotal.pesoTon, 1)} t</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Resumo Estoque × Previsto */}
      <div className="video-sobe mt-3 w-full max-w-sm mx-auto" style={{ animationDelay: "0.6s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Estoque × Previsto
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <tbody>
            <tr className="border-b border-white/10">
              <td className="py-0.5 text-white/80">Valor em estoque</td>
              <td className="py-0.5 text-right font-mono font-semibold text-white">{fmtMoeda(resumo.valor)}</td>
            </tr>
            <tr className="border-b border-white/10">
              <td className="py-0.5 text-white/80">Valor previsto</td>
              <td className="py-0.5 text-right font-mono font-semibold text-white">{fmtMoeda(resumo.previsto)}</td>
            </tr>
            <tr className="border-b border-white/10">
              <td className="py-0.5 text-white/80">Toneladas</td>
              <td className="py-0.5 text-right font-mono font-extrabold text-white">{fmtTonDec(resumo.ton)}</td>
            </tr>
            {valorFaturado && (
              <tr className="border-b border-white/10">
                <td className="py-0.5 text-white/80">R$/t faturado</td>
                <td className="py-0.5 text-right font-mono font-semibold text-white">{fmtMoeda2(valorFaturado)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Breakdown por categoria */}
      {temCategorias && (
        <div className="video-sobe mt-3 w-full max-w-sm mx-auto" style={{ animationDelay: "0.7s" }}>
          <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
            % por categoria
          </p>
          <table className="w-full text-left text-[11px] text-white">
            <tbody>
              {cats.map((u, i) => {
                const saldo = statNum(u.stats, "Saldo");
                const itens = statNum(u.stats, "Itens");
                const peso = statNum(u.stats, "Peso");
                return (
                  <tr key={i} className="border-b border-white/10 last:border-0">
                    <td className="py-0.5">
                      <span className="text-white/80">{u.nome}</span>
                      <span className="ml-1.5 text-[9px] font-bold" style={{ color: COR_EM_LINHA }}>
                        {fmtBrMax(u.share, 1)}%
                      </span>
                    </td>
                    <td className="py-0.5 text-right font-mono font-semibold text-white">
                      {u.valor}
                      {saldo !== undefined && (
                        <span className="ml-1 text-[9px] text-white/45">
                          · {fmtInt(saldo)} un
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
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
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-1.5 text-[8px] leading-tight text-white/40">
        * Ocupação: tonelagem em linha ÷ tonelagem total × 100. {fmtBrMax(pctEmLinha, 1)}% em linha · {fmtBrMax(pctFora, 1)}% fora de linha. Clique no gráfico para alternar.
      </p>

    </div>
  );
}
