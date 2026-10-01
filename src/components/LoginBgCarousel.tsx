import { useEffect, useState } from "react";
import jardimAsset from "@/assets/login/lopas-aerea-jardim.webp.asset.json";
import valeAsset from "@/assets/login/lopas-aerea-vale.webp.asset.json";
import montanhasAsset from "@/assets/login/lopas-aerea-montanhas.webp.asset.json";
import patioAsset from "@/assets/login/lopas-patio.webp.asset.json";
import verdeAsset from "@/assets/login/lopas-aerea-verde.webp.asset.json";

const IMAGENS = [
  jardimAsset.url,
  valeAsset.url,
  montanhasAsset.url,
  patioAsset.url,
  verdeAsset.url,
];
const INTERVALO = 6000;

function carregarImagem(src: string) {
  return new Promise<void>((resolve) => {
    const imagem = new Image();
    imagem.decoding = "async";
    imagem.onload = () => resolve();
    imagem.onerror = () => resolve();
    imagem.src = src;
  });
}

/** Fundo do login otimizado: decodifica a próxima imagem antes do crossfade. */
export default function LoginBgCarousel() {
  const [atual, setAtual] = useState(0);
  const [carregadas, setCarregadas] = useState<Set<number>>(() => new Set([0]));

  useEffect(() => {
    let cancelado = false;
    const proximo = (atual + 1) % IMAGENS.length;

    carregarImagem(IMAGENS[atual] ?? "").then(() => {
      if (!cancelado) setCarregadas((anteriores) => new Set(anteriores).add(atual));
    });
    carregarImagem(IMAGENS[proximo] ?? "").then(() => {
      if (!cancelado) setCarregadas((anteriores) => new Set(anteriores).add(proximo));
    });

    return () => {
      cancelado = true;
    };
  }, [atual]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const proximo = (atual + 1) % IMAGENS.length;
      if (carregadas.has(proximo)) setAtual(proximo);
    }, INTERVALO);

    return () => window.clearTimeout(timer);
  }, [atual, carregadas]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#18220f]" aria-hidden="true">
      {IMAGENS.map((src, i) => {
        const deveRenderizar = i === atual || i === (atual + 1) % IMAGENS.length || carregadas.has(i);
        if (!deveRenderizar) return null;

        return (
          <img
            key={src}
            src={src}
            alt=""
            decoding="async"
            fetchPriority={i === 0 ? "high" : "low"}
            className="login-bg-image absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-in-out"
            style={{
              opacity: i === atual ? 1 : 0,
              transform: i === atual ? "scale(1.04)" : "scale(1)",
              transition: "opacity 1000ms ease-in-out, transform 6000ms ease-out",
              willChange: i === atual ? "opacity, transform" : "opacity",
            }}
          />
        );
      })}
    </div>
  );
}
