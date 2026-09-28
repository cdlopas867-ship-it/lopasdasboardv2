import { createFileRoute } from "@tanstack/react-router";
import { getHistorico } from "@/lib/historico-store";
import { requireApiAccess } from "@/lib/gate.server";

/* Retorna o histórico de estoque (valor, peso, peças e itens por importação). */
export const Route = createFileRoute("/api/historico")({
  server: {
    handlers: {
      GET: async () => {
        const denied = await requireApiAccess();
        if (denied) return denied;
        return Response.json(await getHistorico());
      },
    },
  },
});
