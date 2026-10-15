import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useDadosSync } from "@/hooks/use-dados-sync";
import { initialSyncData } from "@/lib/initial-sync-data";
import { fmtTonDec, fmtMi, fmtInt } from "@/lib/format";

type Painel = typeof initialSyncData & Record<string, unknown>;
type Resumo = { ton?: number; valor?: number; itens?: number };
type Mensal = { mes: string; recebido: number; carregado: number };

export const Route = createFileRoute("/widget")({
  head: () => ({
    meta: [
      { title: "Estoque · Lopas" },
      { name: "description", content: "Widget de estoque do CD Lopas." },
    ],
    links: [{ rel: "manifest", href: "/manifest-widget.json" }],
  }),
  component: WidgetEstoque,
});

function WidgetEstoque() {
  const { autenticado, pronto, login } = useAuth();

  // Garante que só o manifest-widget.json esteja ativo (cobre navegação client-side)
  useEffect(() => {
    const main = document.querySelector('link[rel="manifest"]:not([href*="manifest-widget"])');
    if (main) main.remove();
  }, []);

  if (!pronto) return null;
  if (!autenticado) return <TelaLogin onLogin={login} />;
  return <Card />;
}

/* ── Card principal — estilo Apple Stocks widget ───────────────────── */

function Card() {
  const { dados } = useDadosSync<Painel>(initialSyncData as Painel);
  const resumo = ((dados as Record<string, unknown>)["resumo"] ?? {}) as Resumo;
  const mensal = ((dados as Record<string, unknown>)["mensal"] ?? []) as Mensal[];

  const ton = resumo.ton ?? 0;
  const valor = resumo.valor ?? 0;
  const itens = resumo.itens ?? 0;

  // Série do gráfico: carregado mensal (toneladas)
  const serie = mensal.map((m) => m.carregado).filter((v) => v > 0);
  const serieLabels = mensal.filter((m) => m.carregado > 0).map((m) => m.mes);

  // Variação do último mês vs anterior
  let variacao: number | null = null;
  if (serie.length >= 2) {
    const ult = serie[serie.length - 1];
    const ant = serie[serie.length - 2];
    variacao = ant > 0 ? ((ult - ant) / ant) * 100 : null;
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-transparent">
      <div
        className="flex w-[320px] flex-col overflow-hidden rounded-[22px] p-5"
        style={{ background: "#1c1c1e" }}
      >
        {/* Cabeçalho — label + variação */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[13px] font-semibold leading-none"
              style={{ color: variacao === null || variacao >= 0 ? "#34c759" : "#ff3b30" }}
            >
              {variacao === null || variacao >= 0 ? "▲" : "▼"}
            </span>
            <span className="text-[13px] font-semibold leading-none text-white">
              Estoque
            </span>
          </div>
          <div className="text-right">
            <p
              className="text-[13px] font-semibold leading-none tabular-nums"
              style={{ color: variacao === null || variacao >= 0 ? "#34c759" : "#ff3b30" }}
            >
              {variacao === null
                ? "—"
                : `${variacao >= 0 ? "+" : ""}${variacao.toFixed(1).replace(".", ",")}%`}
            </p>
          </div>
        </div>

        {/* Gráfico de linha — gradiente verde */}
        <div className="mt-3 h-[90px]">
          <GraficoLinha serie={serie} positiva={variacao === null || variacao >= 0} />
        </div>

        {/* Valor principal — tonelagem em destaque */}
        <p className="mt-2 text-[34px] font-bold leading-none tracking-tight text-white tabular-nums">
          {fmtInt(ton)}
          <span className="text-[20px] font-medium text-white/50"> t</span>
        </p>

        {/* Rodapé — valor e itens */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[12px] font-medium text-white/60 tabular-nums">
            {fmtMi(valor)}
          </span>
          <span className="text-[12px] font-medium text-white/40 tabular-nums">
            {itens ?? "—"} itens
          </span>
        </div>

        {/* Selo de origem */}
        <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-white/25">
          CD Lopas
        </p>
      </div>
    </div>
  );
}

/* ── Gráfico de linha minimalista (SVG) ────────────────────────────── */

function GraficoLinha({ serie, positiva }: { serie: number[]; positiva: boolean }) {
  if (serie.length < 2) {
    return <div className="h-full w-full" />;
  }

  const W = 280;
  const H = 90;
  const pad = 4;
  const cor = positiva ? "#34c759" : "#ff3b30";

  const min = Math.min(...serie);
  const max = Math.max(...serie);
  const range = max - min || 1;

  const pontos = serie.map((v, i) => {
    const x = pad + (i / (serie.length - 1)) * (W - pad * 2);
    const y = pad + (1 - (v - min) / range) * (H - pad * 2);
    return [x, y] as const;
  });

  const path = pontos.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const areaPath = `${path} L${pontos[pontos.length - 1][0]},${H} L${pontos[0][0]},${H} Z`;
  const gradId = positiva ? "gradVerde" : "gradVermelho";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={cor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={path}
        fill="none"
        stroke={cor}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ── Login minimalista ─────────────────────────────────────────────── */

function TelaLogin({ onLogin }: { onLogin: (u: string, s: string) => Promise<boolean> }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await onLogin(usuario, senha))) setErro(true);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-transparent">
      <form
        onSubmit={submit}
        className="flex w-[320px] flex-col gap-3 rounded-[22px] p-5"
        style={{ background: "#1c1c1e" }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-white">Estoque · CD Lopas</span>
        </div>
        <input
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="Usuário"
          className="w-full rounded-xl bg-white/10 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/40"
        />
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
          className="w-full rounded-xl bg-white/10 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/40"
        />
        {erro && <p className="text-[11px] text-red-400">Credenciais inválidas.</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-[#34c759] py-2.5 text-sm font-semibold text-black"
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="w-full text-center text-[11px] text-white/30 hover:text-white/50"
        >
          Voltar ao painel
        </button>
      </form>
    </div>
  );
}
