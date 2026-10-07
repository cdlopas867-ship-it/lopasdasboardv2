/* Cena — Produtividade por colaborador e por turma.
   Botões alternam o tipo de atividade (separação manual, separação com
   empilhadeira, ...). Para o tipo ativo mostra: o total em toneladas, o
   ranking de colaboradores (nome, produtividade, cargo, tempo de casa e
   turma) e a produtividade somada por turma. Dados estáticos em
   src/data/produtividade.ts. */

import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt, fmtTonDec } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import {
  ToggleSecoes,
  DestaqueGradiente,
  useFocoCena,
  type SecaoDonut,
} from "@/components/cena-interativa";
import {
  PRODUTIVIDADE,
  type ProdColaborador,
  type ProdTurma,
} from "@/data/produtividade";
import DestaquesProdutividade from "@/components/DestaquesProdutividade";

const CORES = ["#00FFCC", "#FFA500", "#7C9CFF", "#FF5FA2"];

/* Linhas exibidas em cada quadro; o restante vira "Outras (n)". */
const TOPO = 6;

export default function CenaProdutividade({
  anim,
  cena,
  onPausar,
}: {
  anim: boolean;
  cena: number;
  onPausar?: () => void;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);

  const tipos = PRODUTIVIDADE.tipos;
  const idx = Math.min(foco, tipos.length - 1);
  const tipo = tipos[idx]!;
  const cor = CORES[idx % CORES.length]!;

  const secoes: SecaoDonut[] = tipos.map((t, i) => ({
    id: t.id,
    label: t.nome,
    cor: CORES[i % CORES.length]!,
    pct: 0,
  }));

  const colabs = tipo.colaboradores.slice(0, TOPO);
  const turmas = recortarTurmas(tipo.turmas);

  return (
    <div className={cn("flex w-full flex-col items-center", anim && "video-entra")}>
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Produtividade · por colaborador
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto={`Produtividade por colaborador e por turma, do período ${tipo.periodo}. Os botões alternam o tipo de atividade; o total em toneladas é a soma da coluna PESO (kg) das planilhas "PRODUTIVIDADE POR COLABORADOR" (aba Resultado). Cargo, tempo de casa e turma vêm da planilha CD - QLP.xlsx (aba Base), casados pelo nome — quando o relatório usa apelido e não há casamento, o cargo fica vazio e a turma cai em "Sem turma". Turmas de status (DEMITIDO/INSS/TRANSFERIDO) também entram em "Sem turma". Fonte atualizada em ${PRODUTIVIDADE.atualizadoEm}.`}
        />
      </div>

      <ToggleSecoes secoes={secoes} foco={idx} onChange={setFoco} />

      <div className="mx-auto mt-2 w-full max-w-xs space-y-1.5">
        <div className="flex w-full justify-center">
          <DestaqueGradiente numero={fmtTonDec(tipo.ton)} rotulo={`toneladas · ${tipo.nome}`} />
        </div>
        <p className="text-center text-[10px] text-white/55">
          <span className="font-bold text-white/90">{fmtInt(tipo.pessoas)}</span> colaboradores ·{" "}
          <span className="font-bold text-white/90">{fmtInt(tipo.cx)}</span> caixas · período{" "}
          {tipo.periodo}
        </p>
      </div>

      <div className="mx-auto mt-3 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2">
        <QuadroColaboradores colabs={colabs} total={tipo.ton} cor={cor} />
        <QuadroTurmas turmas={turmas} total={tipo.ton} cor={cor} />
      </div>

      <DestaquesProdutividade tipo={tipo} />

      <p className="mx-auto mt-3 max-w-4xl text-center text-[8px] leading-tight text-white/40">
        * Produtividade = PESO (kg) somado e convertido em toneladas. O ranking mostra os{" "}
        {TOPO} maiores; o quadro por turma, as {TOPO} maiores (o resto em "Outras"). "Sem turma"
        reúne quem não teve o nome casado com o cadastro do CD e as turmas de status. Os destaques
        separam as equipes pelo cargo — Separação (expedição/etiquetagem) e Estoque
        (estoque/empilhadeira) — e quem não teve o cargo casado fica fora. Fonte:
        PRODUTIVIDADE POR COLABORADOR + CD - QLP.xlsx, {PRODUTIVIDADE.atualizadoEm}.
      </p>
    </div>
  );
}

/* Top 6 turmas + "Outras (n)" para o restante. */
function recortarTurmas(turmas: ProdTurma[]): ProdTurma[] {
  if (turmas.length <= TOPO + 1) return turmas;
  const resto = turmas.slice(TOPO);
  return [
    ...turmas.slice(0, TOPO),
    {
      nome: `Outras (${resto.length})`,
      ton: Math.round(resto.reduce((s, t) => s + t.ton, 0) * 10) / 10,
      cx: resto.reduce((s, t) => s + t.cx, 0),
      pessoas: resto.reduce((s, t) => s + t.pessoas, 0),
    },
  ];
}

/* Ranking por colaborador — nome em destaque, cargo · turma e tempo de casa
   na linha de apoio, toneladas e % do tipo ativo. */
function QuadroColaboradores({
  colabs,
  total,
  cor,
}: {
  colabs: ProdColaborador[];
  total: number;
  cor: string;
}) {
  const maior = Math.max(...colabs.map((c) => c.ton), 1);
  return (
    <div className="video-sobe min-w-0 rounded-xl border px-3 py-2.5" style={{ borderColor: `${cor}66`, background: `${cor}14`, animationDelay: "0.25s" }}>
      <table className="w-full text-left text-[11px] text-white">
        <thead>
          <tr className="border-b border-white/25 text-[8px] font-bold tracking-widest text-white/60 uppercase">
            <th className="pb-1 font-bold" style={{ color: cor }}>
              Colaborador
            </th>
            <th className="pb-1 text-right font-bold">Ton.</th>
            <th className="pb-1 pl-2 text-right font-bold">%</th>
          </tr>
        </thead>
        <tbody>
          {colabs.map((c, i) => {
            const pct = total > 0 ? (c.ton / total) * 100 : 0;
            return (
              <tr key={c.nome} className="border-b border-white/10 last:border-0">
                <td className="min-w-0 py-1 pr-2">
                  <span className="flex items-baseline gap-1.5">
                    <span className="font-mono text-[9px] font-bold" style={{ color: cor }}>
                      {i + 1}
                    </span>
                    <span className="min-w-0 truncate font-bold text-white" title={c.nome}>
                      {c.nome}
                    </span>
                    {c.cargo && (
                      <span className="ml-auto shrink-0 rounded-full bg-white/10 px-1.5 py-px font-mono text-[8px] font-semibold text-white/70">
                        {fmtBrMax(c.tempo, 1)} anos
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[9px] text-white/55" title={`${c.cargo || "—"} · ${c.turma}`}>
                    {c.cargo || "—"} · {c.turma}
                  </span>
                  <span className="mt-0.5 block h-[3px] overflow-hidden rounded-full bg-white/10">
                    <span
                      className="block h-full rounded-full transition-all duration-500"
                      style={{ width: `${(c.ton / maior) * 100}%`, background: cor }}
                    />
                  </span>
                </td>
                <td className="py-1 text-right font-mono text-[13px] font-bold" style={{ color: cor }}>
                  {fmtBrMax(c.ton, 0)}
                </td>
                <td className="py-1 pl-2 text-right font-mono text-[10px] font-semibold text-white/65">
                  {fmtBrMax(pct, 1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* Produtividade somada por turma. */
function QuadroTurmas({
  turmas,
  total,
  cor,
}: {
  turmas: ProdTurma[];
  total: number;
  cor: string;
}) {
  const maior = Math.max(...turmas.map((t) => t.ton), 1);
  return (
    <div className="video-sobe min-w-0 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5" style={{ animationDelay: "0.35s" }}>
      <table className="w-full text-left text-[11px] text-white">
        <thead>
          <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
            <th className="pb-1 font-bold">Por turma</th>
            <th className="pb-1 text-right font-bold">Ton.</th>
            <th className="pb-1 pl-2 text-right font-bold">%</th>
          </tr>
        </thead>
        <tbody>
          {turmas.map((t, i) => {
            const pct = total > 0 ? (t.ton / total) * 100 : 0;
            const lider = i === 0;
            return (
              <tr key={t.nome} className="border-b border-white/10 last:border-0">
                <td className="min-w-0 py-1 pr-2">
                  <span
                    className={cn("block truncate", lider ? "font-bold text-white" : "text-white/85")}
                    title={t.nome}
                  >
                    {t.nome}
                  </span>
                  <span className="mt-0.5 block text-[9px] text-white/50">
                    {fmtInt(t.pessoas)} colaboradores
                  </span>
                  <span className="mt-0.5 block h-[3px] overflow-hidden rounded-full bg-white/10">
                    <span
                      className="block h-full rounded-full transition-all duration-500"
                      style={{ width: `${(t.ton / maior) * 100}%`, background: lider ? cor : "rgba(255,255,255,0.45)" }}
                    />
                  </span>
                </td>
                <td className={cn("py-1 text-right font-mono text-[13px] font-bold", lider && "text-white")} style={lider ? { color: cor } : undefined}>
                  {fmtBrMax(t.ton, 0)}
                </td>
                <td className="py-1 pl-2 text-right font-mono text-[10px] font-semibold text-white/65">
                  {fmtBrMax(pct, 1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
