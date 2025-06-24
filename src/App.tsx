import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Settings, 
  Globe, 
  FolderOpen, 
  Package, 
  Shield, 
  BarChart3,
  Moon,
  Sun,
  Play,
  Square,
  RotateCcw,
  Users,
  HardDrive,
  Cpu,
  Wifi,
  WifiOff,
  Download,
  Upload,
  Trash2,
  Plus,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import ServerConfig from './components/ServerConfig';
import WorldManager from './components/WorldManager';
import AddonManager from './components/AddonManager';
import PlayitIntegration from './components/PlayitIntegration';
import BackupManager from './components/BackupManager';
import ServerLogs from './components/ServerLogs';
import PlayerManager from './components/PlayerManager';
import { useElectron } from './hooks/useElectron';

function App() {
  const { isElectron, api } = useElectron();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [serverStatus, setServerStatus] = useState<'offline' | 'online' | 'starting' | 'stopping'>('offline');
  const [playitStatus, setPlayitStatus] = useState<'disconnected' | 'connected' | 'connecting'>('disconnected');

  const navigation = [
    { id: 'dashboard', label: 'Painel', icon: BarChart3 },
    { id: 'config', label: 'Configuração do Servidor', icon: Settings },
    { id: 'worlds', label: 'Gerenciador de Mundos', icon: Globe },
    { id: 'addons', label: 'Gerenciador de Addons', icon: Package },
    { id: 'players', label: 'Jogadores Online', icon: Users },
    { id: 'playit', label: 'Playit.gg', icon: Wifi },
    { id: 'backups', label: 'Backups', icon: Shield },
    { id: 'logs', label: 'Logs do Servidor', icon: FolderOpen },
  ];

  useEffect(() => {
    if (api) {
      // Set up event listeners for Electron
      api.server.onStatusChanged((event, status) => {
        setServerStatus(status);
      });

      api.playit.onStatusChanged((event, status) => {
        setPlayitStatus(status);
      });

      // Get initial status
      api.server.getStatus().then(setServerStatus);
      api.playit.getStatus().then(setPlayitStatus);
    }
  }, [api]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const startServer = async () => {
    if (!api) {
      // Fallback for web version
      setServerStatus('starting');
      setTimeout(() => setServerStatus('online'), 2000);
      return;
    }

    try {
      const result = await api.server.start();
      if (!result.success) {
        console.error('Failed to start server:', result.message);
      }
    } catch (error) {
      console.error('Failed to start server:', error);
    }
  };

  const stopServer = async () => {
    if (!api) {
      // Fallback for web version
      setServerStatus('stopping');
      setTimeout(() => setServerStatus('offline'), 1500);
      return;
    }

    try {
      const result = await api.server.stop();
      if (!result.success) {
        console.error('Failed to stop server:', result.message);
      }
    } catch (error) {
      console.error('Failed to stop server:', error);
    }
  };

  const restartServer = async () => {
    if (!api) {
      // Fallback for web version
      setServerStatus('stopping');
      setTimeout(() => {
        setServerStatus('starting');
        setTimeout(() => setServerStatus('online'), 2000);
      }, 1500);
      return;
    }

    try {
      const result = await api.server.restart();
      if (!result.success) {
        console.error('Failed to restart server:', result.message);
      }
    } catch (error) {
      console.error('Failed to restart server:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard serverStatus={serverStatus} playitStatus={playitStatus} />;
      case 'config':
        return <ServerConfig />;
      case 'worlds':
        return <WorldManager />;
      case 'addons':
        return <AddonManager />;
      case 'players':
        return <PlayerManager />;
      case 'playit':
        return <PlayitIntegration playitStatus={playitStatus} setPlayitStatus={setPlayitStatus} />;
      case 'backups':
        return <BackupManager />;
      case 'logs':
        return <ServerLogs />;
      default:
        return <Dashboard serverStatus={serverStatus} playitStatus={playitStatus} />;
    }
  };

  const getStatusColor = () => {
    switch (serverStatus) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'starting': return 'text-yellow-600';
      case 'stopping': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      <div className="flex">
        {/* Sidebar */}
        <div className={`w-64 min-h-screen ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r transition-colors duration-200`}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Painel Bedrock
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isElectron ? 'Aplicativo Desktop' : 'Versão Web'}
                </p>
              </div>
            </div>

            {/* Server Controls */}
            <div className="mb-6">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors duration-200`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Status do Servidor
                  </span>
                  <span className={`text-sm font-bold capitalize ${getStatusColor()}`}>
                    {{
                      online: 'Online',
                      offline: 'Offline',
                      starting: 'Iniciando',
                      stopping: 'Parando'
                    }[serverStatus] || serverStatus}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={startServer}
                    disabled={serverStatus === 'online' || serverStatus === 'starting'}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1"
                  >
                    <Play className="w-4 h-4" />
                    Iniciar
                  </button>
                  <button
                    onClick={stopServer}
                    disabled={serverStatus === 'offline' || serverStatus === 'stopping'}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1"
                  >
                    <Square className="w-4 h-4" />
                    Parar
                  </button>
                  <button
                    onClick={restartServer}
                    disabled={serverStatus === 'offline'}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                      activeTab === item.id
                        ? darkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                        : darkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4 transition-colors duration-200`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {navigation.find(item => item.id === activeTab)?.label}
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Gerencie seu servidor Minecraft Bedrock
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;