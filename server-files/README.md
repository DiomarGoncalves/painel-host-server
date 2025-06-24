# Minecraft Bedrock Server Files

Esta pasta contém todos os arquivos necessários para o servidor Minecraft Bedrock.

## Estrutura de Pastas:

### `/worlds`
Coloque aqui os mundos do seu servidor Minecraft Bedrock.
Cada mundo deve estar em sua própria pasta.

### `/behavior_packs`
Coloque aqui os behavior packs (pacotes de comportamento) do servidor.
Formatos suportados: pastas descompactadas ou arquivos .mcpack/.mcaddon

### `/resource_packs`
Coloque aqui os resource packs (pacotes de recursos/texturas) do servidor.
Formatos suportados: pastas descompactadas ou arquivos .mcpack/.mcaddon

### `/backups`
Esta pasta armazenará os backups automáticos e manuais dos mundos.

### `/playit`
Esta pasta conterá o cliente Playit.gg para criar túneis externos.

## Arquivos Necessários:

1. **bedrock_server.exe** - O executável principal do servidor Bedrock
2. **server.properties** - Arquivo de configuração principal do servidor
3. **allowlist.json** - Lista de jogadores permitidos (se whitelist estiver ativo)
4. **permissions.json** - Configurações de permissões dos jogadores

## Como Usar:

1. Baixe o servidor Minecraft Bedrock oficial da Microsoft
2. Extraia todos os arquivos para esta pasta (`server-files`)
3. Configure o `server.properties` através da interface do painel
4. Adicione mundos na pasta `worlds`
5. Instale addons através da interface do painel
6. Use o painel para iniciar/parar o servidor

## Observações:

- Certifique-se de que o `bedrock_server.exe` tenha permissões de execução
- Mantenha backups regulares dos seus mundos
- O painel gerenciará automaticamente a maioria das configurações