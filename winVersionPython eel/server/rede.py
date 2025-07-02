import os
import subprocess
import platform
import psutil
import re
import time
import threading
from pathlib import Path

class NetworkManager:
    def __init__(self):
        self.server_path = None
        self.playit_process = None
        self.playit_binary = None
        self.tunnel_url = None
        self.tunnel_info = {}
        self.logs = []
        self.max_logs = 1000
        
    def set_server_path(self, path):
        """Define o caminho do servidor"""
        self.server_path = Path(path)
        self.detect_playit_binary()
    
    def detect_playit_binary(self):
        """Detecta o binário do Playit no diretório"""
        if not self.server_path:
            return False
            
        system = platform.system().lower()
        
        # Possíveis nomes do binário
        possible_names = []
        if system == "windows":
            possible_names = ["playit.exe"]
        else:
            possible_names = ["playit-linux", "playit"]
        
        for binary_name in possible_names:
            playit_file = self.server_path / binary_name
            if playit_file.exists():
                self.playit_binary = playit_file
                # Dar permissão de execução no Linux
                if system != "windows":
                    try:
                        os.chmod(playit_file, 0o755)
                    except:
                        pass
                return True
                
        return False
    
    def download_playit_info(self):
        """Retorna informações para download do Playit"""
        system = platform.system().lower()
        
        if system == "windows":
            return {
                "url": "https://playit.gg/download",
                "filename": "playit.exe",
                "instructions": [
                    "1. Acesse https://playit.gg/download",
                    "2. Baixe o arquivo 'playit.exe' para Windows",
                    "3. Coloque o arquivo na pasta do servidor Bedrock",
                    "4. Clique em 'Atualizar Status' para detectar"
                ]
            }
        else:
            return {
                "url": "https://playit.gg/download",
                "filename": "playit-linux",
                "instructions": [
                    "1. Acesse https://playit.gg/download",
                    "2. Baixe o arquivo para Linux",
                    "3. Renomeie para 'playit-linux'",
                    "4. Coloque na pasta do servidor Bedrock",
                    "5. Clique em 'Atualizar Status' para detectar"
                ]
            }
    
    def get_playit_status(self):
        """Retorna status atual do Playit"""
        try:
            is_installed = self.detect_playit_binary()
            is_running = self.is_playit_running()
            
            status = {
                "installed": is_installed,
                "running": is_running,
                "binary_path": str(self.playit_binary) if self.playit_binary else None,
                "tunnel_info": self.tunnel_info,
                "process_id": self.playit_process.pid if self.playit_process and self.playit_process.poll() is None else None,
                "download_info": self.download_playit_info() if not is_installed else None
            }
            
            return {"success": True, "status": status}
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao verificar status: {str(e)}"}
    
    def is_playit_running(self):
        """Verifica se o Playit está rodando"""
        if self.playit_process:
            return self.playit_process.poll() is None
        
        # Verificar por processos do Playit
        try:
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    if 'playit' in proc.info['name'].lower():
                        return True
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
        except:
            pass
                
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
            
            # Limpar logs anteriores
            self.logs = []
            self.tunnel_info = {}
            
            # Iniciar processo do Playit
            print(f"🚀 Iniciando Playit: {self.playit_binary}")
            
            self.playit_process = subprocess.Popen(
                [str(self.playit_binary)],
                cwd=str(self.server_path),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            # Iniciar thread para capturar logs
            log_thread = threading.Thread(target=self._capture_playit_logs, daemon=True)
            log_thread.start()
            
            return {
                "success": True,
                "message": "Playit iniciado com sucesso! Aguarde a configuração do túnel...",
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
                try:
                    self.playit_process.terminate()
                    # Aguardar até 5 segundos para parada graceful
                    try:
                        self.playit_process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        self.playit_process.kill()
                        self.playit_process.wait(timeout=2)
                except:
                    pass
                
                self.playit_process = None
                self.tunnel_info = {}
            
            # Matar processos restantes
            try:
                for proc in psutil.process_iter(['pid', 'name']):
                    try:
                        if 'playit' in proc.info['name'].lower():
                            proc.terminate()
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        continue
            except:
                pass
            
            return {"success": True, "message": "Playit parado com sucesso!"}
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao parar Playit: {str(e)}"}
    
    def _capture_playit_logs(self):
        """Captura logs do Playit em tempo real"""
        try:
            while self.playit_process and self.playit_process.poll() is None:
                line = self.playit_process.stdout.readline()
                if line:
                    line = line.strip()
                    self._add_log(line)
                    self._parse_tunnel_info(line)
                else:
                    time.sleep(0.1)
        except Exception as e:
            self._add_log(f"Erro ao capturar logs: {e}")
    
    def _add_log(self, message):
        """Adiciona mensagem aos logs"""
        timestamp = time.strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        
        self.logs.append(log_entry)
        
        # Limitar número de logs
        if len(self.logs) > self.max_logs:
            self.logs = self.logs[-self.max_logs:]
    
    def _parse_tunnel_info(self, log_line):
        """Extrai informações do túnel dos logs"""
        try:
            # Padrões para detectar informações do túnel
            patterns = {
                'tunnel_url': [
                    r'tunnel.*?([a-zA-Z0-9-]+\.playit\.gg:\d+)',
                    r'address.*?([a-zA-Z0-9-]+\.playit\.gg:\d+)',
                    r'connect.*?([a-zA-Z0-9-]+\.playit\.gg:\d+)',
                    r'([a-zA-Z0-9-]+\.playit\.gg:\d+)'
                ],
                'status': [
                    r'tunnel.*?(connected|established|ready)',
                    r'status.*?(connected|established|ready)',
                    r'(connected|established|ready)'
                ],
                'local_port': [
                    r'local.*?port.*?(\d+)',
                    r'port.*?(\d+)',
                    r'localhost:(\d+)'
                ]
            }
            
            # Procurar URL do túnel
            for pattern in patterns['tunnel_url']:
                match = re.search(pattern, log_line, re.IGNORECASE)
                if match:
                    self.tunnel_info['url'] = match.group(1)
                    self.tunnel_url = match.group(1)
                    break
            
            # Procurar status
            for pattern in patterns['status']:
                match = re.search(pattern, log_line, re.IGNORECASE)
                if match:
                    self.tunnel_info['status'] = match.group(1).lower()
                    break
            
            # Procurar porta local
            for pattern in patterns['local_port']:
                match = re.search(pattern, log_line, re.IGNORECASE)
                if match:
                    self.tunnel_info['local_port'] = match.group(1)
                    break
            
            # Detectar mensagens especiais
            if 'error' in log_line.lower():
                self.tunnel_info['last_error'] = log_line
            
            if 'claim' in log_line.lower() and 'playit.gg' in log_line.lower():
                # Extrair URL de claim se presente
                claim_match = re.search(r'(https://playit\.gg/[^\s]+)', log_line)
                if claim_match:
                    self.tunnel_info['claim_url'] = claim_match.group(1)
                    
        except Exception as e:
            print(f"Erro ao analisar log: {e}")
    
    def get_logs(self):
        """Retorna logs recentes do Playit"""
        return self.logs.copy()
    
    def get_tunnel_info(self):
        """Retorna informações detalhadas do túnel"""
        return {
            "success": True,
            "info": self.tunnel_info.copy(),
            "is_running": self.is_playit_running(),
            "has_url": bool(self.tunnel_info.get('url')),
            "status": self.tunnel_info.get('status', 'unknown')
        }
    
    def restart_playit(self):
        """Reinicia o Playit"""
        try:
            # Parar se estiver rodando
            if self.is_playit_running():
                stop_result = self.stop_playit()
                if not stop_result["success"]:
                    return stop_result
                
                # Aguardar um pouco
                time.sleep(2)
            
            # Iniciar novamente
            return self.start_playit()
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao reiniciar Playit: {str(e)}"}
    
    def get_network_info(self):
        """Obtém informações de rede do servidor"""
        try:
            info = {
                "playit_installed": self.detect_playit_binary(),
                "playit_running": self.is_playit_running(),
                "tunnel_active": bool(self.tunnel_info.get('url')),
                "server_ports": []
            }
            
            # Tentar ler porta do server.properties
            if self.server_path:
                properties_file = self.server_path / "server.properties"
                if properties_file.exists():
                    try:
                        with open(properties_file, 'r', encoding='utf-8') as f:
                            for line in f:
                                if line.startswith('server-port='):
                                    port = line.split('=')[1].strip()
                                    info["server_ports"].append({
                                        "name": "Minecraft Bedrock",
                                        "port": port,
                                        "protocol": "UDP"
                                    })
                                elif line.startswith('server-portv6='):
                                    port = line.split('=')[1].strip()
                                    info["server_ports"].append({
                                        "name": "Minecraft Bedrock IPv6",
                                        "port": port,
                                        "protocol": "UDP"
                                    })
                    except:
                        pass
            
            return {"success": True, "info": info}
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao obter informações de rede: {str(e)}"}