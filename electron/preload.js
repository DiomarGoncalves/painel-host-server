const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Server Management
  server: {
    start: () => ipcRenderer.invoke('server:start'),
    stop: () => ipcRenderer.invoke('server:stop'),
    restart: () => ipcRenderer.invoke('server:restart'),
    getStatus: () => ipcRenderer.invoke('server:status'),
    getIp: () => ipcRenderer.invoke('server:get-ip'),
    getStats: () => ipcRenderer.invoke('server:get-stats'),
    onStatusChanged: (callback) => ipcRenderer.on('server:status-changed', callback),
    onIpChanged: (callback) => ipcRenderer.on('server:ip-changed', callback),
    onLog: (callback) => ipcRenderer.on('server:log', callback),
    onStats: (callback) => ipcRenderer.on('server:stats', callback),
    onRecentPlayers: (callback) => ipcRenderer.on('server:recent-players', callback),
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
    download: (worldName) => ipcRenderer.invoke('worlds:download', worldName),
    setActive: (worldName) => ipcRenderer.invoke('worlds:set-active', worldName), // NOVO
  },

  // Addon Management
  addons: {
    list: (type) => ipcRenderer.invoke('addons:list', type),
    install: (type) => ipcRenderer.invoke('addons:install', type),
    toggle: (type, addonId, enabled, worldName) => ipcRenderer.invoke('addons:toggle', type, addonId, enabled, worldName),
    delete: (type, addonId) => ipcRenderer.invoke('addons:delete', type, addonId),
  },

  // Playit.gg Integration
  playit: {
    start: () => ipcRenderer.invoke('playit:start'),
    stop: () => ipcRenderer.invoke('playit:stop'),
    getStatus: () => ipcRenderer.invoke('playit:status'),
    onStatusChanged: (callback) => ipcRenderer.on('playit:status-changed', callback),
    onLog: (callback) => ipcRenderer.on('playit:log', callback),
  },

  // Backup Management
  backups: {
    list: () => ipcRenderer.invoke('backups:list'),
    create: (name) => ipcRenderer.invoke('backups:create', name),
    restore: (backupId) => ipcRenderer.invoke('backups:restore', backupId),
    delete: (backupId) => ipcRenderer.invoke('backups:delete', backupId),
    download: (backupId) => ipcRenderer.invoke('backups:download', backupId),
  },

  // Player Management
  players: {
    list: () => ipcRenderer.invoke('players:list'),
    op: (playerName) => ipcRenderer.invoke('players:op', playerName),
    deop: (playerName) => ipcRenderer.invoke('players:deop', playerName),
  },
});