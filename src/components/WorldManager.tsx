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
  Settings
} from 'lucide-react';
import { useElectron } from '../hooks/useElectron';
import WorldConfig from './WorldConfig';

const WorldManager: React.FC = () => {
  const { api } = useElectron();
  const [worlds, setWorlds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [activeWorld, setActiveWorld] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    if (api) {
      loadWorlds();
    }
  }, [api]);

  useEffect(() => {
    if (api) {
      // Buscar mundo ativo (level-name do server.properties)
      api.config.getServerProperties().then(props => {
        setActiveWorld(props['level-name'] || null);
      });
    }
  }, [api]);

  const loadWorlds = async () => {
    if (!api) return;
    setLoading(true);
    try {
      const worldList = await api.worlds.list();
      setWorlds(worldList);
    } catch (error) {
      console.error('[WorldManager] Erro ao carregar mundos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportWorld = async () => {
    if (!api) return;
    try {
      const result = await api.worlds.import();
      if (result.success) {
        await loadWorlds();
      } else {
        console.error('[WorldManager] Falha ao importar mundo:', result.message);
      }
    } catch (error) {
      console.error('[WorldManager] Falha ao importar mundo:', error);
    }
  };

  const handleDeleteWorld = async (worldId: string) => {
    setPendingDelete(worldId);
  };

  const confirmDeleteWorld = async () => {
    if (!api || !pendingDelete) return;
    const result = await api.worlds.delete(pendingDelete);
    if (result.success) {
      await loadWorlds();
    }
    setPendingDelete(null);
  };

  const cancelDeleteWorld = () => setPendingDelete(null);

  const handleConfigureWorld = (worldId: string) => {
    setSelectedWorld(worldId);
    setShowConfigModal(true);
  };

  const handleDownloadWorld = async (worldId: string) => {
    if (!api) return;
    try {
      const result = await api.worlds.download(worldId);
      if (!result.success) {
        console.error('[WorldManager] Falha ao baixar mundo:', result.message);
      }
    } catch (error) {
      console.error('[WorldManager] Falha ao baixar mundo:', error);
    }
  };

  const setWorldAsActive = async (worldId: string) => {
    if (!api) return;
    const result = await api.worlds.setActive(worldId);
    if (result.success) {
      setActiveWorld(worldId);
    } else {
      alert('Erro ao definir mundo ativo: ' + (result.message || ''));
    }
    // Opcional: recarregar mundos ou configs se necessário
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modal de confirmação de exclusão */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Excluir Mundo
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Tem certeza que deseja excluir o mundo <span className="font-bold">{pendingDelete}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDeleteWorld}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteWorld}
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
            Gerenciador de Mundos
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerencie seus mundos e configurações do Minecraft
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleImportWorld}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
          >
            <Upload className="w-4 h-4" />
            Importar Mundo
          </button>
        </div>
      </div>

      {/* Worlds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {worlds.map((world) => (
          <div key={world.id} className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border
            ${activeWorld === world.id ? 'border-blue-500 ring-2 ring-blue-400' : 'border-gray-200 dark:border-gray-700'}
            hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {world.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Mundo
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tamanho:</span>
                <span className="font-medium text-gray-900 dark:text-white">{world.size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Criado:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(world.created).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Modificado:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(world.lastModified).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleConfigureWorld(world.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
              >
                <Settings className="w-4 h-4" />
                Configurar
              </button>
              <button
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors duration-200"
                title="Baixar Mundo"
                onClick={() => handleDownloadWorld(world.id)}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteWorld(world.id)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                title="Excluir Mundo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWorldAsActive(world.id)}
                disabled={activeWorld === world.id}
                className={`p-2 ${activeWorld === world.id ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'} rounded-md transition-colors duration-200`}
                title={activeWorld === world.id ? 'Mundo Ativo' : 'Ativar Mundo'}
              >
                {activeWorld === world.id ? 'Ativo' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}

        {worlds.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum Mundo Encontrado
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Importe um mundo para começar a usar seu servidor.
            </p>
            <button
              onClick={handleImportWorld}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
            >
              <Upload className="w-4 h-4" />
              Importar Mundo
            </button>
          </div>
        )}
      </div>

      {/* World Configuration Modal */}
      {showConfigModal && selectedWorld && (
        <WorldConfig
          worldName={selectedWorld}
          onClose={() => {
            setShowConfigModal(false);
            setSelectedWorld(null);
            // Recarrega mundos ao fechar modal de configuração
            loadWorlds();
          }}
        />
      )}

      {/* 
        Observação para desenvolvedores:
        As configurações de cada mundo (como semente, dificuldade, regras de jogo, experimentos, etc.)
        são exibidas no modal de configuração (WorldConfig). Atualmente, os dados são mockados no backend.
        Para implementar leitura/escrita real:
          - level.dat armazena propriedades como seed, randomSeed, isHardcore, difficulty, educationFeaturesEnabled.
          - As regras de jogo (gameRules) e experimentos (experiments) são objetos com chave/valor.
          - Exemplos de gameRules: commandblockoutput, doDaylightCycle, keepInventory, etc.
          - Exemplos de experiments: data_driven_biomes, gametest, jigsaw_structures, etc.
        Para ler/escrever essas propriedades de verdade, use uma biblioteca como 'prismarine-nbt' no backend.
        Veja o prompt para exemplos de nomes e valores.
      */}
    </div>
  );
};

export default WorldManager;