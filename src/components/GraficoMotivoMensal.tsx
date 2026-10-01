import { useEffect, useState } from "react";
import { fmtInt, fmtBrMax } from "@/lib/format";

/* Modal com gráfico de barras — contagem de um motivo de avaria por mês.
 * Usa os dados já agregados (meses: {mes, qtd}) da apresentação.
 * Layout igual ao modelo: imagem + número grande + % + linha de base grossa + barras arredondadas.
 * Ao abrir: card sobe, barras crescem da base em sequência, valores surgem
 * sobre cada barra e o total conta de zero até o valor real. */
export function GraficoMotivoMensal({
  titulo,
  imagem,
  cor,
  meses,
  total,
  pct,
  onClose,
}: {
  titulo: string;
  imagem?: string;
  cor: string;
  meses: { mes: string; qtd: number }[];
  total: number;
  pct: number;
  onClose: () => void;
}) {
  const maximo = Math.max(...meses.map((m) => m.qtd), 1);

  /* Animação de entrada — o modal é remontado a cada abertura */
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setAberto(true), 50);
    return () => window.clearTimeout(t);
  }, []);

  /* Total contando de zero até o valor real */
  const [totalAnim, setTotalAnim] = useState(0);
  useEffect(() => {
    const inicio = performance.now();
    const duracao = 900;
    let raf = 0;
    const passo = (agora: number) => {
      const p = Math.min((agora - inicio) / duracao, 1);
      const easing = 1 - Math.pow(1 - p, 3);
      setTotalAnim(Math.round(total * easing));
      if (p < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [total]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity duration-300"
      style={{ opacity: aberto ? 1 : 0 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/20 bg-transparent shadow-2xl transition-all duration-300 ease-out"
        style={{
          opacity: aberto ? 1 : 0,
          transform: aberto ? "translateY(0) scale(1)" : "translateY(16px) scale(0.95)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho com imagem do tipo */}
        <div className="relative h-44 overflow-hidden bg-black/60">
          {imagem && <img src={imagem} alt={titulo} className="h-full w-full object-contain object-center" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
          >
            ✕
          </button>
          <p className="absolute bottom-2 left-4 text-sm font-bold tracking-wider text-white uppercase">
            {titulo}
          </p>
        </div>

        {/* Número grande + percentual */}
        <div className="flex items-baseline justify-between px-4 pt-3">
          <span className="font-serif text-3xl text-white tabular-nums sm:text-4xl">{fmtInt(totalAnim)}</span>
          <span className="text-sm font-light text-white/70">{fmtBrMax(pct, 1)}%</span>
        </div>

        {/* Linha de base grossa */}
        <div
          className="mx-4 my-2.5 h-1.5 origin-left rounded-full"
          style={{ background: cor, transform: aberto ? "scaleX(1)" : "scaleX(0)", transition: "transform 500ms ease-out 150ms" }}
        />

        {/* Barras por mês — crescem da base em sequência, com o valor surgindo sobre cada uma */}
        {meses.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/50">Sem dados</p>
        ) : (
          <div className="flex h-44 items-stretch gap-1.5 px-4 pb-4">
            {meses.map((m, i) => (
              <div key={m.mes} className="group/bar flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <div className="relative flex h-0 w-full justify-end">
                  <span
                    className="pointer-events-none absolute -top-6 right-1/2 z-10 translate-x-1/2 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white whitespace-nowrap"
                    style={{
                      opacity: aberto ? 1 : 0,
                      transform: aberto ? "translate(50%, 0)" : "translate(50%, 8px)",
                      transition: "opacity 350ms ease-out, transform 350ms ease-out",
                      transitionDelay: `${420 + 60 * i}ms`,
                    }}
                  >
                    {fmtInt(m.qtd)}
                  </span>
                </div>
                <div
                  className="w-full cursor-pointer rounded-t-full transition-all duration-700 ease-out group-hover/bar:brightness-125"
                  style={{
                    height: aberto ? `${Math.max((m.qtd / maximo) * 100, 4)}%` : "0%",
                    background: cor,
                    transitionDelay: `${120 + 80 * i}ms`,
                  }}
                />
                <span className="text-[9px] font-bold tracking-wider text-white/60 uppercase">
                  {m.mes.slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
