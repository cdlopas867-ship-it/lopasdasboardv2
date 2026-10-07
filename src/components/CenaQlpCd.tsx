/* Cena QLP · CD — quadro de lotação de pessoal no mesmo padrão das demais cenas:
   donut interativo + botões 1º turno / 2º turno, destaque em gradiente com o
   nº de colaboradores do turno e quadros do turno selecionado — turmas, cargos,
   funções, cidades, setores e tempo de casa. Clicar no donut ou nos botões
   alterna o turno. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import {
  DonutInterativo,
  ToggleSecoes,
  DestaqueGradiente,
  useFocoCena,
  type SecaoDonut,
} from "@/components/cena-interativa";
import { QLP_CD, type QlpLinha } from "@/data/qlp-cd";

const CORES_TURNO = ["#00FFCC", "#FFA500"];

/* Linhas mostradas por quadro; o resto vira "Outros (n)". */
const TOPO = 5;

function topComOutros(linhas: QlpLinha[], topo = TOPO): QlpLinha[] {
  if (linhas.length <= topo + 1) return linhas;
  const resto = linhas.slice(topo);
  return [
    ...linhas.slice(0, topo),
    { nome: `Outros (${resto.length})`, pessoas: resto.reduce((s, l) => s + l.pessoas, 0) },
  ];
}

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

  const turnos = QLP_CD.turnos;
  const idx = Math.min(foco, turnos.length - 1);
  const turno = turnos[idx]!;
  const cor = CORES_TURNO[idx % CORES_TURNO.length]!;
  const pctTurno = QLP_CD.ativos > 0 ? (turno.pessoas / QLP_CD.ativos) * 100 : 0;

  const secoes: SecaoDonut[] = turnos.map((t, i) => ({
    id: `turno-${i + 1}`,
    label: t.nome,
    cor: CORES_TURNO[i % CORES_TURNO.length]!,
    pct: QLP_CD.ativos > 0 ? (t.pessoas / QLP_CD.ativos) * 100 : 0,
  }));

  const quadros = [
    { titulo: "Turmas", linhas: topComOutros(turno.turmas) },
    { titulo: "Cargos", linhas: topComOutros(turno.cargos) },
    { titulo: "Funções", linhas: topComOutros(turno.funcoes) },
    { titulo: "Cidade", linhas: topComOutros(turno.cidades) },
    { titulo: "Setor", linhas: turno.setores },
    { titulo: "Tempo de casa", linhas: turno.tempoCasa },
  ];

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          QLP · CD Lopas
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto="Quadro de Lotação de Pessoal do CD Lopas, só colaboradores ativos. O donut mostra a fatia de cada turno no total de ativos; clique no donut ou nos botões para alternar 1º / 2º turno. Em cada quadro, Pessoas = colaboradores do turno naquele item e % = fatia sobre o turno. Tempo de casa vem da coluna TEMPO (anos) da planilha. 'Sem turma' = ativos sem turma informada na planilha. Fonte: planilha CD - QLP.xlsx (aba Base), atualizada em 07/10/2026."
        />
      </div>

      <DonutInterativo
        secoes={secoes}
        foco={idx}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />
      <ToggleSecoes secoes={secoes} foco={idx} onChange={setFoco} />

      <div className="mx-auto mt-2 w-full max-w-xs space-y-1.5">
        <div className="flex w-full justify-center">
          <DestaqueGradiente
            numero={fmtInt(turno.pessoas)}
            rotulo={`colaboradores · ${turno.nome}`}
          />
        </div>
        <p className="text-center text-[10px] text-white/55">
          <span className="font-bold text-white/90">{fmtBrMax(pctTurno, 1)}%</span> dos{" "}
          {fmtInt(QLP_CD.ativos)} ativos · tempo de casa médio{" "}
          <span className="font-bold text-white/90">{fmtBrMax(turno.tempoMedio, 1)} anos</span>
        </p>
      </div>

      <div className="mx-auto mt-3 grid w-full max-w-3xl grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {quadros.map((q, i) => (
          <Quadro
            key={q.titulo}
            titulo={q.titulo}
            linhas={q.linhas}
            total={turno.pessoas}
            cor={cor}
            delay={0.4 + i * 0.08}
          />
        ))}
      </div>

      <p className="mx-auto mt-3 max-w-3xl text-center text-[8px] leading-tight text-white/40">
        * Colaboradores ativos do CD. Quadro geral: {fmtInt(QLP_CD.total)} registros ·{" "}
        {fmtInt(QLP_CD.demitidos)} demitidos · {fmtInt(QLP_CD.afastados)} afastados (INSS) ·{" "}
        {fmtInt(QLP_CD.transferidos)} transferidos. Fonte: CD - QLP.xlsx, atualizada em{" "}
        {QLP_CD.atualizadoEm}.
      </p>
    </div>
  );
}

/* Quadro do turno — tabela no estilo "Legenda" das outras cenas:
   item, pessoas (em destaque, na cor do turno, com barra) e % do turno. */
function Quadro({
  titulo,
  linhas,
  total,
  cor,
  delay,
}: {
  titulo: string;
  linhas: QlpLinha[];
  total: number;
  cor: string;
  delay: number;
}) {
  const maior = Math.max(...linhas.map((l) => l.pessoas), 1);
  return (
    <div className="video-sobe min-w-0" style={{ animationDelay: `${delay}s` }}>
      <table className="w-full text-left text-[11px] text-white">
        <thead>
          <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
            <th className="pb-0.5 font-bold" style={{ color: cor }}>
              {titulo}
            </th>
            <th className="pb-0.5 text-right font-bold">Pessoas</th>
            <th className="pb-0.5 pl-2 text-right font-bold">%</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const pct = total > 0 ? (l.pessoas / total) * 100 : 0;
            const vazio = l.pessoas === 0;
            return (
              <tr
                key={l.nome}
                className={cn("border-b border-white/10 last:border-0", vazio && "opacity-40")}
              >
                <td className="min-w-0 py-0.5 pr-2">
                  <span className="block truncate text-white/85" title={l.nome}>
                    {l.nome}
                  </span>
                  <span className="mt-0.5 block h-[2px] overflow-hidden rounded-full bg-white/10">
                    <span
                      className="block h-full rounded-full transition-all duration-500"
                      style={{ width: `${(l.pessoas / maior) * 100}%`, background: cor }}
                    />
                  </span>
                </td>
                <td
                  className="py-0.5 text-right font-mono text-[13px] font-bold"
                  style={{ color: vazio ? undefined : cor }}
                >
                  {fmtInt(l.pessoas)}
                </td>
                <td className="py-0.5 pl-2 text-right font-mono text-[10px] font-semibold text-white/65">
                  {fmtBrMax(pct, 0)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
