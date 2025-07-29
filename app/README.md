# Minecraft Bedrock Panel

Um painel de gerenciamento completo para servidores Minecraft Bedrock Edition.

## Características

- 🎮 Gerenciamento completo do servidor Bedrock
- 🌍 Gestão de mundos e backups
- 🧩 Sistema de addons (Behavior Packs e Resource Packs)
- 👥 Gerenciamento de jogadores e operadores
- 🌐 Integração com Playit.gg para acesso remoto
- 🔄 Sistema de atualização do servidor
- 📊 Console em tempo real
- ⚙️ Configurações avançadas

## Instalação

### Pré-requisitos

- Node.js 16 ou superior
- npm ou yarn

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Executar normalmente
npm start
```

### Build

```bash
# Gerar executável para a plataforma atual
npm run make

# Apenas empacotar (sem instalador)
npm run package
```

Os arquivos gerados estarão na pasta `out/`.

### Builds específicas

O Electron Forge irá gerar automaticamente para sua plataforma atual. Para outras plataformas, você pode configurar no `forge.config.js`.

## Estrutura do Projeto

```
minecraft-bedrock-panel/
├── src/
│   ├── main.js              # Processo principal do Electron
│   ├── preload.js           # Script de preload
│   └── modules/             # Módulos do backend
├── web/                     # Interface web
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── world-config.html
├── package.json
├── forge.config.js          # Configuração do Electron Forge
└── README.md
```

## Como Usar

1. Execute o aplicativo
2. Clique em "Selecionar Pasta do Servidor" e escolha a pasta do seu servidor Bedrock
3. Configure o servidor através das abas disponíveis
4. Use o botão "Iniciar Servidor" para começar

## Funcionalidades

### Configurações
- Edição completa do server.properties
- Configurações de gameplay, dificuldade, etc.

### Mundos
- Importação de mundos (.zip, .mcworld)
- Backup automático
- Troca de mundo ativo

### Addons
- Importação de Behavior Packs e Resource Packs
- Aplicação de addons aos mundos
- Gerenciamento completo

### Jogadores
- Adicionar/remover operadores
- Gerenciamento de whitelist

### Rede
- Integração com Playit.gg
- Túnel TCP para acesso remoto
- Logs em tempo real

### Atualização
- Sistema seguro de atualização do servidor
- Preservação de dados importantes
- Backups automáticos

### Console
- Console em tempo real
- Envio de comandos
- Histórico de logs

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Licença

MIT License - veja o arquivo LICENSE para detalhes.

## Suporte

Para suporte, abra uma issue no GitHub ou entre em contato.