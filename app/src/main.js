const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('child_process');
const WebSocket = require('ws');

// Importar módulos do sistema
const ServerManager = require('./modules/ServerManager');
const ConfigManager = require('./modules/ConfigManager');
const WorldManager = require('./modules/WorldManager');
const AddonManager = require('./modules/AddonManager');
const PlayerManager = require('./modules/PlayerManager');
const NetworkManager = require('./modules/NetworkManager');
const UpdaterManager = require('./modules/UpdaterManager');
const ConsoleManager = require('./modules/ConsoleManager');

class MinecraftBedrockPanel {
    constructor() {
        this.mainWindow = null;
        this.serverManager = new ServerManager();
        this.configManager = new ConfigManager();
        this.worldManager = new WorldManager();
        this.addonManager = new AddonManager();
        this.playerManager = new PlayerManager();
        this.networkManager = new NetworkManager();
        this.updaterManager = new UpdaterManager();
        this.consoleManager = new ConsoleManager();
        
        // Configurar referências cruzadas
        this.consoleManager.setServerManager(this.serverManager);
        
        this.setupIPC();
    }

    createWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            minWidth: 1200,
            minHeight: 700,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },
            icon: path.join(__dirname, '../web/icon.ico'),
            show: false,
            titleBarStyle: 'default'
        });

        // Carregar a interface web
        this.mainWindow.loadFile(path.join(__dirname, '../web/index.html'));

        // Mostrar janela quando estiver pronta
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            
            // Abrir DevTools em modo desenvolvimento
            if (process.argv.includes('--dev')) {
                this.mainWindow.webContents.openDevTools();
            }
        });

        // Configurar eventos da janela
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        // Interceptar links externos
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
        });
    }

    setupIPC() {
        // Server Management
        ipcMain.handle('select-server-folder', async () => {
            const result = await this.serverManager.selectServerFolder();
            if (result.success) {
                // Configurar o caminho do servidor em todos os managers
                this.configManager.setServerPath(result.path);
                this.worldManager.setServerPath(result.path);
                this.addonManager.setServerPath(result.path);
                this.playerManager.setServerPath(result.path);
                this.networkManager.setServerPath(result.path);
                this.updaterManager.setServerPath(result.path);
            }
            return result;
        });

        ipcMain.handle('start-server', async () => {
            return await this.serverManager.startServer();
        });

        ipcMain.handle('stop-server', async () => {
            return await this.serverManager.stopServer();
        });

        ipcMain.handle('get-server-status', async () => {
            return await this.serverManager.getServerStatus();
        });

        // Configuration Management
        ipcMain.handle('get-server-config', async () => {
            return await this.configManager.getServerConfig();
        });

        ipcMain.handle('save-server-config', async (event, config) => {
            return await this.configManager.saveServerConfig(config);
        });

        ipcMain.handle('load-server-config', async () => {
            return await this.configManager.loadServerConfig();
        });

        // World Management
        ipcMain.handle('get-worlds', async () => {
            return await this.worldManager.getWorlds();
        });

        ipcMain.handle('import-world', async () => {
            return await this.worldManager.importWorld();
        });

        ipcMain.handle('backup-world', async (event, worldName) => {
            return await this.worldManager.backupWorld(worldName);
        });

        ipcMain.handle('set-active-world', async (event, worldName) => {
            return await this.worldManager.setActiveWorld(worldName);
        });

        ipcMain.handle('delete-world', async (event, worldName) => {
            return await this.worldManager.deleteWorld(worldName);
        });

        // World Configuration
        ipcMain.handle('get-world-settings', async () => {
            return await this.worldManager.getWorldSettings();
        });

        ipcMain.handle('save-world-settings', async (event, settings) => {
            return await this.worldManager.saveWorldSettings(settings);
        });

        ipcMain.handle('get-default-world-settings', async () => {
            return { success: true, settings: this.worldManager.getDefaultWorldSettings() };
        });

        ipcMain.handle('get-available-world-addons', async () => {
            return await this.addonManager.getAddons();
        });

        ipcMain.handle('get-applied-world-addons', async () => {
            return await this.addonManager.getAppliedWorldAddons();
        });

        ipcMain.handle('apply-addon-to-world', async (event, addon) => {
            return await this.addonManager.applyAddonToWorld(addon);
        });

        ipcMain.handle('remove-addon-from-world', async (event, addon) => {
            return await this.addonManager.removeAddonFromWorld(addon);
        });

        // Addon Management
        ipcMain.handle('get-addons', async () => {
            return await this.addonManager.getAddons();
        });

        ipcMain.handle('import-addon', async () => {
            return await this.addonManager.importAddon();
        });

        ipcMain.handle('delete-addon', async (event, addonId, addonType) => {
            return await this.addonManager.deleteAddon(addonId, addonType);
        });

        // Player Management
        ipcMain.handle('get-operators', async () => {
            return await this.playerManager.getOperators();
        });

        ipcMain.handle('add-operator', async (event, playerName) => {
            return await this.playerManager.addOperator(playerName);
        });

        ipcMain.handle('remove-operator', async (event, playerName) => {
            return await this.playerManager.removeOperator(playerName);
        });

        // Network Management
        ipcMain.handle('get-playit-status', async () => {
            return await this.networkManager.getPlayitStatus();
        });

        ipcMain.handle('start-playit', async () => {
            return await this.networkManager.startPlayit();
        });

        ipcMain.handle('stop-playit', async () => {
            return await this.networkManager.stopPlayit();
        });

        ipcMain.handle('restart-playit', async () => {
            return await this.networkManager.restartPlayit();
        });

        ipcMain.handle('get-tunnel-info', async () => {
            return await this.networkManager.getTunnelInfo();
        });

        ipcMain.handle('get-playit-logs', async () => {
            const logs = this.networkManager.getPlayitLogs();
            return { success: true, logs: logs };
        });

        ipcMain.handle('clear-playit-logs', async () => {
            this.networkManager.clearPlayitLogs();
            return { success: true, message: 'Logs limpos' };
        });

        // Updater Management
        ipcMain.handle('get-server-info', async () => {
            return await this.updaterManager.getServerInfo();
        });

        ipcMain.handle('select-new-server', async () => {
            return await this.updaterManager.selectNewServer();
        });

        ipcMain.handle('validate-server', async (event, serverPath) => {
            return await this.updaterManager.validateServer(serverPath);
        });

        ipcMain.handle('update-server', async (event, newServerPath) => {
            return await this.updaterManager.updateServer(newServerPath);
        });

        ipcMain.handle('create-backup', async () => {
            return await this.updaterManager.createBackup();
        });

        ipcMain.handle('get-backups', async () => {
            return await this.updaterManager.getBackups();
        });

        // Console Management
        ipcMain.handle('send-command', async (event, command) => {
            return await this.serverManager.sendCommand(command);
        });

        ipcMain.handle('get-console-logs', async () => {
            const logs = this.serverManager.getLogs();
            return { success: true, logs: logs };
        });

        ipcMain.handle('clear-console', async () => {
            this.serverManager.clearLogs();
            return { success: true, message: 'Console limpo' };
        });

        // Utility functions
        ipcMain.handle('show-item-in-folder', async (event, filePath) => {
            shell.showItemInFolder(filePath);
            return { success: true };
        });

        ipcMain.handle('open-external', async (event, url) => {
            shell.openExternal(url);
            return { success: true };
        });
    }
}

// Instância da aplicação
const panelApp = new MinecraftBedrockPanel();

// Eventos do Electron
app.whenReady().then(() => {
    panelApp.createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            panelApp.createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', async () => {
    // Parar servidor se estiver rodando
    await panelApp.serverManager.stopServer();
    await panelApp.networkManager.stopPlayit();
});