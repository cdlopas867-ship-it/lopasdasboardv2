/* Cena Fora de Linha — comparativo interativo Em Linha × Fora de Linha.
   Widget de dados cruzados: clique numa seção para destacar seus indicadores
   e mudar a cor do anel (ciano = em linha, âmbar = fora de linha). */

import { cn } from "@/lib/utils";
import { fmtInt, fmtMoeda, fmtPct, fmtBrMax } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import {
  POSICAO_EM_LINHA,
  POSICAO_FORA_DE_LINHA,
  POSICAO_TOTAL,
  type PosicaoEstoque,
} from "@/data/fora-de-linha";

export type ForaDeLinhaProp = {
  itens: unknown[];
  posicaoEmLinha: PosicaoEstoque;
  posicaoForaDeLinha: PosicaoEstoque;
  posicaoTotal: PosicaoEstoque;
} | null;

const COR_EM_LINHA = "#00FFCC";
const COR_FORA = "#FFA500";

type Foco = number; // 0 = emLinha, 1 = foraDeLinha

type LinhaTabela = {
  grupo: number;
  rotulo: string;
  valor: string;
};

export default function CenaForaDeLinha({
  anim,
  foraDeLinha,
  cena = 6,
  onPausar,
}: {
  anim: boolean;
  foraDeLinha?: ForaDeLinhaProp | null;
  cena?: number;
  onPausar?: () => void;
}) {
  const posicaoEmLinha = foraDeLinha?.posicaoEmLinha ?? POSICAO_EM_LINHA;
  const posicaoFora = foraDeLinha?.posicaoForaDeLinha ?? POSICAO_FORA_DE_LINHA;
  const posicaoTotal = foraDeLinha?.posicaoTotal ?? POSICAO_TOTAL;

  const pctEmLinha = posicaoTotal.valorEstoque > 0
    ? (posicaoEmLinha.valorEstoque / posicaoTotal.valorEstoque) * 100
    : 0;
  const pctFora = posicaoTotal.valorEstoque > 0
    ? (posicaoFora.valorEstoque / posicaoTotal.valorEstoque) * 100
    : 0;

  const [foco, setFoco] = useFocoCena<Foco>(cena, 0);

  const secoes: SecaoDonut[] = [
    { id: "emLinha", label: "em linha", cor: COR_EM_LINHA, pct: pctEmLinha },
    { id: "foraDeLinha", label: "fora de linha", cor: COR_FORA, pct: pctFora },
  ];

  const linhas: LinhaTabela[] = [
    { grupo: 0, rotulo: "Em linha · itens", valor: fmtInt(posicaoEmLinha.itens) },
    { grupo: 0, rotulo: "Em linha · saldo", valor: fmtInt(posicaoEmLinha.saldoFocco) },
    { grupo: 0, rotulo: "Em linha · reservados qtd", valor: fmtInt(posicaoEmLinha.reservas) },
    { grupo: 0, rotulo: "Em linha · reservados ton", valor: `${fmtBrMax(posicaoEmLinha.pesoReservadoTon, 1)} t` },
    { grupo: 0, rotulo: "Em linha · reservados R$", valor: fmtMoeda(posicaoEmLinha.valorReservado) },
    { grupo: 0, rotulo: "Em linha · tonelagem", valor: `${fmtBrMax(posicaoEmLinha.pesoTon, 1)} t` },
    { grupo: 0, rotulo: "Em linha · valor", valor: fmtMoeda(posicaoEmLinha.valorEstoque) },
    { grupo: 1, rotulo: "Fora de linha · itens", valor: fmtInt(posicaoFora.itens) },
    { grupo: 1, rotulo: "Fora de linha · saldo", valor: fmtInt(posicaoFora.saldoFocco) },
    { grupo: 1, rotulo: "Fora de linha · reservados qtd", valor: fmtInt(posicaoFora.reservas) },
    { grupo: 1, rotulo: "Fora de linha · reservados ton", valor: `${fmtBrMax(posicaoFora.pesoReservadoTon, 1)} t` },
    { grupo: 1, rotulo: "Fora de linha · reservados R$", valor: fmtMoeda(posicaoFora.valorReservado) },
    { grupo: 1, rotulo: "Fora de linha · tonelagem", valor: `${fmtBrMax(posicaoFora.pesoTon, 1)} t` },
    { grupo: 1, rotulo: "Fora de linha · valor", valor: fmtMoeda(posicaoFora.valorEstoque) },
  ];

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Em Linha × Fora de Linha
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto="Comparativo entre itens em linha (ativos) e fora de linha (descontinuados). Clique numa seção para destacar seus indicadores. Inclui itens, saldo, valor em estoque, reservas e massa. Fonte: planilha 'Estoque Em Linha x Fora de Linha'."
        />
      </div>

      <DonutInterativo
        secoes={secoes}
        foco={foco}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />
      <ToggleSecoes secoes={secoes} foco={foco} onChange={setFoco} />

      <div className="video-sobe mt-3 w-full max-w-sm mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Resumo do estoque
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Indicador</th>
              <th className="pb-0.5 text-right font-bold">Valor</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, i) => {
              const ativa = linha.grupo === foco;
              const cor = linha.grupo === 0 ? COR_EM_LINHA : COR_FORA;
              return (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-white/10 transition-all duration-300",
                    i === linhas.length - 1 && "last:border-0",
                    ativa ? "bg-white/[0.04]" : "opacity-35",
                  )}
                >
                  <td className="py-0.5" style={ativa ? { color: cor } : undefined}>
                    {linha.rotulo}
                  </td>
                  <td className="py-0.5 text-right font-mono font-semibold" style={ativa ? { color: cor } : undefined}>
                    {linha.valor}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-white/40 bg-white/10 font-bold">
              <td className="py-1 text-white">Total geral</td>
              <td className="py-1 text-right font-mono text-white">
                {fmtInt(posicaoTotal.itens)} itens
                {" · "}
                {fmtBrMax(posicaoTotal.pesoTon, 1)} t
                {" · "}
                {fmtMoeda(posicaoTotal.valorEstoque)}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * % em linha = valor em linha ÷ valor total × 100. {fmtPct(pctEmLinha / 100)} em linha · {fmtPct(pctFora / 100)} fora de linha. Clique para alternar.
        </p>
      </div>
    </div>
  );
}
