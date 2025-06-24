import React, { useEffect, useState } from 'react';
import { User, Shield, ShieldOff } from 'lucide-react';
import { useElectron } from '../hooks/useElectron';

const PlayerManager: React.FC = () => {
  const { api } = useElectron();
  const [players, setPlayers] = useState<{ name: string, lastSeen: string, status: string }[]>([]);
  const [ops, setOps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
    loadOps();
    // Opcional: atualizar em tempo real
    // eslint-disable-next-line
  }, [api]);

  const loadPlayers = async () => {
    if (!api) return;
    setLoading(true);
    const list = await api.players.list();
    setPlayers(list);
    setLoading(false);
  };

  const loadOps = async () => {
    if (!api) return;
    // Lê ops.txt via backend (poderia criar handler específico, mas pode usar api.addons.list se quiser)
    // Aqui, para simplicidade, só OP/desOP via botão, não mostra lista de OPs.
  };

  const handleOp = async (name: string) => {
    if (!api) return;
    await api.players.op(name);
    loadOps();
  };

  const handleDeop = async (name: string) => {
    if (!api) return;
    await api.players.deop(name);
    loadOps();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Jogadores Online
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Veja quem está online e gerencie permissões de OP.
        </p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="py-8 text-center text-gray-400">Carregando...</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left py-2">Jogador</th>
                <th className="text-left py-2">Última vez</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {players.map(player => (
                <tr key={player.name}>
                  <td className="py-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {player.name}
                  </td>
                  <td className="py-2">{player.lastSeen}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      player.status === 'online'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                    }`}>
                      {player.status}
                    </span>
                  </td>
                  <td className="py-2 flex gap-2">
                    <button
                      onClick={() => handleOp(player.name)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-xs"
                      title="Dar OP"
                    >
                      <Shield className="w-4 h-4" /> OP
                    </button>
                    <button
                      onClick={() => handleDeop(player.name)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1 text-xs"
                      title="Remover OP"
                    >
                      <ShieldOff className="w-4 h-4" /> Remover OP
                    </button>
                  </td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    Nenhum jogador online.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PlayerManager;
