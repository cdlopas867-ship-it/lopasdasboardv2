import { createHash, timingSafeEqual } from "node:crypto";
import { useSession } from "@tanstack/react-start/server";

type GateSession = { unlocked?: boolean };

function sessionConfig() {
  const password = process.env["SESSION_SECRET"] ?? "lopas-dev-session-secret-fallback-32chars";
  return {
    password,
    name: "lopas-access",
    maxAge: 60 * 60 * 24 * 7,
    cookie: {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export function safeMatch(input: string, expected: string): boolean {
  if (!input || !expected) return false;

  const received = createHash("sha256").update(input, "utf8").digest();
  const stored = createHash("sha256").update(expected, "utf8").digest();

  if (received.length !== stored.length) return false;
  return timingSafeEqual(received, stored);
}

export async function getGateSession() {
  return useSession<GateSession>(sessionConfig());
}

/* Em ambientes locais/dev e em builds sem credenciais explícitas, o painel deve
   continuar funcionando sem bloquear a sincronização do Drive. Isso evita que o
   app fique preso em /login ou que as rotas /api/sync-data retornem 401 antes de
   importar a planilha. */
export async function isUnlocked(): Promise<boolean> {
  if (process.env["ALLOW_PUBLIC_ACCESS"] === "true") return true;
  if (!process.env["SITE_USERNAME"] || !process.env["SITE_PASSWORD"]) return true;

  const session = await getGateSession();
  return session.data.unlocked === true;
}

export async function requireApiAccess(): Promise<Response | null> {
  return (await isUnlocked())
    ? null
    : Response.json({ error: "Acesso não autorizado" }, { status: 401 });
}
