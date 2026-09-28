import { createFileRoute } from "@tanstack/react-router";
import { importarSeMudou } from "@/lib/drive-auto-import";
import { requireApiAccess } from "@/lib/gate.server";

/* Endpoint para disparar a importação do Drive manualmente.
   O servidor também importa automaticamente a cada 5 minutos. */
export const Route = createFileRoute("/api/auto-import")({
  server: {
    handlers: {
      POST: async () => {
        const denied = await requireApiAccess();
        if (denied) return denied;
        const ok = await importarSeMudou(true);
        return Response.json({ ok });
      },
    },
  },
});
