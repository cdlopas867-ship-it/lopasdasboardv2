import "./lib/error-capture";
import { consumeLastCapturedError, describeError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

/* O servidor principal precisa ser leve e compatível com o runtime do Lovable.
   Importações do Drive e leitura de arquivos não devem acontecer no carregamento
   do módulo SSR: em runtime edge elas podem derrubar a página inteira antes que
   a rota seja atendida. Essas tarefas continuam disponíveis nas rotas/API e no
   carregamento do cliente. */

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

/* Inicia o ciclo de sincronização do Drive (a cada 5 s) de forma preguiçosa
   na primeira requisição — independente do gate de acesso. O sync de fundo
   busca dados do Drive e atualiza o sync-store; o gate só controla quem pode
   ver os dados, não se eles são sincronizados. */
let autoImportStarted = false;
function ensureAutoImport() {
  if (autoImportStarted) return;
  autoImportStarted = true;
  import("@/lib/drive-auto-import")
    .then(({ iniciarAutoImport }) => iniciarAutoImport())
    .catch((e) => console.error("[server] falha ao iniciar auto-import:", e));
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

function statusFromError(error: unknown): number {
  if (error && typeof error === "object" && "statusCode" in error) {
    const status = Number((error as { statusCode?: unknown }).statusCode);
    if (Number.isInteger(status) && status >= 400 && status <= 599) return status;
  }
  return 500;
}

function errorResponse(error: unknown): Response {
  const detail = consumeLastCapturedError() ?? error;
  console.error("[server] falha ao processar requisição:\n" + describeError(detail));
  return new Response(renderErrorPage(), {
    status: statusFromError(error),
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      ensureAutoImport();
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);

      /* h3 pode devolver um 500 JSON genérico quando uma exceção escapou de
         uma rota. Converte-o para a página de erro e registra a causa real. */
      if (response.status >= 500 && (response.headers.get("content-type") ?? "").includes("application/json")) {
        const body = await response.clone().text();
        try {
          const payload = JSON.parse(body) as { unhandled?: unknown; error?: unknown };
          if (payload.unhandled === true || payload.error === true) {
            return errorResponse(new Error(`Resposta SSR não tratada: ${body}`));
          }
        } catch {
          /* corpo não JSON — devolve a resposta original */
        }
      }
      return response;
    } catch (error) {
      return errorResponse(error);
    }
  },
};
