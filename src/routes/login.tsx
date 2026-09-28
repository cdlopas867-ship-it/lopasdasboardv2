import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import LoginBgCarousel from "@/components/LoginBgCarousel";
import PWAInstallButton from "@/components/PWAInstallButton";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Acesso · Controle de Estoque CD Lopas" },
      { name: "description", content: "Acesso ao painel de controle de estoque do Centro de Distribuição Lopas." },
      { property: "og:title", content: "Acesso · Controle de Estoque CD Lopas" },
      { property: "og:description", content: "Acesso reservado ao painel de controle de estoque do Centro de Distribuição Lopas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, pronto, autenticado } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [saindo, setSaindo] = useState(false);
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    if (pronto && autenticado && !saindo) {
      navigate({ to: "/", replace: true });
    }
  }, [pronto, autenticado, saindo, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (entrando || !usuario.trim() || !senha) return;

    setEntrando(true);
    try {
      if (await login(usuario, senha)) {
        setSaindo(true);
        navigate({ to: "/", replace: true });
      } else {
        toast.error("Login ou senha incorretos.");
      }
    } finally {
      setEntrando(false);
    }
  }

  return (
    <div
      className={`relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-8 ${saindo ? "login-sair-pagina" : ""}`}
    >
      <LoginBgCarousel />
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-sm">
        <div className="login-surgir-marca mb-6 text-center">
          <p className="login-marca-loop font-serif text-2xl tracking-tight text-white sm:text-3xl">
            Controle de Estoque CD Lopas
          </p>
          <p className="login-marca-loop-2 mt-1.5 text-[11px] font-semibold tracking-[0.3em] text-primary uppercase sm:text-xs">
            Movidos pela fé
          </p>
        </div>
        <form
          onSubmit={onSubmit}
          className={`space-y-5 rounded-2xl border border-white/20 bg-white/15 p-5 backdrop-blur-md sm:p-8 ${saindo ? "login-mergulhar" : "login-surgir"}`}
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-widest text-white/70 uppercase">
              Login
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoFocus
              autoComplete="username"
              disabled={entrando}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3.5 text-base text-white placeholder-white/40 outline-none transition-colors focus:border-white/50 disabled:opacity-60"
              placeholder="Digite seu login"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-widest text-white/70 uppercase">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              disabled={entrando}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3.5 text-base text-white placeholder-white/40 outline-none transition-colors focus:border-white/50 disabled:opacity-60"
              placeholder="Digite sua senha"
            />
          </div>
          <button
            type="submit"
            disabled={entrando || !usuario.trim() || !senha}
            className="w-full rounded-lg bg-white px-4 py-3.5 text-sm font-bold tracking-wider text-[#85A93D] uppercase transition-colors hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {entrando ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <div className="mt-5 flex justify-center">
          <PWAInstallButton />
        </div>
      </div>
    </div>
  );
}
