# Drive import trigger

This document explains how to trigger the server-side Google Drive import manually and the environment variables required to run it.

Environment variables

- LOVABLE_API_KEY - (recommended) API key for the connector gateway. If present the app will use the gateway to list/download Drive files.
- GOOGLE_DRIVE_API_KEY - (recommended) API key for the connector gateway.
- ALLOW_PUBLIC_DRIVE_FALLBACK=true - (optional) if set to `true`, the app will try to read the Drive folder via the public `drive.google.com/embeddedfolderview` HTML when gateway credentials are missing. Use only if the folder is public.
- DRIVE_IMPORT_SECRET - (recommended) a secret string to protect the manual trigger endpoint. If set, callers must send this value in the `x-drive-import-secret` header.

HTTP endpoint (server)

A protected endpoint is available at `/api/drive-import` (POST). It calls the import routine with `forcar=true`.

Example curl (with secret):

```bash
curl -X POST "https://<your-host>/api/drive-import" \
  -H "x-drive-import-secret: ${DRIVE_IMPORT_SECRET}"
```

Example response:

- Success when import ran and created/updated history:
  { "ok": true, "updated": true }
- Success but nothing changed:
  { "ok": true, "updated": false }
- Error:
  { "ok": false, "error": "<message>" }

CLI script

I've also added a tiny script you can run inside the project container/host to trigger the import locally (useful for testing without exposing the endpoint).

```bash
# from project root (after installing deps / building)
node scripts/force-drive-import.mjs
```

Security

- Protect the `/api/drive-import` endpoint behind your app's auth or set `DRIVE_IMPORT_SECRET`.
- Avoid enabling `ALLOW_PUBLIC_DRIVE_FALLBACK` in production unless the folder is intentionally public.

Testing checklist

1. Deploy the code changes (already committed) to your environment.
2. Set required env vars (LOVABLE_API_KEY / GOOGLE_DRIVE_API_KEY). If you don't have the gateway, set `ALLOW_PUBLIC_DRIVE_FALLBACK=true` and ensure the folder is public.
3. (Optional) Set `DRIVE_IMPORT_SECRET` to protect the endpoint.
4. Redeploy the service.
5. Invoke the endpoint via curl (see above) or run the CLI script.
6. Tail logs and confirm messages like `[auto-import] histórico salvo:` or the gateway/fallback info messages.
