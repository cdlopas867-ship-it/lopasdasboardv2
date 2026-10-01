import { useEffect, useState } from "react";
import jardimAsset from "@/assets/login/lopas-aerea-jardim.webp.asset.json";

/* Fundo do resumo: alterna entre a imagem de satélite e a aérea com jardim,
   ambas com o mesmo movimento contínuo de câmera (Ken Burns) da imagem antiga. */

const IMAGENS = ["/fundo-satelite-real.jpg?v=1", jardimAsset.url];
const INTERVALO = 12000;

export default function ResumoBg() {
  const [atual, setAtual] = useState(0);

  // Pré-carrega as imagens para o crossfade não piscar
  useEffect(() => {
    IMAGENS.forEach((src) => {
      const imagem = new Image();
      imagem.src = src;
    });
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setAtual((i) => (i + 1) % IMAGENS.length), INTERVALO);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#2e3f14]" aria-hidden="true">
      {IMAGENS.map((src, i) => (
        <div
          key={src}
          className="video-kenburns absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out"
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === atual ? 1 : 0,
            willChange: "opacity, transform",
          }}
        />
      ))}
    </div>
  );
}
