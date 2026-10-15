import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useDadosSync } from "@/hooks/use-dados-sync";
import { initialSyncData } from "@/lib/initial-sync-data";
import { POSICAO_EM_LINHA, POSICAO_FORA_DE_LINHA, POSICAO_TOTAL } from "@/data/fora-de-linha";
import { fmtTonDec } from "@/lib/format";

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
type Posicao = { reservas?: number; pesoReservadoTon?: number };
type ForaDeLinha = {
  posicaoEmLinha?: Posicao;
  posicaoForaDeLinha?: Posicao;
  posicaoTotal?: Posicao;
} | null;

/* ── Paleta Windows 11 Quick Settings ─────────────────────────────── */

const C = {
  panel: "#1c1c1c",
  panelEdge: "#ffffff20",
  tileActive: "#609af8",
  tileInactive: "#303030",
  text: "#ffffff",
  textDim: "#ffffff99",
  textFaint: "#ffffff66",
  track: "#4d4d4d",
  trackFill: "#609af8",
  accent: "#609af8",
};

/* ── Widget ───────────────────────────────────────────────────────── */

function WidgetDesempenho() {
  const { autenticado, pronto, login } = useAuth();

  if (!pronto) return <TelaCarregando />;
  if (!autenticado) return <TelaLogin onLogin={login} />;

  return <WidgetConteudo />;
}

function WidgetConteudo() {
  const { dados } = useDadosSync<Painel>(initialSyncData as Painel);
  const [instalavel, setInstalavel] = useState<BeforeInstallPromptEvent | null>(null);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalado(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstalavel(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalado(true);
      setInstalavel(null);
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
  const foraDeLinha = (p["foraDeLinha"] ?? null) as ForaDeLinha;

  const pesoTon = resumo.ton ?? 0;
  const pesoReservadoEmLinha = foraDeLinha?.posicaoEmLinha?.pesoReservadoTon ?? POSICAO_EM_LINHA.pesoReservadoTon;
  const pesoReservadoForaLinha = foraDeLinha?.posicaoForaDeLinha?.pesoReservadoTon ?? POSICAO_FORA_DE_LINHA.pesoReservadoTon;
  const pesoReservadoTotal = foraDeLinha?.posicaoTotal?.pesoReservadoTon ?? POSICAO_TOTAL.pesoReservadoTon;
  const pesoDisponivel = pesoTon - pesoReservadoTotal;

  const atualizadoEm = (p["sincronizacao"] as { em?: string } | undefined)?.em
    ? new Date((p["sincronizacao"] as { em: string }).em).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      })
    : (p["atualizadoEm"] as string | undefined);

  const instalar = async () => {
    if (!instalavel) return;
    await instalavel.prompt();
    await instalavel.userChoice;
    setInstalavel(null);
  };

  // proporção disponível/total para o slider visual
  const pctDisponivel = pesoTon > 0 ? Math.round((pesoDisponivel / pesoTon) * 100) : 0;

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0a0a0a] p-4">
      <div
        className="flex w-full max-w-sm flex-col gap-3 rounded-2xl p-4 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.9)]"
        style={{ background: C.panel, border: `1px solid ${C.panelEdge}` }}
      >
        {/* cabeçalho */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 animate-pulse rounded-full"
              style={{ background: C.accent, boxShadow: `0 0 8px ${C.accent}` }}
            />
            <span className="text-xs font-semibold tracking-wide text-white/90">
              Desempenho · CD Lopas
            </span>
          </div>
          {!instalado && instalavel && (
            <button
              type="button"
              onClick={instalar}
              className="rounded-lg px-2.5 py-1 text-[10px] font-semibold text-white/80 transition hover:bg-white/10"
              style={{ border: `1px solid ${C.accent}55`, background: `${C.accent}1a` }}
            >
              ⬇ Fixar
            </button>
          )}
        </header>

        {/* grid de tiles — estilo Quick Settings */}
        <div className="grid grid-cols-2 gap-2.5">
          <Tile rotulo="Peso do Estoque" valor={fmtTonDec(pesoTon)} ativo />
          <Tile rotulo="Peso Disponível" valor={fmtTonDec(pesoDisponivel)} ativo />
          <Tile rotulo="Reserv. em Linha" valor={fmtTonDec(pesoReservadoEmLinha)} />
          <Tile rotulo="Reserv. Fora de Linha" valor={fmtTonDec(pesoReservadoForaLinha)} />
        </div>

        {/* slider visual — proporção disponível */}
        <div className="flex items-center gap-3 px-1 pt-1">
          {/* ícone sol */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
          <div className="relative h-1.5 flex-1 rounded-full" style={{ background: C.track }}>
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all"
              style={{ width: `${pctDisponivel}%`, background: C.trackFill }}
            />
            <div
              className="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full border-2 shadow-md transition-all"
              style={{ left: `calc(${pctDisponivel}% - 7px)`, background: "#fff", borderColor: C.trackFill }}
            />
          </div>
          <span className="w-9 text-right text-[11px] font-medium tabular-nums text-white/70">
            {pctDisponivel}%
          </span>
        </div>

        {/* rodapé */}
        <footer className="flex items-center justify-between px-1 pt-0.5 text-[10px] text-white/50">
          <div className="flex items-center gap-1.5">
            {/* ícone bateria */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
              <rect x="2" y="7" width="18" height="10" rx="2" />
              <path d="M22 11v2" />
              <path d="M6 10v4M10 10v4" fill={C.text} stroke="none" />
            </svg>
            <span>{resumo.itens ?? "—"} itens</span>
          </div>
          <span className="tracking-wide">Atualizado {atualizadoEm ?? "—"}</span>
        </footer>
      </div>
    </div>
  );
}

/* ── Subcomponentes ────────────────────────────────────────────────── */

function Tile({
  rotulo,
  valor,
  ativo,
}: {
  rotulo: string;
  valor: string;
  ativo?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-xl px-3 py-2.5 transition"
      style={{
        background: ativo ? C.tileActive : C.tileInactive,
      }}
    >
      <span
        className="text-[9px] font-semibold tracking-[0.12em] uppercase"
        style={{ color: ativo ? "#ffffffcc" : C.textFaint }}
      >
        {rotulo}
      </span>
      <span
        className="font-mono text-base font-bold tabular-nums"
        style={{ color: "#fff" }}
      >
        {valor}
      </span>
    </div>
  );
}

function TelaCarregando() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0a]">
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
    <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0a] px-6">
      <form
        onSubmit={submit}
        className="flex w-full max-w-xs flex-col gap-4 rounded-2xl p-6 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.9)]"
        style={{ background: C.panel, border: `1px solid ${C.panelEdge}` }}
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
        style={{ background: C.tileInactive }}
      />
    </label>
  );
}

/* ── Tipos auxiliares ──────────────────────────────────────────────── */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/* Evita aviso de variável não usada — `ReactNode` é re-exportado para
   futuras expansões do widget sem precisar re-importar. */
export type _WidgetReactNode = ReactNode;
