import { useState, useEffect } from 'react';

declare global {
  interface Window {
    electronAPI: {
      server: {
        start: () => Promise<{ success: boolean; message: string }>;
        stop: () => Promise<{ success: boolean; message: string }>;
        restart: () => Promise<{ success: boolean; message: string }>;
        getStatus: () => Promise<string>;
        onStatusChanged: (callback: (event: any, status: string) => void) => void;
        onLog: (callback: (event: any, log: any) => void) => void;
        getIp: () => Promise<string>;
        onIpChanged: (callback: (event: any, ip: string) => void) => void;
        getStats: () => Promise<{
          playersOnline: number;
          memory: string;
          cpu: string;
          uptime: number;
        }>;
        onStats: (callback: (event: any, stats: any) => void) => void;
        onRecentPlayers: (callback: (event: any, players: any[]) => void) => void;
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
        download: (worldName: string) => Promise<{ success: boolean; message?: string }>;
        setActive: (worldName: string) => Promise<{ success: boolean; message?: string }>; // NOVO
      };
      addons: {
        list: (type: string) => Promise<any[]>;
        install: (type: string) => Promise<{ success: boolean; message: string }>;
        toggle: (type: string, addonId: string, enabled: boolean) => Promise<{ success: boolean; message?: string }>;
        delete: (type: string, addonId: string) => Promise<{ success: boolean; message?: string }>;
      };
      playit: {
        start: () => Promise<{ success: boolean; message?: string }>;
        stop: () => Promise<{ success: boolean }>;
        getStatus: () => Promise<string>;
        onStatusChanged: (callback: (event: any, status: string) => void) => void;
        onLog: (callback: (event: any, log: string) => void) => void;
      };
      backups: {
        list: () => Promise<any[]>;
        create: (name?: string) => Promise<{ success: boolean; message: string }>;
        restore: (backupId: string) => Promise<{ success: boolean; message: string }>;
        delete: (backupId: string) => Promise<{ success: boolean; message?: string }>;
        download: (backupId: string) => Promise<{ success: boolean; message?: string }>;
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