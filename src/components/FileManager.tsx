import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  Plus,
  Edit,
  Save,
  X,
  FolderPlus,
  MoreVertical,
  ArrowLeft,
  Home,
  Search,
  Copy,
  Move,
  Eye
} from 'lucide-react';
import { useElectron } from '../hooks/useElectron';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified: string;
  path: string;
}

const FileManager: React.FC = () => {
  const { api } = useElectron();
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    if (!api) {
      // Mock data for web version
      setFiles([
        { name: 'worlds', type: 'directory', modified: '2024-01-20', path: '/worlds' },
        { name: 'behavior_packs', type: 'directory', modified: '2024-01-20', path: '/behavior_packs' },
        { name: 'resource_packs', type: 'directory', modified: '2024-01-20', path: '/resource_packs' },
        { name: 'server.properties', type: 'file', size: 2048, modified: '2024-01-20', path: '/server.properties' },
        { name: 'allowlist.json', type: 'file', size: 512, modified: '2024-01-20', path: '/allowlist.json' },
        { name: 'permissions.json', type: 'file', size: 256, modified: '2024-01-20', path: '/permissions.json' },
      ]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Implementation would call Electron API to list files
      const fileList = await api.files?.list(currentPath) || [];
      setFiles(fileList);
    } catch (error) {
      console.error('Failed to load files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
    setSelectedFiles([]);
  };

  const navigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    navigateToPath(parentPath);
  };

  const handleFileSelect = (fileName: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileName) 
        ? prev.filter(f => f !== fileName)
        : [...prev, fileName]
    );
  };

  const handleFileDoubleClick = (file: FileItem) => {
    if (file.type === 'directory') {
      navigateToPath(file.path);
    } else if (file.name.endsWith('.json') || file.name.endsWith('.properties') || file.name.endsWith('.txt')) {
      editFile(file.name);
    }
  };

  const editFile = async (fileName: string) => {
    if (!api) {
      // Mock content for web version
      setFileContent(`# ${fileName}\n# This is a mock file content for demonstration\n# In the actual implementation, this would load the real file content`);
      setEditingFile(fileName);
      return;
    }

    try {
      const content = await api.files?.read(currentPath + '/' + fileName) || '';
      setFileContent(content);
      setEditingFile(fileName);
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  };

  const saveFile = async () => {
    if (!api || !editingFile) return;

    try {
      await api.files?.write(currentPath + '/' + editingFile, fileContent);
      setEditingFile(null);
      setFileContent('');
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const createFolder = async () => {
    if (!api || !newFolderName.trim()) return;

    try {
      await api.files?.createDirectory(currentPath + '/' + newFolderName);
      setNewFolderName('');
      setShowNewFolderModal(false);
      await loadFiles();
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const deleteSelected = async () => {
    if (!api || selectedFiles.length === 0) return;

    if (confirm(`Are you sure you want to delete ${selectedFiles.length} item(s)?`)) {
      try {
        for (const fileName of selectedFiles) {
          await api.files?.delete(currentPath + '/' + fileName);
        }
        setSelectedFiles([]);
        await loadFiles();
      } catch (error) {
        console.error('Failed to delete files:', error);
      }
    }
  };

  const downloadFile = async (fileName: string) => {
    if (!api) return;

    try {
      await api.files?.download(currentPath + '/' + fileName);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pathSegments = currentPath.split('/').filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            File Manager
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage server files and configurations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
          >
            <Upload className="w-4 h-4" />
            Upload Files
          </button>
        </div>
      </div>

      {/* Navigation and Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateToPath('/')}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
            >
              <Home className="w-4 h-4" />
            </button>
            {currentPath !== '/' && (
              <button
                onClick={navigateUp}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <span>/</span>
              {pathSegments.map((segment, index) => (
                <React.Fragment key={index}>
                  <button
                    onClick={() => navigateToPath('/' + pathSegments.slice(0, index + 1).join('/'))}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  >
                    {segment}
                  </button>
                  {index < pathSegments.length - 1 && <span>/</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Actions */}
        {selectedFiles.length > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {selectedFiles.length} item(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={deleteSelected}
                className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 rounded-md transition-colors duration-200"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          </div>
        )}

        {/* File List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map((file) => (
              <div
                key={file.name}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                  selectedFiles.includes(file.name)
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                onClick={() => handleFileSelect(file.name)}
                onDoubleClick={() => handleFileDoubleClick(file)}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.name)}
                    onChange={() => handleFileSelect(file.name)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  {file.type === 'directory' ? (
                    <Folder className="w-5 h-5 text-blue-500" />
                  ) : (
                    <File className="w-5 h-5 text-gray-500" />
                  )}
                  
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {file.size && <span>{formatFileSize(file.size)}</span>}
                      <span>{new Date(file.modified).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {file.type === 'file' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          editFile(file.name);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile(file.name);
                        }}
                        className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors duration-200"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Editor Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Editing: {editingFile}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={saveFile}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingFile(null);
                    setFileContent('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              placeholder="File content..."
            />
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New Folder
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                onKeyPress={(e) => e.key === 'Enter' && createFolder()}
              />
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowNewFolderModal(false);
                    setNewFolderName('');
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={createFolder}
                  disabled={!newFolderName.trim()}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors duration-200"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upload Files
            </h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Click to select files or drag and drop
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Multiple files supported
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;