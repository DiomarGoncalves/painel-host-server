const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Server Management
  server: {
    start: () => ipcRenderer.invoke('server:start'),
    stop: () => ipcRenderer.invoke('server:stop'),
    restart: () => ipcRenderer.invoke('server:restart'),
    getStatus: () => ipcRenderer.invoke('server:status'),
    executeCommand: (command) => ipcRenderer.invoke('server:execute-command', command),
    onStatusChanged: (callback) => ipcRenderer.on('server:status-changed', callback),
    onLog: (callback) => ipcRenderer.on('server:log', callback),
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('server:status-changed');
      ipcRenderer.removeAllListeners('server:log');
    }
  },

  // Configuration Management
  config: {
    getServerProperties: () => ipcRenderer.invoke('config:get-server-properties'),
    saveServerProperties: (config) => ipcRenderer.invoke('config:save-server-properties', config),
  },

  // World Management
  worlds: {
    list: () => ipcRenderer.invoke('worlds:list'),
    getConfig: (worldName) => ipcRenderer.invoke('worlds:get-config', worldName),
    saveConfig: (worldName, config) => ipcRenderer.invoke('worlds:save-config', worldName, config),
    import: () => ipcRenderer.invoke('worlds:import'),
    delete: (worldName) => ipcRenderer.invoke('worlds:delete', worldName),
    getAddons: (worldName) => ipcRenderer.invoke('worlds:get-addons', worldName),
    installAddon: (worldName, type) => ipcRenderer.invoke('worlds:install-addon', worldName, type),
    toggleAddon: (worldName, type, addonId, enabled) => ipcRenderer.invoke('worlds:toggle-addon', worldName, type, addonId, enabled),
    deleteAddon: (worldName, type, addonId) => ipcRenderer.invoke('worlds:delete-addon', worldName, type, addonId),
  },

  // Player Management
  players: {
    list: () => ipcRenderer.invoke('players:list'),
    addToAllowlist: (playerName) => ipcRenderer.invoke('players:add-to-allowlist', playerName),
    removeFromAllowlist: (playerName) => ipcRenderer.invoke('players:remove-from-allowlist', playerName),
  },

  // Performance Monitoring
  performance: {
    getStats: () => ipcRenderer.invoke('performance:get-stats'),
  },

  // Playit.gg Integration
  playit: {
    start: () => ipcRenderer.invoke('playit:start'),
    stop: () => ipcRenderer.invoke('playit:stop'),
    getStatus: () => ipcRenderer.invoke('playit:status'),
    onStatusChanged: (callback) => ipcRenderer.on('playit:status-changed', callback),
    onLog: (callback) => ipcRenderer.on('playit:log', callback),
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('playit:status-changed');
      ipcRenderer.removeAllListeners('playit:log');
    }
  },

  // Backup Management
  backups: {
    list: () => ipcRenderer.invoke('backups:list'),
    create: (name) => ipcRenderer.invoke('backups:create', name),
    restore: (backupId) => ipcRenderer.invoke('backups:restore', backupId),
    delete: (backupId) => ipcRenderer.invoke('backups:delete', backupId),
  },

  // File Management
  files: {
    list: (path) => ipcRenderer.invoke('files:list', path),
    read: (filePath) => ipcRenderer.invoke('files:read', filePath),
    write: (filePath, content) => ipcRenderer.invoke('files:write', filePath, content),
    delete: (filePath) => ipcRenderer.invoke('files:delete', filePath),
    createDirectory: (dirPath) => ipcRenderer.invoke('files:create-directory', dirPath),
    download: (filePath) => ipcRenderer.invoke('files:download', filePath),
    upload: (destPath, fileName, fileBuffer) => ipcRenderer.invoke('files:upload', destPath, fileName, fileBuffer),
  },
});