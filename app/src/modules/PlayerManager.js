const fs = require('fs-extra');
const path = require('path');

class PlayerManager {
    constructor() {
        this.serverPath = null;
    }

    setServerPath(serverPath) {
        this.serverPath = serverPath;
    }

    async getOperators() {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            const opsPath = path.join(this.serverPath, 'ops.json');
            
            if (!await fs.pathExists(opsPath)) {
                // Criar arquivo ops.json vazio se não existir
                await fs.writeJson(opsPath, []);
                return { success: true, operators: [] };
            }

            const operators = await fs.readJson(opsPath);
            
            // Garantir que é um array
            if (!Array.isArray(operators)) {
                return { success: true, operators: [] };
            }

            // Formatar dados dos operadores
            const formattedOps = operators.map(op => {
                if (typeof op === 'string') {
                    return {
                        name: op,
                        uuid: null,
                        level: 4,
                        bypassesPlayerLimit: false
                    };
                } else {
                    return {
                        name: op.name || 'Unknown',
                        uuid: op.uuid || null,
                        level: op.level || 4,
                        bypassesPlayerLimit: op.bypassesPlayerLimit || false
                    };
                }
            });

            return {
                success: true,
                operators: formattedOps
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao carregar operadores: ${error.message}`
            };
        }
    }

    async addOperator(playerName) {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            if (!playerName || playerName.trim() === '') {
                return { success: false, error: 'Nome do jogador não pode estar vazio' };
            }

            const cleanName = playerName.trim();
            const opsPath = path.join(this.serverPath, 'ops.json');
            
            let operators = [];
            
            if (await fs.pathExists(opsPath)) {
                try {
                    operators = await fs.readJson(opsPath);
                    if (!Array.isArray(operators)) {
                        operators = [];
                    }
                } catch (e) {
                    operators = [];
                }
            }

            // Verificar se o jogador já é operador
            const existingOp = operators.find(op => {
                const opName = typeof op === 'string' ? op : op.name;
                return opName && opName.toLowerCase() === cleanName.toLowerCase();
            });

            if (existingOp) {
                return {
                    success: false,
                    error: `Jogador "${cleanName}" já é operador`
                };
            }

            // Adicionar novo operador
            const newOperator = {
                name: cleanName,
                uuid: null,
                level: 4,
                bypassesPlayerLimit: false
            };

            operators.push(newOperator);

            // Salvar arquivo
            await fs.writeJson(opsPath, operators, { spaces: 2 });

            return {
                success: true,
                message: `Jogador "${cleanName}" adicionado como operador`
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao adicionar operador: ${error.message}`
            };
        }
    }

    async removeOperator(playerName) {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            if (!playerName || playerName.trim() === '') {
                return { success: false, error: 'Nome do jogador não pode estar vazio' };
            }

            const cleanName = playerName.trim();
            const opsPath = path.join(this.serverPath, 'ops.json');
            
            if (!await fs.pathExists(opsPath)) {
                return {
                    success: false,
                    error: 'Arquivo de operadores não encontrado'
                };
            }

            let operators = [];
            
            try {
                operators = await fs.readJson(opsPath);
                if (!Array.isArray(operators)) {
                    operators = [];
                }
            } catch (e) {
                return {
                    success: false,
                    error: 'Erro ao ler arquivo de operadores'
                };
            }

            // Encontrar e remover operador
            const initialLength = operators.length;
            operators = operators.filter(op => {
                const opName = typeof op === 'string' ? op : op.name;
                return !(opName && opName.toLowerCase() === cleanName.toLowerCase());
            });

            if (operators.length === initialLength) {
                return {
                    success: false,
                    error: `Jogador "${cleanName}" não é operador`
                };
            }

            // Salvar arquivo
            await fs.writeJson(opsPath, operators, { spaces: 2 });

            return {
                success: true,
                message: `Jogador "${cleanName}" removido dos operadores`
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao remover operador: ${error.message}`
            };
        }
    }

    async getAllowlist() {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            const allowlistPath = path.join(this.serverPath, 'allowlist.json');
            
            if (!await fs.pathExists(allowlistPath)) {
                return { success: true, allowlist: [] };
            }

            const allowlist = await fs.readJson(allowlistPath);
            
            if (!Array.isArray(allowlist)) {
                return { success: true, allowlist: [] };
            }

            return {
                success: true,
                allowlist: allowlist
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao carregar allowlist: ${error.message}`
            };
        }
    }

    async addToAllowlist(playerName) {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            if (!playerName || playerName.trim() === '') {
                return { success: false, error: 'Nome do jogador não pode estar vazio' };
            }

            const cleanName = playerName.trim();
            const allowlistPath = path.join(this.serverPath, 'allowlist.json');
            
            let allowlist = [];
            
            if (await fs.pathExists(allowlistPath)) {
                try {
                    allowlist = await fs.readJson(allowlistPath);
                    if (!Array.isArray(allowlist)) {
                        allowlist = [];
                    }
                } catch (e) {
                    allowlist = [];
                }
            }

            // Verificar se o jogador já está na allowlist
            const existingPlayer = allowlist.find(player => {
                const playerName = typeof player === 'string' ? player : player.name;
                return playerName && playerName.toLowerCase() === cleanName.toLowerCase();
            });

            if (existingPlayer) {
                return {
                    success: false,
                    error: `Jogador "${cleanName}" já está na allowlist`
                };
            }

            // Adicionar jogador
            const newPlayer = {
                name: cleanName,
                uuid: null,
                ignoresPlayerLimit: false
            };

            allowlist.push(newPlayer);

            // Salvar arquivo
            await fs.writeJson(allowlistPath, allowlist, { spaces: 2 });

            return {
                success: true,
                message: `Jogador "${cleanName}" adicionado à allowlist`
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao adicionar à allowlist: ${error.message}`
            };
        }
    }

    async removeFromAllowlist(playerName) {
        try {
            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            const cleanName = playerName.trim();
            const allowlistPath = path.join(this.serverPath, 'allowlist.json');
            
            if (!await fs.pathExists(allowlistPath)) {
                return {
                    success: false,
                    error: 'Arquivo de allowlist não encontrado'
                };
            }

            let allowlist = [];
            
            try {
                allowlist = await fs.readJson(allowlistPath);
                if (!Array.isArray(allowlist)) {
                    allowlist = [];
                }
            } catch (e) {
                return {
                    success: false,
                    error: 'Erro ao ler arquivo de allowlist'
                };
            }

            // Encontrar e remover jogador
            const initialLength = allowlist.length;
            allowlist = allowlist.filter(player => {
                const playerName = typeof player === 'string' ? player : player.name;
                return !(playerName && playerName.toLowerCase() === cleanName.toLowerCase());
            });

            if (allowlist.length === initialLength) {
                return {
                    success: false,
                    error: `Jogador "${cleanName}" não está na allowlist`
                };
            }

            // Salvar arquivo
            await fs.writeJson(allowlistPath, allowlist, { spaces: 2 });

            return {
                success: true,
                message: `Jogador "${cleanName}" removido da allowlist`
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao remover da allowlist: ${error.message}`
            };
        }
    }
}

module.exports = PlayerManager;