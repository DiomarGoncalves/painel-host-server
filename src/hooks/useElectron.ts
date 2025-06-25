import { useState, useEffect } from 'react';

declare global {
  interface Window {
    electronAPI: {
      server: {
        start: () => Promise<{ success: boolean; message: string }>;
        stop: () => Promise<{ success: boolean; message: string }>;
        restart: () => Promise<{ success: boolean; message: string }>;
        getStatus: () => Promise<string>;
        executeCommand: (command: string) => Promise<{ success: boolean; message?: string }>;
        onStatusChanged: (callback: (event: any, status: string) => void) => void;
        onLog: (callback: (event: any, log: any) => void) => void;
        removeAllListeners: () => void;
      };
      config: {
        getServerProperties: () => Promise<Record<string, any>>;
        saveServerProperties: (config: Record<string, any>) => Promise<{ success: boolean; message?: string }>;
      };
      worlds: {
        list: () => Promise<any[]>;
        getConfig: (worldName: string) => Promise<any>;
        saveConfig: (worldName: string, config: any) => Promise<{ success: boolean; message?: string }>;
        import: () => Promise<{ success: boolean; message: string }>;
        delete: (worldName: string) => Promise<{ success: boolean; message?: string }>;
        getAddons: (worldName: string) => Promise<{ behavior: any[]; resource: any[] }>;
        installAddon: (worldName: string, type: string) => Promise<{ success: boolean; message: string }>;
        toggleAddon: (worldName: string, type: string, addonId: string, enabled: boolean) => Promise<{ success: boolean; message?: string }>;
        deleteAddon: (worldName: string, type: string, addonId: string) => Promise<{ success: boolean; message?: string }>;
      };
      players: {
        list: () => Promise<any[]>;
        addToAllowlist: (playerName: string) => Promise<{ success: boolean; message?: string }>;
        removeFromAllowlist: (playerName: string) => Promise<{ success: boolean; message?: string }>;
      };
      performance: {
        getStats: () => Promise<any>;
      };
      playit: {
        start: () => Promise<{ success: boolean; message?: string }>;
        stop: () => Promise<{ success: boolean }>;
        getStatus: () => Promise<string>;
        onStatusChanged: (callback: (event: any, status: string) => void) => void;
        onLog: (callback: (event: any, log: string) => void) => void;
        removeAllListeners: () => void;
      };
      backups: {
        list: () => Promise<any[]>;
        create: (name?: string) => Promise<{ success: boolean; message: string }>;
        restore: (backupId: string) => Promise<{ success: boolean; message: string }>;
        delete: (backupId: string) => Promise<{ success: boolean; message?: string }>;
      };
      files: {
        list: (path: string) => Promise<any[]>;
        read: (filePath: string) => Promise<string>;
        write: (filePath: string, content: string) => Promise<{ success: boolean; message?: string }>;
        delete: (filePath: string) => Promise<{ success: boolean; message?: string }>;
        createDirectory: (dirPath: string) => Promise<{ success: boolean; message?: string }>;
        download: (filePath: string) => Promise<{ success: boolean; message?: string }>;
      };
    };
  }
}

export const useElectron = () => {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && !!window.electronAPI);
  }, []);

  return {
    isElectron,
    api: isElectron ? window.electronAPI : null
  };
};