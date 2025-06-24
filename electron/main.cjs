// Carregar variáveis do .env
require('dotenv').config();

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs/promises');
const childProcess = require('child_process');
const spawn = childProcess.spawn;
const extract = require('extract-zip');
const fsExtra = require('fs');
const AdmZip = require('adm-zip'); // Adicione no topo para extração zip/mcpack

let mainWindow;
let serverProcess = null;
let playitProcess = null;
let serverStatus = 'offline';
let playitStatus = 'disconnected';
let serverStartTime = null;
let statsInterval = null;
// Use SERVER_FILES do .env se existir, senão padrão
const serverFilesDir = process.env.SERVER_FILES || './server-files';
const serverPath = path.isAbsolute(serverFilesDir)
  ? serverFilesDir
  : path.join(process.cwd(), serverFilesDir);

const serverExe = path.join(serverPath, 'bedrock_server.exe');
const playitExe = path.join(serverPath, 'playit', 'playit.exe');
const serverPropsPath = path.join(serverPath, 'server.properties');

// Log de depuração dos caminhos
console.log('[Electron] NODE_ENV:', process.env.NODE_ENV);
console.log('[Electron] SERVER_FILES:', process.env.SERVER_FILES);
console.log('[Electron] serverPath:', serverPath);
console.log('[Electron] serverExe:', serverExe);
console.log('[Electron] playitExe:', playitExe);

// Função para obter IP local
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Função para obter estatísticas reais do servidor
function getServerStats() {
  // TODO: Jogadores online reais (parse do log ou query ao servidor)
  const playersOnline = 0;
  let memory = 0, cpu = 0;
  if (serverProcess && serverProcess.pid) {
    memory = process.memoryUsage().rss / 1024 / 1024;
    // Para CPU, use um pacote como pidusage para precisão real
  }
  const uptime = serverStartTime ? Math.floor((Date.now() - serverStartTime) / 1000) : 0;
  return {
    playersOnline,
    memory: memory.toFixed(1),
    cpu: cpu.toFixed(1),
    uptime
  };
}

function startServerStatsInterval() {
  stopServerStatsInterval();
  statsInterval = setInterval(() => {
    if (mainWindow && serverStatus === 'online') {
      mainWindow.webContents.send('server:stats', getServerStats());
    }
  }, 2000);
}
function stopServerStatsInterval() {
  if (statsInterval) clearInterval(statsInterval);
  statsInterval = null;
}

// IPC: Iniciar servidor
ipcMain.handle('server:start', async () => {
  if (serverProcess) return { success: false, message: 'Servidor já está em execução' };
  try {
    await fs.access(serverExe);
    console.log('[Electron] Iniciando bedrock_server.exe em', serverExe);
    serverProcess = spawn(serverExe, [], { cwd: serverPath, detached: false });

    // Novo: captura erro de spawn (ex: permissão, DLLs, etc)
    serverProcess.on('error', (err) => {
      console.error('[BEDROCK ERROR]', err);
      mainWindow.webContents.send('server:log', {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: `Erro ao iniciar o servidor: ${err.message}`,
        category: 'server'
      });
      mainWindow.webContents.send('server:status-changed', 'offline');
      serverProcess = null;
      serverStatus = 'offline';
    });

    serverProcess.stdout.on('data', (data) => {
      const line = data.toString().trim();
      console.log('[BEDROCK STDOUT]', line);
      mainWindow.webContents.send('server:log', {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: line,
        category: 'server'
      });
      parsePlayerLog(line);
    });
    serverProcess.stderr.on('data', (data) => {
      console.log('[BEDROCK STDERR]', data.toString().trim());
      mainWindow.webContents.send('server:log', {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: data.toString().trim(),
        category: 'server'
      });
    });
    serverProcess.on('exit', (code, signal) => {
      console.log('[BEDROCK EXIT]', code, signal);
      serverProcess = null;
      serverStatus = 'offline';
      mainWindow.webContents.send('server:status-changed', serverStatus);
      mainWindow.webContents.send('server:log', {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `Servidor parado (code: ${code}, signal: ${signal})`,
        category: 'server'
      });
    });

    serverStatus = 'starting';
    mainWindow.webContents.send('server:status-changed', serverStatus);
    serverStartTime = Date.now();

    // Aguarde alguns segundos para considerar como "online"
    setTimeout(() => {
      if (serverProcess) {
        serverStatus = 'online';
        mainWindow.webContents.send('server:status-changed', serverStatus);
      }
    }, 3000);

    startServerStatsInterval();
    mainWindow.webContents.send('server:ip-changed', getLocalIp());
    return { success: true, message: 'Servidor iniciado' };
  } catch (e) {
    console.error('[Electron] Erro ao iniciar o servidor:', e);
    mainWindow && mainWindow.webContents.send('server:log', {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: `Erro ao iniciar o servidor: ${e.message}`,
      category: 'server'
    });
    return { success: false, message: `Erro ao iniciar o servidor: ${e.message}` };
  }
});

// IPC: Parar servidor
ipcMain.handle('server:stop', async () => {
  if (!serverProcess) return { success: false, message: 'Servidor não está em execução' };
  serverProcess.kill();
  serverProcess = null;
  serverStatus = 'offline';
  mainWindow.webContents.send('server:status-changed', serverStatus);
  stopServerStatsInterval();
  serverStartTime = null;
  return { success: true, message: 'Servidor parado' };
});

// IPC: Status do servidor
ipcMain.handle('server:status', async () => serverStatus);

// IPC: IP do servidor
ipcMain.handle('server:get-ip', async () => getLocalIp());

// IPC: Estatísticas do servidor
ipcMain.handle('server:get-stats', async () => getServerStats());

// --- PLAYIT INTEGRAÇÃO ---
ipcMain.handle('playit:start', async () => {
  if (playitProcess) return { success: false, message: 'Playit já está em execução' };
  try {
    await fs.access(playitExe);
    // Apenas execute o playit.exe sem argumentos
    playitProcess = spawn(playitExe, [], { cwd: path.dirname(playitExe) });
    playitStatus = 'connecting';
    mainWindow.webContents.send('playit:status-changed', playitStatus);
    playitProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      mainWindow.webContents.send('playit:log', msg);
      // Opcional: detectar conexão pelo log, se possível
      if (msg.toLowerCase().includes('tunnel established') || msg.toLowerCase().includes('ready')) {
        playitStatus = 'connected';
        mainWindow.webContents.send('playit:status-changed', playitStatus);
      }
    });
    playitProcess.stderr.on('data', (data) => {
      mainWindow.webContents.send('playit:log', data.toString());
    });
    playitProcess.on('exit', () => {
      playitStatus = 'disconnected';
      mainWindow.webContents.send('playit:status-changed', playitStatus);
      playitProcess = null;
    });
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
});

ipcMain.handle('playit:stop', async () => {
  if (!playitProcess) return { success: false };
  playitProcess.kill();
  playitProcess = null;
  playitStatus = 'disconnected';
  mainWindow.webContents.send('playit:status-changed', playitStatus);
  return { success: true };
});

ipcMain.handle('playit:status', async () => playitStatus);

// --- BACKUPS ---
ipcMain.handle('backups:list', async () => {
  try {
    const backupsPath = path.join(serverPath, 'backups');
    await ensureDirectoryExists(backupsPath);
    const backups = [];
    const entries = await fs.readdir(backupsPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.zip')) {
        const backupPath = path.join(backupsPath, entry.name);
        const stats = await fs.stat(backupPath);
        backups.push({
          id: entry.name,
          name: entry.name.replace('.zip', ''),
          size: formatBytes(stats.size),
          created: stats.birthtime.toISOString(),
          type: entry.name.includes('auto') ? 'automatic' : 'manual',
          status: 'completed'
        });
      }
    }
    return backups.sort((a, b) => new Date(b.created) - new Date(a.created));
  } catch (error) {
    return [];
  }
});

ipcMain.handle('backups:create', async (event, name) => {
  try {
    const backupsPath = path.join(serverPath, 'backups');
    await ensureDirectoryExists(backupsPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = name || `backup-${timestamp}`;
    const backupPath = path.join(backupsPath, `${backupName}.zip`);
    // Aqui você deve implementar a criação real do backup (zipar a pasta do mundo)
    await fs.writeFile(backupPath, '');
    return { success: true, message: 'Backup criado com sucesso' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('backups:restore', async (event, backupId) => {
  try {
    // Aqui você deve implementar a restauração real do backup
    return { success: true, message: 'Backup restaurado com sucesso' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('backups:delete', async (event, backupId) => {
  try {
    const backupPath = path.join(serverPath, 'backups', backupId);
    await fs.unlink(backupPath);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('backups:download', async (event, backupId) => {
  try {
    const backupPath = path.join(serverPath, 'backups', backupId);
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: backupId,
      filters: [{ name: 'ZIP', extensions: ['zip'] }]
    });
    if (!filePath) return { success: false, message: 'Cancelado' };
    await fs.copyFile(backupPath, filePath);
    return { success: true, message: 'Backup baixado com sucesso' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// --- MUNDOS ---
ipcMain.handle('worlds:list', async () => {
  try {
    const worldsPath = path.join(process.cwd(), 'server-files', 'worlds');
    await fs.mkdir(worldsPath, { recursive: true });
    const entries = await fs.readdir(worldsPath, { withFileTypes: true });
    const worlds = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const worldPath = path.join(worldsPath, entry.name);
        let stats;
        try {
          stats = await fs.stat(worldPath);
        } catch {
          continue;
        }
        const size = await getFolderSize(worldPath);
        worlds.push({
          id: entry.name,
          name: entry.name,
          size: formatBytes(size),
          created: stats.birthtime,
          lastModified: stats.mtime
        });
      }
    }
    // Log para depuração
    if (worlds.length === 0) {
      console.log('[Worlds] Nenhum mundo encontrado em', worldsPath);
    }
    return worlds;
  } catch (error) {
    console.error('[Worlds] Erro ao listar mundos:', error);
    return [];
  }
});

async function getFolderSize(folderPath) {
  let size = 0;
  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(folderPath, entry.name);
      if (entry.isDirectory()) {
        size += await getFolderSize(entryPath);
      } else {
        const stats = await fs.stat(entryPath);
        size += stats.size;
      }
    }
  } catch (error) {
    // ignore
  }
  return size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false // Para mostrar só quando estiver pronto
  });

  // Carrega o frontend do Vite em dev ou o build em prod
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173/');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Evento de inicialização do Electron
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

let connectedPlayers = [];

function parsePlayerLog(line) {
  // Exemplo: "[INFO] Player connected: Steve_Builder"
  const joinMatch = line.match(/Player connected: ([\w_]+)/i);
  if (joinMatch) {
    const name = joinMatch[1];
    if (!connectedPlayers.find(p => p.name === name)) {
      connectedPlayers.push({ name, lastSeen: new Date().toLocaleTimeString(), status: 'online' });
      mainWindow.webContents.send('server:recent-players', connectedPlayers);
    }
  }
  const leaveMatch = line.match(/Player disconnected: ([\w_]+)/i);
  if (leaveMatch) {
    const name = leaveMatch[1];
    connectedPlayers = connectedPlayers.map(p =>
      p.name === name ? { ...p, lastSeen: new Date().toLocaleTimeString(), status: 'offline' } : p
    );
    mainWindow.webContents.send('server:recent-players', connectedPlayers);
  }
}

// IPC: Reiniciar servidor
ipcMain.handle('server:restart', async () => {
  try {
    // Pare o servidor se estiver rodando
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
      serverStatus = 'offline';
      mainWindow && mainWindow.webContents.send('server:status-changed', serverStatus);
      stopServerStatsInterval && stopServerStatsInterval();
      serverStartTime = null;
      // Aguarde um pouco para garantir que o processo foi encerrado
      await new Promise(res => setTimeout(res, 1500));
    }
    // Inicie novamente
    const serverExe = path.join(serverPath, 'bedrock_server.exe');
    await fs.access(serverExe);
    serverProcess = spawn(serverExe, [], { cwd: serverPath, detached: false });

    serverProcess.stdout.on('data', (data) => {
      mainWindow.webContents.send('server:log', {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: data.toString().trim(),
        category: 'server'
      });
    });
    serverProcess.stderr.on('data', (data) => {
      mainWindow.webContents.send('server:log', {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: data.toString().trim(),
        category: 'server'
      });
    });
    serverProcess.on('exit', (code, signal) => {
      serverProcess = null;
      serverStatus = 'offline';
      mainWindow.webContents.send('server:status-changed', serverStatus);
      mainWindow.webContents.send('server:log', {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `Servidor parado (code: ${code}, signal: ${signal})`,
        category: 'server'
      });
    });

    serverStatus = 'starting';
    mainWindow.webContents.send('server:status-changed', serverStatus);
    serverStartTime = Date.now();

    setTimeout(() => {
      if (serverProcess) {
        serverStatus = 'online';
        mainWindow.webContents.send('server:status-changed', serverStatus);
      }
    }, 3000);

    startServerStatsInterval && startServerStatsInterval();
    mainWindow.webContents.send('server:ip-changed', getLocalIp());
    return { success: true, message: 'Servidor reiniciado' };
  } catch (e) {
    mainWindow && mainWindow.webContents.send('server:log', {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: `Erro ao reiniciar o servidor: ${e.message}`,
      category: 'server'
    });
    return { success: false, message: `Erro ao reiniciar o servidor: ${e.message}` };
  }
});

// Handler para deletar mundo
ipcMain.handle('worlds:delete', async (_event, worldName) => {
  try {
    const worldsPath = path.join(process.cwd(), 'server-files', 'worlds');
    const worldPath = path.join(worldsPath, worldName);
    // Remove a pasta do mundo recursivamente
    await fs.rm(worldPath, { recursive: true, force: true });
    // Se o mundo deletado era o ativo, defina outro mundo existente como ativo
    const serverPropsPath = path.join(process.cwd(), 'server-files', 'server.properties');
    const props = await readProperties(serverPropsPath);
    if (props['level-name'] === worldName) {
      const entries = await fs.readdir(worldsPath, { withFileTypes: true });
      const nextWorld = entries.find(e => e.isDirectory());
      if (nextWorld) {
        props['level-name'] = nextWorld.name;
        await writeProperties(serverPropsPath, props);
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Funções utilitárias para ler/escrever server.properties
async function readProperties(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  const props = {};
  for (const line of lines) {
    if (line.trim().startsWith('#') || !line.includes('=')) continue;
    const [key, ...rest] = line.split('=');
    props[key.trim()] = rest.join('=').trim();
  }
  return props;
}
async function writeProperties(filePath, props) {
  let content = '';
  for (const [key, value] of Object.entries(props)) {
    content += `${key}=${value}\n`;
  }
  await fs.writeFile(filePath, content, 'utf-8');
}

// Handler para definir o mundo ativo (altera level-name no server.properties e reinicia o servidor)
ipcMain.handle('worlds:set-active', async (_event, worldName) => {
  try {
    const props = await readProperties(serverPropsPath);
    props['level-name'] = worldName;
    await writeProperties(serverPropsPath, props);

    // Reinicia o servidor para aplicar o novo mundo
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
      serverStatus = 'offline';
      mainWindow && mainWindow.webContents.send('server:status-changed', serverStatus);
      stopServerStatsInterval && stopServerStatsInterval();
      serverStartTime = null;
      await new Promise(res => setTimeout(res, 1500));
    }
    await fs.access(serverExe);
    serverProcess = spawn(serverExe, [], { cwd: serverPath, detached: false });

    serverProcess.stdout.on('data', (data) => {
      mainWindow.webContents.send('server:log', {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: data.toString().trim(),
        category: 'server'
      });
    });
    serverProcess.stderr.on('data', (data) => {
      mainWindow.webContents.send('server:log', {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: data.toString().trim(),
        category: 'server'
      });
    });
    serverProcess.on('exit', (code, signal) => {
      serverProcess = null;
      serverStatus = 'offline';
      mainWindow.webContents.send('server:status-changed', serverStatus);
      mainWindow.webContents.send('server:log', {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `Servidor parado (code: ${code}, signal: ${signal})`,
        category: 'server'
      });
    });

    serverStatus = 'starting';
    mainWindow.webContents.send('server:status-changed', serverStatus);
    serverStartTime = Date.now();

    setTimeout(() => {
      if (serverProcess) {
        serverStatus = 'online';
        mainWindow.webContents.send('server:status-changed', serverStatus);
      }
    }, 3000);

    startServerStatsInterval && startServerStatsInterval();
    mainWindow.webContents.send('server:ip-changed', getLocalIp());

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Handler para ativar/desativar addon/pack (atualiza world_behavior_packs.json ou world_resource_packs.json)
ipcMain.handle('addons:toggle', async (_event, type, addonId, enabled, worldName) => {
  try {
    // Descobre o mundo alvo (agora pode ser passado explicitamente)
    const props = await readProperties(serverPropsPath);
    const world = worldName || props['level-name'];
    const worldPath = path.join(serverPath, 'worlds', world);

    // Arquivo de packs do mundo
    const jsonFile = type === 'behavior'
      ? path.join(worldPath, 'world_behavior_packs.json')
      : path.join(worldPath, 'world_resource_packs.json');

    // Lista todos os packs disponíveis
    const folder = type === 'behavior' ? 'behavior_packs' : 'resource_packs';
    const packsPath = path.join(serverPath, folder);
    const entries = await fs.readdir(packsPath, { withFileTypes: true });

    // Busca o uuid e versão real do manifest.json do addon selecionado
    let packUuid = null;
    let packVersion = [0, 0, 1];
    let packName = addonId;
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === addonId) {
        const manifestPath = path.join(packsPath, entry.name, 'manifest.json');
        console.log('[ADDONS:TOGGLE] Lendo manifest:', manifestPath);
        if (fsExtra.existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(fsExtra.readFileSync(manifestPath, 'utf-8'));
            console.log('[ADDONS:TOGGLE] Manifest lido:', manifest);
            if (manifest.header) {
              if (manifest.header.uuid) packUuid = manifest.header.uuid;
              if (Array.isArray(manifest.header.version)) packVersion = manifest.header.version;
              if (manifest.header.name) packName = manifest.header.name;
              console.log('[ADDONS:TOGGLE] uuid:', packUuid, 'version:', packVersion, 'name:', packName);
            }
          } catch (err) {
            console.log('[ADDONS:TOGGLE] Erro ao ler manifest:', err);
          }
        } else {
          console.log('[ADDONS:TOGGLE] manifest.json não encontrado em', manifestPath);
        }
        break;
      }
    }
    // Se não encontrou uuid, tenta usar o nome da pasta (addonId) como fallback
    if (!packUuid) packUuid = addonId;

    // Lê o arquivo JSON atual ou inicia vazio
    let packsJson = [];
    try {
      packsJson = JSON.parse(await fs.readFile(jsonFile, 'utf-8'));
    } catch {
      packsJson = [];
    }

    // Remove o pack se já existe (por uuid, por nome da pasta ou por name do manifest)
    packsJson = packsJson.filter(
      p =>
        p.pack_id !== packUuid &&
        p.pack_id !== addonId &&
        p.pack_id !== packName
    );

    // Adiciona se for para habilitar (agora sempre salva pelo uuid, se existir, senão pelo name)
    if (enabled) {
      // O Bedrock exige uuid, mas se não houver, salva pelo name (fallback)
      console.log('[ADDONS:TOGGLE] Adicionando pack_id:', packUuid || packName, 'version:', packVersion);
      packsJson.push({
        pack_id: packUuid || packName,
        version: packVersion
      });
    }

    await fs.writeFile(jsonFile, JSON.stringify(packsJson, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.log('[ADDONS:TOGGLE] Erro:', error);
    return { success: false, message: error.message };
  }
});

// Handler para instalar addon/pack (agora extrai e valida)
ipcMain.handle('addons:install', async (_event, type) => {
  try {
    const folder = type === 'behavior' ? 'behavior_packs' : 'resource_packs';
    const packsPath = path.join(serverPath, folder);
    await fs.mkdir(packsPath, { recursive: true }); // Garante que a pasta existe
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Instalar Addon/Pack',
      properties: ['openFile'],
      filters: [
        { name: 'Addons/Packs', extensions: ['mcpack', 'mcaddon', 'zip'] }
      ]
    });
    if (canceled || !filePaths || filePaths.length === 0) {
      console.log('[ADDONS:INSTALL] Instalação cancelada');
      return { success: false, message: 'Instalação cancelada' };
    }
    const src = filePaths[0];
    let manifest = null;
    try {
      const zip = new AdmZip(src);
      // Procura manifest.json em qualquer subpasta
      let manifestEntry = zip.getEntry('manifest.json');
      if (!manifestEntry) {
        const candidates = zip.getEntries().filter(e => e.entryName.toLowerCase().endsWith('manifest.json'));
        if (candidates.length > 0) manifestEntry = candidates[0];
      }
      if (!manifestEntry) {
        console.log('[ADDONS:INSTALL] manifest.json não encontrado no addon');
        return { success: false, message: 'manifest.json não encontrado no addon.' };
      }
      manifest = JSON.parse(zip.readAsText(manifestEntry));
      console.log('[ADDONS:INSTALL] Manifest extraído:', manifest);
      if (!manifest.header || !manifest.header.uuid || !manifest.header.name) {
        console.log('[ADDONS:INSTALL] manifest.json inválido:', manifest);
        return { success: false, message: 'manifest.json inválido (uuid ou name não encontrado).' };
      }
      // Usa o nome do manifest como nome da pasta (sanitize para evitar problemas)
      let folderName = manifest.header.name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim();
      if (!folderName) folderName = manifest.header.uuid;
      const destFolder = path.join(packsPath, folderName);
      // Se já existe, remove para evitar conflitos
      if (fsExtra.existsSync(destFolder)) {
        console.log('[ADDONS:INSTALL] Removendo pasta existente:', destFolder);
        await fs.rm(destFolder, { recursive: true, force: true });
      }
      console.log('[ADDONS:INSTALL] Extraindo para:', destFolder);
      zip.extractAllTo(destFolder, true);
      try { await fs.unlink(src); } catch {}
      return { success: true, message: 'Addon/Pack instalado com sucesso' };
    } catch (e) {
      console.log('[ADDONS:INSTALL] Falha ao extrair ou ler manifest.json:', e);
      return { success: false, message: 'Falha ao extrair ou ler manifest.json: ' + e.message };
    }
  } catch (error) {
    console.log('[ADDONS:INSTALL] Erro:', error);
    return { success: false, message: error.message };
  }
});

// Handler para listar addons (behavior/resource packs)
ipcMain.handle('addons:list', async (_event, type) => {
  try {
    const validTypes = ['behavior', 'resource'];
    if (!validTypes.includes(type)) return [];
    const folder = type === 'behavior' ? 'behavior_packs' : 'resource_packs';
    const packsPath = path.join(process.cwd(), 'server-files', folder);
    await fs.mkdir(packsPath, { recursive: true });

    // Nomes padrão a serem ignorados
    const IGNORE_BEHAVIOR = [
      'chemistry',
      'chemistry_1.20.50',
      'chemistry_1.20.60',
      'chemistry_1.21.0',
      'chemistry_1.21.10',
      'chemistry_1.21.20',
      'chemistry_1.21.30',
      'editor',
      'experimental_creator_cameras',
      'experimental_jigsaw_structures',
      'experimental_villager_trade',
      'server_editor_library',
      'vanilla',
      'vanilla_1.14',
      'vanilla_1.15',
      'vanilla_1.16',
      'vanilla_1.16.100',
      'vanilla_1.16.200',
      'vanilla_1.16.210',
      'vanilla_1.16.220',
      'vanilla_1.17.0',
      'vanilla_1.17.10',
      'vanilla_1.17.20',
      'vanilla_1.17.30',
      'vanilla_1.17.40',
      'vanilla_1.18.0',
      'vanilla_1.18.10',
      'vanilla_1.18.20',
      'vanilla_1.18.30',
      'vanilla_1.19.0',
      'vanilla_1.19.10',
      'vanilla_1.19.20',
      'vanilla_1.19.30',
      'vanilla_1.19.40',
      'vanilla_1.19.50',
      'vanilla_1.19.60',
      'vanilla_1.19.70',
      'vanilla_1.19.80',
      'vanilla_1.20.0',
      'vanilla_1.20.10',
      'vanilla_1.20.20',
      'vanilla_1.20.30',
      'vanilla_1.20.40',
      'vanilla_1.20.50',
      'vanilla_1.20.60',
      'vanilla_1.20.70',
      'vanilla_1.20.80',
      'vanilla_1.21.0',
      'vanilla_1.21.10',
      'vanilla_1.21.20',
      'vanilla_1.21.30',
      'vanilla_1.21.40',
      'vanilla_1.21.50',
      'vanilla_1.21.60',
      'vanilla_1.21.70',
      'vanilla_1.21.80',
      'vanilla_1.21.90',
      'vanilla_1.21.92'
    ];

    const IGNORE_RESOURCE = [
      'chemistry',
      'editor',
      'vanilla'
    ];

    const ignoreList = type === 'behavior' ? IGNORE_BEHAVIOR : IGNORE_RESOURCE;

    const entries = await fs.readdir(packsPath, { withFileTypes: true });
    const packs = [];
    for (const entry of entries) {
      // Só considera pastas (cada addon extraído é uma pasta com uuid)
      if (!entry.isDirectory()) continue;
      // Ignora nomes padrão
      if (ignoreList.includes(entry.name)) continue;
      const packPath = path.join(packsPath, entry.name);
      let stats;
      try {
        stats = await fs.stat(packPath);
      } catch {
        continue;
      }
      // Lê manifest.json para pegar nome, versão, descrição, autor
      let manifest = null;
      let name = entry.name, version = '', description = '', author = '';
      try {
        const manifestPath = path.join(packPath, 'manifest.json');
        if (fsExtra.existsSync(manifestPath)) {
          manifest = JSON.parse(fsExtra.readFileSync(manifestPath, 'utf-8'));
          name = manifest.header?.name || entry.name;
          version = manifest.header?.version?.join('.') || '';
          description = manifest.header?.description || '';
          author = (manifest.metadata?.authors && manifest.metadata.authors.join(', ')) || '';
          console.log('[ADDONS:LIST] manifest:', manifestPath, 'name:', name, 'version:', version);
        } else {
          console.log('[ADDONS:LIST] manifest.json não encontrado em', manifestPath);
        }
      } catch (err) {
        console.log('[ADDONS:LIST] Erro ao ler manifest:', err);
      }
      packs.push({
        id: entry.name,
        name,
        version,
        description,
        author,
        size: formatBytes(stats.size),
        enabled: true // Opcional: implemente lógica real se desejar ativar/desativar
      });
    }
    return packs;
  } catch (error) {
    console.log('[ADDONS:LIST] Erro:', error);
    return [];
  }
});

// Handler para deletar addon/pack
ipcMain.handle('addons:delete', async (_event, type, addonId) => {
  try {
    const folder = type === 'behavior' ? 'behavior_packs' : 'resource_packs';
    const packsPath = path.join(process.cwd(), 'server-files', folder);
    const addonPath = path.join(packsPath, addonId);
    await fs.rm(addonPath, { recursive: true, force: true });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Handler para ler server.properties
ipcMain.handle('config:get-server-properties', async () => {
  try {
    const propsPath = path.join(process.cwd(), 'server-files', 'server.properties');
    const content = await fs.readFile(propsPath, 'utf-8');
    const lines = content.split('\n');
    const props = {};
    for (const line of lines) {
      if (line.trim().startsWith('#') || !line.includes('=')) continue;
      const [key, ...rest] = line.split('=');
      props[key.trim()] = rest.join('=').trim();
    }
    return props;
  } catch (error) {
    console.error('[Config] Erro ao ler server.properties:', error);
    return {};
  }
});

// Handler para salvar server.properties
ipcMain.handle('config:save-server-properties', async (_event, config) => {
  try {
    const propsPath = path.join(process.cwd(), 'server-files', 'server.properties');
    let content = '';
    for (const [key, value] of Object.entries(config)) {
      content += `${key}=${value}\n`;
    }
    await fs.writeFile(propsPath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('[Config] Erro ao salvar server.properties:', error);
    return { success: false, message: error.message };
  }
});

// Handler para importar mundo (exemplo simples: abrir diálogo para selecionar pasta e copiar para worlds)
ipcMain.handle('worlds:import', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Importar Mundo',
      properties: ['openDirectory']
    });
    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false, message: 'Importação cancelada' };
    }
    const sourcePath = filePaths[0];
    const worldName = path.basename(sourcePath);
    const worldsPath = path.join(process.cwd(), 'server-files', 'worlds');
    const destPath = path.join(worldsPath, worldName);

    // Verifica se já existe um mundo com esse nome
    try {
      await fs.access(destPath);
      return { success: false, message: 'Já existe um mundo com esse nome.' };
    } catch {
      // ok, não existe
    }

    // Copia a pasta do mundo (recursivo)
    await copyFolderRecursive(sourcePath, destPath);

    return { success: true, message: 'Mundo importado com sucesso.' };
  } catch (error) {
    console.error('[Worlds] Erro ao importar mundo:', error);
    return { success: false, message: error.message };
  }
});

// Função utilitária para copiar pasta recursivamente
async function copyFolderRecursive(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyFolderRecursive(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

// Handler para obter configuração do mundo (exemplo básico: lê level.dat e retorna informações mínimas)
ipcMain.handle('worlds:get-config', async (_event, worldName) => {
  try {
    const worldPath = path.join(process.cwd(), 'server-files', 'worlds', worldName);
    // Mock completo para exibição no frontend
    return {
      folder: worldName,
      seed: '4424420676901351550',
      randomSeed: '4424420676901351550',
      isHardcore: false,
      difficulty: 1,
      educationFeaturesEnabled: false,
      gameRules: {
        commandblockoutput: false,
        commandblocksenabled: true,
        dodaylightcycle: true,
        doentitydrops: true,
        dofiretick: true,
        doimmediaterespawn: false,
        doinsomnia: true,
        domobloot: true,
        domobspawning: true,
        dotiledrops: true,
        doweathercycle: false,
        drowningdamage: true,
        falldamage: true,
        firedamage: true,
        freezedamage: true,
        functioncommandlimit: 10000,
        keepinventory: true,
        maxcommandchainlength: 65535,
        mobgriefing: true,
        naturalregeneration: true,
        playerssleepingpercentage: 0,
        pvp: true,
        randomtickspeed: 1,
        recipesunlock: false,
        respawnblocksexplode: true,
        sendcommandfeedback: false,
        showcoordinates: true,
        showdaysplayed: true,
        showdeathmessages: true,
        showtags: false,
        spawnradius: 10,
        tntexplodes: true,
        tntexplosiondropdecay: false
      },
      experiments: {
        data_driven_biomes: true,
        experimental_creator_cameras: false,
        gametest: true,
        jigsaw_structures: true,
        upcoming_creator_features: true,
        villager_trades_rebalance: true
      }
    };
  } catch (error) {
    console.error('[Worlds] Erro ao obter config do mundo:', error);
    // Retorne um objeto vazio para evitar loading infinito
    return {
      folder: worldName,
      seed: '',
      randomSeed: '',
      isHardcore: false,
      difficulty: '',
      educationFeaturesEnabled: false,
      gameRules: {},
      experiments: {}
    };
  }
});

// Handler para salvar configuração do mundo (opcional, apenas mock)
ipcMain.handle('worlds:save-config', async (_event, worldName, config) => {
  try {
    // Aqui você pode implementar a lógica real de salvar no level.dat, se desejar
    // Por enquanto, apenas retorna sucesso
    return { success: true };
  } catch (error) {
    console.error('[Worlds] Erro ao salvar config do mundo:', error);
    return { success: false, message: error.message };
  }
});

// Handler para listar jogadores online
ipcMain.handle('players:list', async () => {
  return connectedPlayers.filter(p => p.status === 'online');
});

// Handler para dar OP a um jogador
ipcMain.handle('players:op', async (_event, playerName) => {
  try {
    const opsPath = path.join(serverPath, 'ops.txt');
    let ops = '';
    try {
      ops = await fs.readFile(opsPath, 'utf-8');
    } catch { ops = ''; }
    if (!ops.split('\n').map(l => l.trim()).includes(playerName)) {
      ops += (ops.endsWith('\n') ? '' : '\n') + playerName + '\n';
      await fs.writeFile(opsPath, ops, 'utf-8');
    }
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Handler para remover OP de um jogador
ipcMain.handle('players:deop', async (_event, playerName) => {
  try {
    const opsPath = path.join(serverPath, 'ops.txt');
    let ops = '';
    try {
      ops = await fs.readFile(opsPath, 'utf-8');
    } catch { ops = ''; }
    const newOps = ops.split('\n').filter(l => l.trim() && l.trim() !== playerName).join('\n') + '\n';
    await fs.writeFile(opsPath, newOps, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});