/* Intro de homenagem — o "vídeo" que abre o app Lopas 2026.
 *
 * Sequência cinematográfica de cenas (fotos do CD + Ken Burns + texto
 * surgindo) que resume o que a pesquisa pública sobre a Lopas encontrou:
 * a fundação em outubro de 1985 em Rodeiro (MG), os 41 anos em 2026, a
 * presença em mais de 40 países, a fé como valor da família Lopes e os
 * eventos de 2026 (Lopas Conecta, VEX e FEMUR).
 *
 * - Toca uma vez por sessão (controlado em `src/routes/index.tsx`).
 * - Avança sozinha e pode ser pulada no botão "Pular intro" ou com Esc.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const DURACAO_CENA_MS = 4200;

type Cena = {
  imagem: string;
  eyebrow: string;
  titulo: string;
  linhas: string[];
  rodape?: string;
};

const CENAS: Cena[] = [
  {
    imagem: "/fundo-intro.jpg",
    eyebrow: "Homenagem",
    titulo: "Lopas 2026",
    linhas: ["41 anos de história", "Movidos pela fé"],
    rodape: "Uma homenagem do CD Lopas",
  },
  {
    imagem: "/fundo-satelite-real.jpg",
    eyebrow: "Outubro de 1985 · Rodeiro, Minas Gerais",
    titulo: "Nasce a Móveis Lopas",
    linhas: ["Do sonho do fundador Augusto Lopes,", "no coração do polo moveleiro mineiro"],
  },
  {
    imagem: "/fundo-apresentacao.jpg",
    eyebrow: "Quatro décadas",
    titulo: "Carinho, harmonia e conforto",
    linhas: ["Móveis feitos para os lares", "de todo o Brasil"],
  },
  {
    imagem: "/bg-recebimento.jpg",
    eyebrow: "Além das fronteiras",
    titulo: "Mais de 40 países",
    linhas: ["A Lopas leva o móvel brasileiro", "para o mundo — e cresce com ele"],
  },
  {
    imagem: "/fundo-satelite.jpg",
    eyebrow: "Uma empresa familiar",
    titulo: "Fé que sustenta",
    linhas: ["Valores firmes, gratidão a Deus", "e gente que faz acontecer todos os dias"],
  },
  {
    imagem: "/fundo-lopas-final.webp",
    eyebrow: "2026",
    titulo: "Nas feiras e na estrada",
    linhas: ["Lopas Conecta · VEX · FEMUR", "e o Centro de Distribuição em ritmo de crescimento"],
  },
  {
    imagem: "/fundo-apresentacao.png",
    eyebrow: "Centro de Distribuição",
    titulo: "Cada palete, cada entrega",
    linhas: ["É a história de 41 anos", "chegando inteira ao cliente"],
    rodape: "Fontes: moveislopas.com.br · eMóbile · redes oficiais da Lopas",
  },
];

export default function IntroHomenagemLopas({ onConcluir }: { onConcluir: () => void }) {
  const [indice, setIndice] = useState(0);
  const [saindo, setSaindo] = useState(false);
  const concluido = useRef(false);

  const finalizar = useCallback(() => {
    if (concluido.current) return;
    concluido.current = true;
    setSaindo(true);
    window.setTimeout(onConcluir, 700);
  }, [onConcluir]);

  /* Avanço automático das cenas. */
  useEffect(() => {
    if (saindo) return;
    const t = window.setTimeout(() => {
      if (indice >= CENAS.length - 1) finalizar();
      else setIndice((i) => i + 1);
    }, DURACAO_CENA_MS);
    return () => window.clearTimeout(t);
  }, [indice, saindo, finalizar]);

  /* Esc também pula a intro. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finalizar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finalizar]);

  const cena = CENAS[Math.min(indice, CENAS.length - 1)];

  return (
    <div
      className={`intro-homem fixed inset-0 z-[9999] overflow-hidden bg-black text-white ${saindo ? "intro-homem-saindo" : ""}`}
      role="dialog"
      aria-label="Homenagem Lopas 2026"
    >
      <div key={indice} className="absolute inset-0">
        <div
          className="intro-homem-fundo absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${cena.imagem}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/40 to-black/85" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <p className="intro-homem-texto text-[10px] font-bold uppercase tracking-[0.35em] text-[#c9e39a] sm:text-xs sm:tracking-[0.45em]">
            {cena.eyebrow}
          </p>
          <h1 className="intro-homem-texto mt-4 max-w-3xl font-serif text-3xl leading-tight drop-shadow-lg sm:text-5xl">
            {cena.titulo}
          </h1>
          <div className="mt-4 max-w-xl space-y-1">
            {cena.linhas.map((linha) => (
              <p key={linha} className="intro-homem-texto-2 text-sm text-white/85 sm:text-lg">
                {linha}
              </p>
            ))}
          </div>
          {cena.rodape && (
            <p className="intro-homem-texto-2 mt-8 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/55">
              {cena.rodape}
            </p>
          )}
        </div>
      </div>

      {/* Progresso das cenas */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
        {CENAS.map((c, i) => (
          <span
            key={c.titulo}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === indice ? "w-6 bg-[#76A035]" : i < indice ? "w-2 bg-white/60" : "w-2 bg-white/25"
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={finalizar}
        className="absolute right-4 top-4 z-20 rounded-full border border-white/30 bg-black/30 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur transition-colors hover:bg-white/15 hover:text-white"
      >
        Pular intro
      </button>
    </div>
  );
}
