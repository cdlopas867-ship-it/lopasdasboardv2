/* Cena de Avarias — mesmo padrão visual das demais cenas (cena-interativa:
   donut interativo + botões dos tipos + destaque + tabela Legenda).
   O donut mostra a fatia de cada tipo de avaria no total de volumes;
   clicar num tipo destaca seu % e mostra o detalhe mensal na Legenda.
   Clicar no destaque abre o modal com imagem + gráfico detalhado. */

import { useState } from "react";
import { fmtInt, fmtBrMax, fmtPeso } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import {
  DonutInterativo,
  ToggleSecoes,
  DestaqueGradiente,
  useFocoCena,
  type SecaoDonut,
} from "@/components/cena-interativa";
import { GraficoMotivoMensal } from "@/components/GraficoMotivoMensal";
import { imagemAvaria } from "@/data/avarias-imagens";
import type { VideoAvarias } from "./VideoResumoDashboard";

export default function CenaAvariasUnificada({
  anim,
  cena,
  avarias,
  onPausar,
}: {
  anim: boolean;
  cena: number;
  avarias?: VideoAvarias | undefined;
  onPausar?: (() => void) | undefined;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);
  const [tipoDetalhe, setTipoDetalhe] = useState<number | null>(null);

  if (!avarias || !avarias.tipos?.length) {
    return (
      <div className="flex w-full flex-col items-center py-6 text-center">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Avarias
        </p>
        <p className="video-sobe mt-4 font-serif text-2xl text-white/70">
          Sem registros de avarias.
        </p>
      </div>
    );
  }

  const tipos = avarias.tipos;
  const secoes: SecaoDonut[] = tipos.map((t) => ({
    id: t.tipo,
    label: t.tipo,
    cor: t.cor,
    pct: t.pct,
  }));
  const focoTipo = tipos[foco] ?? tipos[0]!;
  const totalPeso = avarias.meses.reduce((s, m) => s + (m.peso ?? 0), 0);

  return (
    <div className="flex w-full flex-col items-center">
      {/* ── Cabeçalho ── */}
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Avarias
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto={`Volumes avariados registrados no CD. Total de ${avarias.total.toLocaleString("pt-BR")} volumes (Soma de Quantidade). Distribuição mensal conferida com a tabela oficial. Custos parciais (em apuração). Fonte: planilha de avarias + tabela de referência de motivos. Janeiro a ${avarias.meses[avarias.meses.length - 1]?.mes ?? ""} de 2026.`}
        />
      </div>

      {/* ── Total geral ── */}
      <div className="video-sobe mt-1.5 flex items-baseline gap-2">
        <p className="font-serif text-2xl text-white sm:text-3xl">
          {fmtInt(avarias.total)}
        </p>
        <span className="text-xs text-white/60">volumes</span>
        {totalPeso > 0 && (
          <>
            <span className="text-[10px] font-bold text-white/30">·</span>
            <p className="font-mono text-sm font-bold text-brand-amber">{fmtPeso(totalPeso)}</p>
          </>
        )}
      </div>

      {/* ── Donut interativo ── */}
      <DonutInterativo
        secoes={secoes}
        foco={foco}
        onToggle={() => setFoco((f) => (f + 1) % secoes.length)}
        anim={anim}
      />
      <ToggleSecoes secoes={secoes} foco={foco} onChange={setFoco} />

      {/* ── Destaque do tipo focado ── */}
      <div className="mt-2 w-full max-w-xs mx-auto space-y-1.5">
        <div className="flex w-full justify-center">
          <button
            type="button"
            onClick={() => { setTipoDetalhe(foco); onPausar?.(); }}
            className="cursor-pointer transition-transform hover:scale-105"
            title="Clique para ver detalhes"
          >
            <DestaqueGradiente
              numero={`${fmtBrMax(focoTipo.pct, 1)}%`}
              rotulo={`Avarias · ${focoTipo.tipo}`}
            />
          </button>
        </div>
        <p className="text-center text-[10px] text-white/55">
          <span className="font-bold text-white/90">{fmtInt(focoTipo.total)}</span>
          {" "}de {fmtInt(avarias.total)} volumes
        </p>
        <div className="rounded-lg bg-white/5 px-4 py-1.5 text-center">
          <p className="text-[12px] font-bold text-white">
            {fmtInt(avarias.total)} volumes avariados no ano
          </p>
        </div>
      </div>

      {/* ── Legenda · Por mês (tipo focado) ── */}
      <div className="video-sobe mt-3 w-full max-w-md mx-auto" style={{ animationDelay: "0.5s" }}>
        <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Legenda · {focoTipo.tipo}
        </p>
        <table className="w-full text-left text-[11px] text-white">
          <thead>
            <tr className="border-b border-white/20 text-[8px] font-bold tracking-widest text-white/55 uppercase">
              <th className="pb-0.5 font-bold">Mês</th>
              <th className="pb-0.5 text-right font-bold">Volumes</th>
              <th className="pb-0.5 text-right font-bold">%</th>
            </tr>
          </thead>
          <tbody>
            {focoTipo.meses.map((m, i) => {
              const pct = focoTipo.total > 0 ? (m.qtd / focoTipo.total) * 100 : 0;
              return (
                <tr
                  key={m.mes}
                  className="video-sobe border-b border-white/10 last:border-0"
                  style={{ animationDelay: `${0.04 * i}s` }}
                >
                  <td className="py-0.5 font-bold text-white/90">{m.mes}</td>
                  <td className="py-0.5 text-right font-mono font-semibold">{fmtInt(m.qtd)}</td>
                  <td className="py-0.5 text-right font-mono font-bold text-brand-amber">{fmtBrMax(pct, 0)}%</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-white/40 bg-white/10 font-bold">
              <td className="py-1 text-white">Total</td>
              <td className="py-1 text-right font-mono text-white">{fmtInt(focoTipo.total)}</td>
              <td className="py-1 text-right font-mono text-white">100%</td>
            </tr>
          </tfoot>
        </table>
        <p className="mt-1.5 text-[8px] leading-tight text-white/40">
          * Soma de Quantidade por motivo. Clique no destaque para ver o gráfico detalhado.
        </p>
      </div>

      {/* ── Modal de detalhe ── */}
      {tipoDetalhe !== null && tipos[tipoDetalhe] && (
        <GraficoMotivoMensal
          titulo={tipos[tipoDetalhe].tipo}
          imagem={imagemAvaria(tipos[tipoDetalhe].tipo)}
          cor={tipos[tipoDetalhe].cor}
          meses={tipos[tipoDetalhe].meses}
          total={tipos[tipoDetalhe].total}
          pct={tipos[tipoDetalhe].pct}
          onClose={() => setTipoDetalhe(null)}
        />
      )}
    </div>
  );
}
