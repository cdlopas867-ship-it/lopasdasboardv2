/* Cena QLP · CD — quadro de lotação de pessoal sobre um mapa geográfico real:
   cada cidade aparece na sua posição geográfica (lat/lng), com o nó proporcional
   ao nº de colaboradores ativos. Ao lado do mapa, os números do quadro em
   destaque (ativos, total, demitidos, afastados, transferidos e turnos) e, abaixo,
   a tabela por cidade — pessoas (com barra de proporção), % do time, turmas,
   funções, turno, setor, cargo, admissão mais recente e demitidos. Clicar na
   cidade (no mapa ou na tabela) destaca o ponto. */

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

/* Área do mapa (viewBox) — proporção próxima da real da região (~0.87). */
const W = 260;
const H = 300;
const PAD = 34;

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
    raio: 9 + (c.pessoas / maior) * 16,
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
          texto="Quadro de Lotação de Pessoal do CD Lopas. O mapa mostra a posição geográfica real das cidades de residência dos colaboradores ativos (tamanho do nó = nº de pessoas). Ao lado, os números do quadro em destaque. Na tabela, Pessoas é o total de ativos na cidade e % é a fatia dela no time; turmas/funções/setores/cargos são as quantidades distintas na cidade, Turno é 1º/2º, Admissão é a mais recente e Demit. são os desligados da cidade. Fonte: planilha CD - QLP.xlsx (aba Base), atualizada em 07/10/2026."
        />
      </div>

      <BannerResumo
        delay="0.4s"
        texto={`${fmtInt(QLP_CD.ativos)} colaboradores ativos em ${fmtInt(cidades.length)} cidades`}
      />

      <div className="mt-3 flex w-full max-w-4xl flex-col items-center gap-3 sm:flex-row sm:items-stretch">
        {/* Mapa geográfico real das cidades */}
        <div className="video-pop mx-auto w-full max-w-[10.5rem] shrink-0 sm:max-w-[11.5rem]">
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
                  style={{ opacity: destacado ? 1 : 0.7, transition: "opacity 0.4s ease" }}
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
                    fillOpacity={destacado ? 0.95 : 0.72}
                    stroke={destacado ? "#ffffff" : "transparent"}
                    strokeWidth="1.4"
                  />
                  <text
                    x={n.x}
                    y={n.y + 3}
                    textAnchor="middle"
                    className="font-mono"
                    fontSize={n.raio > 20 ? 12 : n.raio > 14 ? 10 : 8.5}
                    fontWeight="700"
                    fill="#0f1a06"
                  >
                    {n.pessoas}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="mt-2 text-center text-[11px] font-semibold text-white/70">
            {ativa ? (
              <>
                {ativa.cidade} ·{" "}
                <span className="font-mono text-white">{fmtInt(ativa.pessoas)}</span> colaboradores
              </>
            ) : null}
          </p>
        </div>

        {/* Números do quadro em destaque */}
        <div className="video-sobe w-full min-w-0 flex-1" style={{ animationDelay: "0.5s" }}>
          <p className="mb-2 text-[10px] font-bold tracking-[0.3em] text-white/60 uppercase">
            Quadro de pessoal
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            <StatQlp rotulo="Ativos" valor={fmtInt(QLP_CD.ativos)} destaque />
            <StatQlp rotulo="Total" valor={fmtInt(QLP_CD.total)} />
            <StatQlp rotulo="Demitidos" valor={fmtInt(QLP_CD.demitidos)} />
            <StatQlp rotulo="Afastados" valor={fmtInt(QLP_CD.afastados)} />
            <StatQlp rotulo="Transferidos" valor={fmtInt(QLP_CD.transferidos)} />
            <StatQlp
              rotulo="1º / 2º turno"
              valor={`${fmtInt(QLP_CD.turnos[0]!.pessoas)} / ${fmtInt(QLP_CD.turnos[1]!.pessoas)}`}
            />
          </div>
        </div>
      </div>

      {/* Tabela por cidade — pessoas em destaque, % do time e detalhes */}
      <div className="video-sobe mt-3 w-full max-w-4xl" style={{ animationDelay: "0.6s" }}>
        <p className="mb-1.5 text-[10px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Onde mora o time
        </p>
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[9px] tracking-wider text-white/45 uppercase">
              <th className="pb-1.5 text-left font-semibold">Cidade</th>
              <th className="pb-1.5 text-right font-semibold">Pessoas</th>
              <th className="pb-1.5 pl-3 text-right font-semibold">%</th>
              <th className="pb-1.5 text-right font-semibold">Turmas</th>
              <th className="pb-1.5 text-right font-semibold">Funções</th>
              <th className="pb-1.5 text-right font-semibold">Turno</th>
              <th className="pb-1.5 text-right font-semibold">Setor</th>
              <th className="pb-1.5 text-right font-semibold">Cargo</th>
              <th className="pb-1.5 text-right font-semibold">Admissão</th>
              <th className="pb-1.5 text-right font-semibold">Demit.</th>
            </tr>
          </thead>
          <tbody>
            {cidades.map((c, i) => {
              const pct = totalCidades > 0 ? (c.pessoas / totalCidades) * 100 : 0;
              const destacado = i === foco;
              const cor = CORES[i % CORES.length]!;
              return (
                <tr
                  key={c.cidade}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFoco(i);
                  }}
                  className={cn(
                    "cursor-pointer border-t border-white/[0.06] transition-colors duration-300",
                    destacado ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
                  )}
                >
                  <td className="py-1 pr-2">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: cor, opacity: destacado ? 1 : 0.7 }}
                      />
                      <span
                        className={cn(
                          "truncate text-[11px] font-semibold",
                          destacado ? "text-white" : "text-white/75",
                        )}
                      >
                        {c.cidade}
                      </span>
                    </span>
                  </td>
                  <td className="py-1 text-right">
                    <span className="font-mono text-[12px] font-bold text-white">
                      {fmtInt(c.pessoas)}
                    </span>
                    <span className="mt-0.5 ml-auto block h-[3px] w-10 overflow-hidden rounded-full bg-white/10">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${(c.pessoas / maior) * 100}%`, background: cor }}
                      />
                    </span>
                  </td>
                  <td className="py-1 pl-3 text-right font-mono text-[11px] font-bold text-primary">
                    {fmtBrMax(pct, 0)}%
                  </td>
                  <td className="py-1 text-right font-mono text-[10px] text-white/70">
                    {fmtInt(c.turmas)}
                  </td>
                  <td className="py-1 text-right font-mono text-[10px] text-white/70">
                    {fmtInt(c.funcoes)}
                  </td>
                  <td className="py-1 text-right font-mono text-[10px] text-white/70">
                    {c.turno1}/{c.turno2}
                  </td>
                  <td className="py-1 text-right font-mono text-[10px] text-white/70">
                    {fmtInt(c.setores)}
                  </td>
                  <td className="py-1 text-right font-mono text-[10px] text-white/70">
                    {fmtInt(c.cargos)}
                  </td>
                  <td className="py-1 text-right font-mono text-[10px] text-white/70">
                    {c.admissao}
                  </td>
                  <td className="py-1 text-right font-mono text-[10px] text-white/50">
                    {fmtInt(c.demitidos)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Cartão de um número do quadro — valor grande em serifa, rótulo em caixa alta. */
function StatQlp({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-2.5 py-1.5 backdrop-blur-sm",
        destaque ? "border-primary/40 bg-primary/[0.12]" : "border-white/10 bg-white/[0.05]",
      )}
    >
      <p
        className={cn(
          "font-serif text-xl leading-none tracking-tight",
          destaque ? "text-primary" : "text-white",
        )}
      >
        {valor}
      </p>
      <p className="mt-1 text-[8px] font-bold tracking-[0.25em] text-white/55 uppercase">{rotulo}</p>
    </div>
  );
}
