import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt } from "@/lib/format";
import { TONELAGEM_ESTOQUE_MENSAL } from "@/data/tonelagem-estoque";

/* Cena — Tonelagem do estoque mês a mês (gráfico de área minimalista).
 * Linha suave com gradiente verde translúcido sob a curva, pontos por mês
 * e o mês atual destacado em âmbar. Card claro flutuando sobre o fundo escuro. */

type Props = {
  anim: boolean;
};

export default function CenaTonelagemEstoque({ anim }: Props) {
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

  /* Geometria do SVG — viewBox 708×178, pontos calculados dinamicamente */
  const vbW = 708;
  const vbH = 178;
  const plotTop = 28;
  const plotBottom = 126;
  const plotH = plotBottom - plotTop;
  const startX = 24;
  const endX = 684;
  const stepX = (endX - startX) / (dados.length - 1);
  const range = maxTon - minTon || 1;

  const pts = dados.map((d, i) => ({
    x: startX + i * stepX,
    y: plotBottom - ((d.ton - minTon) / range) * plotH,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1]!.x} ${vbH - 20} L${pts[0]!.x} ${vbH - 20} Z`;
  const gridPath = `M0 ${plotTop}H${vbW}M0 ${(plotTop + plotBottom) / 2}H${vbW}M0 ${plotBottom}H${vbW}`;

  return (
    <div className="tonelagem-card w-full pb-6">
      <p className="video-sobe tonelagem-eyebrow">
        Toneladas do Estoque · Mês a Mês
      </p>

      {/* Cabeçalho — último mês, variação e resumo do período */}
      <div className="video-sobe tonelagem-head" style={{ animationDelay: "0.1s" }}>
        <div className="tonelagem-latest">
          <p className="tonelagem-value">
            {fmtInt(ultimo.ton)} <span className="tonelagem-unit">t</span>
          </p>
          <span
            className={cn(
              "tonelagem-change",
              deltaUltimo >= 0 ? "tonelagem-change-up" : "tonelagem-change-down",
            )}
          >
            {deltaUltimo >= 0 ? "▲" : "▼"} {fmtBrMax(Math.abs(deltaUltimo), 1)}%
          </span>
          <span className="tonelagem-period">
            {ultimo.mes} · vs. {anterior.mes}
          </span>
        </div>

        <div className="tonelagem-pills">
          {resumo.map((r) => (
            <span key={r.rotulo} className="tonelagem-pill">
              {r.rotulo}{" "}
              <span className="tonelagem-pill-value">
                {fmtInt(r.valor)} t
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Gráfico — linha de área com gradiente verde */}
      <div className="video-sobe tonelagem-chart" style={{ animationDelay: "0.2s" }}>
        <svg
          className="tonelagem-plot"
          viewBox={`0 0 ${vbW} ${vbH}`}
          role="img"
          aria-label="Gráfico de área mensal de toneladas"
        >
          <defs>
            <linearGradient id="tonelagemAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#75bd87" stopOpacity=".38" />
              <stop offset="100%" stopColor="#75bd87" stopOpacity=".035" />
            </linearGradient>
          </defs>
          <path className="tonelagem-gridline" d={gridPath} />
          <path
            className={cn("tonelagem-area", !anim && "video-pausada")}
            d={areaPath}
          />
          <path
            className={cn("tonelagem-curve", !anim && "video-pausada")}
            d={linePath}
          />
          {pts.map((p, i) => {
            const destaque = i === dados.length - 1;
            return (
              <circle
                key={i}
                className={cn(
                  "tonelagem-dot",
                  destaque && "tonelagem-dot-current",
                  !anim && "video-pausada",
                )}
                cx={p.x}
                cy={p.y}
                r={destaque ? 6 : 4.5}
              />
            );
          })}
        </svg>

        {/* Rótulos dos meses + variação vs. mês anterior */}
        <div className="tonelagem-month-grid">
          {dados.map((d, i) => {
            const prev = dados[i - 1];
            const delta = prev ? ((d.ton - prev.ton) / prev.ton) * 100 : null;
            const destaque = i === dados.length - 1;
            return (
              <div key={d.mes} className="tonelagem-month">
                <p
                  className={cn(
                    "tonelagem-month-name",
                    destaque && "tonelagem-month-name-current",
                  )}
                >
                  {d.mes.slice(0, 3)}
                </p>
                <p className="tonelagem-month-value">{fmtInt(d.ton)}</p>
                <p
                  className={cn(
                    "tonelagem-month-delta",
                    delta !== null && delta < 0 && "tonelagem-month-delta-down",
                  )}
                >
                  {delta === null
                    ? "—"
                    : `${delta >= 0 ? "▲" : "▼"} ${fmtBrMax(Math.abs(delta), 1)}%`}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
