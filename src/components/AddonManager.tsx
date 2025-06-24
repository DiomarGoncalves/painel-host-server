import React, { useState, useEffect } from 'react';
import { Package, Upload, Download, Trash2, ToggleLeft as Toggle, Eye, Settings, Plus } from 'lucide-react';
import { useElectron } from '../hooks/useElectron';

const AddonManager: React.FC = () => {
  const { api } = useElectron();
  const [activeTab, setActiveTab] = useState<'behavior' | 'resource'>('behavior');
  const [behaviorPacks, setBehaviorPacks] = useState<any[]>([]);
  const [resourcePacks, setResourcePacks] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (!api) return;
    api.addons.list('behavior').then(setBehaviorPacks);
    api.addons.list('resource').then(setResourcePacks);
  }, [api]);

  const getCurrentPacks = () => activeTab === 'behavior' ? behaviorPacks : resourcePacks;
  const setCurrentPacks = (packs: any[]) => {
    if (activeTab === 'behavior') setBehaviorPacks(packs);
    else setResourcePacks(packs);
  };

  const toggleAddon = async (id: string) => {
    if (!api) return;
    const packs = getCurrentPacks();
    const addon = packs.find(p => p.id === id);
    if (!addon) return;
    await api.addons.toggle(activeTab, id, !addon.enabled);
    // Atualize a lista após a alteração
    api.addons.list(activeTab).then(setCurrentPacks);
  };

  const deleteAddon = async (id: string) => {
    if (!api) return;
    if (confirm('Tem certeza de que deseja excluir este addon?')) {
      await api.addons.delete(activeTab, id);
      api.addons.list(activeTab).then(setCurrentPacks);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gerenciador de Addons
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerencie behavior packs e resource packs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
          >
            <Upload className="w-4 h-4" />
            Instalar Addon
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
                Behavior Packs Ativos
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
                Resource Packs Ativos
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
                {(behaviorPacks.length + resourcePacks.length)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total de Addons
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

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
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {addon.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                        <span>Por {addon.author}</span>
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
                      title={addon.enabled ? 'Desativar' : 'Ativar'}
                    >
                      <Toggle className="w-5 h-5" />
                    </button>
                    
                    <button 
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200"
                      title="Baixar"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    
                    <button 
                      onClick={() => deleteAddon(addon.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Instalar Addon
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Addon
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
                  <option value="behavior">Behavior Pack</option>
                  <option value="resource">Resource Pack</option>
                </select>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Arraste seu arquivo de addon aqui ou clique para procurar
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Suporta arquivos .mcpack, .mcaddon e .zip
                </p>
                <input
                  type="file"
                  accept=".mcpack,.mcaddon,.zip"
                  className="hidden"
                  id="addon-upload"
                />
                <label
                  htmlFor="addon-upload"
                  className="inline-block mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Procurar Arquivos
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200">
                  Instalar
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