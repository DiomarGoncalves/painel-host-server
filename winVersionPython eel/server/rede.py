import os
import subprocess
import platform
import psutil
import re
from pathlib import Path

class NetworkManager:
    def __init__(self):
        self.server_path = None
        self.playit_process = None
        self.playit_binary = None
        self.tunnel_url = None
        
    def set_server_path(self, path):
        """Define o caminho do servidor"""
        self.server_path = Path(path)
        self.detect_playit_binary()
    
    def detect_playit_binary(self):
        """Detecta o binário do Playit no diretório"""
        if not self.server_path:
            return False
            
        system = platform.system().lower()
        
        if system == "windows":
            playit_file = self.server_path / "playit.exe"
        else:
            playit_file = self.server_path / "playit-linux"
            
        if playit_file.exists():
            self.playit_binary = playit_file
            # Dar permissão de execução no Linux
            if system != "windows":
                os.chmod(playit_file, 0o755)
            return True
            
        return False
    
    def get_playit_status(self):
        """Retorna status atual do Playit"""
        try:
            is_installed = self.detect_playit_binary()
            is_running = self.is_playit_running()
            
            status = {
                "installed": is_installed,
                "running": is_running,
                "binary_path": str(self.playit_binary) if self.playit_binary else None,
                "tunnel_url": self.tunnel_url,
                "process_id": self.playit_process.pid if self.playit_process else None
            }
            
            return {"success": True, "status": status}
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao verificar status: {str(e)}"}
    
    def is_playit_running(self):
        """Verifica se o Playit está rodando"""
        if self.playit_process:
            return self.playit_process.poll() is None
        
        # Verificar por processos do Playit
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                if 'playit' in proc.info['name'].lower():
                    return True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
                
        return False
    
    def start_playit(self):
        """Inicia o túnel Playit"""
        try:
            if not self.detect_playit_binary():
                return {
                    "success": False, 
                    "error": "Playit não encontrado. Baixe o binário e coloque na pasta do servidor."
                }
            
            if self.is_playit_running():
                return {"success": False, "error": "Playit já está rodando"}
            
            # Iniciar processo do Playit
            self.playit_process = subprocess.Popen(
                [str(self.playit_binary)],
                cwd=str(self.server_path),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=False,
                bufsize=1
            )
            
            return {
                "success": True,
                "message": "Playit iniciado com sucesso!",
                "pid": self.playit_process.pid
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao iniciar Playit: {str(e)}"}
    
    def stop_playit(self):
        """Para o túnel Playit"""
        try:
            if not self.is_playit_running():
                return {"success": False, "error": "Playit não está rodando"}
            
            # Terminar processo
            if self.playit_process:
                self.playit_process.terminate()
                try:
                    self.playit_process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    self.playit_process.kill()
                
                self.playit_process = None
                self.tunnel_url = None
            
            # Matar processos restantes
            for proc in psutil.process_iter(['pid', 'name']):
                try:
                    if 'playit' in proc.info['name'].lower():
                        proc.terminate()
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            return {"success": True, "message": "Playit parado com sucesso!"}
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao parar Playit: {str(e)}"}
    
    def extract_tunnel_url(self, log_line):
        """Extrai URL do túnel dos logs do Playit"""
        # Padrões comuns de URL do Playit
        patterns = [
            r'([\w-]+\.playit\.gg:\d+)',
            r'tunnel.*?([\w-]+\.playit\.gg:\d+)',
            r'address.*?([\w-]+\.playit\.gg:\d+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, log_line, re.IGNORECASE)
            if match:
                self.tunnel_url = match.group(1)
                return self.tunnel_url
        
        return None