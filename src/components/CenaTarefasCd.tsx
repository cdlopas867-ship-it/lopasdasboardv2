/* Cena Tarefas do CD — relatório WF0008 (Manutenção de Tarefas do CD, FullSoft).
   Mesmo padrão visual das demais cenas (cena-interativa): donut interativo +
   botões por TIPO de tarefa, destaque da fatia focada, tabela Legenda por tipo,
   barras de tarefas por dia e alertas de execução/bloqueio.
   Dados estáticos em src/data/tarefas-cd.ts (período 01/10 a 19/10/2026). */

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
import { TAREFAS_CD, pctDoTipo } from "@/data/tarefas-cd";

export default function CenaTarefasCd({
  anim,
  cena,
  onPausar,
}: {
  anim: boolean;
  cena: number;
  onPausar?: (() => void) | undefined;
}) {
  const { total, tipos, dias, periodo, atualizadoEm, fonte } = TAREFAS_CD;
  const [foco, setFoco] = useFocoCena<number>(cena, 0);

  const tipo = tipos[foco] ?? tipos[0]!;
  const pctTipo = pctDoTipo(tipo);
  const execTipo = tipo.tarefas > 0 ? (tipo.executadas / tipo.tarefas) * 100 : 0;
  const pctExecTotal = total.tarefas > 0 ? (total.executadas / total.tarefas) * 100 : 0;
  const pctBloqTotal = total.tarefas > 0 ? (total.bloqueadas / total.tarefas) * 100 : 0;

  const secoes: SecaoDonut[] = tipos.map((t) => ({
    id: t.id,
    label: t.curto,
    cor: t.cor,
    pct: pctDoTipo(t),
  }));

  const separacao = tipos.find((t) => t.id === "separacao-manual");
  const conferencia = tipos.find((t) => t.id === "conferencia");
  const pctNaoExecConferencia = total.naoExecutadas > 0 && conferencia
    ? (conferencia.naoExecutadas / total.naoExecutadas) * 100
    : 0;
  const pctBloqSeparacao = total.bloqueadas > 0 && separacao
    ? (separacao.bloqueadas / total.bloqueadas) * 100
    : 0;

  const maxDia = Math.max(...dias.map((d) => d.tarefas), 1);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Tarefas do CD
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto="Manutenção de Tarefas do CD (relatório WF0008 do WMS FullSoft): todas as tarefas do período, por tipo. Executadas = tarefas com execução registrada (coluna Exec.); não executadas = tarefas ainda sem execução (Exec. = 0); bloqueadas = tarefas aguardando outra tarefa (coluna Bloqs.). Clique no donut ou nos botões para trocar o tipo de tarefa."
        />
      </div>

      <p className="video-sobe mt-0.5 text-[10px] text-white/60" style={{ animationDelay: "0.1s" }}>
        {periodo.inicial} a {periodo.final} · {fmtInt(total.tarefas)} tarefas em {total.dias} dias
      </p>

      <DonutInterativo
        secoes={secoes}
        foco={foco}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />
      <ToggleSecoes secoes={secoes} foco={foco} onChange={setFoco} />

      <div className="mt-2 w-full max-w-sm mx-auto space-y-1.5">
        <div className="flex w-full justify-center">
          <DestaqueGradiente numero={`${fmtBrMax(pctTipo, 1)}%`} rotulo={`Tarefas · ${tipo.nome}`} />
        </div>
        <p className="text-center text-[10px] text-white/55">
          <span className="font-bold text-white/90">{fmtInt(tipo.tarefas)}</span> tarefas ·{" "}
          <span className="font-bold text-white/90">{fmtInt(tipo.qtd)}</span> un · tipo {tipo.codigo}
        </p>
        <div className="rounded-lg bg-white/5 px-4 py-1.5 text-center">
          <p className="text-[12px] font-bold text-white">
            {fmtBrMax(execTipo, 1)}% executadas ({fmtInt(tipo.executadas)})
          </p>
          <p className="text-[10px] text-white/55">
            {fmtInt(tipo.bloqueadas)} bloqueadas · {fmtInt(tipo.naoExecutadas)} não executadas
            {tipo.liberadas > 0 ? ` · ${fmtInt(tipo.liberadas)} liberadas` : ""}
          </p>
        </div>
      </div>

      {/* Legenda — tarefas, participação, execução e quantidade por tipo */}
      <div className="video-sobe mt-3 w-full max-w-md mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Legenda · Por tipo de tarefa
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Tipo</th>
              <th className="pb-0.5 text-right font-bold">Tarefas</th>
              <th className="pb-0.5 text-right font-bold">%</th>
              <th className="pb-0.5 text-right font-bold">Exec.</th>
              <th className="pb-0.5 text-right font-bold">Qtd.</th>
            </tr>
          </thead>
          <tbody>
            {tipos.map((t) => {
              const ativo = t.id === tipo.id;
              const exec = t.tarefas > 0 ? (t.executadas / t.tarefas) * 100 : 0;
              return (
                <tr
                  key={t.id}
                  className={cn(
                    "border-b border-white/10 transition-colors last:border-0",
                    ativo ? "bg-white/[0.08]" : "bg-white/[0.02]",
                  )}
                >
                  <td className="py-0.5">
                    <button
                      type="button"
                      onClick={() => setFoco(tipos.indexOf(t))}
                      className="flex items-center gap-1.5 cursor-pointer text-left font-bold"
                      style={{ color: t.cor }}
                    >
                      <span className="size-2 rounded-full" style={{ background: t.cor }} />
                      {t.nome}
                    </button>
                  </td>
                  <td className="py-0.5 text-right font-mono font-semibold">{fmtInt(t.tarefas)}</td>
                  <td className="py-0.5 text-right font-mono font-bold text-white">{fmtBrMax(pctDoTipo(t), 1)}%</td>
                  <td className="py-0.5 text-right font-mono text-white/75">{fmtBrMax(exec, 1)}%</td>
                  <td className="py-0.5 text-right font-mono text-white/75">{fmtInt(t.qtd)}</td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-white/40 bg-white/10 font-bold">
              <td className="py-1 text-white">Total do período</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(total.tarefas)}</td>
              <td className="py-1 text-right font-mono text-white">100%</td>
              <td className="py-1 text-right font-mono text-white">{fmtBrMax(pctExecTotal, 1)}%</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(total.qtd)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tarefas por dia — barra verde = tarefas, trecho âmbar = bloqueadas */}
      <div className="video-sobe mt-3 w-full max-w-md mx-auto" style={{ animationDelay: "0.65s" }}>
        <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Tarefas por dia
        </p>
        <div className="flex h-20 items-end gap-1">
          {dias.map((d) => {
            const altura = (d.tarefas / maxDia) * 100;
            const bloqueio = d.tarefas > 0 ? (d.bloqueadas / d.tarefas) * 100 : 0;
            const pico = d.tarefas === maxDia;
            return (
              <div
                key={d.data}
                className="flex h-full flex-1 flex-col justify-end"
                title={`${d.data} · ${fmtInt(d.tarefas)} tarefas · ${fmtInt(d.bloqueadas)} bloqueadas · ${fmtInt(d.qtd)} un`}
              >
                <div
                  className={cn(
                    "relative w-full rounded-t transition-colors",
                    pico ? "bg-primary" : "bg-primary/60",
                  )}
                  style={{ height: `${Math.max(altura, 2)}%` }}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-t bg-brand-amber/85"
                    style={{ height: `${bloqueio}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex gap-1">
          {dias.map((d) => (
            <span key={d.data} className="flex-1 text-center text-[7px] font-medium text-white/45">
              {d.dia.slice(0, 2)}
            </span>
          ))}
        </div>
        <p className="mt-1 text-[8px] leading-tight text-white/40">
          Barra = tarefas do dia (pico: {dias.find((d) => d.tarefas === maxDia)?.dia}). Trecho âmbar =
          tarefas bloqueadas. Dias sem movimento (domingos e 12/10) não aparecem.
        </p>
      </div>

      {/* Alertas — execução e bloqueio */}
      <div className="video-sobe mt-3 w-full max-w-md mx-auto space-y-1" style={{ animationDelay: "0.75s" }}>
        <p className="flex items-start gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-[10px] leading-snug text-white/65">
          <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-amber" />
          <span>
            <span className="font-bold text-white/90">
              {fmtInt(total.naoExecutadas)} tarefas não executadas ({fmtBrMax((total.naoExecutadas / total.tarefas) * 100, 1)}%)
            </span>{" "}
            — {fmtInt(conferencia?.naoExecutadas ?? 0)} são conferência ({fmtBrMax(pctNaoExecConferencia, 0)}% do total).
          </span>
        </p>
        <p className="flex items-start gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-[10px] leading-snug text-white/65">
          <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
          <span>
            <span className="font-bold text-white/90">
              {fmtInt(total.bloqueadas)} tarefas bloqueadas ({fmtBrMax(pctBloqTotal, 1)}%)
            </span>{" "}
            — aguardam outra tarefa; {fmtInt(separacao?.bloqueadas ?? 0)} na separação manual ({fmtBrMax(pctBloqSeparacao, 0)}% do total).
          </span>
        </p>
      </div>

      <p className="video-sobe mt-2 text-center text-[8px] leading-tight text-white/40" style={{ animationDelay: "0.85s" }}>
        {fmtInt(total.qtd)} un movimentadas · {fmtInt(total.ondas)} ondas · {fmtInt(total.pedidos)} pedidos
        <br />
        {fonte} · exportado em {atualizadoEm}
      </p>
    </div>
  );
}
