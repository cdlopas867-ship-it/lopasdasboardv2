/* Fundo do resumo — fotos aéreas da Lopas que se alternam a cada cena.
   As imagens ficam em `public/` (as antigas vinham do CDN do Lovable e não
   existem neste repositório, o que causava 404 e fundo em branco). */

const IMAGENS = [
  "/fundo-satelite-real.jpg",
  "/fundo-satelite.jpg",
  "/fundo-lopas-final.webp",
  "/fundo-apresentacao.jpg",
] as const;

type Props = {
  cena?: number;
};

export default function ResumoBg({ cena = 0 }: Props) {
  const atual = ((cena % IMAGENS.length) + IMAGENS.length) % IMAGENS.length;

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {IMAGENS.map((imagem, indice) => (
        <div
          key={imagem}
          className={`resumo-bg-image absolute inset-0 bg-cover bg-center ${indice === atual ? "resumo-bg-image--ativa" : ""}`}
          style={{ backgroundImage: `url(${imagem})` }}
        />
      ))}
    </div>
  );
}
