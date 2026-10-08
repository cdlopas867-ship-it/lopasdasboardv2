/* Fotos reais da empresa Lopas enviadas pelo usuário (biblioteca de imagens). */
import jardim from "@/assets/login/lopas-aerea-jardim.webp.asset.json";
import vale from "@/assets/login/lopas-aerea-vale.webp.asset.json";
import montanhas from "@/assets/login/lopas-aerea-montanhas.webp.asset.json";
import verde from "@/assets/login/lopas-aerea-verde.webp.asset.json";
import patio from "@/assets/login/lopas-patio.webp.asset.json";
import fabrica from "@/assets/resumo/lopas-fabrica-aerea.webp.asset.json";
import jardim2 from "@/assets/resumo/lopas-jardim-aereo.webp.asset.json";
import vale2 from "@/assets/resumo/lopas-vale-aereo.webp.asset.json";
import verde2 from "@/assets/resumo/lopas-verde-aereo.webp.asset.json";

export const FOTOS_LOGIN: string[] = [jardim, vale, montanhas, verde, patio].map((a) => a.url);
export const FOTOS_RESUMO: string[] = [fabrica, jardim2, vale2, verde2, jardim, montanhas, patio].map((a) => a.url);
