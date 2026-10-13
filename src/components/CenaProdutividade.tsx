/* Cena — Produtividade por colaborador e por turma.
   Botões alternam o tipo de atividade (separação manual, separação com
   empilhadeira, ...). Para o tipo ativo mostra: o total em toneladas, o
   ranking de colaboradores (nome, produtividade, cargo, tempo de casa e
   turma) e a produtividade somada por turma. Dados estáticos em
   src/data/produtividade.ts. */

import { Fragment, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtBrMax, fmtInt, fmtTonDec } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import {
  ToggleSecoes,
  useFocoCena,
  type SecaoDonut,
} from "@/components/cena-interativa";
import {
  PRODUTIVIDADE,
  type ProdColaborador,
  type ProdTurma,
} from "@/data/produtividade";
import { FICHAS_QLP, type FichaQlp } from "@/data/qlp-fichas";
import ToneladasMensais from "@/components/ToneladasMensais";

const CORES = ["#00FFCC", "#FFA500", "#7C9CFF", "#FF5FA2"];

/* Linhas exibidas em cada quadro; o restante vira "Outras (n)". */
const TOPO = 6;

/* Mapa de abreviação de mês → ano-mês (os dados são de 2026). */
const MES_ISO: Record<string, string> = {
  Jan: "2026-01", Fev: "2026-02", Mar: "2026-03", Abr: "2026-04",
  Mai: "2026-05", Jun: "2026-06", Jul: "2026-07", Ago: "2026-08",
  Set: "2026-09", Out: "2026-10",
};

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
  /* Nome do colaborador com a ficha QLP aberta no ranking (linha expandida). */
  const [fichaAberta, setFichaAberta] = useState<string | null>(null);
  const [prodDe, setProdDe] = useState("");
  const [prodAte, setProdAte] = useState("");

  const tipos = PRODUTIVIDADE.tipos;
  const idx = Math.min(foco, tipos.length - 1);
  const tipo = tipos[idx]!;
  const cor = CORES[idx % CORES.length]!;

  /* Filtra a tonelagem mensal pelo intervalo de datas selecionado. */
  const mensalFiltrado = useMemo(() => {
    if (!prodDe && !prodAte) return tipo.mensal ?? [];
    const de = prodDe?.slice(0, 7) || undefined;
    const ate = prodAte?.slice(0, 7) || undefined;
    return (tipo.mensal ?? []).filter((m) => {
      const iso = MES_ISO[m.mes];
      if (!iso) return true;
      if (de && iso < de) return false;
      if (ate && iso > ate) return false;
      return true;
    });
  }, [tipo.mensal, prodDe, prodAte]);

  const tonFiltrado = mensalFiltrado.reduce((s, m) => s + m.ton, 0);
  const temFiltro = !!(prodDe || prodAte);

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
          texto={`Produtividade por colaborador e por turma, do período ${tipo.periodo}. Os botões alternam o tipo de atividade; o total em toneladas é a soma da coluna PESO (kg) das planilhas "PRODUTIVIDADE POR COLABORADOR" (aba Resultado). Cargo, tempo de casa e turma vêm da planilha CD - QLP.xlsx (aba Base), casados pelo nome — quando o relatório usa apelido e não há casamento, o cargo fica vazio e a turma cai em "Sem turma". Turmas de status (DEMITIDO/INSS/TRANSFERIDO) também entram em "Sem turma". Clique num colaborador do ranking para abrir a ficha QLP (turno, turma, cargo, função, cidade, tempo de casa e admissão). Fonte atualizada em ${PRODUTIVIDADE.atualizadoEm}.`}
        />
      </div>

      <ToggleSecoes secoes={secoes} foco={idx} onChange={setFoco} />

      {/* Filtro por data — compacto em uma linha */}
      <div
        className="mx-auto mt-2 flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-white/70"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="font-bold tracking-widest uppercase text-white/55">Filtrar</span>
        <label className="flex items-center gap-1">de
          <input type="date" value={prodDe} onChange={(e) => { setProdDe(e.target.value); onPausar?.(); }}
            className="w-[100px] rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-white [color-scheme:dark]" />
        </label>
        <label className="flex items-center gap-1">até
          <input type="date" value={prodAte} onChange={(e) => { setProdAte(e.target.value); onPausar?.(); }}
            className="w-[100px] rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-white [color-scheme:dark]" />
        </label>
        {temFiltro && (
          <button type="button" onClick={() => { setProdDe(""); setProdAte(""); }}
            className="rounded border border-white/20 px-2 py-0.5 text-white/80 hover:bg-white/10">Limpar</button>
        )}
        {temFiltro && (
          <span className="font-bold text-brand-amber">
            · {fmtBrMax(tonFiltrado, 1)} t
          </span>
        )}
      </div>

      {/* Destaque — total em toneladas, card grande e centralizado */}
      <div
        className="video-sobe mx-auto mt-2.5 flex w-full max-w-sm flex-col items-center justify-center gap-1 rounded-2xl border px-6 py-4 text-center"
        style={{
          borderColor: `${cor}44`,
          background: `linear-gradient(130deg, ${cor}22, ${cor}11)`,
          boxShadow: `0 10px 24px ${cor}1A`,
        }}
      >
        <p className="font-serif text-4xl font-bold leading-none text-white" style={{ textShadow: `0 0 16px ${cor}33` }}>
          {fmtTonDec(temFiltro ? tonFiltrado : tipo.ton)}
        </p>
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: `${cor}cc` }}>
          toneladas · {tipo.nome}
        </p>
        {temFiltro && (
          <p className="text-[10px] text-white/50">
            {prodDe && prodAte
              ? `${prodDe.slice(8, 10)}/${prodDe.slice(5, 7)} – ${prodAte.slice(8, 10)}/${prodAte.slice(5, 7)}`
              : prodDe
                ? `A partir de ${prodDe.slice(8, 10)}/${prodDe.slice(5, 7)}`
                : `Até ${prodAte.slice(8, 10)}/${prodAte.slice(5, 7)}`}
          </p>
        )}
        <p className="text-[10px] text-white/55">
          <span className="font-bold text-white/90">{fmtInt(tipo.pessoas)}</span> colaboradores ·{" "}
          <span className="font-bold text-white/90">{fmtInt(tipo.cx)}</span> caixas · período{" "}
          {temFiltro ? "filtrado" : tipo.periodo}
        </p>
      </div>

      {/* Quadros empilhados verticalmente — melhor leitura no mobile */}
      <div className="mx-auto mt-3 grid w-full max-w-md grid-cols-1 gap-3">
        <QuadroColaboradores
          colabs={colabs}
          total={tipo.ton}
          cor={cor}
          aberto={fichaAberta}
          onAlternar={(nome) => {
            const abrir = fichaAberta !== nome;
            setFichaAberta(abrir ? nome : null);
            if (abrir) onPausar?.();
          }}
        />
        <QuadroTurmas turmas={turmas} total={tipo.ton} cor={cor} />
      </div>

      <ToneladasMensais tipo={{ ...tipo, mensal: mensalFiltrado }} />


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
   na linha de apoio, toneladas e % do tipo ativo. Clicar na linha expande a
   ficha QLP do colaborador (turno, turma, cargo, função, cidade, tempo de casa
   e admissão). */
function QuadroColaboradores({
  colabs,
  total,
  cor,
  aberto,
  onAlternar,
}: {
  colabs: ProdColaborador[];
  total: number;
  cor: string;
  /** nome do colaborador com a ficha aberta */
  aberto: string | null;
  onAlternar: (nome: string) => void;
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
            const abertoAqui = aberto === c.nome;
            return (
              <Fragment key={c.nome}>
                <tr
                  className={cn(
                    "cursor-pointer border-b border-white/10 transition-colors last:border-0 hover:bg-white/5",
                    abertoAqui && "bg-white/5",
                  )}
                  onClick={(e) => {
                    /* impede o clique de virar navegação de cena no painel */
                    e.stopPropagation();
                    onAlternar(c.nome);
                  }}
                  aria-expanded={abertoAqui}
                  title="Clique para abrir a ficha QLP"
                >
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
                      <span
                        className={cn("shrink-0 text-[8px] text-white/45", !c.cargo && "ml-auto")}
                        aria-hidden
                      >
                        {abertoAqui ? "▾" : "▸"}
                      </span>
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
                {abertoAqui && (
                  <tr
                    className="border-b border-white/10 last:border-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <td colSpan={3} className="pb-2">
                      <FichaQlpCard nome={c.nome} ficha={FICHAS_QLP[c.nome]} cor={cor} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-white/25 font-bold">
            <td className="py-1" style={{ color: cor }}>Total · {colabs.length} colaboradores</td>
            <td className="py-1 text-right font-mono text-[13px]" style={{ color: cor }}>{fmtBrMax(colabs.reduce((s, c) => s + c.ton, 0), 0)}</td>
            <td className="py-1 pl-2 text-right font-mono text-[10px] text-white/65">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* Ficha QLP do colaborador — aberta ao clicar na linha do ranking. Mostra o
   turno, a turma, o cargo, a função, a cidade, o tempo de casa e a admissão do
   cadastro CD - QLP.xlsx; nomes não casados avisam a ausência de cadastro. */
function FichaQlpCard({
  nome,
  ficha,
  cor,
}: {
  nome: string;
  ficha?: FichaQlp;
  cor: string;
}) {
  if (!ficha) {
    return (
      <p className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[9px] leading-tight text-white/55">
        Sem cadastro QLP para <span className="font-semibold text-white/80">{nome}</span> — o nome do
        relatório de produtividade não casou com a planilha CD - QLP.xlsx.
      </p>
    );
  }
  const campos: [string, string][] = [
    ["Turno", ficha.turno],
    ["Turma", ficha.turma],
    ["Cargo", ficha.cargo || "—"],
    ["Função", ficha.funcao || "—"],
    ["Cidade", ficha.cidade || "—"],
    ["Tempo de casa", `${fmtBrMax(ficha.tempo, 1)} anos`],
    ["Admissão", ficha.admissao || "—"],
  ];
  return (
    <div
      className="rounded-lg border px-2.5 py-2"
      style={{ borderColor: `${cor}33`, background: `${cor}0F` }}
    >
      <p className="mb-1 text-[8px] font-bold tracking-widest uppercase" style={{ color: cor }}>
        Ficha QLP
      </p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-4">
        {campos.map(([rotulo, valor]) => (
          <div key={rotulo} className="min-w-0">
            <dt className="text-[7px] font-bold tracking-wider text-white/45 uppercase">{rotulo}</dt>
            <dd className="truncate text-[10px] font-semibold text-white/90" title={valor}>
              {valor}
            </dd>
          </div>
        ))}
      </dl>
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
        <tfoot>
          <tr className="border-t-2 border-white/20 font-bold">
            <td className="py-1 text-white">Total · {turmas.length} turmas</td>
            <td className="py-1 text-right font-mono text-[13px] text-white">{fmtBrMax(turmas.reduce((s, t) => s + t.ton, 0), 0)}</td>
            <td className="py-1 pl-2 text-right font-mono text-[10px] text-white/65">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
