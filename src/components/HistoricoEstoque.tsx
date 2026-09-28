import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtMoeda, fmtTonDec, fmtInt, fmtPctSigned } from "@/lib/format";

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

const fmtTon = fmtTonDec;
const fmtPct = fmtPctSigned;

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function fmtDataHora(r: RegistroHistorico): string {
  const d = new Date(r.timestamp);
  const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dia} ${hora}`;
}

function chaveRegistro(r: RegistroHistorico): string {
  return r.timestamp;
}

/* Extrai ano e mês de um registro */
function anoMes(r: RegistroHistorico): string {
  if (r.data) {
    const m = r.data.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (m) return `${m[3]}-${m[2]}`;
  }
  const d = new Date(r.timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nomeMes(chave: string): string {
  const [, mes] = chave.split("-");
  return MESES[Number(mes) - 1] ?? chave;
}

export function HistoricoEstoque() {
  const [historico, setHistorico] = useState<RegistroHistorico[]>([]);
  const [mesIdx, setMesIdx] = useState(0);

  useEffect(() => {
    const carregar = () =>
      fetch("/api/historico")
        .then((r) => r.json())
        .then((data: RegistroHistorico[]) => setHistorico(data))
        .catch(() => {});
    carregar();
    const intervalo = setInterval(carregar, 30_000);
    return () => clearInterval(intervalo);
  }, []);

  if (historico.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border/50 bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Aguardando a primeira importação do Drive para registrar o histórico de estoque.
        </p>
      </div>
    );
  }

  /* Cada registro é uma atualização individual — mostra todos, do mais recente ao mais antigo */
  const registros = [...historico].reverse();

  /* Agrupa por mês */
  const porMes = new Map<string, RegistroHistorico[]>();
  for (const r of registros) {
    const chave = anoMes(r);
    porMes.set(chave, [...(porMes.get(chave) ?? []), r]);
  }
  const meses = [...porMes.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  const mesAtual = meses[mesIdx]?.[1] ?? [];
  const mediaValor = mesAtual.reduce((s, r) => s + r.valor, 0) / Math.max(mesAtual.length, 1);

  const prev = () => setMesIdx((i) => (i - 1 + meses.length) % meses.length);
  const next = () => setMesIdx((i) => (i + 1) % meses.length);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
      <div className="border-b p-6 pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-2xl">Evolução do Estoque</h3>
            <p className="text-xs text-muted-foreground">
              {registros.length} registros · {fmtDataHora(registros[registros.length - 1]!)} a {fmtDataHora(registros[0]!)}
            </p>
          </div>
          {/* Navegação entre meses */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              disabled={meses.length <= 1}
              aria-label="Mês anterior"
              className="flex size-9 items-center justify-center rounded-full border border-border text-lg text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-30"
            >
              ‹
            </button>
            <span className="min-w-28 text-center text-sm font-bold tracking-wider text-foreground uppercase">
              {nomeMes(meses[mesIdx]?.[0] ?? "")}
            </span>
            <button
              type="button"
              onClick={next}
              disabled={meses.length <= 1}
              aria-label="Próximo mês"
              className="flex size-9 items-center justify-center rounded-full border border-border text-lg text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-30"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Indicadores de mês */}
      {meses.length > 1 && (
        <div className="flex justify-center gap-2 border-b pb-3 pt-3">
          {meses.map(([chave], i) => (
            <button
              key={chave}
              type="button"
              onClick={() => setMesIdx(i)}
              aria-label={`Ir para ${nomeMes(chave)}`}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === mesIdx ? "w-8 bg-primary" : "w-2 bg-border hover:bg-muted-foreground",
              )}
            />
          ))}
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              <th className="px-4 py-3">Data/Hora</th>
              <th className="px-4 py-3 text-right">Valor do Estoque</th>
              <th className="px-4 py-3 text-right">Valor Previsto</th>
              <th className="px-4 py-3 text-right">Peso (t)</th>
              <th className="px-4 py-3 text-right">Reserva (t)</th>
              <th className="px-4 py-3 text-right">Qtd</th>
              <th className="px-4 py-3 text-right">Var. %</th>
              <th className="px-4 py-3 text-right">Média</th>
            </tr>
          </thead>
          <tbody>
            {mesAtual.map((r, i) => {
              const prevReg = mesAtual[i - 1];
              const variacao = prevReg ? ((r.valor - prevReg.valor) / prevReg.valor) * 100 : 0;
              return (
                <tr key={chaveRegistro(r)} className="border-b last:border-0 hover:bg-secondary/40">
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{fmtDataHora(r)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">{fmtMoeda(r.valor)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-primary">{r.previsto ? fmtMoeda(r.previsto) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{fmtTon(r.ton)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-sky-500">{r.reservadoTon != null ? fmtTon(r.reservadoTon) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{fmtInt(r.saldo)}</td>
                  <td className={cn("px-4 py-3 text-right tabular-nums font-medium", !prevReg ? "text-muted-foreground" : variacao >= 0 ? "text-primary" : "text-red-500")}>
                    {!prevReg ? "—" : fmtPct(variacao)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{fmtMoeda(mediaValor)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
