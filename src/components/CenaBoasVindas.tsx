/**
 * Cena de boas-vindas — composição de abertura do app Lopas 2026.
 *
 * Trevo/logo da marca no topo, badge "41 anos" ao centro com flutuação
 * suave, nome "Móveis Lopas" e tagline "Movidos pela fé" surgindo em
 * camadas sobre o fundo do CD.
 */

export default function CenaBoasVindas() {
  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
      {/* Trevo/logo da marca */}
      <img
        src="/trevo-lopas.png"
        alt="Lopas"
        className="boas-vindas-cena-logo mb-6 object-contain"
        style={{ width: "3.5rem", height: "auto", opacity: 0.85 }}
        draggable={false}
      />

      {/* Badge "41 anos" — imagem original da marca com flutuação */}
      <div className="boas-vindas-cena-badge relative flex items-center justify-center">
        <img
          src="/41-anos-badge.jpg"
          alt="41 anos Lopas"
          className="object-contain"
          style={{ width: "10rem", height: "auto" }}
          draggable={false}
        />
      </div>

      {/* Nome da empresa */}
      <h1
        className="boas-vindas-cena-titulo mt-7 font-serif text-3xl font-light tracking-wide text-white drop-shadow-lg sm:text-4xl"
        style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
      >
        Móveis Lopas
      </h1>

      {/* Tagline */}
      <p className="boas-vindas-cena-tagline mt-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#c9e39a] sm:text-xs">
        Movidos pela fé
      </p>
    </div>
  );
}
