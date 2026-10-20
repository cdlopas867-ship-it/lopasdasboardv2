/* Favicon animado do sino.
 *
 * Enquanto há uma atualização do Drive não dispensada, o ícone da aba passa
 * a ser um sininho que balança com um badge vermelho pulsante — o mesmo
 * desenho do banner NotificacaoAtualizacao. Ao dispensar, o ícone volta ao
 * favicon estático (/favicon.png).
 */

const TAM = 64;
const INTERVALO_MS = 450;
const FAVICON_PADRAO = "/favicon.png";

let timer: ReturnType<typeof setInterval> | null = null;
let link: HTMLLinkElement | null = null;
let passo = 0;

/* Desenha um quadro da animação e devolve o data URL. */
function quadro(angulo: number, pulso: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = TAM;
  canvas.height = TAM;
  const ctx = canvas.getContext("2d");
  if (!ctx) return FAVICON_PADRAO;

  /* fundo branco arredondado (mesma cara do ícone do app) */
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(0, 0, TAM, TAM, 12);
  ctx.fill();

  /* sininho balançando */
  ctx.save();
  ctx.translate(TAM / 2, TAM / 2 + 4);
  ctx.rotate(angulo);
  ctx.font = "38px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🔔", 0, 0);
  ctx.restore();

  /* badge vermelho pulsante */
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(TAM - 13, 13, 8 + pulso * 3, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL("image/png");
}

function linkFavicon(): HTMLLinkElement | null {
  if (link) return link;
  const existente = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
  link =
    existente ??
    (() => {
      const criado = document.createElement("link");
      criado.rel = "icon";
      document.head.appendChild(criado);
      return criado;
    })();
  return link;
}

/* Inicia a animação do sino no ícone da aba (idempotente). */
export function iniciarSinoFavicon(): void {
  if (timer) return;
  const l = linkFavicon();
  if (!l) return;
  const passos = [-0.35, 0, 0.35, 0];
  timer = setInterval(() => {
    const atual = linkFavicon();
    if (!atual) return;
    atual.href = quadro(passos[passo % passos.length], passo % 2);
    passo += 1;
  }, INTERVALO_MS);
}

/* Para e restaura o favicon estático. */
export function pararSinoFavicon(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  const l = linkFavicon();
  if (l) l.href = FAVICON_PADRAO;
  passo = 0;
}
