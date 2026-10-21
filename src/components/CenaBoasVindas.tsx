/**
 * Cena de boas-vindas — badge "41 anos" igual à imagem de referência.
 *
 * Losango verde (quadrado rotacionado 45°), "4" e "1" em branco sobrepostos
 * (o "1" estende para fora do losango), "anos" em preto na vertical junto à
 * borda direita do "1". "Há" acima, "inovando para transformar o jeito de
 * viver" embaixo, com "viver" em destaque.
 */

const VERDE = "#8DC63F";
const FONTE = "'Arial Black', 'Helvetica Neue', Impact, Arial, system-ui, sans-serif";

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

        {/* "4" e "1" em branco, sobrepostos, horizontais */}
        <div className="relative flex items-center" style={{ overflow: "visible" }}>
          <span
            style={{
              fontSize: "7.5rem",
              fontWeight: 900,
              color: "#ffffff",
              fontFamily: FONTE,
              lineHeight: 0.85,
              letterSpacing: "-0.06em",
            }}
          >
            4
          </span>
          <span
            style={{
              fontSize: "7.5rem",
              fontWeight: 900,
              color: "#ffffff",
              fontFamily: FONTE,
              lineHeight: 0.85,
              letterSpacing: "-0.06em",
              marginLeft: "0",
            }}
          >
            1
          </span>
        </div>

        {/* "anos" em preto, vertical, junto à borda direita do "1" */}
        <span
          className="absolute"
          style={{
            right: "1rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#1a1a1a",
            fontFamily: FONTE,
            fontWeight: 700,
            fontSize: "1.1rem",
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          anos
        </span>
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
