// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

// h3's HTTPError serializes to {"status":500,"unhandled":true,"message":"HTTPError"} —
// no stack, no cause — so a plain console.error(error) reaches the log pipeline with
// the failure detail stripped. Expand Error-like args into a string that keeps the
// message, stack, and the full cause chain.
const CAUSE_DEPTH_LIMIT = 5;
const DESCRIPTION_LENGTH_LIMIT = 8_000;

export function describeError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < CAUSE_DEPTH_LIMIT && current != null; depth++) {
    if (!(current instanceof Error)) {
      parts.push(typeof current === "string" ? current : safeStringify(current));
      break;
    }
    const label = depth === 0 ? "" : "caused by: ";
    const status = describeStatus(current);
    parts.push(`${label}${current.stack ?? `${current.name}: ${current.message}`}${status}`);
    current = current.cause;
  }
  return parts.join("\n").slice(0, DESCRIPTION_LENGTH_LIMIT);
}

function describeStatus(error: Error): string {
  const { status, statusCode } = error as { status?: unknown; statusCode?: unknown };
  const value = status ?? statusCode;
  return typeof value === "number" ? ` (status ${value})` : "";
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function isErrorLike(value: unknown): value is Error {
  return value instanceof Error;
}

/* O cliente cortar a conexão no meio do pedido (aba fechada, navegação/reload
   cancelando a requisição, proxy fechando o socket) faz o Node abortar o
   request e a exceção "aborted" (ConnResetException, code ECONNRESET) subir pelo
   SSR. Não é falha do app: não deve virar log de erro nem página 500. */
export function isAbortedRequest(error: unknown): boolean {
  const CAUSE_DEPTH = 5;
  let current: unknown = error;

  for (let depth = 0; current != null && depth < CAUSE_DEPTH; depth++) {
    if (typeof current === "string") return current.trim() === "aborted";
    if (typeof current !== "object") return false;

    /* Duck typing em vez de `instanceof Error`: o h3 embala a falha em um
       HTTPError (status 500, stack copiado) antes de ela chegar até nós. */
    const { name, message, code, cause } = current as {
      name?: unknown;
      message?: unknown;
      code?: unknown;
      cause?: unknown;
    };

    /* "aborted" é o message do ConnResetException que o Node cria quando o
       cliente corta a conexão. Um ECONNRESET de serviço externo (Supabase,
       Drive) tem outra mensagem — esse continua sendo registrado como erro. */
    if (message === "aborted" || name === "AbortError") return true;
    if (code === "ABORT_ERR" || code === "ERR_STREAM_PREMATURE_CLOSE") return true;

    current = cause;
  }
  return false;
}

// Wrap console.error so errors logged by any layer — including h3's internal
// unhandled-error logging, which this file cannot hook directly — are both
// recorded for consumeLastCapturedError and expanded before serialization.
const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const expanded: unknown[] = [];
  let aborted = false;

  for (const arg of args) {
    if (!isErrorLike(arg)) {
      expanded.push(arg);
      continue;
    }
    /* Registra antes de decidir imprimir: quem consome (server.ts) precisa
       reconhecer a requisição abortada mesmo que ela não vá para o log. */
    record(arg);
    /* Aborto do cliente não é falha do app — nem o do h3 ("unhandled")
       interessa aqui, então o log fica limpo. */
    if (isAbortedRequest(arg)) {
      aborted = true;
      continue;
    }
    expanded.push(describeError(arg));
  }

  /* Aborto do cliente: descarta também os objetos de contexto que o h3/srvx
     anexam ao log (`{ cause: { req, handler } }`) — não há o que registrar. */
  const toPrint = aborted
    ? expanded.filter((arg) => typeof arg !== "object" || arg === null)
    : expanded;

  if (toPrint.length === 0) return;
  originalConsoleError(...toPrint);
};

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
