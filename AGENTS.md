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

- **Stack**: TanStack Start (SSR via nitro) + Vite 8 + React 19 + Supabase. Package manager is **bun** (`bun.lock`, `bunfig.toml`), but the container runs on the **`node:22`** image and executes Vite via Docker/Compose.
- **Run**: `docker compose -f docker-compose.base44.yml up -d`. The dev server (`vite dev`) listens on **port 3000** (overridden via `--port 3000` CLI flag; the Lovable config defaults to 8080). See `docker-compose.base44.yml` and `package.json` for local start commands.
- **Env vars**: `.env.base44-defaults` holds non-secret placeholders (Supabase publishable keys, gate credentials `admin`/`lopas2026`, service-role placeholder). Real secrets land in `/run/base44/...` and are injected into the container environment.
  - `SESSION_SECRET` — **required at boot**; the site-access gate (`gate.server.ts`) throws without it. Generated for development.
  - `SUPABASE_SERVICE_ROLE_KEY` — needed for live Supabase data (historico/sync/valor-faturado stores). Without it, APIs fail gracefully and the dashboard shows built-in sample data (`initialSyncData`).
  - `SITE_USERNAME` / `SITE_PASSWORD` — gate login credentials. Defaults in `.env.base44-defaults`.
- **Auth flow**: `AuthProvider` calls `checkAccess()` server fn on mount → redirects to `/login` if not unlocked. Login calls `unlockSite()` which checks `SITE_USERNAME`/`SITE_PASSWORD` and sets the session cookie.
- **Not a Lovable sandbox**: `LOVABLE_SANDBOX`/`DEV_SERVER__PROJECT_PATH` are not set, so the Lovable vite config runs in non-sandbox mode (no strictPort, host `::`). The `--host 0.0.0.0` flag ensures access from the container/preview origin.
- **Vite host allowlist**: `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` is passed bare in the compose `environment:` so Vite >= 6.1 accepts the preview origin.
- **Drive sync (real hours)**: `drive-auto-import.ts` checks the user's Drive folder every 15 s in the background and on each `/api/sync-data` GET (10 s throttle). Without gateway keys, the public-facing app falls back to checked-in sample data.
- **Drive — formato atual (sem aba Resumo)**: a pasta hoje entrega planilhas de posição (`estoque NN.xlsx`, modelo `ESTOQUE 001 - POSIÇÃO DE ESTOQUE`) **sem aba `Resumo`**. O resumo do painel é calculado a partir dos itens (`lerItensEstoque` + `resumoDeItens`) e a data-base vem da modificação do arquivo de itens. As planilhas `public/planilhas/*` são apenas fallback: o `mtime` delas é o do checkout (sempre "agora"), então **não** deve entrar na comparação de recência `melhorItensMod > melhorResumoMod` — senão o resumo local antigo vence os itens atualizados do Drive e o painel congela. Verificação: `docker compose -f docker-compose.base44.yml logs web | grep auto-import` deve mostrar `resumo recalculado a partir de N itens`.
- **Produção da Semana**: a cena usa `calcularProducaoSemanal` (`src/lib/producao-semanal.ts`), que lê a planilha **PCP 003 - Análise de Realização Total** (`produção NN.xlsx`): `produzido` = QTDE ENTREGUE / PESO REALIZADO (kg), `previsto` = programado e `pendente` (a produzir) = previsto − produzido. O `recebido`/`entregue` vem da planilha **PESO RECEBIDO POR PERÍODO** (`calcularRecebidoPorDia`). A cena mostra a **semana atual** (seg–dom, `semanaAtual`) para misturar produzido/recebido (dias passados) com a produzir (dias futuros). Dois cuidados: (1) a planilha de **pendências** PCP 004 também tem DT INICIAL/PENDENTE e era confundida com produção (o parser pegava a última processada e zerava a tonelagem) — `calcularProducaoSemanal` agora a ignora pela coluna `PESO PENDENTE`; (2) o cabeçalho da PESO RECEBIDO usa `DT_INICIO`/`PESO_RECEBIDO` com underline — `normalizeHeader` remove underlines além de espaços, senão o recebido nunca era encontrado. A cena também traz uma tabela **Dia a dia** (produzido × recebido, toneladas e unidades) montada diretamente de `semanaAtual(dias)`, usando `tonProduzido`/`produzido` e `tonEntregue`/`entregue` de cada dia — não há nova fonte de dados.
- **Avarias**: the source `public/planilhas/avarias.xlsx` has only DANIFICADO records, while the historical Drive export and the checked-in snapshot omit other occurrences. The official metric is **Soma de Quantidade** (sum of the `Quantidade` column), NOT record count: `calcularAvariasResumo` sums `quantidade` over non-empty Motivo rows for total, monthly bars, per-type breakdown, and "motivo mais frequente por mês"; `avarias-referencia.ts` carries the user's official pivot data — monthly quantity totals **(771/540/494/321/338/172/244/211/221, totaling 3,312 volumes)** and a Soma de Quantidade matrix per motivo × month. `aplicarReferenciaMotivos` patches the video dashboard's avarias scene to match. Cost remains partial and is labeled as such; do not synthesize records beyond the official matrix.
<!-- BASE44:END -->
