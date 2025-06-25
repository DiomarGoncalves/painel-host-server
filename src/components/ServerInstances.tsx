import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Plus, 
  Play, 
  Square, 
  RotateCcw, 
  Settings, 
  Trash2,
  Cpu,
  HardDrive,
  Users,
  Activity,
  Copy,
  Edit,
  Eye,
  AlertCircle
} from 'lucide-react';
import { useElectron } from '../hooks/useElectron';

interface ServerInstance {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'starting' | 'stopping';
  port: number;
  players: { online: number; max: number };
  resources: {
    cpu: number;
    memory: { used: number; allocated: number };
    disk: number;
  };
  world: string;
  version: string;
  created: string;
  lastStarted?: string;
}

const ServerInstances: React.FC = () => {
  const { api } = useElectron();
  const [instances, setInstances] = useState<ServerInstance[]>([
    {
      id: 'main-server',
      name: 'Main Bedrock Server',
      status: 'online',
      port: 19132,
      players: { online: 3, max: 20 },
      resources: {
        cpu: 45,
        memory: { used: 2.1, allocated: 4.0 },
        disk: 15
      },
      world: 'Survival World',
      version: '1.20.60',
      created: '2024-01-15',
      lastStarted: '2024-01-20T10:30:00Z'
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInstance, setNewInstance] = useState({
    name: '',
    port: 19133,
    maxPlayers: 20,
    allocatedMemory: 2,
    world: ''
  });

  const createInstance = async () => {
    if (!newInstance.name.trim()) return;

    const instance: ServerInstance = {
      id: `server-${Date.now()}`,
      name: newInstance.name,
      status: 'offline',
      port: newInstance.port,
      players: { online: 0, max: newInstance.maxPlayers },
      resources: {
        cpu: 0,
        memory: { used: 0, allocated: newInstance.allocatedMemory },
        disk: 0
      },
      world: newInstance.world || 'Default World',
      version: '1.20.60',
      created: new Date().toISOString().split('T')[0]
    };

    setInstances(prev => [...prev, instance]);
    setShowCreateModal(false);
    setNewInstance({
      name: '',
      port: 19133,
      maxPlayers: 20,
      allocatedMemory: 2,
      world: ''
    });
  };

  const startInstance = async (instanceId: string) => {
    setInstances(prev => prev.map(instance => 
      instance.id === instanceId 
        ? { ...instance, status: 'starting' as const }
        : instance
    ));

    // Simulate startup
    setTimeout(() => {
      setInstances(prev => prev.map(instance => 
        instance.id === instanceId 
          ? { ...instance, status: 'online' as const, lastStarted: new Date().toISOString() }
          : instance
      ));
    }, 3000);
  };

  const stopInstance = async (instanceId: string) => {
    setInstances(prev => prev.map(instance => 
      instance.id === instanceId 
        ? { ...instance, status: 'stopping' as const }
        : instance
    ));

    setTimeout(() => {
      setInstances(prev => prev.map(instance => 
        instance.id === instanceId 
          ? { ...instance, status: 'offline' as const, players: { ...instance.players, online: 0 } }
          : instance
      ));
    }, 2000);
  };

  const deleteInstance = async (instanceId: string) => {
    const instance = instances.find(i => i.id === instanceId);
    if (instance && confirm(`Are you sure you want to delete "${instance.name}"? This action cannot be undone.`)) {
      setInstances(prev => prev.filter(i => i.id !== instanceId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'offline': return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
      case 'starting': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'stopping': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getTotalResources = () => {
    return instances.reduce((total, instance) => ({
      cpu: total.cpu + instance.resources.cpu,
      memory: total.memory + instance.resources.memory.used,
      allocatedMemory: total.allocatedMemory + instance.resources.memory.allocated,
      players: total.players + instance.players.online
    }), { cpu: 0, memory: 0, allocatedMemory: 0, players: 0 });
  };

  const totalResources = getTotalResources();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Server Instances
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage multiple Minecraft server instances
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          Create Instance
        </button>
      </div>

      {/* Resource Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {instances.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Instances</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Server className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalResources.players}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Players</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalResources.memory.toFixed(1)}GB
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Memory Used</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(totalResources.cpu / instances.length || 0).toFixed(0)}%
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg CPU Usage</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <Cpu className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Instances List */}
      <div className="space-y-4">
        {instances.map((instance) => (
          <div key={instance.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Server className="w-6 h-6 text-white" />
                </div>
                
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {instance.name}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(instance.status)}`}>
                      {instance.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                    <span>Port: {instance.port}</span>
                    <span>World: {instance.world}</span>
                    <span>Version: {instance.version}</span>
                    {instance.lastStarted && (
                      <span>Last started: {new Date(instance.lastStarted).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => startInstance(instance.id)}
                  disabled={instance.status === 'online' || instance.status === 'starting'}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-md transition-colors duration-200"
                >
                  <Play className="w-4 h-4" />
                  Start
                </button>
                
                <button
                  onClick={() => stopInstance(instance.id)}
                  disabled={instance.status === 'offline' || instance.status === 'stopping'}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 rounded-md transition-colors duration-200"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
                
                <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200">
                  <Settings className="w-4 h-4" />
                </button>
                
                <button 
                  onClick={() => deleteInstance(instance.id)}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Resource Usage */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Players</span>
                  <Users className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {instance.players.online}/{instance.players.max}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CPU</span>
                  <Cpu className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {instance.resources.cpu}%
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(instance.resources.cpu, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Memory</span>
                  <HardDrive className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {instance.resources.memory.used.toFixed(1)}/{instance.resources.memory.allocated}GB
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(instance.resources.memory.used / instance.resources.memory.allocated) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                  <Activity className="w-4 h-4 text-gray-500" />
                </div>
                <p className={`text-lg font-bold capitalize ${
                  instance.status === 'online' ? 'text-green-600' :
                  instance.status === 'offline' ? 'text-gray-600' :
                  'text-yellow-600'
                }`}>
                  {instance.status}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Instance Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New Instance
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instance Name
                </label>
                <input
                  type="text"
                  value={newInstance.name}
                  onChange={(e) => setNewInstance(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="My Bedrock Server"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={newInstance.port}
                    onChange={(e) => setNewInstance(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Players
                  </label>
                  <input
                    type="number"
                    value={newInstance.maxPlayers}
                    onChange={(e) => setNewInstance(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allocated Memory (GB)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newInstance.allocatedMemory}
                  onChange={(e) => setNewInstance(prev => ({ ...prev, allocatedMemory: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  World Name
                </label>
                <input
                  type="text"
                  value={newInstance.world}
                  onChange={(e) => setNewInstance(prev => ({ ...prev, world: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Default World"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={createInstance}
                  disabled={!newInstance.name.trim()}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors duration-200"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerInstances;