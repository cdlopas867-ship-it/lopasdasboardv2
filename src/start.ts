import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { describeError, isAbortedRequest } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

/* Converte qualquer exceção do SSR em uma resposta HTTP válida.
   Não relançamos objetos com statusCode: o h3/TanStack os transforma em
   { unhandled: true, status: 500 }, escondendo a causa real e gerando a tela
   genérica de erro no Lovable. */
const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    /* Requisição cancelada pelo cliente (aborted/ECONNRESET): não é falha do app. */
    if (isAbortedRequest(error)) return new Response(null, { status: 499 });

    console.error("[ssr] erro não tratado:\n" + describeError(error));

    const status =
      error != null && typeof error === "object" && "statusCode" in error
        ? Number((error as { statusCode?: unknown }).statusCode)
        : 500;
    const safeStatus = Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;

    return new Response(renderErrorPage(), {
      status: safeStatus,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }
});

/* Mantém a proteção CSRF das server functions. */
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));

