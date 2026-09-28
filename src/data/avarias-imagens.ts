import imgAvariaPallet from "@/assets/avarias/avaria-pallet.jpg";
import imgAvariaCaixa from "@/assets/avarias/avaria-caixa.jpg";
import imgAvariaRotulada from "@/assets/avarias/avaria-rotulada.jpg";
import imgAvariaEspelho from "@/assets/avarias/avaria-espelho.jpg";
import imgAvariaMolhado from "@/assets/avarias/avaria-molhado.jpg";
import imgAvariaSeparacao from "@/assets/avarias/avaria-separacao.jpg";
import imgAvariaConferencia from "@/assets/avarias/avaria-conferencia.jpg";
import imgAvariaEtiqueta from "@/assets/avarias/avaria-etiqueta.jpg";
import imgAvariaEmpilhadeira from "@/assets/avarias/avaria-empilhadeira.jpg";

const normalizarMotivo = (motivo = "") =>
  String(motivo)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

const BASE_IMAGENS: Record<string, string> = {
  "PREGO NO PALETE": imgAvariaPallet,
  DANIFICADO: imgAvariaCaixa,
  "ESPELHO QUEBRADO": imgAvariaEspelho,
  MOLHADO: imgAvariaMolhado,
  EMPILHADEIRA: imgAvariaEmpilhadeira,
  SEPARACAO: imgAvariaSeparacao,
  "SEPARAÇÃO": imgAvariaSeparacao,
  "CONFERENTE CARGA": imgAvariaConferencia,
  "CONFERENCIA CARGA": imgAvariaConferencia,
  "ETIQUETA TROCADA": imgAvariaEtiqueta,
};

const IMAGENS_AVARIA: Record<string, string> = Object.fromEntries(
  Object.entries(BASE_IMAGENS).map(([key, imagem]) => [normalizarMotivo(key), imagem]),
);

/** Todas as URLs de imagens de avaria (únicas) — para preloading. */
export const TODAS_IMAGENS_AVARIA = [...new Set(Object.values(BASE_IMAGENS))];

export function imagemAvaria(motivo: string): string {
  const chave = normalizarMotivo(motivo);
  return IMAGENS_AVARIA[chave] ?? imgAvariaRotulada;
}

/** Retorna true apenas quando o motivo tem uma imagem real cadastrada (não fallback). */
export function temImagemAvaria(motivo: string): boolean {
  const chave = normalizarMotivo(motivo);
  return chave in IMAGENS_AVARIA;
}
