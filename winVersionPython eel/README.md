# 🎮 Painel de Administração Minecraft Bedrock Server

Um painel completo de administração local para servidores Minecraft Bedrock Edition, desenvolvido com Python e interface web moderna.

## ✨ Funcionalidades

### 🔧 Configurações do Servidor
- Edição completa do arquivo `server.properties`
- Interface visual para todas as configurações
- Validação automática de valores
- Backup automático antes das alterações

### 🌍 Gerenciamento de Mundos
- Importação de mundos (.zip)
- Substituição automática do mundo atual
- Atualização automática do `level-name` no server.properties
- Preservação de addons aplicados ao mundo

### 🌎 Configurações Avançadas do Mundo
- **Configuração completa do level.dat**: Edite regras de jogo, dificuldade, experimentos
- **Gerenciamento de Game Rules**: Controle ciclos, danos, drops, comandos e muito mais
- **Recursos Experimentais**: Ative/desative funcionalidades beta do Minecraft
- **Aplicação de Addons**: Interface visual para aplicar e remover addons do mundo
- **Configurações de Gameplay**: PvP, keep inventory, respawn, regeneração natural

### 🧩 Gerenciamento de Addons
- Importação de addons (.zip, .mcaddon)
- Detecção automática do tipo (Behavior Pack / Resource Pack)
- Aplicação automática aos mundos
- Leitura inteligente de manifest.json (remove comentários)
- Prevenção de duplicatas
- Interface para aplicar/remover addons específicos por mundo

### 👥 Gerenciamento de Jogadores
- Lista de operadores (OPs)
- Adição e remoção de operadores
- Edição do arquivo `ops.json`
- Interface intuitiva para gerenciamento

### 🌐 Controle do Servidor
- **Iniciar/Parar servidor**: Controle completo do processo do servidor
- **Console em tempo real**: Visualize logs e envie comandos
- **Status do servidor**: Monitore PID, uptime e estado
- **Túnel Playit.gg**: Configure acesso remoto facilmente

## 🚀 Instalação e Uso

### Opção 1: Executável (Recomendado)

1. **Baixe o executável**
   - Baixe `MinecraftBedrockPanel.exe` da seção de releases
   - Ou use o instalador `install.bat` para instalação automática

2. **Execute o painel**
   - Clique duas vezes no executável
   - O painel abrirá automaticamente no navegador

3. **Configure o servidor**
   - Clique em "Selecionar Pasta do Servidor"
   - Navegue até a pasta do seu servidor Bedrock
   - O painel será configurado automaticamente

### Opção 2: Código Fonte

1. **Clone ou baixe o projeto**
```bash
git clone <repository-url>
cd minecraft-bedrock-panel
```

2. **Instale as dependências**
```bash
pip install -r requirements.txt
```

3. **Execute o painel**
```bash
python server/main.py
```

### Opção 3: Build Personalizado

1. **Execute o script de build**
```bash
python build.py
```

2. **Encontre os arquivos gerados**
   - `dist/MinecraftBedrockPanel.exe` - Executável principal
   - `dist/install.bat` - Instalador para Windows
   - `dist/MinecraftBedrockPanel_Portable/` - Versão portátil

## 🖥️ Interface

### Design Moderno
- Interface em modo escuro
- Design responsivo para desktop e mobile
- Animações suaves e micro-interações
- Ícones Font Awesome para melhor UX

### Navegação por Abas
- **Configurações**: Edição do server.properties
- **Mundos**: Importação e gerenciamento de mundos
- **Config. Mundo**: Configurações avançadas do mundo atual
- **Addons**: Instalação e aplicação de addons
- **Jogadores**: Gerenciamento de operadores
- **Rede**: Configuração de túneis Playit.gg
- **Console**: Controle e monitoramento do servidor

## 📁 Estrutura do Projeto

```
minecraft-painel/
├── server/                    # Backend Python
│   ├── main.py               # Aplicação principal e rotas Eel
│   ├── editor_server.py      # Manipulação de server.properties
│   ├── mundos.py             # Gerenciamento de mundos
│   ├── addons.py             # Gerenciamento de addons
│   ├── jogadores.py          # Gerenciamento de jogadores
│   ├── rede.py               # Gerenciamento de rede (Playit.gg)
│   ├── servidor.py           # Controle do servidor Minecraft
│   └── world_config.py       # Configurações avançadas do mundo
├── web/                      # Interface web
│   ├── index.html            # Página principal
│   ├── world-config.html     # Página de configuração do mundo
│   ├── style.css             # Estilos (modo escuro)
│   ├── script.js             # Lógica frontend principal
│   └── world-config.js       # Lógica da configuração do mundo
├── build.py                  # Script de build e empacotamento
├── requirements.txt          # Dependências Python
└── README.md                # Documentação
```

## 🔧 Funcionalidades Técnicas

### Configurações Avançadas do Mundo
- **Game Rules Completas**: Mais de 30 regras configuráveis
- **Experimentos**: Controle de recursos beta e experimentais
- **Aplicação de Addons**: Interface drag-and-drop para addons
- **Backup Automático**: Configurações salvas em JSON auxiliar
- **Validação**: Verificação de tipos e valores válidos

### Processamento de Addons
- Leitura inteligente de `manifest.json`
- Remoção automática de comentários JavaScript
- Detecção de tipo baseada em módulos
- Aplicação automática aos arquivos do mundo
- Gerenciamento por UUID para evitar duplicatas

### Controle do Servidor
- Processo em background com captura de logs
- Envio de comandos em tempo real
- Monitoramento de status e uptime
- Parada graceful com fallback para kill

### Gerenciamento de Arquivos
- Backup automático antes de alterações
- Validação de integridade de arquivos
- Tratamento seguro de arquivos ZIP
- Prevenção de corrupção de dados

### Interface Responsiva
- Adaptação automática para diferentes tamanhos de tela
- Navegação otimizada para mobile
- Loading states e feedback visual
- Modais para confirmações e erros

## 🛡️ Segurança

- Backup automático de arquivos críticos
- Validação de entrada de dados
- Tratamento seguro de arquivos
- Prevenção de sobrescrita acidental
- Isolamento de processos

## 🔄 Compatibilidade

- **Sistemas Operacionais**: Windows, Linux, macOS
- **Python**: 3.7+
- **Minecraft Bedrock**: Todas as versões atuais
- **Navegadores**: Chrome, Firefox, Safari, Edge

## 📝 Como Usar

### Primeira Execução
1. Execute `MinecraftBedrockPanel.exe` ou `python server/main.py`
2. Clique em "Selecionar Pasta do Servidor"
3. Navegue até a pasta do seu servidor Bedrock
4. O painel carregará automaticamente as configurações

### Editando Configurações do Servidor
1. Vá para a aba "Configurações"
2. Modifique os valores desejados
3. Clique em "Salvar Configurações"
4. Reinicie o servidor para aplicar as mudanças

### Configurando o Mundo
1. Vá para a aba "Config. Mundo"
2. Clique em "Abrir Configurações Avançadas"
3. Configure game rules, experimentos e addons
4. Salve as configurações

### Importando Mundos
1. Vá para a aba "Mundos"
2. Clique em "Importar Mundo (.zip)"
3. Selecione o arquivo ZIP do mundo
4. O mundo será importado e configurado automaticamente

### Instalando Addons
1. Vá para a aba "Addons"
2. Clique em "Importar Addon (.zip/.mcaddon)"
3. Selecione o arquivo do addon
4. O addon será instalado na biblioteca

### Aplicando Addons ao Mundo
1. Vá para a aba "Config. Mundo"
2. Clique em "Abrir Configurações Avançadas"
3. Selecione addons da biblioteca e clique em "Aplicar"
4. Os addons serão aplicados automaticamente

### Gerenciando Operadores
1. Vá para a aba "Jogadores"
2. Digite o nome do jogador no campo
3. Clique em "Adicionar OP"
4. Use o botão "Remover" para remover operadores

### Controlando o Servidor
1. Vá para a aba "Console"
2. Use os botões "Iniciar/Parar Servidor"
3. Digite comandos no campo inferior
4. Monitore logs em tempo real

## 🐛 Solução de Problemas

### Erro ao Selecionar Pasta
- Certifique-se de que a pasta contém um servidor Bedrock válido
- Verifique se você tem permissões de leitura/escrita na pasta

### Addon Não Aplicado
- Verifique se o arquivo manifest.json está presente
- Certifique-se de que o addon é compatível com Bedrock Edition
- Use a interface de configuração do mundo para aplicar manualmente

### Configurações Não Salvam
- Verifique se o arquivo server.properties não está sendo usado por outro processo
- Certifique-se de ter permissões de escrita na pasta do servidor

### Servidor Não Inicia
- Verifique se o arquivo bedrock_server.exe está presente
- Certifique-se de que não há outro servidor rodando na mesma porta
- Verifique os logs no console para erros específicos

## 🏗️ Build e Distribuição

### Criando Executável
```bash
python build.py
```

### Arquivos Gerados
- `dist/MinecraftBedrockPanel.exe` - Executável principal
- `dist/install.bat` - Instalador automático
- `dist/MinecraftBedrockPanel_Portable/` - Versão portátil completa

### Requisitos para Build
- Python 3.7+
- PyInstaller
- Todas as dependências do requirements.txt

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🙏 Agradecimentos

- Comunidade Minecraft Bedrock
- Desenvolvedores do Eel
- Desenvolvedores do PyInstaller
- Contribuidores do projeto

---

**Desenvolvido com ❤️ para a comunidade Minecraft Bedrock**