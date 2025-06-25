import customtkinter as ctk
from tkinter import messagebox, filedialog
import os
from src.core.addon_manager import AddonManager

class AddonManagerTab:
    def __init__(self, parent, server_path):
        self.parent = parent
        self.server_path = server_path
        self.manager = AddonManager(server_path)
        self._destroyed = False
        
        self.setup_ui()
        self.refresh_addon_list()
    
    def setup_ui(self):
        """Configurar interface da aba"""
        # Frame principal com scroll
        main_frame = ctk.CTkScrollableFrame(self.parent)
        main_frame.pack(fill="both", expand=True, padx=5, pady=5)
        
        # Título responsivo
        title_label = ctk.CTkLabel(
            main_frame,
            text="🧩 Biblioteca de Addons",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        title_label.pack(pady=(5, 15))
        
        # Frame de importação
        import_frame = ctk.CTkFrame(main_frame)
        import_frame.pack(fill="x", padx=5, pady=5)
        
        ctk.CTkLabel(
            import_frame,
            text="📥 Importar Addon para Biblioteca",
            font=ctk.CTkFont(size=13, weight="bold")
        ).pack(pady=(8, 3))
        
        ctk.CTkLabel(
            import_frame,
            text="Os addons serão importados para a biblioteca.\nUse a aba 'Mundo' para aplicá-los.",
            font=ctk.CTkFont(size=9),
            text_color="gray"
        ).pack(pady=(0, 8))
        
        # Botões de importação - layout responsivo
        button_frame = ctk.CTkFrame(import_frame)
        button_frame.pack(pady=8, padx=5)
        
        # Grid responsivo para botões
        button_frame.grid_columnconfigure(0, weight=1)
        button_frame.grid_columnconfigure(1, weight=1)
        button_frame.grid_columnconfigure(2, weight=1)
        
        self.import_mcaddon_button = ctk.CTkButton(
            button_frame,
            text="📦 .mcaddon",
            command=self.import_mcaddon,
            height=35
        )
        self.import_mcaddon_button.grid(row=0, column=0, padx=3, pady=3, sticky="ew")
        
        self.import_zip_button = ctk.CTkButton(
            button_frame,
            text="📦 ZIP",
            command=self.import_zip,
            height=35
        )
        self.import_zip_button.grid(row=0, column=1, padx=3, pady=3, sticky="ew")
        
        self.import_folder_button = ctk.CTkButton(
            button_frame,
            text="📁 Pasta",
            command=self.import_folder,
            height=35
        )
        self.import_folder_button.grid(row=0, column=2, padx=3, pady=3, sticky="ew")
        
        # Frame de addons instalados
        addons_frame = ctk.CTkFrame(main_frame)
        addons_frame.pack(fill="both", expand=True, padx=5, pady=5)
        
        ctk.CTkLabel(
            addons_frame,
            text="📚 Addons na Biblioteca",
            font=ctk.CTkFont(size=13, weight="bold")
        ).pack(pady=(8, 3))
        
        # Lista de addons
        self.addons_listbox = ctk.CTkScrollableFrame(addons_frame, height=200)
        self.addons_listbox.pack(fill="both", expand=True, padx=5, pady=5)
        
        # Botões de ação - layout responsivo
        actions_frame = ctk.CTkFrame(addons_frame)
        actions_frame.pack(fill="x", padx=5, pady=(0, 8))
        
        # Grid responsivo
        actions_frame.grid_columnconfigure(0, weight=1)
        actions_frame.grid_columnconfigure(1, weight=1)
        
        self.refresh_button = ctk.CTkButton(
            actions_frame,
            text="🔄 Atualizar",
            command=self.refresh_addon_list,
            height=32
        )
        self.refresh_button.grid(row=0, column=0, padx=3, pady=3, sticky="ew")
        
        self.remove_button = ctk.CTkButton(
            actions_frame,
            text="🗑️ Remover",
            command=self.remove_selected_addon,
            height=32
        )
        self.remove_button.grid(row=0, column=1, padx=3, pady=3, sticky="ew")
        
        self.selected_addon = None
    
    def safe_clear_listbox(self):
        """Limpar listbox de forma segura"""
        if self._destroyed:
            return
            
        try:
            # Obter lista de widgets filhos
            children = list(self.addons_listbox.winfo_children())
            
            # Destruir cada widget de forma segura
            for widget in children:
                try:
                    if widget.winfo_exists():
                        widget.destroy()
                except:
                    pass  # Ignorar erros de widgets já destruídos
        except:
            pass  # Ignorar erros gerais
    
    def refresh_addon_list(self):
        """Atualizar lista de addons instalados"""
        if self._destroyed:
            return
            
        try:
            # Limpar lista atual de forma segura
            self.safe_clear_listbox()
            
            # Listar addons instalados
            behavior_packs = self.manager.list_behavior_packs()
            resource_packs = self.manager.list_resource_packs()
            
            if not behavior_packs and not resource_packs:
                no_addons_label = ctk.CTkLabel(
                    self.addons_listbox,
                    text="Nenhum addon encontrado na biblioteca",
                    text_color="gray"
                )
                no_addons_label.pack(pady=20)
                return
            
            # Mostrar Behavior Packs
            if behavior_packs:
                behavior_title = ctk.CTkLabel(
                    self.addons_listbox,
                    text="🎯 Behavior Packs",
                    font=ctk.CTkFont(size=12, weight="bold")
                )
                behavior_title.pack(pady=(8, 3), anchor="w")
                
                for pack in behavior_packs:
                    if not self._destroyed:
                        self.create_addon_item(pack, "behavior")
            
            # Mostrar Resource Packs
            if resource_packs:
                resource_title = ctk.CTkLabel(
                    self.addons_listbox,
                    text="🎨 Resource Packs",
                    font=ctk.CTkFont(size=12, weight="bold")
                )
                resource_title.pack(pady=(15, 3), anchor="w")
                
                for pack in resource_packs:
                    if not self._destroyed:
                        self.create_addon_item(pack, "resource")
                    
        except Exception as e:
            if not self._destroyed:
                messagebox.showerror("Erro", f"Erro ao atualizar lista de addons: {str(e)}")
    
    def create_addon_item(self, pack_info, pack_type):
        """Criar item de addon na lista - layout compacto"""
        if self._destroyed:
            return
            
        try:
            addon_frame = ctk.CTkFrame(self.addons_listbox)
            addon_frame.pack(fill="x", padx=3, pady=1)
            
            # Radio button para seleção
            radio_var = ctk.StringVar(value="")
            radio = ctk.CTkRadioButton(
                addon_frame,
                text="",
                variable=radio_var,
                value=f"{pack_type}:{pack_info['name']}",
                command=lambda: self.select_addon(pack_info, pack_type)
            )
            radio.pack(side="left", padx=5, pady=3)
            
            # Informações do addon - layout compacto
            info_frame = ctk.CTkFrame(addon_frame)
            info_frame.pack(side="left", fill="x", expand=True, padx=5, pady=3)
            
            # Nome e versão em uma linha
            name_version_text = f"📦 {pack_info['name']} v{'.'.join(map(str, pack_info['version']))}"
            if len(name_version_text) > 40:
                name_version_text = name_version_text[:37] + "..."
            
            name_label = ctk.CTkLabel(
                info_frame,
                text=name_version_text,
                font=ctk.CTkFont(size=10, weight="bold"),
                anchor="w"
            )
            name_label.pack(fill="x", padx=3, pady=1)
            
            # UUID compacto
            uuid_text = f"UUID: {pack_info['uuid'][:8]}..."
            uuid_label = ctk.CTkLabel(
                info_frame,
                text=uuid_text,
                font=ctk.CTkFont(size=8),
                text_color="gray",
                anchor="w"
            )
            uuid_label.pack(fill="x", padx=3, pady=1)
            
            # Tipo
            type_label = ctk.CTkLabel(
                addon_frame,
                text=pack_type[:3].upper(),
                font=ctk.CTkFont(size=9, weight="bold"),
                text_color="blue" if pack_type == "behavior" else "orange",
                width=40
            )
            type_label.pack(side="right", padx=5, pady=3)
        except:
            pass  # Ignorar erros na criação de widgets
    
    def select_addon(self, pack_info, pack_type):
        """Selecionar um addon da lista"""
        if not self._destroyed:
            self.selected_addon = {
                'info': pack_info,
                'type': pack_type
            }
    
    def import_mcaddon(self):
        """Importar arquivo .mcaddon"""
        if self._destroyed:
            return
            
        file_path = filedialog.askopenfilename(
            title="Selecionar arquivo .mcaddon",
            filetypes=[("Arquivos McAddon", "*.mcaddon")]
        )
        
        if file_path:
            self.import_addon(file_path, "mcaddon")
    
    def import_zip(self):
        """Importar arquivo ZIP"""
        if self._destroyed:
            return
            
        file_path = filedialog.askopenfilename(
            title="Selecionar arquivo ZIP do addon",
            filetypes=[("Arquivos ZIP", "*.zip")]
        )
        
        if file_path:
            self.import_addon(file_path, "zip")
    
    def import_folder(self):
        """Importar pasta de addon"""
        if self._destroyed:
            return
            
        folder_path = filedialog.askdirectory(
            title="Selecionar pasta do addon"
        )
        
        if folder_path:
            self.import_addon(folder_path, "folder")
    
    def import_addon(self, path, addon_type):
        """Importar addon para biblioteca"""
        if self._destroyed:
            return
            
        try:
            result = self.manager.import_addon_to_library(path, addon_type)
            
            messagebox.showinfo(
                "Sucesso",
                f"Addon importado para a biblioteca!\n\n"
                f"Tipo: {result['type']}\n"
                f"Nome: {result['name']}\n"
                f"Versão: {'.'.join(map(str, result['version']))}\n\n"
                f"Use a aba 'Mundo' para aplicar ao mundo."
            )
            
            # Atualizar interface
            if not self._destroyed:
                self.refresh_addon_list()
            
        except Exception as e:
            if not self._destroyed:
                messagebox.showerror("Erro", f"Erro ao importar addon: {str(e)}")
    
    def remove_selected_addon(self):
        """Remover addon selecionado da biblioteca"""
        if self._destroyed or not self.selected_addon:
            if not self._destroyed:
                messagebox.showwarning("Aviso", "Por favor, selecione um addon primeiro.")
            return
        
        try:
            addon_info = self.selected_addon['info']
            addon_type = self.selected_addon['type']
            
            # Confirmar remoção
            result = messagebox.askyesno(
                "Confirmar Remoção",
                f"Deseja remover o addon '{addon_info['name']}' da biblioteca?\n\n"
                "Isso também removerá o addon de todos os mundos.\n"
                "Esta ação não pode ser desfeita."
            )
            
            if not result:
                return
            
            # Remover addon
            self.manager.remove_addon_from_library(addon_info, addon_type)
            
            messagebox.showinfo(
                "Sucesso",
                f"Addon '{addon_info['name']}' removido da biblioteca!"
            )
            
            # Atualizar interface
            if not self._destroyed:
                self.refresh_addon_list()
                self.selected_addon = None
            
        except Exception as e:
            if not self._destroyed:
                messagebox.showerror("Erro", f"Erro ao remover addon: {str(e)}")
    
    def destroy(self):
        """Destruir aba de forma segura"""
        self._destroyed = True