const fs = require('fs-extra');
const path = require('path');
const { dialog } = require('electron');
const extractZip = require('extract-zip');

class AddonManager {
    constructor() {
        this.serverPath = null;
    }

    setServerPath(serverPath) {
        this.serverPath = serverPath;
    }

    async getAddons() {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            const behaviorPacksPath = path.join(this.serverPath, 'development_behavior_packs');
            const resourcePacksPath = path.join(this.serverPath, 'development_resource_packs');

            const behaviorPacks = await this.getAddonList(behaviorPacksPath, 'behavior');
            const resourcePacks = await this.getAddonList(resourcePacksPath, 'resource');

            return {
                success: true,
                addons: {
                    behavior_packs: behaviorPacks,
                    resource_packs: resourcePacks
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao listar addons: ${error.message}`
            };
        }
    }

    async getAddonList(addonsPath, type) {
        try {
            if (!await fs.pathExists(addonsPath)) {
                return [];
            }

            const addonFolders = await fs.readdir(addonsPath);
            const addons = [];

            for (const folder of addonFolders) {
                const addonPath = path.join(addonsPath, folder);
                const stat = await fs.stat(addonPath);

                if (stat.isDirectory()) {
                    const manifestPath = path.join(addonPath, 'manifest.json');
                    let addonInfo = {
                        folder: folder,
                        path: addonPath,
                        type: type,
                        size: await this.getDirectorySize(addonPath),
                        lastModified: stat.mtime
                    };

                    // Tentar ler manifest.json
                    if (await fs.pathExists(manifestPath)) {
                        try {
                            const manifest = await fs.readJson(manifestPath);
                            addonInfo.name = manifest.header?.name || folder;
                            addonInfo.description = manifest.header?.description || '';
                            addonInfo.version = manifest.header?.version || [1, 0, 0];
                            addonInfo.uuid = manifest.header?.uuid || '';
                            addonInfo.min_engine_version = manifest.header?.min_engine_version || [1, 16, 0];
                        } catch (e) {
                            // Se não conseguir ler o manifest, usar valores padrão
                            addonInfo.name = folder;
                            addonInfo.description = 'Addon sem manifest válido';
                        }
                    } else {
                        addonInfo.name = folder;
                        addonInfo.description = 'Addon sem manifest';
                    }

                    addons.push(addonInfo);
                }
            }

            return addons.sort((a, b) => b.lastModified - a.lastModified);
        } catch (error) {
            console.error(`Erro ao listar addons ${type}:`, error);
            return [];
        }
    }

    async importAddon() {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            const result = await dialog.showOpenDialog({
                properties: ['openFile'],
                title: 'Selecionar addon',
                buttonLabel: 'Importar',
                filters: [
                    { name: 'Addons do Minecraft', extensions: ['zip', 'mcaddon', 'mcpack'] },
                    { name: 'Todos os arquivos', extensions: ['*'] }
                ]
            });

            if (result.canceled) {
                return { success: false, message: 'Importação cancelada' };
            }

            const addonFile = result.filePaths[0];
            const tempDir = path.join(this.serverPath, 'temp_addon_extract');

            try {
                // Criar diretório temporário
                await fs.ensureDir(tempDir);

                // Extrair arquivo
                await extractZip(addonFile, { dir: tempDir });

                // Analisar conteúdo extraído
                const extractedItems = await fs.readdir(tempDir);
                const importResults = [];

                for (const item of extractedItems) {
                    const itemPath = path.join(tempDir, item);
                    const stat = await fs.stat(itemPath);

                    if (stat.isDirectory()) {
                        const manifestPath = path.join(itemPath, 'manifest.json');
                        
                        if (await fs.pathExists(manifestPath)) {
                            try {
                                const manifest = await fs.readJson(manifestPath);
                                const addonType = this.determineAddonType(manifest);
                                
                                if (addonType) {
                                    const result = await this.installAddon(itemPath, addonType, manifest);
                                    importResults.push(result);
                                }
                            } catch (e) {
                                console.error('Erro ao processar manifest:', e);
                            }
                        }
                    }
                }

                // Limpar diretório temporário
                await fs.remove(tempDir);

                if (importResults.length === 0) {
                    return {
                        success: false,
                        error: 'Nenhum addon válido encontrado no arquivo'
                    };
                }

                const successCount = importResults.filter(r => r.success).length;
                const errorCount = importResults.length - successCount;

                return {
                    success: successCount > 0,
                    message: `${successCount} addon(s) importado(s) com sucesso${errorCount > 0 ? `, ${errorCount} erro(s)` : ''}`,
                    results: importResults
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
                error: `Erro ao importar addon: ${error.message}`
            };
        }
    }

    determineAddonType(manifest) {
        if (!manifest.modules || !Array.isArray(manifest.modules)) {
            return null;
        }

        for (const module of manifest.modules) {
            if (module.type === 'data' || module.type === 'script') {
                return 'behavior';
            } else if (module.type === 'resources') {
                return 'resource';
            }
        }

        return null;
    }

    async installAddon(addonPath, addonType, manifest) {
        try {
            const targetDir = addonType === 'behavior' 
                ? path.join(this.serverPath, 'development_behavior_packs')
                : path.join(this.serverPath, 'development_resource_packs');

            await fs.ensureDir(targetDir);

            // Gerar nome único para o addon
            const baseName = manifest.header?.name || path.basename(addonPath);
            let addonName = this.sanitizeFileName(baseName);
            let counter = 1;

            while (await fs.pathExists(path.join(targetDir, addonName))) {
                addonName = `${this.sanitizeFileName(baseName)}_${counter}`;
                counter++;
            }

            const finalPath = path.join(targetDir, addonName);

            // Copiar addon
            await fs.copy(addonPath, finalPath);

            return {
                success: true,
                message: `${addonType === 'behavior' ? 'Behavior Pack' : 'Resource Pack'} "${addonName}" instalado`,
                addonName: addonName,
                addonType: addonType
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao instalar addon: ${error.message}`
            };
        }
    }

    async deleteAddon(addonId, addonType) {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            const addonsPath = addonType === 'behavior'
                ? path.join(this.serverPath, 'development_behavior_packs')
                : path.join(this.serverPath, 'development_resource_packs');

            const addonPath = path.join(addonsPath, addonId);

            if (!await fs.pathExists(addonPath)) {
                return { success: false, error: 'Addon não encontrado' };
            }

            // Fazer backup antes de deletar
            const backupDir = path.join(this.serverPath, 'addons_backup');
            await fs.ensureDir(backupDir);

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `${addonId}_${timestamp}`);
            
            await fs.copy(addonPath, backupPath);
            await fs.remove(addonPath);

            return {
                success: true,
                message: `Addon "${addonId}" removido com sucesso (backup criado)`
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao remover addon: ${error.message}`
            };
        }
    }

    // Método para obter addons aplicados ao mundo atual
    async getAppliedWorldAddons() {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            // Obter mundo ativo
            const configPath = path.join(this.serverPath, 'server.properties');
            let activeWorld = 'Bedrock level';
            
            if (await fs.pathExists(configPath)) {
                const configContent = await fs.readFile(configPath, 'utf8');
                const levelNameMatch = configContent.match(/level-name=(.+)/);
                if (levelNameMatch) {
                    activeWorld = levelNameMatch[1].trim();
                }
            }

            const worldPath = path.join(this.serverPath, 'worlds', activeWorld);
            
            if (!await fs.pathExists(worldPath)) {
                return { success: false, error: 'Mundo ativo não encontrado' };
            }

            const appliedAddons = {
                behavior_packs: [],
                resource_packs: []
            };

            // Ler behavior packs aplicados
            const behaviorPacksPath = path.join(worldPath, 'world_behavior_packs.json');
            if (await fs.pathExists(behaviorPacksPath)) {
                try {
                    const behaviorPacks = await fs.readJson(behaviorPacksPath);
                    if (Array.isArray(behaviorPacks)) {
                        appliedAddons.behavior_packs = behaviorPacks.map(pack => ({
                            uuid: pack.pack_id || pack.uuid,
                            version: pack.version || [1, 0, 0],
                            name: pack.name || 'Behavior Pack',
                            folder: pack.pack_id || pack.uuid
                        }));
                    }
                } catch (e) {
                    console.error('Erro ao ler behavior packs do mundo:', e);
                }
            }

            // Ler resource packs aplicados
            const resourcePacksPath = path.join(worldPath, 'world_resource_packs.json');
            if (await fs.pathExists(resourcePacksPath)) {
                try {
                    const resourcePacks = await fs.readJson(resourcePacksPath);
                    if (Array.isArray(resourcePacks)) {
                        appliedAddons.resource_packs = resourcePacks.map(pack => ({
                            uuid: pack.pack_id || pack.uuid,
                            version: pack.version || [1, 0, 0],
                            name: pack.name || 'Resource Pack',
                            folder: pack.pack_id || pack.uuid
                        }));
                    }
                } catch (e) {
                    console.error('Erro ao ler resource packs do mundo:', e);
                }
            }

            return {
                success: true,
                addons: appliedAddons
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao obter addons aplicados: ${error.message}`
            };
        }
    }

    // Método para aplicar addon ao mundo atual
    async applyAddonToWorld(addon) {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            // Obter mundo ativo
            const configPath = path.join(this.serverPath, 'server.properties');
            let activeWorld = 'Bedrock level';
            
            if (await fs.pathExists(configPath)) {
                const configContent = await fs.readFile(configPath, 'utf8');
                const levelNameMatch = configContent.match(/level-name=(.+)/);
                if (levelNameMatch) {
                    activeWorld = levelNameMatch[1].trim();
                }
            }

            const worldPath = path.join(this.serverPath, 'worlds', activeWorld);
            
            if (!await fs.pathExists(worldPath)) {
                return { success: false, error: 'Mundo ativo não encontrado' };
            }

            const addonType = addon.type;
            const packFileName = addonType === 'behavior' ? 'world_behavior_packs.json' : 'world_resource_packs.json';
            const packFilePath = path.join(worldPath, packFileName);

            // Ler arquivo atual ou criar novo
            let currentPacks = [];
            if (await fs.pathExists(packFilePath)) {
                try {
                    currentPacks = await fs.readJson(packFilePath);
                    if (!Array.isArray(currentPacks)) {
                        currentPacks = [];
                    }
                } catch (e) {
                    currentPacks = [];
                }
            }

            // Verificar se o addon já está aplicado
            const existingPack = currentPacks.find(pack => 
                (pack.pack_id === addon.uuid) || (pack.uuid === addon.uuid)
            );

            if (existingPack) {
                return {
                    success: false,
                    error: `${addonType === 'behavior' ? 'Behavior Pack' : 'Resource Pack'} já está aplicado ao mundo`
                };
            }

            // Adicionar novo pack
            const newPack = {
                pack_id: addon.uuid || addon.folder,
                version: addon.version || [1, 0, 0]
            };

            currentPacks.push(newPack);

            // Salvar arquivo
            await fs.writeJson(packFilePath, currentPacks, { spaces: 2 });

            return {
                success: true,
                message: `${addonType === 'behavior' ? 'Behavior Pack' : 'Resource Pack'} "${addon.name || addon.folder}" aplicado ao mundo com sucesso!`
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao aplicar addon ao mundo: ${error.message}`
            };
        }
    }

    // Método para remover addon do mundo atual
    async removeAddonFromWorld(addon) {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            // Obter mundo ativo
            const configPath = path.join(this.serverPath, 'server.properties');
            let activeWorld = 'Bedrock level';
            
            if (await fs.pathExists(configPath)) {
                const configContent = await fs.readFile(configPath, 'utf8');
                const levelNameMatch = configContent.match(/level-name=(.+)/);
                if (levelNameMatch) {
                    activeWorld = levelNameMatch[1].trim();
                }
            }

            const worldPath = path.join(this.serverPath, 'worlds', activeWorld);
            
            if (!await fs.pathExists(worldPath)) {
                return { success: false, error: 'Mundo ativo não encontrado' };
            }

            const addonType = addon.type;
            const packFileName = addonType === 'behavior' ? 'world_behavior_packs.json' : 'world_resource_packs.json';
            const packFilePath = path.join(worldPath, packFileName);

            // Ler arquivo atual
            if (!await fs.pathExists(packFilePath)) {
                return {
                    success: false,
                    error: 'Nenhum addon aplicado ao mundo'
                };
            }

            let currentPacks = [];
            try {
                currentPacks = await fs.readJson(packFilePath);
                if (!Array.isArray(currentPacks)) {
                    currentPacks = [];
                }
            } catch (e) {
                return {
                    success: false,
                    error: 'Erro ao ler arquivo de addons do mundo'
                };
            }

            // Encontrar e remover pack
            const initialLength = currentPacks.length;
            currentPacks = currentPacks.filter(pack => 
                (pack.pack_id !== addon.uuid) && (pack.uuid !== addon.uuid)
            );

            if (currentPacks.length === initialLength) {
                return {
                    success: false,
                    error: `${addonType === 'behavior' ? 'Behavior Pack' : 'Resource Pack'} não está aplicado ao mundo`
                };
            }

            // Salvar arquivo
            await fs.writeJson(packFilePath, currentPacks, { spaces: 2 });

            return {
                success: true,
                message: `${addonType === 'behavior' ? 'Behavior Pack' : 'Resource Pack'} "${addon.name || addon.folder}" removido do mundo com sucesso!`
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao remover addon do mundo: ${error.message}`
            };
        }
    }

    async getDirectorySize(dirPath) {
        try {
            let size = 0;
            const items = await fs.readdir(dirPath);

            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stat = await fs.stat(itemPath);

                if (stat.isDirectory()) {
                    size += await this.getDirectorySize(itemPath);
                } else {
                    size += stat.size;
                }
            }

            return size;
        } catch (error) {
            return 0;
        }
    }

    sanitizeFileName(name) {
        return name.replace(/[<>:"/\\|?*]/g, '_').trim();
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = AddonManager;