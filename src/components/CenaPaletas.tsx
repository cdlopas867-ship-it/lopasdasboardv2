import { cn } from "@/lib/utils";
import { fmtInt } from "@/lib/format";
import type { VideoPaletas, VideoOcupacao } from "./VideoResumoDashboard";

const CORES_TAMANHO: Record<string, string> = {
  P: "#22c55e",
  M: "#3b82f6",
  G: "#f97316",
  GG: "#a855f7",
};

/* Cena de Paletes & Ocupação — mostra quantos paletes existem no estoque
   por tamanho (P, M, G, GG) cruzando o saldo de cada item com a configuração
   de pallet, junto com a ocupação das posições do CD. */
export default function CenaPaletas({
  anim,
  paletas,
  ocupacao,
  onPausar,
}: {
  anim: boolean;
  paletas?: VideoPaletas | undefined;
  ocupacao?: VideoOcupacao | undefined;
  onPausar?: (() => void) | undefined;
}) {
  if ((!paletas || paletas.porTamanho.length === 0) && !ocupacao) {
    return (
      <div className="flex w-full flex-col items-center py-6 text-center">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Paletes & Ocupação
        </p>
        <p className="video-sobe mt-4 font-serif text-2xl text-white/70">
          Sem dados de paletes ou ocupação.
        </p>
      </div>
    );
  }

  const maxPaletes = Math.max(...(paletas?.porTamanho ?? []).map((t) => t.paletes), 1);
  const totalVolumes = paletas?.porTamanho.reduce((s, t) => s + t.und, 0) ?? 0;
  const totalPosicoes = ocupacao?.detalhes?.find((d) => d.atributo === "POSIÇÕES")?.total ?? ocupacao?.ocupados ?? 0;
  const pctOcupacao = ocupacao?.pct ?? 0;
  const ocupados = ocupacao?.ocupados ?? 0;
  const livres = ocupacao?.livres ?? Math.max(totalPosicoes - ocupados, 0);

  /* Comparativo paletes × posições */
  const totalPaletesNum = paletas?.totalPaletes ?? 0;
  const temComparativo = totalPaletesNum > 0 && totalPosicoes > 0;
  const paletesPorPosicao = temComparativo ? totalPaletesNum / totalPosicoes : 0;

  return (
    <div className="flex w-full flex-col">
      {/* Cabeçalho */}
      <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
        Paletes & Ocupação do Estoque
      </p>

      {/* Resumo principal — paletes + ocupação lado a lado */}
      <div className="video-sobe mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1" style={{ animationDelay: "0.1s" }}>
        {paletas && (
          <div className="flex items-baseline gap-2">
            <p className="font-serif text-3xl text-white sm:text-4xl">
              {fmtInt(paletas.totalPaletes)}
            </p>
            <span className="text-sm text-white/60">paletes</span>
          </div>
        )}
        {ocupacao && (
          <div className="flex items-baseline gap-2">
            <p className="font-serif text-3xl text-brand-amber sm:text-4xl">
              {fmtBrMax(pctOcupacao * 100, 1)}%
            </p>
            <span className="text-sm text-white/60">ocupação</span>
          </div>
        )}
        <span className="text-[10px] text-white/45">
          · {ocupacao ? `${fmtInt(totalPosicoes)} posições` : `${fmtInt(paletas?.totalItens ?? 0)} itens mapeados`}
        </span>
      </div>

      {/* Breakdown por tamanho */}
      {paletas && paletas.porTamanho.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[9px] font-bold tracking-[0.3em] text-white/50 uppercase">
            Paletes por tamanho
          </p>
          <div className="space-y-2.5">
            {paletas.porTamanho.map((t, i) => {
              const cor = CORES_TAMANHO[t.tamanho] ?? "#6b7280";
              const pct = (t.paletes / paletas.totalPaletes) * 100;
              return (
                <div
                  key={t.tamanho}
                  className="video-sobe flex items-center gap-3"
                  style={{ animationDelay: `${0.12 * i + 0.3}s` }}
                >
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                    style={{ background: `${cor}20`, color: cor }}
                  >
                    {t.tamanho}
                  </span>
                  <div className="h-6 flex-1 overflow-hidden rounded-lg bg-white/8">
                    <div
                      className={cn("video-barra-x flex h-full items-center justify-end rounded-lg pr-2", !anim && "video-pausada")}
                      style={{
                        width: `${Math.max((t.paletes / maxPaletes) * 100, 8)}%`,
                        background: `linear-gradient(90deg, ${cor}50, ${cor})`,
                        animationDelay: `${0.12 * i + 0.4}s`,
                      }}
                    >
                      <span className="font-mono text-[10px] font-bold text-white/90">
                        {fmtBrMax(pct, 0)}%
                      </span>
                    </div>
                  </div>
                  <span className="w-16 text-right font-mono text-sm font-bold text-white">
                    {fmtInt(t.paletes)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ocupação — posições ocupadas × livres */}
      {ocupacao && (
        <div className="video-sobe mt-5" style={{ animationDelay: "0.5s" }}>
          <p className="mb-2 text-[9px] font-bold tracking-[0.3em] text-white/50 uppercase">
            Ocupação das posições
          </p>
          {/* Barra ocupado × livre */}
          <div className="flex h-3 overflow-hidden rounded-full bg-white/8">
            <div
              className={cn("video-barra-x h-full rounded-l-full", !anim && "video-pausada")}
              style={{ width: `${pctOcupacao * 100}%`, background: "linear-gradient(90deg, #f59e0b, #fbbf24)", animationDelay: "0.55s" }}
            />
            <div
              className={cn("video-barra-x h-full rounded-r-full", !anim && "video-pausada")}
              style={{ width: `${(1 - pctOcupacao) * 100}%`, background: "linear-gradient(90deg, #3b82f6, #60a5fa)", animationDelay: "0.6s" }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[9px] font-medium text-white/50">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-400" />
              {fmtInt(ocupados)} ocupadas
            </span>
            <span className="flex items-center gap-1.5">
              {fmtInt(livres)} livres
              <span className="size-1.5 rounded-full bg-blue-400" />
            </span>
          </div>
        </div>
      )}

      {/* Tabela detalhada unificada */}
      <div className="video-sobe mt-5" style={{ animationDelay: "0.6s" }}>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-1 font-bold">Tamanho</th>
              <th className="pb-1 text-right font-bold">Paletes</th>
              <th className="pb-1 text-right font-bold">Itens</th>
              <th className="pb-1 text-right font-bold">Volumes</th>
              <th className="pb-1 text-right font-bold">%</th>
            </tr>
          </thead>
          <tbody>
            {paletas?.porTamanho.map((t) => {
              const cor = CORES_TAMANHO[t.tamanho] ?? "#6b7280";
              const pct = paletas.totalPaletes > 0 ? (t.paletes / paletas.totalPaletes) * 100 : 0;
              return (
                <tr key={t.tamanho} className="border-b border-white/10 last:border-0">
                  <td className="py-1">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: cor }} />
                      <span className="font-bold text-white/80">{t.tamanho}</span>
                    </span>
                  </td>
                  <td className="py-1 text-right font-mono font-bold text-white">{fmtInt(t.paletes)}</td>
                  <td className="py-1 text-right font-mono text-white/70">{fmtInt(t.itens)}</td>
                  <td className="py-1 text-right font-mono text-white/70">{fmtInt(t.und)}</td>
                  <td className="py-1 text-right font-mono font-bold text-brand-amber">{fmtBrMax(pct, 1)}%</td>
                </tr>
              );
            })}
            {paletas && (
              <tr className="border-t-2 border-white/30 font-bold">
                <td className="py-1 text-white">Total</td>
                <td className="py-1 text-right font-mono text-white">{fmtInt(paletas.totalPaletes)}</td>
                <td className="py-1 text-right font-mono text-white">{fmtInt(paletas.totalItens)}</td>
                <td className="py-1 text-right font-mono text-white">{fmtInt(totalVolumes)}</td>
                <td className="py-1 text-right font-mono text-white">100%</td>
              </tr>
            )}
            {/* Linha de ocupação */}
            {ocupacao && (
              <tr className="border-t-2 border-brand-amber/40 bg-brand-amber/[0.06] font-bold">
                <td className="py-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-400" />
                    <span className="text-amber-300">Ocupação</span>
                  </span>
                </td>
                <td className="py-1.5 text-right font-mono text-white">{fmtInt(ocupados)}</td>
                <td className="py-1.5 text-right font-mono text-white/50">—</td>
                <td className="py-1.5 text-right font-mono text-blue-300">{fmtInt(livres)} livres</td>
                <td className="py-1.5 text-right font-mono text-brand-amber">{fmtBrMax(pctOcupacao * 100, 1)}%</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Comparativo paletes × posições */}
      {temComparativo && (
        <div className="video-sobe mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm" style={{ animationDelay: "0.7s" }}>
          <p className="text-[9px] font-bold tracking-[0.3em] text-white/50 uppercase mb-2">Paletes × Posições</p>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="font-serif text-xl text-white">{fmtInt(totalPaletesNum)}</p>
              <p className="text-[8px] font-bold tracking-widest text-white/50 uppercase">paletes</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="font-mono text-sm font-bold text-brand-amber">{fmtBrMax(paletesPorPosicao, 2)}</p>
              <p className="text-[8px] text-white/40">pallet/posição</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-xl text-white">{fmtInt(totalPosicoes)}</p>
              <p className="text-[8px] font-bold tracking-widest text-white/50 uppercase">posições</p>
            </div>
          </div>
          {/* Barra comparativa */}
          <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className={cn("video-barra-x h-full rounded-l-full", !anim && "video-pausada")}
              style={{
                width: `${Math.min((totalPaletesNum / totalPosicoes) * 100, 100)}%`,
                background: "linear-gradient(90deg, #22c55e80, #22c55e)",
                animationDelay: "0.75s",
              }}
            />
          </div>
          <p className="mt-1.5 text-center text-[9px] leading-tight text-white/40">
            {paletesPorPosicao < 1
              ? `${fmtInt(totalPosicoes - totalPaletesNum)} posições a mais que paletes — folga de ${fmtBrMax((1 - paletesPorPosicao) * 100, 1)}% na ocupação.`
              : `${fmtBrMax((paletesPorPosicao - 1) * 100, 1)}% mais paletes que posições — densidade acima da capacidade nominal.`}
          </p>
        </div>
      )}

      <p className="video-sobe mt-3 text-[8px] leading-tight text-white/40" style={{ animationDelay: "0.8s" }}>
        * Paletes = ⌈saldo ÷ unidades por pallet⌉ (Math.round). Ocupação = posições ocupadas ÷ total de endereços.
        Fonte: cruzamento da base de estoque com "PALLET DOS ITENS" + aba Resumo do Drive.
      </p>
    </div>
  );
}

/* fmtBrMax local — evita import circular */
function fmtBrMax(v: number, maxDec = 0): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: maxDec });
}
