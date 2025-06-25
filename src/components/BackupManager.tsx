import React, { useState } from 'react';
import { 
  Shield, 
  Download, 
  Upload, 
  Trash2, 
  Plus,
  RotateCcw,
  Clock,
  HardDrive,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';

const BackupManager: React.FC = () => {
  const [backups, setBackups] = useState([
    {
      id: 1,
      name: 'Auto Backup - Jan 20, 2024',
      type: 'automatic',
      size: '245 MB',
      created: '2024-01-20 14:30:00',
      world: 'Survival World',
      status: 'completed'
    },
    {
      id: 2,
      name: 'Manual Backup - Before Update',
      type: 'manual',
      size: '189 MB',
      created: '2024-01-19 09:15:00',
      world: 'Survival World',
      status: 'completed'
    },
    {
      id: 3,
      name: 'Creative World Backup',
      type: 'manual',
      size: '512 MB',
      created: '2024-01-18 16:45:00',
      world: 'Creative Building',
      status: 'completed'
    },
    {
      id: 4,
      name: 'Auto Backup - Jan 17, 2024',
      type: 'automatic',
      size: '198 MB',
      created: '2024-01-17 02:00:00',
      world: 'Survival World',
      status: 'completed'
    }
  ]);

  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupInterval, setBackupInterval] = useState(24);
  const [maxBackups, setMaxBackups] = useState(10);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const createManualBackup = () => {
    setIsCreatingBackup(true);
    setTimeout(() => {
      const newBackup = {
        id: Date.now(),
        name: `Manual Backup - ${new Date().toLocaleDateString()}`,
        type: 'manual' as const,
        size: '250 MB',
        created: new Date().toISOString(),
        world: 'Survival World',
        status: 'completed' as const
      };
      setBackups(prev => [newBackup, ...prev]);
      setIsCreatingBackup(false);
    }, 3000);
  };

  const restoreBackup = (backupId: number) => {
    const backup = backups.find(b => b.id === backupId);
    if (backup && confirm(`Are you sure you want to restore "${backup.name}"? This will overwrite your current world.`)) {
      console.log(`Restoring backup: ${backup.name}`);
      // Here you would implement the actual restore logic
    }
  };

  const deleteBackup = (backupId: number) => {
    const backup = backups.find(b => b.id === backupId);
    if (backup && confirm(`Are you sure you want to delete "${backup.name}"?`)) {
      setBackups(prev => prev.filter(b => b.id !== backupId));
    }
  };

  const downloadBackup = (backupId: number) => {
    const backup = backups.find(b => b.id === backupId);
    if (backup) {
      console.log(`Downloading backup: ${backup.name}`);
      // Here you would implement the actual download logic
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTotalBackupSize = () => {
    return backups.reduce((total, backup) => {
      const size = parseFloat(backup.size.replace(/[^0-9.]/g, ''));
      return total + size;
    }, 0).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Backup Manager
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create, manage and restore world backups
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <Calendar className="w-4 h-4" />
            Schedule
          </button>
          <button
            onClick={createManualBackup}
            disabled={isCreatingBackup}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors duration-200"
          >
            {isCreatingBackup ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isCreatingBackup ? 'Creating...' : 'Create Backup'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {backups.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Backups
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {getTotalBackupSize()} MB
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Size
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {backups.filter(b => b.type === 'automatic').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Auto Backups
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {backups.filter(b => b.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Successful
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Auto Backup Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Automatic Backup Settings
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Auto Backup
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically create backups
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoBackupEnabled}
              onChange={(e) => setAutoBackupEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Backup Interval (hours)
            </label>
            <input
              type="number"
              value={backupInterval}
              onChange={(e) => setBackupInterval(parseInt(e.target.value))}
              min="1"
              max="168"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Backups to Keep
            </label>
            <input
              type="number"
              value={maxBackups}
              onChange={(e) => setMaxBackups(parseInt(e.target.value))}
              min="1"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Backup List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Backup History
          </h4>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {backups.map((backup) => (
            <div key={backup.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    backup.type === 'automatic' ? 'bg-purple-500' : 'bg-blue-500'
                  }`}>
                    {backup.type === 'automatic' ? (
                      <Clock className="w-6 h-6 text-white" />
                    ) : (
                      <Shield className="w-6 h-6 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h5 className="font-semibold text-gray-900 dark:text-white">
                        {backup.name}
                      </h5>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        backup.type === 'automatic'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      }`}>
                        {backup.type}
                      </span>
                      {backup.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <span>World: {backup.world}</span>
                      <span>Size: {backup.size}</span>
                      <span>Created: {formatDate(backup.created)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => restoreBackup(backup.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200"
                    title="Restore Backup"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => downloadBackup(backup.id)}
                    className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors duration-200"
                    title="Download Backup"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => deleteBackup(backup.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                    title="Delete Backup"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Backup Schedule
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Schedule Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
                  <option value="interval">Interval Based</option>
                  <option value="daily">Daily at Specific Time</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  defaultValue="02:00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
                >
                  Save Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupManager;