import customtkinter as ctk
from tkinter import messagebox
import os
import threading
import time
from src.gui.server_properties_tab import ServerPropertiesTab
from src.gui.world_manager_tab import WorldManagerTab
from src.gui.world_settings_tab import WorldSettingsTab
from src.gui.addon_manager_tab import AddonManagerTab
from src.gui.player_manager_tab import PlayerManagerTab
from src.gui.server_control_tab import ServerControlTab
from src.core.server_manager import ServerManager

class MinecraftPanel(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        # Definir ícone da janela
        try:
            self.iconbitmap("icon.ico")
            self.wm_iconbitmap("icon.ico")
        except Exception:
            pass  # Ignora erro se não encontrar o ícone
        
        # Flags de controle
        self._closing = False
        self._status_thread_running = False
        
        # Configurar janela principal com responsividade
        self.title("🎮 Minecraft Bedrock Server Manager")
        
        # Detectar tamanho da tela
        screen_width = self.winfo_screenwidth()
        screen_height = self.winfo_screenheight()
        
        # Definir tamanho baseado na tela
        if screen_width < 1200 or screen_height < 800:
            # Tela pequena - usar tamanho menor
            window_width = min(1100, int(screen_width * 0.9))
            window_height = min(750, int(screen_height * 0.85))
            self.geometry(f"{window_width}x{window_height}")
            self.minsize(900, 650)
        else:
            # Tela grande - usar tamanho padrão
            self.geometry("1300x850")
            self.minsize(1100, 750)
        
        # Centralizar janela
        self.center_window()
        
        # Verificar se está na pasta do servidor
        self.server_path = self.find_server_path()
        
        if self.server_path:
            # Inicializar gerenciador do servidor
            self.server_manager = ServerManager(self.server_path)
            
            self.setup_ui()
            
            # Iniciar thread de atualização de status
            self.start_status_update_thread()
        
        # Configurar evento de fechamento
        self.protocol("WM_DELETE_WINDOW", self.on_closing)
        
        # Configurar redimensionamento
        self.bind("<Configure>", self.on_window_resize)
    
    def center_window(self):
        """Centralizar janela na tela"""
        self.update_idletasks()
        width = self.winfo_width()
        height = self.winfo_height()
        x = (self.winfo_screenwidth() // 2) - (width // 2)
        y = (self.winfo_screenheight() // 2) - (height // 2)
        self.geometry(f"{width}x{height}+{x}+{y}")
    
    def on_window_resize(self, event):
        """Evento de redimensionamento da janela"""
        if event.widget == self and not self._closing:
            try:
                # Ajustar layout baseado no tamanho atual
                current_width = self.winfo_width()
                
                # Ajustar header baseado na largura
                if hasattr(self, 'status_frame') and self.status_frame.winfo_exists():
                    if current_width < 1000:
                        self.setup_compact_header()
                    else:
                        self.setup_normal_header()
            except:
                pass  # Ignorar erros durante redimensionamento
    
    def find_server_path(self):
        """Encontra o caminho do servidor Minecraft"""
        current_dir = os.getcwd()
        
        # Procurar por arquivos característicos do servidor
        server_files = ["bedrock_server.exe", "server.properties", "bedrock_server"]
        
        for file in server_files:
            if os.path.exists(os.path.join(current_dir, file)):
                return current_dir
                
        # Se não encontrou, perguntar ao usuário
        return self.ask_server_path()
    
    def ask_server_path(self):
        """Solicita o caminho do servidor ao usuário"""
        from tkinter import filedialog
        
        messagebox.showwarning(
            "Servidor não encontrado",
            "Não foi possível localizar os arquivos do servidor Minecraft Bedrock.\n"
            "Por favor, selecione a pasta do servidor."
        )
        
        path = filedialog.askdirectory(title="Selecione a pasta do servidor Minecraft Bedrock")
        
        if not path:
            messagebox.showerror("Erro", "Caminho do servidor é obrigatório!")
            self.quit()
            return None
            
        # Verificar se é uma pasta válida do servidor
        server_files = ["server.properties"]
        if not any(os.path.exists(os.path.join(path, file)) for file in server_files):
            messagebox.showerror(
                "Pasta inválida",
                "A pasta selecionada não parece conter um servidor Minecraft Bedrock válido."
            )
            self.quit()
            return None
            
        return path
    
    def setup_ui(self):
        """Configurar interface do usuário"""
        if not self.server_path:
            return

        # Header com informações de status (reduzido)
        self.header_frame = ctk.CTkFrame(self)
        self.header_frame.pack(fill="x", padx=10, pady=(8, 4))  # padding menor

        # Título responsivo com fonte menor
        title_size = 18 if self.winfo_width() < 1000 else 22
        title_label = ctk.CTkLabel(
            self.header_frame,
            text="🎮 Minecraft Server Manager",
            font=ctk.CTkFont(family="Segoe UI", size=title_size, weight="bold")
        )
        title_label.pack(pady=(8, 2))  # padding menor

        # Subtítulo menor
        subtitle_label = ctk.CTkLabel(
            self.header_frame,
            text="Gerenciador Completo para Servidores Bedrock Edition",
            font=ctk.CTkFont(family="Segoe UI", size=10),
            text_color="gray"
        )
        subtitle_label.pack(pady=(0, 4))  # padding menor

        # Frame de status mais compacto
        self.status_frame = ctk.CTkFrame(self.header_frame)
        self.status_frame.pack(fill="x", padx=4, pady=(0, 6))

        self.setup_normal_header()

        # Caminho do servidor (compacto)
        path_text = f"📁 {os.path.basename(self.server_path)}"
        if len(self.server_path) > 60:
            path_text = f"📁 ...{self.server_path[-57:]}"

        path_label = ctk.CTkLabel(
            self.header_frame,
            text=path_text,
            font=ctk.CTkFont(family="Consolas", size=9),
            text_color="gray"
        )
        path_label.pack(pady=(0, 4))

        # Notebook para abas
        self.notebook = ctk.CTkTabview(self)
        self.notebook.pack(fill="both", expand=True, padx=10, pady=(0, 10))

        # Criar abas
        self.create_tabs()
    
    def setup_normal_header(self):
        """Configurar header normal (tela grande)"""
        if self._closing or not hasattr(self, 'status_frame'):
            return
            
        try:
            # Limpar frame de status de forma segura
            self.clear_status_frame()
            
            # Status do servidor
            self.server_status_label = ctk.CTkLabel(
                self.status_frame,
                text="🔴 Servidor: Offline",
                font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold")
            )
            self.server_status_label.pack(side="left", padx=12, pady=5)
            
            # Jogadores online
            self.players_status_label = ctk.CTkLabel(
                self.status_frame,
                text="👥 Jogadores: 0/0",
                font=ctk.CTkFont(family="Segoe UI", size=13)
            )
            self.players_status_label.pack(side="left", padx=12, pady=5)
            
            # IP do servidor
            self.ip_status_label = ctk.CTkLabel(
                self.status_frame,
                text="🌐 IP: localhost:19132",
                font=ctk.CTkFont(family="Segoe UI", size=13)
            )
            self.ip_status_label.pack(side="left", padx=12, pady=5)
            
            # Status do Playit
            self.playit_status_label = ctk.CTkLabel(
                self.status_frame,
                text="🌍 Playit: Offline",
                font=ctk.CTkFont(family="Segoe UI", size=13)
            )
            self.playit_status_label.pack(side="right", padx=12, pady=5)
        except:
            pass  # Ignorar erros durante configuração
    
    def setup_compact_header(self):
        """Configurar header compacto (tela pequena)"""
        if self._closing or not hasattr(self, 'status_frame'):
            return
            
        try:
            # Limpar frame de status de forma segura
            self.clear_status_frame()
            
            # Primeira linha
            first_row = ctk.CTkFrame(self.status_frame)
            first_row.pack(fill="x", pady=2)
            
            # Status do servidor
            self.server_status_label = ctk.CTkLabel(
                first_row,
                text="🔴 Servidor: Offline",
                font=ctk.CTkFont(family="Segoe UI", size=12, weight="bold")
            )
            self.server_status_label.pack(side="left", padx=8, pady=3)
            
            # Jogadores online
            self.players_status_label = ctk.CTkLabel(
                first_row,
                text="👥 0/0",
                font=ctk.CTkFont(family="Segoe UI", size=12)
            )
            self.players_status_label.pack(side="right", padx=8, pady=3)
            
            # Segunda linha
            second_row = ctk.CTkFrame(self.status_frame)
            second_row.pack(fill="x", pady=2)
            
            # IP do servidor
            self.ip_status_label = ctk.CTkLabel(
                second_row,
                text="🌐 localhost:19132",
                font=ctk.CTkFont(family="Segoe UI", size=12)
            )
            self.ip_status_label.pack(side="left", padx=8, pady=3)
            
            # Status do Playit
            self.playit_status_label = ctk.CTkLabel(
                second_row,
                text="🌍 Playit: Off",
                font=ctk.CTkFont(family="Segoe UI", size=12)
            )
            self.playit_status_label.pack(side="right", padx=8, pady=3)
        except:
            pass  # Ignorar erros durante configuração
    
    def clear_status_frame(self):
        """Limpar frame de status de forma segura"""
        if not hasattr(self, 'status_frame') or self._closing:
            return
            
        try:
            # Obter lista de widgets filhos
            children = list(self.status_frame.winfo_children())
            
            # Destruir cada widget de forma segura
            for widget in children:
                try:
                    if widget.winfo_exists():
                        widget.destroy()
                except:
                    pass  # Ignorar erros de widgets já destruídos
        except:
            pass  # Ignorar erros gerais
    
    def create_tabs(self):
        """Criar todas as abas do painel"""
        try:
            # Aba 1: Controle do Servidor
            self.notebook.add("🎮 Servidor")
            self.server_control_tab = ServerControlTab(
                self.notebook.tab("🎮 Servidor"),
                self.server_path,
                self.server_manager
            )
            
            # Aba 2: Editor de server.properties
            self.notebook.add("⚙️ Config")
            self.server_properties_tab = ServerPropertiesTab(
                self.notebook.tab("⚙️ Config"),
                self.server_path
            )
            
            # Aba 3: Gerenciador de Mundos
            self.notebook.add("🌍 Mundos")
            self.world_manager_tab = WorldManagerTab(
                self.notebook.tab("🌍 Mundos"),
                self.server_path
            )
            
            # Aba 4: Configurações do Mundo
            self.notebook.add("🎯 Mundo")
            self.world_settings_tab = WorldSettingsTab(
                self.notebook.tab("🎯 Mundo"),
                self.server_path
            )
            
            # Aba 5: Gerenciador de Addons
            self.notebook.add("🧩 Addons")
            self.addon_manager_tab = AddonManagerTab(
                self.notebook.tab("🧩 Addons"),
                self.server_path
            )
            
            # Aba 6: Gerenciador de Jogadores
            self.notebook.add("👥 Players")
            self.player_manager_tab = PlayerManagerTab(
                self.notebook.tab("👥 Players"),
                self.server_path,
                self.server_manager
            )
        except Exception as e:
            print(f"Erro ao criar abas: {e}")
    
    def start_status_update_thread(self):
        """Iniciar thread para atualizar status"""
        def update_status():
            self._status_thread_running = True
            while self._status_thread_running and not self._closing:
                try:
                    if hasattr(self, 'server_manager') and not self._closing:
                        self.update_status_display()
                    time.sleep(2)  # Atualizar a cada 2 segundos
                except:
                    break
            self._status_thread_running = False
        
        status_thread = threading.Thread(target=update_status, daemon=True)
        status_thread.start()
    
    def update_status_display(self):
        """Atualizar display de status"""
        if self._closing:
            return
            
        try:
            status = self.server_manager.get_server_status()
            is_compact = self.winfo_width() < 1000
            
            # Verificar se os widgets ainda existem
            if not (hasattr(self, 'server_status_label') and 
                   self.server_status_label.winfo_exists()):
                return
            
            # Status do servidor
            if status['server_running']:
                self.server_status_label.configure(
                    text="🟢 Servidor: Online" if not is_compact else "🟢 Online",
                    text_color="green"
                )
            else:
                self.server_status_label.configure(
                    text="🔴 Servidor: Offline" if not is_compact else "🔴 Offline",
                    text_color="red"
                )
            
            # Jogadores online
            if hasattr(self, 'players_status_label') and self.players_status_label.winfo_exists():
                online_count = len(status['online_players'])
                max_players = status['max_players']
                if is_compact:
                    self.players_status_label.configure(
                        text=f"👥 {online_count}/{max_players}"
                    )
                else:
                    self.players_status_label.configure(
                        text=f"👥 Jogadores: {online_count}/{max_players}"
                    )
            
            # IP do servidor
            if hasattr(self, 'ip_status_label') and self.ip_status_label.winfo_exists():
                server_ip = status['server_ip']
                server_port = status['server_port']
                if is_compact:
                    # Mostrar apenas IP local em telas pequenas
                    if server_ip == "localhost":
                        ip_text = f"🌐 {server_ip}:{server_port}"
                    else:
                        ip_text = f"🌐 {server_ip.split('.')[-1]}:{server_port}"
                else:
                    ip_text = f"🌐 IP: {server_ip}:{server_port}"
                
                self.ip_status_label.configure(text=ip_text)
            
            # Status do Playit
            if hasattr(self, 'playit_status_label') and self.playit_status_label.winfo_exists():
                if status['playit_running']:
                    if is_compact:
                        playit_text = "🟢 Playit: On"
                    else:
                        playit_text = "🟢 Playit: Online"
                        if status['playit_url']:
                            # Encurtar URL em telas pequenas
                            url = status['playit_url']
                            if is_compact and len(url) > 20:
                                url = url[:17] + "..."
                            playit_text += f" ({url})"
                    
                    self.playit_status_label.configure(
                        text=playit_text,
                        text_color="green"
                    )
                else:
                    self.playit_status_label.configure(
                        text="🔴 Playit: Off" if is_compact else "🔴 Playit: Offline",
                        text_color="red"
                    )
                
        except Exception as e:
            print(f"Erro ao atualizar status: {e}")
    
    def on_closing(self):
        """Evento de fechamento da janela"""
        self._closing = True
        self._status_thread_running = False
        
        try:
            # Parar servidor se estiver rodando
            if hasattr(self, 'server_manager'):
                if self.server_manager.is_running:
                    result = messagebox.askyesno(
                        "Servidor Rodando",
                        "O servidor está rodando. Deseja pará-lo antes de fechar?"
                    )
                    if result:
                        try:
                            self.server_manager.stop_server()
                        except:
                            pass
                
                # Parar Playit se estiver rodando
                if self.server_manager.playit_running:
                    try:
                        self.server_manager.stop_playit()
                    except:
                        pass
        except:
            pass
        
        # Aguardar um pouco para threads terminarem
        time.sleep(0.5)
        
        # Fechar aplicação
        try:
            self.quit()
            self.destroy()
        except:
            pass