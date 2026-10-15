import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Dica = "ios" | "android" | "desktop";

/* Instruções por aparelho — usadas quando o navegador não oferece o prompt de
   instalação (o iOS nunca oferece; no desktop o prompt só aparece se o app for
   instalável e o clique vier de uma aba do navegador). */
const DICAS: Record<Dica, { titulo: string; passos: string[] }> = {
  ios: {
    titulo: "Baixar app no iPhone",
    passos: ['Toque no botão "Compartilhar" e depois em "Adicionar à Tela de Início".'],
  },
  android: {
    titulo: "Baixar app no Android",
    passos: [
      'Abra o menu do navegador (⋮) e toque em "Adicionar à tela inicial" ou "Instalar app".',
    ],
  },
  desktop: {
    titulo: "Baixar app no computador",
    passos: [
      'Clique no ícone de instalação na barra de endereços ou abra o menu do navegador (⋮) e escolha "Instalar app".',
      'No Safari do Mac: menu "Arquivo" → "Adicionar ao Dock".',
      "Se o ícone não aparecer, abra o app em uma aba do navegador (fora da pré-visualização) e tente novamente.",
    ],
  },
};

/**
 * Botão de instalação PWA — instala direto quando o navegador dispara
 * `beforeinstallprompt` (Chrome/Edge) e, quando não há prompt disponível,
 * mostra o caminho até o botão de instalar do navegador.
 */
export default function PWAInstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dica, setDica] = useState<Dica | null>(null);

  useEffect(() => {
    // Registra o service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Já está instalado?
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setDica(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      return;
    }

    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setDica("ios");
    else if (/android/.test(ua)) setDica("android");
    else setDica("desktop");
  };

  const instrucao = dica ? DICAS[dica] : null;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Baixar app"
        className={cn(
          "cursor-pointer rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-sm transition-colors hover:bg-white/20",
        )}
      >
        ⬇ Baixar
      </button>

      {instrucao && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-6"
          onClick={() => setDica(null)}
        >
          <div
            className="max-w-sm rounded-2xl border border-white/15 bg-brand-dark p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-serif text-lg text-white">{instrucao.titulo}</p>
            <div className="mt-3 space-y-2 text-sm text-white/70">
              {instrucao.passos.map((passo) => (
                <p key={passo}>{passo}</p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setDica(null)}
              className="mt-5 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
