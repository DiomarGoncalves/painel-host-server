import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useElectron } from '../hooks/useElectron';

const ServerConfig: React.FC = () => {
  const { api } = useElectron();
  const [config, setConfig] = useState<Record<string, any>>({});
  const [originalConfig, setOriginalConfig] = useState<Record<string, any>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, [api]);

  const loadConfig = async () => {
    if (!api) {
      // Configuração padrão para versão web
      const defaultConfig = {
        'server-name': 'Bedrock Server',
        'gamemode': 'survival',
        'difficulty': 'normal',
        'allow-cheats': 'false',
        'max-players': '10',
        'online-mode': 'true',
        'allow-list': 'false',
        'server-port': '19132',
        'server-portv6': '19133',
        'view-distance': '32',
        'tick-distance': '4',
        'player-idle-timeout': '30',
        'max-threads': '8',
        'level-name': 'Bedrock level',
        'level-seed': '',
        'default-player-permission-level': 'member',
        'texturepack-required': 'false',
        'content-log-file-enabled': 'false',
        'compression-threshold': '1'
      };
      setConfig(defaultConfig);
      setOriginalConfig(defaultConfig);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const serverConfig = await api.config.getServerProperties();
      setConfig(serverConfig);
      setOriginalConfig({ ...serverConfig });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to load config:', error);
      setError('Failed to load server configuration. Please check if server.properties exists.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    const newConfig = {
      ...config,
      [key]: value
    };
    setConfig(newConfig);
    
    // Verificar se há mudanças
    const hasChanges = JSON.stringify(newConfig) !== JSON.stringify(originalConfig);
    setHasChanges(hasChanges);
  };

  const handleSave = async () => {
    if (!api || !hasChanges) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const result = await api.config.saveServerProperties(config);
      if (result.success) {
        setOriginalConfig({ ...config });
        setHasChanges(false);
        // Mostrar notificação de sucesso
      } else {
        setError(result.message || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      setError('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({ ...originalConfig });
    setHasChanges(false);
    setError(null);
  };

  const renderField = (key: string, label: string, type: 'text' | 'number' | 'boolean' | 'select', options?: string[]) => {
    const value = config[key] || '';
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {type === 'boolean' ? (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value === 'true' || value === true}
              onChange={(e) => handleInputChange(key, e.target.checked ? 'true' : 'false')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {(value === 'true' || value === true) ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        ) : type === 'select' ? (
          <select
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {options?.map(option => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading configuration...</span>
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
            Server Configuration
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure your Minecraft Bedrock server settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </button>
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors duration-200"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Changes Warning */}
      {hasChanges && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            You have unsaved changes. Don't forget to save your configuration.
          </p>
        </div>
      )}

      {/* Basic Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Basic Settings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderField('server-name', 'Server Name', 'text')}
          {renderField('gamemode', 'Game Mode', 'select', ['survival', 'creative', 'adventure'])}
          {renderField('difficulty', 'Difficulty', 'select', ['peaceful', 'easy', 'normal', 'hard'])}
          {renderField('max-players', 'Max Players', 'number')}
          {renderField('allow-cheats', 'Allow Cheats', 'boolean')}
          {renderField('online-mode', 'Online Mode', 'boolean')}
          {renderField('allow-list', 'Enable Allowlist', 'boolean')}
          {renderField('level-name', 'World Name', 'text')}
        </div>
      </div>

      {/* Network Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Network Settings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderField('server-port', 'IPv4 Port', 'number')}
          {renderField('server-portv6', 'IPv6 Port', 'number')}
          {renderField('view-distance', 'View Distance', 'number')}
          {renderField('tick-distance', 'Tick Distance', 'number')}
          {renderField('player-idle-timeout', 'Player Idle Timeout (minutes)', 'number')}
          {renderField('max-threads', 'Max Threads', 'number')}
        </div>
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Advanced Settings
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('level-seed', 'World Seed', 'text')}
            {renderField('default-player-permission-level', 'Default Permission Level', 'select', ['visitor', 'member', 'operator'])}
            {renderField('texturepack-required', 'Require Texture Pack', 'boolean')}
            {renderField('content-log-file-enabled', 'Enable Content Logging', 'boolean')}
            {renderField('compression-threshold', 'Compression Threshold', 'number')}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerConfig;