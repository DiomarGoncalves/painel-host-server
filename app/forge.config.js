const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

const path = require('path');

const isWin = process.platform === 'win32';
const isLinux = process.platform === 'linux';
const isMac = process.platform === 'darwin';

module.exports = {
  packagerConfig: {
    name: 'Minecraft Bedrock Panel',
    executableName: 'minecraft-bedrock-panel',
    // Forçar o caminho do ícone conforme plataforma
    icon: isWin
      ? path.resolve(__dirname, 'web/icon.ico')
      : path.resolve(__dirname, 'web/icon.png'),
    asar: { unpackDir: '**/node_modules/*' }, // Corrigido para funcionar com AutoUnpackNatives
    extraResource: ['./web'],
    ignore: [
      /^\/\.git/,
      /^\/node_modules\/\.cache/,
      /^\/\.nyc_output/,
      /^\/coverage/,
      /^\/\.vscode/,
      /^\/README\.md$/,
      /^\/\.gitignore$/,
      /^\/forge\.config\.js$/
    ],
    win32metadata: {
      CompanyName: 'Minecraft Bedrock Panel',
      FileDescription: 'Painel de gerenciamento para servidor Minecraft Bedrock',
      OriginalFilename: 'minecraft-bedrock-panel.exe',
      ProductName: 'Minecraft Bedrock Panel',
      InternalName: 'minecraft-bedrock-panel'
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'minecraft_bedrock_panel',
        authors: 'Minecraft Bedrock Panel',
        description: 'Painel de gerenciamento para servidor Minecraft Bedrock',
        setupIcon: path.resolve(__dirname, 'web/icon.ico'),
        iconUrl: path.resolve(__dirname, 'web/icon.ico'),
        noMsi: true,
        setupExe: 'minecraft-bedrock-panel-setup.exe'
      }
    },
    { name: '@electron-forge/maker-zip', platforms: ['darwin', 'linux'] },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Minecraft Bedrock Panel <contato@exemplo.com>',
          homepage: 'https://github.com/minecraft-bedrock-panel',
          description: 'Painel de gerenciamento para servidor Minecraft Bedrock',
          productDescription: 'Uma ferramenta completa para gerenciar servidores Minecraft Bedrock Edition',
          categories: ['Game', 'Utility'],
          priority: 'optional',
          section: 'games',
          icon: path.resolve(__dirname, 'web/icon.png')
        }
      }
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          maintainer: 'Minecraft Bedrock Panel <contato@exemplo.com>',
          homepage: 'https://github.com/minecraft-bedrock-panel',
          description: 'Painel de gerenciamento para servidor Minecraft Bedrock',
          productDescription: 'Uma ferramenta completa para gerenciar servidores Minecraft Bedrock Edition',
          categories: ['Game', 'Utility'],
          icon: path.resolve(__dirname, 'web/icon.png'),
          license: 'MIT'
        }
      }
    }
  ],
  plugins: [
    { name: '@electron-forge/plugin-auto-unpack-natives', config: {} },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true
    })
  ]
};
