import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Globe, Settings, Gamepad2, FileText } from 'lucide-react';
import { useElectron } from '../hooks/useElectron';

interface WorldConfigProps {
  worldName: string;
  onClose: () => void;
}

const WorldConfig: React.FC<WorldConfigProps> = ({ worldName, onClose }) => {
  const { api } = useElectron();
  const [config, setConfig] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorldConfig();
  }, [worldName]);

  const loadWorldConfig = async () => {
    if (!api) return;
    setLoading(true);
    try {
      const worldConfig = await api.worlds.getConfig(worldName);
      setConfig(worldConfig);
    } catch (error) {
      console.error('Failed to load world config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section: string, key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!api || !config) return;
    try {
      const result = await api.worlds.saveConfig(worldName, config);
      if (result.success) {
        setHasChanges(false);
      } else {
        console.error('Failed to save config:', result.message);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  const handleReset = () => {
    loadWorldConfig();
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Erro ao Carregar Configuração do Mundo
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Falha ao carregar a configuração do mundo "{worldName}".
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configuração do Mundo
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {worldName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors duration-200"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
            >
              Fechar
            </button>
          </div>
        </div>

        {hasChanges && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Você tem alterações não salvas. Não se esqueça de salvar sua configuração.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Arquivos e informações básicas */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Arquivos
              </h4>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Pasta:</span> <span className="text-gray-700 dark:text-gray-200">{config.folder || worldName}</span>
              </div>
              <div>
                <span className="font-medium">Arquivo:</span> <span className="text-gray-700 dark:text-gray-200">level.dat</span>
              </div>
              <div>
                <span className="font-medium">Semente:</span> <span className="text-gray-700 dark:text-gray-200">{config.seed}</span>
              </div>
              <div>
                <span className="font-medium">RandomSeed:</span> <span className="text-gray-700 dark:text-gray-200">{config.randomSeed}</span>
              </div>
            </div>
          </div>

          {/* Configurações básicas */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-purple-600" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Configurações Básicas
              </h4>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Hardcore:</span> <span className="text-gray-700 dark:text-gray-200">{String(config.isHardcore)}</span>
              </div>
              <div>
                <span className="font-medium">Dificuldade:</span> <span className="text-gray-700 dark:text-gray-200">{config.difficulty}</span>
              </div>
              <div>
                <span className="font-medium">educationFeaturesEnabled:</span> <span className="text-gray-700 dark:text-gray-200">{String(config.educationFeaturesEnabled)}</span>
              </div>
            </div>
          </div>

          {/* Regras de jogo */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-green-600" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Regras de Jogo
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.gameRules && Object.entries(config.gameRules).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{key}</span>
                  <span className="text-sm text-gray-900 dark:text-white">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Experimentos */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="w-5 h-5 text-orange-600" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Experimentos
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.experiments && Object.entries(config.experiments).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{key}</span>
                  <span className="text-sm text-gray-900 dark:text-white">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldConfig;