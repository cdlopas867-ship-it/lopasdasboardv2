/* Fotos reais da empresa Lopas enviadas pelo usuário (biblioteca de imagens). */
import jardim from "@/assets/login/lopas-aerea-jardim.webp.asset.json";
import montanhas from "@/assets/login/lopas-aerea-montanhas.webp.asset.json";
import patio from "@/assets/login/lopas-patio.webp.asset.json";
import fabrica from "@/assets/resumo/lopas-fabrica-aerea.webp.asset.json";
import jardim2 from "@/assets/resumo/lopas-jardim-aereo.webp.asset.json";
import vale2 from "@/assets/resumo/lopas-vale-aereo.webp.asset.json";
import verde2 from "@/assets/resumo/lopas-verde-aereo.webp.asset.json";

/* Usa as fotos incluídas no repositório: os links antigos /__l5e não
   estão disponíveis fora da hospedagem original. */
export const FOTOS_LOGIN: string[] = [
  jardim.url,
  "/login-bg-1.jpg",
  "/login-bg-2.jpg",
  "/login-bg-3.jpg",
  "/fundo-satelite.jpg",
];
export const FOTOS_RESUMO: string[] = [fabrica, jardim2, vale2, verde2, jardim, montanhas, patio].map((a) => a.url);
