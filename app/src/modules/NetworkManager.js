const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class NetworkManager {
    constructor() {
        this.serverPath = null;
        this.playitProcess = null;
        this.isPlayitRunning = false;
        this.tunnelInfo = null;
        this.playitLogs = [];
    }

    setServerPath(serverPath) {
        this.serverPath = serverPath;
    }

    async getPlayitStatus() {
        try {
            return {
                success: true,
                status: {
                    isRunning: this.isPlayitRunning,
                    hasProcess: !!this.playitProcess,
                    tunnelInfo: this.tunnelInfo,
                    isInstalled: await this.isPlayitInstalled()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao verificar status do Playit: ${error.message}`
            };
        }
    }

    async isPlayitInstalled() {
        if (!this.serverPath) {
            return false;
        }

        const playitExecutable = process.platform === 'win32' ? 'playit.exe' : 'playit-linux';
        const playitPath = path.join(this.serverPath, playitExecutable);
        
        return await fs.pathExists(playitPath);
    }

    async startPlayit() {
        try {
            if (this.isPlayitRunning) {
                return { success: false, error: 'Playit já está rodando' };
            }

            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            const playitExecutable = process.platform === 'win32' ? 'playit.exe' : 'playit-linux';
            const playitPath = path.join(this.serverPath, playitExecutable);

            if (!await fs.pathExists(playitPath)) {
                return {
                    success: false,
                    error: 'Playit não encontrado. Baixe em https://playit.gg/download',
                    needsDownload: true
                };
            }

            // Iniciar processo do Playit
            this.playitProcess = spawn(playitPath, [], {
                cwd: this.serverPath,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            this.isPlayitRunning = true;
            this.tunnelInfo = null;

            // Configurar handlers de saída
            this.playitProcess.stdout.on('data', (data) => {
                const message = data.toString();
                this.playitLogs.push({
                    timestamp: new Date().toISOString(),
                    type: 'playit',
                    message: message.trim()
                });

                // Tentar extrair informações do túnel
                this.parseTunnelInfo(message);

                // Manter apenas os últimos 500 logs
                if (this.playitLogs.length > 500) {
                    this.playitLogs = this.playitLogs.slice(-500);
                }
            });

            this.playitProcess.stderr.on('data', (data) => {
                const message = data.toString();
                this.playitLogs.push({
                    timestamp: new Date().toISOString(),
                    type: 'error',
                    message: message.trim()
                });
            });

            this.playitProcess.on('close', (code) => {
                this.isPlayitRunning = false;
                this.playitProcess = null;
                this.tunnelInfo = null;
                this.playitLogs.push({
                    timestamp: new Date().toISOString(),
                    type: 'system',
                    message: `Playit parou com código: ${code}`
                });
            });

            this.playitProcess.on('error', (error) => {
                this.isPlayitRunning = false;
                this.playitProcess = null;
                this.tunnelInfo = null;
                this.playitLogs.push({
                    timestamp: new Date().toISOString(),
                    type: 'error',
                    message: `Erro no Playit: ${error.message}`
                });
            });

            return {
                success: true,
                message: 'Playit iniciado com sucesso'
            };
        } catch (error) {
            this.isPlayitRunning = false;
            return {
                success: false,
                error: `Erro ao iniciar Playit: ${error.message}`
            };
        }
    }

    async stopPlayit() {
        try {
            if (!this.isPlayitRunning || !this.playitProcess) {
                return { success: false, error: 'Playit não está rodando' };
            }

            // Tentar parar graciosamente
            this.playitProcess.kill('SIGTERM');

            // Aguardar um tempo para parar graciosamente
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Se ainda estiver rodando, forçar parada
            if (this.isPlayitRunning && this.playitProcess) {
                this.playitProcess.kill('SIGKILL');
            }

            this.isPlayitRunning = false;
            this.playitProcess = null;
            this.tunnelInfo = null;

            return {
                success: true,
                message: 'Playit parado com sucesso'
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao parar Playit: ${error.message}`
            };
        }
    }

    async restartPlayit() {
        try {
            // Parar se estiver rodando
            if (this.isPlayitRunning) {
                await this.stopPlayit();
                // Aguardar um pouco antes de reiniciar
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Iniciar novamente
            return await this.startPlayit();
        } catch (error) {
            return {
                success: false,
                error: `Erro ao reiniciar Playit: ${error.message}`
            };
        }
    }

    async getTunnelInfo() {
        try {
            return {
                success: true,
                tunnelInfo: this.tunnelInfo,
                logs: this.playitLogs.slice(-50) // Últimos 50 logs
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao obter informações do túnel: ${error.message}`
            };
        }
    }

    parseTunnelInfo(message) {
        try {
            // Tentar extrair URL do túnel das mensagens do Playit
            const urlMatch = message.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
                if (!this.tunnelInfo) {
                    this.tunnelInfo = {};
                }
                this.tunnelInfo.url = urlMatch[0];
            }

            // Tentar extrair endereço TCP
            const tcpMatch = message.match(/tcp:\/\/([^:]+):(\d+)/);
            if (tcpMatch) {
                if (!this.tunnelInfo) {
                    this.tunnelInfo = {};
                }
                this.tunnelInfo.host = tcpMatch[1];
                this.tunnelInfo.port = parseInt(tcpMatch[2]);
                this.tunnelInfo.address = `${tcpMatch[1]}:${tcpMatch[2]}`;
            }

            // Tentar extrair outras informações relevantes
            if (message.includes('tunnel established') || message.includes('connected')) {
                if (!this.tunnelInfo) {
                    this.tunnelInfo = {};
                }
                this.tunnelInfo.status = 'connected';
                this.tunnelInfo.connectedAt = new Date().toISOString();
            }
        } catch (error) {
            // Ignorar erros de parsing
        }
    }

    getPlayitLogs() {
        return this.playitLogs;
    }

    clearPlayitLogs() {
        this.playitLogs = [];
    }

    async getDownloadInstructions() {
        const platform = process.platform;
        const arch = process.arch;

        let instructions = {
            platform: platform,
            architecture: arch,
            downloadUrl: 'https://playit.gg/download',
            steps: []
        };

        if (platform === 'win32') {
            instructions.steps = [
                '1. Acesse https://playit.gg/download',
                '2. Baixe o arquivo "playit.exe" para Windows',
                '3. Coloque o arquivo "playit.exe" na pasta do seu servidor Bedrock',
                '4. Execute o Playit pela primeira vez para configurar sua conta',
                '5. Volte ao painel e clique em "Iniciar Túnel"'
            ];
        } else if (platform === 'linux') {
            instructions.steps = [
                '1. Acesse https://playit.gg/download',
                '2. Baixe o arquivo "playit-linux" para Linux',
                '3. Coloque o arquivo na pasta do seu servidor Bedrock',
                '4. Torne o arquivo executável: chmod +x playit-linux',
                '5. Execute o Playit pela primeira vez para configurar sua conta',
                '6. Volte ao painel e clique em "Iniciar Túnel"'
            ];
        } else if (platform === 'darwin') {
            instructions.steps = [
                '1. Acesse https://playit.gg/download',
                '2. Baixe o arquivo para macOS',
                '3. Coloque o arquivo na pasta do seu servidor Bedrock',
                '4. Torne o arquivo executável se necessário',
                '5. Execute o Playit pela primeira vez para configurar sua conta',
                '6. Volte ao painel e clique em "Iniciar Túnel"'
            ];
        }

        return {
            success: true,
            instructions: instructions
        };
    }
}

module.exports = NetworkManager;