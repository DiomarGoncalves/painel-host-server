const fs = require('fs-extra');
const path = require('path');
const { dialog } = require('electron');
const archiver = require('archiver');
const extractZip = require('extract-zip');

class WorldManager {
    constructor() {
        this.serverPath = null;
    }

    setServerPath(serverPath) {
        this.serverPath = serverPath;
    }

    async getWorlds() {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            const worldsPath = path.join(this.serverPath, 'worlds');
            
            if (!await fs.pathExists(worldsPath)) {
                return { success: true, worlds: [] };
            }

            const worldFolders = await fs.readdir(worldsPath);
            const worlds = [];

            // Obter mundo ativo das configurações
            const configPath = path.join(this.serverPath, 'server.properties');
            let activeWorld = 'Bedrock level';
            
            if (await fs.pathExists(configPath)) {
                const configContent = await fs.readFile(configPath, 'utf8');
                const levelNameMatch = configContent.match(/level-name=(.+)/);
                if (levelNameMatch) {
                    activeWorld = levelNameMatch[1].trim();
                }
            }

            for (const folder of worldFolders) {
                const worldPath = path.join(worldsPath, folder);
                const stat = await fs.stat(worldPath);
                
                if (stat.isDirectory()) {
                    const levelDatPath = path.join(worldPath, 'level.dat');
                    const worldInfoPath = path.join(worldPath, 'levelname.txt');
                    
                    let worldInfo = {
                        name: folder,
                        folder: folder,
                        path: worldPath,
                        isActive: folder === activeWorld,
                        size: await this.getDirectorySize(worldPath),
                        lastModified: stat.mtime,
                        hasLevelDat: await fs.pathExists(levelDatPath)
                    };

                    // Tentar obter informações adicionais
                    if (await fs.pathExists(worldInfoPath)) {
                        try {
                            const levelName = await fs.readFile(worldInfoPath, 'utf8');
                            worldInfo.displayName = levelName.trim();
                        } catch (e) {
                            // Ignorar erro
                        }
                    }

                    worlds.push(worldInfo);
                }
            }

            return {
                success: true,
                worlds: worlds.sort((a, b) => b.lastModified - a.lastModified)
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao listar mundos: ${error.message}`
            };
        }
    }

    async importWorld() {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            const result = await dialog.showOpenDialog({
                properties: ['openFile'],
                title: 'Selecionar arquivo do mundo',
                buttonLabel: 'Importar',
                filters: [
                    { name: 'Arquivos de Mundo', extensions: ['zip', 'mcworld'] },
                    { name: 'Todos os arquivos', extensions: ['*'] }
                ]
            });

            if (result.canceled) {
                return { success: false, message: 'Importação cancelada' };
            }

            const worldFile = result.filePaths[0];
            const worldsPath = path.join(this.serverPath, 'worlds');
            
            // Criar pasta worlds se não existir
            await fs.ensureDir(worldsPath);

            // Gerar nome único para o mundo
            const baseName = path.basename(worldFile, path.extname(worldFile));
            let worldName = baseName;
            let counter = 1;
            
            while (await fs.pathExists(path.join(worldsPath, worldName))) {
                worldName = `${baseName}_${counter}`;
                counter++;
            }

            const worldPath = path.join(worldsPath, worldName);

            // Extrair arquivo
            await extractZip(worldFile, { dir: worldPath });

            // Verificar se é um mundo válido
            const levelDatPath = path.join(worldPath, 'level.dat');
            if (!await fs.pathExists(levelDatPath)) {
                // Tentar encontrar level.dat em subpastas
                const items = await fs.readdir(worldPath);
                let found = false;
                
                for (const item of items) {
                    const itemPath = path.join(worldPath, item);
                    const stat = await fs.stat(itemPath);
                    
                    if (stat.isDirectory()) {
                        const subLevelDat = path.join(itemPath, 'level.dat');
                        if (await fs.pathExists(subLevelDat)) {
                            // Mover conteúdo da subpasta para a pasta principal
                            const subItems = await fs.readdir(itemPath);
                            for (const subItem of subItems) {
                                await fs.move(
                                    path.join(itemPath, subItem),
                                    path.join(worldPath, subItem)
                                );
                            }
                            await fs.remove(itemPath);
                            found = true;
                            break;
                        }
                    }
                }
                
                if (!found) {
                    await fs.remove(worldPath);
                    return {
                        success: false,
                        error: 'Arquivo não contém um mundo válido do Minecraft'
                    };
                }
            }

            return {
                success: true,
                message: `Mundo "${worldName}" importado com sucesso`,
                worldName: worldName
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao importar mundo: ${error.message}`
            };
        }
    }

    async backupWorld(worldName) {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            const worldPath = path.join(this.serverPath, 'worlds', worldName);
            
            if (!await fs.pathExists(worldPath)) {
                return { success: false, error: 'Mundo não encontrado' };
            }

            // Criar pasta de backup
            const backupDir = path.join(this.serverPath, 'worlds_backup');
            await fs.ensureDir(backupDir);

            // Nome do arquivo de backup
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `${worldName}_backup_${timestamp}.zip`;
            const backupPath = path.join(backupDir, backupFileName);

            // Criar arquivo ZIP
            const output = fs.createWriteStream(backupPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            return new Promise((resolve, reject) => {
                output.on('close', () => {
                    resolve({
                        success: true,
                        message: `Backup do mundo "${worldName}" criado com sucesso`,
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
                archive.directory(worldPath, worldName);
                archive.finalize();
            });
        } catch (error) {
            return {
                success: false,
                error: `Erro ao fazer backup: ${error.message}`
            };
        }
    }

    async setActiveWorld(worldName) {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            const worldPath = path.join(this.serverPath, 'worlds', worldName);
            
            if (!await fs.pathExists(worldPath)) {
                return { success: false, error: 'Mundo não encontrado' };
            }

            // Atualizar server.properties
            const configPath = path.join(this.serverPath, 'server.properties');
            
            if (await fs.pathExists(configPath)) {
                let configContent = await fs.readFile(configPath, 'utf8');
                
                // Substituir ou adicionar level-name
                if (configContent.includes('level-name=')) {
                    configContent = configContent.replace(/level-name=.+/, `level-name=${worldName}`);
                } else {
                    configContent += `\nlevel-name=${worldName}`;
                }
                
                await fs.writeFile(configPath, configContent, 'utf8');
            }

            return {
                success: true,
                message: `Mundo "${worldName}" definido como ativo`
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao definir mundo ativo: ${error.message}`
            };
        }
    }

    async deleteWorld(worldName) {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            const worldPath = path.join(this.serverPath, 'worlds', worldName);
            
            if (!await fs.pathExists(worldPath)) {
                return { success: false, error: 'Mundo não encontrado' };
            }

            // Fazer backup antes de deletar
            await this.backupWorld(worldName);

            // Deletar mundo
            await fs.remove(worldPath);

            return {
                success: true,
                message: `Mundo "${worldName}" deletado com sucesso (backup criado)`
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao deletar mundo: ${error.message}`
            };
        }
    }

    async getWorldSettings() {
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

            // Ler configurações do mundo a partir de level.dat e outros arquivos
            let settings = this.getDefaultWorldSettings();
            
            // Tentar ler levelname.txt
            const levelNamePath = path.join(worldPath, 'levelname.txt');
            if (await fs.pathExists(levelNamePath)) {
                try {
                    const levelName = await fs.readFile(levelNamePath, 'utf8');
                    settings.LevelName = levelName.trim();
                } catch (e) {
                    // Ignorar erro
                }
            }
            
            // Tentar ler world_behavior_packs.json
            const worldBehaviorPath = path.join(worldPath, 'world_behavior_packs.json');
            if (await fs.pathExists(worldBehaviorPath)) {
                try {
                    const behaviorPacks = await fs.readJson(worldBehaviorPath);
                    settings.appliedBehaviorPacks = behaviorPacks;
                } catch (e) {
                    settings.appliedBehaviorPacks = [];
                }
            }
            
            // Tentar ler world_resource_packs.json
            const worldResourcePath = path.join(worldPath, 'world_resource_packs.json');
            if (await fs.pathExists(worldResourcePath)) {
                try {
                    const resourcePacks = await fs.readJson(worldResourcePath);
                    settings.appliedResourcePacks = resourcePacks;
                } catch (e) {
                    settings.appliedResourcePacks = [];
                }
            }
            
            // Tentar ler level.dat (formato NBT - complexo, por enquanto usar padrões)
            const levelDatPath = path.join(worldPath, 'level.dat');
            if (await fs.pathExists(levelDatPath)) {
                // Por enquanto, apenas verificamos se existe
                // A leitura completa do NBT seria complexa e requereria uma biblioteca específica
                settings.hasLevelDat = true;
            }
            
            return {
                success: true,
                settings: settings,
                world_name: activeWorld
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao carregar configurações do mundo: ${error.message}`
            };
        }
    }

    async saveWorldSettings(settings) {
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

            // Salvar levelname.txt se fornecido
            if (settings.LevelName) {
                const levelNamePath = path.join(worldPath, 'levelname.txt');
                await fs.writeFile(levelNamePath, settings.LevelName, 'utf8');
            }

            // Criar arquivo de configurações customizadas (JSON simples para armazenar as configurações)
            const customConfigPath = path.join(worldPath, 'world_config.json');
            const configToSave = { ...settings };
            
            // Remover propriedades que não devem ser salvas no JSON
            delete configToSave.appliedBehaviorPacks;
            delete configToSave.appliedResourcePacks;
            delete configToSave.hasLevelDat;
            delete configToSave.LevelName;
            
            await fs.writeJson(customConfigPath, configToSave, { spaces: 2 });
            
            return {
                success: true,
                message: 'Configurações do mundo salvas com sucesso!\n\nNota: Algumas configurações só terão efeito após reiniciar o servidor.'
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao salvar configurações do mundo: ${error.message}`
            };
        }
    }

    getDefaultWorldSettings() {
        return {
            // Configurações básicas
            RandomSeed: '',
            IsHardcore: false,
            Difficulty: 2,
            educationFeaturesEnabled: false,
            
            // Comandos e blocos
            commandblockoutput: true,
            commandblocksenabled: false,
            functioncommandlimit: 10000,
            maxcommandchainlength: 65535,
            sendcommandfeedback: true,
            
            // Ciclos e tempo
            dodaylightcycle: true,
            doweathercycle: true,
            randomtickspeed: 1,
            doinsomnia: true,
            
            // Drops e danos
            doentitydrops: true,
            dotiledrops: true,
            domobloot: true,
            drowningdamage: true,
            falldamage: true,
            firedamage: true,
            freezedamage: true,
            dofiretick: true,
            tntexplodes: true,
            tntexplosiondropdecay: true,
            respawnblocksexplode: true,
            
            // Gameplay
            keepinventory: false,
            doimmediaterespawn: false,
            naturalregeneration: true,
            mobgriefing: true,
            pvp: true,
            playerssleepingpercentage: 100,
            spawnradius: 10,
            domobspawning: true,
            
            // Interface
            showcoordinates: false,
            showdaysplayed: false,
            showdeathmessages: true,
            showtags: true,
            recipesunlock: true,
            
            // Experimentos
            data_driven_biomes: false,
            experimental_creator_cameras: false,
            gametest: false,
            jigsaw_structures: false,
            upcoming_creator_features: false,
            villager_trades_rebalance: false,
            
            // Propriedades internas (não editáveis)
            appliedBehaviorPacks: [],
            appliedResourcePacks: [],
            hasLevelDat: false,
            LevelName: ''
        };
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

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = WorldManager;