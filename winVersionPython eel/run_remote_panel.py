#!/usr/bin/env python3
"""
Script para executar o painel remoto
"""

import sys
import os
import argparse
import threading
import time
from pathlib import Path

# Adicionar pasta server ao path
sys.path.insert(0, str(Path(__file__).parent / "server"))

from remote_panel import RemotePanel
from playit_web_tunnel import PlayitWebTunnel

def main():
    parser = argparse.ArgumentParser(description='Painel Web Remoto Minecraft Bedrock')
    parser.add_argument('--server-path', help='Caminho para a pasta do servidor Bedrock')
    parser.add_argument('--port', type=int, default=8081, help='Porta para o servidor web (padrão: 8080)')
    parser.add_argument('--host', default='0.0.0.0', help='Host para bind (padrão: 0.0.0.0)')
    parser.add_argument('--debug', action='store_true', help='Modo debug')
    parser.add_argument('--auto-tunnel', action='store_true', help='Iniciar túnel Playit automaticamente')
    
    args = parser.parse_args()
    
    print("🎮 Minecraft Bedrock Panel - Acesso Remoto")
    print("=" * 50)
    
    # Verificar se Flask está instalado
    try:
        import flask
        print("✅ Flask encontrado")
    except ImportError:
        print("❌ Flask não encontrado. Instalando...")
        import subprocess
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'flask', 'werkzeug'])
        print("✅ Flask instalado")
    
    # Criar instância do painel
    panel = RemotePanel(server_path=args.server_path)
    
    # Configurar túnel se solicitado
    tunnel = None
    if args.auto_tunnel and args.server_path:
        tunnel = PlayitWebTunnel(server_path=args.server_path)
        
        print("🌐 Iniciando túnel Playit.gg...")
        tunnel_result = tunnel.start_web_tunnel(local_port=args.port)
        
        if tunnel_result["success"]:
            print(f"✅ {tunnel_result['message']}")
            
            # Thread para monitorar túnel
            def monitor_tunnel():
                timeout = 60
                start_time = time.time()
                
                while time.time() - start_time < timeout:
                    status = tunnel.get_tunnel_status()
                    if status["url"]:
                        print(f"🌐 Painel disponível remotamente em: http://{status['url']}")
                        break
                    time.sleep(2)
                
                if not tunnel.web_tunnel_url:
                    print("⚠️ Timeout aguardando URL do túnel")
            
            threading.Thread(target=monitor_tunnel, daemon=True).start()
        else:
            print(f"❌ Erro no túnel: {tunnel_result['error']}")
    
    print(f"🖥️ Iniciando servidor local em {args.host}:{args.port}")
    print(f"🔐 Login padrão: admin / 123456")
    print("📝 Altere a senha após o primeiro login!")
    print("=" * 50)
    
    try:
        panel.run(host=args.host, port=args.port, debug=args.debug)
    except KeyboardInterrupt:
        print("\n🛑 Painel encerrado pelo usuário")
        
        if tunnel and tunnel.is_tunnel_running():
            print("🛑 Parando túnel...")
            tunnel.stop_web_tunnel()
    except Exception as e:
        print(f"❌ Erro ao iniciar painel: {e}")
        
        if tunnel and tunnel.is_tunnel_running():
            tunnel.stop_web_tunnel()

if __name__ == "__main__":
    main()