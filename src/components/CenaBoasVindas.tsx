/**
 * Cena de boas-vindas — badge "41 anos" idêntico à foto de referência.
 *
 * Fundo aéreo do CD, badge verde arredondado com "4" (branco) + "1" (escuro)
 * sobrepostos e "anos" vertical, "Há" acima, e "inovando para transformar o
 * jeito de viver" embaixo, com "viver" em destaque.
 */

const VERDE = "#8CC63F";
const ESCURO = "#333333";

export default function CenaBoasVindas() {
  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
      {/* "Há" acima do badge */}
      <p className="boas-vindas-cena-ha text-xl font-medium text-white drop-shadow-lg sm:text-3xl">
        Há
      </p>

      {/* Badge verde arredondado com 41 anos */}
      <div className="boas-vindas-cena-badge relative my-4 flex items-center justify-center">
        <div
          className="relative flex items-center justify-center shadow-2xl"
          style={{
            backgroundColor: VERDE,
            borderRadius: "1.5rem",
            width: "8.5rem",
            height: "8.5rem",
          }}
        >
          {/* "4" em branco grande */}
          <span
            className="text-[5.5rem] font-extrabold leading-none text-white sm:text-[7rem]"
            style={{ fontFamily: "ui-rounded, 'Nunito', system-ui, sans-serif", letterSpacing: "-0.06em" }}
          >
            4
          </span>
          {/* "1" sobreposto em escuro, deslocado à direita */}
          <span
            className="text-[5.5rem] font-extrabold leading-none sm:text-[7rem]"
            style={{
              color: ESCURO,
              fontFamily: "ui-rounded, 'Nunito', system-ui, sans-serif",
              letterSpacing: "-0.06em",
              marginLeft: "-0.45em",
            }}
          >
            1
          </span>
          {/* "anos" vertical à direita */}
          <span
            className="ml-1.5 text-sm font-bold uppercase tracking-wide sm:text-lg"
            style={{
              color: ESCURO,
              fontFamily: "ui-rounded, 'Nunito', system-ui, sans-serif",
              writingMode: "vertical-rl",
              textOrientation: "mixed",
            }}
          >
            anos
          </span>
        </div>
      </div>

      {/* Texto inferior — 3 linhas, "viver" em destaque */}
      <div className="mt-1 space-y-0.5">
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
