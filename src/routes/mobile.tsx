import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useDadosSync } from "@/hooks/use-dados-sync";
import { initialSyncData } from "@/lib/initial-sync-data";
import { POSICAO_EM_LINHA, POSICAO_FORA_DE_LINHA } from "@/data/fora-de-linha";
import { fmtInt, fmtMi, fmtTonDec, fmtPct } from "@/lib/format";
import { normalizarDiasExibicao } from "@/lib/recebimento";

type Painel = typeof initialSyncData & Record<string, unknown>;

export const Route = createFileRoute("/mobile")({
  head: () => ({
    meta: [
      { title: "Painel Mobile · Lopas CD" },
      { name: "description", content: "Versão mobile resumida do painel do CD Lopas." },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
    ],
  }),
  component: MobilePage,
});

/* ── Tipos ────────────────────────────────────────────────────────── */

type Resumo = { ton?: number; valor?: number; previsto?: number; saldo?: number; itens?: number };
type Ocupacao = { pct?: number; ocupados?: number; livres?: number; bloqueados?: number; total?: number };
type Posicao = { pesoTon?: number; itens?: number };
type ForaDeLinha = { posicaoEmLinha?: Posicao; posicaoForaDeLinha?: Posicao } | null;
type Dia = { dia: string; data: string; ton: number; meta: number; iso: string };

/* ── Página ───────────────────────────────────────────────────────── */

function MobilePage() {
  const { autenticado, pronto, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (pronto && !autenticado) navigate({ to: "/login", replace: true });
  }, [pronto, autenticado, navigate]);

  if (!pronto || !autenticado) return <TelaCarregando />;

  return <MobileConteudo onLogout={async () => { await logout(); navigate({ to: "/login", replace: true }); }} />;
}

function MobileConteudo({ onLogout }: { onLogout: () => Promise<void> }) {
  const { dados, loaded } = useDadosSync<Painel>(initialSyncData as Painel);

  const p = dados as unknown as Record<string, unknown>;
  const resumo = (p["resumo"] ?? {}) as Resumo;
  const ocupacaoRaw = p["ocupacao"] as Ocupacao | undefined;
  const ocupacaoDetalhes = (p["ocupacaoDetalhes"] ?? []) as { atributo: string; total: number }[];
  const foraDeLinha = (p["foraDeLinha"] ?? null) as ForaDeLinha;
  const dias = normalizarDiasExibicao((p["dias"] ?? []) as Dia[]);

  const posOcup = ocupacaoDetalhes.find((d) => d.atributo === "POSIÇÕES");
  const ocupacao: Ocupacao = {
    pct: ocupacaoRaw?.pct ?? 0,
    ocupados: ocupacaoRaw?.ocupados ?? 0,
    livres: ocupacaoRaw?.livres ?? 0,
    bloqueados: ocupacaoRaw?.bloqueados ?? 0,
    total: ocupacaoRaw?.total ?? posOcup?.total ?? 0,
  };

  const tonEmLinha = foraDeLinha?.posicaoEmLinha?.pesoTon ?? POSICAO_EM_LINHA.pesoTon;
  const tonForaLinha = foraDeLinha?.posicaoForaDeLinha?.pesoTon ?? POSICAO_FORA_DE_LINHA.pesoTon;
  const itensEmLinha = foraDeLinha?.posicaoEmLinha?.itens ?? POSICAO_EM_LINHA.itens;
  const itensForaLinha = foraDeLinha?.posicaoForaDeLinha?.itens ?? POSICAO_FORA_DE_LINHA.itens;

  const atualizadoEm = (p["sincronizacao"] as { em?: string } | undefined)?.em
    ? new Date((p["sincronizacao"] as { em: string }).em).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      })
    : (p["atualizadoEm"] as string | undefined);

  const tonTotalRecebido = dias.reduce((s, d) => s + d.ton, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1a0b] to-[#0a1306] text-white">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#0a1306]/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-[#7CB342] shadow-[0_0_8px_#7CB342]" />
          <span className="text-xs font-bold tracking-widest text-white/80 uppercase">Lopas CD · Mobile</span>
        </div>
        <button
          onClick={onLogout}
          className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold text-white/60 transition hover:bg-white/10"
        >
          Sair
        </button>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 py-5">
        {!loaded && <TelaCarregandoInline />}

        <section className="grid grid-cols-2 gap-3">
          <Destaque rotulo="Valor em Estoque" valor={fmtMi(resumo.valor ?? 0)} />
          <Destaque rotulo="Peso Total" valor={fmtTonDec(resumo.ton ?? 0)} />
        </section>

        <section className="grid grid-cols-3 gap-2">
          <MiniCard rotulo="Peças" valor={fmtInt(resumo.saldo ?? 0)} />
          <MiniCard rotulo="Itens" valor={fmtInt(resumo.itens ?? 0)} />
          <MiniCard rotulo="Previsto" valor={fmtMi(resumo.previsto ?? 0)} />
        </section>

        <section>
          <TituloSecao>Em Linha × Fora de Linha</TituloSecao>
          <div className="grid grid-cols-2 gap-3">
            <CardLinha rotulo="Em Linha" ton={tonEmLinha} itens={itensEmLinha} cor="#7CB342" />
            <CardLinha rotulo="Fora de Linha" ton={tonForaLinha} itens={itensForaLinha} cor="#FF7043" />
          </div>
        </section>

        <section>
          <TituloSecao>Ocupação do CD</TituloSecao>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3">
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-2xl font-bold tabular-nums text-white">
                  {fmtPct(ocupacao.pct ?? 0)}
                </span>
                <span className="text-xs text-white/50">
                  {fmtInt(ocupacao.ocupados ?? 0)} de {fmtInt(ocupacao.total ?? 0)}
                </span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="bg-gradient-to-r from-[#7CB342] to-[#9CCC65] transition-all duration-500"
                  style={{ width: `${(ocupacao.pct ?? 0) * 100}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <MiniStat rotulo="Ocupados" valor={fmtInt(ocupacao.ocupados ?? 0)} cor="#7CB342" />
              <MiniStat rotulo="Livres" valor={fmtInt(ocupacao.livres ?? 0)} cor="#66BB6A" />
              <MiniStat rotulo="Bloqueados" valor={fmtInt(ocupacao.bloqueados ?? 0)} cor="#FF7043" />
            </div>
          </div>
        </section>

        <section>
          <TituloSecao>Recebimento (toneladas)</TituloSecao>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-lg font-bold text-white">
                {fmtTonDec(tonTotalRecebido)} <span className="text-xs font-normal text-white/40">total no período</span>
              </span>
            </div>
            <div className="flex items-end justify-between gap-1">
              {dias.map((d) => {
                const pctMeta = d.meta > 0 ? Math.min((d.ton / d.meta) * 100, 100) : 0;
                return (
                  <div key={d.iso} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-24 w-full items-end overflow-hidden rounded-t bg-white/5">
                      <div
                        className={`w-full rounded-t transition-all duration-500 ${pctMeta >= 100 ? "bg-[#7CB342]" : "bg-[#FFB74D]"}`}
                        style={{ height: `${pctMeta}%` }}
                      />
                    </div>
                    <span className="text-[8px] font-medium text-white/50">{d.dia}</span>
                    <span className="text-[8px] tabular-nums text-white/40">{d.ton.toFixed(0)}t</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="flex items-center justify-between pt-2 pb-6 text-[10px] text-white/30">
          <span>Atualizado {atualizadoEm ?? "—"}</span>
          <a href="/" className="underline transition hover:text-white/60">Ver painel completo →</a>
        </footer>
      </main>
    </div>
  );
}

/* ── Subcomponentes ───────────────────────────────────────────────── */

function TelaCarregando() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0a1306]">
      <span className="size-3 animate-pulse rounded-full bg-[#7CB342] shadow-[0_0_12px_#7CB342]" />
    </div>
  );
}

function TelaCarregandoInline() {
  return (
    <div className="flex items-center justify-center py-8">
      <span className="size-2.5 animate-pulse rounded-full bg-[#7CB342] shadow-[0_0_8px_#7CB342]" />
    </div>
  );
}

function Destaque({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-[#7CB342]/20 bg-[#7CB342]/5 px-4 py-3.5">
      <span className="text-[10px] font-semibold tracking-wider text-white/50 uppercase">{rotulo}</span>
      <p className="mt-1 font-mono text-xl font-bold tabular-nums text-[#9CCC65] [text-shadow:0_0_10px_rgba(124,179,66,0.3)]">
        {valor}
      </p>
    </div>
  );
}

function MiniCard({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center">
      <p className="text-sm font-bold tabular-nums text-white">{valor}</p>
      <span className="text-[8px] tracking-wide text-white/40 uppercase">{rotulo}</span>
    </div>
  );
}

function TituloSecao({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 text-[11px] font-bold tracking-widest text-white/50 uppercase">{children}</h2>
  );
}

function CardLinha({ rotulo, ton, itens, cor }: { rotulo: string; ton: number; itens: number; cor: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ backgroundColor: cor }} />
        <span className="text-xs font-semibold text-white/70">{rotulo}</span>
      </div>
      <p className="text-lg font-bold tabular-nums text-white">{fmtTonDec(ton)}</p>
      <p className="text-[10px] text-white/40">{fmtInt(itens)} itens</p>
    </div>
  );
}

function MiniStat({ rotulo, valor, cor }: { rotulo: string; valor: string; cor: string }) {
  return (
    <div className="rounded-lg bg-white/5 py-2">
      <p className="text-sm font-bold tabular-nums" style={{ color: cor }}>{valor}</p>
      <span className="text-[8px] tracking-wide text-white/40 uppercase">{rotulo}</span>
    </div>
  );
}
