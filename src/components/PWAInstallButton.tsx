import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Botão de instalação PWA — aparece quando o navegador dispara
 * `beforeinstallprompt` (Android/Chrome) ou mostra instruções
 * para iOS (adicionar à tela de início).
 */
export default function PWAInstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [showDesktopHint, setShowDesktopHint] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Registra o service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Detecta iOS (não dispara beforeinstallprompt)
    setIsIos(/iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()));

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
    } else if (isIos) {
      setShowIosHint(true);
    } else {
      setShowDesktopHint(true);
    }
  };

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

      {showIosHint && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-6"
          onClick={() => setShowIosHint(false)}
        >
          <div
            className="max-w-sm rounded-2xl border border-white/15 bg-brand-dark p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-serif text-lg text-white">Baixar app no iPhone</p>
            <p className="mt-3 text-sm text-white/70">
              Toque no botão{" "}
              <span className="inline-block rounded border border-white/30 px-1.5 py-0.5 text-white">
                Compartilhar
              </span>{" "}
              e depois em{" "}
              <span className="inline-block rounded border border-white/30 px-1.5 py-0.5 text-white">
                Adicionar à Tela de Início
              </span>
              .
            </p>
            <button
              type="button"
              onClick={() => setShowIosHint(false)}
              className="mt-5 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {showDesktopHint && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-6"
          onClick={() => setShowDesktopHint(false)}
        >
          <div
            className="max-w-sm rounded-2xl border border-white/15 bg-brand-dark p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-serif text-lg text-white">Instalar o app</p>
            <p className="mt-3 text-sm text-white/70">
              Abra o menu do navegador (ícone{" "}
              <span className="inline-block rounded border border-white/30 px-1.5 py-0.5 text-white">
                ⋮
              </span>{" "}
              ou{" "}
              <span className="inline-block rounded border border-white/30 px-1.5 py-0.5 text-white">
                ⊕
              </span>
              ) e escolha{" "}
              <span className="inline-block rounded border border-white/30 px-1.5 py-0.5 text-white">
                Instalar app
              </span>{" "}
              ou{" "}
              <span className="inline-block rounded border border-white/30 px-1.5 py-0.5 text-white">
                Adicionar à tela inicial
              </span>
              .
            </p>
            <button
              type="button"
              onClick={() => setShowDesktopHint(false)}
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
