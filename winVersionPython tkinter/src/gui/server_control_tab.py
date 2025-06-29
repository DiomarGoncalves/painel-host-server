import customtkinter as ctk
from tkinter import messagebox, scrolledtext
import threading
import tkinter as tk

class ServerControlTab:
    def __init__(self, parent, server_path, server_manager):
        self.parent = parent
        self.server_path = server_path
        self.server_manager = server_manager
        
        self.setup_ui()
    
    def setup_ui(self):
        """Configurar interface da aba"""
        # Frame principal com scroll para telas pequenas
        self.main_frame = ctk.CTkScrollableFrame(self.parent)
        self.main_frame.pack(fill="both", expand=True, padx=5, pady=5)
        
        # Título responsivo
        title_label = ctk.CTkLabel(
            self.main_frame,
            text="🎮 Controle do Servidor",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        title_label.pack(pady=(5, 15))
        
        # Frame de controles - layout responsivo
        controls_frame = ctk.CTkFrame(self.main_frame)
        controls_frame.pack(fill="x", padx=5, pady=5)
        
        # Seção Servidor
        server_section = ctk.CTkFrame(controls_frame)
        server_section.pack(fill="x", padx=5, pady=5)
        
        ctk.CTkLabel(
            server_section,
            text="🖥️ Servidor Minecraft",
            font=ctk.CTkFont(size=13, weight="bold")
        ).pack(pady=(8, 3))
        
        # Botões do servidor - layout responsivo
        server_buttons_frame = ctk.CTkFrame(server_section)
        server_buttons_frame.pack(pady=8, padx=5)
        
        # Configurar grid responsivo
        server_buttons_frame.grid_columnconfigure(0, weight=1)
        server_buttons_frame.grid_columnconfigure(1, weight=1)
        
        self.start_server_button = ctk.CTkButton(
            server_buttons_frame,
            text="▶️ Iniciar",
            command=self.start_server,
            height=35,
            fg_color="green"
        )
        self.start_server_button.grid(row=0, column=0, padx=5, pady=2, sticky="ew")
        
        self.stop_server_button = ctk.CTkButton(
            server_buttons_frame,
            text="⏹️ Parar",
            command=self.stop_server,
            height=35,
            fg_color="red",
            state="disabled"
        )
        self.stop_server_button.grid(row=0, column=1, padx=5, pady=2, sticky="ew")
        
        # Seção Playit
        playit_section = ctk.CTkFrame(controls_frame)
        playit_section.pack(fill="x", padx=5, pady=5)
        
        ctk.CTkLabel(
            playit_section,
            text="🌍 Playit.gg (Túnel)",
            font=ctk.CTkFont(size=13, weight="bold")
        ).pack(pady=(8, 3))
        
        playit_info_label = ctk.CTkLabel(
            playit_section,
            text="Permite acesso pela internet",
            font=ctk.CTkFont(size=9),
            text_color="gray"
        )
        playit_info_label.pack(pady=(0, 3))
        
        # Botões do Playit - layout responsivo
        playit_buttons_frame = ctk.CTkFrame(playit_section)
        playit_buttons_frame.pack(pady=8, padx=5)
        
        # Configurar grid responsivo
        playit_buttons_frame.grid_columnconfigure(0, weight=1)
        playit_buttons_frame.grid_columnconfigure(1, weight=1)
        
        self.start_playit_button = ctk.CTkButton(
            playit_buttons_frame,
            text="🚀 Iniciar",
            command=self.start_playit,
            height=35,
            fg_color="blue"
        )
        self.start_playit_button.grid(row=0, column=0, padx=5, pady=2, sticky="ew")
        
        self.stop_playit_button = ctk.CTkButton(
            playit_buttons_frame,
            text="⏹️ Parar",
            command=self.stop_playit,
            height=35,
            fg_color="orange",
            state="disabled"
        )
        self.stop_playit_button.grid(row=0, column=1, padx=5, pady=2, sticky="ew")
        
        # Link para download do Playit
        playit_download_label = ctk.CTkLabel(
            playit_section,
            text="📥 Baixar: https://playit.gg",
            font=ctk.CTkFont(size=9),
            text_color="blue",
            cursor="hand2"
        )
        playit_download_label.pack(pady=(0, 8))
        playit_download_label.bind("<Button-1>", lambda e: self.open_playit_website())
        
        # Console de comandos - altura responsiva
        console_frame = ctk.CTkFrame(self.main_frame)
        console_frame.pack(fill="both", expand=True, padx=5, pady=5)
        
        ctk.CTkLabel(
            console_frame,
            text="💻 Console do Servidor",
            font=ctk.CTkFont(size=13, weight="bold")
        ).pack(pady=(8, 3))
        
        # Log do servidor - altura adaptável
        console_height = 150  # Altura menor para telas pequenas
        self.log_text = ctk.CTkTextbox(
            console_frame,
            height=console_height,
            font=ctk.CTkFont(family="Consolas", size=9)
        )
        self.log_text.pack(fill="both", expand=True, padx=5, pady=5)
        
        # --- NOVO: Console Playit ---
        ctk.CTkLabel(
            console_frame,
            text="🌍 Console Playit.gg",
            font=ctk.CTkFont(size=13, weight="bold")
        ).pack(pady=(8, 3))
        
        self.playit_log_text = ctk.CTkTextbox(
            console_frame,
            height=150,
            font=ctk.CTkFont(family="Consolas", size=9)
        )
        self.playit_log_text.pack(fill="both", expand=False, padx=5, pady=(0, 5))
        
        # Campo de comando - layout responsivo
        command_frame = ctk.CTkFrame(console_frame)
        command_frame.pack(fill="x", padx=5, pady=(0, 8))
        
        # Configurar grid responsivo
        command_frame.grid_columnconfigure(1, weight=1)
        
        ctk.CTkLabel(
            command_frame,
            text="Cmd:",
            font=ctk.CTkFont(size=11)
        ).grid(row=0, column=0, padx=5, pady=3, sticky="w")
        
        self.command_entry = ctk.CTkEntry(
            command_frame,
            placeholder_text="Digite comando (ex: say Hello)",
            font=ctk.CTkFont(size=10)
        )
        self.command_entry.grid(row=0, column=1, padx=5, pady=3, sticky="ew")
        
        self.send_command_button = ctk.CTkButton(
            command_frame,
            text="📤",
            command=self.send_command,
            height=28,
            width=40,
            state="disabled"
        )
        self.send_command_button.grid(row=0, column=2, padx=5, pady=3)
        
        # Bind Enter key
        self.command_entry.bind("<Return>", lambda e: self.send_command())
        
        # Inicializar estado dos botões
        self.update_button_states()
    
    def start_server(self):
        """Iniciar servidor"""
        try:
            self.log_message("🚀 Iniciando servidor...")
            
            # Desabilitar botão
            self.start_server_button.configure(state="disabled")
            
            # Iniciar servidor em thread separada
            def start_thread():
                try:
                    self.server_manager.start_server(callback=self.on_server_log)
                    self.log_message("✅ Servidor iniciado com sucesso!")
                except Exception as e:
                    self.log_message(f"❌ Erro ao iniciar servidor: {str(e)}")
                finally:
                    self.update_button_states()
            
            threading.Thread(target=start_thread, daemon=True).start()
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao iniciar servidor: {str(e)}")
            self.update_button_states()
    
    def stop_server(self):
        """Parar servidor"""
        try:
            self.log_message("⏹️ Parando servidor...")
            
            # Desabilitar botão
            self.stop_server_button.configure(state="disabled")
            
            # Parar servidor em thread separada
            def stop_thread():
                try:
                    self.server_manager.stop_server()
                    self.log_message("✅ Servidor parado com sucesso!")
                except Exception as e:
                    self.log_message(f"❌ Erro ao parar servidor: {str(e)}")
                finally:
                    self.update_button_states()
            
            threading.Thread(target=stop_thread, daemon=True).start()
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao parar servidor: {str(e)}")
            self.update_button_states()
    
    def start_playit(self):
        """Iniciar Playit"""
        try:
            self.log_message("🌍 Iniciando Playit...")
            
            # Desabilitar botão
            self.start_playit_button.configure(state="disabled")
            
            # Iniciar Playit em thread separada
            def start_thread():
                try:
                    self.server_manager.start_playit(callback=self.on_playit_log)
                    self.log_message("✅ Playit iniciado com sucesso!")
                except Exception as e:
                    self.log_message(f"❌ Erro ao iniciar Playit: {str(e)}")
                finally:
                    self.update_button_states()
            
            threading.Thread(target=start_thread, daemon=True).start()
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao iniciar Playit: {str(e)}")
            self.update_button_states()
    
    def stop_playit(self):
        """Parar Playit"""
        try:
            self.log_message("⏹️ Parando Playit...")
            
            # Desabilitar botão
            self.stop_playit_button.configure(state="disabled")
            
            # Parar Playit em thread separada
            def stop_thread():
                try:
                    self.server_manager.stop_playit()
                    self.log_message("✅ Playit parado com sucesso!")
                except Exception as e:
                    self.log_message(f"❌ Erro ao parar Playit: {str(e)}")
                finally:
                    self.update_button_states()
            
            threading.Thread(target=stop_thread, daemon=True).start()
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao parar Playit: {str(e)}")
            self.update_button_states()
    
    def send_command(self):
        """Enviar comando para o servidor"""
        command = self.command_entry.get().strip()
        
        if not command:
            return
        
        try:
            self.server_manager.send_command(command)
            self.log_message(f"📤 Comando enviado: {command}")
            self.command_entry.delete(0, 'end')
        except Exception as e:
            self.log_message(f"❌ Erro ao enviar comando: {str(e)}")
    
    def log_message(self, message):
        """Adicionar mensagem ao log do servidor"""
        import datetime
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        formatted_message = f"[{timestamp}] {message}\n"

        self.log_text.insert("end", formatted_message)
        self.log_text.see("end")
        lines = self.log_text.get("1.0", "end").split('\n')
        if len(lines) > 200:
            self.log_text.delete("1.0", f"{len(lines)-150}.0")

    def log_playit_message(self, message):
        """Adicionar mensagem ao log do Playit"""
        import datetime
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        formatted_message = f"[{timestamp}] {message}\n"

        self.playit_log_text.insert("end", formatted_message)
        self.playit_log_text.see("end")
        lines = self.playit_log_text.get("1.0", "end").split('\n')
        if len(lines) > 100:
            self.playit_log_text.delete("1.0", f"{len(lines)-70}.0")

    def on_server_log(self, source, message):
        """Callback para logs do servidor"""
        if source == "server":
            self.log_message(f"🖥️ {message}")

    def on_playit_log(self, source, message):
        """Callback para logs do Playit"""
        if source == "playit":
            self.log_playit_message(f"{message}")

    def update_button_states(self):
        """Atualizar estado dos botões"""
        try:
            status = self.server_manager.get_server_status()
            
            # Botões do servidor
            if status['server_running']:
                self.start_server_button.configure(state="disabled")
                self.stop_server_button.configure(state="normal")
                self.send_command_button.configure(state="normal")
            else:
                self.start_server_button.configure(state="normal")
                self.stop_server_button.configure(state="disabled")
                self.send_command_button.configure(state="disabled")
            
            # Botões do Playit
            if status['playit_running']:
                self.start_playit_button.configure(state="disabled")
                self.stop_playit_button.configure(state="normal")
            else:
                self.start_playit_button.configure(state="normal")
                self.stop_playit_button.configure(state="disabled")
                
        except Exception as e:
            print(f"Erro ao atualizar botões: {e}")
    
    def open_playit_website(self):
        """Abrir website do Playit"""
        import webbrowser
        webbrowser.open("https://playit.gg")