import os
import struct
import json
from pathlib import Path

class LevelDatManager:
    def __init__(self, server_path):
        self.server_path = server_path
        self.worlds_path = os.path.join(server_path, "worlds")
    
    def get_current_world_path(self):
        """Obter caminho do mundo atual"""
        from src.core.server_properties import ServerPropertiesManager
        
        props_manager = ServerPropertiesManager(self.server_path)
        current_world = props_manager.get_property("level-name") or "Bedrock level"
        
        return os.path.join(self.worlds_path, current_world)
    
    def get_level_dat_path(self):
        """Obter caminho do arquivo level.dat"""
        world_path = self.get_current_world_path()
        return os.path.join(world_path, "level.dat")
    
    def load_level_settings(self):
        """Carregar configurações do level.dat"""
        level_dat_path = self.get_level_dat_path()
        
        if not os.path.exists(level_dat_path):
            # Retornar configurações padrão se não existir
            return self.get_default_settings()
        
        try:
            # Tentar ler como NBT (formato binário)
            # Para simplificar, vamos usar configurações padrão e permitir edição
            # Em uma implementação completa, seria necessário um parser NBT
            return self.get_default_settings()
        except:
            return self.get_default_settings()
    
    def get_default_settings(self):
        """Obter configurações padrão do mundo"""
        return {
            # Configurações básicas
            "RandomSeed": "4424420676901351550",
            "IsHardcore": False,
            "Difficulty": 1,
            "educationFeaturesEnabled": False,
            
            # Regras de jogo
            "commandblockoutput": False,
            "commandblocksenabled": True,
            "dodaylightcycle": True,
            "doentitydrops": True,
            "dofiretick": True,
            "doimmediaterespawn": False,
            "doinsomnia": True,
            "domobloot": True,
            "domobspawning": True,
            "dotiledrops": True,
            "doweathercycle": False,
            "drowningdamage": True,
            "falldamage": True,
            "firedamage": True,
            "freezedamage": True,
            "functioncommandlimit": 10000,
            "keepinventory": True,
            "maxcommandchainlength": 65535,
            "mobgriefing": True,
            "naturalregeneration": True,
            "playerssleepingpercentage": 0,
            "pvp": True,
            "randomtickspeed": 1,
            "recipesunlock": False,
            "respawnblocksexplode": True,
            "sendcommandfeedback": False,
            "showcoordinates": True,
            "showdaysplayed": True,
            "showdeathmessages": True,
            "showtags": False,
            "spawnradius": 10,
            "tntexplodes": True,
            "tntexplosiondropdecay": False,
            
            # Experimentos
            "data_driven_biomes": True,
            "experimental_creator_cameras": False,
            "gametest": True,
            "jigsaw_structures": True,
            "upcoming_creator_features": True,
            "villager_trades_rebalance": True
        }
    
    def save_level_settings(self, settings):
        """Salvar configurações do level.dat"""
        # Para esta implementação, vamos salvar em um arquivo JSON auxiliar
        # Em uma implementação completa, seria necessário escrever no formato NBT
        world_path = self.get_current_world_path()
        
        if not os.path.exists(world_path):
            raise FileNotFoundError("Mundo atual não encontrado")
        
        # Salvar configurações em arquivo auxiliar
        settings_file = os.path.join(world_path, "level_settings.json")
        
        try:
            with open(settings_file, 'w', encoding='utf-8') as file:
                json.dump(settings, file, indent=2)
        except Exception as e:
            raise Exception(f"Erro ao salvar configurações do mundo: {str(e)}")
    
    def load_saved_settings(self):
        """Carregar configurações salvas do arquivo auxiliar"""
        world_path = self.get_current_world_path()
        settings_file = os.path.join(world_path, "level_settings.json")
        
        if os.path.exists(settings_file):
            try:
                with open(settings_file, 'r', encoding='utf-8') as file:
                    saved_settings = json.load(file)
                
                # Mesclar com configurações padrão
                default_settings = self.get_default_settings()
                default_settings.update(saved_settings)
                return default_settings
            except:
                pass
        
        return self.load_level_settings()
    
    def get_difficulty_name(self, difficulty_value):
        """Obter nome da dificuldade"""
        difficulties = {
            0: "Peaceful",
            1: "Easy", 
            2: "Normal",
            3: "Hard"
        }
        return difficulties.get(difficulty_value, "Unknown")
    
    def get_gamemode_name(self, gamemode_value):
        """Obter nome do modo de jogo"""
        gamemodes = {
            0: "Survival",
            1: "Creative",
            2: "Adventure",
            3: "Spectator"
        }
        return gamemodes.get(gamemode_value, "Unknown")