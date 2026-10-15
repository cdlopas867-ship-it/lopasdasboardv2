import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useDadosSync } from "@/hooks/use-dados-sync";
import { initialSyncData } from "@/lib/initial-sync-data";
import { POSICAO_EM_LINHA, POSICAO_FORA_DE_LINHA } from "@/data/fora-de-linha";
import { fmtTonDec, fmtMi, fmtInt } from "@/lib/format";

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
type Posicao = { reservas?: number };
type ForaDeLinha = {
  posicaoEmLinha?: Posicao;
  posicaoForaDeLinha?: Posicao;
} | null;

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
  const valorPrevisto = resumo.previsto ?? 0;
  const reservasEmLinha = foraDeLinha?.posicaoEmLinha?.reservas ?? POSICAO_EM_LINHA.reservas;
  const reservasForaLinha = foraDeLinha?.posicaoForaDeLinha?.reservas ?? POSICAO_FORA_DE_LINHA.reservas;

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

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-gradient-to-b from-[#0f1a0b] to-[#0a1306] text-white">
      {/* cabeçalho */}
      <header className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-[#00FFCC] shadow-[0_0_8px_#00FFCC]" />
          <span className="text-[10px] font-bold tracking-[0.22em] text-white/80 uppercase">
            Desempenho · CD Lopas
          </span>
        </div>
        {!instalado && instalavel && (
          <button
            type="button"
            onClick={instalar}
            className="rounded-full border border-[#00FFCC]/30 bg-[#00FFCC]/10 px-3 py-1 text-[9px] font-bold tracking-widest text-[#00FFCC] uppercase transition hover:bg-[#00FFCC]/20"
          >
            ⬇ Fixar
          </button>
        )}
      </header>

      <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {/* métricas */}
      <main className="flex flex-1 flex-col gap-3 px-4 py-4">
        <Metrica rotulo="Peso do Estoque" valor={fmtTonDec(pesoTon)} destaque />
        <Metrica rotulo="Valor Previsto" valor={fmtMi(valorPrevisto)} destaque />
        <div className="grid grid-cols-2 gap-3">
          <Metrica rotulo="Reservado em Linha" valor={fmtInt(reservasEmLinha)} compacta />
          <Metrica rotulo="Reservado Fora de Linha" valor={fmtInt(reservasForaLinha)} compacta />
        </div>
      </main>

      {/* rodapé */}
      <footer className="flex items-center justify-between px-4 pb-3 pt-1 text-[9px] text-white/35">
        <span className="tracking-wide">Atualizado {atualizadoEm ?? "—"}</span>
        <span className="tracking-wide">{resumo.itens ?? "—"} itens</span>
      </footer>

      {/* faixa animada */}
      <div className="h-0.5 w-full overflow-hidden bg-white/5">
        <div className="mini-janela-passa h-full w-1/3 bg-gradient-to-r from-transparent via-[#00FFCC] to-transparent" />
      </div>
    </div>
  );
}

/* ── Subcomponentes ────────────────────────────────────────────────── */

function Metrica({
  rotulo,
  valor,
  destaque,
  compacta,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
  compacta?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border border-[#00FFCC]/15 bg-[#0c1408]/60 px-3.5",
        compacta ? "py-2.5" : "py-3",
      ].join(" ")}
    >
      <span className="text-[9px] font-semibold tracking-[0.15em] text-white/45 uppercase">
        {rotulo}
      </span>
      <p
        className={[
          "font-mono font-bold tabular-nums",
          destaque ? "text-2xl text-[#00FFCC] [text-shadow:0_0_12px_rgba(0,255,204,0.3)]" : "text-lg text-white",
        ].join(" ")}
      >
        {valor}
      </p>
    </div>
  );
}

function TelaCarregando() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0a1306]">
      <span className="size-3 animate-pulse rounded-full bg-[#00FFCC] shadow-[0_0_12px_#00FFCC]" />
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
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-b from-[#0f1a0b] to-[#0a1306] px-6">
      <form onSubmit={submit} className="w-full max-w-xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="size-2.5 animate-pulse rounded-full bg-[#00FFCC] shadow-[0_0_8px_#00FFCC]" />
          <span className="text-xs font-bold tracking-[0.22em] text-white/80 uppercase">
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
          className="w-full rounded-lg bg-[#00FFCC] py-2.5 text-sm font-bold text-[#0a1306] transition hover:bg-[#00FFCC]/90"
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
        className="mt-1 w-full rounded-lg border border-white/15 bg-[#0c1408]/80 px-3 py-2 text-sm text-white outline-none transition focus:border-[#00FFCC]/50"
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
