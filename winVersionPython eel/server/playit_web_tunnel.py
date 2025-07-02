#!/usr/bin/env python3
"""
Gerenciador de Túnel Web Playit.gg
Cria túnel para a porta 8080 (painel web)
"""

import os
import subprocess
import platform
import time
import threading
import re
from pathlib import Path

class PlayitWebTunnel:
    def __init__(self, server_path=None):
        self.server_path = Path(server_path) if server_path else None
        self.playit_process = None
        self.playit_binary = None
        self.web_tunnel_url = None
        self.logs = []
        self.max_logs = 500
        
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
    
    def start_web_tunnel(self, local_port=8080):
        """Inicia túnel para a porta web"""
        try:
            if not self.detect_playit_binary():
                return {
                    "success": False, 
                    "error": "Playit não encontrado. Baixe o binário e coloque na pasta do servidor."
                }
            
            if self.is_tunnel_running():
                return {"success": False, "error": "Túnel já está rodando"}
            
            # Limpar logs anteriores
            self.logs = []
            self.web_tunnel_url = None
            
            print(f"🌐 Iniciando túnel web Playit para porta {local_port}")
            
            # Comando para criar túnel TCP para porta específica
            cmd = [
                str(self.playit_binary),
                "--port", str(local_port),
                "--type", "tcp"
            ]
            
            self.playit_process = subprocess.Popen(
                cmd,
                cwd=str(self.server_path),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            # Iniciar thread para capturar logs
            log_thread = threading.Thread(target=self._capture_logs, daemon=True)
            log_thread.start()
            
            return {
                "success": True,
                "message": f"Túnel web iniciado para porta {local_port}! Aguarde a configuração...",
                "pid": self.playit_process.pid
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao iniciar túnel web: {str(e)}"}
    
    def stop_web_tunnel(self):
        """Para o túnel web"""
        try:
            if not self.is_tunnel_running():
                return {"success": False, "error": "Túnel não está rodando"}
            
            if self.playit_process:
                try:
                    self.playit_process.terminate()
                    try:
                        self.playit_process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        self.playit_process.kill()
                        self.playit_process.wait(timeout=2)
                except:
                    pass
                
                self.playit_process = None
                self.web_tunnel_url = None
            
            return {"success": True, "message": "Túnel web parado com sucesso!"}
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao parar túnel web: {str(e)}"}
    
    def is_tunnel_running(self):
        """Verifica se o túnel está rodando"""
        return self.playit_process and self.playit_process.poll() is None
    
    def get_tunnel_status(self):
        """Retorna status do túnel web"""
        return {
            "running": self.is_tunnel_running(),
            "url": self.web_tunnel_url,
            "pid": self.playit_process.pid if self.playit_process and self.playit_process.poll() is None else None,
            "logs": self.logs.copy()
        }
    
    def _capture_logs(self):
        """Captura logs do Playit em tempo real"""
        try:
            while self.playit_process and self.playit_process.poll() is None:
                line = self.playit_process.stdout.readline()
                if line:
                    line = line.strip()
                    self._add_log(line)
                    self._parse_web_tunnel_url(line)
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
    
    def _parse_web_tunnel_url(self, log_line):
        """Extrai URL do túnel web dos logs"""
        try:
            # Padrões para detectar URL do túnel web
            patterns = [
                r'tunnel.*?([a-zA-Z0-9-]+\.playit\.gg:\d+)',
                r'address.*?([a-zA-Z0-9-]+\.playit\.gg:\d+)',
                r'connect.*?([a-zA-Z0-9-]+\.playit\.gg:\d+)',
                r'([a-zA-Z0-9-]+\.playit\.gg:\d+)'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, log_line, re.IGNORECASE)
                if match:
                    self.web_tunnel_url = match.group(1)
                    print(f"🌐 Túnel web disponível em: {self.web_tunnel_url}")
                    break
                    
        except Exception as e:
            print(f"Erro ao analisar log do túnel web: {e}")

def main():
    """Função principal para teste"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Túnel Web Playit.gg')
    parser.add_argument('--server-path', required=True, help='Caminho para a pasta do servidor Bedrock')
    parser.add_argument('--port', type=int, default=8080, help='Porta local para túnel (padrão: 8080)')
    
    args = parser.parse_args()
    
    tunnel = PlayitWebTunnel(server_path=args.server_path)
    
    try:
        result = tunnel.start_web_tunnel(local_port=args.port)
        
        if result["success"]:
            print(f"✅ {result['message']}")
            
            # Aguardar URL do túnel
            print("⏳ Aguardando URL do túnel...")
            
            timeout = 60  # 60 segundos timeout
            start_time = time.time()
            
            while time.time() - start_time < timeout:
                status = tunnel.get_tunnel_status()
                if status["url"]:
                    print(f"🌐 Túnel disponível em: http://{status['url']}")
                    break
                time.sleep(2)
            
            if not tunnel.web_tunnel_url:
                print("⚠️ Timeout aguardando URL do túnel")
            
            # Manter rodando
            print("🔄 Túnel rodando... Pressione Ctrl+C para parar")
            
            try:
                while tunnel.is_tunnel_running():
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\n🛑 Parando túnel...")
                tunnel.stop_web_tunnel()
                
        else:
            print(f"❌ Erro: {result['error']}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    main()