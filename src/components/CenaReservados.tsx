/* Cena Estoque Reservado — mesmo padrão da cena Em linha × Fora de linha:
   donut + botões Reservado / Sem reserva + tabela "Resumo do estoque". */

import { cn } from "@/lib/utils";
import { fmtInt, fmtMoeda, fmtBrMax, fmtMoeda2, fmtTonDec } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, BannerResumo, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import type { VideoReservados } from "./VideoResumoDashboard";

const COR_RESERVADO = "#00FFCC";
const COR_SEM = "#FFA500";

export default function CenaReservados({
  anim,
  reservados: reservadosCom,
  semReserva,
  valorFaturado,
  cena,
  onPausar,
}: {
  anim: boolean;
  reservados: NonNullable<VideoReservados>;
  semReserva?: VideoReservados | undefined;
  valorFaturado?: number;
  cena: number;
  onPausar?: () => void;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);

  /* Donut: participação de cada parcela no valor do estoque (soma 100%). */
  const totalValor = reservadosCom.totalValor + (semReserva?.totalValor ?? 0);
  const pctRes = semReserva && totalValor > 0 ? (reservadosCom.totalValor / totalValor) * 100 : reservadosCom.pctValor;
  const pctSem = semReserva && totalValor > 0 ? (semReserva.totalValor / totalValor) * 100 : 0;

  const secoes: SecaoDonut[] = [
    { id: "reservado", label: "reservado", cor: COR_RESERVADO, pct: pctRes },
    ...(semReserva ? [{ id: "sem", label: "sem reserva", cor: COR_SEM, pct: pctSem }] : []),
  ];

  const linhasDe = (grupo: number, nome: string, d: NonNullable<VideoReservados>) => [
    { grupo, rotulo: `${nome} · quantidade`, valor: fmtInt(d.totalQtd) },
    { grupo, rotulo: `${nome} · toneladas`, valor: `${fmtBrMax(d.totalTon, 1)} t` },
    { grupo, rotulo: `${nome} · valor`, valor: fmtMoeda(d.totalValor) },
  ];
  const linhas = [
    ...linhasDe(0, "Reservado", reservadosCom),
    ...(semReserva ? linhasDe(1, "Sem reserva", semReserva) : []),
  ];

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Reservado × Sem Reserva
        </p>
        <InfoTooltip onOpen={onPausar} texto="Itens com reserva comercial e itens sem reserva (saldo disponível = saldo atual − qtd reservada). O gráfico mostra a participação de cada parcela no valor do estoque. Cálculo por item: qtd × custo médio = valor; qtd × peso bruto = peso. Fonte: planilha 'COMERCIAL 024 - SALDO DE ITENS COM RESERVA' do Drive. Clique para alternar." />
      </div>

      <DonutInterativo
        secoes={secoes}
        foco={foco}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />

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
            {linhas.map((l, i) => {
              const ativa = l.grupo === foco;
              const cor = l.grupo === 0 ? COR_RESERVADO : COR_SEM;
              return (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-white/10 last:border-0 transition-all duration-300",
                    ativa ? "bg-white/[0.04]" : "opacity-35",
                  )}
                >
                  <td className="py-0.5" style={ativa ? { color: cor } : undefined}>{l.rotulo}</td>
                  <td className="py-0.5 text-right font-mono font-semibold" style={ativa ? { color: cor } : undefined}>{l.valor}</td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-white/40 bg-white/10 font-bold">
              <td className="py-1 text-white">Total</td>
              <td className="py-1 text-right font-mono text-white">
                {fmtInt(reservadosCom.totalQtd + (semReserva?.totalQtd ?? 0))} un
                {" · "}
                {fmtBrMax(reservadosCom.totalTon + (semReserva?.totalTon ?? 0), 1)} t
                {" · "}
                {fmtMoeda(reservadosCom.totalValor + (semReserva?.totalValor ?? 0))}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * Participação no valor do estoque. Clique no gráfico para alternar.
        </p>
      </div>

      <BannerResumo texto={`${fmtInt(reservadosCom.totalQtd + (semReserva?.totalQtd ?? 0))} un · ${fmtBrMax(reservadosCom.totalTon + (semReserva?.totalTon ?? 0), 1)} t · ${fmtMoeda(reservadosCom.totalValor + (semReserva?.totalValor ?? 0))}`} />
      <ToggleSecoes secoes={secoes} foco={foco} onChange={setFoco} />

      {/* Valor previsto da reserva — integrado na mesma cena */}
      {valorFaturado && foco === 0 && (
        <div className="video-sobe mt-5 w-full max-w-sm mx-auto border-t border-white/10 pt-5" style={{ animationDelay: "0.7s" }}>
          <div className="flex items-center justify-center gap-2">
            <p className="text-[10px] font-bold tracking-[0.3em] text-white/60 uppercase">
              Valor Previsto da Reserva
            </p>
            <InfoTooltip onOpen={onPausar} texto="Valor previsto da reserva = toneladas reservadas × valor faturado por tonelada. O valor faturado por tonelada é configurado manualmente. Fonte: dados de reservados × valor faturado. Atualizado em 28/09/2026." />
          </div>
          <p className="mt-2 text-center font-serif text-3xl text-primary sm:text-4xl">
            {fmtMoeda(reservadosCom.previsao ?? (reservadosCom.totalTon * (valorFaturado ?? 0)))}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-center">
              <p className="font-serif text-base text-white sm:text-lg">{fmtTonDec(reservadosCom.totalTon)}</p>
              <p className="text-[7px] font-bold tracking-widest text-white/50 uppercase">Ton. reserv.</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-center">
              <p className="font-serif text-base text-white sm:text-lg">× {fmtMoeda2(valorFaturado)}</p>
              <p className="text-[7px] font-bold tracking-widest text-white/50 uppercase">R$/t faturado</p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-2.5 text-center">
              <p className="font-serif text-base text-primary sm:text-lg">{fmtBrMax(reservadosCom.pctValor, 1)}%</p>
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
