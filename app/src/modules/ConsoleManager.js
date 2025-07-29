const { spawn } = require('child_process');

class ConsoleManager {
    constructor() {
        this.serverManager = null;
        this.logs = [];
    }

    setServerManager(serverManager) {
        this.serverManager = serverManager;
    }

    async sendCommand(command) {
        try {
            if (!this.serverManager) {
                return { success: false, error: 'Gerenciador de servidor não configurado' };
            }

            return await this.serverManager.sendCommand(command);
        } catch (error) {
            return {
                success: false,
                error: `Erro ao enviar comando: ${error.message}`
            };
        }
    }

    async getConsoleLogs() {
        try {
            if (!this.serverManager) {
                return { success: false, error: 'Gerenciador de servidor não configurado' };
            }

            const logs = this.serverManager.getLogs();
            
            return {
                success: true,
                logs: logs
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao obter logs: ${error.message}`
            };
        }
    }

    async clearConsole() {
        try {
            if (!this.serverManager) {
                return { success: false, error: 'Gerenciador de servidor não configurado' };
            }

            this.serverManager.clearLogs();
            
            return {
                success: true,
                message: 'Console limpo com sucesso'
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao limpar console: ${error.message}`
            };
        }
    }

    // Comandos comuns do Minecraft Bedrock
    getCommonCommands() {
        return [
            {
                command: 'help',
                description: 'Mostra lista de comandos disponíveis'
            },
            {
                command: 'list',
                description: 'Lista jogadores online'
            },
            {
                command: 'kick <player>',
                description: 'Expulsa um jogador do servidor'
            },
            {
                command: 'ban <player>',
                description: 'Bane um jogador do servidor'
            },
            {
                command: 'pardon <player>',
                description: 'Remove o ban de um jogador'
            },
            {
                command: 'op <player>',
                description: 'Torna um jogador operador'
            },
            {
                command: 'deop <player>',
                description: 'Remove privilégios de operador'
            },
            {
                command: 'whitelist add <player>',
                description: 'Adiciona jogador à whitelist'
            },
            {
                command: 'whitelist remove <player>',
                description: 'Remove jogador da whitelist'
            },
            {
                command: 'whitelist on',
                description: 'Ativa a whitelist'
            },
            {
                command: 'whitelist off',
                description: 'Desativa a whitelist'
            },
            {
                command: 'say <message>',
                description: 'Envia mensagem para todos os jogadores'
            },
            {
                command: 'tell <player> <message>',
                description: 'Envia mensagem privada para um jogador'
            },
            {
                command: 'tp <player1> <player2>',
                description: 'Teleporta um jogador para outro'
            },
            {
                command: 'give <player> <item> [amount]',
                description: 'Dá um item para um jogador'
            },
            {
                command: 'gamemode <mode> [player]',
                description: 'Altera modo de jogo (survival, creative, adventure)'
            },
            {
                command: 'difficulty <level>',
                description: 'Altera dificuldade (peaceful, easy, normal, hard)'
            },
            {
                command: 'time set <time>',
                description: 'Define horário (day, night, ou número)'
            },
            {
                command: 'weather <type>',
                description: 'Altera clima (clear, rain, thunder)'
            },
            {
                command: 'save-all',
                description: 'Salva o mundo'
            },
            {
                command: 'stop',
                description: 'Para o servidor'
            }
        ];
    }

    formatLogMessage(log) {
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        let prefix = '';
        
        switch (log.type) {
            case 'command':
                prefix = '[CMD]';
                break;
            case 'server':
                prefix = '[SERVER]';
                break;
            case 'error':
                prefix = '[ERROR]';
                break;
            case 'system':
                prefix = '[SYSTEM]';
                break;
            default:
                prefix = '[INFO]';
        }
        
        return `[${timestamp}] ${prefix} ${log.message}`;
    }
}

module.exports = ConsoleManager;