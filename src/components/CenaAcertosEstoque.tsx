/* Cena Acertos de Estoque — relatório WF0097 do WMS FullSoft.
   Mostra: tipos de acerto (donut interativo), endereços com/sem acerto,
   distribuição mensal e ranking de colaboradores com %. */

import { cn } from "@/lib/utils";
import { fmtInt, fmtBrMax } from "@/lib/format";
import InfoTooltip from "@/components/InfoTooltip";
import { DonutInterativo, ToggleSecoes, BannerResumo, useFocoCena, type SecaoDonut } from "@/components/cena-interativa";
import { ACERTOS_ESTOQUE, type AcertosEstoque, type RuaAcerto } from "@/data/acertos-estoque";

const COR_ENTRADA = "#22C55E";
const COR_SAIDA = "#F97316";
const COR_AVARIAS = "#EF4444";
const COR_COM_ACERTO = "#00FFCC";
const COR_SEM_ACERTO = "#6B7280";

const NOMES_MESES: Record<string, string> = {
  "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr", "05": "Mai",
  "06": "Jun", "07": "Jul", "08": "Ago", "09": "Set", "10": "Out",
  "11": "Nov", "12": "Dez",
};

export default function CenaAcertosEstoque({
  anim,
  cena,
  onPausar,
  acertos,
}: {
  anim: boolean;
  cena: number;
  onPausar?: (() => void) | undefined;
  acertos?: AcertosEstoque | null | undefined;
}) {
  const [foco, setFoco] = useFocoCena<number>(cena, 0);
  const [vista, setVista] = useFocoCena<number>(cena, 0); // 0 = tipos, 1 = endereços
  const d = acertos ?? ACERTOS_ESTOQUE;

  /* Donut de tipos de acerto */
  const secoesTipos: SecaoDonut[] = d.tipos.map((t, i) => ({
    id: t.tipo,
    label: t.tipo.toLowerCase().replace(" - integra focco", "").replace("saida de avarias", "avarias"),
    cor: [COR_ENTRADA, COR_SAIDA, COR_AVARIAS][i] ?? "#6B7280",
    pct: t.pct,
  }));

  /* Donut de endereços */
  const secoesEnderecos: SecaoDonut[] = [
    { id: "com-acerto", label: "com acerto", cor: COR_COM_ACERTO, pct: d.pctComAcerto },
    { id: "sem-acerto", label: "sem acerto", cor: COR_SEM_ACERTO, pct: d.pctSemAcerto },
  ];

  const secoes = vista === 0 ? secoesTipos : secoesEnderecos;
  const focoMax = secoes.length;

  const tipoAtivo = vista === 0 ? d.tipos[foco] : null;
  const enderecoAtivo = vista === 1 ? (foco === 0 ? "com" : "sem") : null;

  const maxMes = Math.max(...d.porMes.map((m) => m.count), 1);
  const topColabs = d.colaboradores.slice(0, 10);
  const outrosCount = d.totalAcertos - topColabs.reduce((s, c) => s + c.total, 0);
  const outrosPct = (outrosCount / d.totalAcertos) * 100;

  return (
    <div className="flex w-full flex-col items-center">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2">
        <p className="video-sobe text-xs font-bold tracking-[0.35em] text-white/80 uppercase">
          Acertos de Estoque
        </p>
        <InfoTooltip
          onOpen={onPausar}
          texto={`Acertos de inventário do CD (relatório WF0097 do WMS FullSoft). Período: ${d.periodoInicio} a ${d.periodoFim}. ${fmtInt(d.totalAcertos)} acertos em ${fmtInt(d.totalEnderecosComAcerto)} endereços distintos (de ${fmtInt(d.totalEnderecosCD)} no CD). Endereços ASTEC desconsiderados. ${d.totalColaboradores} colaboradores envolvidos.`}
        />
      </div>

      <p className="video-sobe mt-1 text-[10px] text-white/50" style={{ animationDelay: "0.1s" }}>
        {d.periodoInicio} a {d.periodoFim} · {fmtInt(d.totalAcertos)} acertos
      </p>

      {/* Toggle de vista: Tipos / Endereços */}
      <div className="video-sobe mt-2 flex items-center gap-2" style={{ animationDelay: "0.15s" }}>
        <button
          type="button"
          onClick={() => { setVista(0); setFoco(0); }}
          className={cn(
            "rounded-full px-3 py-1 text-[9px] font-bold tracking-widest uppercase transition-all",
            vista === 0 ? "bg-white text-brand-dark" : "border border-white/30 text-white/70 hover:text-white",
          )}
        >
          Tipos
        </button>
        <button
          type="button"
          onClick={() => { setVista(1); setFoco(0); }}
          className={cn(
            "rounded-full px-3 py-1 text-[9px] font-bold tracking-widest uppercase transition-all",
            vista === 1 ? "bg-white text-brand-dark" : "border border-white/30 text-white/70 hover:text-white",
          )}
        >
          Endereços
        </button>
      </div>

      {/* Donut interativo */}
      <div className="mt-2">
        <DonutInterativo
          secoes={secoes}
          foco={foco}
          onToggle={() => setFoco((f) => (f + 1) % focoMax)}
          anim={anim}
        />
      </div>
      <ToggleSecoes secoes={secoes} foco={foco} onChange={setFoco} />

      {/* Banner resumo da seção ativa */}
      {vista === 0 && tipoAtivo && (
        <BannerResumo
          delay="0.4s"
          texto={`${fmtInt(tipoAtivo.count)} ${tipoAtivo.tipo.toLowerCase().includes("avarias") ? "saídas de avarias" : tipoAtivo.tipo.toLowerCase() + "s"}`}
        />
      )}
      {vista === 1 && enderecoAtivo && (
        <BannerResumo
          delay="0.4s"
          texto={
            enderecoAtivo === "com"
              ? `${fmtInt(d.totalEnderecosComAcerto)} endereços com acerto`
              : `${fmtInt(d.enderecosSemAcerto)} endereços sem acerto`
          }
        />
      )}

      {/* Legenda — Tipos */}
      {vista === 0 && (
        <div className="video-sobe mt-3 w-full max-w-sm mx-auto" style={{ animationDelay: "0.5s" }}>
          <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
            Tipos de Acerto
          </p>
          <div className="space-y-1.5">
            {d.tipos.map((t, i) => {
              const cor = [COR_ENTRADA, COR_SAIDA, COR_AVARIAS][i] ?? "#6B7280";
              return (
                <div key={t.tipo} className="flex items-center gap-2.5">
                  <span className="size-2.5 shrink-0 rounded-sm" style={{ background: cor }} />
                  <span className="flex-1 text-[11px] text-white/80">
                    {t.tipo.toLowerCase().replace(" - integra focco", "").replace("saida de avarias", "saída de avarias")}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-white">{fmtInt(t.count)}</span>
                  <span className="w-10 text-right font-mono text-[10px] font-bold" style={{ color: cor }}>
                    {fmtBrMax(t.pct, 1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legenda — Endereços */}
      {vista === 1 && (
        <div className="video-sobe mt-3 w-full max-w-sm mx-auto" style={{ animationDelay: "0.5s" }}>
          <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
            Endereços do CD
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: COR_COM_ACERTO }} />
              <span className="flex-1 text-[11px] text-white/80">Endereços com acerto</span>
              <span className="font-mono text-[11px] font-bold text-white">{fmtInt(d.totalEnderecosComAcerto)}</span>
              <span className="w-10 text-right font-mono text-[10px] font-bold" style={{ color: COR_COM_ACERTO }}>
                {fmtBrMax(d.pctComAcerto, 1)}%
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: COR_SEM_ACERTO }} />
              <span className="flex-1 text-[11px] text-white/80">Endereços sem acerto</span>
              <span className="font-mono text-[11px] font-bold text-white">{fmtInt(d.enderecosSemAcerto)}</span>
              <span className="w-10 text-right font-mono text-[10px] font-bold" style={{ color: COR_SEM_ACERTO }}>
                {fmtBrMax(d.pctSemAcerto, 1)}%
              </span>
            </div>
            <p className="pt-1 text-[9px] leading-tight text-white/40">
              {fmtInt(d.totalEnderecosCD)} endereços totais do CD · cruzamento com a planilha de estoques (WF0112). ASTEC desconsiderado.
            </p>
          </div>

          {/* Ruas — endereços com e sem acerto por rua */}
          <div className="mt-3">
            <p className="mb-1.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
              Por Rua · {d.ruas.length} ruas
            </p>
            <div className="space-y-1">
              {d.ruas.map((r: RuaAcerto, i: number) => {
                const pctCom = (r.comAcerto / r.totalEnderecos) * 100;
                const focoCom = enderecoAtivo === "com";
                const focoSem = enderecoAtivo === "sem";
                return (
                  <div key={r.rua} className="flex items-center gap-2">
                    <span className="w-14 shrink-0 font-mono text-[9px] font-bold text-white/70">
                      {r.rua}
                    </span>
                    <div className="flex-1">
                      <div className="flex h-3 overflow-hidden rounded-sm bg-white/5">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: anim ? `${pctCom}%` : "0%",
                            background: COR_COM_ACERTO,
                            opacity: focoSem ? 0.3 : 1,
                            transitionDelay: `${i * 0.04 + 0.3}s`,
                          }}
                        />
                        <div
                          className="h-full flex-1 transition-all duration-500"
                          style={{
                            background: COR_SEM_ACERTO,
                            opacity: focoCom ? 0.3 : 1,
                          }}
                        />
                      </div>
                    </div>
                    <span
                      className="w-10 shrink-0 text-right font-mono text-[9px] font-bold transition-opacity duration-300"
                      style={{ color: COR_COM_ACERTO, opacity: focoSem ? 0.3 : 1 }}
                    >
                      {fmtInt(r.comAcerto)}
                    </span>
                    <span
                      className="w-10 shrink-0 text-right font-mono text-[9px] font-bold transition-opacity duration-300"
                      style={{ color: COR_SEM_ACERTO, opacity: focoCom ? 0.3 : 1 }}
                    >
                      {fmtInt(r.semAcerto)}
                    </span>
                    <span className="w-12 shrink-0 text-right font-mono text-[9px] font-bold text-brand-amber">
                      {fmtInt(r.totalAcertos)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-1.5 flex items-center gap-2 pl-14 text-[8px] text-white/40">
              <span className="w-10 text-right">com</span>
              <span className="w-10 text-right">sem</span>
              <span className="w-12 text-right">acertos</span>
            </div>
          </div>
        </div>
      )}

      {/* Distribuição mensal */}
      <div className="video-sobe mt-4 w-full max-w-sm mx-auto" style={{ animationDelay: "0.6s" }}>
        <p className="mb-1.5 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Por mês
        </p>
        <div className="flex h-16 items-end justify-between gap-1">
          {d.porMes.map((m, i) => (
            <div key={m.mes} className="flex flex-1 flex-col items-center gap-0.5">
              <div className="flex w-full items-end justify-center" style={{ height: "48px" }}>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-brand-amber/50 to-brand-amber"
                  style={{
                    height: anim ? `${(m.count / maxMes) * 100}%` : "0%",
                    transition: `height 1s cubic-bezier(0.22,1,0.36,1) ${i * 0.05}s`,
                  }}
                />
              </div>
              <span className="text-[7px] font-bold text-white/50">{m.mes}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking de colaboradores */}
      <div className="video-sobe mt-4 w-full max-w-sm mx-auto" style={{ animationDelay: "0.7s" }}>
        <p className="mb-1 text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
          Por Colaborador · {d.totalColaboradores} no total
        </p>
        <div className="space-y-1">
          {topColabs.map((c, i) => {
            const maxColab = topColabs[0]!.total;
            return (
              <div key={c.nome} className="flex items-center gap-2">
                <span className="w-4 shrink-0 text-right font-mono text-[8px] font-bold text-white/40">
                  {i + 1}
                </span>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[10px] font-medium text-white/80">
                      {c.nome.replace(" (Desktop)", "")}
                    </span>
                  </div>
                  <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-amber/60 to-brand-amber"
                      style={{
                        width: anim ? `${(c.total / maxColab) * 100}%` : "0%",
                        transition: `width 1s cubic-bezier(0.22,1,0.36,1) ${i * 0.04 + 0.3}s`,
                      }}
                    />
                  </div>
                </div>
                <span className="w-12 text-right font-mono text-[10px] font-bold text-white">
                  {fmtInt(c.total)}
                </span>
                <span className="w-10 text-right font-mono text-[9px] font-bold text-brand-amber">
                  {fmtBrMax(c.pct, 1)}%
                </span>
              </div>
            );
          })}
          {/* Outros */}
          <div className="flex items-center gap-2 border-t border-white/10 pt-1">
            <span className="w-4 shrink-0 text-right font-mono text-[8px] font-bold text-white/40">+</span>
            <span className="flex-1 text-[10px] font-medium text-white/50">
              Outros ({d.totalColaboradores - topColabs.length})
            </span>
            <span className="w-12 text-right font-mono text-[10px] font-bold text-white/60">
              {fmtInt(outrosCount)}
            </span>
            <span className="w-10 text-right font-mono text-[9px] font-bold text-white/40">
              {fmtBrMax(outrosPct, 1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
