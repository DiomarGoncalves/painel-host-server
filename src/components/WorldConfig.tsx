import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Globe, Settings, Gamepad2 } from 'lucide-react';
import { useElectron } from '../hooks/useElectron';

interface WorldConfigProps {
  worldId: string;
  onClose: () => void;
}

const WorldConfig: React.FC<WorldConfigProps> = ({ worldId, onClose }) => {
  const { api } = useElectron();
  const [config, setConfig] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorldConfig();
  }, [worldId]);

  const loadWorldConfig = async () => {
    if (!api) {
      // Mock para ambiente web
      setConfig({
        seed: '123456',
        hardcore: false,
        difficulty: 2,
        educationFeaturesEnabled: false,
        gameRules: {
          doDaylightCycle: true,
          keepInventory: false,
          randomTickSpeed: 3
        },
        experiments: {
          caves_and_cliffs: true,
          holiday_creatures: false
        }
      });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const worldConfig = await api.worlds.getConfig(worldId);
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
      const result = await api.worlds.saveConfig(worldId, config);
      if (result.success) {
        setHasChanges(false);
        // Show success notification
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
            Error Loading World Config
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Failed to load configuration for world "{worldId}".
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
          >
            Close
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
                World Configuration
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {worldId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors duration-200"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>

        {hasChanges && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              You have unsaved changes. Don't forget to save your configuration.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic World Settings */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-blue-600" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Basic Settings
              </h4>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  World Seed
                </label>
                <input
                  type="text"
                  value={config.seed || ''}
                  onChange={(e) => handleInputChange('basic', 'seed', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  placeholder="Random seed"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hardcore Mode
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Players cannot respawn
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.hardcore || false}
                  onChange={(e) => handleInputChange('basic', 'hardcore', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={config.difficulty || 1}
                  onChange={(e) => handleInputChange('basic', 'difficulty', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                >
                  <option value={0}>Peaceful</option>
                  <option value={1}>Easy</option>
                  <option value={2}>Normal</option>
                  <option value={3}>Hard</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Education Features
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enable education edition features
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.educationFeaturesEnabled || false}
                  onChange={(e) => handleInputChange('basic', 'educationFeaturesEnabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Game Rules */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-purple-600" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Game Rules
              </h4>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {config.gameRules && Object.entries(config.gameRules).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </label>
                  </div>
                  {typeof value === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleInputChange('gameRules', key, e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  ) : (
                    <input
                      type="number"
                      value={value as number}
                      onChange={(e) => handleInputChange('gameRules', key, parseInt(e.target.value))}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Experiments */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="w-5 h-5 text-orange-600" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Experimental Features
              </h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.experiments && Object.entries(config.experiments).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                  </div>
                  <input
                    type="checkbox"
                    checked={value as boolean}
                    onChange={(e) => handleInputChange('experiments', key, e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
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