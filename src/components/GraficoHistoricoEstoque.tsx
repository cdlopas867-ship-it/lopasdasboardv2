import { useEffect, useState } from "react";
import { fmtBrMax, fmtTonDec } from "@/lib/format";

/* Lista do histórico de estoque — peso (ton) do estoque e da reserva por dia. */

type RegistroHistorico = {
  timestamp: string;
  data?: string;
  valor: number;
  previsto: number;
  ton: number;
  saldo: number;
  itens: number;
  reservadoTon?: number;
};

const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

type Props = {
  tema?: "escuro" | "claro";
};

export function GraficoHistoricoEstoque({ tema = "escuro" }: Props) {
  const [historico, setHistorico] = useState<RegistroHistorico[]>([]);

  useEffect(() => {
    const carregar = () =>
      fetch("/api/historico")
        .then((r) => r.json())
        .then((data: RegistroHistorico[]) => setHistorico(Array.isArray(data) ? data : []))
        .catch(() => {});
    carregar();
    const intervalo = setInterval(carregar, 30_000);
    return () => clearInterval(intervalo);
  }, []);

  if (!Array.isArray(historico) || historico.length === 0) {
    return (
      <p className="video-sobe mt-8 font-serif text-2xl text-white/60 sm:text-3xl">
        Aguardando a primeira importação para registrar peso e quantidade do estoque.
      </p>
    );
  }

  /* Mostra todas as atualizações individuais — do mais recente ao mais antigo */
  const registros = [...historico]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 12);

  const escuro = tema === "escuro";
  const corTexto = escuro ? "text-white/70" : "text-foreground/70";
  const corValor = escuro ? "text-white" : "text-foreground";
  const corPeso = "#f1c40f";
  const corReserva = "#38bdf8";
  const corLinha = escuro ? "border-white/10" : "border-border/50";

  return (
    <div className="w-full">
      {/* Cabeçalho das colunas */}
      <div
        className={`video-sobe mt-3 flex items-center justify-between border-b pb-2 ${corLinha}`}
        style={{ animationDelay: "0.15s" }}
      >
        <span className={`text-[10px] font-bold tracking-widest ${corTexto} uppercase`}>Data</span>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: corPeso }}>Estoque</span>
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: corReserva }}>Reserva</span>
        </div>
      </div>

      <div className={`video-sobe divide-y ${corLinha}`} style={{ animationDelay: "0.2s" }}>
        {registros.map((r, i) => {
          const d = new Date(r.timestamp);
          const dia = String(d.getDate()).padStart(2, "0");
          const mes = MESES[d.getMonth()] ?? "—";
          const hora = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
          const prev = registros[i + 1];
          const varTon = prev ? ((r.ton - prev.ton) / prev.ton) * 100 : 0;
          return (
            <div
              key={r.timestamp}
              className={`flex items-center justify-between py-2.5 ${corLinha} border-b last:border-0`}
            >
              <span className={`text-sm tabular-nums ${corTexto}`}>
                {dia} {mes} · {hora}
              </span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold tabular-nums" style={{ color: corPeso }}>
                  {fmtTonDec(r.ton)}
                </span>
                {r.reservadoTon != null && (
                  <span className="text-sm font-bold tabular-nums" style={{ color: corReserva }}>
                    {fmtTonDec(r.reservadoTon)}
                  </span>
                )}
                {prev && (
                  <span
                    className="text-xs font-semibold tabular-nums"
                    style={{ color: varTon >= 0 ? "#6ee7b7" : "#fca5a5" }}
                  >
                    {varTon >= 0 ? "+" : ""}{fmtBrMax(varTon, 1)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
