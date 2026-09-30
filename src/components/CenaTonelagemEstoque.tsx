import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt } from "@/lib/format";
import { TONELAGEM_ESTOQUE_MENSAL } from "@/data/tonelagem-estoque";
import { PENDENTES_RESUMO_FIXO } from "@/data/valores-fixos";
import type { VideoPendentes } from "./VideoResumoDashboard";

/* Cena — Tonelagem do estoque mês a mês com variação percentual.
 * Barras por mês com o peso (PESO BRT) e a variação vs. mês anterior.
 * Destaque adicional: tonelagem pendente e datas de cada mês. */

type Props = {
  anim: boolean;
  pendentes?: VideoPendentes | undefined;
};

export default function CenaTonelagemEstoque({ anim, pendentes }: Props) {
  const dados = TONELAGEM_ESTOQUE_MENSAL;
  const ultimo = dados[dados.length - 1]!;
  const anterior = dados[dados.length - 2]!;
  const deltaUltimo = ((ultimo.ton - anterior.ton) / anterior.ton) * 100;
  const maxTon = Math.max(...dados.map((d) => d.ton), 1);
  const minTon = Math.min(...dados.map((d) => d.ton));
  const media = dados.reduce((s, d) => s + d.ton, 0) / dados.length;

  const resumo = [
    { rotulo: "Mín.", valor: minTon },
    { rotulo: "Média", valor: media },
    { rotulo: "Máx.", valor: maxTon },
  ];

  /* Mapa de pendências por mês (mesma chave "Jan/26") */
  const pendMap = new Map<string, { ton: number; itens: number; dtInicial?: string; dtFinal?: string; lotes?: number }>();
  const pendFonte = pendentes ?? PENDENTES_RESUMO_FIXO;
  for (const m of pendFonte?.meses ?? []) {
    pendMap.set(m.mes, { ton: m.ton, itens: m.itens, dtInicial: m.dtInicial, dtFinal: m.dtFinal, lotes: m.lotes });
  }

  return (
    <div className="w-full pb-6">
      <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
        Toneladas do Estoque · Mês a Mês
      </p>

      {/* Cabeçalho — último mês, variação e resumo do período */}
      <div
        className="video-sobe mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-2"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="font-serif text-4xl leading-none text-white sm:text-5xl">
            {fmtInt(ultimo.ton)} <span className="text-base text-white/50 sm:text-lg">t</span>
          </p>
          <span
            className={cn(
              "font-mono text-base font-bold sm:text-xl",
              deltaUltimo >= 0 ? "text-emerald-400" : "text-red-400",
            )}
          >
            {deltaUltimo >= 0 ? "▲" : "▼"} {fmtBrMax(Math.abs(deltaUltimo), 1)}%
          </span>
          <span className="text-xs text-white/45 sm:text-sm">
            {ultimo.mes} · vs. {anterior.mes}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {resumo.map((r) => (
            <span
              key={r.rotulo}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-bold tracking-widest text-white/45 uppercase"
            >
              {r.rotulo}{" "}
              <span className="ml-0.5 font-mono text-[10px] tracking-normal text-white/80">
                {fmtInt(r.valor)} t
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Gráfico — barras de tonelagem por mês */}
      <div className="video-sobe mt-3" style={{ animationDelay: "0.2s" }}>
        <div className="flex h-32 items-end gap-1.5 sm:gap-3">
          {dados.map((d, i) => {
            const destaque = i === dados.length - 1;
            return (
              <div key={d.mes} className="flex h-full flex-1 flex-col items-center justify-end">
                <p
                  className={cn(
                    "video-valor-sequencia mb-1 text-center font-mono text-[10px] font-bold text-white/85 sm:text-[11px]",
                    !anim && "video-pausada",
                  )}
                  style={{ animationDelay: `${i * 0.5}s` }}
                >
                  {fmtInt(d.ton)}
                </p>
                <div
                  className={cn(
                    "video-barra-y mx-auto w-full max-w-[3rem] rounded-t-md",
                    destaque
                      ? "bg-gradient-to-t from-amber-500/80 to-amber-400 shadow-[0_0_18px_rgba(241,196,15,0.35)]"
                      : "bg-gradient-to-t from-white/45 to-white/80",
                    !anim && "video-pausada",
                  )}
                  style={{
                    height: `${Math.max((d.ton / maxTon) * 100, 6)}%`,
                    animationDelay: `${0.2 + 0.06 * i}s`,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Rótulos dos meses + variação vs. mês anterior */}
        <div className="mt-2 flex gap-1.5 border-t border-white/10 pt-2 sm:gap-3">
          {dados.map((d, i) => {
            const prev = dados[i - 1];
            const delta = prev ? ((d.ton - prev.ton) / prev.ton) * 100 : null;
            const destaque = i === dados.length - 1;
            return (
              <div key={d.mes} className="flex-1 text-center">
                <p
                  className={cn(
                    "text-[10px] font-bold uppercase",
                    destaque ? "text-amber-400" : "text-white/70",
                  )}
                >
                  {d.mes.slice(0, 3)}
                </p>
                <p
                  className={cn(
                    "mt-0.5 font-mono text-[9px] font-bold sm:text-[10px]",
                    delta === null ? "text-white/30" : delta >= 0 ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {delta === null ? "—" : `${delta >= 0 ? "▲" : "▼"} ${fmtBrMax(Math.abs(delta), 1)}%`}
                </p>
              </div>
            );
          })}
        </div>

        {/* Destaque — volumes pendentes por mês (datas e quantidades) */}
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-[9px] font-bold tracking-[0.3em] text-brand-amber uppercase">
            Volumes Pendentes · por mês
          </p>
          <div className="mt-2 flex gap-1.5 sm:gap-3">
            {dados.map((d, i) => {
              const pend = pendMap.get(d.mes);
              return (
                <div
                  key={`pend-${d.mes}`}
                  className={cn(
                    "video-sobe flex-1 text-center",
                    !anim && "video-pausada",
                  )}
                  style={{ animationDelay: `${0.3 + 0.06 * i}s` }}
                >
                  {pend ? (
                    <>
                      <p className="font-mono text-[10px] font-bold text-brand-amber">
                        {fmtBrMax(pend.ton, 1)} t
                      </p>
                      <p className="mt-0.5 text-[8px] font-bold text-white/70">
                        {fmtInt(pend.itens)} ord
                      </p>
                      <p className="mt-0.5 text-[7px] leading-tight text-white/45">
                        {pend.dtFinal
                          ? `${pend.dtInicial ? `${pend.dtInicial.slice(8, 10)}/${pend.dtInicial.slice(5, 7)}–` : ""}${pend.dtFinal.slice(8, 10)}/${pend.dtFinal.slice(5, 7)}`
                          : "—"}
                      </p>
                    </>
                  ) : (
                    <p className="text-[8px] text-white/25">—</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
