import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Upload, 
  Download, 
  Trash2, 
  Plus, 
  FolderOpen,
  Archive,
  RotateCcw,
  Play,
  Pause,
  Settings,
  Package,
  AlertCircle
} from 'lucide-react';
import { useElectron } from '../hooks/useElectron';
import WorldConfig from './WorldConfig';

const WorldManager: React.FC = () => {
  const { api } = useElectron();
  const [worlds, setWorlds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorlds();
  }, [api]);

  const loadWorlds = async () => {
    setLoading(true);
    setError(null);
    
    if (!api) {
      // Dados simulados para versão web
      const mockWorlds = [
        {
          id: 'survival-world',
          name: 'Survival World',
          path: '/worlds/survival-world',
          size: '245 MB',
          created: '2024-01-15T10:30:00Z',
          lastModified: '2024-01-20T14:30:00Z',
          gamemode: 'survival',
          difficulty: 'normal'
        },
        {
          id: 'creative-world',
          name: 'Creative Building',
          path: '/worlds/creative-world',
          size: '512 MB',
          created: '2024-01-10T08:15:00Z',
          lastModified: '2024-01-18T16:45:00Z',
          gamemode: 'creative',
          difficulty: 'peaceful'
        }
      ];
      setWorlds(mockWorlds);
      setLoading(false);
      return;
    }
    
    try {
      const worldList = await api.worlds.list();
      setWorlds(worldList || []);
    } catch (error) {
      console.error('Failed to load worlds:', error);
      setError('Failed to load worlds. Please check if the server files are properly configured.');
      setWorlds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImportWorld = async () => {
    if (!api) {
      alert('Import functionality is only available in the desktop version.');
      return;
    }
    
    try {
      const result = await api.worlds.import();
      if (result.success) {
        await loadWorlds();
      } else {
        alert(`Failed to import world: ${result.message}`);
      }
    } catch (error) {
      console.error('Failed to import world:', error);
      alert('Failed to import world. Please try again.');
    }
  };

  const handleDeleteWorld = async (worldId: string) => {
    if (!api) {
      alert('Delete functionality is only available in the desktop version.');
      return;
    }
    
    const world = worlds.find(w => w.id === worldId);
    if (world && confirm(`Are you sure you want to delete the world "${world.name}"? This action cannot be undone.`)) {
      try {
        const result = await api.worlds.delete(worldId);
        if (result.success) {
          await loadWorlds();
        } else {
          alert(`Failed to delete world: ${result.message}`);
        }
      } catch (error) {
        console.error('Failed to delete world:', error);
        alert('Failed to delete world. Please try again.');
      }
    }
  };

  const handleConfigureWorld = (worldId: string) => {
    setSelectedWorld(worldId);
    setShowConfigModal(true);
  };

  const handleDownloadWorld = (worldId: string) => {
    if (!api) {
      alert('Download functionality is only available in the desktop version.');
      return;
    }
    
    console.log('Download world:', worldId);
    alert('World download functionality will be implemented soon.');
  };

  const handleCloseConfig = () => {
    setShowConfigModal(false);
    setSelectedWorld(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading worlds...</span>
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
            Error Loading Worlds
          </h4>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={loadWorlds}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            World Manager
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your Minecraft worlds and configurations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadWorlds}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <RotateCcw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleImportWorld}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
          >
            <Upload className="w-4 h-4" />
            Import World
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {worlds.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Worlds
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {worlds.reduce((total, world) => {
                  const size = parseFloat(world.size?.replace(/[^0-9.]/g, '') || '0');
                  return total + size;
                }, 0).toFixed(1)} MB
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Size
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Archive className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {worlds.filter(w => w.lastModified && new Date(w.lastModified) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Recently Modified
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Worlds Grid */}
      {worlds.length === 0 ? (
        <div className="text-center py-12">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Worlds Found
          </h4>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Import a world to get started with your server.
          </p>
          <button
            onClick={handleImportWorld}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
          >
            <Upload className="w-4 h-4" />
            Import World
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {worlds.map((world) => (
            <div key={world.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {world.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {world.gamemode || 'Survival'} • {world.difficulty || 'Normal'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Size:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{world.size || 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Created:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {world.created ? new Date(world.created).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Modified:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {world.lastModified ? new Date(world.lastModified).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleConfigureWorld(world.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
                >
                  <Settings className="w-4 h-4" />
                  Configure
                </button>
                
                <button
                  onClick={() => handleDownloadWorld(world.id)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors duration-200"
                  title="Download World"
                >
                  <Download className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDeleteWorld(world.id)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                  title="Delete World"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* World Configuration Modal */}
      {showConfigModal && selectedWorld && (
        <WorldConfig
          worldId={selectedWorld}
          onClose={handleCloseConfig}
        />
      )}
    </div>
  );
};

export default WorldManager;