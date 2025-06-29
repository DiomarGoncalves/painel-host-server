import customtkinter as ctk
from tkinter import messagebox
import os
import threading
import time
from src.core.level_dat_manager import LevelDatManager
from src.core.addon_manager import AddonManager

class WorldSettingsTab:
    def __init__(self, parent, server_path):
        self.parent = parent
        self.server_path = server_path
        self.manager = LevelDatManager(server_path)
        self.addon_manager = AddonManager(server_path)
        self.entries = {}
        self._destroyed = False
        
        self.setup_ui()
        self.load_settings()
    
    def setup_ui(self):
        """Configurar interface da aba"""
        # Frame principal com scroll
        self.main_frame = ctk.CTkScrollableFrame(self.parent)
        self.main_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Título
        title_label = ctk.CTkLabel(
            self.main_frame,
            text="🌍 Configurações do Mundo",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        title_label.pack(pady=(0, 20))
        
        # Seção: Configurações Básicas
        self.create_section("⚙️ Configurações Básicas", [
            ("RandomSeed", "Semente do Mundo", "text"),
            ("IsHardcore", "Modo Hardcore", "bool"),
            ("Difficulty", "Dificuldade", "difficulty"),
            ("educationFeaturesEnabled", "Recursos Educacionais", "bool")
        ])
        
        # Seção: Regras de Jogo - Comandos
        self.create_section("📝 Comandos e Blocos", [
            ("commandblockoutput", "Saída de Blocos de Comando", "bool"),
            ("commandblocksenabled", "Blocos de Comando Habilitados", "bool"),
            ("functioncommandlimit", "Limite de Comandos de Função", "int"),
            ("maxcommandchainlength", "Comprimento Máximo da Cadeia de Comandos", "int"),
            ("sendcommandfeedback", "Enviar Feedback de Comandos", "bool")
        ])
        
        # Seção: Regras de Jogo - Ciclos
        self.create_section("🌅 Ciclos e Tempo", [
            ("dodaylightcycle", "Ciclo Dia/Noite", "bool"),
            ("doweathercycle", "Ciclo do Clima", "bool"),
            ("randomtickspeed", "Velocidade de Tick Aleatório", "int"),
            ("doinsomnia", "Insônia (Phantoms)", "bool")
        ])
        
        # Seção: Regras de Jogo - Drops e Danos
        self.create_section("💀 Danos e Drops", [
            ("doentitydrops", "Drops de Entidades", "bool"),
            ("dotiledrops", "Drops de Blocos", "bool"),
            ("domobloot", "Loot de Mobs", "bool"),
            ("drowningdamage", "Dano de Afogamento", "bool"),
            ("falldamage", "Dano de Queda", "bool"),
            ("firedamage", "Dano de Fogo", "bool"),
            ("freezedamage", "Dano de Congelamento", "bool")
        ])
        
        # Seção: Regras de Jogo - Gameplay
        self.create_section("🎮 Gameplay", [
            ("keepinventory", "Manter Inventário", "bool"),
            ("doimmediaterespawn", "Respawn Imediato", "bool"),
            ("naturalregeneration", "Regeneração Natural", "bool"),
            ("mobgriefing", "Griefing de Mobs", "bool"),
            ("pvp", "PvP", "bool"),
            ("playerssleepingpercentage", "% Jogadores Dormindo", "int"),
            ("spawnradius", "Raio de Spawn", "int")
        ])
        
        # Seção: Regras de Jogo - Explosões
        self.create_section("💥 Explosões", [
            ("dofiretick", "Propagação de Fogo", "bool"),
            ("tntexplodes", "TNT Explode", "bool"),
            ("tntexplosiondropdecay", "Decaimento de Drops de Explosão TNT", "bool"),
            ("respawnblocksexplode", "Blocos de Respawn Explodem", "bool")
        ])
        
        # Seção: Interface
        self.create_section("🖥️ Interface", [
            ("showcoordinates", "Mostrar Coordenadas", "bool"),
            ("showdaysplayed", "Mostrar Dias Jogados", "bool"),
            ("showdeathmessages", "Mostrar Mensagens de Morte", "bool"),
            ("showtags", "Mostrar Tags", "bool"),
            ("recipesunlock", "Desbloqueio de Receitas", "bool")
        ])
        
        # Seção: Experimentos
        self.create_section("🧪 Recursos Experimentais", [
            ("data_driven_biomes", "Biomas Personalizados", "bool"),
            ("experimental_creator_cameras", "Câmeras Experimentais", "bool"),
            ("gametest", "APIs Beta", "bool"),
            ("jigsaw_structures", "Estruturas Jigsaw", "bool"),
            ("upcoming_creator_features", "Recursos Futuros", "bool"),
            ("villager_trades_rebalance", "Rebalanceamento de Trocas", "bool")
        ])
        
        # Seção: Spawning
        self.create_section("👾 Spawning", [
            ("domobspawning", "Spawn de Mobs", "bool")
        ])
        
        # Seção: Addons do Mundo
        self.create_addon_section()
        
        # Botões de ação
        button_frame = ctk.CTkFrame(self.main_frame)
        button_frame.pack(fill="x", padx=10, pady=20)
        
        self.save_button = ctk.CTkButton(
            button_frame,
            text="💾 Salvar Configurações",
            command=self.save_settings,
            height=40,
            font=ctk.CTkFont(size=14, weight="bold")
        )
        self.save_button.pack(side="left", padx=10, pady=10)
        
        self.reload_button = ctk.CTkButton(
            button_frame,
            text="🔄 Recarregar",
            command=self.load_settings,
            height=40
        )
        self.reload_button.pack(side="left", padx=10, pady=10)
        
        self.reset_button = ctk.CTkButton(
            button_frame,
            text="🔄 Restaurar Padrões",
            command=self.reset_to_defaults,
            height=40
        )
        self.reset_button.pack(side="left", padx=10, pady=10)
    
    def create_section(self, title, fields):
        """Criar seção de configurações"""
        # Título da seção
        section_frame = ctk.CTkFrame(self.main_frame)
        section_frame.pack(fill="x", padx=10, pady=(20, 10))
        
        title_label = ctk.CTkLabel(
            section_frame,
            text=title,
            font=ctk.CTkFont(size=16, weight="bold")
        )
        title_label.pack(pady=10)
        
        # Campos da seção
        fields_frame = ctk.CTkFrame(section_frame)
        fields_frame.pack(fill="x", padx=10, pady=(0, 10))
        
        # Configurar colunas do grid
        fields_frame.columnconfigure(0, weight=1)
        fields_frame.columnconfigure(1, weight=0)
        fields_frame.columnconfigure(2, weight=0)
        
        for i, (key, description, field_type) in enumerate(fields):
            self.create_field(fields_frame, key, description, field_type, i)
    
    def create_addon_section(self):
        """Criar seção de addons do mundo"""
        # Título da seção
        section_frame = ctk.CTkFrame(self.main_frame)
        section_frame.pack(fill="x", padx=10, pady=(20, 10))
        
        title_label = ctk.CTkLabel(
            section_frame,
            text="🧩 Addons Aplicados ao Mundo",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        title_label.pack(pady=10)
        
        # Frame de controles
        controls_frame = ctk.CTkFrame(section_frame)
        controls_frame.pack(fill="x", padx=10, pady=(0, 10))
        
        # Lista de addons disponíveis
        available_frame = ctk.CTkFrame(controls_frame)
        available_frame.pack(side="left", fill="both", expand=True, padx=(0, 5))
        
        ctk.CTkLabel(
            available_frame,
            text="📚 Biblioteca",
            font=ctk.CTkFont(size=12, weight="bold")
        ).pack(pady=(5, 0))
        
        self.available_addons_list = ctk.CTkScrollableFrame(available_frame, height=150)
        self.available_addons_list.pack(fill="both", expand=True, padx=5, pady=5)
        
        # Botões de ação
        buttons_frame = ctk.CTkFrame(controls_frame)
        buttons_frame.pack(side="left", padx=5)
        
        self.apply_addon_button = ctk.CTkButton(
            buttons_frame,
            text="➡️\nAplicar",
            command=self.apply_selected_addon,
            height=60,
            width=80
        )
        self.apply_addon_button.pack(pady=5)
        
        self.remove_addon_button = ctk.CTkButton(
            buttons_frame,
            text="⬅️\nRemover",
            command=self.remove_selected_addon,
            height=60,
            width=80
        )
        self.remove_addon_button.pack(pady=5)
        
        self.refresh_addons_button = ctk.CTkButton(
            buttons_frame,
            text="🔄\nAtualizar",
            command=self.refresh_addon_lists,
            height=60,
            width=80
        )
        self.refresh_addons_button.pack(pady=5)
        
        # Lista de addons aplicados
        applied_frame = ctk.CTkFrame(controls_frame)
        applied_frame.pack(side="right", fill="both", expand=True, padx=(5, 0))
        
        ctk.CTkLabel(
            applied_frame,
            text="✅ Aplicados ao Mundo",
            font=ctk.CTkFont(size=12, weight="bold")
        ).pack(pady=(5, 0))
        
        self.applied_addons_list = ctk.CTkScrollableFrame(applied_frame, height=150)
        self.applied_addons_list.pack(fill="both", expand=True, padx=5, pady=5)
        
        # Variáveis de seleção
        self.selected_available_addon = None
        self.selected_applied_addon = None
        
        # Carregar listas de addons
        self.refresh_addon_lists()
    
    def create_field(self, parent, key, description, field_type, row):
        """Criar campo individual"""
        # Label
        label = ctk.CTkLabel(
            parent,
            text=description,
            font=ctk.CTkFont(size=12)
        )
        label.grid(row=row, column=0, sticky="w", padx=10, pady=5)
        
        # Campo de entrada baseado no tipo
        if field_type == "bool":
            var = ctk.BooleanVar()
            entry = ctk.CTkCheckBox(
                parent,
                text="",
                variable=var
            )
            self.entries[key] = var
        elif field_type == "difficulty":
            entry = ctk.CTkOptionMenu(
                parent,
                values=["0 - Peaceful", "1 - Easy", "2 - Normal", "3 - Hard"],
                width=200
            )
            self.entries[key] = entry
        elif field_type == "int":
            entry = ctk.CTkEntry(
                parent,
                width=200
            )
            self.entries[key] = entry
        else:  # text
            entry = ctk.CTkEntry(
                parent,
                width=200
            )
            self.entries[key] = entry
        
        entry.grid(row=row, column=1, sticky="w", padx=10, pady=5)
        
        # Chave da configuração
        key_label = ctk.CTkLabel(
            parent,
            text=f"({key})",
            font=ctk.CTkFont(size=10),
            text_color="gray"
        )
        key_label.grid(row=row, column=2, sticky="w", padx=10, pady=5)
    
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
    
    def refresh_addon_lists(self):
        """Atualizar listas de addons"""
        if self._destroyed:
            return
            
        try:
            # Limpar listas de forma segura
            self.safe_clear_frame(self.available_addons_list)
            self.safe_clear_frame(self.applied_addons_list)
            
            # Carregar addons da biblioteca
            behavior_packs = self.addon_manager.list_behavior_packs()
            resource_packs = self.addon_manager.list_resource_packs()
            
            # Carregar addons aplicados ao mundo
            world_addons = self.addon_manager.get_world_addons()
            applied_uuids = set()
            
            for addon_list in world_addons.values():
                for addon in addon_list:
                    applied_uuids.add(addon['uuid'])
            
            # Mostrar addons disponíveis (não aplicados)
            available_count = 0
            for pack in behavior_packs + resource_packs:
                if pack['uuid'] not in applied_uuids:
                    if not self._destroyed:
                        self.create_available_addon_item(pack)
                        available_count += 1
            
            if available_count == 0 and not self._destroyed:
                no_available_label = ctk.CTkLabel(
                    self.available_addons_list,
                    text="Nenhum addon disponível\n(Importe addons na aba 'Addons')",
                    text_color="gray"
                )
                no_available_label.pack(pady=10)
            
            # Mostrar addons aplicados
            applied_count = 0
            for addon_type, addon_list in world_addons.items():
                if addon_list and not self._destroyed:
                    type_label = ctk.CTkLabel(
                        self.applied_addons_list,
                        text=f"🎯 {addon_type.title()} Packs",
                        font=ctk.CTkFont(size=12, weight="bold")
                    )
                    type_label.pack(pady=(5, 0), anchor="w")
                    
                    for addon in addon_list:
                        if not self._destroyed:
                            self.create_applied_addon_item(addon)
                            applied_count += 1
            
            if applied_count == 0 and not self._destroyed:
                no_applied_label = ctk.CTkLabel(
                    self.applied_addons_list,
                    text="Nenhum addon aplicado",
                    text_color="gray"
                )
                no_applied_label.pack(pady=10)
                
        except Exception as e:
            if not self._destroyed:
                messagebox.showerror("Erro", f"Erro ao atualizar listas de addons: {str(e)}")
    
    def create_available_addon_item(self, addon_info):
        """Criar item de addon disponível"""
        if self._destroyed:
            return
            
        try:
            addon_frame = ctk.CTkFrame(self.available_addons_list)
            addon_frame.pack(fill="x", padx=2, pady=1)
            
            # Radio button para seleção
            radio_var = ctk.StringVar(value="")
            radio = ctk.CTkRadioButton(
                addon_frame,
                text="",
                variable=radio_var,
                value=addon_info['uuid'],
                command=lambda: self.select_available_addon(addon_info)
            )
            radio.pack(side="left", padx=5, pady=2)
            
            # Nome do addon
            name_label = ctk.CTkLabel(
                addon_frame,
                text=f"📦 {addon_info['name']}",
                font=ctk.CTkFont(size=10)
            )
            name_label.pack(side="left", padx=5, pady=2)
        except:
            pass  # Ignorar erros na criação de widgets
    
    def create_applied_addon_item(self, addon_info):
        """Criar item de addon aplicado"""
        if self._destroyed:
            return
            
        try:
            addon_frame = ctk.CTkFrame(self.applied_addons_list)
            addon_frame.pack(fill="x", padx=2, pady=1)
            
            # Radio button para seleção
            radio_var = ctk.StringVar(value="")
            radio = ctk.CTkRadioButton(
                addon_frame,
                text="",
                variable=radio_var,
                value=addon_info['uuid'],
                command=lambda: self.select_applied_addon(addon_info)
            )
            radio.pack(side="left", padx=5, pady=2)
            
            # Nome do addon
            name_label = ctk.CTkLabel(
                addon_frame,
                text=f"✅ {addon_info['name']}",
                font=ctk.CTkFont(size=10)
            )
            name_label.pack(side="left", padx=5, pady=2)
        except:
            pass  # Ignorar erros na criação de widgets
    
    def select_available_addon(self, addon_info):
        """Selecionar addon disponível"""
        if not self._destroyed:
            self.selected_available_addon = addon_info
    
    def select_applied_addon(self, addon_info):
        """Selecionar addon aplicado"""
        if not self._destroyed:
            self.selected_applied_addon = addon_info
    
    def apply_selected_addon(self):
        """Aplicar addon selecionado ao mundo"""
        if self._destroyed or not self.selected_available_addon:
            if not self._destroyed:
                messagebox.showwarning("Aviso", "Selecione um addon da biblioteca primeiro.")
            return
        
        try:
            self.addon_manager.apply_addon_to_world(self.selected_available_addon)
            
            messagebox.showinfo(
                "Sucesso",
                f"Addon '{self.selected_available_addon['name']}' aplicado ao mundo!"
            )
            
            if not self._destroyed:
                self.refresh_addon_lists()
                self.selected_available_addon = None
            
        except Exception as e:
            if not self._destroyed:
                messagebox.showerror("Erro", f"Erro ao aplicar addon: {str(e)}")
    
    def remove_selected_addon(self):
        """Remover addon selecionado do mundo"""
        if self._destroyed or not self.selected_applied_addon:
            if not self._destroyed:
                messagebox.showwarning("Aviso", "Selecione um addon aplicado primeiro.")
            return
        
        try:
            self.addon_manager.remove_addon_from_world(self.selected_applied_addon)
            
            messagebox.showinfo(
                "Sucesso",
                f"Addon '{self.selected_applied_addon['name']}' removido do mundo!"
            )
            
            if not self._destroyed:
                self.refresh_addon_lists()
                self.selected_applied_addon = None
            
        except Exception as e:
            if not self._destroyed:
                messagebox.showerror("Erro", f"Erro ao remover addon: {str(e)}")
    
    def load_settings(self):
        """Carregar configurações do mundo"""
        if self._destroyed:
            return
            
        try:
            settings = self.manager.load_saved_settings()
            
            for key, widget in self.entries.items():
                if key in settings:
                    value = settings[key]
                    
                    if isinstance(widget, ctk.BooleanVar):
                        widget.set(bool(value))
                    elif isinstance(widget, ctk.CTkOptionMenu):
                        if key == "Difficulty":
                            widget.set(f"{value} - {self.manager.get_difficulty_name(value)}")
                    else:
                        widget.delete(0, 'end')
                        widget.insert(0, str(value))
            
            # Atualizar listas de addons
            if not self._destroyed:
                self.refresh_addon_lists()
                        
        except Exception as e:
            if not self._destroyed:
                messagebox.showerror("Erro", f"Erro ao carregar configurações: {str(e)}")
    
    def save_settings(self):
        """Salvar configurações do mundo"""
        if self._destroyed:
            return
            
        try:
            settings = {}
            
            for key, widget in self.entries.items():
                if isinstance(widget, ctk.BooleanVar):
                    settings[key] = widget.get()
                elif isinstance(widget, ctk.CTkOptionMenu):
                    if key == "Difficulty":
                        value = widget.get().split(" - ")[0]
                        settings[key] = int(value)
                    else:
                        settings[key] = widget.get()
                else:
                    value = widget.get()
                    # Tentar converter para int se necessário
                    if key in ["functioncommandlimit", "maxcommandchainlength", 
                              "playerssleepingpercentage", "randomtickspeed", "spawnradius"]:
                        try:
                            settings[key] = int(value)
                        except:
                            settings[key] = 0
                    else:
                        settings[key] = value
            
            self.manager.save_level_settings(settings)
            
            messagebox.showinfo(
                "Sucesso", 
                "Configurações do mundo salvas com sucesso!\n\n"
                "Nota: Algumas alterações podem exigir reinicialização do servidor."
            )
            
        except Exception as e:
            if not self._destroyed:
                messagebox.showerror("Erro", f"Erro ao salvar configurações: {str(e)}")
    
    def reset_to_defaults(self):
        """Restaurar configurações padrão"""
        if self._destroyed:
            return
            
        result = messagebox.askyesno(
            "Confirmar Reset",
            "Deseja restaurar todas as configurações para os valores padrão?\n\n"
            "Esta ação não pode ser desfeita."
        )
        
        if result and not self._destroyed:
            try:
                default_settings = self.manager.get_default_settings()
                
                for key, widget in self.entries.items():
                    if key in default_settings:
                        value = default_settings[key]
                        
                        if isinstance(widget, ctk.BooleanVar):
                            widget.set(bool(value))
                        elif isinstance(widget, ctk.CTkOptionMenu):
                            if key == "Difficulty":
                                widget.set(f"{value} - {self.manager.get_difficulty_name(value)}")
                        else:
                            widget.delete(0, 'end')
                            widget.insert(0, str(value))
                
                messagebox.showinfo("Sucesso", "Configurações restauradas para os valores padrão!")
                
            except Exception as e:
                if not self._destroyed:
                    messagebox.showerror("Erro", f"Erro ao restaurar configurações: {str(e)}")
    
    def destroy(self):
        """Destruir aba de forma segura"""
        self._destroyed = True