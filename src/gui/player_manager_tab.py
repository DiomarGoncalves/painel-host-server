import customtkinter as ctk
from tkinter import messagebox
import os
import threading
import time
from src.core.player_manager import PlayerManager

class PlayerManagerTab:
    def __init__(self, parent, server_path, server_manager):
        self.parent = parent
        self.server_path = server_path
        self.server_manager = server_manager
        self.manager = PlayerManager(server_path)
        self._destroyed = False
        self._update_thread_running = False
        
        self.setup_ui()
        self.refresh_player_list()
    
    def setup_ui(self):
        """Configurar interface da aba"""
        # Frame principal com scroll
        main_frame = ctk.CTkScrollableFrame(self.parent)
        main_frame.pack(fill="both", expand=True, padx=5, pady=5)
        
        # Título responsivo
        title_label = ctk.CTkLabel(
            main_frame,
            text="👥 Gerenciamento de Jogadores",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        title_label.pack(pady=(5, 15))
        
        # Frame de jogadores online
        online_frame = ctk.CTkFrame(main_frame)
        online_frame.pack(fill="x", padx=5, pady=5)
        
        ctk.CTkLabel(
            online_frame,
            text="🟢 Jogadores Online",
            font=ctk.CTkFont(size=13, weight="bold")
        ).pack(pady=(8, 3))
        
        self.online_players_list = ctk.CTkScrollableFrame(online_frame, height=80)
        self.online_players_list.pack(fill="x", padx=5, pady=5)
        
        # Frame para adicionar jogador
        add_frame = ctk.CTkFrame(main_frame)
        add_frame.pack(fill="x", padx=5, pady=5)
        
        ctk.CTkLabel(
            add_frame,
            text="➕ Adicionar Operador",
            font=ctk.CTkFont(size=13, weight="bold")
        ).pack(pady=(8, 3))
        
        # Campo de entrada e botão - layout responsivo
        input_frame = ctk.CTkFrame(add_frame)
        input_frame.pack(pady=8, padx=5)
        
        # Configurar grid responsivo
        input_frame.grid_columnconfigure(0, weight=1)
        
        self.player_entry = ctk.CTkEntry(
            input_frame,
            placeholder_text="Digite o nickname do jogador",
            font=ctk.CTkFont(size=11)
        )
        self.player_entry.grid(row=0, column=0, padx=5, pady=3, sticky="ew")
        
        self.add_button = ctk.CTkButton(
            input_frame,
            text="➕ Adicionar OP",
            command=self.add_player,
            height=32
        )
        self.add_button.grid(row=0, column=1, padx=5, pady=3)
        
        # Bind Enter key
        self.player_entry.bind("<Return>", lambda e: self.add_player())
        
        # Frame de jogadores
        players_frame = ctk.CTkFrame(main_frame)
        players_frame.pack(fill="both", expand=True, padx=5, pady=5)
        
        ctk.CTkLabel(
            players_frame,
            text="👑 Operadores Configurados",
            font=ctk.CTkFont(size=13, weight="bold")
        ).pack(pady=(8, 3))
        
        # Lista de jogadores
        self.players_listbox = ctk.CTkScrollableFrame(players_frame, height=150)
        self.players_listbox.pack(fill="both", expand=True, padx=5, pady=5)
        
        # Botões de ação - layout responsivo
        actions_frame = ctk.CTkFrame(players_frame)
        actions_frame.pack(fill="x", padx=5, pady=(0, 8))
        
        # Grid responsivo
        actions_frame.grid_columnconfigure(0, weight=1)
        actions_frame.grid_columnconfigure(1, weight=1)
        actions_frame.grid_columnconfigure(2, weight=1)
        
        self.refresh_button = ctk.CTkButton(
            actions_frame,
            text="🔄 Atualizar",
            command=self.refresh_player_list,
            height=32
        )
        self.refresh_button.grid(row=0, column=0, padx=2, pady=3, sticky="ew")
        
        self.remove_button = ctk.CTkButton(
            actions_frame,
            text="🗑️ Remover",
            command=self.remove_selected_player,
            height=32
        )
        self.remove_button.grid(row=0, column=1, padx=2, pady=3, sticky="ew")
        
        self.kick_button = ctk.CTkButton(
            actions_frame,
            text="⚠️ Expulsar",
            command=self.kick_selected_player,
            height=32
        )
        self.kick_button.grid(row=0, column=2, padx=2, pady=3, sticky="ew")
        
        self.selected_player = None
        
        # Iniciar atualização automática de jogadores online
        self.start_online_players_update()
    
    def start_online_players_update(self):
        """Iniciar atualização automática de jogadores online"""
        def update_online_players():
            self._update_thread_running = True
            while self._update_thread_running and not self._destroyed:
                try:
                    if not self._destroyed:
                        self.update_online_players_display()
                    time.sleep(3)  # Atualizar a cada 3 segundos
                except:
                    break
            self._update_thread_running = False
        
        update_thread = threading.Thread(target=update_online_players, daemon=True)
        update_thread.start()
    
    def safe_clear_frame(self, frame):
        """Limpar frame de forma segura"""
        if self._destroyed:
            return
            
        try:
            # Obter lista de widgets filhos
            children = list(frame.winfo_children())
            
            # Destruir cada widget de forma segura
            for widget in children:
                try:
                    if widget.winfo_exists():
                        widget.destroy()
                except:
                    pass  # Ignorar erros de widgets já destruídos
        except:
            pass  # Ignorar erros gerais
    
    def update_online_players_display(self):
        """Atualizar display de jogadores online"""
        if self._destroyed:
            return
            
        try:
            # Limpar lista atual de forma segura
            self.safe_clear_frame(self.online_players_list)
            
            # Obter jogadores online
            status = self.server_manager.get_server_status()
            online_players = status.get('online_players', [])
            
            if not online_players:
                no_players_label = ctk.CTkLabel(
                    self.online_players_list,
                    text="Nenhum jogador online",
                    text_color="gray"
                )
                no_players_label.pack(pady=10)
                return
            
            # Mostrar jogadores online
            for player_name in online_players:
                if self._destroyed:
                    break
                    
                player_frame = ctk.CTkFrame(self.online_players_list)
                player_frame.pack(fill="x", padx=3, pady=1)
                
                # Nome do jogador
                name_label = ctk.CTkLabel(
                    player_frame,
                    text=f"🟢 {player_name}",
                    font=ctk.CTkFont(size=11)
                )
                name_label.pack(side="left", padx=8, pady=3)
                
                # Verificar se é operador
                if self.manager.is_operator(player_name):
                    op_label = ctk.CTkLabel(
                        player_frame,
                        text="👑 OP",
                        font=ctk.CTkFont(size=9, weight="bold"),
                        text_color="gold"
                    )
                    op_label.pack(side="right", padx=8, pady=3)
                
        except Exception as e:
            if not self._destroyed:
                print(f"Erro ao atualizar jogadores online: {e}")
    
    def refresh_player_list(self):
        """Atualizar lista de jogadores operadores"""
        if self._destroyed:
            return
            
        try:
            # Limpar lista atual de forma segura
            self.safe_clear_frame(self.players_listbox)
            
            # Listar operadores
            operators = self.manager.list_operators()
            
            if not operators:
                no_players_label = ctk.CTkLabel(
                    self.players_listbox,
                    text="Nenhum operador configurado",
                    text_color="gray"
                )
                no_players_label.pack(pady=20)
                return
            
            for player in operators:
                if not self._destroyed:
                    self.create_player_item(player)
                
        except Exception as e:
            if not self._destroyed:
                messagebox.showerror("Erro", f"Erro ao atualizar lista de jogadores: {str(e)}")
    
    def create_player_item(self, player_info):
        """Criar item de jogador na lista"""
        if self._destroyed:
            return
            
        try:
            player_frame = ctk.CTkFrame(self.players_listbox)
            player_frame.pack(fill="x", padx=3, pady=1)
            
            # Radio button para seleção
            radio_var = ctk.StringVar(value="")
            radio = ctk.CTkRadioButton(
                player_frame,
                text="",
                variable=radio_var,
                value=player_info['name'],
                command=lambda: self.select_player(player_info)
            )
            radio.pack(side="left", padx=8, pady=3)
            
            # Informações do jogador
            info_frame = ctk.CTkFrame(player_frame)
            info_frame.pack(side="left", fill="x", expand=True, padx=5, pady=3)
            
            # Nome
            name_label = ctk.CTkLabel(
                info_frame,
                text=f"👤 {player_info['name']}",
                font=ctk.CTkFont(size=11, weight="bold"),
                anchor="w"
            )
            name_label.pack(fill="x", padx=3, pady=1)
            
            # Nível de permissão
            if 'permission' in player_info:
                perm_label = ctk.CTkLabel(
                    info_frame,
                    text=f"Nível: {player_info['permission']}",
                    font=ctk.CTkFont(size=9),
                    text_color="gray",
                    anchor="w"
                )
                perm_label.pack(fill="x", padx=3, pady=1)
            
            # Status online/offline
            status = self.server_manager.get_server_status()
            online_players = status.get('online_players', [])
            
            if player_info['name'] in online_players:
                status_label = ctk.CTkLabel(
                    player_frame,
                    text="🟢 Online",
                    font=ctk.CTkFont(size=9, weight="bold"),
                    text_color="green"
                )
            else:
                status_label = ctk.CTkLabel(
                    player_frame,
                    text="🔴 Offline",
                    font=ctk.CTkFont(size=9),
                    text_color="gray"
                )
            
            status_label.pack(side="right", padx=8, pady=3)
            
            # Indicador de operador
            op_label = ctk.CTkLabel(
                player_frame,
                text="👑",
                font=ctk.CTkFont(size=10, weight="bold"),
                text_color="gold"
            )
            op_label.pack(side="right", padx=5, pady=3)
        except:
            pass  # Ignorar erros na criação de widgets
    
    def select_player(self, player_info):
        """Selecionar um jogador da lista"""
        if not self._destroyed:
            self.selected_player = player_info
    
    def add_player(self):
        """Adicionar novo operador"""
        if self._destroyed:
            return
            
        player_name = self.player_entry.get().strip()
        
        if not player_name:
            messagebox.showwarning("Aviso", "Por favor, digite o nickname do jogador.")
            return
        
        try:
            # Adicionar operador
            self.manager.add_operator(player_name)
            
            messagebox.showinfo(
                "Sucesso",
                f"Jogador '{player_name}' adicionado como operador!"
            )
            
            # Limpar campo e atualizar lista
            self.player_entry.delete(0, 'end')
            if not self._destroyed:
                self.refresh_player_list()
            
        except Exception as e:
            if not self._destroyed:
                messagebox.showerror("Erro", f"Erro ao adicionar operador: {str(e)}")
    
    def remove_selected_player(self):
        """Remover operador selecionado"""
        if self._destroyed or not self.selected_player:
            if not self._destroyed:
                messagebox.showwarning("Aviso", "Por favor, selecione um jogador primeiro.")
            return
        
        try:
            player_name = self.selected_player['name']
            
            # Confirmar remoção
            result = messagebox.askyesno(
                "Confirmar Remoção",
                f"Deseja remover '{player_name}' da lista de operadores?"
            )
            
            if not result:
                return
            
            # Remover operador
            self.manager.remove_operator(player_name)
            
            messagebox.showinfo(
                "Sucesso",
                f"Jogador '{player_name}' removido da lista de operadores!"
            )
            
            # Atualizar interface
            if not self._destroyed:
                self.refresh_player_list()
                self.selected_player = None
            
        except Exception as e:
            if not self._destroyed:
                messagebox.showerror("Erro", f"Erro ao remover operador: {str(e)}")
    
    def kick_selected_player(self):
        """Expulsar jogador selecionado"""
        if self._destroyed or not self.selected_player:
            if not self._destroyed:
                messagebox.showwarning("Aviso", "Por favor, selecione um jogador primeiro.")
            return
        
        try:
            player_name = self.selected_player['name']
            
            # Verificar se o servidor está rodando
            if not self.server_manager.is_running:
                messagebox.showwarning("Aviso", "O servidor precisa estar rodando para expulsar jogadores.")
                return
            
            # Verificar se o jogador está online
            status = self.server_manager.get_server_status()
            online_players = status.get('online_players', [])
            
            if player_name not in online_players:
                messagebox.showwarning("Aviso", f"Jogador '{player_name}' não está online.")
                return
            
            # Confirmar expulsão
            result = messagebox.askyesno(
                "Confirmar Expulsão",
                f"Deseja expulsar o jogador '{player_name}' do servidor?"
            )
            
            if not result:
                return
            
            # Enviar comando kick
            self.server_manager.send_command(f"kick {player_name}")
            
            messagebox.showinfo(
                "Sucesso",
                f"Comando de expulsão enviado para '{player_name}'!"
            )
            
        except Exception as e:
            if not self._destroyed:
                messagebox.showerror("Erro", f"Erro ao expulsar jogador: {str(e)}")
    
    def destroy(self):
        """Destruir aba de forma segura"""
        self._destroyed = True
        self._update_thread_running = False