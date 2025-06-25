import os
import shutil
import zipfile
from src.core.server_properties import ServerPropertiesManager

class WorldManager:
    def __init__(self, server_path):
        self.server_path = server_path
        self.worlds_path = os.path.join(server_path, "worlds")
        self.properties_manager = ServerPropertiesManager(server_path)
        
        # Criar pasta worlds se não existir
        if not os.path.exists(self.worlds_path):
            os.makedirs(self.worlds_path)
    
    def get_current_world(self):
        """Obter nome do mundo atual configurado"""
        try:
            return self.properties_manager.get_property("level-name") or "Bedrock level"
        except:
            return "Bedrock level"
    
    def list_available_worlds(self):
        """Listar mundos disponíveis na pasta worlds"""
        worlds = []
        
        if not os.path.exists(self.worlds_path):
            return worlds
        
        for item in os.listdir(self.worlds_path):
            world_path = os.path.join(self.worlds_path, item)
            if os.path.isdir(world_path):
                # Verificar se é um mundo válido (contém levelname.txt ou level.dat)
                if (os.path.exists(os.path.join(world_path, "levelname.txt")) or
                    os.path.exists(os.path.join(world_path, "level.dat"))):
                    worlds.append(item)
        
        return sorted(worlds)
    
    def import_world(self, source_path, is_zip=False):
        """Importar mundo de ZIP ou pasta"""
        if is_zip:
            return self._import_world_from_zip(source_path)
        else:
            return self._import_world_from_folder(source_path)
    
    def _import_world_from_zip(self, zip_path):
        """Importar mundo de arquivo ZIP"""
        if not os.path.exists(zip_path):
            raise FileNotFoundError("Arquivo ZIP não encontrado")
        
        # Extrair ZIP temporariamente
        temp_extract_path = os.path.join(self.server_path, "temp_world_extract")
        
        try:
            # Limpar pasta temporária se existir
            if os.path.exists(temp_extract_path):
                shutil.rmtree(temp_extract_path)
            
            # Extrair ZIP
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_extract_path)
            
            # Encontrar pasta do mundo dentro do ZIP
            world_folder = self._find_world_folder(temp_extract_path)
            
            if not world_folder:
                raise ValueError("Mundo válido não encontrado no arquivo ZIP")
            
            # Importar mundo da pasta extraída
            world_name = self._import_world_from_folder(world_folder)
            
            return world_name
            
        finally:
            # Limpar pasta temporária
            if os.path.exists(temp_extract_path):
                shutil.rmtree(temp_extract_path)
    
    def _import_world_from_folder(self, folder_path):
        """Importar mundo de pasta"""
        if not os.path.exists(folder_path):
            raise FileNotFoundError("Pasta do mundo não encontrada")
        
        # Verificar se é um mundo válido
        if not self._is_valid_world(folder_path):
            raise ValueError("A pasta não contém um mundo Minecraft válido")
        
        # Obter nome do mundo
        world_name = os.path.basename(folder_path)
        
        # Remover caracteres inválidos do nome
        world_name = self._sanitize_world_name(world_name)
        
        # Caminho de destino
        destination_path = os.path.join(self.worlds_path, world_name)
        
        # Remover mundo existente se houver
        if os.path.exists(destination_path):
            shutil.rmtree(destination_path)
        
        # Copiar mundo
        shutil.copytree(folder_path, destination_path)
        
        # Ativar o novo mundo
        self.activate_world(world_name)
        
        return world_name
    
    def _find_world_folder(self, search_path):
        """Encontrar pasta de mundo válida recursivamente"""
        # Verificar se a própria pasta é um mundo
        if self._is_valid_world(search_path):
            return search_path
        
        # Procurar em subpastas
        for item in os.listdir(search_path):
            item_path = os.path.join(search_path, item)
            if os.path.isdir(item_path):
                if self._is_valid_world(item_path):
                    return item_path
                
                # Busca recursiva
                result = self._find_world_folder(item_path)
                if result:
                    return result
        
        return None
    
    def _is_valid_world(self, folder_path):
        """Verificar se uma pasta contém um mundo válido"""
        if not os.path.isdir(folder_path):
            return False
        
        # Verificar arquivos característicos de mundo Minecraft
        world_files = ["levelname.txt", "level.dat", "db"]
        
        for file in world_files:
            if os.path.exists(os.path.join(folder_path, file)):
                return True
        
        return False
    
    def _sanitize_world_name(self, name):
        """Limpar nome do mundo removendo caracteres inválidos"""
        # Remover caracteres não permitidos
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            name = name.replace(char, '_')
        
        # Remover espaços extras
        name = name.strip()
        
        # Garantir que não está vazio
        if not name:
            name = "imported_world"
        
        return name
    
    def activate_world(self, world_name):
        """Ativar um mundo específico"""
        world_path = os.path.join(self.worlds_path, world_name)
        
        if not os.path.exists(world_path):
            raise FileNotFoundError(f"Mundo '{world_name}' não encontrado")
        
        if not self._is_valid_world(world_path):
            raise ValueError(f"'{world_name}' não é um mundo válido")
        
        # Atualizar server.properties
        self.properties_manager.set_property("level-name", world_name)
    
    def remove_world(self, world_name):
        """Remover um mundo"""
        world_path = os.path.join(self.worlds_path, world_name)
        
        if not os.path.exists(world_path):
            raise FileNotFoundError(f"Mundo '{world_name}' não encontrado")
        
        # Verificar se não é o mundo atual
        current_world = self.get_current_world()
        if world_name == current_world:
            raise ValueError("Não é possível remover o mundo atualmente ativo")
        
        # Remover pasta do mundo
        shutil.rmtree(world_path)