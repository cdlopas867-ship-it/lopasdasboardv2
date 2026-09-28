import { createFileRoute } from "@tanstack/react-router";
import { addClient, getLatestData, removeClient } from "@/lib/sync-store";
import { requireApiAccess } from "@/lib/gate.server";

/* Endpoint SSE — clientes conectam aqui e recebem os dados mais recentes
 * imediatamente, além de atualizações quando outro dispositivo importa dados. */
export const Route = createFileRoute("/api/sync-events")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = await requireApiAccess();
        if (denied) return denied;
        const id = crypto.randomUUID();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            addClient(id, controller);
            // envia os dados atuais assim que o cliente conecta
            const current = await getLatestData();
            if (current) {
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify(current)}\n\n`),
              );
            }
          },
          cancel() {
            removeClient(id);
          },
        });

        request.signal?.addEventListener("abort", () => removeClient(id));

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
