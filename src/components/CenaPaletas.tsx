import { cn } from "@/lib/utils";
import { fmtInt } from "@/lib/format";
import type { VideoPaletas } from "./VideoResumoDashboard";

const CORES_TAMANHO: Record<string, string> = {
  P: "#22c55e",
  M: "#3b82f6",
  G: "#f97316",
  GG: "#a855f7",
};

/* Cena de Paletes — mostra quantos paletes existem no estoque
   por tamanho (P, M, G, GG), cruzando o saldo de cada item com
   a configuração de pallet da planilha "PALLET DOS ITENS". */
export default function CenaPaletes({
  anim,
  paletas,
  onPausar,
}: {
  anim: boolean;
  paletas?: VideoPaletas | undefined;
  onPausar?: (() => void) | undefined;
}) {
  if (!paletas || paletas.porTamanho.length === 0) {
    return (
      <div className="flex w-full flex-col items-center py-6 text-center">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Paletes em Estoque
        </p>
        <p className="video-sobe mt-4 font-serif text-2xl text-white/70">
          Sem dados de paletes.
        </p>
      </div>
    );
  }

  const maxPaletes = Math.max(...paletas.porTamanho.map((t) => t.paletes), 1);

  return (
    <div className="flex w-full flex-col">
      {/* Cabeçalho */}
      <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
        Paletes em Estoque
      </p>

      <div className="video-sobe mt-2 flex items-baseline gap-3">
        <p className="font-serif text-3xl text-white sm:text-4xl">
          {fmtInt(paletas.totalPaletes)}
        </p>
        <span className="text-sm text-white/60">paletes</span>
        <span className="text-[10px] text-white/45">
          · {fmtInt(paletas.totalItens)} itens mapeados
        </span>
      </div>

      {/* Breakdown por tamanho */}
      <div className="mt-5">
        <p className="mb-2 text-[9px] font-bold tracking-[0.3em] text-white/50 uppercase">
          Por tamanho
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
                {/* Badge do tamanho */}
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                  style={{ background: `${cor}20`, color: cor }}
                >
                  {t.tamanho}
                </span>

                {/* Barra proporcional */}
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

                {/* Contagem de paletes */}
                <span className="w-16 text-right font-mono text-sm font-bold text-white">
                  {fmtInt(t.paletes)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela detalhada */}
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
            {paletas.porTamanho.map((t) => {
              const cor = CORES_TAMANHO[t.tamanho] ?? "#6b7280";
              const pct = (t.paletes / paletas.totalPaletes) * 100;
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
            <tr className="border-t-2 border-white/30 font-bold">
              <td className="py-1 text-white">Total</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(paletas.totalPaletes)}</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(paletas.totalItens)}</td>
              <td className="py-1 text-right font-mono text-white">
                {fmtInt(paletas.porTamanho.reduce((s, t) => s + t.und, 0))}
              </td>
              <td className="py-1 text-right font-mono text-white">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="video-sobe mt-3 text-[8px] leading-tight text-white/40" style={{ animationDelay: "0.7s" }}>
        * Paletes = ⌈saldo ÷ unidades por pallet⌉. Fonte: cruzamento da base de estoque com a
        planilha "PALLET DOS ITENS" (ENGENHARIA 014).
      </p>
    </div>
  );
}

/* fmtBrMax local — evita import circular */
function fmtBrMax(v: number, maxDec = 0): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: maxDec });
}
