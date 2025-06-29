import os
import shutil
import zipfile
import json
import re
from pathlib import Path
import unicodedata

class AddonManager:
    def __init__(self):
        self.server_path = None
        self.behavior_packs_path = None
        self.resource_packs_path = None
        self.worlds_path = None
    
    def set_server_path(self, path):
        """Define o caminho do servidor"""
        self.server_path = Path(path)
        self.behavior_packs_path = self.server_path / "development_behavior_packs"
        self.resource_packs_path = self.server_path / "development_resource_packs"
        self.worlds_path = self.server_path / "worlds"
        
        # Criar pastas se não existirem
        self.behavior_packs_path.mkdir(exist_ok=True)
        self.resource_packs_path.mkdir(exist_ok=True)
        self.worlds_path.mkdir(exist_ok=True)
    
    def read_manifest_robust(self, manifest_path):
        """Lê manifest.json de forma robusta"""
        try:
            # Lista de encodings para tentar
            encodings = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252', 'iso-8859-1']
            
            for encoding in encodings:
                try:
                    with open(manifest_path, 'r', encoding=encoding, errors='replace') as f:
                        content = f.read()
                    
                    # Remover BOM se presente
                    if content.startswith('\ufeff'):
                        content = content[1:]
                    
                    # Tentar fazer parse direto primeiro
                    try:
                        manifest = json.loads(content)
                        return {"success": True, "manifest": manifest}
                    except json.JSONDecodeError:
                        # Se falhar, tentar limpeza
                        cleaned_content = self.clean_json_content(content)
                        manifest = json.loads(cleaned_content)
                        return {"success": True, "manifest": manifest}
                        
                except (UnicodeDecodeError, json.JSONDecodeError):
                    continue
                except Exception as e:
                    print(f"Erro com encoding {encoding}: {e}")
                    continue
            
            # Se todos os encodings falharam, tentar leitura binária
            try:
                with open(manifest_path, 'rb') as f:
                    raw_data = f.read()
                
                # Tentar detectar e corrigir problemas de encoding
                for encoding in encodings:
                    try:
                        content = raw_data.decode(encoding, errors='replace')
                        # Remover caracteres de substituição
                        content = content.replace('\ufffd', '')
                        
                        cleaned_content = self.clean_json_content(content)
                        manifest = json.loads(cleaned_content)
                        return {"success": True, "manifest": manifest}
                    except:
                        continue
                        
            except Exception as e:
                print(f"Erro na leitura binária: {e}")
            
            return {"success": False, "error": "Não foi possível ler o manifest com nenhuma estratégia"}
            
        except Exception as e:
            return {"success": False, "error": f"Erro geral: {str(e)}"}
    
    def clean_json_content(self, content):
        """Limpa conteúdo JSON removendo caracteres problemáticos"""
        try:
            # Remover caracteres de controle ASCII problemáticos
            # Manter apenas: tab (9), newline (10), carriage return (13), e printable (32-126)
            cleaned = ""
            for char in content:
                code = ord(char)
                if code == 9 or code == 10 or code == 13 or (32 <= code <= 126) or code > 126:
                    cleaned += char
                else:
                    cleaned += " "  # Substituir por espaço
            
            # Remover comentários JavaScript
            # Comentários de linha //
            cleaned = re.sub(r'//.*?(?=\n|$)', '', cleaned, flags=re.MULTILINE)
            
            # Comentários de bloco /* */
            cleaned = re.sub(r'/\*.*?\*/', '', cleaned, flags=re.DOTALL)
            
            # Remover vírgulas extras antes de } ou ]
            cleaned = re.sub(r',\s*([}\]])', r'\1', cleaned)
            
            # Normalizar espaços em branco
            cleaned = re.sub(r'\s+', ' ', cleaned)
            cleaned = cleaned.strip()
            
            return cleaned
            
        except Exception as e:
            print(f"Erro ao limpar JSON: {e}")
            return content
    
    def read_manifest(self, manifest_path):
        """Lê e processa o manifest.json de um addon"""
        try:
            result = self.read_manifest_robust(manifest_path)
            
            if not result["success"]:
                print(f"Erro ao ler manifest {manifest_path}: {result['error']}")
                return result
            
            manifest = result["manifest"]
            
            # Validar estrutura básica
            if not isinstance(manifest, dict):
                return {"success": False, "error": "Manifest não é um objeto JSON válido"}
            
            header = manifest.get("header", {})
            if not isinstance(header, dict):
                return {"success": False, "error": "Header do manifest inválido"}
            
            # Extrair informações
            uuid = header.get("uuid")
            if not uuid:
                return {"success": False, "error": "UUID não encontrado no header"}
            
            return {
                "success": True,
                "manifest": manifest,
                "uuid": uuid,
                "version": header.get("version", [1, 0, 0]),
                "name": header.get("name", "Addon sem nome"),
                "description": header.get("description", ""),
                "modules": manifest.get("modules", [])
            }
            
        except Exception as e:
            error_msg = f"Erro ao processar manifest: {str(e)}"
            print(f"Erro ao ler manifest {manifest_path}: {error_msg}")
            return {"success": False, "error": error_msg}
    
    def get_addon_type(self, modules):
        """Determina o tipo do addon baseado nos módulos"""
        types = []
        for module in modules:
            module_type = module.get("type", "")
            if module_type in ["data", "script"]:
                types.append("behavior")
            elif module_type == "resources":
                types.append("resource")
        
        return list(set(types))  # Remove duplicatas
    
    def get_installed_addons(self):
        """Lista addons instalados"""
        if not self.behavior_packs_path or not self.resource_packs_path:
            return {"error": "Caminho do servidor não definido"}
        
        try:
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
                            manifest_info = self.read_manifest(manifest_path)
                            if manifest_info["success"]:
                                addon_info = {
                                    "folder": addon_dir.name,
                                    "name": manifest_info["name"],
                                    "description": manifest_info["description"],
                                    "uuid": manifest_info["uuid"],
                                    "version": manifest_info["version"]
                                }
                                addons["behavior_packs"].append(addon_info)
                            else:
                                print(f"❌ Erro ao ler manifest de {addon_dir.name}: {manifest_info.get('error', 'Erro desconhecido')}")
            
            # Listar resource packs
            if self.resource_packs_path.exists():
                for addon_dir in self.resource_packs_path.iterdir():
                    if addon_dir.is_dir():
                        manifest_path = addon_dir / "manifest.json"
                        if manifest_path.exists():
                            manifest_info = self.read_manifest(manifest_path)
                            if manifest_info["success"]:
                                addon_info = {
                                    "folder": addon_dir.name,
                                    "name": manifest_info["name"],
                                    "description": manifest_info["description"],
                                    "uuid": manifest_info["uuid"],
                                    "version": manifest_info["version"]
                                }
                                addons["resource_packs"].append(addon_info)
                            else:
                                print(f"❌ Erro ao ler manifest de {addon_dir.name}: {manifest_info.get('error', 'Erro desconhecido')}")
            
            return {"success": True, "addons": addons}
            
        except Exception as e:
            return {"error": f"Erro ao listar addons: {str(e)}"}
    
    def extract_addon_safely(self, addon_path, temp_dir):
        """Extrai addon de forma segura"""
        try:
            with zipfile.ZipFile(addon_path, 'r') as zip_ref:
                # Verificar arquivos antes de extrair
                for member in zip_ref.namelist():
                    # Prevenir path traversal
                    if os.path.isabs(member) or ".." in member:
                        print(f"⚠️ Arquivo ignorado por segurança: {member}")
                        continue
                    
                    # Limitar tamanho do arquivo
                    info = zip_ref.getinfo(member)
                    if info.file_size > 100 * 1024 * 1024:  # 100MB max
                        print(f"⚠️ Arquivo muito grande ignorado: {member}")
                        continue
                    
                    # Extrair arquivo
                    try:
                        zip_ref.extract(member, temp_dir)
                    except Exception as e:
                        print(f"⚠️ Erro ao extrair {member}: {e}")
                        continue
            
            return True
        except Exception as e:
            print(f"❌ Erro ao extrair addon: {e}")
            return False
    
    def find_manifest_files(self, temp_dir):
        """Encontra todos os arquivos manifest.json no diretório"""
        manifest_files = []
        
        try:
            for root, dirs, files in os.walk(temp_dir):
                for file in files:
                    if file.lower() == "manifest.json":
                        manifest_files.append(Path(root) / file)
        except Exception as e:
            print(f"Erro ao procurar manifests: {e}")
        
        return manifest_files
    
    def import_addon(self, addon_path):
        """Importa e aplica um addon"""
        if not self.behavior_packs_path or not self.resource_packs_path:
            return {"success": False, "error": "Caminho do servidor não definido"}
        
        try:
            addon_path = Path(addon_path)
            
            if not addon_path.exists():
                return {"success": False, "error": "Arquivo de addon não encontrado"}
            
            # Verificar extensão
            if addon_path.suffix.lower() not in ['.zip', '.mcaddon']:
                return {"success": False, "error": "Formato não suportado. Use .zip ou .mcaddon"}
            
            # Criar pasta temporária
            temp_dir = self.server_path / "temp_addon_import"
            if temp_dir.exists():
                shutil.rmtree(temp_dir)
            temp_dir.mkdir(exist_ok=True)
            
            try:
                print(f"📦 Extraindo addon: {addon_path.name}")
                
                # Extrair addon de forma segura
                if not self.extract_addon_safely(addon_path, temp_dir):
                    return {"success": False, "error": "Erro ao extrair arquivo do addon"}
                
                # Procurar arquivos manifest.json
                manifest_files = self.find_manifest_files(temp_dir)
                
                if not manifest_files:
                    return {"success": False, "error": "manifest.json não encontrado no addon"}
                
                print(f"📋 Encontrados {len(manifest_files)} manifest(s)")
                
                results = []
                
                for manifest_file in manifest_files:
                    print(f"🔍 Processando manifest: {manifest_file}")
                    
                    addon_dir = manifest_file.parent
                    manifest_info = self.read_manifest(manifest_file)
                    
                    if not manifest_info["success"]:
                        print(f"❌ Erro ao ler manifest {manifest_file}: {manifest_info.get('error', 'Erro desconhecido')}")
                        continue
                    
                    # Validar UUID
                    if not manifest_info["uuid"]:
                        print(f"❌ Manifest sem UUID válido: {manifest_file}")
                        continue
                    
                    addon_types = self.get_addon_type(manifest_info["modules"])
                    if not addon_types:
                        print(f"❌ Tipo de addon não identificado: {manifest_file}")
                        continue
                    
                    addon_name = manifest_info["name"] or addon_dir.name
                    print(f"✅ Addon válido encontrado: {addon_name} (Tipos: {addon_types})")
                    
                    # Instalar addon nas pastas apropriadas
                    for addon_type in addon_types:
                        if addon_type == "behavior":
                            target_path = self.behavior_packs_path / addon_name
                        elif addon_type == "resource":
                            target_path = self.resource_packs_path / addon_name
                        else:
                            continue
                        
                        # Remover se já existir
                        if target_path.exists():
                            print(f"🔄 Substituindo addon existente: {target_path}")
                            shutil.rmtree(target_path)
                        
                        # Copiar addon
                        shutil.copytree(addon_dir, target_path)
                        print(f"📁 Addon instalado em: {target_path}")
                        
                        # Aplicar ao mundo atual
                        apply_result = self.apply_addon_to_world(manifest_info, addon_type)
                        
                        results.append({
                            "type": addon_type,
                            "name": addon_name,
                            "uuid": manifest_info["uuid"],
                            "applied": apply_result
                        })
                
                if results:
                    return {
                        "success": True,
                        "message": f"✅ {len(results)} addon(s) instalado(s) e aplicado(s) com sucesso!",
                        "installed": results
                    }
                else:
                    return {"success": False, "error": "❌ Nenhum addon válido encontrado"}
                    
            finally:
                # Limpar pasta temporária
                if temp_dir.exists():
                    shutil.rmtree(temp_dir)
                    
        except Exception as e:
            return {"success": False, "error": f"Erro ao importar addon: {str(e)}"}
    
    def apply_addon_to_world(self, manifest_info, addon_type):
        """Aplica addon ao mundo atual"""
        try:
            # Encontrar mundo atual
            world_dirs = [d for d in self.worlds_path.iterdir() if d.is_dir()]
            
            if not world_dirs:
                print("⚠️ Nenhum mundo encontrado")
                return False
            
            world_dir = world_dirs[0]  # Usar primeiro mundo encontrado
            print(f"🌍 Aplicando ao mundo: {world_dir.name}")
            
            if addon_type == "behavior":
                json_file = world_dir / "world_behavior_packs.json"
            elif addon_type == "resource":
                json_file = world_dir / "world_resource_packs.json"
            else:
                return False
            
            # Ler arquivo JSON atual ou criar novo
            if json_file.exists():
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        world_packs = json.load(f)
                except Exception as e:
                    print(f"⚠️ Erro ao ler {json_file}: {e}, criando novo")
                    world_packs = []
            else:
                world_packs = []
            
            # Verificar se addon já está aplicado
            addon_uuid = manifest_info["uuid"]
            for pack in world_packs:
                if pack.get("pack_id") == addon_uuid:
                    print(f"ℹ️ Addon já aplicado: {addon_uuid}")
                    return True  # Já aplicado
            
            # Adicionar addon
            new_pack = {
                "pack_id": addon_uuid,
                "version": manifest_info["version"]
            }
            world_packs.append(new_pack)
            
            # Salvar arquivo
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(world_packs, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Addon aplicado ao mundo: {manifest_info['name']}")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao aplicar addon ao mundo: {e}")
            return False
    
    def remove_addon_from_world(self, addon_uuid, addon_type):
        """Remove addon do mundo atual"""
        try:
            # Encontrar mundo atual
            world_dirs = [d for d in self.worlds_path.iterdir() if d.is_dir()]
            
            if not world_dirs:
                return False
            
            world_dir = world_dirs[0]  # Usar primeiro mundo encontrado
            
            if addon_type == "behavior":
                json_file = world_dir / "world_behavior_packs.json"
            elif addon_type == "resource":
                json_file = world_dir / "world_resource_packs.json"
            else:
                return False
            
            if not json_file.exists():
                return False
            
            # Ler arquivo atual
            with open(json_file, 'r', encoding='utf-8') as f:
                world_packs = json.load(f)
            
            # Remover addon
            original_count = len(world_packs)
            world_packs = [pack for pack in world_packs if pack.get("pack_id") != addon_uuid]
            
            if len(world_packs) == original_count:
                return False  # Addon não encontrado
            
            # Salvar arquivo
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(world_packs, f, indent=2, ensure_ascii=False)
            
            return True
            
        except Exception as e:
            print(f"Erro ao remover addon do mundo: {e}")
            return False