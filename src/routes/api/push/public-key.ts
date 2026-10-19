import { createFileRoute } from "@tanstack/react-router";
import { getVapidPublicKey } from "@/lib/push-store";
import { requireApiAccess } from "@/lib/gate.server";

/* GET — devolve a chave pública VAPID para o cliente assinar push. */
export const Route = createFileRoute("/api/push/public-key")({
  server: {
    handlers: {
      GET: async () => {
        const denied = await requireApiAccess();
        if (denied) return denied;

        const key = getVapidPublicKey();
        if (!key) return Response.json({ error: "VAPID não configurado" }, { status: 503 });
        return Response.json({ publicKey: key });
      },
    },
  },
});
