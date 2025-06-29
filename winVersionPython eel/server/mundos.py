import os
import shutil
import zipfile
from pathlib import Path
import json

class WorldManager:
    def __init__(self):
        self.server_path = None
        self.worlds_path = None
    
    def set_server_path(self, path):
        """Define o caminho do servidor"""
        self.server_path = Path(path)
        self.worlds_path = self.server_path / "worlds"
        
        # Criar pasta worlds se não existir
        self.worlds_path.mkdir(exist_ok=True)
    
    def get_current_world_info(self):
        """Retorna informações do mundo atual"""
        if not self.worlds_path:
            return {"error": "Caminho do servidor não definido"}
        
        try:
            # Obter mundo ativo do server.properties
            from editor_server import ServerPropertiesEditor
            editor = ServerPropertiesEditor()
            editor.set_server_path(self.server_path)
            config = editor.get_config()
            
            active_world = "Bedrock level"  # Padrão
            if config.get("success"):
                active_world = config["config"].get("level-name", "Bedrock level")
            
            worlds = []
            for world_dir in self.worlds_path.iterdir():
                if world_dir.is_dir():
                    level_dat = world_dir / "level.dat"
                    levelname_txt = world_dir / "levelname.txt"
                    
                    world_info = {
                        "name": world_dir.name,
                        "path": str(world_dir),
                        "has_level_dat": level_dat.exists(),
                        "has_levelname": levelname_txt.exists(),
                        "is_active": world_dir.name == active_world
                    }
                    
                    # Ler nome do mundo se existir levelname.txt
                    if levelname_txt.exists():
                        try:
                            with open(levelname_txt, 'r', encoding='utf-8') as f:
                                world_info["display_name"] = f.read().strip()
                        except:
                            world_info["display_name"] = world_dir.name
                    else:
                        world_info["display_name"] = world_dir.name
                    
                    # Obter informações adicionais do mundo
                    world_info.update(self.get_world_details(world_dir))
                    
                    worlds.append(world_info)
            
            # Ordenar mundos: ativo primeiro, depois alfabético
            worlds.sort(key=lambda x: (not x["is_active"], x["display_name"]))
            
            return {"success": True, "worlds": worlds, "active_world": active_world}
            
        except Exception as e:
            return {"error": f"Erro ao listar mundos: {str(e)}"}
    
    def get_world_details(self, world_dir):
        """Obter detalhes adicionais do mundo"""
        details = {
            "size": "Calculando...",
            "last_modified": "Desconhecido",
            "has_addons": False,
            "addon_count": 0
        }
        
        try:
            # Calcular tamanho da pasta
            total_size = 0
            for dirpath, dirnames, filenames in os.walk(world_dir):
                for filename in filenames:
                    filepath = os.path.join(dirpath, filename)
                    try:
                        total_size += os.path.getsize(filepath)
                    except:
                        pass
            
            # Converter para formato legível
            if total_size < 1024:
                details["size"] = f"{total_size} B"
            elif total_size < 1024 * 1024:
                details["size"] = f"{total_size / 1024:.1f} KB"
            elif total_size < 1024 * 1024 * 1024:
                details["size"] = f"{total_size / (1024 * 1024):.1f} MB"
            else:
                details["size"] = f"{total_size / (1024 * 1024 * 1024):.1f} GB"
            
            # Data de modificação
            try:
                import time
                mtime = os.path.getmtime(world_dir)
                details["last_modified"] = time.strftime("%d/%m/%Y %H:%M", time.localtime(mtime))
            except:
                pass
            
            # Verificar addons aplicados
            bp_file = world_dir / "world_behavior_packs.json"
            rp_file = world_dir / "world_resource_packs.json"
            
            addon_count = 0
            if bp_file.exists():
                try:
                    with open(bp_file, 'r', encoding='utf-8') as f:
                        bp_data = json.load(f)
                        addon_count += len(bp_data)
                except:
                    pass
            
            if rp_file.exists():
                try:
                    with open(rp_file, 'r', encoding='utf-8') as f:
                        rp_data = json.load(f)
                        addon_count += len(rp_data)
                except:
                    pass
            
            details["has_addons"] = addon_count > 0
            details["addon_count"] = addon_count
            
        except Exception as e:
            print(f"Erro ao obter detalhes do mundo {world_dir.name}: {e}")
        
        return details
    
    def activate_world(self, world_name):
        """Ativar um mundo específico"""
        if not self.worlds_path:
            return {"success": False, "error": "Caminho do servidor não definido"}
        
        try:
            world_path = self.worlds_path / world_name
            
            if not world_path.exists():
                return {"success": False, "error": f"Mundo '{world_name}' não encontrado"}
            
            if not world_path.is_dir():
                return {"success": False, "error": f"'{world_name}' não é um diretório válido"}
            
            # Verificar se é um mundo válido
            level_dat = world_path / "level.dat"
            if not level_dat.exists():
                return {"success": False, "error": f"Mundo '{world_name}' não possui level.dat"}
            
            # Atualizar server.properties
            from editor_server import ServerPropertiesEditor
            editor = ServerPropertiesEditor()
            editor.set_server_path(self.server_path)
            
            # Carregar configuração atual
            config_result = editor.get_config()
            if not config_result.get("success"):
                return {"success": False, "error": "Erro ao carregar configurações do servidor"}
            
            # Atualizar level-name
            config = config_result["config"]
            old_world = config.get("level-name", "Bedrock level")
            config["level-name"] = world_name
            
            # Salvar configuração
            editor.save_config(config)
            
            return {
                "success": True,
                "message": f"Mundo '{world_name}' ativado com sucesso!",
                "old_world": old_world,
                "new_world": world_name
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao ativar mundo: {str(e)}"}
    
    def delete_world(self, world_name):
        """Excluir um mundo"""
        if not self.worlds_path:
            return {"success": False, "error": "Caminho do servidor não definido"}
        
        try:
            world_path = self.worlds_path / world_name
            
            if not world_path.exists():
                return {"success": False, "error": f"Mundo '{world_name}' não encontrado"}
            
            # Verificar se é o mundo ativo
            from editor_server import ServerPropertiesEditor
            editor = ServerPropertiesEditor()
            editor.set_server_path(self.server_path)
            config_result = editor.get_config()
            
            if config_result.get("success"):
                active_world = config_result["config"].get("level-name", "Bedrock level")
                if world_name == active_world:
                    return {"success": False, "error": "Não é possível excluir o mundo ativo"}
            
            # Criar backup antes de excluir
            backup_dir = self.server_path / "worlds_backup"
            backup_dir.mkdir(exist_ok=True)
            
            import time
            backup_name = f"{world_name}_deleted_{int(time.time())}"
            backup_path = backup_dir / backup_name
            
            # Mover para backup em vez de excluir permanentemente
            shutil.move(str(world_path), str(backup_path))
            
            return {
                "success": True,
                "message": f"Mundo '{world_name}' movido para backup",
                "backup_path": str(backup_path)
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao excluir mundo: {str(e)}"}
    
    def import_world(self, world_path):
        """Importa um novo mundo"""
        if not self.worlds_path:
            return {"success": False, "error": "Caminho do servidor não definido"}
        
        try:
            world_path = Path(world_path)
            
            if not world_path.exists():
                return {"success": False, "error": "Arquivo de mundo não encontrado"}
            
            # Criar pasta temporária para extração
            temp_dir = self.server_path / "temp_world_import"
            temp_dir.mkdir(exist_ok=True)
            
            try:
                # Extrair mundo
                if world_path.suffix.lower() == '.zip':
                    with zipfile.ZipFile(world_path, 'r') as zip_ref:
                        zip_ref.extractall(temp_dir)
                else:
                    return {"success": False, "error": "Formato de arquivo não suportado. Use arquivos .zip"}
                
                # Encontrar pasta do mundo extraído
                world_folders = [d for d in temp_dir.iterdir() if d.is_dir()]
                
                if not world_folders:
                    return {"success": False, "error": "Nenhuma pasta de mundo encontrada no arquivo"}
                
                # Usar a primeira pasta encontrada
                extracted_world = world_folders[0]
                world_name = extracted_world.name
                
                # Verificar se é um mundo válido
                if not (extracted_world / "level.dat").exists():
                    return {"success": False, "error": "Mundo inválido: level.dat não encontrado"}
                
                # Verificar se já existe um mundo com o mesmo nome
                target_path = self.worlds_path / world_name
                if target_path.exists():
                    # Criar backup do mundo existente
                    backup_dir = self.server_path / "worlds_backup"
                    backup_dir.mkdir(exist_ok=True)
                    
                    import time
                    backup_name = f"{world_name}_backup_{int(time.time())}"
                    backup_path = backup_dir / backup_name
                    shutil.move(str(target_path), str(backup_path))
                
                # Mover novo mundo
                shutil.move(str(extracted_world), str(target_path))
                
                return {
                    "success": True, 
                    "message": f"Mundo '{world_name}' importado com sucesso!",
                    "world_name": world_name
                }
                
            finally:
                # Limpar pasta temporária
                if temp_dir.exists():
                    shutil.rmtree(temp_dir)
                    
        except Exception as e:
            return {"success": False, "error": f"Erro ao importar mundo: {str(e)}"}
    
    def backup_current_world(self):
        """Cria backup do mundo atual"""
        try:
            if not self.worlds_path:
                return {"success": False, "error": "Caminho do servidor não definido"}
            
            # Obter mundo ativo
            from editor_server import ServerPropertiesEditor
            editor = ServerPropertiesEditor()
            editor.set_server_path(self.server_path)
            config_result = editor.get_config()
            
            if not config_result.get("success"):
                return {"success": False, "error": "Erro ao obter mundo ativo"}
            
            active_world = config_result["config"].get("level-name", "Bedrock level")
            world_path = self.worlds_path / active_world
            
            if not world_path.exists():
                return {"success": False, "error": f"Mundo ativo '{active_world}' não encontrado"}
            
            backup_dir = self.server_path / "worlds_backup"
            backup_dir.mkdir(exist_ok=True)
            
            import time
            backup_name = f"{active_world}_backup_{int(time.time())}"
            backup_path = backup_dir / backup_name
            
            shutil.copytree(world_path, backup_path)
            
            return {
                "success": True, 
                "message": f"Backup do mundo '{active_world}' criado com sucesso!",
                "backup_path": str(backup_path)
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao criar backup: {str(e)}"}