import os
import shutil
import zipfile
import tempfile
import time
from pathlib import Path
import json

class ServerUpdater:
    def __init__(self):
        self.server_path = None
        self.backup_path = None
        
        # Arquivos e pastas que devem ser preservados
        self.preserve_files = [
            'server.properties',
            'permissions.json',
            'allowlist.json',
            'ops.json'
        ]
        
        self.preserve_folders = [
            'worlds',
            'development_behavior_packs',
            'development_resource_packs',
            'config',
            'worlds_backup'
        ]
        
        # Binários que devem ser preservados
        self.preserve_binaries = [
            'playit.exe',
            'playit-linux',
            'playit'
        ]
    
    def set_server_path(self, path):
        """Define o caminho do servidor"""
        self.server_path = Path(path)
        self.backup_path = self.server_path.parent / "server_backups"
        self.backup_path.mkdir(exist_ok=True)
    
    def validate_new_server(self, new_server_path):
        """Valida se a nova versão contém um servidor Bedrock válido"""
        new_path = Path(new_server_path)
        
        if not new_path.exists():
            return {"success": False, "error": "Caminho não encontrado"}
        
        # Verificar se é um arquivo ZIP
        if new_path.is_file() and new_path.suffix.lower() == '.zip':
            return self.validate_zip_server(new_path)
        
        # Verificar se é uma pasta
        if new_path.is_dir():
            return self.validate_folder_server(new_path)
        
        return {"success": False, "error": "Selecione um arquivo ZIP ou pasta do servidor Bedrock"}
    
    def validate_zip_server(self, zip_path):
        """Valida servidor em arquivo ZIP"""
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                files = zip_ref.namelist()
                
                # Procurar pelo executável do servidor
                has_bedrock_exe = any('bedrock_server.exe' in f for f in files)
                has_bedrock_bin = any('bedrock_server' in f and not f.endswith('.exe') for f in files)
                
                if has_bedrock_exe or has_bedrock_bin:
                    return {"success": True, "type": "zip", "path": zip_path}
                else:
                    return {"success": False, "error": "Arquivo ZIP não contém bedrock_server.exe ou bedrock_server"}
        except Exception as e:
            return {"success": False, "error": f"Erro ao ler arquivo ZIP: {str(e)}"}
    
    def validate_folder_server(self, folder_path):
        """Valida servidor em pasta"""
        bedrock_exe = folder_path / "bedrock_server.exe"
        bedrock_bin = folder_path / "bedrock_server"
        
        if bedrock_exe.exists() or bedrock_bin.exists():
            return {"success": True, "type": "folder", "path": folder_path}
        else:
            return {"success": False, "error": "Pasta não contém bedrock_server.exe ou bedrock_server"}
    
    def create_backup(self):
        """Cria backup completo do servidor atual"""
        if not self.server_path or not self.server_path.exists():
            return {"success": False, "error": "Caminho do servidor não definido"}
        
        try:
            timestamp = int(time.time())
            backup_name = f"server_backup_{timestamp}"
            backup_full_path = self.backup_path / backup_name
            
            print(f"📦 Criando backup em: {backup_full_path}")
            
            # Copiar toda a pasta do servidor
            shutil.copytree(self.server_path, backup_full_path)
            
            # Criar arquivo ZIP do backup
            zip_backup_path = self.backup_path / f"{backup_name}.zip"
            with zipfile.ZipFile(zip_backup_path, 'w', zipfile.ZIP_DEFLATED) as zip_ref:
                for root, dirs, files in os.walk(backup_full_path):
                    for file in files:
                        file_path = Path(root) / file
                        arc_name = file_path.relative_to(backup_full_path)
                        zip_ref.write(file_path, arc_name)
            
            # Remover pasta temporária do backup
            shutil.rmtree(backup_full_path)
            
            return {
                "success": True,
                "backup_path": str(zip_backup_path),
                "backup_name": f"{backup_name}.zip"
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao criar backup: {str(e)}"}
    
    def extract_new_server(self, new_server_info):
        """Extrai nova versão do servidor"""
        if new_server_info["type"] == "zip":
            return self.extract_from_zip(new_server_info["path"])
        else:
            return {"success": True, "extracted_path": new_server_info["path"]}
    
    def extract_from_zip(self, zip_path):
        """Extrai servidor de arquivo ZIP"""
        try:
            temp_dir = tempfile.mkdtemp(prefix="bedrock_update_")
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            # Procurar pela pasta que contém o servidor
            temp_path = Path(temp_dir)
            
            # Verificar se os arquivos estão na raiz
            if (temp_path / "bedrock_server.exe").exists() or (temp_path / "bedrock_server").exists():
                return {"success": True, "extracted_path": temp_path}
            
            # Procurar em subpastas
            for item in temp_path.iterdir():
                if item.is_dir():
                    if (item / "bedrock_server.exe").exists() or (item / "bedrock_server").exists():
                        return {"success": True, "extracted_path": item}
            
            return {"success": False, "error": "Servidor não encontrado no arquivo extraído"}
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao extrair arquivo: {str(e)}"}
    
    def preserve_important_data(self):
        """Preserva dados importantes do servidor atual"""
        preserved_data = {}
        
        try:
            # Preservar arquivos
            for file_name in self.preserve_files:
                file_path = self.server_path / file_name
                if file_path.exists():
                    with open(file_path, 'rb') as f:
                        preserved_data[file_name] = f.read()
            
            # Preservar binários do Playit
            for binary_name in self.preserve_binaries:
                binary_path = self.server_path / binary_name
                if binary_path.exists():
                    with open(binary_path, 'rb') as f:
                        preserved_data[binary_name] = f.read()
            
            # Preservar pastas (criar backup temporário)
            temp_preserve_dir = tempfile.mkdtemp(prefix="preserve_")
            preserved_data['_temp_folders'] = temp_preserve_dir
            
            for folder_name in self.preserve_folders:
                folder_path = self.server_path / folder_name
                if folder_path.exists():
                    dest_path = Path(temp_preserve_dir) / folder_name
                    shutil.copytree(folder_path, dest_path)
            
            return {"success": True, "data": preserved_data}
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao preservar dados: {str(e)}"}
    
    def restore_preserved_data(self, preserved_data):
        """Restaura dados preservados"""
        try:
            # Restaurar arquivos
            for file_name, file_data in preserved_data.items():
                if file_name.startswith('_'):
                    continue
                
                file_path = self.server_path / file_name
                with open(file_path, 'wb') as f:
                    f.write(file_data)
            
            # Restaurar pastas
            if '_temp_folders' in preserved_data:
                temp_dir = Path(preserved_data['_temp_folders'])
                
                for folder_name in self.preserve_folders:
                    temp_folder = temp_dir / folder_name
                    if temp_folder.exists():
                        dest_folder = self.server_path / folder_name
                        if dest_folder.exists():
                            shutil.rmtree(dest_folder)
                        shutil.copytree(temp_folder, dest_folder)
                
                # Limpar pasta temporária
                shutil.rmtree(temp_dir)
            
            return {"success": True}
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao restaurar dados: {str(e)}"}
    
    def update_server(self, new_server_path):
        """Executa atualização completa do servidor"""
        if not self.server_path:
            return {"success": False, "error": "Caminho do servidor não definido"}
        
        try:
            # 1. Validar nova versão
            print("🔍 Validando nova versão do servidor...")
            validation = self.validate_new_server(new_server_path)
            if not validation["success"]:
                return validation
            
            # 2. Criar backup
            print("📦 Criando backup do servidor atual...")
            backup_result = self.create_backup()
            if not backup_result["success"]:
                return backup_result
            
            # 3. Preservar dados importantes
            print("💾 Preservando dados importantes...")
            preserve_result = self.preserve_important_data()
            if not preserve_result["success"]:
                return preserve_result
            
            # 4. Extrair nova versão
            print("📂 Extraindo nova versão...")
            extract_result = self.extract_new_server(validation)
            if not extract_result["success"]:
                return extract_result
            
            # 5. Limpar pasta atual (exceto dados preservados)
            print("🧹 Limpando pasta do servidor...")
            self.clean_server_folder()
            
            # 6. Copiar nova versão
            print("📋 Copiando nova versão...")
            copy_result = self.copy_new_server(extract_result["extracted_path"])
            if not copy_result["success"]:
                return copy_result
            
            # 7. Restaurar dados preservados
            print("🔄 Restaurando dados preservados...")
            restore_result = self.restore_preserved_data(preserve_result["data"])
            if not restore_result["success"]:
                return restore_result
            
            # 8. Limpar arquivos temporários
            if validation["type"] == "zip":
                temp_path = Path(extract_result["extracted_path"])
                if temp_path.exists() and "temp" in str(temp_path):
                    shutil.rmtree(temp_path.parent)
            
            return {
                "success": True,
                "message": "Servidor atualizado com sucesso!",
                "backup_file": backup_result["backup_name"]
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro durante atualização: {str(e)}"}
    
    def clean_server_folder(self):
        """Limpa pasta do servidor mantendo apenas dados importantes"""
        for item in self.server_path.iterdir():
            # Pular arquivos e pastas preservados
            if item.name in self.preserve_files or item.name in self.preserve_folders or item.name in self.preserve_binaries:
                continue
            
            try:
                if item.is_file():
                    item.unlink()
                elif item.is_dir():
                    shutil.rmtree(item)
            except Exception as e:
                print(f"⚠️ Erro ao remover {item}: {e}")
    
    def copy_new_server(self, source_path):
        """Copia arquivos da nova versão"""
        try:
            source = Path(source_path)
            
            for item in source.iterdir():
                dest = self.server_path / item.name
                
                # Pular se já existe e é um arquivo/pasta preservado
                if dest.exists() and (item.name in self.preserve_files or 
                                    item.name in self.preserve_folders or 
                                    item.name in self.preserve_binaries):
                    continue
                
                if item.is_file():
                    shutil.copy2(item, dest)
                elif item.is_dir():
                    if dest.exists():
                        shutil.rmtree(dest)
                    shutil.copytree(item, dest)
            
            return {"success": True}
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao copiar arquivos: {str(e)}"}
    
    def get_server_info(self):
        """Obtém informações do servidor atual"""
        if not self.server_path or not self.server_path.exists():
            return {"error": "Servidor não encontrado"}
        
        try:
            info = {
                "path": str(self.server_path),
                "has_bedrock_exe": (self.server_path / "bedrock_server.exe").exists(),
                "has_bedrock_bin": (self.server_path / "bedrock_server").exists(),
                "has_playit": any((self.server_path / binary).exists() for binary in self.preserve_binaries),
                "preserved_files": [],
                "preserved_folders": []
            }
            
            # Verificar arquivos preservados
            for file_name in self.preserve_files:
                if (self.server_path / file_name).exists():
                    info["preserved_files"].append(file_name)
            
            # Verificar pastas preservadas
            for folder_name in self.preserve_folders:
                folder_path = self.server_path / folder_name
                if folder_path.exists():
                    # Contar itens na pasta
                    try:
                        item_count = len(list(folder_path.iterdir()))
                        info["preserved_folders"].append({
                            "name": folder_name,
                            "items": item_count
                        })
                    except:
                        info["preserved_folders"].append({
                            "name": folder_name,
                            "items": "?"
                        })
            
            return {"success": True, "info": info}
            
        except Exception as e:
            return {"error": f"Erro ao obter informações: {str(e)}"}
    
    def list_backups(self):
        """Lista backups disponíveis"""
        if not self.backup_path or not self.backup_path.exists():
            return {"success": True, "backups": []}
        
        try:
            backups = []
            
            for backup_file in self.backup_path.glob("server_backup_*.zip"):
                try:
                    # Extrair timestamp do nome
                    timestamp_str = backup_file.stem.split('_')[-1]
                    timestamp = int(timestamp_str)
                    
                    # Converter para data legível
                    import datetime
                    date_str = datetime.datetime.fromtimestamp(timestamp).strftime("%d/%m/%Y %H:%M:%S")
                    
                    # Obter tamanho do arquivo
                    size_bytes = backup_file.stat().st_size
                    if size_bytes < 1024 * 1024:
                        size_str = f"{size_bytes / 1024:.1f} KB"
                    else:
                        size_str = f"{size_bytes / (1024 * 1024):.1f} MB"
                    
                    backups.append({
                        "name": backup_file.name,
                        "path": str(backup_file),
                        "date": date_str,
                        "size": size_str,
                        "timestamp": timestamp
                    })
                except:
                    continue
            
            # Ordenar por timestamp (mais recente primeiro)
            backups.sort(key=lambda x: x["timestamp"], reverse=True)
            
            return {"success": True, "backups": backups}
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao listar backups: {str(e)}"}