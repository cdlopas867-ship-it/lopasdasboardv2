import { createServerFn } from "@tanstack/react-start";

export const checkAccess = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { isUnlocked } = await import("./gate.server");
    return { unlocked: await isUnlocked() };
  } catch (error) {
    console.error("[auth] falha ao verificar acesso", error);
    return { unlocked: false };
  }
});

export const unlockSite = createServerFn({ method: "POST" })
  .inputValidator((data: { usuario: string; senha: string }) => ({
    usuario: String(data.usuario ?? "").trim().toLowerCase(),
    senha: String(data.senha ?? ""),
  }))
  .handler(async ({ data }) => {
    const expectedUser = process.env["SITE_USERNAME"] ?? "lopas";
    const expectedPassword = process.env["SITE_PASSWORD"] ?? "cd";

    const { getGateSession, safeMatch } = await import("./gate.server");
    const valid = safeMatch(data.usuario, expectedUser.toLowerCase()) && safeMatch(data.senha, expectedPassword);
    if (!valid) return { ok: false as const };

    const session = await getGateSession();
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const lockSite = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const { getGateSession } = await import("./gate.server");
    const session = await getGateSession();
    await session.clear();
    return { ok: true as const };
  } catch (error) {
    console.error("[auth] falha ao limpar sessão", error);
    return { ok: true as const };
  }
});
