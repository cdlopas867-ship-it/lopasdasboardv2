import { createFileRoute } from "@tanstack/react-router";
import { broadcastReload } from "@/lib/sync-store";
import { requireApiAccess } from "@/lib/gate.server";

/* POST — envia um comando de recarga para todos os dispositivos conectados
 * via SSE, forçando-os a recarregar a página. */
export const Route = createFileRoute("/api/sync-reload")({
  server: {
    handlers: {
      POST: async () => {
        const denied = await requireApiAccess();
        if (denied) return denied;
        broadcastReload();
        return Response.json({ ok: true });
      },
    },
  },
});
