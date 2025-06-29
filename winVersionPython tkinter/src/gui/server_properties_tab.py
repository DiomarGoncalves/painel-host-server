import customtkinter as ctk
from tkinter import messagebox
import os
from src.core.server_properties import ServerPropertiesManager

class ServerPropertiesTab:
    def __init__(self, parent, server_path):
        self.parent = parent
        self.server_path = server_path
        self.manager = ServerPropertiesManager(server_path)
        self.entries = {}
        
        self.setup_ui()
        self.load_properties()
    
    def setup_ui(self):
        """Configurar interface da aba"""
        # Frame principal com scroll
        self.main_frame = ctk.CTkScrollableFrame(self.parent)
        self.main_frame.pack(fill="both", expand=True, padx=5, pady=5)
        
        # Título responsivo
        title_label = ctk.CTkLabel(
            self.main_frame,
            text="⚙️ Configurações do Servidor",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        title_label.pack(pady=(0, 15))
        
        # Seção: Configurações Básicas
        self.create_section("🎮 Configurações Básicas", [
            ("server-name", "Nome do Servidor", "text"),
            ("max-players", "Vagas (Máximo de Jogadores)", "int"),
            ("gamemode", "Modo de Jogo", "gamemode"),
            ("difficulty", "Dificuldade", "difficulty"),
            ("level-name", "Nome do Mundo", "text"),
            ("level-seed", "Seed do Mundo", "text")
        ])
        
        # Seção: Permissões e Segurança
        self.create_section("🔒 Permissões e Segurança", [
            ("online-mode", "Modo Online (Anti-Pirata)", "bool_inverted"),
            ("allow-cheats", "Permitir Trapaças", "bool"),
            ("force-gamemode", "Forçar Modo de Jogo", "bool"),
            ("allow-list", "Lista de Permissão (Whitelist)", "bool"),
            ("default-player-permission-level", "Nível de Permissão Padrão", "permission")
        ])
        
        # Seção: Rede e Conexão
        self.create_section("🌐 Rede e Conexão", [
            ("server-port", "Porta do Servidor", "int"),
            ("server-portv6", "Porta IPv6 do Servidor", "int"),
            ("player-idle-timeout", "Timeout de Inatividade (minutos)", "int"),
            ("max-threads", "Máximo de Threads", "int")
        ])
        
        # Seção: Mundo e Renderização
        self.create_section("🌍 Mundo e Renderização", [
            ("level-type", "Tipo do Mundo", "level_type"),
            ("view-distance", "Distância de Visão", "int"),
            ("tick-distance", "Distância de Tick", "int"),
            ("simulation-distance", "Distância de Simulação", "int")
        ])
        
        # Seção: Recursos e Conteúdo
        self.create_section("📦 Recursos e Conteúdo", [
            ("texturepack-required", "Pacote de Recursos Obrigatório", "bool"),
            ("content-log-file-enabled", "Log de Conteúdo Habilitado", "bool"),
            ("compression-threshold", "Limite de Compressão", "int")
        ])
        
        # Seção: Anti-Cheat e Movimento
        self.create_section("🛡️ Anti-Cheat e Movimento", [
            ("server-authoritative-movement", "Movimento Autoritativo", "bool"),
            ("player-movement-score-threshold", "Limite de Pontuação de Movimento", "int"),
            ("player-movement-distance-threshold", "Limite de Distância de Movimento", "float"),
            ("player-movement-duration-threshold-in-ms", "Limite de Duração de Movimento (ms)", "int"),
            ("correct-player-movement", "Corrigir Movimento do Jogador", "bool")
        ])
        
        # Seção: Configurações Avançadas
        self.create_section("🔧 Configurações Avançadas", [
            ("emit-server-telemetry", "Telemetria do Servidor", "bool"),
            ("disable-player-interaction", "Desabilitar Interação de Jogadores", "bool"),
            ("client-side-chunk-generation-enabled", "Geração de Chunks no Cliente", "bool"),
            ("block-network-ids-are-hashes", "IDs de Rede de Blocos são Hashes", "bool")
        ])
        
        # Botões de ação - layout responsivo
        button_frame = ctk.CTkFrame(self.main_frame)
        button_frame.pack(fill="x", padx=5, pady=15)
        
        # Configurar grid responsivo
        button_frame.grid_columnconfigure(0, weight=1)
        button_frame.grid_columnconfigure(1, weight=1)
        
        self.save_button = ctk.CTkButton(
            button_frame,
            text="💾 Salvar",
            command=self.save_properties,
            height=35,
            font=ctk.CTkFont(size=12, weight="bold")
        )
        self.save_button.grid(row=0, column=0, padx=5, pady=5, sticky="ew")
        
        self.reload_button = ctk.CTkButton(
            button_frame,
            text="🔄 Recarregar",
            command=self.load_properties,
            height=35
        )
        self.reload_button.grid(row=0, column=1, padx=5, pady=5, sticky="ew")
    
    def create_section(self, title, fields):
        """Criar seção de configurações"""
        # Título da seção
        section_frame = ctk.CTkFrame(self.main_frame)
        section_frame.pack(fill="x", padx=5, pady=(15, 8))
        
        title_label = ctk.CTkLabel(
            section_frame,
            text=title,
            font=ctk.CTkFont(size=14, weight="bold")
        )
        title_label.pack(pady=8)
        
        # Campos da seção
        fields_frame = ctk.CTkFrame(section_frame)
        fields_frame.pack(fill="x", padx=5, pady=(0, 8))
        
        # Layout responsivo - uma coluna em telas pequenas
        for i, (key, description, field_type) in enumerate(fields):
            self.create_field_responsive(fields_frame, key, description, field_type, i)
    
    def create_field_responsive(self, parent, key, description, field_type, row):
        """Criar campo individual com layout responsivo"""
        # Container para o campo
        field_container = ctk.CTkFrame(parent)
        field_container.pack(fill="x", padx=3, pady=2)
        
        # Label
        label = ctk.CTkLabel(
            field_container,
            text=description,
            font=ctk.CTkFont(size=11),
            anchor="w"
        )
        label.pack(fill="x", padx=5, pady=(3, 0))
        
        # Container para entrada e chave
        input_container = ctk.CTkFrame(field_container)
        input_container.pack(fill="x", padx=5, pady=(0, 3))
        
        # Campo de entrada baseado no tipo
        if field_type == "bool":
            var = ctk.BooleanVar()
            entry = ctk.CTkCheckBox(
                input_container,
                text="",
                variable=var
            )
            self.entries[key] = var
        elif field_type == "bool_inverted":
            # Para online-mode (false = pirata permitido)
            var = ctk.BooleanVar()
            entry = ctk.CTkCheckBox(
                input_container,
                text="",
                variable=var
            )
            self.entries[key] = var
        elif field_type == "gamemode":
            entry = ctk.CTkOptionMenu(
                input_container,
                values=["survival", "creative", "adventure"],
                width=150
            )
            self.entries[key] = entry
        elif field_type == "difficulty":
            entry = ctk.CTkOptionMenu(
                input_container,
                values=["peaceful", "easy", "normal", "hard"],
                width=150
            )
            self.entries[key] = entry
        elif field_type == "permission":
            entry = ctk.CTkOptionMenu(
                input_container,
                values=["visitor", "member", "operator"],
                width=150
            )
            self.entries[key] = entry
        elif field_type == "level_type":
            entry = ctk.CTkOptionMenu(
                input_container,
                values=["DEFAULT", "FLAT", "LEGACY"],
                width=150
            )
            self.entries[key] = entry
        else:  # text, int, float
            entry = ctk.CTkEntry(
                input_container,
                width=150,
                font=ctk.CTkFont(size=10)
            )
            self.entries[key] = entry
        
        entry.pack(side="left", padx=3, pady=2)
        
        # Chave da propriedade
        key_label = ctk.CTkLabel(
            input_container,
            text=f"({key})",
            font=ctk.CTkFont(size=9),
            text_color="gray"
        )
        key_label.pack(side="right", padx=3, pady=2)
    
    def load_properties(self):
        """Carregar propriedades do servidor"""
        try:
            properties = self.manager.load_properties()
            
            for key, widget in self.entries.items():
                if key in properties:
                    value = properties[key]
                    
                    if isinstance(widget, ctk.BooleanVar):
                        if key == "online-mode":
                            # Inverter lógica para "Pirata" (false = pirata permitido)
                            widget.set(value.lower() != 'true')
                        else:
                            widget.set(value.lower() == 'true')
                    elif isinstance(widget, ctk.CTkOptionMenu):
                        widget.set(value)
                    else:
                        widget.delete(0, 'end')
                        widget.insert(0, str(value))
                        
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao carregar propriedades: {str(e)}")
    
    def save_properties(self):
        """Salvar propriedades editadas"""
        try:
            # Coletar valores dos campos
            new_properties = {}
            for key, widget in self.entries.items():
                if isinstance(widget, ctk.BooleanVar):
                    if key == "online-mode":
                        # Inverter lógica para "Pirata"
                        new_properties[key] = 'false' if widget.get() else 'true'
                    else:
                        new_properties[key] = 'true' if widget.get() else 'false'
                elif isinstance(widget, ctk.CTkOptionMenu):
                    new_properties[key] = widget.get()
                else:
                    new_properties[key] = widget.get()
            
            # Salvar usando o manager
            self.manager.save_properties(new_properties)
            
            messagebox.showinfo("Sucesso", "Configurações salvas com sucesso!")
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao salvar configurações: {str(e)}")