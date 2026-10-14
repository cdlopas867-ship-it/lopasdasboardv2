// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

/* Fotos reais da Lopas já presentes em public/ — usadas como equivalente no
   preview do Base44 (ver `fotosPreviewBase44`). */
const FOTOS_LOCAIS = [
  "fundo-lopas-final.webp",
  "fundo-apresentacao.jpg",
  "fundo-intro.jpg",
  "fundo-satelite-real.jpg",
  "login-bg-1.jpg",
  "login-bg-2.jpg",
  "login-bg-3.jpg",
  "login-bg-warehouse.jpeg",
];

const TIPO_POR_EXT: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

/* As fotos do painel (fundos das cenas, carrossel do login, tela de boas-vindas
   e o preload em `src/routes/__root.tsx`) são assets hospedados pelo Lovable, em
   `/__l5e/assets-v1/<id>/<arquivo>`. Fora da hospedagem do Lovable esses
   caminhos não existem: no preview do Base44 eles respondiam 404 (painel sem
   fundo e erro de rede no console). Com BASE44_PREVIEW_MODE=1 servimos uma foto
   equivalente de public/ nesses caminhos; sem o flag nada muda, o Lovable segue
   com os assets reais. */
function fotosPreviewBase44(): Plugin {
  return {
    name: "base44-preview-fotos",
    apply: "serve",
    configureServer(servidor) {
      servidor.middlewares.use((req, res, next) => {
        const m = /^\/__l5e\/assets-v1\/[^/]+\/([^/?#]+)/.exec(req.url ?? "");
        if (!m) return next();
        /* Só imagens; outros assets (vídeos) seguem o fluxo normal. */
        if (!TIPO_POR_EXT[path.extname(m[1]!).toLowerCase()]) return next();

        /* Escolha estável pelo nome do arquivo: cada asset cai sempre na mesma foto. */
        let soma = 0;
        for (const c of m[1]!) soma += c.charCodeAt(0);
        const foto = FOTOS_LOCAIS[soma % FOTOS_LOCAIS.length]!;

        fs.readFile(path.join(process.cwd(), "public", foto), (erro, buffer) => {
          if (erro) return next();
          res.setHeader("Content-Type", TIPO_POR_EXT[path.extname(foto).toLowerCase()] ?? "image/jpeg");
          res.setHeader("Cache-Control", "no-store");
          res.end(buffer);
        });
      });
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: process.env.BASE44_PREVIEW_MODE === "1" ? [fotosPreviewBase44()] : [],
    server: {
      // Bind mounts in the sandbox don't emit inotify events reliably, so Vite's
      // file watcher misses edits — polling keeps hot reload working.
      watch: { usePolling: true, interval: 300 },
    },
  },
});
