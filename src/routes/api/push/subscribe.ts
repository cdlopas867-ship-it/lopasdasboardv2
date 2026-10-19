import { createFileRoute } from "@tanstack/react-router";
import { addSubscription, removeSubscription } from "@/lib/push-store";
import { requireApiAccess } from "@/lib/gate.server";

/* POST — registra uma assinatura Web Push.
   DELETE — remove uma assinatura Web Push. */
export const Route = createFileRoute("/api/push/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await requireApiAccess();
        if (denied) return denied;

        let subscription: unknown;
        try {
          subscription = await request.json();
        } catch {
          return Response.json({ error: "Corpo inválido" }, { status: 400 });
        }

        addSubscription(subscription as never);
        return Response.json({ ok: true });
      },
      DELETE: async ({ request }) => {
        const denied = await requireApiAccess();
        if (denied) return denied;

        let subscription: unknown;
        try {
          subscription = await request.json();
        } catch {
          return Response.json({ error: "Corpo inválido" }, { status: 400 });
        }

        removeSubscription(subscription as never);
        return Response.json({ ok: true });
      },
    },
  },
});
