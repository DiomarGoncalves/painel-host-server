import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Shield, 
  Ban, 
  MessageSquare,
  Clock,
  MapPin,
  Activity,
  Search,
  Filter,
  MoreVertical,
  Crown,
  Eye,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { useElectron } from '../hooks/useElectron';
import PlayerActions from './PlayerActions';

interface Player {
  name: string;
  xuid: string;
  ignoresPlayerLimit: boolean;
  permissions?: string;
  status?: string;
  lastSeen?: string;
  playTime?: string;
}

const PlayerManager: React.FC = () => {
  const { api } = useElectron();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [permissionFilter, setPermissionFilter] = useState('all');
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showPlayerActions, setShowPlayerActions] = useState<Player | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    if (!api) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const playerList = await api.players.list();
      setPlayers(playerList);
    } catch (error) {
      console.error('Failed to load players:', error);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const addPlayerToAllowlist = async () => {
    if (!api || !newPlayerName.trim()) return;
    
    try {
      const result = await api.players.addToAllowlist(newPlayerName.trim());
      if (result.success) {
        await loadPlayers();
        setNewPlayerName('');
        setShowAddPlayerModal(false);
      } else {
        alert(`Failed to add player: ${result.message}`);
      }
    } catch (error) {
      console.error('Failed to add player:', error);
      alert('Failed to add player. Please try again.');
    }
  };

  const removePlayerFromAllowlist = async (playerName: string) => {
    if (!api) return;
    
    if (confirm(`Are you sure you want to remove ${playerName} from the allowlist?`)) {
      try {
        const result = await api.players.removeFromAllowlist(playerName);
        if (result.success) {
          await loadPlayers();
        } else {
          alert(`Failed to remove player: ${result.message}`);
        }
      } catch (error) {
        console.error('Failed to remove player:', error);
        alert('Failed to remove player. Please try again.');
      }
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (player.xuid && player.xuid.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || (player.status || 'offline') === statusFilter;
    const matchesPermission = permissionFilter === 'all' || (player.permissions || 'member') === permissionFilter;
    
    return matchesSearch && matchesStatus && matchesPermission;
  });

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'operator': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'member': return <Users className="w-4 h-4 text-blue-500" />;
      case 'visitor': return <Eye className="w-4 h-4 text-gray-500" />;
      default: return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading players...</span>
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
            Player Management
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage players, permissions, and allowlist
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadPlayers}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <Activity className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddPlayerModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
          >
            <UserPlus className="w-4 h-4" />
            Add to Allowlist
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {players.filter(p => (p.status || 'offline') === 'online').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Online Players</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {players.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Allowlisted</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                0
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Banned Players</p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <Ban className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {players.filter(p => (p.permissions || 'member') === 'operator').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Operators</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Players
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or XUID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Permission Level
            </label>
            <select
              value={permissionFilter}
              onChange={(e) => setPermissionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Permissions</option>
              <option value="operator">Operator</option>
              <option value="member">Member</option>
              <option value="visitor">Visitor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Players ({filteredPlayers.length})
          </h4>
        </div>

        {filteredPlayers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Players Found
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {players.length === 0 
                ? "Add players to the allowlist to get started."
                : "No players match your current filters."
              }
            </p>
            {players.length === 0 && (
              <button
                onClick={() => setShowAddPlayerModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
              >
                <UserPlus className="w-4 h-4" />
                Add Player
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPlayers.map((player, index) => (
              <div key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                        (player.status || 'offline') === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h5 className="font-semibold text-gray-900 dark:text-white">
                          {player.name}
                        </h5>
                        {getPermissionIcon(player.permissions || 'member')}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                          (player.status || 'offline') === 'online'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {player.status || 'offline'}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                          Allowlisted
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                        {player.xuid && (
                          <span className="font-mono">XUID: {player.xuid}</span>
                        )}
                        <span>Permission: {(player.permissions || 'member').charAt(0).toUpperCase() + (player.permissions || 'member').slice(1)}</span>
                        {player.playTime && (
                          <span>Play Time: {player.playTime}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPlayerActions(player)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200"
                      title="Player Actions"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => removePlayerFromAllowlist(player.name)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                      title="Remove from Allowlist"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Player Modal */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Player to Allowlist
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Player Name
                </label>
                <input
                  type="text"
                  placeholder="Enter player name..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && addPlayerToAllowlist()}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowAddPlayerModal(false);
                    setNewPlayerName('');
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={addPlayerToAllowlist}
                  disabled={!newPlayerName.trim()}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors duration-200"
                >
                  Add Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Actions Modal */}
      {showPlayerActions && (
        <PlayerActions
          player={showPlayerActions}
          onClose={() => setShowPlayerActions(null)}
          onRefresh={loadPlayers}
        />
      )}
    </div>
  );
};

export default PlayerManager;