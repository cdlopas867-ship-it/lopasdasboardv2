import { importarSeMudou } from "@/lib/drive-auto-import";

export async function POST({ request }: { request: Request }) {
  const secretHeader = request.headers.get("x-drive-import-secret") ?? "";
  const secretEnv = process.env["DRIVE_IMPORT_SECRET"] ?? "";
  // If DRIVE_IMPORT_SECRET is set, require the caller to provide it.
  if (secretEnv && secretHeader !== secretEnv) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }

  try {
    const updated = await importarSeMudou(true);
    return new Response(JSON.stringify({ ok: true, updated }), { status: 200 });
  } catch (err) {
    console.error("[api/drive-import] erro:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
}
