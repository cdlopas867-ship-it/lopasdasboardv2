import { createFileRoute } from "@tanstack/react-router";
import { getViagens, atualizarViagens, initViagens } from "@/lib/viagens-store";
import { requireApiAccess } from "@/lib/gate.server";

/* GET — devolve os dados de controle de viagens.
 * POST — força atualização a partir do Google Drive. */
initViagens();

function respostaViagens(data: ReturnType<typeof getViagens>): Response {
  /* Response.json não aceita status 204 porque uma resposta 204 não pode ter
     corpo. Isso causava erro 500 no Lovable quando ainda não havia dados. */
  return data ? Response.json(data) : new Response(null, { status: 204 });
}

export const Route = createFileRoute("/api/viagens")({
  server: {
    handlers: {
      GET: async () => {
        const denied = await requireApiAccess();
        if (denied) return denied;
        return respostaViagens(getViagens());
      },
      POST: async () => {
        const denied = await requireApiAccess();
        if (denied) return denied;
        try {
          return respostaViagens(await atualizarViagens());
        } catch (error) {
          console.error("[api/viagens] falha ao atualizar:", error);
          return Response.json(
            { error: "Não foi possível atualizar os dados de viagens." },
            { status: 502 },
          );
        }
      },
    },
  },
});
