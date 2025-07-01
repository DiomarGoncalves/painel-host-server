#!/usr/bin/env python3
"""
Script de build para criar executável do Painel Minecraft Bedrock
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

def safe_print(message):
    """Imprime mensagem de forma segura"""
    try:
        print(message)
    except UnicodeEncodeError:
        # Fallback para ASCII
        ascii_message = message.encode('ascii', errors='replace').decode('ascii')
        print(ascii_message)

def check_requirements():
    """Verificar se as dependências estão instaladas"""
    required_packages = ['pyinstaller', 'eel', 'psutil']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        safe_print(f"Pacotes faltando: {', '.join(missing_packages)}")
        safe_print("Instalando dependencias...")
        
        for package in missing_packages:
            subprocess.run([sys.executable, '-m', 'pip', 'install', package], check=True)
        
        safe_print("Dependencias instaladas com sucesso!")

def clean_build_dirs():
    """Limpar diretórios de build anteriores"""
    dirs_to_clean = ['build', 'dist', '__pycache__']
    
    for dir_name in dirs_to_clean:
        if os.path.exists(dir_name):
            safe_print(f"Limpando {dir_name}/")
            shutil.rmtree(dir_name)

def verify_web_folder():
    """Verificar se a pasta web existe"""
    web_folder = Path('web')
    if not web_folder.exists():
        safe_print("ERRO: Pasta 'web' nao encontrada!")
        safe_print("Certifique-se de que a pasta web esta no diretorio raiz do projeto")
        return False
    
    required_files = ['index.html', 'style.css', 'script.js', 'world-config.html', 'world-config.js']
    missing_files = []
    
    for file in required_files:
        if not (web_folder / file).exists():
            missing_files.append(file)
    
    if missing_files:
        safe_print(f"AVISO: Arquivos web faltando: {', '.join(missing_files)}")
    
    safe_print(f"Pasta web verificada: {len(list(web_folder.iterdir()))} arquivos encontrados")
    return True

def create_spec_file():
    """Criar arquivo .spec personalizado para PyInstaller"""
    spec_content = '''# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['server/main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('web/*', 'web'),
        ('web', 'web'),
        ('requirements.txt', '.'),
        ('README.md', '.'),
    ],
    hiddenimports=[
        'eel',
        'psutil',
        'tkinter',
        'tkinter.filedialog',
        'tkinter.messagebox',
        'json',
        'pathlib',
        'zipfile',
        'shutil',
        'configparser',
        'subprocess',
        'threading',
        'queue',
        'time',
        'platform',
        're',
        'os',
        'struct',
        'unicodedata',
        'tempfile',
        'locale',
        'codecs',
        'io',
        'webbrowser',
        'socket',
        'urllib',
        'urllib.parse',
        'urllib.request',
        'http',
        'http.server',
        'socketserver',
        'bottle',
        'gevent',
        'gevent.pywsgi',
        'whichcraft',
        'pkg_resources'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='MinecraftBedrockPanel',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    cofile_version=None,
    version='version_info.txt' if os.path.exists('version_info.txt') else None,
    icon='icon.ico' if os.path.exists('icon.ico') else None,
)
'''
    
    with open('minecraft_panel.spec', 'w', encoding='utf-8') as f:
        f.write(spec_content)
    
    safe_print("Arquivo .spec criado")

def create_version_info():
    """Criar arquivo de informações de versão"""
    version_info = '''# UTF-8
VSVersionInfo(
  ffi=FixedFileInfo(
    filevers=(1,0,0,0),
    prodvers=(1,0,0,0),
    mask=0x3f,
    flags=0x0,
    OS=0x40004,
    fileType=0x1,
    subtype=0x0,
    date=(0, 0)
    ),
  kids=[
    StringFileInfo(
      [
      StringTable(
        u'040904B0',
        [StringStruct(u'CompanyName', u'Minecraft Bedrock Panel'),
        StringStruct(u'FileDescription', u'Painel de Administracao Minecraft Bedrock Server'),
        StringStruct(u'FileVersion', u'1.0.0.0'),
        StringStruct(u'InternalName', u'MinecraftBedrockPanel'),
        StringStruct(u'LegalCopyright', u'(c) 2024 Minecraft Bedrock Panel'),
        StringStruct(u'OriginalFilename', u'MinecraftBedrockPanel.exe'),
        StringStruct(u'ProductName', u'Minecraft Bedrock Panel'),
        StringStruct(u'ProductVersion', u'1.0.0.0')])
      ]), 
    VarFileInfo([VarStruct(u'Translation', [1033, 1200])])
  ]
)
'''
    
    with open('version_info.txt', 'w', encoding='utf-8') as f:
        f.write(version_info)
    
    safe_print("Arquivo de versao criado")

def build_executable():
    """Construir executável com PyInstaller"""
    safe_print("Construindo executavel...")
    
    # Usar apenas o arquivo .spec sem opções conflitantes
    cmd = [
        'pyinstaller',
        '--clean',
        '--noconfirm',
        'minecraft_panel.spec'
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    
    if result.returncode == 0:
        safe_print("Executavel criado com sucesso!")
        return True
    else:
        safe_print("Erro ao criar executavel:")
        safe_print(result.stderr)
        return False

def copy_web_to_dist():
    """Copia pasta web para o diretório dist (backup manual)"""
    try:
        web_source = Path('web')
        web_dest = Path('dist/web')
        
        if web_source.exists():
            if web_dest.exists():
                shutil.rmtree(web_dest)
            shutil.copytree(web_source, web_dest)
            safe_print("Pasta web copiada manualmente para dist/")
            return True
    except Exception as e:
        safe_print(f"Erro ao copiar pasta web: {e}")
    
    return False

def create_portable_package():
    """Criar pacote portátil"""
    safe_print("Criando pacote portatil...")
    
    portable_dir = Path('dist/MinecraftBedrockPanel_Portable')
    portable_dir.mkdir(exist_ok=True)
    
    # Copiar executável
    shutil.copy2('dist/MinecraftBedrockPanel.exe', portable_dir)
    
    # Copiar pasta web
    web_source = Path('web')
    web_dest = portable_dir / 'web'
    
    if web_source.exists():
        if web_dest.exists():
            shutil.rmtree(web_dest)
        shutil.copytree(web_source, web_dest)
        safe_print("Pasta web copiada para o pacote portatil")
    else:
        safe_print("AVISO: Pasta web nao encontrada!")
    
    # Copiar documentação
    if os.path.exists('README.md'):
        shutil.copy2('README.md', portable_dir)
    
    # Criar arquivo de informações
    info_content = '''# Minecraft Bedrock Panel - Versao Portatil

## Como usar:

1. **Execute o painel**: Clique duas vezes em `MinecraftBedrockPanel.exe`
2. **Selecione a pasta do servidor**: Use o botao "Selecionar Pasta do Servidor"
3. **Configure seu servidor**: Use as abas para gerenciar configuracoes, mundos, addons e jogadores

## Estrutura de Arquivos:

```
MinecraftBedrockPanel_Portable/
├── MinecraftBedrockPanel.exe    # Executavel principal
├── web/                         # Interface web
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── world-config.html
│   └── world-config.js
└── LEIA-ME.md                  # Este arquivo
```

## Requisitos:

- Windows 10/11
- Servidor Minecraft Bedrock Edition
- Navegador web moderno

## Solucao de Problemas:

### Painel fecha imediatamente:
1. Verifique se a pasta `web` esta presente
2. Certifique-se de que nao ha antivirus bloqueando

### Pasta web nao encontrada:
- Certifique-se de que a pasta `web` esta no mesmo diretorio do executavel
- Todos os arquivos HTML, CSS e JS devem estar presentes

### Erro de permissoes:
- Execute como administrador se necessario
- Verifique se a pasta tem permissoes de escrita

## Funcionalidades:

- Configuracoes: Edite server.properties
- Mundos: Importe e gerencie mundos
- Addons: Instale behavior packs e resource packs
- Jogadores: Gerencie operadores
- Rede: Configure tuneis Playit.gg
- Console: Monitore e controle o servidor

---
**Desenvolvido para a comunidade Minecraft Bedrock**
'''
    
    with open(portable_dir / 'LEIA-ME.md', 'w', encoding='utf-8') as f:
        f.write(info_content)
    
    safe_print("Pacote portatil criado em dist/MinecraftBedrockPanel_Portable/")

def main():
    """Função principal do build"""
    safe_print("Minecraft Bedrock Panel - Build Script")
    safe_print("=" * 50)
    
    try:
        # Verificar pasta web primeiro
        if not verify_web_folder():
            safe_print("\nBuild cancelado devido a problemas com a pasta web.")
            return 1
        
        # Verificar e instalar dependências
        check_requirements()
        
        # Limpar builds anteriores
        clean_build_dirs()
        
        # Criar arquivos necessários
        create_spec_file()
        create_version_info()
        
        # Construir executável
        if build_executable():
            # Copiar pasta web manualmente (backup)
            copy_web_to_dist()
            # Não criar instalador e scripts .bat
            create_portable_package()
            
            # Verificar resultado
            if verify_build_result():
                safe_print("\n" + "=" * 50)
                safe_print("BUILD CONCLUIDO COM SUCESSO!")
                safe_print("=" * 50)
                safe_print("Arquivos gerados:")
                safe_print("   • dist/MinecraftBedrockPanel.exe - Executavel principal")
                safe_print("   • dist/MinecraftBedrockPanel_Portable/ - Versao portatil")
                safe_print("\nPara testar:")
                safe_print("   1. Va para dist/MinecraftBedrockPanel_Portable/")
                safe_print("   2. Execute MinecraftBedrockPanel.exe")
                safe_print("\nPronto para distribuicao!")
            else:
                safe_print("\nBuild concluido com problemas. Verifique os avisos acima.")
                return 1
        else:
            safe_print("\nBuild falhou. Verifique os erros acima.")
            return 1
            
    except Exception as e:
        safe_print(f"\nErro durante o build: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())