import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useDadosSync } from "@/hooks/use-dados-sync";
import { initialSyncData } from "@/lib/initial-sync-data";
import { fmtTonDec, fmtMi } from "@/lib/format";

type Painel = typeof initialSyncData & Record<string, unknown>;

export const Route = createFileRoute("/widget")({
  head: () => ({
    meta: [
      { title: "Desempenho · Lopas" },
      { name: "description", content: "Widget de desempenho do estoque do CD Lopas." },
    ],
    links: [
      { rel: "manifest", href: "/manifest-widget.json" },
    ],
  }),
  component: WidgetDesempenho,
});

/* ── Tipos do payload ─────────────────────────────────────────────── */

type Resumo = { ton?: number; valor?: number; previsto?: number; saldo?: number; itens?: number };

/* ── Paleta ──────────────────────────────────────────────────────── */

const C = {
  accent: "#609af8",
  tileBlue: "#6a9dfa",
  text: "#ffffff",
  textDim: "#ffffff99",
  textFaint: "#ffffff66",
};

/* Tamanho compacto da janela PWA (flyout) */
const WIDGET_W = 340;
const WIDGET_H = 240;

/* ── Widget ───────────────────────────────────────────────────────── */

function WidgetDesempenho() {
  const { autenticado, pronto, login } = useAuth();

  // Fundo transparente para o efeito de vidro (backdrop blur) no desktop
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = "transparent";
    return () => { document.body.style.background = prev; };
  }, []);

  if (!pronto) return <TelaCarregando />;
  if (!autenticado) return <TelaLogin onLogin={login} />;

  return <WidgetConteudo />;
}

function WidgetConteudo() {
  const { dados } = useDadosSync<Painel>(initialSyncData as Painel);
  const [instalavel, setInstalavel] = useState<BeforeInstallPromptEvent | null>(null);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    const emPWA = window.matchMedia("(display-mode: standalone)").matches;
    if (emPWA) {
      setInstalado(true);
      window.resizeTo(WIDGET_W, WIDGET_H);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstalavel(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalado(true);
      setInstalavel(null);
      window.resizeTo(WIDGET_W, WIDGET_H);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const p = dados as unknown as Record<string, unknown>;
  const resumo = (p["resumo"] ?? {}) as Resumo;

  const pesoTon = resumo.ton ?? 0;
  const valorMi = resumo.valor ?? 0;
  const itens = resumo.itens ?? "—";

  const instalar = async () => {
    if (!instalavel) return;
    await instalavel.prompt();
    await instalavel.userChoice;
    setInstalavel(null);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-transparent p-3">
      <div
        className="flex w-full max-w-[320px] flex-col gap-3 rounded-2xl p-4 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.6)]"
        style={{
          background: "rgba(28, 28, 28, 0.8)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        {/* cabeçalho */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 animate-pulse rounded-full"
              style={{ background: C.accent, boxShadow: `0 0 8px ${C.accent}` }}
            />
            <span className="text-xs font-semibold tracking-wide text-white/90">
              Desempenho
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!instalado && instalavel && (
              <button
                type="button"
                onClick={instalar}
                className="rounded-lg px-2 py-0.5 text-[10px] font-semibold text-white/80 transition hover:bg-white/10"
                style={{ border: `1px solid ${C.accent}55`, background: `${C.accent}1a` }}
              >
                ⬇ Fixar
              </button>
            )}
            <button
              type="button"
              onClick={() => window.close()}
              className="text-white/50 transition hover:text-white/90"
              aria-label="Fechar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {/* dois cards — PESO e VALOR */}
        <div className="grid grid-cols-2 gap-2.5">
          <div
            className="flex flex-col gap-1 rounded-xl px-3 py-2.5"
            style={{ background: C.tileBlue }}
          >
            <span className="text-[9px] font-semibold tracking-[0.14em] uppercase text-white/80">
              Peso
            </span>
            <span className="font-mono text-lg font-bold tabular-nums text-white">
              {fmtTonDec(pesoTon)}
            </span>
          </div>
          <div
            className="flex flex-col gap-1 rounded-xl px-3 py-2.5"
            style={{ background: C.tileBlue }}
          >
            <span className="text-[9px] font-semibold tracking-[0.14em] uppercase text-white/80">
              Valor
            </span>
            <span className="whitespace-nowrap font-mono text-base font-bold tabular-nums text-white">
              {fmtMi(valorMi)}
            </span>
          </div>
        </div>

        {/* rodapé */}
        <footer className="flex items-center justify-between px-0.5 text-[10px]">
          <span className="text-white/50">{itens} itens</span>
          <a
            href="/"
            className="text-white/60 underline transition hover:text-white/90"
          >
            Abrir widget ↗
          </a>
        </footer>
      </div>
    </div>
  );
}

/* ── Telas auxiliares ─────────────────────────────────────────────── */

function TelaCarregando() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-transparent">
      <span
        className="size-3 animate-pulse rounded-full"
        style={{ background: C.accent, boxShadow: `0 0 12px ${C.accent}` }}
      />
    </div>
  );
}

function TelaLogin({ onLogin }: { onLogin: (u: string, s: string) => Promise<boolean> }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onLogin(usuario, senha);
    if (!ok) setErro(true);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-transparent px-6">
      <form
        onSubmit={submit}
        className="flex w-full max-w-xs flex-col gap-4 rounded-2xl p-6 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.6)]"
        style={{
          background: "rgba(28, 28, 28, 0.8)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 animate-pulse rounded-full"
            style={{ background: C.accent, boxShadow: `0 0 8px ${C.accent}` }}
          />
          <span className="text-xs font-semibold tracking-wide text-white/90">
            Desempenho · CD Lopas
          </span>
        </div>
        <Campo label="Usuário" value={usuario} onChange={setUsuario} />
        <Campo label="Senha" type="password" value={senha} onChange={setSenha} />
        {erro && (
          <p className="text-[11px] text-red-400">Credenciais inválidas. Tente novamente.</p>
        )}
        <button
          type="submit"
          className="w-full rounded-lg py-2.5 text-sm font-bold text-white transition"
          style={{ background: C.accent }}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="w-full text-center text-[11px] text-white/40 underline hover:text-white/60"
        >
          Voltar ao painel
        </button>
      </form>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-white outline-none transition focus:border-[#609af8]/60"
        style={{ background: "rgba(48, 48, 48, 0.8)" }}
      />
    </label>
  );
}

/* ── Tipos auxiliares ──────────────────────────────────────────────── */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type _WidgetReactNode = ReactNode;
