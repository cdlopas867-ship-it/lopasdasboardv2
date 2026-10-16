const XLSX = require('xlsx');
const https = require('https');
const http = require('http');
const fs = require('fs');

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
  
  // Parse data rows (skip first 2 rows - title and header)
  const data = [];
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    // Skip footer rows
    if (typeof r[0] === 'string' && (r[0].includes('Copyright') || r[0].includes('FullSoft'))) continue;
    // Skip header repeat
    if (r[0] === 'Data') continue;
    
    const dataStr = String(r[0] || '');
    const tipoMov = String(r[12] || '');
    const colab = String(r[4] || '');
    const endereco = String(r[5] || '');
    
    // Skip invalid rows
    if (!dataStr || dataStr === 'Data' || !tipoMov || tipoMov === 'Tipo Movimentação') continue;
    if (tipoMov === 'DESABILITADO') continue;
    
    // Parse date: DD/MM/YYYY HH:MM:SS
    const dateMatch = dataStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    const mes = dateMatch ? dateMatch[2] : null;
    const dia = dateMatch ? dateMatch[1] + '/' + dateMatch[2] : null;
    
    // Check if ASTEC address
    const isAstec = /astec/i.test(endereco);
    
    data.push({
      data: dataStr,
      mes,
      dia,
      colaborador: colab,
      endereco,
      tipoMov,
      isAstec,
      qtdAcerto: Number(r[8]) || 0,
    });
  }
  
  // Filter out ASTEC
  const dataSemAstec = data.filter(d => !d.isAstec);
  console.log('Total rows (sem ASTEC):', dataSemAstec.length);
  console.log('ASTEC rows filtered:', data.length - dataSemAstec.length);
  
  // 1. Tipos de acerto
  const tipoCount = {};
  dataSemAstec.forEach(d => {
    tipoCount[d.tipoMov] = (tipoCount[d.tipoMov] || 0) + 1;
  });
  const tipos = Object.entries(tipoCount).sort((a,b) => b[1]-a[1]).map(([tipo, count]) => ({
    tipo, count, pct: (count / dataSemAstec.length * 100)
  }));
  console.log('\n=== Tipos ===');
  tipos.forEach(t => console.log(`  ${t.tipo}: ${t.count} (${t.pct.toFixed(1)}%)`));
  
  // 2. Colaboradores - total e por mês
  const colabData = {};
  dataSemAstec.forEach(d => {
    if (!colabData[d.colaborador]) {
      colabData[d.colaborador] = { nome: d.colaborador, total: 0, meses: {} };
    }
    colabData[d.colaborador].total++;
    if (d.mes) {
      colabData[d.colaborador].meses[d.mes] = (colabData[d.colaborador].meses[d.mes] || 0) + 1;
    }
  });
  
  const totalAcertos = dataSemAstec.length;
  const colaboradores = Object.values(colabData)
    .sort((a,b) => b.total - a.total)
    .map(c => ({
      nome: c.nome,
      total: c.total,
      pct: (c.total / totalAcertos * 100),
      meses: c.meses,
    }));
  console.log('\n=== Top 10 Colaboradores ===');
  colaboradores.slice(0, 10).forEach(c => console.log(`  ${c.nome}: ${c.total} (${c.pct.toFixed(1)}%)`));
  console.log('Total colaboradores:', colaboradores.length);
  
  // 3. Endereços com acertos (sem ASTEC)
  const enderecosComAcerto = new Set();
  dataSemAstec.forEach(d => {
    if (d.endereco) enderecosComAcerto.add(d.endereco);
  });
  console.log('\nEndereços com acertos (sem ASTEC):', enderecosComAcerto.size);
  
  // 4. Por mês (total acertos)
  const mesCount = {};
  dataSemAstec.forEach(d => {
    if (d.mes) mesCount[d.mes] = (mesCount[d.mes] || 0) + 1;
  });
  const mesesNomes = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
  };
  const porMes = Object.entries(mesCount).sort().map(([mes, count]) => ({
    mes: mesesNomes[mes] || mes,
    mesNum: mes,
    count,
    pct: (count / totalAcertos * 100)
  }));
  console.log('\n=== Por mês ===');
  porMes.forEach(m => console.log(`  ${m.mes}: ${m.count} (${m.pct.toFixed(1)}%)`));
  
  // 5. Por dia (top 10)
  const diaCount = {};
  dataSemAstec.forEach(d => {
    if (d.dia) diaCount[d.dia] = (diaCount[d.dia] || 0) + 1;
  });
  const porDia = Object.entries(diaCount).sort((a,b) => b[1]-a[1]).slice(0, 10).map(([dia, count]) => ({
    dia, count, pct: (count / totalAcertos * 100)
  }));
  console.log('\n=== Top 10 dias ===');
  porDia.forEach(d => console.log(`  ${d.dia}: ${d.count} (${d.pct.toFixed(1)}%)`));
  
  // 6. Observações
  const obsCount = {};
  dataSemAstec.forEach(d => {
    const obs = d.observacao || '(vazio)';
    // We didn't capture observacao - let me re-read
  });
  
  // Periodo
  const dates = dataSemAstec.map(d => d.data).filter(d => d.match(/^\d{2}\/\d{2}\/\d{4}/)).sort();
  console.log('\nPeríodo:', dates[0], 'a', dates[dates.length-1]);
  
  // Total enderecos CD (from ocupacao data: 5970)
  const TOTAL_ENDERECOS_CD = 5970;
  const enderecosSemAcerto = TOTAL_ENDERECOS_CD - enderecosComAcerto.size;
  const pctComAcerto = (enderecosComAcerto.size / TOTAL_ENDERECOS_CD * 100);
  const pctSemAcerto = (enderecosSemAcerto / TOTAL_ENDERECOS_CD * 100);
  console.log('\n=== Endereços ===');
  console.log('Total CD:', TOTAL_ENDERECOS_CD);
  console.log('Com acertos:', enderecosComAcerto.size, `(${pctComAcerto.toFixed(1)}%)`);
  console.log('Sem acertos:', enderecosSemAcerto, `(${pctSemAcerto.toFixed(1)}%)`);
  
  // Build final data structure
  const result = {
    periodoInicio: '02/01/2026',
    periodoFim: '16/10/2026',
    totalAcertos: totalAcertos,
    tipos,
    colaboradores: colaboradores.map(c => ({
      nome: c.nome,
      total: c.total,
      pct: Math.round(c.pct * 10) / 10,
      meses: c.meses,
    })),
    totalColaboradores: colaboradores.length,
    totalEnderecosComAcerto: enderecosComAcerto.size,
    totalEnderecosCD: TOTAL_ENDERECOS_CD,
    enderecosSemAcerto,
    pctComAcerto: Math.round(pctComAcerto * 10) / 10,
    pctSemAcerto: Math.round(pctSemAcerto * 10) / 10,
    porMes,
    porDia,
  };
  
  fs.writeFileSync('/tmp/acertos_final.json', JSON.stringify(result, null, 2));
  console.log('\nSaved to /tmp/acertos_final.json');
}
main().catch(console.error);
