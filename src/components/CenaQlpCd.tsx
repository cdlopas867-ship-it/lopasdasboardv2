/* Cena QLP · CD — quadro de lotação de pessoal sobre um mapa geográfico real:
   cada cidade aparece na sua posição geográfica (lat/lng), com o nó proporcional
   ao nº de colaboradores ativos. Ao lado, uma mini tabela por cidade (turmas,
   funções, turno, setor, cargo, admissão mais recente, % de ativos do total e
   demitidos). Clicar na cidade (no mapa ou na tabela) destaca o ponto. */

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

/* Área do mapa (viewBox) — proporção próxima da real da região (~0.82). */
const W = 240;
const H = 280;
const PAD = 30;

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

  /* Projeção geográfica: lat/lng reais → coordenadas do SVG. */
  const lats = cidades.map((c) => c.lat);
  const lngs = cidades.map((c) => c.lng);
  const latMin = Math.min(...lats);
  const latMax = Math.max(...lats);
  const lngMin = Math.min(...lngs);
  const lngMax = Math.max(...lngs);
  const px = (lng: number) => PAD + ((lng - lngMin) / (lngMax - lngMin || 1)) * (W - PAD * 2);
  const py = (lat: number) => PAD + ((latMax - lat) / (latMax - latMin || 1)) * (H - PAD * 2);

  const nos = cidades.map((c, i) => ({
    ...c,
    i,
    x: px(c.lng),
    y: py(c.lat),
    raio: 6 + (c.pessoas / maior) * 13,
    cor: CORES[i % CORES.length]!,
  }));

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
          texto="Quadro de Lotação de Pessoal do CD Lopas. O mapa mostra a posição geográfica real das cidades de residência dos colaboradores ativos (tamanho do nó = nº de pessoas). Na tabela, turmas/funções/setores/cargos são as quantidades distintas na cidade, Turno é 1º/2º, Admissão é a mais recente e % é a fatia da cidade no total de ativos. Fonte: planilha CD - QLP.xlsx (aba Base), atualizada em 07/10/2026."
        />
      </div>

      <BannerResumo
        delay="0.4s"
        texto={`${fmtInt(QLP_CD.ativos)} colaboradores ativos em ${fmtInt(cidades.length)} cidades`}
      />

      <div className="mt-3 flex w-full max-w-3xl flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* Mapa geográfico real das cidades */}
        <div className="video-pop mx-auto w-full max-w-[10rem] shrink-0">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible">
            <rect
              x="1"
              y="1"
              width={W - 2}
              height={H - 2}
              rx="14"
              fill="rgba(255,255,255,0.03)"
              stroke="rgba(255,255,255,0.10)"
            />
            {/* grade geográfica */}
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={`gv-${f}`}
                x1={W * f}
                y1="10"
                x2={W * f}
                y2={H - 10}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="0.6"
              />
            ))}
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={`gh-${f}`}
                x1="10"
                y1={H * f}
                x2={W - 10}
                y2={H * f}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="0.6"
              />
            ))}

            {/* Nós das cidades — posição geográfica real, pulso contínuo */}
            {nos.map((n) => {
              const destacado = n.i === foco;
              return (
                <g
                  key={n.cidade}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFoco(n.i);
                  }}
                  className="cursor-pointer"
                  style={{ opacity: destacado ? 1 : 0.72, transition: "opacity 0.4s ease" }}
                >
                  {anim && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.raio}
                      fill="none"
                      stroke={n.cor}
                      strokeWidth="1.1"
                      className="qlp-pulso"
                      style={{ animationDelay: `${n.i * 0.25}s` }}
                    />
                  )}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.raio}
                    fill={n.cor}
                    fillOpacity={destacado ? 0.95 : 0.75}
                    stroke={destacado ? "#ffffff" : "transparent"}
                    strokeWidth="1"
                  />
                  <text
                    x={n.x}
                    y={n.y + 2.4}
                    textAnchor="middle"
                    className="font-mono"
                    fontSize={n.raio > 13 ? 8 : 6.5}
                    fontWeight="700"
                    fill="#0f1a06"
                  >
                    {n.pessoas}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="mt-1.5 text-center text-[9px] text-white/45">
            {ativa ? `${ativa.cidade} · ${fmtInt(ativa.pessoas)} colaboradores` : null}
          </p>
        </div>

        {/* Mini tabela por cidade — legenda do mapa */}
        <div className="video-sobe w-full min-w-0 flex-1" style={{ animationDelay: "0.5s" }}>
          <p className="mb-1.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
            Onde mora o time
          </p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[8px] tracking-wider text-white/40 uppercase">
                <th className="pb-1 text-left font-semibold">Cidade</th>
                <th className="pb-1 text-right font-semibold">Turmas</th>
                <th className="pb-1 text-right font-semibold">Funções</th>
                <th className="pb-1 text-right font-semibold">Turno</th>
                <th className="pb-1 text-right font-semibold">Setor</th>
                <th className="pb-1 text-right font-semibold">Cargo</th>
                <th className="pb-1 text-right font-semibold">Admissão</th>
                <th className="pb-1 text-right font-semibold">%</th>
                <th className="pb-1 text-right font-semibold">Demit.</th>
              </tr>
            </thead>
            <tbody>
              {cidades.map((c, i) => {
                const pct = totalCidades > 0 ? (c.pessoas / totalCidades) * 100 : 0;
                const destacado = i === foco;
                return (
                  <tr
                    key={c.cidade}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFoco(i);
                    }}
                    className={cn(
                      "cursor-pointer border-t border-white/[0.06] transition-opacity duration-300",
                      destacado ? "opacity-100" : "opacity-60 hover:opacity-90",
                    )}
                  >
                    <td className="py-1 pr-2">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ background: CORES[i % CORES.length] }}
                        />
                        <span className="truncate text-[10px] font-semibold text-white">
                          {c.cidade}
                        </span>
                      </span>
                    </td>
                    <td className="py-1 text-right font-mono text-[9px] text-white/70">{fmtInt(c.turmas)}</td>
                    <td className="py-1 text-right font-mono text-[9px] text-white/70">{fmtInt(c.funcoes)}</td>
                    <td className="py-1 text-right font-mono text-[9px] text-white/70">
                      {c.turno1}/{c.turno2}
                    </td>
                    <td className="py-1 text-right font-mono text-[9px] text-white/70">{fmtInt(c.setores)}</td>
                    <td className="py-1 text-right font-mono text-[9px] text-white/70">{fmtInt(c.cargos)}</td>
                    <td className="py-1 text-right font-mono text-[9px] text-white/70">{c.admissao}</td>
                    <td className="py-1 text-right font-mono text-[9px] font-bold text-white">
                      {fmtBrMax(pct, 0)}%
                    </td>
                    <td className="py-1 text-right font-mono text-[9px] text-white/50">
                      {fmtInt(c.demitidos)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
        1º turno {fmtInt(QLP_CD.turnos[0]!.pessoas)} · 2º turno {fmtInt(QLP_CD.turnos[1]!.pessoas)}
      </p>
    </div>
  );
}
