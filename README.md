# 🎮 Minecraft Bedrock Server Manager

Uma interface gráfica moderna e completa para gerenciar servidores Minecraft Bedrock Edition, desenvolvida em Python com CustomTkinter.

## ✨ Funcionalidades

### 🎮 **Controle do Servidor**
- **Iniciar/Parar Servidor**: Controle completo do servidor Minecraft
- **Integração Playit.gg**: Túnel automático para acesso pela internet
- **Console em Tempo Real**: Visualize logs e envie comandos
- **Status em Tempo Real**: Informações de jogadores online, IP e status

### ⚙️ **Configurações Avançadas**
- **Editor de server.properties**: Interface amigável para todas as configurações
- **Configurações do Mundo**: Edite gamerules e configurações específicas
- **Recursos Experimentais**: Ative/desative funcionalidades beta

### 🌍 **Gerenciamento de Mundos**
- **Importar Mundos**: Suporte para ZIP e pastas
- **Ativar Mundos**: Troque entre diferentes mundos facilmente
- **Backup Automático**: Proteção dos seus mundos

### 🧩 **Sistema de Addons Inteligente**
- **Biblioteca de Addons**: Importe addons (.mcaddon, ZIP, pastas) para biblioteca
- **Aplicação Seletiva**: Aplique addons específicos a mundos específicos
- **Gerenciamento Separado**: Behavior packs e resource packs organizados

### 👥 **Gerenciamento de Jogadores**
- **Jogadores Online**: Visualize quem está conectado em tempo real
- **Sistema de Operadores**: Adicione/remova OPs facilmente
- **Comandos de Moderação**: Expulse jogadores diretamente da interface

## 📋 Pré-requisitos

- **Python 3.8+**
- **Servidor Minecraft Bedrock Edition**
- **Playit.gg** (opcional, para acesso pela internet)

## 🚀 Instalação Rápida

1. **Clone/Baixe o projeto**
2. **Instale dependências:**
   ```bash
   pip install -r requirements.txt


   para buiild:pip install -r requirements_build.txt

   rodar o build :python build_exe.py
   ```
3. **Execute:**
   ```bash
   python main.py
   ```

## 📁 Estrutura do Servidor

```
servidor_minecraft/
├── bedrock_server.exe (Windows) ou bedrock_server (Linux)
├── server.properties
├── worlds/
├── development_behavior_packs/
├── development_resource_packs/
├── ops.json
└── permissions.json
```

## 🎯 Guia de Uso

### 1. **Controle do Servidor**
- **▶️ Iniciar**: Inicia o servidor Minecraft
- **⏹️ Parar**: Para o servidor com segurança
- **🌍 Playit**: Cria túnel para acesso externo
- **💻 Console**: Monitore logs e envie comandos

### 2. **Configurações**
- **Básicas**: Nome, porta, modo de jogo, dificuldade
- **Segurança**: Whitelist, anti-pirata, permissões
- **Rede**: Configurações de conexão e performance
- **Avançadas**: Anti-cheat, movimento, telemetria

### 3. **Mundos**
- **Importar**: Arraste ZIP ou selecione pasta
- **Ativar**: Clique para trocar mundo ativo
- **Gerenciar**: Visualize mundos disponíveis

### 4. **Addons (Nova Lógica)**
- **📚 Biblioteca**: Importe addons para biblioteca central
- **🎯 Aplicação**: Na aba "Config. Mundo", aplique addons específicos
- **🔄 Flexibilidade**: Use diferentes addons em mundos diferentes

### 5. **Jogadores**
- **🟢 Online**: Veja jogadores conectados em tempo real
- **👑 Operadores**: Gerencie lista de OPs
- **⚠️ Moderação**: Expulse jogadores quando necessário

## 🔧 Recursos Avançados

### **Status em Tempo Real**
- Servidor Online/Offline
- Contagem de jogadores (X/Y)
- IP e porta do servidor
- Status do Playit.gg

### **Sistema de Addons Inteligente**
```
1. Importe addons → Biblioteca
2. Configure mundo → Aplique addons específicos
3. Diferentes mundos → Diferentes addons
```

### **Console Integrado**
- Logs em tempo real
- Envio de comandos
- Histórico de ações
- Monitoramento de jogadores

## 🐛 Solução de Problemas

### **Erro ao Fechar**
✅ **Corrigido**: Tratamento adequado de KeyboardInterrupt

### **Servidor não Encontrado**
- Execute na pasta do servidor OU
- Selecione pasta manualmente quando solicitado

### **Playit não Funciona**
- Baixe em: https://playit.gg
- Instale e configure antes de usar

### **Addons não Aparecem**
- Verifique manifest.json válido
- Use aba "Config. Mundo" para aplicar ao mundo

## 🆕 Novidades desta Versão

- ✅ **Controles de Servidor**: Iniciar/parar servidor e Playit
- ✅ **Status em Tempo Real**: Jogadores online, IP, status
- ✅ **Nova Lógica de Addons**: Biblioteca separada da aplicação
- ✅ **Console Integrado**: Logs e comandos em tempo real
- ✅ **Correção de Fechamento**: Sem mais erros ao fechar
- ✅ **Jogadores Online**: Visualização em tempo real
- ✅ **Moderação**: Expulsar jogadores pela interface

## 🤝 Contribuição

Contribuições são bem-vindas! 
- 🐛 Reporte bugs
- 💡 Sugira funcionalidades  
- 🔧 Envie pull requests

## 📄 Licença

Projeto open source para a comunidade Minecraft!

---

**🎮 Desenvolvido com ❤️ para servidores Minecraft Bedrock**

*Versão 2.0 - Controle Total do Servidor*