/* Fundo do resumo — fotos reais da Lopas que se alternam a cada cena. */
import { FOTOS_RESUMO } from "@/data/fotos-lopas";

const IMAGENS = FOTOS_RESUMO;

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
