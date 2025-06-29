import os
import json
import shutil
import zipfile
from pathlib import Path

class AddonManager:
    def __init__(self, server_path):
        self.server_path = server_path
        self.behavior_packs_path = os.path.join(server_path, "development_behavior_packs")
        self.resource_packs_path = os.path.join(server_path, "development_resource_packs")
        self.worlds_path = os.path.join(server_path, "worlds")
        
        # Criar pastas se não existirem
        os.makedirs(self.behavior_packs_path, exist_ok=True)
        os.makedirs(self.resource_packs_path, exist_ok=True)
        os.makedirs(self.worlds_path, exist_ok=True)
    
    def import_addon_to_library(self, source_path, addon_type):
        """Importar addon apenas para a biblioteca (sem aplicar ao mundo)"""
        try:
            if addon_type == "mcaddon":
                return self._import_mcaddon_to_library(source_path)
            elif addon_type == "zip":
                return self._import_zip_to_library(source_path)
            elif addon_type == "folder":
                return self._import_folder_to_library(source_path)
            else:
                raise ValueError("Tipo de addon não suportado")
        except Exception as e:
            # Re-raise com contexto mais específico
            raise Exception(f"Erro ao importar addon: {str(e)}")
    
    def _import_mcaddon_to_library(self, mcaddon_path):
        """Importar arquivo .mcaddon para biblioteca"""
        if not os.path.exists(mcaddon_path):
            raise FileNotFoundError("Arquivo .mcaddon não encontrado")
        
        return self._import_zip_to_library(mcaddon_path)
    
    def _import_zip_to_library(self, zip_path):
        """Importar addon de arquivo ZIP para biblioteca"""
        if not os.path.exists(zip_path):
            raise FileNotFoundError("Arquivo ZIP não encontrado")
        
        temp_extract_path = os.path.join(self.server_path, "temp_addon_extract")
        
        try:
            if os.path.exists(temp_extract_path):
                shutil.rmtree(temp_extract_path)
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_extract_path)
            
            return self._process_extracted_addon_to_library(temp_extract_path)
            
        finally:
            if os.path.exists(temp_extract_path):
                shutil.rmtree(temp_extract_path)
    
    def _import_folder_to_library(self, folder_path):
        """Importar addon de pasta para biblioteca"""
        if not os.path.exists(folder_path):
            raise FileNotFoundError("Pasta do addon não encontrada")
        
        return self._process_extracted_addon_to_library(folder_path)
    
    def _process_extracted_addon_to_library(self, addon_path):
        """Processar addon extraído e adicionar à biblioteca"""
        manifest_path = self._find_manifest(addon_path)
        
        if not manifest_path:
            raise ValueError("Arquivo manifest.json não encontrado no addon")
        
        # Verificar se o arquivo manifest não está vazio
        if os.path.getsize(manifest_path) == 0:
            raise ValueError("Arquivo manifest.json está vazio")
        
        try:
            with open(manifest_path, 'r', encoding='utf-8') as file:
                content = file.read().strip()
                
                if not content:
                    raise ValueError("Arquivo manifest.json está vazio")
                
                # Tentar fazer parse do JSON
                manifest = json.loads(content)
                
        except json.JSONDecodeError as e:
            # Melhor diagnóstico do erro JSON
            error_details = self._diagnose_json_error(manifest_path, str(e))
            raise ValueError(f"Arquivo manifest.json contém JSON inválido:\n{error_details}")
        except UnicodeDecodeError:
            # Tentar com diferentes encodings
            try:
                with open(manifest_path, 'r', encoding='utf-8-sig') as file:
                    content = file.read().strip()
                    if not content:
                        raise ValueError("Arquivo manifest.json está vazio")
                    manifest = json.loads(content)
            except:
                try:
                    with open(manifest_path, 'r', encoding='latin-1') as file:
                        content = file.read().strip()
                        if not content:
                            raise ValueError("Arquivo manifest.json está vazio")
                        manifest = json.loads(content)
                except Exception as e:
                    raise ValueError(f"Não foi possível ler o arquivo manifest.json: {str(e)}")
        
        self._validate_manifest(manifest)
        addon_info = self._analyze_addon_type(manifest)
        
        addon_folder_path = os.path.dirname(manifest_path)
        self._install_addon_to_library(addon_folder_path, addon_info)
        
        return addon_info
    
    def _diagnose_json_error(self, manifest_path, error_msg):
        """Diagnosticar erro de JSON e fornecer informações úteis"""
        try:
            with open(manifest_path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Verificar se arquivo está vazio
            if not content.strip():
                return "O arquivo manifest.json está completamente vazio"
            
            # Verificar se contém apenas espaços em branco
            if content.isspace():
                return "O arquivo manifest.json contém apenas espaços em branco"
            
            # Verificar se começa com BOM
            if content.startswith('\ufeff'):
                return "O arquivo contém BOM (Byte Order Mark). Tente salvar sem BOM"
            
            # Verificar primeiros caracteres
            first_chars = content[:50].strip()
            if not first_chars.startswith('{'):
                return f"O arquivo não começa com '{{'. Primeiros caracteres: '{first_chars}'"
            
            # Verificar se é um arquivo binário
            try:
                content.encode('ascii')
            except UnicodeEncodeError:
                return "O arquivo pode conter caracteres não-ASCII inválidos"
            
            # Tentar identificar linha do erro
            lines = content.split('\n')
            return f"Erro JSON: {error_msg}\nPrimeiras linhas do arquivo:\n" + '\n'.join(f"{i+1}: {line}" for i, line in enumerate(lines[:5]))
            
        except Exception as e:
            return f"Erro original: {error_msg}\nErro ao diagnosticar: {str(e)}"
    
    def _install_addon_to_library(self, addon_folder_path, addon_info):
        """Instalar addon apenas na biblioteca (development packs)"""
        addon_name = addon_info["name"]
        addon_type = addon_info["type"]
        safe_name = self._sanitize_addon_name(addon_name)
        
        if addon_type in ["behavior", "both"]:
            behavior_dest = os.path.join(self.behavior_packs_path, safe_name)
            if os.path.exists(behavior_dest):
                shutil.rmtree(behavior_dest)
            shutil.copytree(addon_folder_path, behavior_dest)
        
        if addon_type in ["resource", "both"]:
            resource_dest = os.path.join(self.resource_packs_path, safe_name)
            if os.path.exists(resource_dest):
                shutil.rmtree(resource_dest)
            shutil.copytree(addon_folder_path, resource_dest)
    
    def apply_addon_to_world(self, addon_info, world_name=None):
        """Aplicar addon da biblioteca ao mundo"""
        try:
            # Validar addon_info
            if not isinstance(addon_info, dict):
                raise ValueError("Informações do addon inválidas")
            
            # Verificar campos obrigatórios
            required_fields = ["name", "uuid", "version"]
            for field in required_fields:
                if field not in addon_info:
                    raise ValueError(f"Campo obrigatório '{field}' não encontrado nas informações do addon")
            
            # CORREÇÃO: Determinar tipo do addon se não estiver definido
            if "type" not in addon_info:
                addon_info = self._determine_addon_type_from_library(addon_info)
            
            # Validar tipo do addon
            if addon_info["type"] not in ["behavior", "resource", "both"]:
                raise ValueError(f"Tipo de addon inválido: {addon_info['type']}")
            
            if not world_name:
                from src.core.server_properties import ServerPropertiesManager
                props_manager = ServerPropertiesManager(self.server_path)
                world_name = props_manager.get_property("level-name") or "Bedrock level"
            
            world_path = os.path.join(self.worlds_path, world_name)
            
            if not os.path.exists(world_path):
                raise FileNotFoundError(f"Mundo '{world_name}' não encontrado")
            
            addon_type = addon_info["type"]
            
            if addon_type in ["behavior", "both"]:
                self._add_to_world_packs(world_path, "world_behavior_packs.json", addon_info)
            
            if addon_type in ["resource", "both"]:
                self._add_to_world_packs(world_path, "world_resource_packs.json", addon_info)
                
        except Exception as e:
            raise Exception(f"Erro ao aplicar addon: {str(e)}")
    
    def _determine_addon_type_from_library(self, addon_info):
        """Determinar tipo do addon procurando na biblioteca"""
        addon_uuid = addon_info.get("uuid", "")
        
        # Procurar em behavior packs
        for pack in self.list_behavior_packs():
            if pack.get("uuid") == addon_uuid:
                addon_info["type"] = "behavior"
                return addon_info
        
        # Procurar em resource packs
        for pack in self.list_resource_packs():
            if pack.get("uuid") == addon_uuid:
                addon_info["type"] = "resource"
                return addon_info
        
        # Se não encontrou, tentar analisar pelo manifest
        try:
            # Procurar pasta do addon
            safe_name = self._sanitize_addon_name(addon_info.get("name", ""))
            
            # Verificar behavior packs
            behavior_path = os.path.join(self.behavior_packs_path, safe_name, "manifest.json")
            if os.path.exists(behavior_path):
                with open(behavior_path, 'r', encoding='utf-8') as file:
                    manifest = json.load(file)
                    analyzed_info = self._analyze_addon_type(manifest)
                    addon_info["type"] = analyzed_info["type"]
                    return addon_info
            
            # Verificar resource packs
            resource_path = os.path.join(self.resource_packs_path, safe_name, "manifest.json")
            if os.path.exists(resource_path):
                with open(resource_path, 'r', encoding='utf-8') as file:
                    manifest = json.load(file)
                    analyzed_info = self._analyze_addon_type(manifest)
                    addon_info["type"] = analyzed_info["type"]
                    return addon_info
        except:
            pass
        
        # Fallback: assumir behavior pack
        addon_info["type"] = "behavior"
        return addon_info
    
    def remove_addon_from_world(self, addon_info, world_name=None):
        """Remover addon do mundo (manter na biblioteca)"""
        try:
            # Validar addon_info
            if not isinstance(addon_info, dict):
                raise ValueError("Informações do addon inválidas")
            
            if "uuid" not in addon_info:
                raise ValueError("UUID do addon não encontrado")
            
            # CORREÇÃO: Determinar tipo se não estiver definido
            if "type" not in addon_info:
                addon_info = self._determine_addon_type_from_library(addon_info)
            
            if not world_name:
                from src.core.server_properties import ServerPropertiesManager
                props_manager = ServerPropertiesManager(self.server_path)
                world_name = props_manager.get_property("level-name") or "Bedrock level"
            
            world_path = os.path.join(self.worlds_path, world_name)
            
            if not os.path.exists(world_path):
                return
            
            addon_type = addon_info["type"]
            
            if addon_type in ["behavior", "both"]:
                self._remove_from_world_packs(world_path, "world_behavior_packs.json", addon_info["uuid"])
            
            if addon_type in ["resource", "both"]:
                self._remove_from_world_packs(world_path, "world_resource_packs.json", addon_info["uuid"])
                
        except Exception as e:
            raise Exception(f"Erro ao remover addon do mundo: {str(e)}")
    
    def get_world_addons(self, world_name=None):
        """Obter addons aplicados ao mundo"""
        try:
            if not world_name:
                from src.core.server_properties import ServerPropertiesManager
                props_manager = ServerPropertiesManager(self.server_path)
                world_name = props_manager.get_property("level-name") or "Bedrock level"
            
            world_path = os.path.join(self.worlds_path, world_name)
            
            if not os.path.exists(world_path):
                return {"behavior": [], "resource": []}
            
            behavior_packs = self._get_world_packs(world_path, "world_behavior_packs.json")
            resource_packs = self._get_world_packs(world_path, "world_resource_packs.json")
            
            return {
                "behavior": behavior_packs,
                "resource": resource_packs
            }
        except Exception as e:
            print(f"Erro ao obter addons do mundo: {e}")
            return {"behavior": [], "resource": []}
    
    def _get_world_packs(self, world_path, pack_file):
        """Obter packs aplicados ao mundo"""
        pack_file_path = os.path.join(world_path, pack_file)
        
        if not os.path.exists(pack_file_path):
            return []
        
        try:
            # Verificar se o arquivo não está vazio
            if os.path.getsize(pack_file_path) == 0:
                return []
            
            with open(pack_file_path, 'r', encoding='utf-8') as file:
                content = file.read().strip()
                
                if not content:
                    return []
                
                packs = json.loads(content)
            
            # Validar se packs é uma lista
            if not isinstance(packs, list):
                return []
            
            # Buscar informações dos packs na biblioteca
            pack_infos = []
            for pack in packs:
                if not isinstance(pack, dict):
                    continue
                    
                pack_uuid = pack.get("pack_id")
                if not pack_uuid:
                    continue
                    
                pack_info = self._find_pack_by_uuid(pack_uuid)
                if pack_info:
                    pack_infos.append(pack_info)
            
            return pack_infos
            
        except (json.JSONDecodeError, UnicodeDecodeError):
            # Se o arquivo estiver corrompido, retornar lista vazia
            return []
        except Exception:
            return []
    
    def _find_pack_by_uuid(self, uuid):
        """Encontrar pack na biblioteca pelo UUID"""
        if not uuid:
            return None
            
        # Buscar em behavior packs
        for pack in self.list_behavior_packs():
            if pack.get("uuid") == uuid:
                pack["type"] = "behavior"
                return pack
        
        # Buscar em resource packs
        for pack in self.list_resource_packs():
            if pack.get("uuid") == uuid:
                pack["type"] = "resource"
                return pack
        
        return None
    
    # Métodos auxiliares (mantidos do código original)
    def _find_manifest(self, search_path):
        """Encontrar arquivo manifest.json recursivamente"""
        for root, dirs, files in os.walk(search_path):
            if "manifest.json" in files:
                manifest_path = os.path.join(root, "manifest.json")
                # Verificar se o arquivo não está vazio
                try:
                    if os.path.getsize(manifest_path) > 0:
                        return manifest_path
                except OSError:
                    continue
        return None
    
    def _validate_manifest(self, manifest):
        """Validar estrutura do manifest.json"""
        if not isinstance(manifest, dict):
            raise ValueError("Manifest deve ser um objeto JSON válido")
        
        required_fields = ["format_version", "header", "modules"]
        
        for field in required_fields:
            if field not in manifest:
                raise ValueError(f"Campo obrigatório '{field}' não encontrado no manifest.json")
        
        header = manifest["header"]
        if not isinstance(header, dict):
            raise ValueError("Campo 'header' deve ser um objeto")
        
        required_header_fields = ["name", "uuid", "version"]
        
        for field in required_header_fields:
            if field not in header:
                raise ValueError(f"Campo obrigatório '{field}' não encontrado no header do manifest.json")
        
        # Validar se modules é uma lista
        if not isinstance(manifest["modules"], list):
            raise ValueError("Campo 'modules' deve ser uma lista")
        
        if len(manifest["modules"]) == 0:
            raise ValueError("Addon deve ter pelo menos um módulo")
    
    def _analyze_addon_type(self, manifest):
        """Analisar tipo do addon baseado nos módulos"""
        header = manifest["header"]
        modules = manifest["modules"]
        
        # Garantir que version seja uma lista
        version = header.get("version", [1, 0, 0])
        if not isinstance(version, list):
            if isinstance(version, str):
                # Tentar converter string para lista
                try:
                    version = [int(x) for x in version.split('.')]
                except:
                    version = [1, 0, 0]
            else:
                version = [1, 0, 0]
        
        addon_info = {
            "name": str(header.get("name", "Addon sem nome")),
            "uuid": str(header.get("uuid", "")),
            "version": version,
            "description": str(header.get("description", "")),
            "type": None,
            "modules": []
        }
        
        has_behavior = False
        has_resource = False
        
        for module in modules:
            if not isinstance(module, dict):
                continue
                
            module_type = module.get("type", "")
            addon_info["modules"].append(module_type)
            
            if module_type in ["data", "script"]:
                has_behavior = True
            elif module_type in ["resources", "skin_pack"]:
                has_resource = True
        
        if has_behavior and has_resource:
            addon_info["type"] = "both"
        elif has_behavior:
            addon_info["type"] = "behavior"
        elif has_resource:
            addon_info["type"] = "resource"
        else:
            addon_info["type"] = "unknown"
        
        return addon_info
    
    def _sanitize_addon_name(self, name):
        """Limpar nome do addon"""
        if not name or not isinstance(name, str):
            return "unnamed_addon"
            
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            name = name.replace(char, '_')
        return name.strip() or "unnamed_addon"
    
    def _add_to_world_packs(self, world_path, pack_file, addon_info):
        """Adicionar addon ao arquivo de packs do mundo"""
        try:
            pack_file_path = os.path.join(world_path, pack_file)
            
            # Validar addon_info
            if not isinstance(addon_info, dict):
                raise ValueError("Informações do addon inválidas")
            
            if "uuid" not in addon_info or "version" not in addon_info:
                raise ValueError("UUID ou versão do addon não encontrados")
            
            # Garantir que version seja uma lista
            version = addon_info["version"]
            if not isinstance(version, list):
                if isinstance(version, str):
                    try:
                        version = [int(x) for x in version.split('.')]
                    except:
                        version = [1, 0, 0]
                else:
                    version = [1, 0, 0]
            
            pack_entry = {
                "pack_id": str(addon_info["uuid"]),
                "version": version
            }
            
            packs = []
            if os.path.exists(pack_file_path):
                try:
                    # Verificar se o arquivo não está vazio
                    if os.path.getsize(pack_file_path) > 0:
                        with open(pack_file_path, 'r', encoding='utf-8') as file:
                            content = file.read().strip()
                            if content:
                                packs = json.loads(content)
                                
                    # Validar se packs é uma lista
                    if not isinstance(packs, list):
                        packs = []
                        
                except (json.JSONDecodeError, UnicodeDecodeError):
                    # Se o arquivo estiver corrompido, começar com lista vazia
                    packs = []
            
            # Verificar se já existe
            existing_pack = None
            for i, pack in enumerate(packs):
                if isinstance(pack, dict) and pack.get("pack_id") == addon_info["uuid"]:
                    existing_pack = i
                    break
            
            if existing_pack is not None:
                packs[existing_pack] = pack_entry
            else:
                packs.append(pack_entry)
            
            with open(pack_file_path, 'w', encoding='utf-8') as file:
                json.dump(packs, file, indent=2)
                
        except Exception as e:
            raise Exception(f"Erro ao adicionar addon ao mundo: {str(e)}")
    
    def _remove_from_world_packs(self, world_path, pack_file, pack_uuid):
        """Remover addon do arquivo de packs do mundo"""
        pack_file_path = os.path.join(world_path, pack_file)
        
        if not os.path.exists(pack_file_path):
            return
        
        try:
            # Verificar se o arquivo não está vazio
            if os.path.getsize(pack_file_path) == 0:
                return
            
            with open(pack_file_path, 'r', encoding='utf-8') as file:
                content = file.read().strip()
                if not content:
                    return
                    
                packs = json.loads(content)
            
            # Validar se packs é uma lista
            if not isinstance(packs, list):
                packs = []
            
            packs = [pack for pack in packs 
                    if isinstance(pack, dict) and pack.get("pack_id") != pack_uuid]
            
            with open(pack_file_path, 'w', encoding='utf-8') as file:
                json.dump(packs, file, indent=2)
                
        except (json.JSONDecodeError, UnicodeDecodeError):
            # Se o arquivo estiver corrompido, criar arquivo vazio
            try:
                with open(pack_file_path, 'w', encoding='utf-8') as file:
                    json.dump([], file, indent=2)
            except:
                pass
    
    def list_behavior_packs(self):
        """Listar behavior packs instalados"""
        return self._list_packs(self.behavior_packs_path)
    
    def list_resource_packs(self):
        """Listar resource packs instalados"""
        return self._list_packs(self.resource_packs_path)
    
    def _list_packs(self, packs_path):
        """Listar packs em uma pasta"""
        packs = []
        
        if not os.path.exists(packs_path):
            return packs
        
        for item in os.listdir(packs_path):
            pack_path = os.path.join(packs_path, item)
            if os.path.isdir(pack_path):
                manifest_path = os.path.join(pack_path, "manifest.json")
                if os.path.exists(manifest_path):
                    try:
                        # Verificar se o arquivo não está vazio
                        if os.path.getsize(manifest_path) == 0:
                            continue
                        
                        with open(manifest_path, 'r', encoding='utf-8') as file:
                            content = file.read().strip()
                            if not content:
                                continue
                                
                            manifest = json.loads(content)
                        
                        if not isinstance(manifest, dict) or "header" not in manifest:
                            continue
                            
                        header = manifest["header"]
                        if not isinstance(header, dict):
                            continue
                        
                        # Garantir que version seja uma lista
                        version = header.get("version", [1, 0, 0])
                        if not isinstance(version, list):
                            if isinstance(version, str):
                                try:
                                    version = [int(x) for x in version.split('.')]
                                except:
                                    version = [1, 0, 0]
                            else:
                                version = [1, 0, 0]
                        
                        pack_info = {
                            "name": str(header.get("name", "Addon sem nome")),
                            "uuid": str(header.get("uuid", "")),
                            "version": version,
                            "description": str(header.get("description", "")),
                            "folder": item
                        }
                        
                        # Validar campos obrigatórios
                        if pack_info["name"] and pack_info["uuid"]:
                            packs.append(pack_info)
                            
                    except (json.JSONDecodeError, UnicodeDecodeError, KeyError):
                        # Pular addons com manifest inválido
                        continue
                    except Exception:
                        # Pular addons com outros erros
                        continue
        
        return sorted(packs, key=lambda x: x["name"])
    
    def remove_addon_from_library(self, addon_info, addon_type):
        """Remover addon da biblioteca"""
        try:
            if not isinstance(addon_info, dict) or "folder" not in addon_info:
                raise ValueError("Informações do addon inválidas")
            
            folder_name = addon_info["folder"]
            
            if addon_type == "behavior":
                pack_path = os.path.join(self.behavior_packs_path, folder_name)
            else:
                pack_path = os.path.join(self.resource_packs_path, folder_name)
            
            if os.path.exists(pack_path):
                shutil.rmtree(pack_path)
            
            # Remover de todos os mundos
            self._remove_addon_from_all_worlds(addon_info)
            
        except Exception as e:
            raise Exception(f"Erro ao remover addon da biblioteca: {str(e)}")
    
    def _remove_addon_from_all_worlds(self, addon_info):
        """Remover addon de todos os mundos"""
        if not os.path.exists(self.worlds_path):
            return
        
        for world_name in os.listdir(self.worlds_path):
            world_path = os.path.join(self.worlds_path, world_name)
            if os.path.isdir(world_path):
                try:
                    self.remove_addon_from_world(addon_info, world_name)
                except:
                    pass