import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useDadosSync } from "@/hooks/use-dados-sync";
import { initialSyncData } from "@/lib/initial-sync-data";
import { fmtTonDec, fmtMi } from "@/lib/format";

type Painel = typeof initialSyncData & Record<string, unknown>;
type Resumo = { ton?: number; valor?: number; itens?: number };

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

/* Remove o manifest principal da raiz para o PWA instalar com start_url /widget */
function useManifestWidget() {
  useEffect(() => {
    document.querySelectorAll('link[rel="manifest"]').forEach((link) => {
      if ((link.getAttribute("href") || "").includes("manifest-widget")) return;
      link.setAttribute("data-widget-hidden", "true");
      link.remove();
    });
    return () => {
      document.querySelectorAll('link[data-widget-hidden="true"]').forEach((link) => {
        link.removeAttribute("data-widget-hidden");
        document.head.appendChild(link);
      });
    };
  }, []);
}

function WidgetEstoque() {
  const { autenticado, pronto, login } = useAuth();
  useManifestWidget();

  if (!pronto) return null;
  if (!autenticado) return <TelaLogin onLogin={login} />;
  return <Card />;
}

/* ── Card principal — estilo Spotify widget ────────────────────────── */

function Card() {
  const { dados } = useDadosSync<Painel>(initialSyncData as Painel);
  const resumo = ((dados as Record<string, unknown>)["resumo"] ?? {}) as Resumo;

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#121212]">
      <div className="w-[300px] rounded-2xl bg-[#1e1e1e] p-5 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#1db954]" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">
            Estoque · CD Lopas
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Peso
            </p>
            <p className="font-mono text-2xl font-bold tabular-nums text-white">
              {fmtTonDec(resumo.ton ?? 0)}
            </p>
          </div>

          <div className="h-px bg-white/10" />

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Valor
            </p>
            <p className="font-mono text-2xl font-bold tabular-nums text-white">
              {fmtMi(resumo.valor ?? 0)}
            </p>
          </div>
        </div>

        <p className="mt-4 text-[10px] text-white/30">
          {resumo.itens ?? "—"} itens
        </p>
      </div>
    </div>
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
    <div className="flex h-screen w-screen items-center justify-center bg-[#121212]">
      <form onSubmit={submit} className="w-[300px] rounded-2xl bg-[#1e1e1e] p-5 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#1db954]" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">
            Estoque · CD Lopas
          </span>
        </div>
        <input
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="Usuário"
          className="mb-3 w-full rounded-lg bg-[#2a2a2a] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
        />
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
          className="mb-3 w-full rounded-lg bg-[#2a2a2a] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
        />
        {erro && <p className="mb-3 text-[11px] text-red-400">Credenciais inválidas.</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-[#1db954] py-2.5 text-sm font-bold text-black"
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mt-3 w-full text-center text-[11px] text-white/30 hover:text-white/50"
        >
          Voltar ao painel
        </button>
      </form>
    </div>
  );
}
