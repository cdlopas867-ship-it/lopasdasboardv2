const XLSX = require('xlsx');
const fs = require('fs');

// Download the file
const https = require('https');
const http = require('http');

function download(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const url = 'https://media.base44.com/files/public/6ad1f191b2a4339f3977ea13/a329390fd_Acertodeestoque-WF0097-2026-10-16.xlsx';
  const buf = await download(url);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets['Resultado'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
  
  // Row 0: title info, Row 1: headers, Row 2+: data
  const headers = rows[1];
  console.log('Headers:', JSON.stringify(headers));
  console.log('Total rows:', rows.length);
  
  // Parse data rows (skip first 2 rows)
  const data = [];
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    // Check if it's a footer row
    if (typeof r[0] === 'string' && (r[0].includes('Copyright') || r[0].includes('FullSoft'))) continue;
    data.push({
      data: r[0],
      almox: r[1],
      item: r[2],
      desc: r[3],
      colaborador: r[4],
      endereco: r[5],
      qtdAntes: r[6],
      qtdAcerto: r[8],
      qtdDepois: r[10],
      tipoMov: r[12],
      lote: r[13],
      observacao: r[15],
    });
  }
  
  console.log('Data rows:', data.length);
  
  // 1. Count by Tipo Movimentação
  const tipoCount = {};
  data.forEach(d => {
    const t = d.tipoMov || '(vazio)';
    tipoCount[t] = (tipoCount[t] || 0) + 1;
  });
  console.log('\n=== Tipos de Movimentação ===');
  Object.entries(tipoCount).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
  
  // 2. Count by Colaborador
  const colabCount = {};
  data.forEach(d => {
    const c = d.colaborador || '(vazio)';
    colabCount[c] = (colabCount[c] || 0) + 1;
  });
  console.log('\n=== Colaboradores (top 20) ===');
  Object.entries(colabCount).sort((a,b) => b[1]-a[1]).slice(0,20).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
  console.log('Total colaboradores únicos:', Object.keys(colabCount).length);
  
  // 3. Count unique endereços
  const enderecos = new Set();
  data.forEach(d => {
    if (d.endereco) enderecos.add(d.endereco);
  });
  console.log('\n=== Endereços ===');
  console.log('Total endereços únicos com acertos:', enderecos.size);
  
  // 4. Count by day
  const diaCount = {};
  data.forEach(d => {
    if (d.data) {
      const dia = String(d.data).substring(0, 10); // date part
      diaCount[dia] = (diaCount[dia] || 0) + 1;
    }
  });
  console.log('\n=== Por dia (top 10) ===');
  Object.entries(diaCount).sort((a,b) => b[1]-a[1]).slice(0,10).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
  
  // 5. Count by month
  const mesCount = {};
  data.forEach(d => {
    if (d.data) {
      const mes = String(d.data).substring(3, 5); // MM from DD/MM/YYYY
      mesCount[mes] = (mesCount[mes] || 0) + 1;
    }
  });
  console.log('\n=== Por mês ===');
  Object.entries(mesCount).sort().forEach(([k,v]) => console.log(`  ${k}: ${v}`));
  
  // 6. Observação types
  const obsCount = {};
  data.forEach(d => {
    const o = d.observacao || '(vazio)';
    obsCount[o] = (obsCount[o] || 0) + 1;
  });
  console.log('\n=== Observações ===');
  Object.entries(obsCount).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
  
  // 7. Check for ASTEC in enderecos
  const astecEnd = [...enderecos].filter(e => /astec/i.test(e));
  console.log('\n=== Endereços ASTEC ===');
  console.log('Count:', astecEnd.length);
  console.log(astecEnd.slice(0, 10));
  
  // 8. Check almox values
  const almoxCount = {};
  data.forEach(d => {
    const a = d.almox || '(vazio)';
    almoxCount[a] = (almoxCount[a] || 0) + 1;
  });
  console.log('\n=== Almoxarifados ===');
  Object.entries(almoxCount).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
  
  // 9. Date range
  const dates = data.map(d => d.data).filter(Boolean).sort();
  console.log('\n=== Período ===');
  console.log('Início:', dates[0]);
  console.log('Fim:', dates[dates.length-1]);
  
  // 10. Total acertos (sum of qtdAcerto)
  const totalQtdAcerto = data.reduce((s, d) => s + (Number(d.qtdAcerto) || 0), 0);
  console.log('\nTotal Qtd Acerto:', totalQtdAcerto);
  
  // Save processed data for later use
  const result = {
    total: data.length,
    tipos: Object.entries(tipoCount).sort((a,b) => b[1]-a[1]).map(([k,v]) => ({tipo: k, count: v})),
    colaboradores: Object.entries(colabCount).sort((a,b) => b[1]-a[1]).map(([k,v]) => ({nome: k, count: v})),
    totalColaboradores: Object.keys(colabCount).length,
    totalEnderecos: enderecos.size,
    enderecos: [...enderecos].sort(),
    porMes: Object.entries(mesCount).sort().map(([k,v]) => ({mes: k, count: v})),
    porDia: Object.entries(diaCount).sort().map(([k,v]) => ({dia: k, count: v})),
    observacoes: Object.entries(obsCount).sort((a,b) => b[1]-a[1]).map(([k,v]) => ({obs: k, count: v})),
    periodoInicio: dates[0],
    periodoFim: dates[dates.length-1],
    totalQtdAcerto,
    almox: Object.entries(almoxCount).sort((a,b) => b[1]-a[1]).map(([k,v]) => ({almox: k, count: v})),
  };
  fs.writeFileSync('/tmp/acertos_data.json', JSON.stringify(result, null, 2));
  console.log('\nSaved to /tmp/acertos_data.json');
}
main().catch(console.error);
