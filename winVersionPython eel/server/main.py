#!/usr/bin/env python3
"""
Painel de Administração Minecraft Bedrock Server
"""

import eel
import os
import sys
import subprocess
import threading
import time
import platform
import psutil
import webbrowser
import socket
from pathlib import Path
import json
import queue
import traceback
import tempfile
import logging

# Configurar encoding para Windows
if platform.system() == 'Windows':
    import locale
    try:
        # Tentar configurar UTF-8
        os.system('chcp 65001 >nul 2>&1')
        locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')
    except:
        try:
            locale.setlocale(locale.LC_ALL, 'Portuguese_Brazil.1252')
        except:
            pass

# --- VERIFICAÇÃO DE PYTHON PORTÁTIL OU SISTEMA ---
def check_python_available():
    """
    Garante que o Python está disponível (portátil ou sistema).
    Se não encontrar, exibe mensagem clara e encerra.
    """
    # Prioriza o Python instalado pelo setup
    python_setup = r"C:\Program Files\Python313\python.exe"
    if os.path.exists(python_setup):
        return True
    # Verifica python portátil na pasta do painel
    base_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
    python_portable = os.path.join(base_dir, "python", "python.exe")
    if os.path.exists(python_portable):
        return True
    # Verifica python do sistema
    import shutil
    if shutil.which("python") or shutil.which("python3"):
        return True
    # Caminhos comuns no Windows
    possible = [
        python_setup,
        r"C:\Python39\python.exe",
        r"C:\Python38\python.exe",
        r"C:\Python37\python.exe",
        r"C:\Python311\python.exe",
        r"C:\Python310\python.exe",
        r"C:\Python312\python.exe",
        r"C:\Program Files\Python39\python.exe",
        r"C:\Program Files\Python311\python.exe",
        r"C:\Program Files\Python310\python.exe",
        r"C:\Program Files\Python312\python.exe",
    ]
    for path in possible:
        if os.path.exists(path):
            return True
    # Se não encontrou, exibe mensagem e encerra
    msg = (
        "\n[ERRO] Python não encontrado!\n"
        "O painel requer Python para funcionar.\n"
        "Se você instalou pelo instalador, certifique-se que a pasta 'python' está junto do executável.\n"
        "Ou instale o Python em https://www.python.org/downloads/ e adicione ao PATH do sistema.\n"
        "Se estiver usando Windows 11, desative o alias 'python' da Microsoft Store em Configurações > Aplicativos > Aliases de execução do aplicativo.\n"
        "Pressione Enter para sair..."
    )
    print(msg)
    try:
        input()
    except Exception:
        pass
    sys.exit(1)

# Chama a verificação logo no início
check_python_available()

# Importar módulos do painel
from editor_server import ServerPropertiesEditor
from mundos import WorldManager
from addons import AddonManager
from jogadores import PlayerManager
from rede import NetworkManager
from servidor import ServerManager
from world_config import WorldConfigManager
from updater import ServerUpdater

# Configuração básica de logging para arquivo e console
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("painel_debug.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)

def safe_print(message):
    """Imprime mensagem de forma segura, tratando problemas de encoding"""
    try:
        # Remover emojis e caracteres especiais para compatibilidade
        safe_message = message
        emoji_replacements = {
            '🎮': '[GAME]',
            '📂': '[FOLDER]',
            '📁': '[FILE]',
            '✅': '[OK]',
            '❌': '[ERROR]',
            '⚠️': '[WARNING]',
            '🔍': '[SEARCH]',
            '🔌': '[PLUGIN]',
            '🖥️': '[DESKTOP]',
            '🌐': '[WEB]',
            '🔗': '[LINK]',
            '⏳': '[WAIT]',
            '📋': '[CLIPBOARD]',
            '🚀': '[ROCKET]',
            '⚡': '[FAST]',
            '🎯': '[TARGET]',
            '💾': '[SAVE]',
            '🔄': '[REFRESH]',
            '📦': '[PACKAGE]',
            '🌍': '[WORLD]',
            '🧩': '[ADDON]',
            '👥': '[USERS]',
            '🖨️': '[PRINT]',
            '🔧': '[TOOL]',
            '📝': '[NOTE]',
            '🟢': '[ONLINE]',
            '🔴': '[OFFLINE]',
            '⏹️': '[STOP]',
            '▶️': '[PLAY]'
        }
        
        for emoji, replacement in emoji_replacements.items():
            safe_message = safe_message.replace(emoji, replacement)
        
        print(safe_message)
        logging.info(safe_message)
    except UnicodeEncodeError:
        # Fallback para ASCII se houver problemas de encoding
        try:
            ascii_message = message.encode('ascii', errors='replace').decode('ascii')
            print(ascii_message)
        except:
            print("Mensagem com caracteres especiais")
            logging.warning("Mensagem com caracteres especiais")

def is_running_as_executable():
    """Verifica se está rodando como executável PyInstaller"""
    return getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS')

def find_web_folder():
    """Encontra a pasta web em diferentes localizações"""
    possible_paths = []
    
    if is_running_as_executable():
        # Executável PyInstaller - pasta web incorporada
        if hasattr(sys, '_MEIPASS'):
            possible_paths.append(Path(sys._MEIPASS) / 'web')
        
        # Pasta web junto ao executável
        exe_dir = Path(sys.executable).parent
        possible_paths.append(exe_dir / 'web')
        
        # Pasta web no diretório atual
        possible_paths.append(Path.cwd() / 'web')
    else:
        # Modo desenvolvimento
        script_dir = Path(__file__).parent.parent
        possible_paths.append(script_dir / 'web')
        possible_paths.append(Path.cwd() / 'web')
    
    # Verificar cada caminho possível
    for path in possible_paths:
        if path.exists() and (path / 'index.html').exists():
            safe_print(f"Pasta web encontrada: {path}")
            return path
    
    safe_print("ERRO: Pasta web nao encontrada em nenhuma localizacao!")
    safe_print("Localizacoes verificadas:")
    for path in possible_paths:
        safe_print(f"  - {path} {'(existe)' if path.exists() else '(nao existe)'}")
    
    return None

# Configurar pasta web
web_folder = find_web_folder()
if web_folder:
    eel.init(str(web_folder))
    safe_print(f"Eel inicializado com sucesso")
else:
    safe_print("ERRO: Nao foi possivel inicializar Eel - pasta web nao encontrada")
    sys.exit(1)

# Instâncias dos gerenciadores
server_editor = ServerPropertiesEditor()
world_manager = WorldManager()
addon_manager = AddonManager()
player_manager = PlayerManager()
network_manager = NetworkManager()
server_manager = ServerManager()
world_config_manager = WorldConfigManager("")
server_updater = ServerUpdater()

# Filas para logs
console_queue = queue.Queue()
playit_queue = queue.Queue()

def find_system_python():
    """Tenta encontrar o executável python do sistema para diálogos Tkinter"""
    import shutil
    # 1. Prioriza o Python instalado pelo setup
    python_setup = r"C:\Program Files\Python313\python.exe"
    if os.path.exists(python_setup):
        return python_setup
    # 1. Procurar python portátil na pasta do painel
    local_python = Path(__file__).parent.parent / "python" / "python.exe"
    if local_python.exists():
        return str(local_python)
    # Tenta encontrar python.exe no PATH
    python_path = shutil.which("python")
    if python_path:
        return python_path
    # Tenta python3
    python3_path = shutil.which("python3")
    if python3_path:
        return python3_path
    # Tenta caminhos comuns no Windows
    possible = [
        python_setup,
        r"C:\Python39\python.exe",
        r"C:\Python38\python.exe",
        r"C:\Python37\python.exe",
        r"C:\Python311\python.exe",
        r"C:\Python310\python.exe",
        r"C:\Python312\python.exe",
        r"C:\Program Files\Python39\python.exe",
        r"C:\Program Files\Python311\python.exe",
        r"C:\Program Files\Python310\python.exe",
        r"C:\Program Files\Python312\python.exe",
        r"C:\Program Files\Python313\python.exe",
    ]
    for path in possible:
        if os.path.exists(path):
            return path
    return None

def run_dialog_script(script_content, timeout=30):
    """Executa script de diálogo de forma robusta"""
    try:
        logging.debug("Criando arquivo temporário para diálogo.")
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
            f.write(script_content)
            script_path = f.name
        logging.debug(f"Arquivo temporário criado: {script_path}")

        try:
            clean_env = os.environ.copy()
            for var in list(clean_env.keys()):
                if var.startswith('EEL_') or var.startswith('PYINSTALLER_') or var.startswith('PYTHON'):
                    clean_env.pop(var, None)

            if is_running_as_executable():
                # NOVO: Usar python do sistema, não o próprio executável
                system_python = find_system_python()
                if not system_python:
                    logging.error("Python do sistema não encontrado para diálogos Tkinter.")
                    return {"success": False, "error": "Python do sistema não encontrado para diálogos Tkinter. Instale o Python e adicione ao PATH."}
                logging.debug(f"Executando script de diálogo com: {system_python}")
                process = subprocess.Popen(
                    [system_python, script_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    encoding='utf-8',
                    errors='replace',
                    creationflags=subprocess.CREATE_NO_WINDOW if platform.system() == 'Windows' else 0,
                    env=clean_env
                )
            else:
                logging.debug("Executando script de diálogo em modo desenvolvimento (--dialog).")
                process = subprocess.Popen(
                    [sys.executable, __file__, "--dialog", script_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    encoding='utf-8',
                    errors='replace',
                    creationflags=subprocess.CREATE_NO_WINDOW if platform.system() == 'Windows' else 0,
                    env=clean_env
                )
            logging.debug("Aguardando resposta do diálogo...")
            try:
                stdout, stderr = process.communicate(timeout=timeout)
                logging.debug(f"Saída do diálogo: {stdout.strip()}")
                logging.debug(f"Erro do diálogo: {stderr.strip()}")
                if process.returncode == 0:
                    output = stdout.strip()
                    if output and output != "CANCELLED" and not output.startswith("ERROR:"):
                        logging.info(f"Diálogo retornou resultado: {output}")
                        return {"success": True, "result": output}
                    elif output.startswith("ERROR:"):
                        logging.error(f"Erro no diálogo: {output[6:]}")
                        return {"success": False, "error": f"Erro no dialogo: {output[6:]}"}
                    else:
                        logging.warning("Operação cancelada pelo usuário no diálogo.")
                        return {"success": False, "error": "Operacao cancelada pelo usuario"}
                else:
                    error_msg = stderr.strip() if stderr else "Erro desconhecido"
                    logging.error(f"Erro no processo do diálogo: {error_msg}")
                    return {"success": False, "error": f"Erro no processo: {error_msg}"}
            except subprocess.TimeoutExpired:
                process.kill()
                logging.error("Timeout - diálogo demorou muito para responder")
                return {"success": False, "error": "Timeout - dialogo demorou muito para responder"}
        finally:
            try:
                os.unlink(script_path)
                logging.debug(f"Arquivo temporário removido: {script_path}")
            except Exception as e:
                logging.warning(f"Erro ao remover arquivo temporário: {e}")
    except Exception as e:
        logging.exception("Erro ao executar diálogo")
        return {"success": False, "error": f"Erro ao executar dialogo: {str(e)}"}

def create_folder_dialog_script():
    """Cria script otimizado para seleção de pasta"""
    return '''
import sys
import os

def main():
    try:
        import tkinter as tk
        from tkinter import filedialog
        
        # Configurar janela root
        root = tk.Tk()
        root.withdraw()  # Esconder janela principal
        root.attributes('-topmost', True)  # Trazer para frente
        
        # Configurar diálogo
        folder_path = filedialog.askdirectory(
            title="Selecione a pasta do servidor Minecraft Bedrock",
            mustexist=True
        )
        
        # Fechar janela
        root.quit()
        root.destroy()
        
        # Retornar resultado
        if folder_path:
            print(folder_path)
        else:
            print("CANCELLED")
            
    except ImportError:
        print("ERROR:tkinter nao disponivel")
    except Exception as e:
        print(f"ERROR:{str(e)}")

if __name__ == "__main__":
    main()
'''

def create_file_dialog_script(file_types="*"):
    """Cria script otimizado para seleção de arquivo"""
    
    # Configurar tipos de arquivo
    if file_types == "world":
        filetypes_code = '[("Arquivos de Mundo", "*.zip"), ("Todos os arquivos", "*.*")]'
    elif file_types == "addon":
        filetypes_code = '[("Addons Minecraft", "*.zip;*.mcaddon"), ("Arquivos ZIP", "*.zip"), ("Todos os arquivos", "*.*")]'
    elif file_types == "server":
        filetypes_code = '[("Servidor Bedrock", "*.zip"), ("Todos os arquivos", "*.*")]'
    else:
        filetypes_code = '[("Todos os arquivos", "*.*")]'
    
    return f'''
import sys
import os

def main():
    try:
        import tkinter as tk
        from tkinter import filedialog
        
        # Configurar janela root
        root = tk.Tk()
        root.withdraw()  # Esconder janela principal
        root.attributes('-topmost', True)  # Trazer para frente
        
        # Configurar diálogo
        file_path = filedialog.askopenfilename(
            title="Selecionar arquivo",
            filetypes={filetypes_code}
        )
        
        # Fechar janela
        root.quit()
        root.destroy()
        
        # Retornar resultado
        if file_path:
            print(file_path)
        else:
            print("CANCELLED")
            
    except ImportError:
        print("ERROR:tkinter nao disponivel")
    except Exception as e:
        print(f"ERROR:{{str(e)}}")

if __name__ == "__main__":
    main()
'''

# Funções expostas para o frontend (mantendo todas as existentes)
@eel.expose
def get_server_config():
    """Retorna as configurações atuais do server.properties"""
    try:
        return server_editor.get_config()
    except Exception as e:
        return {"error": str(e)}

@eel.expose
def save_server_config(config):
    """Salva as configurações do server.properties"""
    try:
        result = server_editor.save_config(config)
        return {"success": True, "message": "Configuracoes salvas com sucesso!"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def get_current_world():
    """Retorna informações do mundo atual"""
    try:
        return world_manager.get_current_world_info()
    except Exception as e:
        return {"error": str(e)}

@eel.expose
def import_world(world_path):
    """Importa um novo mundo"""
    try:
        result = world_manager.import_world(world_path)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def activate_world(world_name):
    """Ativa um mundo específico"""
    try:
        result = world_manager.activate_world(world_name)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def delete_world(world_name):
    """Exclui um mundo"""
    try:
        result = world_manager.delete_world(world_name)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def backup_world():
    """Cria backup do mundo atual"""
    try:
        result = world_manager.backup_current_world()
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def get_installed_addons():
    """Lista addons instalados"""
    try:
        return addon_manager.get_installed_addons()
    except Exception as e:
        return {"error": str(e)}

@eel.expose
def import_addon(addon_path):
    """Importa e aplica um addon"""
    try:
        return addon_manager.import_addon(addon_path)
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def get_operators():
    """Lista operadores atuais"""
    try:
        return player_manager.get_operators()
    except Exception as e:
        return {"error": str(e)}

@eel.expose
def add_operator(nickname):
    """Adiciona um operador"""
    try:
        return player_manager.add_operator(nickname)
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def remove_operator(nickname):
    """Remove um operador"""
    try:
        return player_manager.remove_operator(nickname)
    except Exception as e:
        return {"success": False, "error": str(e)}

# Funções de Configuração do Mundo
@eel.expose
def get_world_settings():
    """Obter configurações do mundo atual"""
    try:
        if not world_config_manager.server_path:
            return {"success": False, "error": "Caminho do servidor nao definido"}
        
        settings = world_config_manager.load_world_settings()
        world_path = world_config_manager.get_current_world_path()
        world_name = world_path.name if world_path.exists() else "Mundo nao encontrado"
        
        return {
            "success": True,
            "settings": settings,
            "world_name": world_name
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def save_world_settings(settings):
    """Salvar configurações do mundo"""
    try:
        if not world_config_manager.server_path:
            return {"success": False, "error": "Caminho do servidor nao definido"}
        
        result = world_config_manager.save_world_settings(settings)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def get_default_world_settings():
    """Obter configurações padrão do mundo"""
    try:
        settings = world_config_manager.get_default_settings()
        return {"success": True, "settings": settings}
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def get_available_world_addons():
    """Obter addons disponíveis para aplicar ao mundo"""
    try:
        if not world_config_manager.server_path:
            return {"success": False, "error": "Caminho do servidor nao definido"}
        
        addons = world_config_manager.get_available_addons()
        
        # Filtrar addons já aplicados
        applied_addons = world_config_manager.get_world_addons()
        applied_uuids = set()
        
        for addon_list in applied_addons.values():
            for addon in addon_list:
                applied_uuids.add(addon["uuid"])
        
        # Remover addons já aplicados da lista disponível
        available_addons = {
            "behavior_packs": [addon for addon in addons["behavior_packs"] if addon["uuid"] not in applied_uuids],
            "resource_packs": [addon for addon in addons["resource_packs"] if addon["uuid"] not in applied_uuids]
        }
        
        return {"success": True, "addons": available_addons}
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def get_applied_world_addons():
    """Obter addons aplicados ao mundo atual"""
    try:
        if not world_config_manager.server_path:
            return {"success": False, "error": "Caminho do servidor nao definido"}
        
        addons = world_config_manager.get_world_addons()
        return {"success": True, "addons": addons}
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def apply_addon_to_world(addon_info):
    """Aplicar addon ao mundo atual"""
    try:
        if not world_config_manager.server_path:
            return {"success": False, "error": "Caminho do servidor nao definido"}
        
        # Determinar tipo do addon baseado na pasta onde está
        addon_type = "behavior"  # Padrão
        
        # Verificar se está na pasta de resource packs
        rp_path = world_config_manager.resource_packs_path / addon_info.get("folder", "")
        if rp_path.exists():
            addon_type = "resource"
        
        result = world_config_manager.apply_addon_to_world(addon_info, addon_type)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def remove_addon_from_world(addon_info):
    """Remover addon do mundo atual"""
    try:
        if not world_config_manager.server_path:
            return {"success": False, "error": "Caminho do servidor nao definido"}
        
        # Determinar tipo do addon
        addon_type = "behavior"  # Padrão
        
        # Verificar se está aplicado como resource pack
        applied_addons = world_config_manager.get_world_addons()
        for addon in applied_addons.get("resource_packs", []):
            if addon["uuid"] == addon_info["uuid"]:
                addon_type = "resource"
                break
        
        result = world_config_manager.remove_addon_from_world(addon_info, addon_type)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def select_server_folder():
    """Abre diálogo para selecionar pasta do servidor"""
    try:
        safe_print("[SEARCH] Abrindo dialogo de selecao de pasta...")
        logging.info("Iniciando seleção de pasta do servidor.")
        if is_running_as_executable():
            script_content = create_folder_dialog_script()
            result = run_dialog_script(script_content, timeout=60)
            logging.debug(f"Resultado do diálogo de pasta: {result}")
            if not result["success"]:
                safe_print(f"[ERROR] Erro no dialogo: {result['error']}")
                logging.error(f"Erro no diálogo: {result['error']}")
                return {"success": False, "error": result["error"]}
            folder_path = result["result"]
        else:
            import tkinter as tk
            from tkinter import filedialog
            root = tk.Tk()
            root.withdraw()
            root.attributes('-topmost', True)
            folder_path = filedialog.askdirectory(
                title="Selecione a pasta do servidor Minecraft Bedrock"
            )
            root.destroy()
            if not folder_path:
                logging.warning("Nenhuma pasta selecionada pelo usuário.")
                return {"success": False, "error": "Nenhuma pasta selecionada"}
        logging.info(f"Pasta selecionada: {folder_path}")
        server_path = Path(folder_path)
        bedrock_exe = server_path / "bedrock_server.exe"
        bedrock_bin = server_path / "bedrock_server"
        if not bedrock_exe.exists() and not bedrock_bin.exists():
            safe_print(f"[ERROR] Pasta invalida: {folder_path}")
            logging.error(f"Pasta inválida selecionada: {folder_path}")
            return {"success": False, "error": "Pasta nao contem um servidor Bedrock valido.\n\nProcure por 'bedrock_server.exe' (Windows) ou 'bedrock_server' (Linux)."}
        safe_print(f"[OK] Configurando pasta do servidor: {folder_path}")
        logging.info(f"Configurando gerenciadores para a pasta: {folder_path}")
        configure_server_managers(folder_path)
        safe_print(f"[TARGET] Pasta do servidor configurada com sucesso!")
        logging.info("Pasta do servidor configurada com sucesso.")
        return {"success": True, "path": folder_path}
    except Exception as e:
        error_msg = f"Erro ao selecionar pasta: {str(e)}"
        safe_print(f"[ERROR] {error_msg}")
        logging.exception("Erro ao selecionar pasta do servidor")
        return {"success": False, "error": error_msg}

def configure_server_managers(folder_path):
    """Configura todos os gerenciadores com o caminho do servidor"""
    server_editor.set_server_path(folder_path)
    world_manager.set_server_path(folder_path)
    addon_manager.set_server_path(folder_path)
    player_manager.set_server_path(folder_path)
    network_manager.set_server_path(folder_path)
    server_manager.set_server_path(folder_path)
    server_updater.set_server_path(folder_path)
    world_config_manager.server_path = Path(folder_path)
    world_config_manager.worlds_path = Path(folder_path) / "worlds"
    world_config_manager.behavior_packs_path = Path(folder_path) / "development_behavior_packs"
    world_config_manager.resource_packs_path = Path(folder_path) / "development_resource_packs"

@eel.expose
def select_file(file_types="*"):
    """Abre diálogo para selecionar arquivo"""
    try:
        safe_print(f"[FILE] Abrindo dialogo de selecao de arquivo ({file_types})...")
        
        if is_running_as_executable():
            # Executável PyInstaller - usar script separado
            script_content = create_file_dialog_script(file_types)
            result = run_dialog_script(script_content, timeout=60)
            
            if not result["success"]:
                safe_print(f"[ERROR] Erro no dialogo: {result['error']}")
                return {"success": False, "error": result["error"]}
            
            file_path = result["result"]
            safe_print(f"[OK] Arquivo selecionado: {file_path}")
            return {"success": True, "path": file_path}
            
        else:
            # Modo desenvolvimento
            import tkinter as tk
            from tkinter import filedialog
            
            root = tk.Tk()
            root.withdraw()
            root.attributes('-topmost', True)
            
            if file_types == "world":
                filetypes = [("Arquivos de Mundo", "*.zip"), ("Todos os arquivos", "*.*")]
            elif file_types == "addon":
                filetypes = [("Addons", "*.zip *.mcaddon"), ("Todos os arquivos", "*.*")]
            elif file_types == "server":
                filetypes = [("Servidor Bedrock", "*.zip"), ("Todos os arquivos", "*.*")]
            else:
                filetypes = [("Todos os arquivos", "*.*")]
            
            file_path = filedialog.askopenfilename(
                title="Selecionar arquivo",
                filetypes=filetypes
            )
            
            root.destroy()
            
            return {"success": bool(file_path), "path": file_path}
            
    except Exception as e:
        error_msg = f"Erro ao selecionar arquivo: {str(e)}"
        safe_print(f"[ERROR] {error_msg}")
        logging.exception("Erro ao selecionar arquivo")
        return {"success": False, "error": error_msg}

# Funções de Rede (Playit.gg) - Atualizadas
@eel.expose
def check_playit_status():
    """Verifica status do Playit"""
    try:
        return network_manager.get_playit_status()
    except Exception as e:
        return {"error": str(e)}

@eel.expose
def start_playit():
    """Inicia o túnel Playit"""
    try:
        result = network_manager.start_playit()
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def stop_playit():
    """Para o túnel Playit"""
    try:
        return network_manager.stop_playit()
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def restart_playit():
    """Reinicia o túnel Playit"""
    try:
        return network_manager.restart_playit()
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def get_playit_logs():
    """Retorna logs do Playit"""
    try:
        return network_manager.get_logs()
    except Exception as e:
        return []

@eel.expose
def get_tunnel_info():
    """Retorna informações detalhadas do túnel"""
    try:
        return network_manager.get_tunnel_info()
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def get_network_info():
    """Obtém informações de rede"""
    try:
        return network_manager.get_network_info()
    except Exception as e:
        return {"success": False, "error": str(e)}

# Funções do Servidor Minecraft
@eel.expose
def get_server_status():
    """Retorna status do servidor"""
    try:
        return server_manager.get_server_status()
    except Exception as e:
        return {"error": str(e)}

@eel.expose
def start_minecraft_server():
    """Inicia o servidor Minecraft"""
    try:
        result = server_manager.start_server()
        if result["success"]:
            # Iniciar thread para capturar logs
            threading.Thread(target=capture_server_logs, daemon=True).start()
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def stop_minecraft_server():
    """Para o servidor Minecraft"""
    try:
        return server_manager.stop_server()
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def send_server_command(command):
    """Envia comando para o servidor"""
    try:
        return server_manager.send_command(command)
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def get_server_logs():
    """Retorna logs do servidor"""
    logs = []
    try:
        while not console_queue.empty():
            logs.append(console_queue.get_nowait())
    except:
        pass
    return logs

# Funções do Atualizador de Servidor
@eel.expose
def get_server_info():
    """Obtém informações do servidor atual"""
    try:
        return server_updater.get_server_info()
    except Exception as e:
        return {"error": str(e)}

@eel.expose
def validate_new_server(server_path):
    """Valida nova versão do servidor"""
    try:
        return server_updater.validate_new_server(server_path)
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def update_server(new_server_path):
    """Executa atualização do servidor"""
    try:
        return server_updater.update_server(new_server_path)
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def list_server_backups():
    """Lista backups do servidor"""
    try:
        return server_updater.list_backups()
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def create_server_backup():
    """Cria backup manual do servidor"""
    try:
        return server_updater.create_backup()
    except Exception as e:
        return {"success": False, "error": str(e)}

# Novas funções para o painel remoto
@eel.expose
def start_remote_panel():
    """Inicia o painel remoto na porta 8080"""
    try:
        # Verificar se Flask está disponível
        try:
            import flask
        except ImportError:
            return {"success": False, "error": "Flask não instalado. Execute: pip install flask"}
        
        # Verificar se já está rodando
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('localhost', 8080))
            sock.close()
            
            if result == 0:
                return {"success": False, "error": "Porta 8080 já está em uso"}
        except:
            pass
        
        # Iniciar painel remoto em thread separada
        def run_remote():
            try:
                import subprocess
                script_path = Path(__file__).parent.parent / "run_remote_panel.py"
                
                cmd = [
                    sys.executable, 
                    str(script_path),
                    "--server-path", str(server_editor.server_path) if server_editor.server_path else "",
                    "--auto-tunnel"
                ]
                
                subprocess.Popen(cmd, creationflags=subprocess.CREATE_NEW_CONSOLE if platform.system() == 'Windows' else 0)
            except Exception as e:
                print(f"Erro ao iniciar painel remoto: {e}")
        
        threading.Thread(target=run_remote, daemon=True).start()
        
        return {
            "success": True,
            "message": "Painel remoto iniciado! Aguarde o túnel Playit.gg ser configurado.",
            "port": 8080
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@eel.expose
def get_remote_panel_status():
    """Verifica status do painel remoto"""
    try:
        import socket
        
        # Verificar se porta 8080 está ativa
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', 8080))
        sock.close()
        
        is_running = result == 0
        
        return {
            "success": True,
            "running": is_running,
            "port": 8080,
            "local_url": "http://localhost:8080" if is_running else None
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

def capture_server_logs():
    """Captura logs do servidor em tempo real"""
    while server_manager.server_process and server_manager.server_process.poll() is None:
        try:
            line = server_manager.server_process.stdout.readline()
            if line:
                console_queue.put(line.decode('utf-8', errors='ignore').strip())
            time.sleep(0.1)
        except:
            break

def find_available_port(start_port=8080):
    """Encontra uma porta disponível"""
    for port in range(start_port, start_port + 100):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    return start_port

def open_browser_delayed(url, delay=3):
    """Abre o navegador após um delay"""
    def open_browser():
        time.sleep(delay)
        try:
            safe_print(f"[WEB] Abrindo navegador: {url}")
            webbrowser.open(url)
            safe_print("[OK] Navegador aberto com sucesso!")
        except Exception as e:
            safe_print(f"[ERROR] Erro ao abrir navegador: {e}")
            safe_print(f"[LINK] Abra manualmente: {url}")
    
    thread = threading.Thread(target=open_browser, daemon=True)
    thread.start()

def main():
    """Função principal para iniciar o painel"""
    try:
        safe_print("[GAME] Iniciando Painel de Administracao Minecraft Bedrock...")
        logging.info("Iniciando painel principal.")
        safe_print("[FOLDER] Certifique-se de selecionar a pasta do servidor na primeira execucao")
        if not web_folder or not web_folder.exists():
            safe_print(f"[ERROR] ERRO: Pasta web nao encontrada!")
            logging.error("Pasta web não encontrada!")
            if not is_running_as_executable():
                input("Pressione Enter para sair...")
            return
        safe_print("[OK] Pasta web encontrada com sucesso")
        logging.info("Pasta web encontrada com sucesso.")
        port = find_available_port(8080)
        safe_print(f"[PLUGIN] Usando porta: {port}")
        logging.info(f"Usando porta: {port}")
        panel_url = f"http://localhost:{port}"
        eel_kwargs = dict(
            port=port,
            host='localhost',
            size=(1400, 900),
            close_callback=lambda page, sockets: None
        )
        if is_running_as_executable():
            eel_kwargs['mode'] = 'chrome'
            safe_print("[DESKTOP] Modo executável - tentando abrir em modo janela com Chrome")
            logging.info("Modo executável - Chrome.")
        else:
            eel_kwargs['mode'] = 'chrome'
            safe_print("[TOOL] Modo desenvolvimento - usando Chrome em modo app")
            logging.info("Modo desenvolvimento - Chrome.")
        safe_print("[WEB] Iniciando servidor web...")
        safe_print(f"[LINK] Painel estara disponivel em: {panel_url}")
        safe_print("[WAIT] Aguarde alguns segundos para o painel abrir...")
        logging.info(f"Painel estará disponível em: {panel_url}")
        eel.start('index.html', **eel_kwargs)
    except KeyboardInterrupt:
        safe_print("[WARNING] Painel interrompido pelo usuario")
        logging.warning("Painel interrompido pelo usuário (KeyboardInterrupt).")
    except Exception as e:
        safe_print(f"[ERROR] ERRO ao iniciar o painel: {e}")
        safe_print(f"[CLIPBOARD] Traceback: {traceback.format_exc()}")
        logging.exception("Erro ao iniciar o painel")
        if not is_running_as_executable():
            input("Pressione Enter para sair...")

if __name__ == "__main__":
    # --- Checagem para execução de diálogo ---
    if "--dialog" in sys.argv:
        idx = sys.argv.index("--dialog")
        if len(sys.argv) > idx + 1:
            dialog_script = sys.argv[idx + 1]
            logging.info(f"Executando modo diálogo: {dialog_script}")
            with open(dialog_script, "r", encoding="utf-8") as f:
                code = f.read()
            exec(code, {"__name__": "__main__"})
            sys.exit(0)
        else:
            logging.error("Caminho do script de diálogo não informado")
            print("ERROR: Caminho do script de diálogo não informado")
            sys.exit(1)
    else:
        main()