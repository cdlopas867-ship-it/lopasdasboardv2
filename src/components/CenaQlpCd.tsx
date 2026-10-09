/* Cena QLP · CD — quadro de lotação de pessoal no mesmo padrão das demais cenas:
   donut interativo + botões por CLASSE (Estoque, Carregamento, Liderança,
   Treinamento, Afastamento, Transferência, Desligamento), destaque em gradiente
   com o nº de colaboradores da classe e quadros da classe selecionada — turmas,
   cargos, funções, cidades, setores e tempo de casa. Clicar no donut ou nos
   botões alterna a classe. */

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

/* Uma cor por classe (hoje 7). */
const CORES_CLASSE = [
  "#00FFCC",
  "#FFA500",
  "#7C9CFF",
  "#FF5FA2",
  "#4ADE80",
  "#F87171",
  "#C084FC",
];

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

  const classes = QLP_CD.classes;
  const idx = Math.min(foco, classes.length - 1);
  const classe = classes[idx]!;
  const cor = CORES_CLASSE[idx % CORES_CLASSE.length]!;
  const pctClasse = QLP_CD.total > 0 ? (classe.pessoas / QLP_CD.total) * 100 : 0;

  const secoes: SecaoDonut[] = classes.map((c, i) => ({
    id: `classe-${i + 1}`,
    label: c.nome,
    cor: CORES_CLASSE[i % CORES_CLASSE.length]!,
    pct: QLP_CD.total > 0 ? (c.pessoas / QLP_CD.total) * 100 : 0,
  }));

  /* Cidade, Cargos e Funções ganham destaque (cartões maiores, no topo);
     Turmas, Setor e Tempo de casa vêm logo abaixo no formato compacto. */
  const quadrosDestaque = [
    { titulo: "Cidade", linhas: topComOutros(classe.cidades) },
    { titulo: "Cargos", linhas: topComOutros(classe.cargos) },
    { titulo: "Funções", linhas: topComOutros(classe.funcoes) },
  ];
  const quadros = [
    { titulo: "Turmas", linhas: topComOutros(classe.turmas) },
    { titulo: "Setor", linhas: classe.setores },
    { titulo: "Tempo de casa", linhas: classe.tempoCasa },
  ];

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          QLP · CD Lopas
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto="Quadro de Lotação de Pessoal do CD Lopas, agora organizado por CLASSE. O donut mostra a fatia de cada classe no total de registros; clique no donut ou nos botões para alternar as classes (Estoque, Carregamento, Liderança, Treinamento, Afastamento, Transferência e Desligamento). Em cada quadro, Pessoas = registros da classe naquele item e % = fatia sobre a classe. As classes de status (Desligamento, Transferência, Afastamento) também entram, então o total considera todos os registros classificados. Tempo de casa vem da coluna TEMPO (anos) da planilha. 'Sem turma' = turma não informada ou de status. Fonte: planilha CD - QLP.xlsx (aba Base), atualizada em 07/10/2026."
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
            numero={fmtInt(classe.pessoas)}
            rotulo={`registros · ${classe.nome}`}
          />
        </div>
        <p className="text-center text-[10px] text-white/55">
          <span className="font-bold text-white/90">{fmtBrMax(pctClasse, 1)}%</span> dos{" "}
          {fmtInt(QLP_CD.total)} registros · tempo de casa médio{" "}
          <span className="font-bold text-white/90">{fmtBrMax(classe.tempoMedio, 1)} anos</span>
        </p>
      </div>

      <div className="mx-auto mt-3 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
        {quadrosDestaque.map((q, i) => (
          <Quadro
            key={q.titulo}
            titulo={q.titulo}
            linhas={q.linhas}
            total={classe.pessoas}
            cor={cor}
            delay={0.4 + i * 0.08}
            destaque
          />
        ))}
      </div>

      <div className="mx-auto mt-3 grid w-full max-w-3xl grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
        {quadros.map((q, i) => (
          <Quadro
            key={q.titulo}
            titulo={q.titulo}
            linhas={q.linhas}
            total={classe.pessoas}
            cor={cor}
            delay={0.65 + i * 0.08}
          />
        ))}
      </div>

      <p className="mx-auto mt-3 max-w-3xl text-center text-[8px] leading-tight text-white/40">
        * Quadro geral: {fmtInt(QLP_CD.total)} registros · {fmtInt(QLP_CD.demitidos)} demitidos ·{" "}
        {fmtInt(QLP_CD.afastados)} afastados (INSS) · {fmtInt(QLP_CD.transferidos)} transferidos.
        Fonte: CD - QLP.xlsx, atualizada em {QLP_CD.atualizadoEm}.
      </p>
    </div>
  );
}

/* Quadro da classe — tabela no estilo "Legenda" das outras cenas:
   item, pessoas (em destaque, na cor da classe, com barra) e % da classe.
   Com `destaque` vira cartão maior, com borda na cor da classe e o item líder
   realçado (Cidade, Cargos e Funções). */
function Quadro({
  titulo,
  linhas,
  total,
  cor,
  delay,
  destaque = false,
}: {
  titulo: string;
  linhas: QlpLinha[];
  total: number;
  cor: string;
  delay: number;
  destaque?: boolean;
}) {
  const maior = Math.max(...linhas.map((l) => l.pessoas), 1);
  return (
    <div
      className={cn("video-sobe min-w-0", destaque && "rounded-xl border px-3 py-2.5")}
      style={{
        animationDelay: `${delay}s`,
        ...(destaque ? { borderColor: `${cor}66`, background: `${cor}14` } : null),
      }}
    >
      <table className={cn("w-full text-left text-white", destaque ? "text-[12px]" : "text-[11px]")}>
        <thead>
          <tr
            className={cn(
              "border-b font-bold tracking-widest uppercase",
              destaque
                ? "border-white/25 text-[8px] text-white/60"
                : "border-white/20 text-[8px] text-white/55",
            )}
          >
            <th
              className={cn("font-bold", destaque ? "pb-1 text-[13px] tracking-[0.18em]" : "pb-0.5")}
              style={{ color: cor }}
            >
              {titulo}
            </th>
            <th className="pb-0.5 text-right font-bold">Pessoas</th>
            <th className="pb-0.5 pl-2 text-right font-bold">%</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, idx) => {
            const pct = total > 0 ? (l.pessoas / total) * 100 : 0;
            const vazio = l.pessoas === 0;
            const lider = destaque && idx === 0 && !vazio;
            return (
              <tr
                key={l.nome}
                className={cn("border-b border-white/10 last:border-0", vazio && "opacity-40")}
                style={lider ? { background: `${cor}26` } : undefined}
              >
                <td className={cn("min-w-0 pr-2", destaque ? "py-1 pl-1" : "py-0.5")}>
                  <span
                    className={cn(
                      "block",
                      destaque ? "leading-tight break-words" : "truncate",
                      lider ? "font-bold text-white" : destaque ? "font-semibold text-white/90" : "text-white/85",
                    )}
                    title={l.nome}
                  >
                    {l.nome}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block overflow-hidden rounded-full bg-white/10",
                      destaque ? "h-[3px]" : "h-[2px]",
                    )}
                  >
                    <span
                      className="block h-full rounded-full transition-all duration-500"
                      style={{ width: `${(l.pessoas / maior) * 100}%`, background: cor }}
                    />
                  </span>
                </td>
                <td
                  className={cn(
                    "text-right font-mono font-bold",
                    destaque ? "py-1 text-[16px]" : "py-0.5 text-[13px]",
                  )}
                  style={{ color: vazio ? undefined : cor }}
                >
                  {fmtInt(l.pessoas)}
                </td>
                <td
                  className={cn(
                    "pl-2 text-right font-mono font-semibold text-white/65",
                    destaque ? "py-1 pr-1 text-[11px]" : "py-0.5 text-[10px]",
                  )}
                >
                  {fmtBrMax(pct, 0)}%
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-white/15 font-bold">
            <td className={cn("py-1", destaque ? "pl-1" : "")} style={{ color: cor }}>Total</td>
            <td className={cn("text-right font-mono", destaque ? "py-1 text-[16px]" : "py-0.5 text-[13px]")} style={{ color: cor }}>
              {fmtInt(linhas.reduce((s, l) => s + l.pessoas, 0))}
            </td>
            <td className={cn("pl-2 text-right font-mono text-white/65", destaque ? "py-1 pr-1 text-[11px]" : "py-0.5 text-[10px]")}>100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
