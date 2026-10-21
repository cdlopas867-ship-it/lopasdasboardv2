/**
 * Cena de boas-vindas — badge "41 anos" igual à imagem de referência.
 *
 * Losango verde (quadrado rotacionado 45°), "4" e "1" em branco sobrepostos
 * (o "1" estende para fora do losango), "anos" em preto na vertical dentro
 * da haste do "1". "Há" acima, "inovando para transformar o jeito de
 * viver" embaixo, com "viver" em destaque.
 */

const VERDE = "#8DC63F";
const FONTE = "'Nunito', 'Quicksand', 'VAG Rounded', 'Segoe UI Rounded', 'Arial Rounded MT Bold', system-ui, sans-serif";

export default function CenaBoasVindas() {
  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
      {/* "Há" acima do badge */}
      <p className="boas-vindas-cena-ha text-2xl font-medium text-white drop-shadow-lg sm:text-4xl">
        Há
      </p>

      {/* Badge losango verde + 41 branco + anos preto vertical */}
      <div
        className="boas-vindas-cena-badge relative my-3 flex items-center justify-center"
        style={{ width: "13rem", height: "13rem" }}
      >
        {/* Losango verde (quadrado rotacionado 45°) */}
        <div
          className="absolute"
          style={{
            width: "8rem",
            height: "8rem",
            backgroundColor: VERDE,
            borderRadius: "1.25rem",
            transform: "rotate(45deg)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
          }}
        />

        {/* "4" e "1" em branco, sobrepostos, horizontais — com brilho e surgir escalonado */}
        <div className="relative flex items-center" style={{ overflow: "visible" }}>
          <span
            className="boas-vindas-cena-numero boas-vindas-cena-numero-4"
            style={{
              fontSize: "7.5rem",
              fontWeight: 800,
              color: "#ffffff",
              fontFamily: FONTE,
              lineHeight: 0.85,
              letterSpacing: "-0.12em",
            }}
          >
            4
          </span>
          <span
            className="relative boas-vindas-cena-numero boas-vindas-cena-numero-1"
            style={{
              fontSize: "7.5rem",
              fontWeight: 800,
              color: "#ffffff",
              fontFamily: FONTE,
              lineHeight: 0.85,
              letterSpacing: "-0.12em",
              marginLeft: "-0.5rem",
            }}
          >
            1
            {/* Texto ancorado à haste do próprio número, não ao badge. */}
            <span
              className="absolute"
              style={{
                left: "55%",
                top: "51%",
                transform: "translate(-50%, -50%)",
                color: "#1a1a1a",
                fontFamily: FONTE,
                fontWeight: 700,
                fontSize: "0.75rem",
                lineHeight: 1,
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              anos
            </span>
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
