import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt, fmtTonDec } from "@/lib/format";

type DiaCarregamento = {
  data: string;
  recebido: number;
  carregado: number;
  cargas: number;
};

type RespostaCarregamento = {
  dias: DiaCarregamento[];
  totalRecebido: number;
  totalCarregado: number;
  totalCargas: number;
  mediaPct: number;
};

export function ComparativoCarregamento() {
  const [dados, setDados] = useState<RespostaCarregamento | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [diaAtivo, setDiaAtivo] = useState(0);

  useEffect(() => {
    fetch("/api/carregamento")
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao buscar dados");
        return r.json();
      })
      .then((data: RespostaCarregamento) => setDados(data))
      .catch((e) => setErro(e.message));
  }, []);

  /* Auto-loop: cicla o dia ativo a cada 2,5s */
  useEffect(() => {
    if (!dados || dados.dias.length <= 1) return;
    const timer = setInterval(() => {
      setDiaAtivo((i) => (i + 1) % dados.dias.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [dados]);

  if (erro) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border/50 bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar os dados de carregamento.
        </p>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border/50 bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">Carregando comparativo…</p>
      </div>
    );
  }

  const { dias, totalRecebido, totalCarregado, totalCargas, mediaPct } = dados;
  const maxTon = Math.max(...dias.map((d) => Math.max(d.recebido, d.carregado)), 1);

  // Saldo: negativo = mais carregado que recebido (estoque diminuindo)
  const saldoTon = totalRecebido - totalCarregado;
  const saudavel = saldoTon <= 0; // carregou mais ou igual ao recebido = giro saudável

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
      {/* Cabeçalho */}
      <div className="border-b p-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-2xl">Saúde do Estoque</h3>
            <p className="text-xs text-muted-foreground">
              Toneladas recebidas vs. carregadas · {dias.length} dias
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Média carregado/recebido
            </p>
            <p
              className={cn(
                "font-serif text-3xl tracking-tight",
                mediaPct >= 100 ? "text-primary" : "text-brand-amber",
              )}
            >
              {fmtBrMax(mediaPct, 1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-4 border-b p-6 sm:grid-cols-4">
        <div className="rounded-xl bg-secondary/40 p-4">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Total Recebido
          </p>
          <p className="mt-1 font-serif text-2xl text-foreground">
            {fmtTonDec(totalRecebido)}
          </p>
        </div>
        <div className="rounded-xl bg-secondary/40 p-4">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Total Carregado
          </p>
          <p className="mt-1 font-serif text-2xl text-primary">
            {fmtTonDec(totalCarregado)}
          </p>
        </div>
        <div className="rounded-xl bg-secondary/40 p-4">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Saldo (recebido − carregado)
          </p>
          <p
            className={cn(
              "mt-1 font-serif text-2xl",
              saudavel ? "text-primary" : "text-brand-amber",
            )}
          >
            {saldoTon >= 0 ? "+" : ""}
            {fmtTonDec(saldoTon)}
          </p>
        </div>
        <div className="rounded-xl bg-secondary/40 p-4">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            N° de Cargas
          </p>
          <p className="mt-1 font-serif text-2xl text-foreground">
            {fmtInt(totalCargas)}
          </p>
        </div>
      </div>

      {/* Média percentual automática — carregado / recebido */}
      <div className="border-b p-6">
        <div
          className={cn(
            "flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between",
            mediaPct >= 100
              ? "border-primary/40 bg-primary/5"
              : "border-brand-amber/40 bg-brand-amber/5",
          )}
        >
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Média % Carregado / Recebido
            </p>
            <p
              className={cn(
                "mt-1 font-serif text-4xl tracking-tight",
                mediaPct >= 100 ? "text-primary" : "text-brand-amber",
              )}
            >
              {fmtBrMax(mediaPct, 1)}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {mediaPct >= 100
                ? "Carregamento superando recebimento — giro saudável do estoque."
                : "Recebimento acima do carregamento — estoque acumulando."}
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <div className="mb-1 flex justify-between text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              <span>0%</span>
              <span>100%</span>
              <span>200%</span>
            </div>
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
              {/* Marca de 100% */}
              <div className="absolute top-0 bottom-0 z-10 w-px bg-border" style={{ left: "50%" }} />
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  mediaPct >= 100 ? "bg-primary" : "bg-brand-amber",
                )}
                style={{ width: `${Math.min(mediaPct / 2, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-center text-[10px] text-muted-foreground">
              Cálculo automático · atualiza com cada novo dia
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico de barras comparativas com carrossel automático */}
      <div className="p-6">
        <div className="mb-3 flex items-center gap-6 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          <span className="flex items-center gap-2">
            <span className="size-3 rounded-sm bg-brand-amber/70" /> Recebido
          </span>
          <span className="flex items-center gap-2">
            <span className="size-3 rounded-sm bg-primary/70" /> Carregado
          </span>
        </div>

        {/* Tooltip do dia ativo — fixo acima do gráfico */}
        {(() => {
          const d = dias[diaAtivo];
          if (!d) return null;
          const pct = d.recebido > 0 ? (d.carregado / d.recebido) * 100 : 0;
          const acima = pct >= 100;
          return (
            <div className="mb-3 flex items-center gap-4 rounded-lg border border-border bg-popover px-4 py-3 shadow-sm">
              <p className="font-bold text-foreground">{d.data}</p>
              <p className="text-sm text-brand-amber">Rec: {fmtTonDec(d.recebido)}</p>
              <p className="text-sm text-primary">Carg: {fmtTonDec(d.carregado)}</p>
              <p className={cn("text-sm font-bold", acima ? "text-primary" : "text-brand-amber")}>
                {fmtBrMax(pct, 1)}%
              </p>
              {/* Indicadores de progresso do loop */}
              <div className="ml-auto flex gap-1.5">
                {dias.map((d, i) => (
                  <span
                    key={`ind-${d.data}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === diaAtivo ? "w-6 bg-primary" : "w-1.5 bg-border",
                    )}
                  />
                ))}
              </div>
            </div>
          );
        })()}

        <div className="flex items-end gap-2 sm:gap-3" style={{ height: "200px" }}>
          {dias.map((d, i) => {
            const pct = d.recebido > 0 ? (d.carregado / d.recebido) * 100 : 0;
            const acima = pct >= 100;
            const ativo = i === diaAtivo;
            return (
              <div
                key={`bar-${d.data}`}
                className="flex flex-1 cursor-pointer flex-col items-center gap-1"
                onClick={() => setDiaAtivo(i)}
              >
                {/* Barras duplas */}
                <div className="flex w-full items-end justify-center gap-1" style={{ height: "160px" }}>
                  <div
                    className={cn(
                      "w-1/2 rounded-t transition-all duration-500",
                      ativo ? "bg-brand-amber" : "bg-brand-amber/50",
                    )}
                    style={{ height: `${Math.max((d.recebido / maxTon) * 100, 3)}%` }}
                  />
                  <div
                    className={cn(
                      "w-1/2 rounded-t transition-all duration-500",
                      ativo
                        ? acima
                          ? "bg-primary"
                          : "bg-primary/70"
                        : acima
                          ? "bg-primary/50"
                          : "bg-primary/30",
                    )}
                    style={{ height: `${Math.max((d.carregado / maxTon) * 100, 3)}%` }}
                  />
                </div>
                <p className={cn("text-[10px] font-bold transition-colors", ativo ? "text-primary" : "text-foreground")}>
                  {d.data.split("/")[0]}
                </p>
                <p
                  className={cn(
                    "text-[9px] font-semibold transition-colors",
                    ativo ? (acima ? "text-primary" : "text-brand-amber") : acima ? "text-primary/60" : "text-muted-foreground",
                  )}
                >
                  {fmtBrMax(pct, 0)}%
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela detalhada */}
      <div className="overflow-x-auto border-t">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              <th className="px-4 py-3">Dia</th>
              <th className="px-4 py-3 text-right">Recebido (t)</th>
              <th className="px-4 py-3 text-right">Carregado (t)</th>
              <th className="px-4 py-3 text-right">Cargas</th>
              <th className="px-4 py-3 text-right">Carregado/Recebido</th>
            </tr>
          </thead>
          <tbody>
            {dias.map((d, i) => {
              const pct = d.recebido > 0 ? (d.carregado / d.recebido) * 100 : 0;
              const acima = pct >= 100;
              return (
                <tr key={`row-${d.data}`} className="border-b last:border-0 hover:bg-secondary/40">
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{d.data}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {fmtTonDec(d.recebido)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-primary">
                    {fmtTonDec(d.carregado)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {fmtInt(d.cargas)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right tabular-nums font-semibold",
                      acima ? "text-primary" : "text-brand-amber",
                    )}
                  >
                    {fmtBrMax(pct, 1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 font-bold">
              <td className="px-4 py-3 text-foreground">Total</td>
              <td className="px-4 py-3 text-right tabular-nums text-foreground">
                {fmtTonDec(totalRecebido)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-primary">
                {fmtTonDec(totalCarregado)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-foreground">
                {fmtInt(totalCargas)}
              </td>
              <td
                className={cn(
                  "px-4 py-3 text-right tabular-nums",
                  mediaPct >= 100 ? "text-primary" : "text-brand-amber",
                )}
              >
                {fmtBrMax(mediaPct, 1)}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
