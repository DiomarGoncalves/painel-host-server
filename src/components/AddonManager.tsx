import React, { useState, useEffect } from 'react';
import { Package, Upload, Download, Trash2, ToggleLeft as Toggle, Eye, Settings, Plus, Globe, AlertCircle } from 'lucide-react';
import { useElectron } from '../hooks/useElectron';

const AddonManager: React.FC = () => {
  const { api } = useElectron();
  const [activeTab, setActiveTab] = useState<'behavior' | 'resource'>('behavior');
  const [selectedWorld, setSelectedWorld] = useState<string>('');
  const [worlds, setWorlds] = useState<any[]>([]);
  const [behaviorPacks, setBehaviorPacks] = useState<any[]>([]);
  const [resourcePacks, setResourcePacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadWorlds();
  }, [api]);

  useEffect(() => {
    if (selectedWorld) {
      loadAddons();
    } else {
      setBehaviorPacks([]);
      setResourcePacks([]);
    }
  }, [selectedWorld, api]);

  const loadWorlds = async () => {
    setLoading(true);
    setError(null);
    
    if (!api) {
      // Fallback for web version - show empty state
      setWorlds([]);
      setLoading(false);
      return;
    }
    
    try {
      const worldList = await api.worlds.list();
      setWorlds(worldList || []);
      
      // Auto-select first world if available
      if (worldList && worldList.length > 0 && !selectedWorld) {
        setSelectedWorld(worldList[0].id);
      }
    } catch (error) {
      console.error('Failed to load worlds:', error);
      setError('Failed to load worlds. Please check if the server files are properly configured.');
      setWorlds([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAddons = async () => {
    if (!api || !selectedWorld) return;
    
    try {
      const addons = await api.worlds.getAddons(selectedWorld);
      setBehaviorPacks(addons?.behavior || []);
      setResourcePacks(addons?.resource || []);
    } catch (error) {
      console.error('Failed to load addons:', error);
      setBehaviorPacks([]);
      setResourcePacks([]);
    }
  };

  const getCurrentPacks = () => {
    return activeTab === 'behavior' ? behaviorPacks : resourcePacks;
  };

  const toggleAddon = async (id: string) => {
    if (!api || !selectedWorld) return;
    
    const packs = getCurrentPacks();
    const addon = packs.find(pack => pack.id === id);
    if (!addon) return;

    try {
      const result = await api.worlds.toggleAddon(selectedWorld, activeTab, id, !addon.enabled);
      if (result.success) {
        await loadAddons();
      } else {
        console.error('Failed to toggle addon:', result.message);
      }
    } catch (error) {
      console.error('Failed to toggle addon:', error);
    }
  };

  const deleteAddon = async (id: string) => {
    if (!api || !selectedWorld) return;
    
    if (confirm('Are you sure you want to delete this addon?')) {
      try {
        const result = await api.worlds.deleteAddon(selectedWorld, activeTab, id);
        if (result.success) {
          await loadAddons();
        } else {
          console.error('Failed to delete addon:', result.message);
        }
      } catch (error) {
        console.error('Failed to delete addon:', error);
      }
    }
  };

  const installAddon = async () => {
    if (!api || !selectedWorld) return;
    
    try {
      const result = await api.worlds.installAddon(selectedWorld, activeTab);
      if (result.success) {
        await loadAddons();
        setShowUploadModal(false);
      } else {
        console.error('Failed to install addon:', result.message);
      }
    } catch (error) {
      console.error('Failed to install addon:', error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading addon manager...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error Loading Addon Manager
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

  // Show no worlds state
  if (worlds.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Addon Manager
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage behavior packs and resource packs for your worlds
            </p>
          </div>
        </div>

        <div className="text-center py-12">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Worlds Found
          </h4>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            You need to import or create a world before you can manage addons.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={loadWorlds}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Refresh
            </button>
          </div>
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
            Addon Manager
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage behavior packs and resource packs for your worlds
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedWorld}
            onChange={(e) => setSelectedWorld(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a world...</option>
            {worlds.map((world) => (
              <option key={world.id} value={world.id}>
                {world.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowUploadModal(true)}
            disabled={!selectedWorld}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors duration-200"
          >
            <Upload className="w-4 h-4" />
            Install Addon
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {behaviorPacks.filter(p => p.enabled).length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Active Behavior Packs
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {resourcePacks.filter(p => p.enabled).length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Active Resource Packs
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {behaviorPacks.length + resourcePacks.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Addons
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* World Selection Required */}
      {!selectedWorld ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Select a World
          </h4>
          <p className="text-gray-500 dark:text-gray-400">
            Choose a world from the dropdown above to manage its addons.
          </p>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('behavior')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'behavior'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Behavior Packs ({behaviorPacks.length})
                </button>
                <button
                  onClick={() => setActiveTab('resource')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'resource'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Resource Packs ({resourcePacks.length})
                </button>
              </nav>
            </div>

            {/* Addon List */}
            <div className="p-6">
              {getCurrentPacks().length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No {activeTab === 'behavior' ? 'Behavior' : 'Resource'} Packs
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Install some addons to get started.
                  </p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
                  >
                    <Upload className="w-4 h-4" />
                    Install Addon
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {getCurrentPacks().map((addon) => (
                    <div key={addon.id} className={`p-4 rounded-lg border transition-all duration-200 ${
                      addon.enabled 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            activeTab === 'behavior' ? 'bg-blue-500' : 'bg-purple-500'
                          }`}>
                            {activeTab === 'behavior' ? (
                              <Settings className="w-6 h-6 text-white" />
                            ) : (
                              <Eye className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {addon.name}
                              </h4>
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300 rounded-full">
                                v{addon.version}
                              </span>
                              {addon.enabled && (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {addon.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                              <span>By {addon.author}</span>
                              <span>{addon.size}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAddon(addon.id)}
                            className={`p-2 rounded-md transition-colors duration-200 ${
                              addon.enabled
                                ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20'
                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                            title={addon.enabled ? 'Disable' : 'Enable'}
                          >
                            <Toggle className="w-5 h-5" />
                          </button>
                          
                          <button 
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200"
                            title="Download"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          
                          <button 
                            onClick={() => deleteAddon(addon.id)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Install Addon
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  World
                </label>
                <input
                  type="text"
                  value={worlds.find(w => w.id === selectedWorld)?.name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Addon Type
                </label>
                <select 
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as 'behavior' | 'resource')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="behavior">Behavior Pack</option>
                  <option value="resource">Resource Pack</option>
                </select>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Click to select addon file
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Supports .mcpack, .mcaddon, and .zip files
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={installAddon}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
                >
                  Install
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddonManager;