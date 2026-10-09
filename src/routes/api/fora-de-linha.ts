import { createFileRoute } from "@tanstack/react-router";
import { getLatestData, setData } from "@/lib/sync-store";
import { requireApiAccess } from "@/lib/gate.server";

/* Recebe o resultado da ferramenta "Análise de estoque" e grava no painel,
   substituindo os itens fora de linha anteriores (inclusive os fixos). */
export const Route = createFileRoute("/api/fora-de-linha")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await requireApiAccess();
        if (denied) return denied;
        let body: Record<string, unknown>;
        try { body = await request.json(); } catch { return Response.json({ error: "Corpo inválido" }, { status: 400 }); }
        if (!Array.isArray(body["itens"]) || !body["posicaoEmLinha"] || !body["posicaoForaDeLinha"] || !body["posicaoTotal"]) {
          return Response.json({ error: "Dados incompletos" }, { status: 400 });
        }
        const atual = ((await getLatestData()) as Record<string, unknown> | null) ?? {};
        const foraDeLinha = {
          itens: body["itens"],
          posicaoEmLinha: body["posicaoEmLinha"],
          posicaoForaDeLinha: body["posicaoForaDeLinha"],
          posicaoTotal: body["posicaoTotal"],
          importadoEm: new Date().toISOString(),
          arquivo: typeof body["arquivo"] === "string" ? body["arquivo"] : undefined,
        };
        await setData({ ...atual, foraDeLinha });
        return Response.json({ ok: true, importadoEm: foraDeLinha.importadoEm });
      },
    },
  },
});
