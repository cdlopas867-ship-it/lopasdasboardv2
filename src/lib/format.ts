/* Formatadores pt-BR manuais — não dependem do ICU/Intl do dispositivo.
   Em alguns dispositivos móveis, toLocaleString("pt-BR") ignora o locale
   e usa o formato do sistema operacional, causando separadores errados
   (ex: "1,234.56" em vez de "1.234,56"). */

/** Formata com casas decimais fixas (minimumFractionDigits === maximumFractionDigits). */
function fmtBr(num: number, decimals = 0): string {
  const fixed = Math.abs(num).toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  const intFormatted = (intPart ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = num < 0 ? "-" : "";
  return decPart ? `${sign}${intFormatted},${decPart}` : `${sign}${intFormatted}`;
}

/** Formata com no máximo N casas decimais (sem zeros à direita).
 *  Equivalente a toLocaleString("pt-BR", { maximumFractionDigits: n }). */
function fmtBrMax(num: number, maxDecimals = 0): string {
  const factor = Math.pow(10, maxDecimals);
  const rounded = Math.round(Math.abs(num) * factor) / factor;
  let str = rounded.toFixed(maxDecimals);
  if (str.includes(".")) str = str.replace(/0+$/, "").replace(/\.$/, "");
  const [intPart, decPart] = str.split(".");
  const intFormatted = (intPart ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = num < 0 ? "-" : "";
  return decPart ? `${sign}${intFormatted},${decPart}` : `${sign}${intFormatted}`;
}

export { fmtBr, fmtBrMax };

export const fmtInt = (v: number): string => fmtBr(Math.round(v));

export const fmtDec = (v: number, d = 1): string => fmtBr(v, d);

/** Equivalente a toLocaleString("pt-BR", { maximumFractionDigits: d }). */
export const fmtDecMax = (v: number, d = 1): string => fmtBrMax(v, d);

export const fmtMi = (v: number): string => `R$ ${fmtBr(v / 1e6, 2)} mi`;

/** fmtTon com 0 casas (arredondado). */
export const fmtTon = (v: number): string => `${fmtInt(v)} t`;

/** fmtTon com 1 casa decimal. */
export const fmtTonDec = (v: number): string => `${fmtBrMax(v, 1)} t`;

export const fmtPct = (v: number): string => `${fmtBrMax(v * 100, 1)}%`;

/** Porcentagem com sinal de + para valores positivos. */
export const fmtPctSigned = (v: number): string =>
  `${v >= 0 ? "+" : ""}${fmtBrMax(v, 1)}%`;

export const fmtMoeda = (v: number): string => `R$ ${fmtBr(Math.round(v))}`;

export const fmtMoeda2 = (v: number): string => `R$ ${fmtBr(v, 2)}`;

export const fmtPeso = (kg: number): string => {
  if (kg >= 1000) return `${fmtBrMax(kg / 1000, 1)} t`;
  return `${fmtBrMax(kg, 1)} kg`;
};
