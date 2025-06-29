import os
import subprocess
import threading
import time
import json
import socket
from pathlib import Path

class ServerManager:
    def __init__(self, server_path):
        self.server_path = server_path
        self.server_process = None
        self.playit_process = None
        self.is_running = False
        self.playit_running = False
        self.server_info = {
            'online_players': [],
            'max_players': 0,
            'server_ip': 'localhost',
            'server_port': 19132,
            'playit_url': None
        }
        
        # Detectar executável do servidor
        self.server_executable = self._find_server_executable()
        
    def _find_server_executable(self):
        """Encontrar executável do servidor"""
        possible_names = [
            "bedrock_server.exe",
            "bedrock_server",
            "BedrockServerHow.exe"
        ]
        
        for name in possible_names:
            exe_path = os.path.join(self.server_path, name)
            if os.path.exists(exe_path):
                return exe_path
        
        return None
    
    def start_server(self, callback=None):
        """Iniciar servidor Minecraft"""
        if self.is_running:
            raise Exception("Servidor já está rodando")
        
        if not self.server_executable:
            raise Exception("Executável do servidor não encontrado")
        
        try:
            # Mudar para diretório do servidor
            original_cwd = os.getcwd()
            os.chdir(self.server_path)
            
            # Iniciar processo do servidor
            self.server_process = subprocess.Popen(
                [self.server_executable],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                stdin=subprocess.PIPE,
                text=True,
                cwd=self.server_path
            )
            
            self.is_running = True
            
            # Thread para monitorar saída do servidor
            monitor_thread = threading.Thread(
                target=self._monitor_server_output,
                args=(callback,),
                daemon=True
            )
            monitor_thread.start()
            
            # Restaurar diretório original
            os.chdir(original_cwd)
            
            # Carregar informações do servidor
            self._load_server_info()
            
        except Exception as e:
            self.is_running = False
            raise Exception(f"Erro ao iniciar servidor: {str(e)}")
    
    def stop_server(self):
        """Parar servidor Minecraft"""
        if not self.is_running or not self.server_process:
            raise Exception("Servidor não está rodando")
        
        try:
            # Enviar comando stop
            self.server_process.stdin.write("stop\n")
            self.server_process.stdin.flush()
            
            # Aguardar finalização
            self.server_process.wait(timeout=30)
            
        except subprocess.TimeoutExpired:
            # Forçar finalização se não parar
            self.server_process.terminate()
            self.server_process.wait(timeout=10)
        
        except:
            # Último recurso - kill
            if self.server_process:
                self.server_process.kill()
        
        finally:
            self.server_process = None
            self.is_running = False
            self.server_info['online_players'] = []
    
    def start_playit(self, callback=None):
        """Iniciar Playit.gg"""
        if self.playit_running:
            raise Exception("Playit já está rodando")
        
        try:
            # Verificar se playit está instalado
            playit_cmd = self._find_playit_executable()
            
            if not playit_cmd:
                raise Exception("Playit não encontrado. Instale em https://playit.gg")
            
            # Iniciar playit
            self.playit_process = subprocess.Popen(
                [playit_cmd],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            self.playit_running = True
            
            # Thread para monitorar playit
            monitor_thread = threading.Thread(
                target=self._monitor_playit_output,
                args=(callback,),
                daemon=True
            )
            monitor_thread.start()
            
        except Exception as e:
            self.playit_running = False
            raise Exception(f"Erro ao iniciar Playit: {str(e)}")
    
    def stop_playit(self):
        """Parar Playit.gg"""
        if not self.playit_running or not self.playit_process:
            raise Exception("Playit não está rodando")
        
        try:
            self.playit_process.terminate()
            self.playit_process.wait(timeout=10)
        except:
            self.playit_process.kill()
        finally:
            self.playit_process = None
            self.playit_running = False
            self.server_info['playit_url'] = None
    
    def _find_playit_executable(self):
        """Encontrar executável do playit"""
        # CORREÇÃO: Verificar primeiro na pasta playit dentro do servidor
        playit_server_path = os.path.join(self.server_path, "playit", "playit.exe")
        if os.path.exists(playit_server_path):
            return playit_server_path
        
        # Verificar outros locais na pasta do servidor
        playit_direct_path = os.path.join(self.server_path, "playit.exe")
        if os.path.exists(playit_direct_path):
            return playit_direct_path
        
        # Verificar se está no PATH
        try:
            subprocess.run(["playit", "--version"], 
                         capture_output=True, check=True)
            return "playit"
        except:
            pass
        
        # Verificar locais comuns do sistema
        possible_paths = [
            os.path.expanduser("~/.playit/playit"),
            os.path.expanduser("~/AppData/Local/playit/playit.exe"),
            "./playit.exe",
            "./playit"
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                return path
        
        return None
    
    def _monitor_server_output(self, callback=None):
        """Monitorar saída do servidor"""
        if not self.server_process:
            return
        
        try:
            for line in iter(self.server_process.stdout.readline, ''):
                if not line:
                    break
                
                # Processar linha de log
                self._process_server_log(line.strip())
                
                # Callback para atualizar UI
                if callback:
                    callback("server", line.strip())
                    
        except Exception as e:
            print(f"Erro no monitor do servidor: {e}")
        finally:
            self.is_running = False
    
    def _monitor_playit_output(self, callback=None):
        """Monitorar saída do playit"""
        if not self.playit_process:
            return
        
        try:
            for line in iter(self.playit_process.stdout.readline, ''):
                if not line:
                    break
                
                # Processar linha de log do playit
                self._process_playit_log(line.strip())
                
                # Callback para atualizar UI
                if callback:
                    callback("playit", line.strip())
                    
        except Exception as e:
            print(f"Erro no monitor do playit: {e}")
        finally:
            self.playit_running = False
    
    def _process_server_log(self, line):
        """Processar linha de log do servidor"""
        try:
            # Detectar jogadores conectando/desconectando
            if "Player connected:" in line:
                player_name = line.split("Player connected:")[1].strip().split(",")[0]
                if player_name not in self.server_info['online_players']:
                    self.server_info['online_players'].append(player_name)
            
            elif "Player disconnected:" in line:
                player_name = line.split("Player disconnected:")[1].strip().split(",")[0]
                if player_name in self.server_info['online_players']:
                    self.server_info['online_players'].remove(player_name)
            
            # Detectar início do servidor
            elif "Server started" in line or "IPv4 supported" in line:
                self._load_server_info()
                
        except Exception as e:
            print(f"Erro ao processar log: {e}")
    
    def _process_playit_log(self, line):
        """Processar linha de log do playit"""
        try:
            # Extrair URL do playit
            if "https://" in line and "playit.gg" in line:
                # Extrair URL
                parts = line.split()
                for part in parts:
                    if "https://" in part and "playit.gg" in part:
                        self.server_info['playit_url'] = part.strip()
                        break
                        
        except Exception as e:
            print(f"Erro ao processar log do playit: {e}")
    
    def _load_server_info(self):
        """Carregar informações do servidor"""
        try:
            from src.core.server_properties import ServerPropertiesManager
            props_manager = ServerPropertiesManager(self.server_path)
            
            # Carregar propriedades
            self.server_info['server_port'] = int(props_manager.get_property('server-port') or 19132)
            self.server_info['max_players'] = int(props_manager.get_property('max-players') or 10)
            
            # Detectar IP local
            self.server_info['server_ip'] = self._get_local_ip()
            
        except Exception as e:
            print(f"Erro ao carregar info do servidor: {e}")
    
    def _get_local_ip(self):
        """Obter IP local"""
        try:
            # Conectar a um endereço externo para descobrir IP local
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                return s.getsockname()[0]
        except:
            return "localhost"
    
    def get_server_status(self):
        """Obter status atual do servidor"""
        return {
            'server_running': self.is_running,
            'playit_running': self.playit_running,
            'online_players': self.server_info['online_players'].copy(),
            'max_players': self.server_info['max_players'],
            'server_ip': self.server_info['server_ip'],
            'server_port': self.server_info['server_port'],
            'playit_url': self.server_info['playit_url']
        }
    
    def send_command(self, command):
        """Enviar comando para o servidor"""
        if not self.is_running or not self.server_process:
            raise Exception("Servidor não está rodando")
        
        try:
            self.server_process.stdin.write(f"{command}\n")
            self.server_process.stdin.flush()
        except Exception as e:
            raise Exception(f"Erro ao enviar comando: {str(e)}")