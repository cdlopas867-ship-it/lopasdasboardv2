import { createFileRoute } from "@tanstack/react-router";
import { getValorFaturado, setValorFaturado } from "@/lib/valor-faturado-store";
import { requireApiAccess } from "@/lib/gate.server";

/* GET  — devolve o valor faturado (R$/t) fixado.
 * POST — atualiza o valor faturado (R$/t). Body: { "valor": number } */
export const Route = createFileRoute("/api/valor-faturado")({
  server: {
    handlers: {
      GET: async () => {
        const denied = await requireApiAccess();
        if (denied) return denied;
        return Response.json({ valor: await getValorFaturado() });
      },
      POST: async ({ request }) => {
        const denied = await requireApiAccess();
        if (denied) return denied;
        let body: { valor?: number };
        try {
          body = (await request.json()) as { valor?: number };
        } catch {
          return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 });
        }
        if (typeof body.valor !== "number" || body.valor <= 0) {
          return Response.json({ error: "valor inválido" }, { status: 400 });
        }
        const valor = await setValorFaturado(body.valor);
        return Response.json({ valor });
      },
    },
  },
});
