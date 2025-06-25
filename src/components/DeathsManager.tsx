import React, { useState, useEffect } from 'react';
import { Folder, FileText, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { useElectron } from '../hooks/useElectron';

const DeathsManager: React.FC = () => {
  const { api } = useElectron();
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems('');
  }, [api]);

  const loadItems = async (dir: string) => {
    setLoading(true);
    if (!api) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const files = await api.files.list(dir);
      setItems(files);
      setCurrentPath(dir);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  const handleDelete = async (item: any) => {
    if (!api) return;
    if (window.confirm(`Delete "${item.name}"?`)) {
      await api.files.delete(item.path);
      loadItems(currentPath);
    }
  };

  const handleToggleExpand = (item: any) => {
    setExpanded((prev) => ({
      ...prev,
      [item.path]: !prev[item.path],
    }));
  };

  const renderItems = (dir: string, itemsList: any[]) => (
    <ul className="pl-2">
      {itemsList.map((item) => (
        <li key={item.path} className="flex items-center gap-2 py-1">
          {item.type === 'directory' ? (
            <>
              <button onClick={() => handleToggleExpand(item)} className="p-1">
                {expanded[item.path] ? <ChevronDown /> : <ChevronRight />}
              </button>
              <Folder className="w-5 h-5 text-yellow-500" />
              <span
                className="cursor-pointer font-medium"
                onClick={() => {
                  if (!expanded[item.path]) handleToggleExpand(item);
                }}
              >
                {item.name}
              </span>
              <button
                onClick={() => handleDelete(item)}
                className="ml-auto p-1 text-red-600 hover:bg-red-100 rounded"
                title="Delete folder"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {expanded[item.path] && (
                <div className="w-full">
                  <FolderContent path={item.path} />
                </div>
              )}
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 text-gray-500" />
              <span>{item.name}</span>
              <button
                onClick={() => handleDelete(item)}
                className="ml-auto p-1 text-red-600 hover:bg-red-100 rounded"
                title="Delete file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  );

  // Componente para carregar conteúdo de uma pasta expandida
  const FolderContent: React.FC<{ path: string }> = ({ path }) => {
    const [subItems, setSubItems] = useState<any[]>([]);
    useEffect(() => {
      (async () => {
        if (api) {
          const files = await api.files.list(path);
          setSubItems(files);
        }
      })();
    }, [path]);
    return renderItems(path, subItems);
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Gerenciador de Falecimentos</h3>
      {loading ? (
        <div className="py-8 text-center text-gray-500">Carregando arquivos...</div>
      ) : (
        renderItems(currentPath, items)
      )}
    </div>
  );
};

export default DeathsManager;
