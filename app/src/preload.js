const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Server Management
    selectServerFolder: () => ipcRenderer.invoke('select-server-folder'),
    startServer: () => ipcRenderer.invoke('start-server'),
    stopServer: () => ipcRenderer.invoke('stop-server'),
    getServerStatus: () => ipcRenderer.invoke('get-server-status'),

    // Configuration Management
    getServerConfig: () => ipcRenderer.invoke('get-server-config'),
    saveServerConfig: (config) => ipcRenderer.invoke('save-server-config', config),
    loadServerConfig: () => ipcRenderer.invoke('load-server-config'),

    // World Management
    getWorlds: () => ipcRenderer.invoke('get-worlds'),
    importWorld: () => ipcRenderer.invoke('import-world'),
    backupWorld: (worldName) => ipcRenderer.invoke('backup-world', worldName),
    setActiveWorld: (worldName) => ipcRenderer.invoke('set-active-world', worldName),
    deleteWorld: (worldName) => ipcRenderer.invoke('delete-world', worldName),

    // World Configuration
    getWorldSettings: () => ipcRenderer.invoke('get-world-settings'),
    saveWorldSettings: (settings) => ipcRenderer.invoke('save-world-settings', settings),
    getDefaultWorldSettings: () => ipcRenderer.invoke('get-default-world-settings'),
    getAvailableWorldAddons: () => ipcRenderer.invoke('get-available-world-addons'),
    getAppliedWorldAddons: () => ipcRenderer.invoke('get-applied-world-addons'),
    applyAddonToWorld: (addon) => ipcRenderer.invoke('apply-addon-to-world', addon),
    removeAddonFromWorld: (addon) => ipcRenderer.invoke('remove-addon-from-world', addon),

    // Addon Management
    getAddons: () => ipcRenderer.invoke('get-addons'),
    importAddon: () => ipcRenderer.invoke('import-addon'),
    deleteAddon: (addonId, addonType) => ipcRenderer.invoke('delete-addon', addonId, addonType),

    // Player Management
    getOperators: () => ipcRenderer.invoke('get-operators'),
    addOperator: (playerName) => ipcRenderer.invoke('add-operator', playerName),
    removeOperator: (playerName) => ipcRenderer.invoke('remove-operator', playerName),

    // Network Management
    getPlayitStatus: () => ipcRenderer.invoke('get-playit-status'),
    startPlayit: () => ipcRenderer.invoke('start-playit'),
    stopPlayit: () => ipcRenderer.invoke('stop-playit'),
    restartPlayit: () => ipcRenderer.invoke('restart-playit'),
    getTunnelInfo: () => ipcRenderer.invoke('get-tunnel-info'),

    // Updater Management
    getServerInfo: () => ipcRenderer.invoke('get-server-info'),
    selectNewServer: () => ipcRenderer.invoke('select-new-server'),
    validateServer: (serverPath) => ipcRenderer.invoke('validate-server', serverPath),
    updateServer: (newServerPath) => ipcRenderer.invoke('update-server', newServerPath),
    createBackup: () => ipcRenderer.invoke('create-backup'),
    getBackups: () => ipcRenderer.invoke('get-backups'),

    // Console Management
    sendCommand: (command) => ipcRenderer.invoke('send-command', command),
    getConsoleLogs: () => ipcRenderer.invoke('get-console-logs'),
    clearConsole: () => ipcRenderer.invoke('clear-console'),

    // Utility functions
    showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),
    openExternal: (url) => ipcRenderer.invoke('open-external', url)
});