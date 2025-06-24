import React, { useEffect, useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Play, 
  Square, 
  RotateCcw,
  Download,
  ExternalLink,
  Copy,
  AlertCircle,
  CheckCircle,
  Activity
} from 'lucide-react';
import { useElectron } from '../hooks/useElectron';

interface PlayitIntegrationProps {
  playitStatus: 'disconnected' | 'connected' | 'connecting';
  setPlayitStatus: (status: 'disconnected' | 'connected' | 'connecting') => void;
}

const PlayitIntegration: React.FC<PlayitIntegrationProps> = ({ playitStatus, setPlayitStatus }) => {
  const { api } = useElectron();
  const [publicUrl, setPublicUrl] = useState('');
  const [tunnelLogs, setTunnelLogs] = useState<string[]>([]);
  const [playitInstalled, setPlayitInstalled] = useState(true);
  const [autoRestart, setAutoRestart] = useState(true);
  const [localPort, setLocalPort] = useState('19132');

  useEffect(() => {
    if (!api) return;
    api.playit.onStatusChanged((_event, status) => setPlayitStatus(status));
    api.playit.onLog((_event, log) => {
      setTunnelLogs(prev => [...prev, log]);
      // Detecta URL pública no log
      const urlMatch = log.match(/URL pública: (.+)/i);
      if (urlMatch) setPublicUrl(urlMatch[1]);
    });
    api.playit.getStatus().then(setPlayitStatus);
  }, [api, setPlayitStatus]);

  const startTunnel = async () => {
    if (!api) return;
    await api.playit.start();
  };

  const stopTunnel = async () => {
    if (!api) return;
    await api.playit.stop();
  };

  const restartTunnel = async () => {
    await stopTunnel();
    setTimeout(() => startTunnel(), 1000);
  };

  const copyUrl = () => {
    if (publicUrl) navigator.clipboard.writeText(publicUrl);
  };

  const downloadPlayit = () => {
    window.open('https://playit.gg/download', '_blank');
  };

  const getStatusColor = () => {
    switch (playitStatus) {
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-red-600';
      case 'connecting': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (playitStatus) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'disconnected': return <WifiOff className="w-5 h-5 text-red-500" />;
      case 'connecting': return <Activity className="w-5 h-5 text-yellow-500 animate-pulse" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Integração Playit.gg
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Crie túneis para tornar seu servidor acessível de qualquer lugar
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!playitInstalled && (
            <button
              onClick={downloadPlayit}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              Baixar Playit
            </button>
          )}
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Status do Túnel
              </h4>
              <p className={`text-sm font-medium capitalize ${getStatusColor()}`}>
                {playitStatus === 'connected'
                  ? 'Conectado'
                  : playitStatus === 'connecting'
                  ? 'Conectando'
                  : 'Desconectado'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={startTunnel}
              disabled={playitStatus === 'connected' || playitStatus === 'connecting'}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-md transition-colors duration-200"
            >
              <Play className="w-4 h-4" />
              Iniciar
            </button>
            
            <button
              onClick={stopTunnel}
              disabled={playitStatus === 'disconnected'}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 rounded-md transition-colors duration-200"
            >
              <Square className="w-4 h-4" />
              Parar
            </button>
            
            <button
              onClick={restartTunnel}
              disabled={playitStatus === 'disconnected'}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar
            </button>
          </div>
        </div>

        {playitStatus === 'connected' && publicUrl && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-800 dark:text-green-300">
                URL Pública:
              </span>
              <button
                onClick={copyUrl}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 rounded transition-colors duration-200"
              >
                <Copy className="w-3 h-3" />
                Copiar
              </button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 text-sm font-mono bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded text-green-800 dark:text-green-300">
                {publicUrl}
              </code>
              <button className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Configuração do Túnel
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Porta Local
            </label>
            <input
              type="number"
              value={localPort}
              onChange={e => setLocalPort(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Protocolo
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
              <option value="udp">UDP</option>
              <option value="tcp">TCP</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reiniciar túnel automaticamente
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Reinicia o túnel automaticamente se desconectar
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoRestart}
                onChange={(e) => setAutoRestart(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Connection Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {playitStatus === 'connected' ? '2.4s' : '0ms'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Latência do Túnel
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {playitStatus === 'connected' ? '2' : '0'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Conexões Ativas
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {playitStatus === 'connected' ? '2h 45m' : '0h 0m'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tempo de Atividade do Túnel
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tunnel Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Logs do Túnel
        </h4>
        <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 h-64 overflow-y-auto">
          <div className="space-y-1">
            {tunnelLogs.map((log, index) => (
              <div key={index} className="text-sm font-mono text-green-400">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayitIntegration;