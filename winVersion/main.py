import customtkinter as ctk
from src.gui.main_window import MinecraftPanel
import sys
import os

def main():
    try:
        # Configurar tema escuro
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")
        
        # Criar e executar aplicação
        app = MinecraftPanel()
        try:
            app.iconbitmap("icon.ico")
            app.wm_iconbitmap("icon.ico")
        except Exception:
            pass  # Ignora erro se não encontrar o ícone

        # Definir ícone na barra de tarefas (Windows)
        if os.name == "nt":
            try:
                import ctypes
                myappid = u'minecraft.server.manager'  # Nome único para o app
                ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
            except Exception:
                pass

        app.mainloop()
        
    except KeyboardInterrupt:
        # Capturar Ctrl+C e fechar graciosamente
        print("\nFechando aplicação...")
        sys.exit(0)
    except Exception as e:
        print(f"Erro na aplicação: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()