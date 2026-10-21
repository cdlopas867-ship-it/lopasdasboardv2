/**
 * Cena de boas-vindas — badge "41 anos" com efeito de revelação.
 *
 * Reproduz o visual da referência: fundo aéreo do CD, badge verde arredondado
 * com "4" (branco) + "1" (escuro) sobrepostos e "anos" vertical, "Há" acima,
 * e "inovando para transformar o jeito de viver" embaixo, com "viver" em destaque.
 * Animação: badge surge com scale + fade, texto entra em sequência com atraso.
 */

const VERDE = "#8CC63F";
const ESCURO = "#333333";

export default function CenaBoasVindas() {
  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
      {/* "Há" acima do badge */}
      <p className="boas-vindas-cena-ha intro-homem-texto text-lg font-medium text-white drop-shadow-lg sm:text-2xl">
        Há
      </p>

      {/* Badge verde arredondado com 41 anos */}
      <div className="boas-vindas-cena-badge relative my-3 flex items-center justify-center">
        <div
          className="relative flex items-center justify-center rounded-[1.75rem] px-8 py-6 shadow-2xl"
          style={{ backgroundColor: VERDE, minWidth: "7.5rem", minHeight: "7.5rem" }}
        >
          {/* "4" em branco grande */}
          <span
            className="font-serif text-7xl font-bold leading-none text-white sm:text-8xl"
            style={{ letterSpacing: "-0.05em" }}
          >
            4
          </span>
          {/* "1" sobreposto em escuro */}
          <span
            className="font-serif text-7xl font-bold leading-none sm:text-8xl"
            style={{ color: ESCURO, marginLeft: "-0.35em", letterSpacing: "-0.05em" }}
          >
            1
          </span>
          {/* "anos" vertical à direita */}
          <span
            className="ml-1 text-sm font-semibold uppercase tracking-wider sm:text-base"
            style={{ color: ESCURO, writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            anos
          </span>
        </div>
      </div>

      {/* Texto inferior — 3 linhas, "viver" em destaque */}
      <div className="mt-2 space-y-0.5">
        <p className="boas-vindas-cena-linha intro-homem-texto-2 text-base font-medium text-white drop-shadow-md sm:text-xl">
          inovando para
        </p>
        <p className="boas-vindas-cena-linha intro-homem-texto-2 text-base font-medium text-white drop-shadow-md sm:text-xl">
          transformar o
        </p>
        <p className="boas-vindas-cena-linha-destaque boas-vindas-cena-linha intro-homem-texto-2 text-base font-bold text-white drop-shadow-lg sm:text-xl">
          jeito de viver
        </p>
      </div>
    </div>
  );
}
