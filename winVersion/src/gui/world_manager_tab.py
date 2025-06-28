import customtkinter as ctk
from tkinter import messagebox, filedialog
import os
from src.core.world_manager import WorldManager

class WorldManagerTab:
    def __init__(self, parent, server_path):
        self.parent = parent
        self.server_path = server_path
        self.manager = WorldManager(server_path)
        
        self.setup_ui()
        self.refresh_world_list()
    
    def setup_ui(self):
        """Configurar interface da aba"""
        # Frame principal
        main_frame = ctk.CTkFrame(self.parent)
        main_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Título
        title_label = ctk.CTkLabel(
            main_frame,
            text="🌍 Gerenciamento de Mundos",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        title_label.pack(pady=(10, 20))
        
        # Frame de ações (agora inclui mundo atual)
        actions_frame = ctk.CTkFrame(main_frame)
        actions_frame.pack(fill="x", padx=10, pady=10)

        # Mundo Atual dentro do actions_frame
        ctk.CTkLabel(
            actions_frame,
            text="🎯 Mundo Atual",
            font=ctk.CTkFont(size=14, weight="bold")
        ).pack(pady=(10, 5))
        
        self.current_world_label = ctk.CTkLabel(
            actions_frame,
            text="Carregando...",
            font=ctk.CTkFont(size=12)
        )
        self.current_world_label.pack(pady=(0, 10))
        
        # Importar Novo Mundo
        ctk.CTkLabel(
            actions_frame,
            text="📥 Importar Novo Mundo",
            font=ctk.CTkFont(size=14, weight="bold")
        ).pack(pady=(10, 5))
        
        # Botões de importação
        button_frame = ctk.CTkFrame(actions_frame)
        button_frame.pack(pady=10)
        
        self.import_zip_button = ctk.CTkButton(
            button_frame,
            text="📦 Importar ZIP",
            command=self.import_world_zip,
            height=40,
            width=150
        )
        self.import_zip_button.pack(side="left", padx=10)
        
        self.import_folder_button = ctk.CTkButton(
            button_frame,
            text="📁 Importar Pasta",
            command=self.import_world_folder,
            height=40,
            width=150
        )
        self.import_folder_button.pack(side="left", padx=10)
        
        # Frame de mundos disponíveis
        worlds_frame = ctk.CTkFrame(main_frame)
        worlds_frame.pack(fill="both", expand=True, padx=10, pady=10)

        # Frame horizontal para label e botões
        worlds_header_frame = ctk.CTkFrame(worlds_frame)
        worlds_header_frame.pack(fill="x", pady=(10, 5))

        ctk.CTkLabel(
            worlds_header_frame,
            text="🗂️ Mundos Disponíveis",
            font=ctk.CTkFont(size=14, weight="bold")
        ).pack(side="left", padx=(20, 10))  # margem maior à esquerda

        self.activate_button = ctk.CTkButton(
            worlds_header_frame,
            text="✅ Ativar Mundo Selecionado",
            command=self.activate_selected_world,
            height=35
        )
        self.activate_button.pack(side="left", padx=5)

        self.refresh_button = ctk.CTkButton(
            worlds_header_frame,
            text="🔄 Atualizar Lista",
            command=self.refresh_world_list,
            height=35
        )
        self.refresh_button.pack(side="left", padx=5)

        # Lista de mundos
        self.worlds_listbox = ctk.CTkScrollableFrame(worlds_frame, height=450)
        self.worlds_listbox.pack(fill="x", padx=10, pady=10)
        
        # Botões de ação para mundos (fora do scrollable frame)
        world_actions_frame = ctk.CTkFrame(worlds_frame)
        world_actions_frame.pack(fill="x", padx=10, pady=(0, 10))
        
        self.activate_button = ctk.CTkButton(
            world_actions_frame,
            text="✅ Ativar Mundo Selecionado",
            command=self.activate_selected_world,
            height=35
        )
        self.activate_button.pack(side="left", padx=10, pady=5)
        
        self.refresh_button = ctk.CTkButton(
            world_actions_frame,
            text="🔄 Atualizar Lista",
            command=self.refresh_world_list,
            height=35
        )
        self.refresh_button.pack(side="left", padx=10, pady=5)
        
        self.selected_world = None
    
    def refresh_world_list(self):
        """Atualizar lista de mundos disponíveis"""
        try:
            # Atualizar mundo atual
            current_world = self.manager.get_current_world()
            self.current_world_label.configure(text=f"📍 {current_world}")
            
            # Limpar lista atual
            for widget in self.worlds_listbox.winfo_children():
                widget.destroy()
            
            # Listar mundos disponíveis
            worlds = self.manager.list_available_worlds()
            
            if not worlds:
                no_worlds_label = ctk.CTkLabel(
                    self.worlds_listbox,
                    text="Nenhum mundo encontrado na pasta worlds/",
                    text_color="gray"
                )
                no_worlds_label.pack(pady=20)
                return
            
            for i, world in enumerate(worlds):
                world_frame = ctk.CTkFrame(self.worlds_listbox, width=470, height=48)
                world_frame.pack(fill="x", padx=5, pady=2)
                world_frame.pack_propagate(False)  # Impede que o frame ajuste o tamanho automaticamente
                
                # Radio button para seleção
                radio_var = ctk.StringVar(value="")
                radio = ctk.CTkRadioButton(
                    world_frame,
                    text="",
                    variable=radio_var,
                    value=world,
                    command=lambda w=world: self.select_world(w)
                )
                radio.pack(side="left", padx=10, pady=5)
                
                # Nome do mundo
                world_label = ctk.CTkLabel(
                    world_frame,
                    text=f"🌍 {world}",
                    font=ctk.CTkFont(size=12)
                )
                world_label.pack(side="left", padx=10, pady=5)
                
                # Indicador se é o mundo atual
                if world == current_world:
                    current_indicator = ctk.CTkLabel(
                        world_frame,
                        text="✅ ATIVO",
                        font=ctk.CTkFont(size=10, weight="bold"),
                        text_color="green"
                    )
                    current_indicator.pack(side="right", padx=10, pady=5)
                    
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao atualizar lista de mundos: {str(e)}")
    
    def select_world(self, world_name):
        """Selecionar um mundo da lista"""
        self.selected_world = world_name
    
    def import_world_zip(self):
        """Importar mundo de um arquivo ZIP"""
        file_path = filedialog.askopenfilename(
            title="Selecionar arquivo ZIP do mundo",
            filetypes=[("Arquivos ZIP", "*.zip")]
        )
        
        if file_path:
            self.import_world(file_path, is_zip=True)
    
    def import_world_folder(self):
        """Importar mundo de uma pasta"""
        folder_path = filedialog.askdirectory(
            title="Selecionar pasta do mundo"
        )
        
        if folder_path:
            self.import_world(folder_path, is_zip=False)
    
    def import_world(self, path, is_zip=False):
        """Importar mundo (ZIP ou pasta)"""
        try:
            # Confirmar substituição
            result = messagebox.askyesno(
                "Confirmar Importação",
                "Isso irá substituir o mundo atual e atualizar as configurações do servidor.\n\n"
                "Deseja continuar?"
            )
            
            if not result:
                return
            
            # Importar mundo
            world_name = self.manager.import_world(path, is_zip)
            
            messagebox.showinfo(
                "Sucesso",
                f"Mundo '{world_name}' importado com sucesso!\n\n"
                "O servidor foi configurado para usar o novo mundo."
            )
            
            # Atualizar interface
            self.refresh_world_list()
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao importar mundo: {str(e)}")
    
    def activate_selected_world(self):
        """Ativar mundo selecionado"""
        if not self.selected_world:
            messagebox.showwarning("Aviso", "Por favor, selecione um mundo primeiro.")
            return
        
        try:
            # Confirmar ativação
            result = messagebox.askyesno(
                "Confirmar Ativação",
                f"Deseja ativar o mundo '{self.selected_world}'?\n\n"
                "Isso irá atualizar as configurações do servidor."
            )
            
            if not result:
                return
            
            # Ativar mundo
            self.manager.activate_world(self.selected_world)
            
            messagebox.showinfo(
                "Sucesso",
                f"Mundo '{self.selected_world}' ativado com sucesso!"
            )
            
            # Atualizar interface
            self.refresh_world_list()
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao ativar mundo: {str(e)}")