/* Cena QLP · CD — quadro de lotação de pessoal com rede animada das cidades
   (CD no centro, cidades ao redor) e ranking ao lado. O nó pulsante e as
   linhas em fluxo dão o efeito de "tempo real"; clicar numa cidade destaca
   o nó correspondente na rede. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { BannerResumo, useFocoCena } from "@/components/cena-interativa";
import { QLP_CD } from "@/data/qlp-cd";

const CORES = [
  "#33D953",
  "#8ED321",
  "#F5A623",
  "#33A0D9",
  "#A533D9",
  "#D9534F",
  "#5AD9C6",
  "#D9C033",
  "#9AA0A6",
];

const CX = 110;
const CY = 110;
const RAIO_ORBITA = 76;

export default function CenaQlpCd({
  anim,
  cena,
  onPausar,
}: {
  anim: boolean;
  cena: number;
  onPausar?: () => void;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);

  const cidades = QLP_CD.cidades;
  const totalCidades = cidades.reduce((s, c) => s + c.pessoas, 0);
  const maior = Math.max(...cidades.map((c) => c.pessoas), 1);

  const nos = cidades.map((c, i) => {
    const ang = (i / cidades.length) * Math.PI * 2 - Math.PI / 2;
    return {
      ...c,
      i,
      x: CX + Math.cos(ang) * RAIO_ORBITA,
      y: CY + Math.sin(ang) * RAIO_ORBITA,
      raio: 7 + (c.pessoas / maior) * 15,
      cor: CORES[i % CORES.length]!,
    };
  });

  const ativa = cidades[foco];

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          QLP · CD Lopas
        </p>
        <span className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[9px] font-bold tracking-widest text-white/80 uppercase">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          ao vivo
        </span>
        <InfoTooltip
          onOpen={onPausar}
          texto="Quadro de Lotação de Pessoal do CD Lopas. A rede mostra os colaboradores ativos por cidade de residência (tamanho do nó = nº de pessoas); o CD fica no centro. Fonte: planilha CD-QLP.xlsx (aba Base), atualizada em 07/10/2026."
        />
      </div>

      <BannerResumo
        delay="0.4s"
        texto={`${fmtInt(QLP_CD.ativos)} colaboradores ativos em ${fmtInt(cidades.length)} cidades`}
      />

      <div className="mt-3 grid w-full max-w-3xl grid-cols-1 items-center gap-3 sm:grid-cols-2">
        {/* Rede das cidades — CD no centro, nós proporcionais ao nº de pessoas */}
        <div className="video-pop mx-auto w-full max-w-[16rem]">
          <svg viewBox="0 0 220 220" className="w-full overflow-visible">
            {/* Linhas do CD até cada cidade */}
            {nos.map((n) => (
              <line
                key={`l-${n.cidade}`}
                x1={CX}
                y1={CY}
                x2={n.x}
                y2={n.y}
                stroke={n.cor}
                strokeWidth={n.i === foco ? 1.8 : 1}
                strokeLinecap="round"
                className={cn(anim ? "qlp-fluxo" : "opacity-30")}
                style={{
                  opacity: n.i === foco ? 0.95 : 0.4,
                  transition: "opacity 0.4s ease, stroke-width 0.4s ease",
                }}
              />
            ))}

            {/* Nós das cidades — pulso contínuo (efeito tempo real) */}
            {nos.map((n) => {
              const destacado = n.i === foco;
              return (
                <g
                  key={n.cidade}
                  onClick={() => setFoco(n.i)}
                  className="cursor-pointer"
                  style={{ opacity: destacado ? 1 : 0.6, transition: "opacity 0.4s ease" }}
                >
                  {anim && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.raio}
                      fill="none"
                      stroke={n.cor}
                      strokeWidth="1.2"
                      className="qlp-pulso"
                      style={{ animationDelay: `${n.i * 0.25}s` }}
                    />
                  )}
                  <circle cx={n.x} cy={n.y} r={n.raio} fill={n.cor} fillOpacity={destacado ? 0.95 : 0.7} />
                  <text
                    x={n.x}
                    y={n.y + 3}
                    textAnchor="middle"
                    className="font-mono"
                    fontSize={n.raio > 14 ? 10 : 8}
                    fontWeight="700"
                    fill="#0f1a06"
                  >
                    {n.pessoas}
                  </text>
                </g>
              );
            })}

            {/* CD no centro */}
            <circle cx={CX} cy={CY} r="26" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            <text x={CX} y={CY - 3} textAnchor="middle" fontSize="12" fontWeight="700" fill="#ffffff">
              CD
            </text>
            <text x={CX} y={CY + 10} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.7)">
              {fmtInt(QLP_CD.ativos)} ativos
            </text>
          </svg>
        </div>

        {/* Ranking das cidades */}
        <div className="video-sobe w-full" style={{ animationDelay: "0.5s" }}>
          <p className="mb-1.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
            Onde mora o time
          </p>
          <div className="space-y-1">
            {cidades.map((c, i) => {
              const pct = totalCidades > 0 ? (c.pessoas / totalCidades) * 100 : 0;
              const destacado = i === foco;
              return (
                <button
                  key={c.cidade}
                  type="button"
                  onClick={() => setFoco(i)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-all duration-300",
                    destacado ? "bg-white/[0.06]" : "opacity-60 hover:opacity-90",
                  )}
                >
                  <span className="w-24 shrink-0 truncate text-[10px] font-semibold text-white">
                    {c.cidade}
                  </span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/12">
                    <span
                      className={cn("block h-full rounded-full", anim ? "video-barra-x" : "video-pausada")}
                      style={{
                        width: `${(c.pessoas / maior) * 100}%`,
                        background: CORES[i % CORES.length],
                        animationDelay: `${0.06 * i + 0.4}s`,
                      }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right font-mono text-[10px] font-bold text-white">
                    {fmtInt(c.pessoas)}
                  </span>
                  <span className="w-10 shrink-0 text-right font-mono text-[9px] text-white/50">
                    {fmtBrMax(pct, 0)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Situação do quadro — números do QLP */}
      <div
        className="video-sobe mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-white/60"
        style={{ animationDelay: "0.7s" }}
      >
        <span>
          Total <span className="font-mono font-bold text-white">{fmtInt(QLP_CD.total)}</span>
        </span>
        <span>
          Ativos <span className="font-mono font-bold text-primary">{fmtInt(QLP_CD.ativos)}</span>
        </span>
        <span>
          Demitidos <span className="font-mono font-bold text-white/85">{fmtInt(QLP_CD.demitidos)}</span>
        </span>
        <span>
          Afastados (INSS) <span className="font-mono font-bold text-white/85">{fmtInt(QLP_CD.afastados)}</span>
        </span>
        <span>
          Transferidos <span className="font-mono font-bold text-white/85">{fmtInt(QLP_CD.transferidos)}</span>
        </span>
      </div>
      <p className="mt-1 text-[9px] text-white/40">
        {ativa ? `Em foco: ${ativa.cidade} · ${fmtInt(ativa.pessoas)} colaboradores` : null}
        {" · "}1º turno {fmtInt(QLP_CD.turnos[0]!.pessoas)} · 2º turno {fmtInt(QLP_CD.turnos[1]!.pessoas)}
      </p>
    </div>
  );
}
