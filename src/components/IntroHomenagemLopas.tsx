/* Intro de homenagem — o "vídeo" que abre o app Lopas 2026.
 *
 * Sequência cinematográfica de cenas (fotos do CD + Ken Burns + texto
 * surgindo) que resume o que a pesquisa pública sobre a Lopas encontrou:
 * a fundação em outubro de 1985 em Rodeiro (MG), os 41 anos em 2026, a
 * presença em mais de 40 países, a fé como valor da família Lopes e os
 * eventos de 2026 (Lopas Conecta, VEX e FEMUR).
 *
 * - Toca a cada abertura do app (controlado em `src/routes/index.tsx`).
 * - Avança sozinha e pode ser pulada no botão "Pular intro" ou com Esc.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import CenaBoasVindas from "@/components/CenaBoasVindas";

const DURACAO_CENA_MS = 6000;
/* Tempo do fade-out (igual ao da animação `.intro-homem-saindo`). */
const DURACAO_SAIDA_MS = 900;

type Cena = {
  imagem: string;
  eyebrow: string;
  titulo: string;
  linhas: string[];
  rodape?: string;
  especial?: "boas-vindas";
};

const CENAS: Cena[] = [
  {
    imagem: "/fundo-boas-vindas.jpg",
    eyebrow: "",
    titulo: "",
    linhas: [],
    especial: "boas-vindas",
  },
];

export default function IntroHomenagemLopas({ onConcluir }: { onConcluir: () => void }) {
  const [indice, setIndice] = useState(0);
  const [saindo, setSaindo] = useState(false);
  const concluido = useRef(false);
  const saida = useRef<number | null>(null);

  /* Inicia o fade-out; só avisa a conclusão quando a animação termina. */
  const finalizar = useCallback(() => {
    if (concluido.current) return;
    concluido.current = true;
    setSaindo(true);
    saida.current = window.setTimeout(onConcluir, DURACAO_SAIDA_MS);
  }, [onConcluir]);

  /* Não deixa o timer do fade disparar depois de desmontar. */
  useEffect(
    () => () => {
      if (saida.current !== null) window.clearTimeout(saida.current);
    },
    [],
  );

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

        {cena.especial === "boas-vindas" ? (
          <CenaBoasVindas />
        ) : (
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
        )}
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
