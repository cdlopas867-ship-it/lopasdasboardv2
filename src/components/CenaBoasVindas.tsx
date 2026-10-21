/**
 * Cena de boas-vindas — badge "41 anos" igual à imagem de referência.
 *
 * Fundo com os caminhões da Lopas, badge verde arredondado com "4" (branco)
 * + "1" (escuro) sobrepostos e "anos" vertical, "Há" acima, e "inovando para
 * transformar o jeito de viver" embaixo, com "viver" em destaque.
 */

const VERDE = "#8CC63F";
const ESCURO = "#2D2D2D";
const FONTE = "'Arial Black', 'Helvetica Neue', Impact, Arial, system-ui, sans-serif";

export default function CenaBoasVindas() {
  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
      {/* "Há" acima do badge */}
      <p className="boas-vindas-cena-ha text-2xl font-medium text-white drop-shadow-lg sm:text-4xl">
        Há
      </p>

      {/* Badge verde arredondado com 41 anos — maior e centralizado */}
      <div className="boas-vindas-cena-badge relative my-3 flex items-center justify-center">
        <div
          className="relative flex items-center justify-center shadow-2xl"
          style={{
            backgroundColor: VERDE,
            borderRadius: "2rem",
            width: "13rem",
            height: "13rem",
          }}
        >
          {/* "4" em branco grande */}
          <span
            className="text-[8.5rem] font-black leading-none text-white sm:text-[11rem]"
            style={{ fontFamily: FONTE, letterSpacing: "-0.06em" }}
          >
            4
          </span>
          {/* "1" sobreposto em escuro, deslocado à direita */}
          <span
            className="text-[8.5rem] font-black leading-none sm:text-[11rem]"
            style={{
              color: ESCURO,
              fontFamily: FONTE,
              letterSpacing: "-0.06em",
              marginLeft: "-0.38em",
            }}
          >
            1
          </span>
          {/* "anos" vertical à direita */}
          <span
            className="ml-2 text-lg font-black uppercase tracking-wide sm:text-2xl"
            style={{
              color: ESCURO,
              fontFamily: FONTE,
              writingMode: "vertical-rl",
              textOrientation: "mixed",
            }}
          >
            anos
          </span>
        </div>
      </div>

      {/* Texto inferior — 3 linhas, "viver" em destaque */}
      <div className="mt-2 space-y-0.5">
        <p className="boas-vindas-cena-linha text-lg font-medium text-white drop-shadow-md sm:text-2xl">
          inovando para
        </p>
        <p className="boas-vindas-cena-linha text-lg font-medium text-white drop-shadow-md sm:text-2xl">
          transformar o
        </p>
        <p className="boas-vindas-cena-linha-destaque text-lg font-bold text-white drop-shadow-lg sm:text-2xl">
          jeito de viver
        </p>
      </div>
    </div>
  );
}
