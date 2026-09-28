<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

<!-- BASE44:BEGIN -->
## Base44 dev environment

- **Stack**: TanStack Start (SSR via nitro) + Vite 8 + React 19 + Supabase. Package manager is **bun** (`bun.lock`, `bunfig.toml`), but the container runs on the **`node:22`** image and executes Vite with Node. Bun 1.2 segfaults (`panic: Segmentation fault` → `SIGILL`, core dumped) while Vite 8 loads its native rolldown module, killing the dev server every couple of minutes. Bun is installed in-image (`npm i -g bun`) purely for `bun install --frozen-lockfile`; do not switch the run command back to `bun run dev`.
- **Run**: `docker compose -f docker-compose.base44.yml up -d`. The dev server (`vite dev`) listens on **port 3000** (overridden via `--port 3000` CLI flag; the Lovable config defaults to 8080). Source is bind-mounted — edits hot-reload.
- **Env vars**: `.env.base44-defaults` holds non-secret placeholders (Supabase publishable keys, gate credentials `admin`/`lopas2026`, service-role placeholder). Real secrets land in `/run/base44/app.env` via the dashboard and override defaults.
  - `SESSION_SECRET` — **required at boot**; the site-access gate (`gate.server.ts`) throws without it. Generated for development.
  - `SUPABASE_SERVICE_ROLE_KEY` — needed for live Supabase data (historico/sync/valor-faturado stores). Without it, APIs fail gracefully and the dashboard shows built-in sample data (`initialSyncData`).
  - `SITE_USERNAME` / `SITE_PASSWORD` — gate login credentials. Defaults in `.env.base44-defaults`.
- **Auth flow**: `AuthProvider` calls `checkAccess()` server fn on mount → redirects to `/login` if not unlocked. Login calls `unlockSite()` which checks `SITE_USERNAME`/`SITE_PASSWORD` and sets a session cookie (needs `SESSION_SECRET`).
- **Not a Lovable sandbox**: `LOVABLE_SANDBOX`/`DEV_SERVER__PROJECT_PATH` are not set, so the Lovable vite config runs in non-sandbox mode (no strictPort, host `::`). The `--host 0.0.0.0` flag ensures the preview proxy can reach the dev server.
- **Vite host allowlist**: `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` is passed bare in the compose `environment:` so Vite >= 6.1 accepts the preview origin.
- **Drive sync (real hours)**: `drive-auto-import.ts` checks the user's Drive folder every 15 s in the background and on each `/api/sync-data` GET (10 s throttle). Without gateway keys, the public `embeddedfolderview` HTML is parsed per `flip-entry` block to get each file's real last-modified time ("3:27 am" today, "Sep 22" older) — that time becomes the history record timestamp (`addRegistro(..., melhorResumoMod.toISOString())`), not the server poll time. `parseModificado` also handles ISO 8601 (gateway path). Repetition is prevented three ways: the file-signature check skips unchanged folders, `addRegistro` dedups by core values (ton/valor/saldo/itens/previsto), and `dedupConsecutivos` cleans reads. Server restarts wipe the in-memory history when Supabase is unavailable (placeholder key), so one fresh record per boot is expected until the real `SUPABASE_SERVICE_ROLE_KEY` is set.
- **Drive — formato novo do Resumo**: o arquivo atual da pasta (`Resumo_Estoque_Ocupacao_Recebimento (N).xlsx`) exporta a aba `Resumo` com a linha `TOTAL` **vazia** e as colunas `Peso (ton)`, `%` e `Valor Previsto (R$)` em branco — só as linhas de categoria vêm preenchidas. `extrairResumo` soma as categorias quando a linha TOTAL está zerada; `extrairUnidadesResumo` usa `valor` como previsto e calcula o `share` pelo valor quando a coluna `%` vem vazia. Sem esses fallbacks o painel grava 0 t / R$ 0,00 mi. Para reaplicar uma correção de parser sem esperar mudança na pasta, reinicie o serviço (`docker compose restart web`) — a assinatura de arquivos vive em `globalThis` e bloqueia a reimportação.
- **Avarias**: the source `public/planilhas/avarias.xlsx` has only DANIFICADO records, while the historical Drive export and the checked-in snapshot omit other occurrences. The official metric is **Soma de Quantidade** (sum of the Quantidade column), NOT record count: `calcularAvariasResumo` sums `quantidade` over non-empty Motivo rows; `avarias-referencia.ts` carries the user's official pivot data — monthly quantity totals (771/540/494/321/338/172/244/211/185, totaling 3,276 volumes) for total and monthly bars, plus a count matrix per motivo × month (2,324 occurrences, Jan from the pivot detail, Feb–Aug from the Drive sheets, Sep as the arithmetic remainder) used only for the per-type breakdown and "motivo mais frequente por mês" (percentages based on the count total). `aplicarReferenciaMotivos` patches the video dashboard's avarias scene to match. Cost remains partial and is labeled as such; do not synthesize records beyond the official matrix.
<!-- BASE44:END -->
