/* Cores reais dos acabamentos (máscaras) Lopas — extraídas por amostragem de
   pixels das fotos oficiais de catálogo (Meu Móvel Online / cdn.awsli, set/2026):
   AMENDOA CLEAN #9a7148 (Cama Reali), FRASSINO #7c411b (Bertha/Cômoda Toronto),
   BRANCO #e8e6e2 (Cômoda Toronto), OFF WHITE #ece5da (Bertha Frassino/Off White).
   Máscaras compostas ("BASE#DETALHE") usam a cor da base; tecidos de cadeiras
   (linho, veludo, bouclé, corino...) identificados pelo nome do tecido. */

export function normalizarMascara(m: string): string {
  return m.replace(/^\(\d+\)/, "").replace(/\s+/g, " ").trim().toUpperCase();
}

export function corMascara(mascara: string): string {
  const base = normalizarMascara(mascara.split("#")[0] ?? mascara);
  /* Madeiras / pinturas UV */
  if (base.includes("PRETO")) return "#35322e";
  if (base.includes("OFF WH")) return "#ece5da";
  if (base.includes("BRANCO")) return "#e8e6e2";
  if (base.includes("AMENDOA")) return "#9a7148";
  if (base.includes("FRASSINO")) return "#7c411b";
  if (base.includes("IMBUIA")) return "#6b4525";
  if (base.includes("CINZA")) return "#a8a29c";
  /* Tecidos de assento/encosto (cadeiras) */
  if (base.includes("SALVIA")) return "#9caf88";
  if (base.includes("CAPUCCINO")) return "#a5836a";
  if (base.includes("CARAMELO")) return "#b5763f";
  if (base.includes("CREME")) return "#eee5d4";
  if (base.includes("AVELA")) return "#b98a56";
  if (base.includes("MOSAICO")) return "#b3a08e";
  if (base.includes("RUSTICO")) return "#c8a06a";
  if (base.includes("MARRON") || base.includes("MARROM")) return "#6d4c35";
  if (base.includes("BEGE")) return "#d8c8ad";
  return "#b9ae9c";
}

const PALAVRAS_COR = [
  "PRETO", "OFF WH", "BRANCO", "AMENDOA", "FRASSINO", "IMBUIA", "CINZA",
  "SALVIA", "CAPUCCINO", "CARAMELO", "CREME", "AVELA", "MOSAICO", "RUSTICO",
  "MARRON", "MARROM", "BEGE",
];

/* Máscaras combinadas ("BASE/DETALHE" ou "BASE#DETALHE") têm duas cores:
   devolve cada uma na ordem em que aparece (base primeiro). */
export function coresMascara(mascara: string): string[] {
  const partes = normalizarMascara(mascara)
    .split(/[/#]/)
    .map((p) => p.trim())
    .filter(Boolean);
  const cores = partes
    .filter((p) => PALAVRAS_COR.some((k) => p.includes(k)))
    .map((p) => corMascara(p));
  return cores.length ? [...new Set(cores)] : [corMascara(mascara)];
}

/* Fundo CSS da bolinha de cor — meia a meia quando a máscara tem 2 cores. */
export function fundoMascara(mascara: string): string {
  const cores = coresMascara(mascara);
  return cores.length > 1
    ? `linear-gradient(135deg, ${cores[0]} 50%, ${cores[1]} 50%)`
    : cores[0]!;
}

/* Chave da cor principal da máscara (a base, no caso das combinadas tipo
   "AMENDOA CLEAN/OFF WH") — usada para escolher a foto real da cor. */
export function chaveCor(mascara: string): string | null {
  const base = normalizarMascara(mascara.split("#")[0] ?? mascara);
  const CHAVES: [string, string][] = [
    ["AMENDOA", "AMENDOA"],
    ["FRASSINO", "FRASSINO"],
    ["IMBUIA", "IMBUIA"],
    ["BRANCO", "BRANCO"],
    ["OFF WH", "OFF WHITE"],
    ["PRETO", "PRETO"],
    ["CINZA", "CINZA"],
  ];
  let melhor: string | null = null;
  let melhorPos = Infinity;
  for (const [k, chave] of CHAVES) {
    const pos = base.indexOf(k);
    if (pos >= 0 && pos < melhorPos) {
      melhor = chave;
      melhorPos = pos;
    }
  }
  return melhor;
}

/* Máscaras da família do branco (só branco/off white, sem madeira na base):
   o tingimento normal mantém o brilho da foto, então madeira escura continuaria
   escura — essas cores precisam clarear a foto, não só trocar o tom. */
export function eMascaraBranca(mascara: string): boolean {
  const base = normalizarMascara(mascara.split("#")[0] ?? mascara);
  const temMadeira = ["AMENDOA", "FRASSINO", "IMBUIA", "NOCE", "WENGE"].some((k) => base.includes(k));
  return !temMadeira && (base.includes("BRANCO") || base.includes("OFF WH"));
}

/* Como tratar a foto do item conforme a máscara — o tingimento por cor
   (mix-blend "color") só troca o tom, não o brilho da foto: brancos ficam
   acinzentados e tons escuros (frassino, preto) ficam claros demais.
   "branca" clareia a foto, "preta" escurece, "tingida" também corrige o
   brilho na direção da cor real da máscara. */
export type TratamentoFoto = "sem" | "branca" | "preta" | "tingida";

export function tratamentoFoto(mascara: string): TratamentoFoto {
  if (!mascara.trim() || mascara.trim() === "—") return "sem";
  if (eMascaraBranca(mascara)) return "branca";
  const base = normalizarMascara(mascara.split("#")[0] ?? mascara);
  if (base.includes("PRETO")) return "preta";
  return "tingida";
}
