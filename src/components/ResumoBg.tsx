import jardimAsset from "@/assets/resumo/lopas-jardim-aereo.webp.asset.json";
import fabricaAsset from "@/assets/resumo/lopas-fabrica-aerea.webp.asset.json";
import valeAsset from "@/assets/resumo/lopas-vale-aereo.webp.asset.json";
import verdeAsset from "@/assets/resumo/lopas-verde-aereo.webp.asset.json";

const IMAGENS = [
  jardimAsset.url,
  fabricaAsset.url,
  valeAsset.url,
  verdeAsset.url,
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