import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISPENSADO_KEY = "lopas-instalar-dispensado";

/* Convite de instalação exibido assim que o link é aberto.
 * Navegadores só instalam um PWA com um toque do usuário, então o banner
 * deixa o "Baixar app" a um toque: no Android/Chrome/Edge dispara o diálogo
 * nativo (beforeinstallprompt); no iPhone mostra o passo "Adicionar à Tela
 * de Início". Não aparece se o app já está instalado ou foi dispensado. */
export default function InstalarAppAutomatico() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    try {
      if (localStorage.getItem(DISPENSADO_KEY)) return;
    } catch {
      /* sem localStorage — mostra mesmo assim */
    }

    const iphone = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(iphone);
    if (iphone) setVisivel(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvento(e as BeforeInstallPromptEvent);
      setVisivel(true);
    };
    const onInstalado = () => setVisivel(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalado);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalado);
    };
  }, []);

  if (!visivel) return null;

  const dispensar = () => {
    try {
      localStorage.setItem(DISPENSADO_KEY, "1");
    } catch {
      /* ignora */
    }
    setVisivel(false);
  };

  const instalar = async () => {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice;
    setEvento(null);
    setVisivel(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Baixar o app"
      className="fixed inset-x-3 bottom-3 z-[10000] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/20 bg-black/85 p-3 text-white shadow-2xl backdrop-blur"
    >
      <img src="/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Baixe o app Lopas CD</p>
        <p className="text-[11px] leading-snug text-white/70">
          {ios
            ? "Toque em Compartilhar e depois em “Adicionar à Tela de Início”."
            : "Acesso direto da tela inicial, em tela cheia."}
        </p>
      </div>
      {!ios && (
        <button
          type="button"
          onClick={instalar}
          className="shrink-0 rounded-full bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-black"
        >
          Baixar
        </button>
      )}
      <button
        type="button"
        onClick={dispensar}
        aria-label="Dispensar"
        className="shrink-0 px-1 text-lg leading-none text-white/60 hover:text-white"
      >
        ×
      </button>
    </div>
  );
}
