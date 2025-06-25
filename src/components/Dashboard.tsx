import React, { useState, useEffect } from 'react';
import { 
  Users, 
  HardDrive, 
  Cpu, 
  Wifi, 
  WifiOff, 
  Globe,
  Activity,
  Clock,
  Server,
  AlertCircle
} from 'lucide-react';
import { useElectron } from '../hooks/useElectron';

interface DashboardProps {
  serverStatus: 'offline' | 'online' | 'starting' | 'stopping';
  playitStatus: 'disconnected' | 'connected' | 'connecting';
}

const Dashboard: React.FC<DashboardProps> = ({ serverStatus, playitStatus }) => {
  const { api } = useElectron();
  const [stats, setStats] = useState({
    players: { online: 0, max: 20 },
    memory: { used: 0, total: 4 },
    cpu: 0,
    uptime: '0h 0m',
    tps: 20,
    chunks: 0,
    entities: 0
  });

  const [recentPlayers, setRecentPlayers] = useState<any[]>([]);
  const [serverInfo, setServerInfo] = useState({
    version: 'Bedrock Server',
    world: 'Loading...',
    gamemode: 'Unknown',
    difficulty: 'Unknown',
    port: '19132'
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServerData();
    
    // Atualizar dados a cada 5 segundos se o servidor estiver online
    const interval = setInterval(() => {
      if (serverStatus === 'online') {
        loadPerformanceStats();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [api, serverStatus]);

  const loadServerData = async () => {
    setLoading(true);
    setError(null);
    
    if (!api) {
      // Dados padrão para versão web
      setServerInfo({
        version: 'Bedrock Server (Web Demo)',
        world: 'Demo World',
        gamemode: 'survival',
        difficulty: 'normal',
        port: '19132'
      });
      setLoading(false);
      return;
    }

    try {
      // Carregar propriedades do servidor
      const config = await api.config.getServerProperties();
      if (config) {
        setServerInfo({
          version: 'Bedrock Server 1.20.60',
          world: config['level-name'] || 'Bedrock level',
          gamemode: config['gamemode'] || 'survival',
          difficulty: config['difficulty'] || 'normal',
          port: config['server-port'] || '19132'
        });

        // Atualizar max players
        setStats(prev => ({
          ...prev,
          players: { ...prev.players, max: parseInt(config['max-players']) || 20 }
        }));
      }

      // Carregar jogadores recentes
      const players = await api.players.list();
      setRecentPlayers(players.slice(0, 5));

      // Carregar estatísticas se servidor estiver online
      if (serverStatus === 'online') {
        await loadPerformanceStats();
      }
    } catch (error) {
      console.error('Failed to load server data:', error);
      setError('Failed to load server data. Please check server configuration.');
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceStats = async () => {
    if (!api) return;
    
    try {
      const performanceStats = await api.performance.getStats();
      if (performanceStats) {
        setStats(prev => ({
          players: { 
            online: performanceStats.players || 0, 
            max: prev.players.max 
          },
          memory: { 
            used: performanceStats.memory || 0, 
            total: 4 
          },
          cpu: performanceStats.cpu || 0,
          uptime: performanceStats.uptime || '0h 0m',
          tps: performanceStats.tps || 20,
          chunks: performanceStats.chunks || 0,
          entities: performanceStats.entities || 0
        }));
      }
    } catch (error) {
      console.error('Failed to load performance stats:', error);
    }
  };

  const statsCards = [
    {
      title: 'Players Online',
      value: `${stats.players.online}/${stats.players.max}`,
      icon: Users,
      color: 'bg-blue-500',
      change: serverStatus === 'online' ? `${stats.players.online} connected` : 'Server offline'
    },
    {
      title: 'Memory Usage',
      value: `${stats.memory.used.toFixed(1)} GB`,
      icon: HardDrive,
      color: 'bg-green-500',
      change: serverStatus === 'online' ? `${((stats.memory.used / stats.memory.total) * 100).toFixed(0)}% of ${stats.memory.total}GB` : 'Server offline'
    },
    {
      title: 'CPU Usage',
      value: serverStatus === 'online' ? `${stats.cpu.toFixed(0)}%` : '0%',
      icon: Cpu,
      color: 'bg-yellow-500',
      change: serverStatus === 'online' ? 'Normal load' : 'Server offline'
    },
    {
      title: 'Server TPS',
      value: serverStatus === 'online' ? `${stats.tps.toFixed(1)}` : '0.0',
      icon: Activity,
      color: 'bg-purple-500',
      change: serverStatus === 'online' ? 'Ticks per second' : 'Server offline'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error Loading Dashboard
          </h4>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={loadServerData}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
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
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {stat.change}
                </p>
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
              Server Information
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Server Version
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {serverInfo.version}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Current World
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {serverInfo.world}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Game Mode
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {serverInfo.gamemode}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Difficulty
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {serverInfo.difficulty}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Server Port
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {serverInfo.port}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Uptime
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats.uptime}
                </p>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          {serverStatus === 'online' && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Performance Metrics
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">TPS:</span>
                  <span className={`ml-2 font-medium ${
                    stats.tps >= 18 ? 'text-green-600' : 
                    stats.tps >= 15 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {stats.tps.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Chunks:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {stats.chunks.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Entities:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {stats.entities.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Players & Playit Status */}
        <div className="space-y-6">
          {/* Playit Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <div className="flex items-center gap-3 mb-4">
              {playitStatus === 'connected' ? (
                <Wifi className="w-6 h-6 text-green-600" />
              ) : (
                <WifiOff className="w-6 h-6 text-red-600" />
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Playit.gg Tunnel
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                <span className={`text-sm font-medium capitalize ${
                  playitStatus === 'connected' ? 'text-green-600' : 
                  playitStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {playitStatus}
                </span>
              </div>
              
              {playitStatus === 'connected' && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-xs text-green-800 dark:text-green-300 font-medium">
                    External access enabled
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Players can connect from anywhere
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Players */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Allowlisted Players
              </h3>
            </div>
            
            <div className="space-y-3">
              {recentPlayers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No players in allowlist
                  </p>
                </div>
              ) : (
                recentPlayers.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        serverStatus === 'online' && stats.players.online > 0 ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {player.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {player.permissions || 'member'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      serverStatus === 'online' && stats.players.online > 0
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                    }`}>
                      {serverStatus === 'online' && stats.players.online > 0 ? 'online' : 'offline'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 text-center rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200">
            <Globe className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Manage Worlds
            </span>
          </button>
          <button className="p-4 text-center rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200">
            <Activity className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              View Logs
            </span>
          </button>
          <button className="p-4 text-center rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-200">
            <HardDrive className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Create Backup
            </span>
          </button>
          <button className="p-4 text-center rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors duration-200">
            <Wifi className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Setup Tunnel
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;