import { createFileRoute } from "@tanstack/react-router";
import { setData, getLatestData } from "@/lib/sync-store";
import { addRegistro } from "@/lib/historico-store";
import { requireApiAccess } from "@/lib/gate.server";
import { importarSeMudou } from "@/lib/drive-auto-import";

/* GET — confere a data oficial dos arquivos no Drive antes de responder.
 * Quando nada mudou, a consulta é rápida; quando mudou, devolve os valores
 * novos na mesma resposta, sem exigir uma segunda atualização da tela.
 * POST — recebe dados importados. */
export const Route = createFileRoute("/api/sync-data")({
  server: {
    handlers: {
      GET: async () => {
        const denied = await requireApiAccess();
        if (denied) return denied;

        await importarSeMudou().catch((error) => {
          console.error("[sync-data] falha ao verificar o Drive:", error);
        });

        const data = await getLatestData();
        return data === null || data === undefined
          ? new Response(null, { status: 204 })
          : Response.json(data, { status: 200 });
      },
      POST: async ({ request }) => {
        const denied = await requireApiAccess();
        if (denied) return denied;
        let data: unknown;
        try {
          data = await request.json();
        } catch {
          return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 });
        }
        await setData(data);

        const resumo = (data as Record<string, unknown>)?.["resumo"] as
          | { valor?: number; previsto?: number; ton?: number; saldo?: number; itens?: number }
          | undefined;
        const atualizadoEm = (data as Record<string, unknown>)?.["atualizadoEm"] as string | undefined;
        if (resumo && typeof resumo.valor === "number" && typeof resumo.ton === "number") {
          const reservados = (data as Record<string, unknown>)?.["reservados"] as
            | { pesoReservado?: number }[]
            | undefined;
          const reservadoTon = reservados?.length
            ? reservados.reduce((s, i) => s + (i.pesoReservado ?? 0), 0) / 1000
            : undefined;
          await addRegistro({
            valor: resumo.valor,
            previsto: resumo.previsto ?? 0,
            ton: resumo.ton,
            saldo: resumo.saldo ?? 0,
            itens: resumo.itens ?? 0,
            ...(reservadoTon != null ? { reservadoTon } : {}),
            ...(atualizadoEm ? { data: atualizadoEm } : {}),
          });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
