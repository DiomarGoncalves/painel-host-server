import os
import subprocess
import platform
import psutil
import threading
import time
from pathlib import Path

class ServerManager:
    def __init__(self):
        self.server_path = None
        self.server_process = None
        self.server_binary = None
        
    def set_server_path(self, path):
        """Define o caminho do servidor"""
        self.server_path = Path(path)
        self.detect_server_binary()
    
    def detect_server_binary(self):
        """Detecta o binário do servidor Bedrock"""
        if not self.server_path:
            return False
            
        system = platform.system().lower()
        
        if system == "windows":
            server_file = self.server_path / "bedrock_server.exe"
        else:
            server_file = self.server_path / "bedrock_server"
            
        if server_file.exists():
            self.server_binary = server_file
            # Dar permissão de execução no Linux
            if system != "windows":
                os.chmod(server_file, 0o755)
            return True
            
        return False
    
    def get_server_status(self):
        """Retorna status atual do servidor"""
        try:
            is_installed = self.detect_server_binary()
            is_running = self.is_server_running()
            
            status = {
                "installed": is_installed,
                "running": is_running,
                "binary_path": str(self.server_binary) if self.server_binary else None,
                "process_id": self.server_process.pid if self.server_process else None,
                "uptime": self.get_server_uptime() if is_running else 0
            }
            
            return {"success": True, "status": status}
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao verificar status: {str(e)}"}
    
    def is_server_running(self):
        """Verifica se o servidor está rodando"""
        if self.server_process:
            return self.server_process.poll() is None
        
        # Verificar por processos do servidor
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                if 'bedrock_server' in proc.info['name'].lower():
                    return True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
                
        return False
    
    def get_server_uptime(self):
        """Retorna tempo de execução do servidor em segundos"""
        if not self.server_process:
            return 0
            
        try:
            proc = psutil.Process(self.server_process.pid)
            return time.time() - proc.create_time()
        except:
            return 0
    
    def start_server(self):
        """Inicia o servidor Minecraft"""
        try:
            if not self.detect_server_binary():
                return {
                    "success": False, 
                    "error": "Servidor Bedrock não encontrado na pasta selecionada"
                }
            
            if self.is_server_running():
                return {"success": False, "error": "Servidor já está rodando"}
            
            # Verificar se server.properties existe
            properties_file = self.server_path / "server.properties"
            if not properties_file.exists():
                return {
                    "success": False, 
                    "error": "Arquivo server.properties não encontrado"
                }
            
            # Iniciar processo do servidor
            self.server_process = subprocess.Popen(
                [str(self.server_binary)],
                cwd=str(self.server_path),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                stdin=subprocess.PIPE,
                universal_newlines=False,
                bufsize=1
            )
            
            return {
                "success": True,
                "message": "Servidor iniciado com sucesso!",
                "pid": self.server_process.pid
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao iniciar servidor: {str(e)}"}
    
    def stop_server(self):
        """Para o servidor Minecraft"""
        try:
            if not self.is_server_running():
                return {"success": False, "error": "Servidor não está rodando"}
            
            # Enviar comando stop
            if self.server_process and self.server_process.stdin:
                try:
                    self.server_process.stdin.write(b"stop\n")
                    self.server_process.stdin.flush()
                    
                    # Aguardar até 10 segundos para parada graceful
                    try:
                        self.server_process.wait(timeout=10)
                    except subprocess.TimeoutExpired:
                        # Forçar parada se não parar graciosamente
                        self.server_process.terminate()
                        try:
                            self.server_process.wait(timeout=5)
                        except subprocess.TimeoutExpired:
                            self.server_process.kill()
                            
                except:
                    # Se falhar, tentar terminar diretamente
                    self.server_process.terminate()
                    try:
                        self.server_process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        self.server_process.kill()
            
            self.server_process = None
            
            # Matar processos restantes se necessário
            for proc in psutil.process_iter(['pid', 'name']):
                try:
                    if 'bedrock_server' in proc.info['name'].lower():
                        proc.terminate()
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            return {"success": True, "message": "Servidor parado com sucesso!"}
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao parar servidor: {str(e)}"}
    
    def send_command(self, command):
        """Envia comando para o servidor"""
        try:
            if not self.is_server_running():
                return {"success": False, "error": "Servidor não está rodando"}
            
            if not self.server_process or not self.server_process.stdin:
                return {"success": False, "error": "Não é possível enviar comandos"}
            
            # Enviar comando
            command_bytes = f"{command}\n".encode('utf-8')
            self.server_process.stdin.write(command_bytes)
            self.server_process.stdin.flush()
            
            return {
                "success": True,
                "message": f"Comando '{command}' enviado com sucesso!"
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao enviar comando: {str(e)}"}