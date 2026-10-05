/* Cena Estoque Reservado — donut interativo com toggle Peso / Quantidade / Valor. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt, fmtMoeda, fmtMoeda2, fmtTonDec } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import type { VideoReservados } from "./VideoResumoDashboard";

const CORES = ["#00FFCC", "#FFA500", "#A78BFA"];

export default function CenaReservados({
  anim,
  reservados,
  valorFaturado,
  cena,
  onPausar,
}: {
  anim: boolean;
  reservados: NonNullable<VideoReservados>;
  valorFaturado?: number;
  cena: number;
  onPausar?: () => void;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);

  const secoes: SecaoDonut[] = [
    { id: "peso", label: "peso", cor: CORES[0]!, pct: reservados.pctPeso },
    { id: "qtd", label: "quantidade", cor: CORES[1]!, pct: reservados.pctQtd },
    { id: "valor", label: "valor", cor: CORES[2]!, pct: reservados.pctValor },
  ];

  const linhasTabela = [
    { focoIdx: 0, rotulo: "Peso", und: "t", reserv: fmtBrMax(reservados.totalTon, 1), semReserv: fmtBrMax(reservados.totalPesoEstoque - reservados.totalTon, 1), estoque: fmtBrMax(reservados.totalPesoEstoque, 1), pct: fmtBrMax(reservados.pctPeso, 1), pctSem: fmtBrMax(100 - reservados.pctPeso, 1) },
    { focoIdx: 1, rotulo: "Quantidade", und: "un", reserv: fmtInt(reservados.totalQtd), semReserv: fmtInt(reservados.totalSaldo - reservados.totalQtd), estoque: fmtInt(reservados.totalSaldo), pct: fmtBrMax(reservados.pctQtd, 1), pctSem: fmtBrMax(100 - reservados.pctQtd, 1) },
    { focoIdx: 2, rotulo: "Valor", und: "R$", reserv: `${fmtBrMax(reservados.totalValor / 1e6, 2)} mi`, semReserv: `${fmtBrMax((reservados.totalValorEstoque - reservados.totalValor) / 1e6, 2)} mi`, estoque: `${fmtBrMax(reservados.totalValorEstoque / 1e6, 2)} mi`, pct: fmtBrMax(reservados.pctValor, 1), pctSem: fmtBrMax(100 - reservados.pctValor, 1) },
  ];

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Estoque Reservado
        </p>
        <InfoTooltip onOpen={onPausar} texto="Itens com reserva comercial. % do valor = valor reservado ÷ valor total do estoque × 100. Cálculo por item: qtd reservada × custo médio = valor reservado; qtd reservada × peso bruto = peso reservado. Fonte: planilha 'COMERCIAL 024 - SALDO DE ITENS COM RESERVA' do Drive. Atualizado em 28/09/2026." />
      </div>

      <DonutInterativo
        secoes={secoes}
        foco={foco}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />
      <ToggleSecoes secoes={secoes} foco={foco} onChange={setFoco} />

      <div className="video-sobe mt-3 w-full max-w-xs mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Legenda
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Atributo</th>
              <th className="pb-0.5 text-center font-bold">Und.</th>
              <th className="pb-0.5 text-right font-bold">Reserv.</th>
              <th className="pb-0.5 text-right font-bold">S/Reserv.</th>
              <th className="pb-0.5 text-right font-bold">Estoque</th>
              <th className="pb-0.5 text-right font-bold">%Res.</th>
              <th className="pb-0.5 text-right font-bold">%S/R</th>
            </tr>
          </thead>
          <tbody>
            {linhasTabela.map((l) => {
              const ativa = l.focoIdx === foco;
              const cor = secoes[l.focoIdx]?.cor;
              return (
                <tr
                  key={l.rotulo}
                  className={cn(
                    "border-b border-white/10 last:border-0 transition-all duration-300",
                    ativa ? "bg-white/[0.04]" : "opacity-35",
                  )}
                >
                  <td className="py-0.5" style={ativa ? { color: cor } : undefined}>{l.rotulo}</td>
                  <td className="py-0.5 text-center text-white/50">{l.und}</td>
                  <td className="py-0.5 text-right font-mono font-semibold" style={ativa ? { color: cor } : undefined}>{l.reserv}</td>
                  <td className="py-0.5 text-right font-mono font-semibold text-white/70">{l.semReserv}</td>
                  <td className="py-0.5 text-right font-mono font-semibold" style={ativa ? { color: cor } : undefined}>{l.estoque}</td>
                  <td className="py-0.5 text-right font-mono font-bold" style={ativa ? { color: cor } : undefined}>{l.pct}%</td>
                  <td className="py-0.5 text-right font-mono font-bold text-white/70">{l.pctSem}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * Valores em milhões de reais. Toneladas com 1 casa decimal.
        </p>
      </div>

      {/* Valor previsto da reserva — integrado na mesma cena */}
      {valorFaturado && (
        <div className="video-sobe mt-5 w-full max-w-sm mx-auto border-t border-white/10 pt-5" style={{ animationDelay: "0.7s" }}>
          <div className="flex items-center justify-center gap-2">
            <p className="text-[10px] font-bold tracking-[0.3em] text-white/60 uppercase">
              Valor Previsto da Reserva
            </p>
            <InfoTooltip onOpen={onPausar} texto="Valor previsto da reserva = toneladas reservadas × valor faturado por tonelada. O valor faturado por tonelada é configurado manualmente. Fonte: dados de reservados × valor faturado. Atualizado em 28/09/2026." />
          </div>
          <p className="mt-2 text-center font-serif text-3xl text-primary sm:text-4xl">
            {fmtMoeda(reservados.totalTon * valorFaturado)}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-center">
              <p className="font-serif text-base text-white sm:text-lg">{fmtTonDec(reservados.totalTon)}</p>
              <p className="text-[7px] font-bold tracking-widest text-white/50 uppercase">Ton. reserv.</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-center">
              <p className="font-serif text-base text-white sm:text-lg">× {fmtMoeda2(valorFaturado)}</p>
              <p className="text-[7px] font-bold tracking-widest text-white/50 uppercase">R$/t faturado</p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-2.5 text-center">
              <p className="font-serif text-base text-primary sm:text-lg">{fmtBrMax(reservados.pctValor, 1)}%</p>
              <p className="text-[7px] font-bold tracking-widest text-primary uppercase">do valor</p>
            </div>
          </div>
          <p className="mt-2 text-center text-[9px] text-white/40">
            Toneladas reservadas × valor faturado = valor previsto da reserva
          </p>
        </div>
      )}
    </div>
  );
}
