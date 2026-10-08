/**
 * Tela de boas-vindas em tela cheia — imagem de satélite do CD Lopas
 * com os dizeres "Lopas" e "Movidos pela fé", efeito surgir e sumir.
 */
export default function TelaBoasVindas() {
  return (
    <div className="boas-vindas-overlay fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
      {/* Imagem de satélite */}
      <div
        className="boas-vindas-bg absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/__l5e/assets-v1/b47b6349-333e-45b3-8e02-3e806841bcf4/lopas-aerea-jardim.webp')" }}
      />
      <div className="absolute inset-0 bg-black/35" />

      {/* Dizeres da marca */}
      <div className="relative z-10 text-center">
        <p className="boas-vindas-texto font-serif text-5xl tracking-tight text-white drop-shadow-lg sm:text-7xl">
          Lopas
        </p>
        <p className="boas-vindas-texto-2 mt-3 text-xs font-semibold tracking-[0.4em] text-white/90 uppercase drop-shadow-md sm:text-sm">
          Movidos pela fé
        </p>
      </div>
    </div>
  );
}
