/**
 * Cena de boas-vindas — badge "41 anos" no estilo da marca.
 *
 * Quadrado arredondado verde (#76B82A), levemente inclinado no sentido
 * anti-horário. "4" e "1" em Poppins bold branco (o "4" ligeiramente
 * maior que o "1"), "anos" escrito na vertical dentro da haste do "1".
 * Slogan embaixo: "inovando para / transformar o / jeito de viver",
 * com apenas "viver" em negrito.
 *
 * Animação: surge com scale + blur + fade, flutua levemente e some
 * com fade-out gradativo.
 */

const VERDE = "#76B82A";
const FONTE_NUMEROS = "'Poppins', 'Inter', system-ui, sans-serif";
const FONTE_TEXTO = "'Inter', 'Nunito', system-ui, sans-serif";

export default function CenaBoasVindas() {
  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
      {/* Badge — quadrado arredondado verde, levemente inclinado */}
      <div className="boas-vindas-cena-badge relative flex items-center justify-center">
        <div
          className="boas-vindas-cena-placa relative flex items-center justify-center"
          style={{
            width: "10.5rem",
            height: "10.5rem",
            backgroundColor: VERDE,
            borderRadius: "1.75rem",
            boxShadow:
              "0 20px 45px -10px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.22), inset 0 -3px 0 rgba(0,0,0,0.08)",
          }}
        >
          {/* "4" à esquerda (ligeiramente maior) e "1" à direita */}
          <div
            className="relative flex items-baseline"
            style={{ overflow: "visible" }}
          >
            <span
              className="boas-vindas-cena-numero boas-vindas-cena-numero-4"
              style={{
                fontSize: "5.5rem",
                fontWeight: 800,
                color: "#ffffff",
                fontFamily: FONTE_NUMEROS,
                lineHeight: 0.8,
                letterSpacing: "-0.04em",
              }}
            >
              4
            </span>
            <span
              className="relative boas-vindas-cena-numero boas-vindas-cena-numero-1"
              style={{
                fontSize: "5rem",
                fontWeight: 800,
                color: "#ffffff",
                fontFamily: FONTE_NUMEROS,
                lineHeight: 0.8,
                letterSpacing: "-0.04em",
              }}
            >
              1
              {/* "anos" vertical dentro da haste do "1" */}
              <span
                className="boas-vindas-cena-anos absolute"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  color: VERDE,
                  fontFamily: FONTE_TEXTO,
                  fontWeight: 700,
                  fontSize: "0.6rem",
                  lineHeight: 1,
                  writingMode: "vertical-rl",
                  textOrientation: "mixed",
                  textTransform: "lowercase",
                  letterSpacing: "0.08em",
                }}
              >
                anos
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Slogan — 3 linhas, apenas "viver" em destaque */}
      <div className="mt-6 space-y-0.5" style={{ fontFamily: FONTE_TEXTO }}>
        <p className="boas-vindas-cena-linha text-lg font-normal text-white drop-shadow-md sm:text-2xl">
          inovando para
        </p>
        <p className="boas-vindas-cena-linha text-lg font-normal text-white drop-shadow-md sm:text-2xl">
          transformar o
        </p>
        <p className="boas-vindas-cena-linha-destaque text-lg font-normal text-white drop-shadow-md sm:text-2xl">
          jeito de <span className="font-bold">viver</span>
        </p>
      </div>
    </div>
  );
}
