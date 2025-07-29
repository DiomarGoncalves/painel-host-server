const fs = require('fs-extra');
const path = require('path');
const { dialog } = require('electron');
const archiver = require('archiver');
const extractZip = require('extract-zip');

class UpdaterManager {
    constructor() {
        this.serverPath = null;
    }

    setServerPath(serverPath) {
        this.serverPath = serverPath;
    }

    async getServerInfo() {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            const bedrockExecutable = process.platform === 'win32' ? 'bedrock_server.exe' : 'bedrock_server';
            const executablePath = path.join(this.serverPath, bedrockExecutable);

            if (!await fs.pathExists(executablePath)) {
                return { success: false, error: 'Executável do servidor não encontrado' };
            }

            const stat = await fs.stat(executablePath);
            const serverInfo = {
                path: this.serverPath,
                executable: bedrockExecutable,
                lastModified: stat.mtime,
                size: stat.size,
                version: 'Desconhecida' // Bedrock não tem versão facilmente detectável
            };

            // Tentar obter informações adicionais
            const releaseNotesPath = path.join(this.serverPath, 'release-notes.txt');
            if (await fs.pathExists(releaseNotesPath)) {
                try {
                    const releaseNotes = await fs.readFile(releaseNotesPath, 'utf8');
                    const versionMatch = releaseNotes.match(/Version\s+([0-9.]+)/i);
                    if (versionMatch) {
                        serverInfo.version = versionMatch[1];
                    }
                } catch (e) {
                    // Ignorar erro
                }
            }

            return {
                success: true,
                serverInfo: serverInfo
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao obter informações do servidor: ${error.message}`
            };
        }
    }

    async selectNewServer() {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openFile'],
                title: 'Selecionar nova versão do servidor',
                buttonLabel: 'Selecionar',
                filters: [
                    { name: 'Arquivos do Servidor', extensions: ['zip'] },
                    { name: 'Todos os arquivos', extensions: ['*'] }
                ]
            });

            if (result.canceled) {
                return { success: false, message: 'Seleção cancelada' };
            }

            const serverFile = result.filePaths[0];

            return {
                success: true,
                serverFile: serverFile,
                message: 'Arquivo do servidor selecionado'
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao selecionar servidor: ${error.message}`
            };
        }
    }

    async validateServer(serverFile) {
        try {
            if (!await fs.pathExists(serverFile)) {
                return { success: false, error: 'Arquivo não encontrado' };
            }

            const tempDir = path.join(require('os').tmpdir(), 'bedrock_validation_' + Date.now());
            
            try {
                // Extrair arquivo temporariamente para validação
                await extractZip(serverFile, { dir: tempDir });

                // Verificar se contém os arquivos necessários
                const bedrockExecutable = process.platform === 'win32' ? 'bedrock_server.exe' : 'bedrock_server';
                const executablePath = path.join(tempDir, bedrockExecutable);

                if (!await fs.pathExists(executablePath)) {
                    return {
                        success: false,
                        error: `Executável do servidor não encontrado: ${bedrockExecutable}`
                    };
                }

                // Verificar outros arquivos importantes
                const requiredFiles = [
                    'server.properties',
                    'permissions.json'
                ];

                const missingFiles = [];
                for (const file of requiredFiles) {
                    if (!await fs.pathExists(path.join(tempDir, file))) {
                        missingFiles.push(file);
                    }
                }

                // Obter informações da versão
                let versionInfo = 'Desconhecida';
                const releaseNotesPath = path.join(tempDir, 'release-notes.txt');
                if (await fs.pathExists(releaseNotesPath)) {
                    try {
                        const releaseNotes = await fs.readFile(releaseNotesPath, 'utf8');
                        const versionMatch = releaseNotes.match(/Version\s+([0-9.]+)/i);
                        if (versionMatch) {
                            versionInfo = versionMatch[1];
                        }
                    } catch (e) {
                        // Ignorar erro
                    }
                }

                // Limpar diretório temporário
                await fs.remove(tempDir);

                return {
                    success: true,
                    validation: {
                        isValid: missingFiles.length === 0,
                        version: versionInfo,
                        missingFiles: missingFiles,
                        hasExecutable: true
                    },
                    message: missingFiles.length === 0 
                        ? 'Servidor válido para atualização'
                        : `Arquivos faltando: ${missingFiles.join(', ')}`
                };
            } catch (extractError) {
                // Limpar diretório temporário em caso de erro
                if (await fs.pathExists(tempDir)) {
                    await fs.remove(tempDir);
                }
                throw extractError;
            }
        } catch (error) {
            return {
                success: false,
                error: `Erro ao validar servidor: ${error.message}`
            };
        }
    }

    async updateServer(newServerFile) {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            if (!await fs.pathExists(newServerFile)) {
                return { success: false, error: 'Arquivo do novo servidor não encontrado' };
            }

            // Criar backup antes da atualização
            const backupResult = await this.createBackup();
            if (!backupResult.success) {
                return {
                    success: false,
                    error: `Erro ao criar backup: ${backupResult.error}`
                };
            }

            const tempDir = path.join(require('os').tmpdir(), 'bedrock_update_' + Date.now());
            
            try {
                // Extrair nova versão
                await extractZip(newServerFile, { dir: tempDir });

                // Lista de arquivos e pastas a preservar
                const preserveFiles = [
                    'server.properties',
                    'permissions.json',
                    'allowlist.json',
                    'ops.json',
                    'playit.exe',
                    'playit-linux'
                ];

                const preserveFolders = [
                    'worlds',
                    'development_behavior_packs',
                    'development_resource_packs',
                    'config',
                    'worlds_backup'
                ];

                // Preservar arquivos importantes
                const preservedDir = path.join(tempDir, 'preserved');
                await fs.ensureDir(preservedDir);

                for (const file of preserveFiles) {
                    const sourcePath = path.join(this.serverPath, file);
                    const destPath = path.join(preservedDir, file);
                    
                    if (await fs.pathExists(sourcePath)) {
                        await fs.copy(sourcePath, destPath);
                    }
                }

                for (const folder of preserveFolders) {
                    const sourcePath = path.join(this.serverPath, folder);
                    const destPath = path.join(preservedDir, folder);
                    
                    if (await fs.pathExists(sourcePath)) {
                        await fs.copy(sourcePath, destPath);
                    }
                }

                // Remover conteúdo antigo (exceto arquivos preservados)
                const currentItems = await fs.readdir(this.serverPath);
                for (const item of currentItems) {
                    if (!preserveFiles.includes(item) && !preserveFolders.includes(item)) {
                        await fs.remove(path.join(this.serverPath, item));
                    }
                }

                // Copiar nova versão
                const newItems = await fs.readdir(tempDir);
                for (const item of newItems) {
                    if (item !== 'preserved') {
                        const sourcePath = path.join(tempDir, item);
                        const destPath = path.join(this.serverPath, item);
                        
                        // Se o item existe nos preservados, não sobrescrever
                        if (!preserveFiles.includes(item) && !preserveFolders.includes(item)) {
                            await fs.copy(sourcePath, destPath, { overwrite: true });
                        }
                    }
                }

                // Restaurar arquivos preservados
                const preservedItems = await fs.readdir(preservedDir);
                for (const item of preservedItems) {
                    const sourcePath = path.join(preservedDir, item);
                    const destPath = path.join(this.serverPath, item);
                    await fs.copy(sourcePath, destPath, { overwrite: true });
                }

                // Limpar diretório temporário
                await fs.remove(tempDir);

                return {
                    success: true,
                    message: 'Servidor atualizado com sucesso! Backup criado automaticamente.',
                    backupPath: backupResult.backupPath
                };
            } catch (updateError) {
                // Limpar diretório temporário em caso de erro
                if (await fs.pathExists(tempDir)) {
                    await fs.remove(tempDir);
                }
                throw updateError;
            }
        } catch (error) {
            return {
                success: false,
                error: `Erro ao atualizar servidor: ${error.message}`
            };
        }
    }

    async createBackup() {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            // Criar pasta de backup
            const backupDir = path.join(this.serverPath, 'server_backups');
            await fs.ensureDir(backupDir);

            // Nome do arquivo de backup
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `server_backup_${timestamp}.zip`;
            const backupPath = path.join(backupDir, backupFileName);

            // Criar arquivo ZIP
            const output = fs.createWriteStream(backupPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            return new Promise((resolve, reject) => {
                output.on('close', () => {
                    resolve({
                        success: true,
                        message: 'Backup criado com sucesso',
                        backupPath: backupPath,
                        backupSize: archive.pointer()
                    });
                });

                archive.on('error', (err) => {
                    reject({
                        success: false,
                        error: `Erro ao criar backup: ${err.message}`
                    });
                });

                archive.pipe(output);

                // Adicionar todos os arquivos e pastas do servidor
                archive.directory(this.serverPath, false, (entry) => {
                    // Excluir a própria pasta de backups para evitar recursão
                    return !entry.name.startsWith('server_backups/');
                });

                archive.finalize();
            });
        } catch (error) {
            return {
                success: false,
                error: `Erro ao criar backup: ${error.message}`
            };
        }
    }

    async getBackups() {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            const backupDir = path.join(this.serverPath, 'server_backups');
            
            if (!await fs.pathExists(backupDir)) {
                return { success: true, backups: [] };
            }

            const backupFiles = await fs.readdir(backupDir);
            const backups = [];

            for (const file of backupFiles) {
                if (file.endsWith('.zip')) {
                    const backupPath = path.join(backupDir, file);
                    const stat = await fs.stat(backupPath);
                    
                    backups.push({
                        name: file,
                        path: backupPath,
                        size: stat.size,
                        created: stat.birthtime,
                        modified: stat.mtime
                    });
                }
            }

            // Ordenar por data de criação (mais recente primeiro)
            backups.sort((a, b) => b.created - a.created);

            return {
                success: true,
                backups: backups
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao listar backups: ${error.message}`
            };
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = UpdaterManager;