import React, { useEffect, useState } from 'react';
import { 
  Users, 
  HardDrive, 
  Cpu, 
  Wifi, 
  WifiOff, 
  Globe,
  Activity,
  Clock,
  Server
} from 'lucide-react';
import { useElectron } from '../hooks/useElectron';

interface DashboardProps {
  serverStatus: 'offline' | 'online' | 'starting' | 'stopping';
  playitStatus: 'disconnected' | 'connected' | 'connecting';
}

const Dashboard: React.FC<DashboardProps> = ({ serverStatus, playitStatus }) => {
  const { api } = useElectron();
  const [serverIp, setServerIp] = useState<string>('127.0.0.1');
  const [stats, setStats] = useState({
    playersOnline: 0,
    memory: '0',
    cpu: '0',
    uptime: 0,
  });
  const [recentPlayers, setRecentPlayers] = useState<{ name: string, lastSeen: string, status: string }[]>([]);
  const [serverInfo, setServerInfo] = useState({
    version: '',
    world: '',
    gamemode: '',
    difficulty: '',
    port: '',
    ip: '',
  });

  useEffect(() => {
    if (api) {
      api.server.getIp().then(setServerIp);
      api.server.onIpChanged((_event, ip) => setServerIp(ip));
      api.server.getStats().then(setStats);
      api.server.onStats((_event, s) => setStats(s));
      if (api.server.onRecentPlayers) {
        api.server.onRecentPlayers((_event, players) => setRecentPlayers(players));
      }
      // Buscar informações do servidor (server.properties)
      api.config.getServerProperties().then((props) => {
        setServerInfo({
          version: props['server-version'] || '',
          world: props['level-name'] || '',
          gamemode: props['gamemode'] || '',
          difficulty: props['difficulty'] || '',
          port: props['server-port'] ? String(props['server-port']) : '',
          ip: serverIp,
        });
      });
    }
  }, [api, serverIp]);

  function formatUptime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }

  const statsGrid = [
    {
      title: 'Jogadores Online',
      value: serverStatus === 'online' ? `${stats.playersOnline}/${serverInfo['max-players'] || 20}` : `0/${serverInfo['max-players'] || 20}`,
      icon: Users,
      color: 'bg-blue-500',
      change: serverStatus === 'online' ? '' : 'Servidor offline'
    },
    {
      title: 'Uso de Memória',
      value: serverStatus === 'online'
        ? `${(Number(stats.memory) / 1024).toFixed(2)} GB`
        : '0 GB',
      icon: HardDrive,
      color: 'bg-green-500',
      change: serverStatus === 'online' ? '' : 'Servidor offline'
    },
    {
      title: 'Uso de CPU',
      value: serverStatus === 'online' ? `${stats.cpu}%` : '0%',
      icon: Cpu,
      color: 'bg-yellow-500',
      change: serverStatus === 'online' ? '' : 'Servidor offline'
    },
    {
      title: 'Tempo Ativo',
      value: serverStatus === 'online' ? formatUptime(stats.uptime) : '0h 0m',
      icon: Clock,
      color: 'bg-purple-500',
      change: serverStatus === 'online' ? '' : 'Servidor offline'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsGrid.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {stat.title}
                </p>
                {stat.change && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {stat.change}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server Information */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center gap-3 mb-6">
            <Server className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Informações do Servidor
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Versão do Servidor
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {serverInfo.version}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Mundo Atual
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {serverInfo.world}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Modo de Jogo
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {serverInfo.gamemode}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Dificuldade
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {serverInfo.difficulty}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Porta do Servidor
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {serverInfo.port}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  IP do Servidor
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {serverIp}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Status Playit.gg
                </label>
                <div className="flex items-center gap-2">
                  {playitStatus === 'connected' ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <p className={`text-sm font-medium capitalize ${
                    playitStatus === 'connected' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {playitStatus === 'connected' ? 'Conectado' : playitStatus === 'connecting' ? 'Conectando' : 'Desconectado'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Players */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Jogadores Recentes
            </h3>
          </div>
          
          <div className="space-y-3">
            {recentPlayers.length === 0 && (
              <div className="text-center text-gray-400 text-sm">
                Nenhum jogador recente encontrado.
              </div>
            )}
            {recentPlayers.map((player, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    player.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {player.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {player.lastSeen}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  player.status === 'online'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                }`}>
                  {player.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 text-center rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200">
            <Globe className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Trocar Mundo
            </span>
          </button>
          <button className="p-4 text-center rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200">
            <Activity className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Ver Logs
            </span>
          </button>
          <button className="p-4 text-center rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-200">
            <HardDrive className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Criar Backup
            </span>
          </button>
          <button className="p-4 text-center rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors duration-200">
            <Wifi className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Configurar Túnel
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;