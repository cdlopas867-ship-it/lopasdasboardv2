const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configurar autenticação com Google Drive
const drive = google.drive({ version: 'v3', auth: getAuthClient() });

// ID da pasta do Drive que você quer sincronizar
const DRIVE_FOLDER_ID = '16WJaYavcR8B1QgpVsT51Kg0_ADJsSGtQ';
const LOCAL_DIR = './drive-sync';

async function syncWithDrive() {
  try {
    console.log('🔄 Iniciando sincronização com Google Drive...');
    
    // Criar pasta local se não existir
    if (!fs.existsSync(LOCAL_DIR)) {
      fs.mkdirSync(LOCAL_DIR, { recursive: true });
    }

    // Buscar arquivos da pasta do Drive
    const files = await drive.files.list({
      q: `'${DRIVE_FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, modifiedTime)',
      pageSize: 1000,
    });

    console.log(`📁 Encontrados ${files.data.files.length} arquivos`);

    // Download de cada arquivo
    for (const file of files.data.files) {
      await downloadFile(file);
    }

    // Fazer commit e push no GitHub
    await commitAndPush();
    console.log('✅ Sincronização concluída!');

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }
}

async function downloadFile(file) {
  const filePath = path.join(LOCAL_DIR, file.name);
  
  try {
    const res = await drive.files.get(
      { fileId: file.id, alt: 'media' },
      { responseType: 'stream' }
    );

    return new Promise((resolve, reject) => {
      res.data
        .pipe(fs.createWriteStream(filePath))
        .on('finish', () => {
          console.log(`✓ ${file.name}`);
          resolve();
        })
        .on('error', reject);
    });
  } catch (error) {
    console.error(`Erro ao baixar ${file.name}:`, error);
  }
}

async function commitAndPush() {
  return new Promise((resolve, reject) => {
    const commands = [
      'git add .',
      'git commit -m "🔄 Sincronização automática com Google Drive" || true',
      'git push origin main',
    ];

    exec(commands.join(' && '), (error, stdout, stderr) => {
      if (error) {
        console.error('Erro no push:', error);
        reject(error);
      } else {
        console.log('📤 Arquivos enviados para GitHub');
        resolve();
      }
    });
  });
}

function getAuthClient() {
  // Use variáveis de ambiente para credenciais
  // Configure no GitHub Actions ou localmente
  const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS || '{}');
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
}

// Executar sincronização
syncWithDrive();
