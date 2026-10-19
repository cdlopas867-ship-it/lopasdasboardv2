import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";

/* Banner de notificação de atualização — estilo WhatsApp Web.
 *
 * Quando o painel recebe novos dados da planilha do Drive, este banner
 * desliza do topo e fica visível até o usuário dispensar (não some sozinho,
 * como um toast). Mostra o horário em que a atualização chegou.
 *
 * O ícone do sino "pula" continuamente para chamar atenção (notif-salto).
 * O favicon da aba recebe um badge vermelho com número (estilo WhatsApp)
 * e o título ganha "(1)" enquanto a notificação está visível.
 */
const TITULO_BASE = "Painel de Estoque · Lopas 2026";
const FAVICON_ORIGINAL = "/favicon.png";

/* Desenha o favicon original + badge vermelho com número no canto superior
   direito, estilo WhatsApp. Retorna um data URL ou null se não conseguir. */
function gerarFaviconComBadge(numero: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const size = 64;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);

      // favicon original
      ctx.drawImage(img, 0, 0, size, size);

      // badge vermelho (estilo WhatsApp)
      const badgeR = size * 0.28;
      const badgeX = size - badgeR - 2;
      const badgeY = badgeR + 2;

      // círculo vermelho
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = "#FF3B30";
      ctx.fill();
      // borda branca
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      // número
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(badgeR * 1.1)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(numero), badgeX, badgeY + 1);

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = FAVICON_ORIGINAL;
  });
}

/* Troca o href do <link rel="icon"> pelo favicon com badge e guarda o
   href original para restaurar depois. */
function aplicarFaviconBadge(dataUrl: string) {
  const link =
    document.querySelector<HTMLLinkElement>("link[rel='icon']") ??
    document.createElement("link");
  if (!link.rel) {
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.dataset.faviconOriginal = link.dataset.faviconOriginal ?? link.href;
  link.href = dataUrl;
  link.type = "image/png";
}

function restaurarFavicon() {
  const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (link?.dataset.faviconOriginal) {
    link.href = link.dataset.faviconOriginal;
    delete link.dataset.faviconOriginal;
  }
}

export function NotificacaoAtualizacao({
  notificacao,
  onDispensar,
}: {
  notificacao: { visivel: boolean; horario: number } | null;
  onDispensar: () => void;
}) {
  const [mostrar, setMostrar] = useState(false);
  const badgeGerado = useRef(false);

  useEffect(() => {
    if (notificacao?.visivel) {
      // pequeno atraso para a animação de entrada
      const t = requestAnimationFrame(() => setMostrar(true));
      return () => cancelAnimationFrame(t);
    }
    setMostrar(false);
  }, [notificacao]);

  /* Badge vermelho no favicon + "(1)" no título da aba enquanto visível */
  useEffect(() => {
    if (notificacao?.visivel) {
      document.title = `(1) ${TITULO_BASE}`;
      if (!badgeGerado.current) {
        badgeGerado.current = true;
        gerarFaviconComBadge(1).then((url) => {
          if (url && notificacao?.visivel) aplicarFaviconBadge(url);
        });
      }
      return () => {
        document.title = TITULO_BASE;
        restaurarFavicon();
        badgeGerado.current = false;
      };
    }
    document.title = TITULO_BASE;
    restaurarFavicon();
  }, [notificacao]);

  if (!notificacao?.visivel) return null;

  const horarioFormatado = new Date(notificacao.horario).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  return (
    <div
      className="fixed left-1/2 top-3 z-[200] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 transition-all duration-300 ease-out md:left-3 md:translate-x-0"
      style={{
        transform: mostrar
          ? "translateY(0)"
          : "translateY(-150%)",
        opacity: mostrar ? 1 : 0,
        left: "50%",
        translate: "-50% 0",
      }}
    >
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg shadow-emerald-900/10 dark:border-emerald-800 dark:bg-emerald-950">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Bell className="notif-salto h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            Painel atualizado
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            Novos dados recebidos da planilha · {horarioFormatado}
          </p>
        </div>
        <button
          onClick={onDispensar}
          className="shrink-0 rounded-full p-1 text-emerald-600 transition-colors hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900"
          aria-label="Dispensar notificação"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
