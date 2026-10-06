const XLSX = require("xlsx");
const wb = XLSX.readFile("/app/public/planilhas/estoque.xlsx");
console.log("SHEETS:", wb.SheetNames);
const ws = wb.Sheets["Resumo"];
if (ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  rows.slice(0, 12).forEach((r, i) => console.log(i, JSON.stringify(r)));
}
