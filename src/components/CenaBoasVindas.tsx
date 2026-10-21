/**
 * Cena de boas-vindas — badge "41 anos" com a imagem original da marca.
 *
 * Mostra a imagem oficial do badge "41 anos" (quadrado verde com "41"
 * e "anos" na vertical) flutuando suavemente sobre o fundo.
 */

export default function CenaBoasVindas() {
  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
      {/* Badge original da marca — com efeito de movimento/flutuação */}
      <div className="boas-vindas-cena-badge relative flex items-center justify-center">
        <img
          src="/41-anos-badge.jpg"
          alt="41 anos"
          className="boas-vindas-cena-placa object-contain"
          style={{ width: "12rem", height: "auto" }}
          draggable={false}
        />
      </div>
    </div>
  );
}
