/**
 * Cena de boas-vindas — badge "41 anos" elegante e elaborado.
 *
 * Losango verde (quadrado rotacionado 45°) com halo luminoso, "4" e "1"
 * em serifada Instrument Serif (branco, com brilho e sombra), "ANOS"
 * em preto na vertical dentro da haste do "1". "Há" acima, "inovando
 * para transformar o jeito de viver" embaixo, com "viver" em destaque.
 *
 * Animação suave: surge com scale + blur + fade encadeados, flutua
 * levemente e some com fade-out gradativo.
 */

const VERDE = "#8DC63F";
const FONTE_NUMEROS = '"Instrument Serif", "Playfair Display", Georgia, serif';
const FONTE_TEXTO = "'Nunito', 'Quicksand', 'Segoe UI Rounded', system-ui, sans-serif";

export default function CenaBoasVindas() {
  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
      {/* Halo luminoso atrás do badge — cresce suavemente */}
      <div
        className="boas-vindas-cena-halo pointer-events-none absolute"
        style={{
          width: "20rem",
          height: "20rem",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(141,198,63,0.18) 0%, rgba(141,198,63,0.06) 40%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      {/* "Há" acima do badge */}
      <p
        className="boas-vindas-cena-ha text-2xl font-medium text-white drop-shadow-lg sm:text-4xl"
        style={{ fontFamily: FONTE_TEXTO }}
      >
        Há
      </p>

      {/* Badge losango verde + 41 branco + ANOS preto vertical */}
      <div
        className="boas-vindas-cena-badge relative my-3 flex items-center justify-center"
        style={{ width: "16rem", height: "16rem" }}
      >
        {/* Anel decorativo atrás do losango — surge com o badge */}
        <div
          className="boas-vindas-cena-anel absolute"
          style={{
            width: "11rem",
            height: "11rem",
            borderRadius: "50%",
            border: "2px solid rgba(141,198,63,0.25)",
            boxShadow: "0 0 30px rgba(141,198,63,0.15)",
          }}
        />

        {/* Losango verde (quadrado rotacionado 45°) — com brilho elaborado */}
        <div
          className="boas-vindas-cena-losango absolute"
          style={{
            width: "9.5rem",
            height: "9.5rem",
            backgroundColor: VERDE,
            borderRadius: "1.5rem",
            transform: "rotate(45deg)",
            boxShadow:
              "0 25px 50px -12px rgba(0,0,0,0.55), inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -3px 0 rgba(0,0,0,0.08)",
          }}
        />

        {/* "4" e "1" em serifada elegante, sobrepostos, horizontais */}
        <div
          className="relative flex items-center"
          style={{ overflow: "visible" }}
        >
          <span
            className="boas-vindas-cena-numero boas-vindas-cena-numero-4"
            style={{
              fontSize: "9rem",
              fontWeight: 400,
              color: "#ffffff",
              fontFamily: FONTE_NUMEROS,
              lineHeight: 0.85,
              letterSpacing: "-0.04em",
              textShadow:
                "0 2px 4px rgba(0,0,0,0.25), 0 4px 12px rgba(141,198,63,0.15)",
            }}
          >
            4
          </span>
          <span
            className="relative boas-vindas-cena-numero boas-vindas-cena-numero-1"
            style={{
              fontSize: "9rem",
              fontWeight: 400,
              color: "#ffffff",
              fontFamily: FONTE_NUMEROS,
              lineHeight: 0.85,
              letterSpacing: "-0.04em",
              marginLeft: "-0.35em",
              textShadow:
                "0 2px 4px rgba(0,0,0,0.25), 0 4px 12px rgba(141,198,63,0.15)",
            }}
          >
            1
            {/* Texto ancorado à haste do próprio número, não ao badge. */}
            <span
              className="boas-vindas-cena-anos absolute"
              style={{
                left: "55%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                color: "#1a1a1a",
                fontFamily: FONTE_TEXTO,
                fontWeight: 800,
                fontSize: "0.7rem",
                lineHeight: 1,
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
              }}
            >
              anos
            </span>
          </span>
        </div>
      </div>

      {/* Texto inferior — 3 linhas, "viver" em destaque */}
      <div className="mt-2 space-y-0.5" style={{ fontFamily: FONTE_TEXTO }}>
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
