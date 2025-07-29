const { spawn } = require('child_process');
const { dialog } = require('electron');
const fs = require('fs-extra');
const path = require('path');

class ServerManager {
    constructor() {
        this.serverProcess = null;
        this.serverPath = null;
        this.isRunning = false;
        this.logs = [];
    }

    async selectServerFolder() {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openDirectory'],
                title: 'Selecionar pasta do servidor Bedrock',
                buttonLabel: 'Selecionar'
            });

            if (result.canceled) {
                return { success: false, message: 'Seleção cancelada' };
            }

            const selectedPath = result.filePaths[0];
            
            // Verificar se é uma pasta válida do servidor Bedrock
            const bedrockExecutable = process.platform === 'win32' ? 'bedrock_server.exe' : 'bedrock_server';
            const executablePath = path.join(selectedPath, bedrockExecutable);
            
            if (!await fs.pathExists(executablePath)) {
                return {
                    success: false,
                    error: `Executável do servidor não encontrado: ${bedrockExecutable}`
                };
            }

            this.serverPath = selectedPath;
            
            return {
                success: true,
                path: selectedPath,
                message: 'Pasta do servidor selecionada com sucesso'
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao selecionar pasta: ${error.message}`
            };
        }
    }

    async startServer() {
        try {
            if (this.isRunning) {
                return { success: false, error: 'Servidor já está rodando' };
            }

            if (!this.serverPath) {
                return { success: false, error: 'Nenhuma pasta do servidor selecionada' };
            }

            const bedrockExecutable = process.platform === 'win32' ? 'bedrock_server.exe' : 'bedrock_server';
            const executablePath = path.join(this.serverPath, bedrockExecutable);

            if (!await fs.pathExists(executablePath)) {
                return { success: false, error: 'Executável do servidor não encontrado' };
            }

            // Iniciar processo do servidor
            this.serverProcess = spawn(executablePath, [], {
                cwd: this.serverPath,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            this.isRunning = true;

            // Configurar handlers de saída
            this.serverProcess.stdout.on('data', (data) => {
                const message = data.toString();
                this.logs.push({
                    timestamp: new Date().toISOString(),
                    type: 'server',
                    message: message.trim()
                });
                
                // Manter apenas os últimos 1000 logs
                if (this.logs.length > 1000) {
                    this.logs = this.logs.slice(-1000);
                }
            });

            this.serverProcess.stderr.on('data', (data) => {
                const message = data.toString();
                this.logs.push({
                    timestamp: new Date().toISOString(),
                    type: 'error',
                    message: message.trim()
                });
            });

            this.serverProcess.on('close', (code) => {
                this.isRunning = false;
                this.serverProcess = null;
                this.logs.push({
                    timestamp: new Date().toISOString(),
                    type: 'system',
                    message: `Servidor parou com código: ${code}`
                });
            });

            this.serverProcess.on('error', (error) => {
                this.isRunning = false;
                this.serverProcess = null;
                this.logs.push({
                    timestamp: new Date().toISOString(),
                    type: 'error',
                    message: `Erro no servidor: ${error.message}`
                });
            });

            return {
                success: true,
                message: 'Servidor iniciado com sucesso'
            };
        } catch (error) {
            this.isRunning = false;
            return {
                success: false,
                error: `Erro ao iniciar servidor: ${error.message}`
            };
        }
    }

    async stopServer() {
        try {
            if (!this.isRunning || !this.serverProcess) {
                return { success: false, error: 'Servidor não está rodando' };
            }

            // Enviar comando stop
            this.serverProcess.stdin.write('stop\n');

            // Aguardar um tempo para o servidor parar graciosamente
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Se ainda estiver rodando, forçar parada
            if (this.isRunning && this.serverProcess) {
                this.serverProcess.kill('SIGTERM');
                
                // Aguardar mais um pouco
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Se ainda estiver rodando, forçar kill
                if (this.isRunning && this.serverProcess) {
                    this.serverProcess.kill('SIGKILL');
                }
            }

            this.isRunning = false;
            this.serverProcess = null;

            return {
                success: true,
                message: 'Servidor parado com sucesso'
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao parar servidor: ${error.message}`
            };
        }
    }

    async getServerStatus() {
        return {
            success: true,
            status: {
                isRunning: this.isRunning,
                serverPath: this.serverPath,
                hasProcess: !!this.serverProcess
            }
        };
    }

    async sendCommand(command) {
        try {
            if (!this.isRunning || !this.serverProcess) {
                return { success: false, error: 'Servidor não está rodando' };
            }

            this.serverProcess.stdin.write(`${command}\n`);
            
            this.logs.push({
                timestamp: new Date().toISOString(),
                type: 'command',
                message: `> ${command}`
            });

            return {
                success: true,
                message: 'Comando enviado com sucesso'
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao enviar comando: ${error.message}`
            };
        }
    }

    getLogs() {
        return this.logs;
    }

    clearLogs() {
        this.logs = [];
    }
}

module.exports = ServerManager;