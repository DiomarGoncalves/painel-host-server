#!/usr/bin/env python3
"""
Painel Web Remoto com Console - Minecraft Bedrock Server
Acesso remoto seguro via Playit.gg na porta 8080
"""

import os
import sys
import json
import subprocess
import threading
import time
import platform
import queue
import secrets
import hashlib
from pathlib import Path
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, Response
from werkzeug.security import generate_password_hash, check_password_hash
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RemotePanel:
    def __init__(self, server_path=None):
        self.app = Flask(__name__, template_folder='../web/remote', static_folder='../web/remote/static')
        self.server_path = Path(server_path) if server_path else None
        self.config_path = Path('config')
        self.config_path.mkdir(exist_ok=True)
        self.login_config_file = self.config_path / 'login.json'
        
        # Configurar Flask
        self.app.secret_key = self._get_or_create_secret_key()
        
        # Fila para comandos e saídas
        self.command_queue = queue.Queue()
        self.output_queue = queue.Queue()
        self.active_sessions = set()
        
        # Configurar rotas
        self._setup_routes()
        
        # Carregar configurações de login
        self._load_login_config()
    
    def _get_or_create_secret_key(self):
        """Gera ou carrega chave secreta para sessões"""
        secret_file = self.config_path / 'secret.key'
        
        if secret_file.exists():
            with open(secret_file, 'r') as f:
                return f.read().strip()
        else:
            secret_key = secrets.token_hex(32)
            with open(secret_file, 'w') as f:
                f.write(secret_key)
            return secret_key
    
    def _load_login_config(self):
        """Carrega configurações de login"""
        if self.login_config_file.exists():
            try:
                with open(self.login_config_file, 'r', encoding='utf-8') as f:
                    self.login_config = json.load(f)
            except:
                self._create_default_login_config()
        else:
            self._create_default_login_config()
    
    def _create_default_login_config(self):
        """Cria configuração padrão de login"""
        self.login_config = {
            "usuario": "admin",
            "senha_hash": generate_password_hash("123456"),
            "created_at": time.time()
        }
        self._save_login_config()
        logger.info("Configuração de login padrão criada: admin/123456")
    
    def _save_login_config(self):
        """Salva configurações de login"""
        with open(self.login_config_file, 'w', encoding='utf-8') as f:
            json.dump(self.login_config, f, indent=2, ensure_ascii=False)
    
    def _setup_routes(self):
        """Configura rotas da aplicação"""
        
        @self.app.route('/')
        def index():
            if 'logged_in' not in session:
                return redirect(url_for('login'))
            return render_template('console.html')
        
        @self.app.route('/login', methods=['GET', 'POST'])
        def login():
            if request.method == 'POST':
                data = request.get_json()
                username = data.get('username', '').strip()
                password = data.get('password', '')
                
                if (username == self.login_config['usuario'] and 
                    check_password_hash(self.login_config['senha_hash'], password)):
                    
                    session['logged_in'] = True
                    session['username'] = username
                    session['login_time'] = time.time()
                    
                    # Adicionar à lista de sessões ativas
                    session_id = session.get('session_id', secrets.token_hex(16))
                    session['session_id'] = session_id
                    self.active_sessions.add(session_id)
                    
                    logger.info(f"Login bem-sucedido: {username}")
                    return jsonify({"success": True, "redirect": "/"})
                else:
                    logger.warning(f"Tentativa de login falhada: {username}")
                    return jsonify({"success": False, "error": "Usuário ou senha incorretos"})
            
            return render_template('login.html')
        
        @self.app.route('/logout')
        def logout():
            session_id = session.get('session_id')
            if session_id:
                self.active_sessions.discard(session_id)
            
            session.clear()
            return redirect(url_for('login'))
        
        @self.app.route('/console')
        def console():
            if 'logged_in' not in session:
                return redirect(url_for('login'))
            return render_template('console.html')
        
        @self.app.route('/api/execute', methods=['POST'])
        def execute_command():
            if 'logged_in' not in session:
                return jsonify({"error": "Não autenticado"}), 401
            
            data = request.get_json()
            command = data.get('command', '').strip()
            
            if not command:
                return jsonify({"error": "Comando vazio"})
            
            # Verificar comandos perigosos
            dangerous_commands = [
                'rm -rf /',
                'del /f /s /q C:\\',
                'format',
                'fdisk',
                'mkfs',
                'dd if=/dev/zero',
                'shutdown -h now',
                'reboot',
                'halt'
            ]
            
            command_lower = command.lower()
            for dangerous in dangerous_commands:
                if dangerous in command_lower:
                    return jsonify({
                        "error": f"Comando perigoso bloqueado: {command}",
                        "blocked": True
                    })
            
            try:
                result = self._execute_command(command)
                
                # Log da execução
                logger.info(f"Comando executado por {session['username']}: {command}")
                
                return jsonify({
                    "success": True,
                    "command": command,
                    "output": result["output"],
                    "error": result["error"],
                    "return_code": result["return_code"]
                })
                
            except Exception as e:
                logger.error(f"Erro ao executar comando: {e}")
                return jsonify({"error": f"Erro ao executar comando: {str(e)}"})
        
        @self.app.route('/api/server-info')
        def server_info():
            if 'logged_in' not in session:
                return jsonify({"error": "Não autenticado"}), 401
            
            info = {
                "server_path": str(self.server_path) if self.server_path else "Não definido",
                "platform": platform.system(),
                "python_version": platform.python_version(),
                "current_user": session.get('username'),
                "login_time": session.get('login_time'),
                "active_sessions": len(self.active_sessions)
            }
            
            # Informações do servidor Bedrock se disponível
            if self.server_path and self.server_path.exists():
                bedrock_exe = self.server_path / "bedrock_server.exe"
                bedrock_bin = self.server_path / "bedrock_server"
                
                info["bedrock_server"] = {
                    "found": bedrock_exe.exists() or bedrock_bin.exists(),
                    "executable": "bedrock_server.exe" if bedrock_exe.exists() else "bedrock_server" if bedrock_bin.exists() else None
                }
            
            return jsonify(info)
        
        @self.app.route('/api/change-password', methods=['POST'])
        def change_password():
            if 'logged_in' not in session:
                return jsonify({"error": "Não autenticado"}), 401
            
            data = request.get_json()
            current_password = data.get('current_password', '')
            new_password = data.get('new_password', '')
            
            if not check_password_hash(self.login_config['senha_hash'], current_password):
                return jsonify({"success": False, "error": "Senha atual incorreta"})
            
            if len(new_password) < 4:
                return jsonify({"success": False, "error": "Nova senha deve ter pelo menos 4 caracteres"})
            
            # Atualizar senha
            self.login_config['senha_hash'] = generate_password_hash(new_password)
            self.login_config['updated_at'] = time.time()
            self._save_login_config()
            
            logger.info(f"Senha alterada por {session['username']}")
            return jsonify({"success": True, "message": "Senha alterada com sucesso"})
        
        @self.app.route('/api/system-stats')
        def system_stats():
            if 'logged_in' not in session:
                return jsonify({"error": "Não autenticado"}), 401
            
            try:
                import psutil
                
                stats = {
                    "cpu_percent": psutil.cpu_percent(interval=1),
                    "memory": {
                        "total": psutil.virtual_memory().total,
                        "available": psutil.virtual_memory().available,
                        "percent": psutil.virtual_memory().percent
                    },
                    "disk": {
                        "total": psutil.disk_usage('/').total if platform.system() != 'Windows' else psutil.disk_usage('C:\\').total,
                        "free": psutil.disk_usage('/').free if platform.system() != 'Windows' else psutil.disk_usage('C:\\').free,
                        "percent": psutil.disk_usage('/').percent if platform.system() != 'Windows' else psutil.disk_usage('C:\\').percent
                    }
                }
                
                return jsonify(stats)
            except ImportError:
                return jsonify({"error": "psutil não disponível"})
            except Exception as e:
                return jsonify({"error": str(e)})
    
    def _execute_command(self, command):
        """Executa comando no sistema"""
        try:
            # Determinar shell baseado no sistema
            if platform.system() == 'Windows':
                shell_cmd = ['cmd', '/c', command]
            else:
                shell_cmd = ['bash', '-c', command]
            
            # Executar comando
            process = subprocess.Popen(
                shell_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding='utf-8',
                errors='replace',
                cwd=str(self.server_path) if self.server_path else None
            )
            
            stdout, stderr = process.communicate(timeout=30)
            
            return {
                "output": stdout,
                "error": stderr,
                "return_code": process.returncode
            }
            
        except subprocess.TimeoutExpired:
            process.kill()
            return {
                "output": "",
                "error": "Comando excedeu tempo limite de 30 segundos",
                "return_code": -1
            }
        except Exception as e:
            return {
                "output": "",
                "error": str(e),
                "return_code": -1
            }
    
    def run(self, host='0.0.0.0', port=8080, debug=False):
        """Inicia o servidor Flask"""
        logger.info(f"Iniciando painel remoto em {host}:{port}")
        logger.info(f"Login padrão: {self.login_config['usuario']}/123456")
        
        self.app.run(
            host=host,
            port=port,
            debug=debug,
            threaded=True
        )

def main():
    """Função principal"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Painel Web Remoto Minecraft Bedrock')
    parser.add_argument('--server-path', help='Caminho para a pasta do servidor Bedrock')
    parser.add_argument('--port', type=int, default=8080, help='Porta para o servidor web (padrão: 8080)')
    parser.add_argument('--host', default='0.0.0.0', help='Host para bind (padrão: 0.0.0.0)')
    parser.add_argument('--debug', action='store_true', help='Modo debug')
    
    args = parser.parse_args()
    
    # Criar instância do painel
    panel = RemotePanel(server_path=args.server_path)
    
    try:
        panel.run(host=args.host, port=args.port, debug=args.debug)
    except KeyboardInterrupt:
        logger.info("Painel remoto encerrado pelo usuário")
    except Exception as e:
        logger.error(f"Erro ao iniciar painel remoto: {e}")

if __name__ == "__main__":
    main()