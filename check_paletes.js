const XLSX = require("xlsx");
const path = require("path");

// Read estoque
const estoqueWb = XLSX.readFile("public/planilhas/estoque.xlsx");

// Find the Base Estoque sheet
let estoqueItems = [];
for (const name of estoqueWb.SheetNames) {
  const ws = estoqueWb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const headerIdx = rows.findIndex(r => {
    if (!r) return false;
    const up = r.map(c => String(c ?? "").toUpperCase().trim());
    return up.some(h => h === "SALDO" || h === "SALDO FOCCO") &&
           up.some(h => h.includes("CUSTO MEDIO") || h.includes("CUSTO MÉDIO")) &&
           up.some(h => h === "ITEM");
  });
  if (headerIdx < 0) continue;
  const headers = rows[headerIdx].map(c => String(c ?? "").toUpperCase().trim());
  const cItem = headers.findIndex(h => h === "ITEM");
  const cSaldo = headers.findIndex(h => h === "SALDO" || h === "SALDO FOCCO");
  if (cItem < 0 || cSaldo < 0) continue;
  for (const r of rows.slice(headerIdx + 1)) {
    if (!r) continue;
    const item = String(r[cItem] ?? "").trim();
    if (!item) continue;
    const saldo = Number(r[cSaldo] ?? 0) || 0;
    if (!saldo) continue;
    estoqueItems.push({ item, saldo });
  }
  break;
}
console.log("Estoque items:", estoqueItems.length);

// Read paletes
const paletesWb = XLSX.readFile("public/planilhas/paletes.xlsx");
const paletesMap = new Map();

function parsePalletInfo(text) {
  const s = text.toUpperCase().trim();
  if (!s) return null;
  const sizeMatch = s.match(/\b(GG|G|M|P)\b\s*[=:]?/);
  if (!sizeMatch) return null;
  const tamanho = sizeMatch[1];
  const endMatch = s.match(/(\d+)\s*UND?\s*$/);
  if (endMatch) return { tamanho, undPorPalete: Number(endMatch[1]) };
  const colonMatch = s.match(/:\s*(\d+)\s*UN/);
  if (colonMatch) return { tamanho, undPorPalete: Number(colonMatch[1]) };
  const cslash = s.match(/C\/\s*(\d+)\s*UN/);
  if (cslash) return { tamanho, undPorPalete: Number(cslash[1]) };
  return null;
}

for (const name of paletesWb.SheetNames) {
  const ws = paletesWb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const headerIdx = rows.findIndex(r => 
    r?.some(c => String(c ?? "").toUpperCase().includes("COD ITEM") || 
                 String(c ?? "").toUpperCase().includes("PALLET FORRO"))
  );
  if (headerIdx < 0) continue;
  const headers = rows[headerIdx].map(c => String(c ?? "").toUpperCase().trim());
  const cItem = headers.findIndex(h => h === "COD ITEM" || h.includes("COD ITEM"));
  const cPallet = headers.findIndex(h => h.includes("PALLET"));
  if (cItem < 0 || cPallet < 0) continue;
  for (const r of rows.slice(headerIdx + 1)) {
    if (!r) continue;
    const item = String(r[cItem] ?? "").trim();
    if (!item) continue;
    const palletStr = String(r[cPallet] ?? "").trim();
    const info = parsePalletInfo(palletStr);
    if (!info) continue;
    paletesMap.set(item, { item, ...info });
  }
  break;
}
console.log("Paletes map size:", paletesMap.size);

// Calculate with ceil
let ceilTotal = 0;
let floorTotal = 0;
let exactTotal = 0;
let matchedItems = 0;
const bySizeCeil = {};
const bySizeFloor = {};

for (const it of estoqueItems) {
  const pallet = paletesMap.get(it.item);
  if (!pallet || pallet.undPorPalete <= 0) continue;
  matchedItems++;
  const ceil = Math.ceil(it.saldo / pallet.undPorPalete);
  const floor = Math.floor(it.saldo / pallet.undPorPalete);
  ceilTotal += ceil;
  floorTotal += floor;
  exactTotal += it.saldo / pallet.undPorPalete;
  bySizeCeil[pallet.tamanho] = (bySizeCeil[pallet.tamanho] ?? 0) + ceil;
  bySizeFloor[pallet.tamanho] = (bySizeFloor[pallet.tamanho] ?? 0) + floor;
}

console.log("\nMatched items:", matchedItems);
console.log("Ceil total:", ceilTotal, JSON.stringify(bySizeCeil));
console.log("Floor total:", floorTotal, JSON.stringify(bySizeFloor));
console.log("Exact total (no rounding):", exactTotal.toFixed(2));
