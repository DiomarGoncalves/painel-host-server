import React, { useState } from 'react';
import { 
  Crown, 
  UserMinus, 
  Ban, 
  MessageSquare, 
  Eye, 
  Gamepad2,
  MapPin,
  Zap,
  Shield,
  AlertTriangle,
  Send
} from 'lucide-react';
import { useElectron } from '../hooks/useElectron';

interface PlayerActionsProps {
  player: {
    name: string;
    xuid: string;
    status: string;
    permissions: string;
  };
  onClose: () => void;
  onRefresh: () => void;
}

const PlayerActions: React.FC<PlayerActionsProps> = ({ player, onClose, onRefresh }) => {
  const { api } = useElectron();
  const [message, setMessage] = useState('');
  const [selectedGamemode, setSelectedGamemode] = useState('survival');
  const [loading, setLoading] = useState(false);

  const executeCommand = async (command: string) => {
    if (!api) {
      console.log(`Would execute: ${command}`);
      return;
    }

    setLoading(true);
    try {
      await api.server.executeCommand(command);
      onRefresh();
    } catch (error) {
      console.error('Failed to execute command:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    await executeCommand(`tell "${player.name}" ${message}`);
    setMessage('');
  };

  const changeGamemode = async () => {
    await executeCommand(`gamemode ${selectedGamemode} "${player.name}"`);
  };

  const teleportToSpawn = async () => {
    await executeCommand(`tp "${player.name}" 0 100 0`);
  };

  const giveOp = async () => {
    if (confirm(`Give operator permissions to ${player.name}?`)) {
      await executeCommand(`op "${player.name}"`);
    }
  };

  const removeOp = async () => {
    if (confirm(`Remove operator permissions from ${player.name}?`)) {
      await executeCommand(`deop "${player.name}"`);
    }
  };

  const kickPlayer = async () => {
    const reason = prompt('Kick reason (optional):') || 'Kicked by admin';
    if (confirm(`Kick ${player.name}?`)) {
      await executeCommand(`kick "${player.name}" ${reason}`);
    }
  };

  const banPlayer = async () => {
    const reason = prompt('Ban reason (optional):') || 'Banned by admin';
    if (confirm(`Ban ${player.name}? This will prevent them from joining the server.`)) {
      await executeCommand(`ban "${player.name}" ${reason}`);
    }
  };

  const actions = [
    {
      id: 'message',
      label: 'Send Message',
      icon: MessageSquare,
      color: 'bg-blue-500',
      action: () => {}
    },
    {
      id: 'gamemode',
      label: 'Change Gamemode',
      icon: Gamepad2,
      color: 'bg-purple-500',
      action: () => {}
    },
    {
      id: 'teleport',
      label: 'Teleport to Spawn',
      icon: MapPin,
      color: 'bg-green-500',
      action: teleportToSpawn
    },
    {
      id: 'op',
      label: player.permissions === 'operator' ? 'Remove OP' : 'Give OP',
      icon: Crown,
      color: 'bg-yellow-500',
      action: player.permissions === 'operator' ? removeOp : giveOp
    },
    {
      id: 'kick',
      label: 'Kick Player',
      icon: UserMinus,
      color: 'bg-orange-500',
      action: kickPlayer
    },
    {
      id: 'ban',
      label: 'Ban Player',
      icon: Ban,
      color: 'bg-red-500',
      action: banPlayer
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {player.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Player Actions
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {player.name} • {player.status}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        {/* Player Info */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Status:</span>
              <span className={`ml-2 font-medium ${
                player.status === 'online' ? 'text-green-600' : 'text-gray-600'
              }`}>
                {player.status}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Permission:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">
                {player.permissions}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500 dark:text-gray-400">XUID:</span>
              <span className="ml-2 font-mono text-xs text-gray-900 dark:text-white">
                {player.xuid || 'Not available'}
              </span>
            </div>
          </div>
        </div>

        {/* Send Message */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Send Private Message
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors duration-200"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>

        {/* Change Gamemode */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Change Gamemode
          </label>
          <div className="flex gap-2">
            <select
              value={selectedGamemode}
              onChange={(e) => setSelectedGamemode(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="survival">Survival</option>
              <option value="creative">Creative</option>
              <option value="adventure">Adventure</option>
              <option value="spectator">Spectator</option>
            </select>
            <button
              onClick={changeGamemode}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 rounded-md transition-colors duration-200"
            >
              <Gamepad2 className="w-4 h-4" />
              Change
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Quick Actions
          </label>
          <div className="grid grid-cols-2 gap-3">
            {actions.slice(2).map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.action}
                  disabled={loading}
                  className={`flex items-center gap-3 p-3 rounded-lg text-white hover:opacity-90 disabled:opacity-50 transition-all duration-200 ${action.color}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Warning Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Moderation Actions
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={kickPlayer}
              disabled={loading || player.status === 'offline'}
              className="flex items-center justify-center gap-2 p-3 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 disabled:opacity-50 transition-colors duration-200"
            >
              <UserMinus className="w-4 h-4" />
              Kick Player
            </button>
            
            <button
              onClick={banPlayer}
              disabled={loading}
              className="flex items-center justify-center gap-2 p-3 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors duration-200"
            >
              <Ban className="w-4 h-4" />
              Ban Player
            </button>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerActions;