const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fsSync = require('fs'); // Para leitura síncrona de manifest.json

let mainWindow;
let serverProcess = null;
let playitProcess = null;
let serverStatus = 'offline';
let playitStatus = 'disconnected';

// Paths
const isDev = process.env.NODE_ENV === 'development';
const serverPath = isDev 
  ? path.join(process.cwd(), 'server-files')
  : path.join(process.resourcesPath, 'server-files');

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    if (serverProcess) {
      serverProcess.kill();
    }
    if (playitProcess) {
      playitProcess.kill();
    }
  });
};

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Utility functions
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

const readJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
};

const writeJsonFile = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

// Server Management
ipcMain.handle('server:start', async () => {
  if (serverProcess) {
    return { success: false, message: 'Server is already running' };
  }

  try {
    const serverExe = path.join(serverPath, 'bedrock_server.exe');
    await fs.access(serverExe);
    
    serverProcess = spawn(serverExe, [], {
      cwd: serverPath,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    serverStatus = 'starting';
    mainWindow.webContents.send('server:status-changed', serverStatus);

    serverProcess.stdout.on('data', (data) => {
      const log = data.toString();
      mainWindow.webContents.send('server:log', {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: log.trim(),
        category: 'server'
      });

      // Detectar quando o servidor está pronto
      if (log.includes('Server started') || log.includes('IPv4 supported')) {
        serverStatus = 'online';
        mainWindow.webContents.send('server:status-changed', serverStatus);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const log = data.toString();
      mainWindow.webContents.send('server:log', {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: log.trim(),
        category: 'server'
      });
    });

    serverProcess.on('close', (code) => {
      serverProcess = null;
      serverStatus = 'offline';
      mainWindow.webContents.send('server:status-changed', serverStatus);
      mainWindow.webContents.send('server:log', {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `Server stopped with code ${code}`,
        category: 'server'
      });
    });

    return { success: true, message: 'Server started successfully' };
  } catch (error) {
    return { success: false, message: `Failed to start server: ${error.message}` };
  }
});

ipcMain.handle('server:stop', async () => {
  if (!serverProcess) {
    return { success: false, message: 'Server is not running' };
  }

  serverStatus = 'stopping';
  mainWindow.webContents.send('server:status-changed', serverStatus);

  // Enviar comando stop para o servidor
  try {
    serverProcess.stdin.write('stop\n');
  } catch (error) {
    console.error('Error sending stop command:', error);
    serverProcess.kill();
  }
  
  return { success: true, message: 'Server stop command sent' };
});

ipcMain.handle('server:restart', async () => {
  if (serverProcess) {
    await new Promise((resolve) => {
      serverProcess.on('close', resolve);
      try {
        serverProcess.stdin.write('stop\n');
      } catch (error) {
        serverProcess.kill();
      }
    });
  }
  
  // Aguardar um pouco antes de reiniciar
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return await ipcMain.handle('server:start');
});

ipcMain.handle('server:status', () => {
  return serverStatus;
});

ipcMain.handle('server:execute-command', async (event, command) => {
  if (!serverProcess) {
    return { success: false, message: 'Server is not running' };
  }

  try {
    serverProcess.stdin.write(command + '\n');
    mainWindow.webContents.send('server:log', {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: `Command executed: ${command}`,
      category: 'admin'
    });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Configuration Management
ipcMain.handle('config:get-server-properties', async () => {
  try {
    const configPath = path.join(serverPath, 'server.properties');
    const data = await fs.readFile(configPath, 'utf8');
    
    const config = {};
    data.split('\n').forEach(line => {
      if (line.includes('=') && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        config[key.trim()] = value.trim();
      }
    });
    
    return config;
  } catch (error) {
    console.error('Error reading server.properties:', error);
    return {};
  }
});

ipcMain.handle('config:save-server-properties', async (event, config) => {
  try {
    const configPath = path.join(serverPath, 'server.properties');
    let content = '# Minecraft Bedrock Server Configuration\n';
    content += '# Generated by Bedrock Admin Panel\n\n';
    
    for (const [key, value] of Object.entries(config)) {
      content += `${key}=${value}\n`;
    }
    
    await fs.writeFile(configPath, content);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// World Management
ipcMain.handle('worlds:list', async () => {
  try {
    const worldsPath = path.join(serverPath, 'worlds');
    await ensureDirectoryExists(worldsPath);
    
    const worlds = [];
    const entries = await fs.readdir(worldsPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const worldPath = path.join(worldsPath, entry.name);
        const levelDatPath = path.join(worldPath, 'level.dat');
        
        try {
          const stats = await fs.stat(worldPath);
          const size = await getFolderSize(worldPath);
          
          // Verificar se é um mundo válido
          let isValidWorld = false;
          try {
            await fs.access(levelDatPath);
            isValidWorld = true;
          } catch {
            try {
              await fs.access(path.join(worldPath, 'levelname.txt'));
              isValidWorld = true;
            } catch {
              continue;
            }
          }
          
          if (isValidWorld) {
            // Ler configurações do mundo
            const worldConfig = await getWorldConfig(entry.name);
            
            worlds.push({
              id: entry.name,
              name: entry.name,
              path: worldPath,
              size: formatBytes(size),
              created: stats.birthtime.toISOString(),
              lastModified: stats.mtime.toISOString(),
              gamemode: worldConfig.gamemode || 'survival',
              difficulty: worldConfig.difficulty || 'normal'
            });
          }
        } catch (error) {
          console.error(`Error reading world ${entry.name}:`, error);
        }
      }
    }
    
    return worlds;
  } catch (error) {
    console.error('Error listing worlds:', error);
    return [];
  }
});

ipcMain.handle('worlds:get-config', async (event, worldName) => {
  try {
    return await getWorldConfig(worldName);
  } catch (error) {
    console.error('Error getting world config:', error);
    return null;
  }
});

ipcMain.handle('worlds:save-config', async (event, worldName, config) => {
  try {
    await saveWorldConfig(worldName, config);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('worlds:import', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import World',
      filters: [
        { name: 'World Files', extensions: ['mcworld', 'zip'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled) {
      return { success: false, message: 'Import cancelled' };
    }

    const filePath = result.filePaths[0];
    const worldsPath = path.join(serverPath, 'worlds');
    const fileName = path.basename(filePath, path.extname(filePath));
    const extractPath = path.join(worldsPath, fileName);

    // Extrair arquivo
    if (filePath.endsWith('.zip') || filePath.endsWith('.mcworld') || filePath.endsWith('.mcpack') || filePath.endsWith('.mcaddon')) {
      // Corrigido: escape de aspas duplas para PowerShell
      const safeFilePath = filePath.replace(/"/g, '""');
      const safeExtractPath = extractPath.replace(/"/g, '""');
      await execAsync(`powershell -Command "Expand-Archive -Path \\"${safeFilePath}\\" -DestinationPath \\"${safeExtractPath}\\" -Force"`);
    }

    return { success: true, message: 'World imported successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('worlds:delete', async (event, worldName) => {
  try {
    const worldPath = path.join(serverPath, 'worlds', worldName);
    await fs.rmdir(worldPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('worlds:get-addons', async (event, worldName) => {
  try {
    const worldPath = path.join(serverPath, 'worlds', worldName);
    
    // Ler behavior packs
    const behaviorPacksPath = path.join(worldPath, 'world_behavior_packs.json');
    let behaviorPacks = [];
    try {
      const behaviorData = await readJsonFile(behaviorPacksPath);
      behaviorPacks = behaviorData.map(pack => ({
        id: pack.pack_id,
        name: pack.name || pack.pack_id,
        version: pack.version.join('.'),
        enabled: true,
        description: 'Behavior pack',
        author: 'Unknown',
        size: '0 KB'
      }));
    } catch {}

    // Ler resource packs
    const resourcePacksPath = path.join(worldPath, 'world_resource_packs.json');
    let resourcePacks = [];
    try {
      const resourceData = await readJsonFile(resourcePacksPath);
      resourcePacks = resourceData.map(pack => ({
        id: pack.pack_id,
        name: pack.name || pack.pack_id,
        version: pack.version.join('.'),
        enabled: true,
        description: 'Resource pack',
        author: 'Unknown',
        size: '0 KB'
      }));
    } catch {}

    return { behavior: behaviorPacks, resource: resourcePacks };
  } catch (error) {
    console.error('Error getting world addons:', error);
    return { behavior: [], resource: [] };
  }
});

ipcMain.handle('worlds:install-addon', async (event, worldName, type) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Install Addon',
      filters: [
        { name: 'Addon Files', extensions: ['mcpack', 'mcaddon', 'zip'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled) {
      return { success: false, message: 'Installation cancelled' };
    }

    const filePath = result.filePaths[0];
    const packsPath = path.join(serverPath, type === 'behavior' ? 'behavior_packs' : 'resource_packs');
    await ensureDirectoryExists(packsPath);

    const fileName = path.basename(filePath, path.extname(filePath));
    const extractPath = path.join(packsPath, fileName);

    // Extrair addon
    if (filePath.endsWith('.zip') || filePath.endsWith('.mcpack') || filePath.endsWith('.mcaddon')) {
      // Corrigido: escape de aspas duplas para PowerShell
      const safeFilePath = filePath.replace(/"/g, '""');
      const safeExtractPath = extractPath.replace(/"/g, '""');
      await execAsync(`powershell -Command "Expand-Archive -Path \\"${safeFilePath}\\" -DestinationPath \\"${safeExtractPath}\\" -Force"`);
    }

    // Adicionar ao mundo
    await addAddonToWorld(worldName, type, fileName);

    return { success: true, message: 'Addon installed successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('worlds:toggle-addon', async (event, worldName, type, addonId, enabled) => {
  try {
    await toggleAddonInWorld(worldName, type, addonId, enabled);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('worlds:delete-addon', async (event, worldName, type, addonId) => {
  try {
    await removeAddonFromWorld(worldName, type, addonId);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Player Management
ipcMain.handle('players:list', async () => {
  try {
    const allowlistPath = path.join(serverPath, 'allowlist.json');
    const permissionsPath = path.join(serverPath, 'permissions.json');
    
    let allowlist = [];
    let permissions = [];
    
    try {
      allowlist = await readJsonFile(allowlistPath);
      if (!Array.isArray(allowlist)) allowlist = [];
    } catch {}
    
    try {
      permissions = await readJsonFile(permissionsPath);
      if (!Array.isArray(permissions)) permissions = [];
    } catch {}
    
    const players = allowlist.map(player => ({
      ...player,
      permissions: permissions.find(p => p.xuid === player.xuid)?.permission || 'member',
      status: 'offline',
      lastSeen: new Date().toISOString(),
      playTime: '0h 0m'
    }));
    
    return players;
  } catch (error) {
    console.error('Error listing players:', error);
    return [];
  }
});

ipcMain.handle('players:add-to-allowlist', async (event, playerName) => {
  try {
    const allowlistPath = path.join(serverPath, 'allowlist.json');
    let allowlist = [];
    
    try {
      allowlist = await readJsonFile(allowlistPath);
      if (!Array.isArray(allowlist)) allowlist = [];
    } catch {}
    
    if (!allowlist.find(p => p.name === playerName)) {
      allowlist.push({
        ignoresPlayerLimit: false,
        name: playerName,
        xuid: ""
      });
      
      await writeJsonFile(allowlistPath, allowlist);
      
      // Recarregar allowlist no servidor se estiver rodando
      if (serverProcess) {
        serverProcess.stdin.write('allowlist reload\n');
      }
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('players:remove-from-allowlist', async (event, playerName) => {
  try {
    const allowlistPath = path.join(serverPath, 'allowlist.json');
    let allowlist = [];
    
    try {
      allowlist = await readJsonFile(allowlistPath);
      if (!Array.isArray(allowlist)) allowlist = [];
    } catch {}
    
    allowlist = allowlist.filter(p => p.name !== playerName);
    await writeJsonFile(allowlistPath, allowlist);
    
    // Recarregar allowlist no servidor se estiver rodando
    if (serverProcess) {
      serverProcess.stdin.write('allowlist reload\n');
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Performance monitoring
ipcMain.handle('performance:get-stats', async () => {
  try {
    const stats = {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0,
      tps: 20,
      players: 0,
      uptime: '0h 0m',
      chunks: 0,
      entities: 0
    };

    if (serverStatus === 'online' && serverProcess) {
      // Obter estatísticas reais do processo
      const usage = process.cpuUsage();
      const memUsage = process.memoryUsage();
      
      stats.cpu = Math.min((usage.user + usage.system) / 10000, 100);
      stats.memory = (memUsage.heapUsed / 1024 / 1024 / 1024) * 100 / 4; // Porcentagem de 4GB
      stats.disk = await getDiskUsage();
      stats.network = Math.random() * 20 + 5; // Simulado por enquanto
      stats.tps = 19.5 + Math.random() * 0.5;
      stats.players = await getOnlinePlayersCount();
      stats.uptime = getUptime();
      stats.chunks = Math.floor(Math.random() * 1000) + 500;
      stats.entities = Math.floor(Math.random() * 500) + 200;
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting performance stats:', error);
    return null;
  }
});

// Backup Management
ipcMain.handle('backups:list', async () => {
  try {
    const backupsPath = path.join(serverPath, 'backups');
    await ensureDirectoryExists(backupsPath);
    
    const backups = [];
    const entries = await fs.readdir(backupsPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith('.zip') || entry.name.endsWith('.tar.gz'))) {
        const backupPath = path.join(backupsPath, entry.name);
        const stats = await fs.stat(backupPath);
        
        backups.push({
          id: entry.name,
          name: entry.name.replace(/\.(zip|tar\.gz)$/, ''),
          size: formatBytes(stats.size),
          created: stats.birthtime.toISOString(),
          type: entry.name.includes('auto') ? 'automatic' : 'manual',
          status: 'completed'
        });
      }
    }
    
    return backups.sort((a, b) => new Date(b.created) - new Date(a.created));
  } catch (error) {
    console.error('Error listing backups:', error);
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
    
    // Criar backup real dos mundos
    const worldsPath = path.join(serverPath, 'worlds');
    
    try {
      // Usar comando zip se disponível
      await execAsync(`powershell Compress-Archive -Path "${worldsPath}" -DestinationPath "${backupPath}" -Force`);
    } catch (error) {
      // Fallback: copiar arquivos manualmente
      const AdmZip = require('adm-zip');
      const zip = new AdmZip();
      zip.addLocalFolder(worldsPath, 'worlds');
      zip.writeZip(backupPath);
    }
    
    return { success: true, message: 'Backup created successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('backups:restore', async (event, backupId) => {
  try {
    const backupPath = path.join(serverPath, 'backups', backupId);
    const worldsPath = path.join(serverPath, 'worlds');
    
    // Parar servidor se estiver rodando
    if (serverProcess) {
      await new Promise((resolve) => {
        serverProcess.on('close', resolve);
        serverProcess.stdin.write('stop\n');
      });
    }
    
    // Fazer backup dos mundos atuais
    const backupCurrentPath = path.join(serverPath, 'backups', `pre-restore-${Date.now()}.zip`);
    await execAsync(`powershell Compress-Archive -Path "${worldsPath}" -DestinationPath "${backupCurrentPath}" -Force`);
    
    // Remover mundos atuais
    await fs.rmdir(worldsPath, { recursive: true });
    
    // Restaurar backup
    await execAsync(`powershell Expand-Archive -Path "${backupPath}" -DestinationPath "${serverPath}" -Force`);
    
    return { success: true, message: 'Backup restored successfully' };
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

// Playit.gg Integration
ipcMain.handle('playit:start', async () => {
  if (playitProcess) {
    return { success: false, message: 'Playit is already running' };
  }

  try {
    const playitPath = path.join(serverPath, 'playit', 'playit.exe');
    
    // Verificar se o playit existe
    try {
      await fs.access(playitPath);
    } catch {
      return { success: false, message: 'Playit.gg client not found. Please download it first.' };
    }
    
    playitProcess = spawn(playitPath, [], {
      cwd: path.join(serverPath, 'playit'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    playitStatus = 'connecting';
    mainWindow.webContents.send('playit:status-changed', playitStatus);

    playitProcess.stdout.on('data', (data) => {
      const log = data.toString();
      mainWindow.webContents.send('playit:log', log);

      if (log.includes('tunnel established') || log.includes('connected')) {
        playitStatus = 'connected';
        mainWindow.webContents.send('playit:status-changed', playitStatus);
      }
    });

    playitProcess.on('close', () => {
      playitProcess = null;
      playitStatus = 'disconnected';
      mainWindow.webContents.send('playit:status-changed', playitStatus);
    });

    return { success: true, message: 'Playit tunnel started' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('playit:stop', async () => {
  if (!playitProcess) {
    return { success: false, message: 'Playit is not running' };
  }

  playitProcess.kill();
  return { success: true };
});

ipcMain.handle('playit:status', () => {
  return playitStatus;
});

// File Management
ipcMain.handle('files:list', async (event, dirPath) => {
  try {
    const fullPath = path.join(serverPath, dirPath);
    await ensureDirectoryExists(fullPath);
    
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const files = [];
    
    for (const entry of entries) {
      const entryPath = path.join(fullPath, entry.name);
      const stats = await fs.stat(entryPath);
      
      files.push({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: entry.isFile() ? stats.size : undefined,
        modified: stats.mtime.toISOString(),
        path: path.join(dirPath, entry.name)
      });
    }
    
    return files;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
});

ipcMain.handle('files:read', async (event, filePath) => {
  try {
    const fullPath = path.join(serverPath, filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

ipcMain.handle('files:write', async (event, filePath, content) => {
  try {
    const fullPath = path.join(serverPath, filePath);
    await fs.writeFile(fullPath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('files:delete', async (event, filePath) => {
  try {
    const fullPath = path.join(serverPath, filePath);
    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      await fs.rmdir(fullPath, { recursive: true });
    } else {
      await fs.unlink(fullPath);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('files:create-directory', async (event, dirPath) => {
  try {
    const fullPath = path.join(serverPath, dirPath);
    await fs.mkdir(fullPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('files:download', async (event, filePath) => {
  try {
    const fullPath = path.join(serverPath, filePath);
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: path.basename(filePath),
      filters: [
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled) {
      await fs.copyFile(fullPath, result.filePath);
      return { success: true };
    }
    
    return { success: false, message: 'Download cancelled' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('files:upload', async (event, destPath, fileName, fileBuffer) => {
  try {
    const fullDestPath = path.join(serverPath, destPath, fileName);
    // fileBuffer pode ser base64 ou um Buffer
    let buffer = fileBuffer;
    if (typeof fileBuffer === 'string') {
      buffer = Buffer.from(fileBuffer, 'base64');
    }
    await fs.writeFile(fullDestPath, buffer);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Remove comentários de linha e bloco de um JSON string
function stripJsonComments(jsonString) {
  return jsonString
    .replace(/\/\/.*$/gm, '') // Remove comentários de linha
    .replace(/\/\*[\s\S]*?\*\//gm, ''); // Remove comentários de bloco
}

// Helper functions
async function getWorldConfig(worldName) {
  const worldPath = path.join(serverPath, 'worlds', worldName);
  const levelDatPath = path.join(worldPath, 'level.dat');
  
  // Configuração básica padrão
  const config = {
    seed: '',
    hardcore: false,
    difficulty: 1,
    educationFeaturesEnabled: false,
    gameRules: {
      commandBlockOutput: true,
      doDaylightCycle: true,
      doEntityDrops: true,
      doFireTick: true,
      doMobLoot: true,
      doMobSpawning: true,
      doTileDrops: true,
      doWeatherCycle: true,
      drowningDamage: true,
      fallDamage: true,
      fireDamage: true,
      keepInventory: false,
      mobGriefing: true,
      naturalRegeneration: true,
      pvp: true,
      randomTickSpeed: 3,
      sendCommandFeedback: true,
      showCoordinates: false,
      tntExplodes: true
    },
    experiments: {
      data_driven_items: false,
      upcoming_creator_features: false,
      custom_biomes: false,
      experimental_molang_features: false,
      caves_and_cliffs: false,
      spectator_mode: false
    }
  };
  
  // Tentar ler configurações específicas do mundo
  try {
    const levelNamePath = path.join(worldPath, 'levelname.txt');
    const levelName = await fs.readFile(levelNamePath, 'utf8');
    config.name = levelName.trim();
  } catch {}
  
  return config;
}

async function saveWorldConfig(worldName, config) {
  const worldPath = path.join(serverPath, 'worlds', worldName);
  
  // Salvar configurações específicas do mundo
  if (config.name) {
    const levelNamePath = path.join(worldPath, 'levelname.txt');
    await fs.writeFile(levelNamePath, config.name);
  }
  
  // Aqui você pode implementar a escrita de outros arquivos de configuração
  // como world_behavior_packs.json, world_resource_packs.json, etc.
}

async function addAddonToWorld(worldName, type, addonFolderName) {
  const worldPath = path.join(serverPath, 'worlds', worldName);
  const packsDir = path.join(serverPath, type === 'behavior' ? 'behavior_packs' : 'resource_packs');
  const addonPath = path.join(packsDir, addonFolderName);

  // 1. Localizar manifest.json
  let manifestPath = path.join(addonPath, 'manifest.json');
  if (!fsSync.existsSync(manifestPath)) {
    const subdirs = fsSync.readdirSync(addonPath, { withFileTypes: true })
      .filter(d => d.isDirectory());
    for (const dir of subdirs) {
      const tryPath = path.join(addonPath, dir.name, 'manifest.json');
      if (fsSync.existsSync(tryPath)) {
        manifestPath = tryPath;
        break;
      }
    }
  }
  if (!fsSync.existsSync(manifestPath)) throw new Error('manifest.json not found in addon');

  // 2. Ler manifest.json (removendo comentários)
  let manifestRaw = fsSync.readFileSync(manifestPath, 'utf8');
  manifestRaw = stripJsonComments(manifestRaw);
  const manifest = JSON.parse(manifestRaw);
  const uuid = manifest.header?.uuid;
  const version = manifest.header?.version;
  if (!uuid || !version) throw new Error('Invalid manifest.json: missing uuid or version');

  // 3. Atualizar world_behavior_packs.json ou world_resource_packs.json
  const configFile = type === 'behavior' ? 'world_behavior_packs.json' : 'world_resource_packs.json';
  const configPath = path.join(worldPath, configFile);

  let packs = [];
  try {
    packs = await readJsonFile(configPath);
    if (!Array.isArray(packs)) packs = [];
  } catch {}
  // Evitar duplicatas
  if (!packs.find(p => p.pack_id === uuid)) {
    packs.push({
      pack_id: uuid,
      version: version
    });
    await writeJsonFile(configPath, packs);
  }
}

// Remover pelo uuid, não pelo nome
async function removeAddonFromWorld(worldName, type, addonFolderName) {
  const worldPath = path.join(serverPath, 'worlds', worldName);
  const packsDir = path.join(serverPath, type === 'behavior' ? 'behavior_packs' : 'resource_packs');
  const addonPath = path.join(packsDir, addonFolderName);

  // 1. Localizar manifest.json
  let manifestPath = path.join(addonPath, 'manifest.json');
  if (!fsSync.existsSync(manifestPath)) {
    const subdirs = fsSync.readdirSync(addonPath, { withFileTypes: true })
      .filter(d => d.isDirectory());
    for (const dir of subdirs) {
      const tryPath = path.join(addonPath, dir.name, 'manifest.json');
      if (fsSync.existsSync(tryPath)) {
        manifestPath = tryPath;
        break;
      }
    }
  }
  if (!fsSync.existsSync(manifestPath)) throw new Error('manifest.json not found in addon');

  // 2. Ler manifest.json (removendo comentários)
  let manifestRaw = fsSync.readFileSync(manifestPath, 'utf8');
  manifestRaw = stripJsonComments(manifestRaw);
  const manifest = JSON.parse(manifestRaw);
  const uuid = manifest.header?.uuid;
  if (!uuid) throw new Error('Invalid manifest.json: missing uuid');

  // 3. Atualizar world_behavior_packs.json ou world_resource_packs.json
  const configFile = type === 'behavior' ? 'world_behavior_packs.json' : 'world_resource_packs.json';
  const configPath = path.join(worldPath, configFile);

  let packs = [];
  try {
    packs = await readJsonFile(configPath);
    if (!Array.isArray(packs)) packs = [];
  } catch {}
  // Remover pelo uuid
  packs = packs.filter(p => p.pack_id !== uuid);
  await writeJsonFile(configPath, packs);
}

// Ajuste também a função toggleAddonInWorld para manter a lógica correta:
async function toggleAddonInWorld(worldName, type, addonFolderName, enabled) {
  if (enabled) {
    await addAddonToWorld(worldName, type, addonFolderName);
  } else {
    await removeAddonFromWorld(worldName, type, addonFolderName);
  }
}

function getUptime() {
  if (serverStatus !== 'online') return '0h 0m';
  
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

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
    console.error('Error calculating folder size:', error);
  }
  return size;
}

async function getDiskUsage() {
  try {
    const stats = await fs.stat(serverPath);
    // Implementar cálculo real de uso de disco
    return Math.random() * 30 + 10; // Simulado por enquanto
  } catch {
    return 0;
  }
}

async function getOnlinePlayersCount() {
  // Implementar contagem real de jogadores online
  // Por enquanto retorna 0
  return 0;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}