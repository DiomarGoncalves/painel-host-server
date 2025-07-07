import os
import json
import struct
from pathlib import Path
import zipfile
import shutil

class WorldConfigManager:
    def __init__(self, server_path):
        self.server_path = Path(server_path)
        self.worlds_path = self.server_path / "worlds"
        self.behavior_packs_path = self.server_path / "development_behavior_packs"
        self.resource_packs_path = self.server_path / "development_resource_packs"
    
    def get_current_world_path(self):
        """Obter caminho do mundo atual"""
        from editor_server import ServerPropertiesEditor
        
        editor = ServerPropertiesEditor()
        editor.set_server_path(self.server_path)
        config = editor.get_config()
        
        if config.get("success"):
            level_name = config["config"].get("level-name", "Bedrock level")
        else:
            level_name = "Bedrock level"
        
        return self.worlds_path / level_name
    
    def get_level_dat_path(self):
        """Obter caminho do arquivo level.dat"""
        world_path = self.get_current_world_path()
        return world_path / "level.dat"
    
    def read_level_dat_simple(self):
        """Lê level.dat de forma simplificada (apenas para verificação)"""
        level_dat_path = self.get_level_dat_path()
        
        if not level_dat_path.exists():
            return None
        
        try:
            # Apenas verificar se o arquivo existe e é legível
            with open(level_dat_path, 'rb') as f:
                # Ler primeiros bytes para verificar formato
                header = f.read(8)
                if len(header) >= 4:
                    return {"exists": True, "size": level_dat_path.stat().st_size}
        except Exception as e:
            print(f"Erro ao ler level.dat: {e}")
        
        return None
    
    def get_default_settings(self):
        """Obter configurações padrão do mundo"""
        return {
            # Configurações básicas
            "RandomSeed": "",
            "IsHardcore": False,
            "Difficulty": 1,
            "educationFeaturesEnabled": False,
            
            # Regras de jogo - Comandos
            "commandblockoutput": True,
            "commandblocksenabled": True,
            "functioncommandlimit": 10000,
            "maxcommandchainlength": 65535,
            "sendcommandfeedback": True,
            
            # Regras de jogo - Ciclos
            "dodaylightcycle": True,
            "doweathercycle": True,
            "randomtickspeed": 1,
            "doinsomnia": True,
            
            # Regras de jogo - Drops e Danos
            "doentitydrops": True,
            "dotiledrops": True,
            "domobloot": True,
            "drowningdamage": True,
            "falldamage": True,
            "firedamage": True,
            "freezedamage": True,
            
            # Regras de jogo - Gameplay
            "keepinventory": False,
            "doimmediaterespawn": False,
            "naturalregeneration": True,
            "mobgriefing": True,
            "pvp": True,
            "playerssleepingpercentage": 100,
            "spawnradius": 10,
            
            # Regras de jogo - Explosões
            "dofiretick": True,
            "tntexplodes": True,
            "tntexplosiondropdecay": False,
            "respawnblocksexplode": True,
            
            # Interface
            "showcoordinates": False,
            "showdaysplayed": False,
            "showdeathmessages": True,
            "showtags": True,
            "recipesunlock": True,
            
            # Experimentos
            "data_driven_biomes": False,
            "experimental_creator_cameras": False,
            "gametest": False,
            "jigsaw_structures": False,
            "upcoming_creator_features": False,
            "villager_trades_rebalance": False,
            
            # Spawning
            "domobspawning": True
        }
    
    def load_world_settings(self):
        """Carregar configurações do mundo"""
        world_path = self.get_current_world_path()
        
        # Carregar do arquivo auxiliar JSON
        settings_file = world_path / "world_settings.json"
        if settings_file.exists():
            try:
                with open(settings_file, 'r', encoding='utf-8') as f:
                    saved_settings = json.load(f)
                
                # Mesclar com configurações padrão
                default_settings = self.get_default_settings()
                default_settings.update(saved_settings)
                return default_settings
            except Exception as e:
                print(f"Erro ao carregar configurações salvas: {e}")
        
        # Retornar configurações padrão
        return self.get_default_settings()
    
    def save_world_settings(self, settings):
        """Salvar configurações do mundo"""
        world_path = self.get_current_world_path()
        
        if not world_path.exists():
            raise FileNotFoundError("Mundo atual não encontrado")
        
        # Salvar em arquivo auxiliar JSON
        settings_file = world_path / "world_settings.json"
        try:
            with open(settings_file, 'w', encoding='utf-8') as f:
                json.dump(settings, f, indent=2, ensure_ascii=False)
        except Exception as e:
            raise Exception(f"Erro ao salvar configurações: {str(e)}")
        
        # Tentar aplicar game rules via comandos do servidor (se estiver rodando)
        try:
            self.apply_game_rules_via_commands(settings)
        except Exception as e:
            print(f"Aviso: Não foi possível aplicar game rules via comandos: {e}")
        
        return {"success": True, "message": "Configurações do mundo salvas com sucesso!"}
    
    def apply_game_rules_via_commands(self, settings):
        """Aplica game rules via comandos do servidor (se estiver rodando)"""
        # Esta função pode ser expandida para enviar comandos ao servidor
        # Por enquanto, apenas salva as configurações no arquivo JSON
        pass
    
    def get_world_addons(self):
        """Obter addons aplicados ao mundo atual"""
        world_path = self.get_current_world_path()
        
        addons = {
            "behavior_packs": [],
            "resource_packs": []
        }
        
        # Ler behavior packs
        bp_file = world_path / "world_behavior_packs.json"
        if bp_file.exists():
            try:
                with open(bp_file, 'r', encoding='utf-8') as f:
                    bp_data = json.load(f)
                
                for pack in bp_data:
                    pack_info = self.get_addon_info_by_uuid(pack["pack_id"], "behavior")
                    if pack_info:
                        # Garante que não mistura com resource mesmo nome
                        pack_info["type"] = "behavior"
                        addons["behavior_packs"].append(pack_info)
            except Exception as e:
                print(f"Erro ao ler behavior packs: {e}")
        
        # Ler resource packs
        rp_file = world_path / "world_resource_packs.json"
        if rp_file.exists():
            try:
                with open(rp_file, 'r', encoding='utf-8') as f:
                    rp_data = json.load(f)
                
                for pack in rp_data:
                    pack_info = self.get_addon_info_by_uuid(pack["pack_id"], "resource")
                    if pack_info:
                        pack_info["type"] = "resource"
                        addons["resource_packs"].append(pack_info)
            except Exception as e:
                print(f"Erro ao ler resource packs: {e}")
        
        return addons

    def get_available_addons(self):
        """Obter addons disponíveis na biblioteca"""
        addons = {
            "behavior_packs": [],
            "resource_packs": []
        }
        
        # Listar behavior packs
        if self.behavior_packs_path.exists():
            for addon_dir in self.behavior_packs_path.iterdir():
                if addon_dir.is_dir():
                    manifest_path = addon_dir / "manifest.json"
                    if manifest_path.exists():
                        addon_info = self.read_addon_manifest(manifest_path)
                        if addon_info:
                            addon_info["folder"] = addon_dir.name
                            addon_info["type"] = "behavior"
                            addons["behavior_packs"].append(addon_info)
        
        # Listar resource packs
        if self.resource_packs_path.exists():
            for addon_dir in self.resource_packs_path.iterdir():
                if addon_dir.is_dir():
                    manifest_path = addon_dir / "manifest.json"
                    if manifest_path.exists():
                        addon_info = self.read_addon_manifest(manifest_path)
                        if addon_info:
                            addon_info["folder"] = addon_dir.name
                            addon_info["type"] = "resource"
                            addons["resource_packs"].append(addon_info)
        
        return addons

    def read_addon_manifest(self, manifest_path):
        """Ler manifest.json de um addon"""
        try:
            # Usar o método melhorado da classe AddonManager
            from addons import AddonManager
            addon_manager = AddonManager()
            result = addon_manager.read_manifest(manifest_path)
            
            if result["success"]:
                return {
                    "uuid": result["uuid"],
                    "name": result["name"],
                    "description": result["description"],
                    "version": result["version"]
                }
        except Exception as e:
            print(f"Erro ao ler manifest {manifest_path}: {e}")
        
        return None
    
    def get_addon_info_by_uuid(self, uuid, addon_type):
        """Obter informações de addon por UUID e tipo"""
        if addon_type == "behavior":
            search_path = self.behavior_packs_path
        else:
            search_path = self.resource_packs_path
        
        if not search_path.exists():
            return None
        
        for addon_dir in search_path.iterdir():
            if addon_dir.is_dir():
                manifest_path = addon_dir / "manifest.json"
                if manifest_path.exists():
                    addon_info = self.read_addon_manifest(manifest_path)
                    if addon_info and addon_info["uuid"] == uuid:
                        addon_info["folder"] = addon_dir.name
                        addon_info["type"] = addon_type
                        return addon_info
        
        return None

    def apply_addon_to_world(self, addon_info, addon_type):
        """Aplicar addon ao mundo atual"""
        world_path = self.get_current_world_path()
        
        if addon_type == "behavior":
            json_file = world_path / "world_behavior_packs.json"
        else:
            json_file = world_path / "world_resource_packs.json"
        
        # Ler arquivo atual ou criar novo
        if json_file.exists():
            with open(json_file, 'r', encoding='utf-8') as f:
                packs = json.load(f)
        else:
            packs = []
        
        # Verificar se já está aplicado (por UUID e tipo)
        for pack in packs:
            if pack.get("pack_id") == addon_info["uuid"]:
                return {"success": False, "error": "Addon já está aplicado ao mundo"}
        
        # Adicionar addon
        new_pack = {
            "pack_id": addon_info["uuid"],
            "version": addon_info["version"]
        }
        packs.append(new_pack)
        
        # Salvar arquivo
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(packs, f, indent=2, ensure_ascii=False)
        
        return {"success": True, "message": f"Addon '{addon_info['name']}' aplicado ao mundo"}

    def remove_addon_from_world(self, addon_info, addon_type):
        """Remover addon do mundo atual"""
        world_path = self.get_current_world_path()
        
        if addon_type == "behavior":
            json_file = world_path / "world_behavior_packs.json"
        else:
            json_file = world_path / "world_resource_packs.json"
        
        if not json_file.exists():
            return {"success": False, "error": "Arquivo de addons não encontrado"}
        
        # Ler arquivo atual
        with open(json_file, 'r', encoding='utf-8') as f:
            packs = json.load(f)
        
        # Remover addon (por UUID e tipo)
        original_count = len(packs)
        packs = [pack for pack in packs if pack.get("pack_id") != addon_info["uuid"]]
        
        if len(packs) == original_count:
            return {"success": False, "error": "Addon não encontrado no mundo"}
        
        # Salvar arquivo
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(packs, f, indent=2, ensure_ascii=False)
        
        return {"success": True, "message": f"Addon '{addon_info['name']}' removido do mundo"}
    
    def get_difficulty_name(self, difficulty_value):
        """Obter nome da dificuldade"""
        difficulties = {
            0: "Peaceful",
            1: "Easy",
            2: "Normal", 
            3: "Hard"
        }
        return difficulties.get(difficulty_value, "Unknown")