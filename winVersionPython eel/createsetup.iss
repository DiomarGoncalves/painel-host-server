; Instalador profissional com PowerShell embutido
; Gera instalador para painel do servidor Minecraft Bedrock (MCPE)

#define MyAppName "painel server mcpe"
#define MyAppVersion "2.0"
#define MyAppPublisher "alphadevss"
#define MyAppURL "https://www.alphadevss.com.br/"
#define MyAppExeName "MinecraftBedrockPanel.exe"
#define MyAppAssocName MyAppName + " File"
#define MyAppAssocExt ".myp"
#define MyAppAssocKey StringChange(MyAppAssocName, " ", "") + MyAppAssocExt

[Setup]
AppId={{2E770C4B-6C2B-4DC0-A657-EEBC2ED726EE}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={userdocs}\{#MyAppName}
UninstallDisplayIcon={app}\{#MyAppExeName}
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
ChangesAssociations=yes
DisableProgramGroupPage=yes
OutputDir=C:\Users\Diomar\Desktop
OutputBaseFilename=Painel Host MCPE
SetupIconFile=C:\Users\Diomar\Documents\GitHub\painel-host-server\winVersionPython eel\icon.ico
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; EXE principal
Source: "C:\Users\Diomar\Documents\GitHub\painel-host-server\winVersionPython eel\dist\MinecraftBedrockPanel_Portable\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

; Todos os arquivos da pasta portable
Source: "C:\Users\Diomar\Documents\GitHub\painel-host-server\winVersionPython eel\dist\MinecraftBedrockPanel_Portable\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

; Empacote o instalador do Python junto
Source: "C:\Users\Diomar\Documents\GitHub\painel-host-server\winVersionPython eel\python-3.13.5-amd64.exe"; DestDir: "{app}"; Flags: ignoreversion

[Registry]
Root: HKA; Subkey: "Software\Classes\{#MyAppAssocExt}\OpenWithProgids"; ValueType: string; ValueName: "{#MyAppAssocKey}"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\{#MyAppAssocKey}"; ValueType: string; ValueName: ""; ValueData: "{#MyAppAssocName}"; Flags: uninsdeletekey
Root: HKA; Subkey: "Software\Classes\{#MyAppAssocKey}\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName},0"
Root: HKA; Subkey: "Software\Classes\{#MyAppAssocKey}\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""
; Adiciona o Python ao PATH do usuário (não requer reiniciar para novos terminais)
Root: HKCU; Subkey: "Environment"; ValueType: expandsz; ValueName: "Path"; \
    ValueData: "{olddata};C:\Program Files\Python313\"; Flags: preservestringtype uninsdeletevalue

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
; Executa o instalador do Python em modo interativo (tela para o usuário)

Filename: "{app}\python-3.13.5-amd64.exe"; Parameters: ""; WorkingDir: "{app}"; StatusMsg: "Execute a instalação do Python (como admin e selecione o path) para finalizar a configuração."; Flags: postinstall skipifsilent

; Inicia o programa após instalação
Filename: "{app}\{#MyAppExeName}"; Description: "Iniciar {#MyAppName}"; Flags: nowait postinstall skipifsilent
