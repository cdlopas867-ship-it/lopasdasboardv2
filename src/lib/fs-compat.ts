/* Camada de compatibilidade para operações de filesystem.
 *
 * Em dev (Node/Bun) usa node:fs normalmente. Em produção (Cloudflare
 * Workers) node:fs não está disponível — as funções fazem no-op e o
 * app funciona apenas com dados em memória.
 *
 * O spec do import é montado em runtime para que o bundler não resolva
 * estaticamente node:fs (o que quebraria o build do Cloudflare). */

type FsModule = typeof import("node:fs");

let fs: FsModule | null = null;

try {
  const spec = ["node", "fs"].join(":");
  fs = await import(/* @vite-ignore */ spec);
} catch {
  /* Cloudflare Workers — sem filesystem, só memória */
}

export function existsSync(path: string): boolean {
  if (!fs) return false;
  try {
    return fs.existsSync(path);
  } catch {
    return false;
  }
}

export function readFileSync(path: string, encoding: BufferEncoding): string;
export function readFileSync(path: string): Buffer;
export function readFileSync(path: string, encoding?: BufferEncoding): string | Buffer {
  if (!fs) throw new Error("Filesystem not available");
  return encoding ? fs.readFileSync(path, encoding) : fs.readFileSync(path);
}

export function statSync(path: string): { mtime: Date } | null {
  if (!fs) return null;
  try {
    return fs.statSync(path);
  } catch {
    return null;
  }
}

export function writeFileSync(path: string, data: string): void {
  if (!fs) return;
  try {
    fs.writeFileSync(path, data);
  } catch {
    /* sem permissão — mantém em memória */
  }
}

export function mkdirSync(path: string, options?: { recursive?: boolean }): void {
  if (!fs) return;
  try {
    fs.mkdirSync(path, options);
  } catch {
    /* já existe — ignora */
  }
}
