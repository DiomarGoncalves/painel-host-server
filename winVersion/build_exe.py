"""
Script para criar executável do Minecraft Server Manager
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path

def install_pyinstaller():
    """Instalar PyInstaller se não estiver instalado"""
    try:
        import PyInstaller
        print("✅ PyInstaller já está instalado")
    except ImportError:
        print("📦 Instalando PyInstaller...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
        print("✅ PyInstaller instalado com sucesso!")

def create_executable():
    """Criar executável"""
    print("🚀 Criando executável do Minecraft Server Manager...")
    
    # Comando PyInstaller usando python -m PyInstaller
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",                    # Arquivo único
        "--windowed",                   # Sem console (GUI)
        "--name=MinecraftServerManager", # Nome do executável
        "--icon=icon.ico",              # Ícone (se existir)
        "--add-data=src;src",           # Incluir pasta src
        "--hidden-import=customtkinter", # Importações ocultas
        "--hidden-import=PIL",
        "--hidden-import=tkinter",
        "--clean",                      # Limpar cache
        "main.py"                       # Arquivo principal
    ]
    
    # Remover --icon se não existir
    if not os.path.exists("icon.ico"):
        icon_arg = "--icon=icon.ico"
        if icon_arg in cmd:
            cmd.remove(icon_arg)
        print("⚠️ Arquivo icon.ico não encontrado, criando sem ícone")
    
    try:
        subprocess.run(cmd, check=True)
        print("✅ Executável criado com sucesso!")
        
        # Verificar se foi criado
        exe_path = os.path.join("dist", "MinecraftServerManager.exe")
        if os.path.exists(exe_path):
            size_mb = os.path.getsize(exe_path) / (1024 * 1024)
            print(f"📁 Executável: {exe_path}")
            print(f"📏 Tamanho: {size_mb:.1f} MB")
            
            # Criar pasta de distribuição
            dist_folder = "MinecraftServerManager_Portable"
            if os.path.exists(dist_folder):
                try:
                    shutil.rmtree(dist_folder)
                except PermissionError:
                    print(f"❌ Não foi possível remover '{dist_folder}'. Feche qualquer instância do executável e tente novamente.")
                    return False
            
            os.makedirs(dist_folder)
            
            # Copiar executável
            shutil.copy2(exe_path, dist_folder)
            
            # Criar README
            create_readme(dist_folder)
            
            print(f"📦 Pasta de distribuição criada: {dist_folder}")
            print("🎉 Pronto para distribuir!")
            
        else:
            print("❌ Erro: Executável não foi criado")
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao criar executável: {e}")
        return False
    
    return True

def create_readme(dist_folder):
    """Criar arquivo README para distribuição"""
    readme_content = """# 🎮 Minecraft Bedrock Server Manager

## 📋 Como Usar

1. **Coloque o executável na pasta do seu servidor Minecraft Bedrock**
   - A pasta deve conter: bedrock_server.exe, server.properties, etc.

2. **Execute o MinecraftServerManager.exe**

3. **Recursos Disponíveis:**
   - ✅ Controle completo do servidor (iniciar/parar)
   - ✅ Configuração de server.properties
   - ✅ Gerenciamento de mundos
   - ✅ Sistema de addons
   - ✅ Gerenciamento de jogadores
   - ✅ Integração com Playit.gg

## 🌍 Playit.gg (Opcional)

Para acesso pela internet, baixe o Playit em: https://playit.gg
- Extraia o playit.exe na pasta: `servidor_minecraft/playit/playit.exe`

## 📁 Estrutura Recomendada

```
servidor_minecraft/
├── MinecraftServerManager.exe  ← Este arquivo
├── bedrock_server.exe
├── server.properties
├── worlds/
├── development_behavior_packs/
├── development_resource_packs/
└── playit/
    └── playit.exe  ← Para acesso pela internet
```

## 🆘 Suporte

- Certifique-se de que o executável está na pasta correta do servidor
- O programa detectará automaticamente os arquivos do servidor
- Em caso de problemas, verifique se todos os arquivos estão presentes

---
**Desenvolvido com ❤️ para a comunidade Minecraft Bedrock**
"""
    
    readme_path = os.path.join(dist_folder, "README.md")
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)

def cleanup():
    """Limpar arquivos temporários"""
    print("🧹 Limpando arquivos temporários...")
    
    folders_to_remove = ["build", "__pycache__"]
    files_to_remove = ["MinecraftServerManager.spec"]
    
    for folder in folders_to_remove:
        if os.path.exists(folder):
            shutil.rmtree(folder)
            print(f"🗑️ Removido: {folder}")
    
    for file in files_to_remove:
        if os.path.exists(file):
            os.remove(file)
            print(f"🗑️ Removido: {file}")

def main():
    """Função principal"""
    print("🎮 Minecraft Server Manager - Build Script")
    print("=" * 50)
    
    # Verificar se estamos no diretório correto
    if not os.path.exists("main.py"):
        print("❌ Erro: main.py não encontrado!")
        print("Execute este script na pasta raiz do projeto")
        return
    
    # Instalar PyInstaller
    install_pyinstaller()
    
    # Criar executável
    if create_executable():
        # Limpar arquivos temporários
        cleanup()
        
        print("\n🎉 Build concluído com sucesso!")
        print("📦 Verifique a pasta 'MinecraftServerManager_Portable'")
    else:
        print("\n❌ Build falhou!")

if __name__ == "__main__":
    main()