import { fmtMoeda, fmtTonDec, fmtInt, fmtMoeda2 } from "@/lib/format";

export type RegistroHistorico = {
  timestamp: string;
  data?: string;
  valor: number;
  previsto: number;
  ton: number;
  saldo: number;
  itens: number;
  reservadoTon?: number;
  reservadoValor?: number;
};

type Props = {
  cena: number;
  anim: boolean;
  registros: RegistroHistorico[];
  valorFaturado: number;
};

/* Cenas da apresentação de Histórico — mesmas animações do dashboard. */
export default function CenasHistorico({ cena, anim, registros, valorFaturado }: Props) {
  const ultimo = registros[0];
  const reservaTon = ultimo?.reservadoTon ?? 0;
  const reservaValor = ultimo?.reservadoValor ?? 0;
  const valorPrevistoReserva = reservaTon * valorFaturado;

  return (
    <>
      {/* Cena 0 — KPIs de resumo */}
      {cena === 0 && (
        <div>
          <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
            Histórico · Estoque e Reserva
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="video-sobe rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
              <p className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">Estoque · Peso</p>
              <p className="mt-1 font-serif text-3xl text-white">{ultimo ? fmtTonDec(ultimo.ton) : "—"}</p>
              <p className="mt-1 text-xs text-white/50">{ultimo ? `${fmtInt(ultimo.saldo)} peças` : "aguardando"}</p>
            </div>
            <div className="video-sobe rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md" style={{ animationDelay: "0.12s" }}>
              <p className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">Estoque · Valor</p>
              <p className="mt-1 font-serif text-3xl text-white">{ultimo ? fmtMoeda(ultimo.valor) : "—"}</p>
              <p className="mt-1 text-xs text-primary">{ultimo?.previsto ? `Previsto ${fmtMoeda(ultimo.previsto)}` : ""}</p>
            </div>
            <div className="video-sobe rounded-2xl border border-sky-400/30 bg-sky-500/10 p-5 backdrop-blur-md" style={{ animationDelay: "0.24s" }}>
              <p className="text-[10px] font-semibold tracking-widest text-sky-300 uppercase">Reserva · Peso</p>
              <p className="mt-1 font-serif text-3xl text-white">{reservaTon > 0 ? fmtTonDec(reservaTon) : "—"}</p>
              <p className="mt-1 text-xs text-white/50">{reservaValor > 0 ? fmtMoeda(reservaValor) : ""}</p>
            </div>
            <div className="video-sobe rounded-2xl border border-primary/30 bg-primary/10 p-5 backdrop-blur-md" style={{ animationDelay: "0.36s" }}>
              <p className="text-[10px] font-semibold tracking-widest text-primary uppercase">Previsto da Reserva</p>
              <p className="mt-1 font-serif text-3xl text-primary">{valorPrevistoReserva > 0 ? fmtMoeda(valorPrevistoReserva) : "—"}</p>
              <p className="mt-1 text-xs text-white/50">
                {reservaTon > 0 ? `${fmtTonDec(reservaTon)} × ${fmtMoeda2(valorFaturado)}/t` : "configure o faturado"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cena 1 — Valor faturado */}
      {cena === 1 && (
        <div>
          <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
            Parâmetro · Valor Faturado
          </p>
          <div className="video-sobe mt-4 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <p className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">
              Valor Faturado (R$/t)
            </p>
            <p className="mt-2 font-serif text-5xl text-white">{fmtMoeda2(valorFaturado)}</p>
            <p className="mt-2 text-sm text-white/50">
              Toneladas reservadas × valor faturado = valor previsto da reserva
            </p>
          </div>
          {ultimo && (
            <div className="video-sobe mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-5 backdrop-blur-md" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold tracking-widest text-primary uppercase">Cálculo atual</span>
                <span className="font-serif text-2xl text-primary">{fmtMoeda(valorPrevistoReserva)}</span>
              </div>
              <p className="mt-2 text-xs text-white/50">
                {fmtTonDec(reservaTon)} × {fmtMoeda2(valorFaturado)}/t
              </p>
            </div>
          )}
        </div>
      )}

      {/* Cena 2 — Histórico de peso (valores reais) */}
      {cena === 2 && (
        <div>
          <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
            Histórico · Peso (t)
          </p>
          <div className="video-sobe mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/30 text-left text-[10px] font-semibold tracking-widest text-white/60 uppercase">
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2 text-right text-amber-400">Estoque</th>
                  <th className="px-3 py-2 text-right text-sky-400">Reserva</th>
                </tr>
              </thead>
              <tbody>
                {registros.slice(0, 15).map((r) => {
                  const d = new Date(r.timestamp);
                  const mesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][d.getMonth()] ?? "";
                  const dia = String(d.getDate()).padStart(2, "0");
                  const hora = String(d.getHours()).padStart(2, "0");
                  const min = String(d.getMinutes()).padStart(2, "0");
                  return (
                    <tr key={r.timestamp} className="border-b border-white/10 last:border-0">
                      <td className="px-3 py-2.5 tabular-nums text-white/70">
                        {dia} {mesAbrev} • {hora}:{min}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold tabular-nums text-amber-400">
                        {fmtTonDec(r.ton)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold tabular-nums text-sky-400">
                        {r.reservadoTon != null ? fmtTonDec(r.reservadoTon) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
