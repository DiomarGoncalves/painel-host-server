import os
import configparser
from pathlib import Path

class ServerPropertiesEditor:
    def __init__(self):
        self.server_path = None
        self.properties_file = None
        
        # Configurações padrão do Bedrock Server
        self.default_config = {
            'server-name': 'Dedicated Server',
            'gamemode': 'survival',
            'force-gamemode': 'false',
            'difficulty': 'easy',
            'allow-cheats': 'false',
            'max-players': '10',
            'online-mode': 'true',
            'allow-list': 'false',
            'server-port': '19132',
            'server-portv6': '19133',
            'view-distance': '32',
            'tick-distance': '4',
            'player-idle-timeout': '30',
            'max-threads': '8',
            'level-name': 'Bedrock level',
            'level-seed': '',
            'default-player-permission-level': 'member',
            'texturepack-required': 'false',
            'content-log-file-enabled': 'false',
            'compression-threshold': '1',
            'compression-algorithm': 'zlib',
            'server-authoritative-movement': 'server-auth',
            'player-movement-score-threshold': '20',
            'player-movement-action-direction-threshold': '0.85',
            'player-movement-distance-threshold': '0.3',
            'player-movement-duration-threshold-in-ms': '500',
            'correct-player-movement': 'false',
            'server-authoritative-block-breaking': 'false',
            'chat-restriction': 'None',
            'disable-player-interaction': 'false',
            'client-side-chunk-generation-enabled': 'true',
            'block-network-ids-are-hashes': 'true',
            'disable-persona': 'false',
            'disable-custom-skins': 'false',
            'server-build-radius-ratio': '0.333333'
        }
    
    def set_server_path(self, path):
        """Define o caminho do servidor"""
        self.server_path = Path(path)
        self.properties_file = self.server_path / "server.properties"
    
    def get_config(self):
        """Lê as configurações do server.properties"""
        if not self.properties_file or not self.properties_file.exists():
            return {"error": "Arquivo server.properties não encontrado. Selecione a pasta do servidor."}
        
        config = {}
        
        try:
            with open(self.properties_file, 'r', encoding='utf-8') as file:
                for line in file:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        if '=' in line:
                            key, value = line.split('=', 1)
                            config[key.strip()] = value.strip()
            
            # Adicionar configurações padrão se não existirem
            for key, default_value in self.default_config.items():
                if key not in config:
                    config[key] = default_value
            
            return {"success": True, "config": config}
            
        except Exception as e:
            return {"error": f"Erro ao ler server.properties: {str(e)}"}
    
    def save_config(self, config):
        """Salva as configurações no server.properties"""
        if not self.properties_file:
            raise Exception("Caminho do servidor não definido")
        
        try:
            # Criar backup
            if self.properties_file.exists():
                backup_file = self.properties_file.with_suffix('.properties.backup')
                with open(self.properties_file, 'r', encoding='utf-8') as src:
                    with open(backup_file, 'w', encoding='utf-8') as dst:
                        dst.write(src.read())
            
            # Salvar nova configuração
            with open(self.properties_file, 'w', encoding='utf-8') as file:
                file.write("# Minecraft Bedrock Dedicated Server Configuration\n")
                file.write("# Generated by Minecraft Bedrock Panel\n\n")
                
                for key, value in config.items():
                    file.write(f"{key}={value}\n")
            
            return True
            
        except Exception as e:
            raise Exception(f"Erro ao salvar server.properties: {str(e)}")
    
    def update_level_name(self, world_name):
        """Atualiza apenas o level-name no server.properties"""
        try:
            current_config = self.get_config()
            if "config" in current_config:
                current_config["config"]["level-name"] = world_name
                self.save_config(current_config["config"])
                return True
        except Exception as e:
            print(f"Erro ao atualizar level-name: {e}")
            return False