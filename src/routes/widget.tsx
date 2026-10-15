import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useDadosSync } from "@/hooks/use-dados-sync";
import { initialSyncData } from "@/lib/initial-sync-data";
import { fmtTonDec } from "@/lib/format";

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

  // Registra o service worker — sem ele o navegador não oferece instalar o widget
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Ao abrir como PWA instalada, força a janela no tamanho do widget (só o card)
  useEffect(() => {
    const W = 360;
    const H = 440;
    if (window.matchMedia("(display-mode: standalone)").matches) {
      window.resizeTo(W, H);
    }
  }, []);

  if (!pronto) return null;
  if (!autenticado) return <TelaLogin onLogin={login} />;
  return (
    <>
      <Card />
      <BotaoInstalar />
    </>
  );
}

/* ── Card principal — estilo System Monitor ────────────────────────── */

type Reservado = { pesoReservado?: number };

function Card() {
  const { dados } = useDadosSync<Painel>(initialSyncData as Painel);
  const resumo = ((dados as Record<string, unknown>)["resumo"] ?? {}) as Resumo;
  const mensal = ((dados as Record<string, unknown>)["mensal"] ?? []) as Mensal[];
  const reservados = ((dados as Record<string, unknown>)["reservados"] ?? []) as Reservado[];

  const tonEstoque = resumo.ton ?? 0;
  const tonReservado = reservados.reduce((s, r) => s + (r.pesoReservado ?? 0), 0) / 1000;
  const tonLinha = Math.max(0, tonEstoque - tonReservado);
  const pctReservado = tonEstoque > 0 ? (tonReservado / tonEstoque) * 100 : 0;

  // Série do gráfico: carregado mensal (toneladas)
  const serie = mensal.map((m) => m.carregado).filter((v) => v > 0);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-transparent">
      <div
        className="flex w-[320px] flex-col gap-4 rounded-[20px] p-5"
        style={{ background: "linear-gradient(160deg, #3a2e4c 0%, #212132 100%)" }}
      >
        {/* ── Seção 1: Peso de Estoque (com gráfico) ── */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconeCaixa />
              <span className="text-[13px] font-semibold text-white">
                Estoque: {fmtTonDec(tonEstoque)}
              </span>
            </div>
            <span className="text-[13px] font-semibold tabular-nums" style={{ color: "#00d4ff" }}>
              {resumo.itens ?? 0} un
            </span>
          </div>
          <div className="mt-2 flex h-[44px] items-center rounded-lg bg-black/25 px-2">
            <GraficoLinha serie={serie} />
          </div>
        </div>

        {/* Divisor */}
        <div className="h-px bg-white/10" />

        {/* ── Seção 2: Peso Reservado + Peso em Linha ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span style={{ color: "#00d4ff" }}>▼</span>
              <span className="text-[13px] font-medium text-white/80">Reservado</span>
            </div>
            <span className="text-[13px] font-semibold tabular-nums text-white">
              {fmtTonDec(tonReservado)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span style={{ color: "#ff9e80" }}>▲</span>
              <span className="text-[13px] font-medium text-white/80">Em Linha</span>
            </div>
            <span className="text-[13px] font-semibold tabular-nums text-white">
              {fmtTonDec(tonLinha)}
            </span>
          </div>
        </div>

        {/* Divisor */}
        <div className="h-px bg-white/10" />

        {/* ── Seção 3: Barra de progresso — % reservado ── */}
        <div>
          <div className="flex items-center gap-2">
            <IconeGrafico />
            <span className="text-[13px] font-medium text-white/80">
              Reservado: {pctReservado.toFixed(0).replace(".", ",")}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#4e4e5e]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pctReservado}%`, background: "#00d4ff" }}
            />
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center text-[10px] font-medium uppercase tracking-wider text-white/25">
          CD Lopas
        </p>
      </div>
    </div>
  );
}

/* ── Ícones SVG minimalistas ────────────────────────────────────────── */

function IconeCaixa() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconeGrafico() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

/* ── Gráfico de linha minimalista (SVG) — ciano ────────────────────── */

function GraficoLinha({ serie }: { serie: number[] }) {
  if (serie.length < 2) {
    return <div className="h-full w-full" />;
  }

  const W = 280;
  const H = 36;
  const pad = 2;
  const cor = "#00d4ff";

  const min = Math.min(...serie);
  const max = Math.max(...serie);
  const range = max - min || 1;

  const pontos = serie.map((v, i) => {
    const x = pad + (i / (serie.length - 1)) * (W - pad * 2);
    const y = pad + (1 - (v - min) / range) * (H - pad * 2);
    return [x, y] as const;
  });

  const path = pontos.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full">
      <path
        d={path}
        fill="none"
        stroke={cor}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ── Botão de instalação da PWA do widget ───────────────────────────── */

function BotaoInstalar() {
  const [deferred, setDeferred] = useState<{ prompt: () => Promise<void> } | null>(null);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    // Já está como PWA instalada — não mostra o botão
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalado(true);
      return;
    }
    const onBefore = (e: Event) => {
      e.preventDefault();
      setDeferred(e as { prompt: () => Promise<void> });
    };
    window.addEventListener("beforeinstallprompt", onBefore);
    return () => window.removeEventListener("beforeinstallprompt", onBefore);
  }, []);

  if (instalado || !deferred) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        await deferred.prompt();
        setDeferred(null);
        setInstalado(true);
      }}
      className="fixed bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/20 px-4 py-1.5 text-[11px] font-semibold text-white/70 shadow-lg"
      style={{ background: "linear-gradient(160deg, #3a2e4c 0%, #212132 100%)" }}
    >
      ⬇ Instalar widget
    </button>
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
        className="flex w-[320px] flex-col gap-3 rounded-[20px] p-5"
        style={{ background: "linear-gradient(160deg, #3a2e4c 0%, #212132 100%)" }}
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
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-white"
          style={{ background: "#00d4ff", color: "#1a1a2e" }}
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
