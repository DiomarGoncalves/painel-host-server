import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useElectron } from '../hooks/useElectron';

const gamemodeOptions = [
  { value: 'survival', label: 'Sobrevivência' },
  { value: 'creative', label: 'Criativo' },
  { value: 'adventure', label: 'Aventura' },
  { value: 'spectator', label: 'Espectador' }
];

const difficultyOptions = [
  { value: 'peaceful', label: 'Pacífico' },
  { value: 'easy', label: 'Fácil' },
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Difícil' }
];

const ServerConfig: React.FC = () => {
  const { api } = useElectron();
  const [config, setConfig] = useState<any>(null);
  const [originalConfig, setOriginalConfig] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api) return;
    setLoading(true);
    api.config.getServerProperties().then((props) => {
      setConfig(props);
      setOriginalConfig(props);
      setLoading(false);
    });
  }, [api]);

  // Novo: renderiza input adequado para cada tipo
  const renderInput = (key: string, value: any) => {
    // Select para gamemode
    if (key === 'gamemode') {
      return (
        <select
          value={value}
          onChange={e => handleInputChange(key, e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          {gamemodeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }
    // Select para dificuldade
    if (key === 'difficulty') {
      return (
        <select
          value={value}
          onChange={e => handleInputChange(key, e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          {difficultyOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }
    // Tenta detectar booleanos
    if (value === 'true' || value === 'false' || typeof value === 'boolean') {
      const checked = value === true || value === 'true';
      return (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={e => handleInputChange(key, e.target.checked)}
            className="switch-input"
          />
          <span className="ml-2">{checked ? 'Sim' : 'Não'}</span>
        </label>
      );
    }
    // Tenta detectar números
    if (!isNaN(value) && value !== '' && value !== null) {
      return (
        <input
          type="number"
          value={value}
          onChange={e => handleInputChange(key, e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      );
    }
    // Default: texto
    return (
      <input
        type="text"
        value={value ?? ''}
        onChange={e => handleInputChange(key, e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
      />
    );
  };

  const handleInputChange = (key: string, value: any) => {
    // Converte para string para manter compatibilidade com server.properties
    let newValue = value;
    if (typeof value === 'boolean') newValue = value ? 'true' : 'false';
    setConfig((prev: any) => ({
      ...prev,
      [key]: newValue
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!api || !config) return;
    setLoading(true);
    const result = await api.config.saveServerProperties(config);
    if (result.success) {
      setOriginalConfig(config);
      setHasChanges(false);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setConfig(originalConfig);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">
          Falha ao carregar configuração do servidor.
        </div>
      </div>
    );
  }

  // Campos básicos para exibir (pode ajustar conforme necessário)
  const basicFields = [
    { key: 'server-name', label: 'Nome do Servidor' },
    { key: 'level-name', label: 'Nome do Mundo' },
    { key: 'gamemode', label: 'Modo de Jogo' },
    { key: 'difficulty', label: 'Dificuldade' },
    { key: 'max-players', label: 'Máx. Jogadores' },
    { key: 'server-port', label: 'Porta do Servidor' },
    { key: 'allow-cheats', label: 'Permitir Cheats' },
    { key: 'online-mode', label: 'Modo Online' },
    { key: 'white-list', label: 'Whitelist' },
  ];

  // Campos avançados: todos os outros
  const advancedFields = Object.keys(config)
    .filter(
      (key) =>
        !basicFields.find((f) => f.key === key)
    )
    .sort();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Configuração do Servidor
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
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
            Salvar
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        {basicFields.map((field) => (
          <div key={field.key} className="flex items-center gap-4">
            <label className="w-48 text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
            </label>
            {renderInput(field.key, config[field.key])}
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
      >
        {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        {showAdvanced ? 'Ocultar Avançado' : 'Mostrar Avançado'}
      </button>

      {showAdvanced && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-600 space-y-4">
          {advancedFields.map((key) => (
            <div key={key} className="flex items-center gap-4">
              <label className="w-48 text-xs font-medium text-gray-500 dark:text-gray-400">
                {key}
              </label>
              {renderInput(key, config[key])}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServerConfig;