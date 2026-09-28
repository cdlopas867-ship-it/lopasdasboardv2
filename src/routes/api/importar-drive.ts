import { createFileRoute } from "@tanstack/react-router";
import { requireApiAccess } from "@/lib/gate.server";

/* Pasta pública do Google Drive da Lopas com as planilhas oficiais. */
const FOLDER_ID = "16WJaYavcR8B1QgpVsT51Kg0_ADJsSGtQ";

async function listarPlanilhasDaPasta(folderId: string): Promise<string[]> {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}#list`, {
    redirect: "follow",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Pasta do Drive: HTTP ${res.status}`);

  const html = await res.text();
  const ids: string[] = [];
  const re = /\/file\/d\/([a-zA-Z0-9_-]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const id = match[1];
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;

    const x = (a << 16) | (b << 8) | c;
    out +=
      (chars[(x >>> 18) & 63] ?? "") +
      (chars[(x >>> 12) & 63] ?? "") +
      (i + 1 < bytes.length ? (chars[(x >>> 6) & 63] ?? "") : "=") +
      (i + 2 < bytes.length ? (chars[x & 63] ?? "") : "=");
  }

  return out;
}

type FulfilledResult = { status: "fulfilled"; value: string };
type RejectedResult = { status: "rejected"; reason: unknown };

export const Route = createFileRoute("/api/importar-drive")({
  server: {
    handlers: {
      GET: async () => {
        const denied = await requireApiAccess();
        if (denied) return denied;
        const atualizadoEm = new Date().toISOString();

        try {
          const sheetIds = await listarPlanilhasDaPasta(FOLDER_ID);
          if (!sheetIds.length) {
            return Response.json(
              {
                ok: false,
                files: [],
                quantidadeArquivos: 0,
                atualizadoEm,
                error: "Nenhuma planilha encontrada na pasta do Drive",
              },
              { status: 502 },
            );
          }

          const resultados = await Promise.allSettled(
            sheetIds.map(async (id) => {
              const res = await fetch(
                `https://drive.google.com/uc?export=download&confirm=t&id=${id}&_=${Date.now()}`,
                { redirect: "follow", cache: "no-store" },
              );
              if (!res.ok) throw new Error(`Planilha ${id}: HTTP ${res.status}`);
              return arrayBufferToBase64(await res.arrayBuffer());
            }),
          );

          const files = resultados
            .filter((r): r is FulfilledResult => r.status === "fulfilled")
            .map((r) => r.value);
          const erros = resultados
            .filter((r): r is RejectedResult => r.status === "rejected")
            .map((r) => String(r.reason instanceof Error ? r.reason.message : r.reason));

          if (!files.length) {
            return Response.json(
              {
                ok: false,
                files: [],
                quantidadeArquivos: 0,
                atualizadoEm,
                error: erros.join("; ") || "Nenhuma planilha acessível",
              },
              { status: 502 },
            );
          }

          return Response.json({
            ok: true,
            files,
            quantidadeArquivos: files.length,
            atualizadoEm,
            erros: erros.length ? erros : undefined,
          });
        } catch (error) {
          console.error("[api/importar-drive] falha:", error);
          return Response.json(
            {
              ok: false,
              files: [],
              quantidadeArquivos: 0,
              atualizadoEm,
              error: error instanceof Error ? error.message : "Falha ao importar o Drive",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
