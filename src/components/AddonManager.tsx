import React, { useState, useEffect, useRef } from 'react';
import { Package, Upload, Download, Trash2, Eye, Settings } from 'lucide-react';
import { useElectron } from '../hooks/useElectron';

const AddonManager: React.FC = () => {
  const { api } = useElectron();
  const [activeTab, setActiveTab] = useState<'behavior' | 'resource'>('behavior');
  const [behaviorPacks, setBehaviorPacks] = useState<any[]>([]);
  const [resourcePacks, setResourcePacks] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'behavior' | 'resource'>('behavior');
  const [uploading, setUploading] = useState(false);
  const [showRestartNotice, setShowRestartNotice] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [worlds, setWorlds] = useState<any[]>([]);
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null);

  // Carrega mundos e seleciona o ativo por padrão
  useEffect(() => {
    if (!api) return;
    api.worlds.list().then(ws => {
      setWorlds(ws);
      api.config.getServerProperties().then(props => {
        setSelectedWorld(props['level-name'] || (ws[0]?.id ?? null));
      });
    });
  }, [api]);

  // Carrega todos os packs disponíveis (globais)
  useEffect(() => {
    if (!api) return;
    api.addons.list('behavior').then(setBehaviorPacks);
    api.addons.list('resource').then(setResourcePacks);
  }, [api]);

  // Carrega packs ativos para o mundo selecionado
  const [activeBehaviorIds, setActiveBehaviorIds] = useState<string[]>([]);
  const [activeResourceIds, setActiveResourceIds] = useState<string[]>([]);

  // Atualiza packs ativos sempre que selectedWorld ou packs mudam
  useEffect(() => {
    if (!api || !selectedWorld) return;
    const updateActive = async () => {
      const worldConfig = await api.worlds.getConfig(selectedWorld);
      // O JSON pode ser world_behavior_packs.json/world_resource_packs.json ou behaviorPacks/resourcePacks
      const behavior = (worldConfig?.world_behavior_packs || worldConfig?.behaviorPacks || []);
      const resource = (worldConfig?.world_resource_packs || worldConfig?.resourcePacks || []);
      setActiveBehaviorIds(behavior.map((p: any) => p.pack_id || p.id || p.name));
      setActiveResourceIds(resource.map((p: any) => p.pack_id || p.id || p.name));
    };
    updateActive();
  }, [api, selectedWorld, behaviorPacks, resourcePacks]);

  // Função para ativar/desativar pack para o mundo selecionado
  const toggleAddon = async (id: string) => {
    if (!api || !selectedWorld) return;
    const enabled = getCurrentActiveIds().includes(id);
    // Aguarda a promise para garantir atualização correta
    await api.addons.toggle(activeTab, id, !enabled, selectedWorld);
    // Atualiza packs ativos após alteração
    const worldConfig = await api.worlds.getConfig(selectedWorld);
    const behavior = (worldConfig?.world_behavior_packs || worldConfig?.behaviorPacks || []);
    const resource = (worldConfig?.world_resource_packs || worldConfig?.resourcePacks || []);
    setActiveBehaviorIds(behavior.map((p: any) => p.pack_id || p.id || p.name));
    setActiveResourceIds(resource.map((p: any) => p.pack_id || p.id || p.name));
    // Só mostra aviso se o servidor estiver online
    if (api.server && api.server.getStatus) {
      const status = await api.server.getStatus();
      if (status === 'online') setShowRestartNotice(true);
    }
  };

  // Funções auxiliares
  const getCurrentPacks = () => activeTab === 'behavior' ? behaviorPacks : resourcePacks;
  const getCurrentActiveIds = () => activeTab === 'behavior' ? activeBehaviorIds : activeResourceIds;

  const setCurrentPacks = (packs: any[]) => {
    if (activeTab === 'behavior') setBehaviorPacks(packs);
    else setResourcePacks(packs);
  };

  const deleteAddon = async (id: string) => {
    if (!api) return;
    setPendingDelete(id);
  };

  const confirmDeleteAddon = async () => {
    if (!api || !pendingDelete) return;
    await api.addons.delete(activeTab, pendingDelete);
    api.addons.list(activeTab).then(setCurrentPacks);
    setPendingDelete(null);
  };

  const cancelDeleteAddon = () => setPendingDelete(null);

  const handleInstallAddon = async () => {
    if (!api) return;
    setUploading(true);
    await api.addons.install(uploadType);
    setUploading(false);
    setShowUploadModal(false);
    // Atualize a lista global
    api.addons.list(uploadType).then(uploadType === 'behavior' ? setBehaviorPacks : setResourcePacks);
    // Atualize a lista de packs ativos do mundo selecionado
    if (selectedWorld) {
      api.worlds.getConfig(selectedWorld).then(worldConfig => {
        setActiveBehaviorIds(
          (worldConfig?.behaviorPacks || worldConfig?.world_behavior_packs || []).map((p: any) => p.pack_id || p.id || p.name)
        );
        setActiveResourceIds(
          (worldConfig?.resourcePacks || worldConfig?.world_resource_packs || []).map((p: any) => p.pack_id || p.id || p.name)
        );
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Aviso de reinício */}
      {showRestartNotice && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <span className="text-yellow-800 dark:text-yellow-300 text-sm">
            É necessário reiniciar o servidor para aplicar as alterações de Addons/Resource Packs.
          </span>
          <button
            className="ml-4 px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowRestartNotice(false)}
          >
            OK
          </button>
        </div>
      )}

      {/* Seletor de mundo */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Gerenciar Addons/Resource Packs do mundo:
        </label>
        <select
          value={selectedWorld || ''}
          onChange={e => setSelectedWorld(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {worlds.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      {/* Modal de confirmação de exclusão */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Excluir Addon/Pack
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Tem certeza que deseja excluir <span className="font-bold">{pendingDelete}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDeleteAddon}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteAddon}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gerenciador de Addons e Resource Packs
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerencie Behavior Packs (Addons) e Resource Packs do seu servidor
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
          >
            <Upload className="w-4 h-4" />
            Instalar Addon/Pack
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
              Addons (Behavior Packs) ({behaviorPacks.length})
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
            {getCurrentPacks().map((addon) => {
              const enabled = getCurrentActiveIds().includes(addon.id);
              return (
                <div key={addon.id} className={`p-4 rounded-lg border transition-all duration-200 ${
                  enabled 
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
                          {enabled && (
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
                      {/* Botão de ativar/desativar como switch visual */}
                      <button
                        onClick={() => toggleAddon(addon.id)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors duration-200
                          ${enabled
                            ? 'bg-green-500 border-green-600 text-white hover:bg-green-600'
                            : 'bg-gray-200 border-gray-400 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-600'
                          }`}
                        title={enabled ? 'Desativar' : 'Ativar'}
                        style={{ minWidth: 90 }}
                      >
                        <span className="font-semibold text-xs">
                          {enabled ? 'Ativo' : 'Inativo'}
                        </span>
                        <span
                          className={`inline-block w-8 h-4 rounded-full transition-colors duration-200
                            ${enabled ? 'bg-green-300' : 'bg-gray-400 dark:bg-gray-600'}`}
                          style={{ position: 'relative' }}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200
                              ${enabled ? 'translate-x-4' : ''}`}
                            style={{
                              transform: enabled ? 'translateX(16px)' : 'translateX(0)'
                            }}
                          />
                        </span>
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
              );
            })}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Instalar Addon ou Resource Pack
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo
                </label>
                <select
                  value={uploadType}
                  onChange={e => setUploadType(e.target.value as 'behavior' | 'resource')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="behavior">Behavior Pack</option>
                  <option value="resource">Resource Pack</option>
                </select>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Clique em "Instalar" e selecione o arquivo .mcpack
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  O arquivo será copiado para a pasta correta do servidor.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleInstallAddon}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
                >
                  {uploading ? 'Instalando...' : 'Instalar'}
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