// Estado global da aplicação
let currentServerPath = '';
let currentConfig = {};
let logUpdateInterval = null;

// Elementos DOM
const elements = {
    // Buttons
    selectServerBtn: document.getElementById('selectServerBtn'),
    saveConfigBtn: document.getElementById('saveConfigBtn'),
    loadConfigBtn: document.getElementById('loadConfigBtn'),
    importWorldBtn: document.getElementById('importWorldBtn'),
    refreshWorldsBtn: document.getElementById('refreshWorldsBtn'),
    backupWorldBtn: document.getElementById('backupWorldBtn'),
    importAddonBtn: document.getElementById('importAddonBtn'),
    refreshAddonsBtn: document.getElementById('refreshAddonsBtn'),
    addOpBtn: document.getElementById('addOpBtn'),
    
    // World config buttons
    openWorldConfigBtn: document.getElementById('openWorldConfigBtn'),
    refreshWorldConfigBtn: document.getElementById('refreshWorldConfigBtn'),
    
    // Server controls
    startServerBtn: document.getElementById('startServerBtn'),
    stopServerBtn: document.getElementById('stopServerBtn'),
    
    // Network controls
    startPlayitBtn: document.getElementById('startPlayitBtn'),
    stopPlayitBtn: document.getElementById('stopPlayitBtn'),
    restartPlayitBtn: document.getElementById('restartPlayitBtn'),
    refreshPlayitBtn: document.getElementById('refreshPlayitBtn'),
    copyUrlBtn: document.getElementById('copyUrlBtn'),
    clearPlayitLogsBtn: document.getElementById('clearPlayitLogsBtn'),
    
    // Updater controls
    selectNewServerBtn: document.getElementById('selectNewServerBtn'),
    validateServerBtn: document.getElementById('validateServerBtn'),
    updateServerBtn: document.getElementById('updateServerBtn'),
    createBackupBtn: document.getElementById('createBackupBtn'),
    refreshBackupsBtn: document.getElementById('refreshBackupsBtn'),
    
    // Console controls
    sendCommandBtn: document.getElementById('sendCommandBtn'),
    clearConsoleBtn: document.getElementById('clearConsoleBtn'),
    
    // Inputs
    newOpInput: document.getElementById('newOpInput'),
    commandInput: document.getElementById('commandInput'),
    tunnelUrlInput: document.getElementById('tunnelUrlInput'),
    
    // Containers
    configGrid: document.getElementById('configGrid'),
    worldsList: document.getElementById('worldsList'),
    behaviorPacksList: document.getElementById('behaviorPacksList'),
    resourcePacksList: document.getElementById('resourcePacksList'),
    operatorsList: document.getElementById('operatorsList'),
    worldInfo: document.getElementById('worldInfo'),
    appliedAddonsPreview: document.getElementById('appliedAddonsPreview'),
    serverInfo: document.getElementById('serverInfo'),
    validationResult: document.getElementById('validationResult'),
    backupsList: document.getElementById('backupsList'),
    
    // Status
    serverPath: document.getElementById('serverPath'),
    statusMessage: document.getElementById('statusMessage'),
    serverStatus: document.getElementById('serverStatus'),
    serverStatusDot: document.getElementById('serverStatusDot'),
    serverStatusText: document.getElementById('serverStatusText'),
    playitStatus: document.getElementById('playitStatus'),
    playitStatusDot: document.getElementById('playitStatusDot'),
    playitStatusText: document.getElementById('playitStatusText'),
    
    // Console
    serverConsole: document.getElementById('serverConsole'),
    playitConsole: document.getElementById('playitConsole'),
    tunnelInfo: document.getElementById('tunnelInfo'),
    tunnelDetails: document.getElementById('tunnelDetails'),
    playitDownload: document.getElementById('playitDownload'),
    downloadInstructions: document.getElementById('downloadInstructions'),
    
    // Modal
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    modalConfirm: document.getElementById('modalConfirm'),
    modalCancel: document.getElementById('modalCancel'),
    modalClose: document.querySelector('.modal-close'),
    
    // Loading
    loadingOverlay: document.getElementById('loadingOverlay')
};

// Variáveis para o atualizador
let selectedNewServerPath = '';
let validationData = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupTabs();
    startLogUpdates();
});

function initializeApp() {
    updateStatus('Painel iniciado - Selecione a pasta do servidor');
    updateServerStatus();
    updatePlayitStatus();
}

function setupEventListeners() {
    // Server selection
    elements.selectServerBtn.addEventListener('click', selectServerFolder);
    
    // Config management
    elements.saveConfigBtn.addEventListener('click', saveServerConfig);
    elements.loadConfigBtn.addEventListener('click', loadServerConfig);
    
    // World management
    elements.importWorldBtn.addEventListener('click', importWorld);
    elements.refreshWorldsBtn.addEventListener('click', loadWorlds);
    elements.backupWorldBtn.addEventListener('click', backupWorld);
    
    // World config management
    elements.openWorldConfigBtn.addEventListener('click', openWorldConfig);
    elements.refreshWorldConfigBtn.addEventListener('click', loadWorldConfigPreview);
    
    // Addon management
    elements.importAddonBtn.addEventListener('click', importAddon);
    elements.refreshAddonsBtn.addEventListener('click', loadAddons);
    
    // Player management
    elements.addOpBtn.addEventListener('click', addOperator);
    elements.newOpInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addOperator();
        }
    });
    
    // Server controls
    elements.startServerBtn.addEventListener('click', startMinecraftServer);
    elements.stopServerBtn.addEventListener('click', stopMinecraftServer);
    
    // Network controls
    elements.startPlayitBtn.addEventListener('click', startPlayit);
    elements.stopPlayitBtn.addEventListener('click', stopPlayit);
    elements.restartPlayitBtn.addEventListener('click', restartPlayit);
    elements.refreshPlayitBtn.addEventListener('click', updatePlayitStatus);
    elements.copyUrlBtn.addEventListener('click', copyTunnelUrl);
    elements.clearPlayitLogsBtn.addEventListener('click', clearPlayitLogs);
    
    // Updater controls
    elements.selectNewServerBtn.addEventListener('click', selectNewServer);
    elements.validateServerBtn.addEventListener('click', validateNewServer);
    elements.updateServerBtn.addEventListener('click', executeServerUpdate);
    elements.createBackupBtn.addEventListener('click', createManualBackup);
    elements.refreshBackupsBtn.addEventListener('click', loadServerBackups);
    
    // Console controls
    elements.sendCommandBtn.addEventListener('click', sendCommand);
    elements.clearConsoleBtn.addEventListener('click', clearConsole);
    elements.commandInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendCommand();
        }
    });
    
    // Modal events
    elements.modalClose.addEventListener('click', hideModal);
    elements.modalCancel.addEventListener('click', hideModal);
    elements.modal.addEventListener('click', function(e) {
        if (e.target === elements.modal) {
            hideModal();
        }
    });
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Load content based on tab
            loadTabContent(targetTab);
        });
    });
}

function loadTabContent(tab) {
    switch(tab) {
        case 'config':
            loadServerConfig();
            break;
        case 'worlds':
            loadWorlds();
            break;
        case 'world-config':
            loadWorldConfigPreview();
            break;
        case 'addons':
            loadAddons();
            break;
        case 'players':
            loadOperators();
            break;
        case 'network':
            updatePlayitStatus();
            break;
        case 'updater':
            loadServerInfo();
            loadServerBackups();
            break;
        case 'console':
            updateServerStatus();
            break;
    }
}

// World Config Functions
function openWorldConfig() {
    if (!currentServerPath) {
        showModal('Erro', 'Selecione a pasta do servidor primeiro');
        return;
    }
    
    // Abrir página de configuração do mundo em nova janela/aba
    window.open('world-config.html', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
}

async function loadWorldConfigPreview() {
    if (!currentServerPath) {
        elements.worldInfo.innerHTML = '<p>Selecione a pasta do servidor primeiro</p>';
        elements.appliedAddonsPreview.innerHTML = '<p>-</p>';
        return;
    }
    
    try {
        // Carregar informações do mundo
        const worldResult = await eel.get_world_settings()();
        
        if (worldResult.success) {
            elements.worldInfo.innerHTML = `
                <div class="world-info-item">
                    <strong>Nome do Mundo:</strong> ${worldResult.world_name}
                </div>
                <div class="world-info-item">
                    <strong>Dificuldade:</strong> ${getDifficultyName(worldResult.settings.Difficulty)}
                </div>
                <div class="world-info-item">
                    <strong>Modo Hardcore:</strong> ${worldResult.settings.IsHardcore ? 'Sim' : 'Não'}
                </div>
                <div class="world-info-item">
                    <strong>Manter Inventário:</strong> ${worldResult.settings.keepinventory ? 'Sim' : 'Não'}
                </div>
                <div class="world-info-item">
                    <strong>PvP:</strong> ${worldResult.settings.pvp ? 'Habilitado' : 'Desabilitado'}
                </div>
            `;
        } else {
            elements.worldInfo.innerHTML = '<p>Erro ao carregar informações do mundo</p>';
        }
        
        // Carregar addons aplicados
        const addonsResult = await eel.get_applied_world_addons()();
        
        if (addonsResult.success) {
            const addons = addonsResult.addons;
            const totalAddons = (addons.behavior_packs?.length || 0) + (addons.resource_packs?.length || 0);
            
            if (totalAddons === 0) {
                elements.appliedAddonsPreview.innerHTML = '<p>Nenhum addon aplicado</p>';
            } else {
                let addonsList = '';
                
                if (addons.behavior_packs?.length > 0) {
                    addonsList += `<h5><i class="fas fa-code"></i> Behavior Packs (${addons.behavior_packs.length})</h5>`;
                    addons.behavior_packs.forEach(addon => {
                        addonsList += `<div class="addon-preview-item">📦 ${addon.name}</div>`;
                    });
                }
                
                if (addons.resource_packs?.length > 0) {
                    addonsList += `<h5><i class="fas fa-image"></i> Resource Packs (${addons.resource_packs.length})</h5>`;
                    addons.resource_packs.forEach(addon => {
                        addonsList += `<div class="addon-preview-item">🎨 ${addon.name}</div>`;
                    });
                }
                
                elements.appliedAddonsPreview.innerHTML = addonsList;
            }
        } else {
            elements.appliedAddonsPreview.innerHTML = '<p>Erro ao carregar addons</p>';
        }
        
    } catch (error) {
        console.error('Erro ao carregar preview:', error);
        elements.worldInfo.innerHTML = '<p>Erro ao carregar informações</p>';
        elements.appliedAddonsPreview.innerHTML = '<p>Erro ao carregar addons</p>';
    }
}

function getDifficultyName(difficulty) {
    const difficulties = {
        0: 'Peaceful',
        1: 'Easy',
        2: 'Normal',
        3: 'Hard'
    };
    return difficulties[difficulty] || 'Desconhecido';
}

// Server Management
async function selectServerFolder() {
    showLoading();
    updateStatus('Abrindo diálogo de seleção...');
    
    try {
        const result = await eel.select_server_folder()();
        
        if (result.success) {
            currentServerPath = result.path;
            elements.serverPath.textContent = result.path;
            updateStatus('Pasta do servidor selecionada');
            
            // Load initial data
            await loadServerConfig();
            await updateServerStatus();
            await updatePlayitStatus();
            await loadWorldConfigPreview();
            await loadServerInfo();
            
            showModal('Sucesso', 'Pasta do servidor selecionada com sucesso!');
        } else {
            showModal('Erro', result.error || 'Erro ao selecionar pasta');
        }
    } catch (error) {
        console.error('Erro ao selecionar pasta:', error);
        showModal('Erro', 'Erro ao selecionar pasta do servidor');
    } finally {
        hideLoading();
    }
}

// Server Control Functions
async function startMinecraftServer() {
    if (!currentServerPath) {
        showModal('Erro', 'Selecione a pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const result = await eel.start_minecraft_server()();
        
        if (result.success) {
            updateStatus('Servidor iniciado com sucesso');
            showModal('Sucesso', result.message);
            await updateServerStatus();
        } else {
            showModal('Erro', result.error || 'Erro ao iniciar servidor');
        }
    } catch (error) {
        console.error('Erro ao iniciar servidor:', error);
        showModal('Erro', 'Erro ao iniciar servidor');
    } finally {
        hideLoading();
    }
}

async function stopMinecraftServer() {
    if (!currentServerPath) {
        showModal('Erro', 'Selecione a pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const result = await eel.stop_minecraft_server()();
        
        if (result.success) {
            updateStatus('Servidor parado com sucesso');
            showModal('Sucesso', result.message);
            await updateServerStatus();
        } else {
            showModal('Erro', result.error || 'Erro ao parar servidor');
        }
    } catch (error) {
        console.error('Erro ao parar servidor:', error);
        showModal('Erro', 'Erro ao parar servidor');
    } finally {
        hideLoading();
    }
}

async function updateServerStatus() {
    try {
        const result = await eel.get_server_status()();
        
        if (result.success) {
            const status = result.status;
            
            if (status.running) {
                elements.serverStatusDot.className = 'status-dot online';
                elements.serverStatusText.textContent = `Servidor Online (PID: ${status.process_id})`;
                elements.startServerBtn.disabled = true;
                elements.stopServerBtn.disabled = false;
            } else {
                elements.serverStatusDot.className = 'status-dot offline';
                elements.serverStatusText.textContent = 'Servidor Offline';
                elements.startServerBtn.disabled = false;
                elements.stopServerBtn.disabled = true;
            }
        }
    } catch (error) {
        console.error('Erro ao verificar status do servidor:', error);
    }
}

// Network Functions (Playit.gg) - Atualizadas
async function startPlayit() {
    if (!currentServerPath) {
        showModal('Erro', 'Selecione a pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const result = await eel.start_playit()();
        
        if (result.success) {
            updateStatus('Túnel Playit iniciado');
            showModal('Sucesso', result.message);
            await updatePlayitStatus();
        } else {
            showModal('Erro', result.error || 'Erro ao iniciar Playit');
        }
    } catch (error) {
        console.error('Erro ao iniciar Playit:', error);
        showModal('Erro', 'Erro ao iniciar Playit');
    } finally {
        hideLoading();
    }
}

async function stopPlayit() {
    showLoading();
    try {
        const result = await eel.stop_playit()();
        
        if (result.success) {
            updateStatus('Túnel Playit parado');
            showModal('Sucesso', result.message);
            await updatePlayitStatus();
        } else {
            showModal('Erro', result.error || 'Erro ao parar Playit');
        }
    } catch (error) {
        console.error('Erro ao parar Playit:', error);
        showModal('Erro', 'Erro ao parar Playit');
    } finally {
        hideLoading();
    }
}

async function restartPlayit() {
    showLoading();
    try {
        const result = await eel.restart_playit()();
        
        if (result.success) {
            updateStatus('Túnel Playit reiniciado');
            showModal('Sucesso', result.message);
            await updatePlayitStatus();
        } else {
            showModal('Erro', result.error || 'Erro ao reiniciar Playit');
        }
    } catch (error) {
        console.error('Erro ao reiniciar Playit:', error);
        showModal('Erro', 'Erro ao reiniciar Playit');
    } finally {
        hideLoading();
    }
}

async function updatePlayitStatus() {
    try {
        const result = await eel.check_playit_status()();
        
        if (result.success) {
            const status = result.status;
            
            if (!status.installed) {
                elements.playitDownload.style.display = 'block';
                elements.playitStatusDot.className = 'status-dot offline';
                elements.playitStatusText.textContent = 'Playit não instalado';
                elements.startPlayitBtn.disabled = true;
                elements.stopPlayitBtn.disabled = true;
                elements.restartPlayitBtn.disabled = true;
                
                // Mostrar instruções de download
                if (status.download_info) {
                    const instructions = status.download_info.instructions;
                    elements.downloadInstructions.innerHTML = `
                        <ol>
                            ${instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                        </ol>
                    `;
                }
                return;
            } else {
                elements.playitDownload.style.display = 'none';
                elements.startPlayitBtn.disabled = false;
                elements.restartPlayitBtn.disabled = false;
            }
            
            if (status.running) {
                elements.playitStatusDot.className = 'status-dot online';
                elements.playitStatusText.textContent = `Túnel Ativo (PID: ${status.process_id})`;
                elements.startPlayitBtn.disabled = true;
                elements.stopPlayitBtn.disabled = false;
                elements.restartPlayitBtn.disabled = false;
                
                // Mostrar informações do túnel se disponível
                if (status.tunnel_info && status.tunnel_info.url) {
                    elements.tunnelInfo.style.display = 'block';
                    elements.tunnelUrlInput.value = status.tunnel_info.url;
                    
                    // Mostrar detalhes do túnel
                    if (elements.tunnelDetails) {
                        elements.tunnelDetails.innerHTML = `
                            <div class="tunnel-detail-grid">
                                <div class="tunnel-detail">
                                    <strong>Status:</strong> ${status.tunnel_info.status || 'Conectado'}
                                </div>
                                <div class="tunnel-detail">
                                    <strong>Porta Local:</strong> ${status.tunnel_info.local_port || '19132'}
                                </div>
                            </div>
                        `;
                    }
                }
            } else {
                elements.playitStatusDot.className = 'status-dot offline';
                elements.playitStatusText.textContent = 'Túnel Inativo';
                elements.startPlayitBtn.disabled = false;
                elements.stopPlayitBtn.disabled = true;
                elements.restartPlayitBtn.disabled = true;
                elements.tunnelInfo.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Erro ao verificar status do Playit:', error);
    }
}

function copyTunnelUrl() {
    const url = elements.tunnelUrlInput.value;
    if (url) {
        navigator.clipboard.writeText(url).then(() => {
            showModal('Sucesso', 'URL copiada para a área de transferência!');
        }).catch(() => {
            showModal('Erro', 'Erro ao copiar URL');
        });
    }
}

function clearPlayitLogs() {
    elements.playitConsole.innerHTML = '';
}

// Updater Functions
async function loadServerInfo() {
    if (!currentServerPath) {
        elements.serverInfo.innerHTML = '<p>Selecione a pasta do servidor primeiro</p>';
        return;
    }
    
    try {
        const result = await eel.get_server_info()();
        
        if (result.success) {
            const info = result.info;
            
            elements.serverInfo.innerHTML = `
                <div class="server-info-grid">
                    <div class="info-item">
                        <strong>Caminho:</strong><br>${info.path}
                    </div>
                    <div class="info-item">
                        <strong>Executável:</strong><br>
                        ${info.has_bedrock_exe ? '✅ bedrock_server.exe' : ''}
                        ${info.has_bedrock_bin ? '✅ bedrock_server' : ''}
                        ${!info.has_bedrock_exe && !info.has_bedrock_bin ? '❌ Não encontrado' : ''}
                    </div>
                    <div class="info-item">
                        <strong>Playit:</strong><br>
                        ${info.has_playit ? '✅ Instalado' : '❌ Não instalado'}
                    </div>
                </div>
                
                <div class="preserved-status">
                    <h4><i class="fas fa-shield-alt"></i> Dados que serão preservados:</h4>
                    
                    <div class="preserved-files-list">
                        ${info.preserved_files.map(file => 
                            `<span class="preserved-file">${file}</span>`
                        ).join('')}
                    </div>
                    
                    <div class="preserved-folders-list">
                        ${info.preserved_folders.map(folder => 
                            `<span class="preserved-folder">${folder.name} (${folder.items} itens)</span>`
                        ).join('')}
                    </div>
                </div>
            `;
        } else {
            elements.serverInfo.innerHTML = `<p class="error">Erro: ${result.error}</p>`;
        }
    } catch (error) {
        console.error('Erro ao carregar info do servidor:', error);
        elements.serverInfo.innerHTML = '<p class="error">Erro ao carregar informações</p>';
    }
}

async function selectNewServer() {
    try {
        updateStatus('Abrindo diálogo de seleção...');
        const fileResult = await eel.select_file('server')();
        
        if (!fileResult.success || !fileResult.path) {
            updateStatus('Seleção cancelada');
            return;
        }
        
        selectedNewServerPath = fileResult.path;
        elements.validateServerBtn.disabled = false;
        elements.updateServerBtn.disabled = true;
        
        elements.validationResult.style.display = 'block';
        elements.validationResult.className = 'validation-result';
        elements.validationResult.innerHTML = `
            <p><strong>Arquivo selecionado:</strong> ${fileResult.path}</p>
            <p>Clique em "Validar Versão" para verificar se é um servidor Bedrock válido.</p>
        `;
        
        updateStatus('Nova versão selecionada - Clique em Validar');
    } catch (error) {
        console.error('Erro ao selecionar nova versão:', error);
        showModal('Erro', 'Erro ao selecionar arquivo');
    }
}

async function validateNewServer() {
    if (!selectedNewServerPath) {
        showModal('Erro', 'Selecione uma nova versão primeiro');
        return;
    }
    
    showLoading();
    try {
        const result = await eel.validate_new_server(selectedNewServerPath)();
        
        if (result.success) {
            validationData = result;
            elements.updateServerBtn.disabled = false;
            
            elements.validationResult.className = 'validation-result validation-success';
            elements.validationResult.innerHTML = `
                <h4><i class="fas fa-check-circle"></i> Validação Bem-sucedida</h4>
                <p><strong>Tipo:</strong> ${result.type === 'zip' ? 'Arquivo ZIP' : 'Pasta'}</p>
                <p><strong>Caminho:</strong> ${result.path}</p>
                <p class="success">✅ Servidor Bedrock válido encontrado!</p>
                <p>Clique em "Executar Atualização" para prosseguir.</p>
            `;
            
            updateStatus('Validação concluída - Pronto para atualizar');
        } else {
            elements.updateServerBtn.disabled = true;
            
            elements.validationResult.className = 'validation-result validation-error';
            elements.validationResult.innerHTML = `
                <h4><i class="fas fa-exclamation-triangle"></i> Validação Falhou</h4>
                <p class="error">❌ ${result.error}</p>
                <p>Selecione um arquivo ZIP ou pasta contendo um servidor Bedrock válido.</p>
            `;
            
            updateStatus('Validação falhou');
        }
    } catch (error) {
        console.error('Erro na validação:', error);
        showModal('Erro', 'Erro ao validar servidor');
    } finally {
        hideLoading();
    }
}

async function executeServerUpdate() {
    if (!validationData || !selectedNewServerPath) {
        showModal('Erro', 'Valide a nova versão primeiro');
        return;
    }
    
    const confirmed = await showConfirmModal(
        'Confirmar Atualização',
        'Deseja executar a atualização do servidor?\n\n' +
        '⚠️ IMPORTANTE:\n' +
        '• Um backup será criado automaticamente\n' +
        '• Todos os dados importantes serão preservados\n' +
        '• O processo pode demorar alguns minutos\n' +
        '• Pare o servidor antes de continuar\n\n' +
        'Continuar com a atualização?'
    );
    
    if (!confirmed) return;
    
    showLoading();
    try {
        updateStatus('Executando atualização do servidor...');
        
        const result = await eel.update_server(selectedNewServerPath)();
        
        if (result.success) {
            updateStatus('Servidor atualizado com sucesso');
            showModal('Sucesso', 
                `${result.message}\n\n` +
                `Backup criado: ${result.backup_file}\n\n` +
                'Reinicie o painel para aplicar as mudanças.'
            );
            
            // Resetar formulário
            selectedNewServerPath = '';
            validationData = null;
            elements.validateServerBtn.disabled = true;
            elements.updateServerBtn.disabled = true;
            elements.validationResult.style.display = 'none';
            
            // Recarregar informações
            await loadServerInfo();
            await loadServerBackups();
        } else {
            showModal('Erro', result.error || 'Erro durante a atualização');
        }
    } catch (error) {
        console.error('Erro na atualização:', error);
        showModal('Erro', 'Erro ao executar atualização');
    } finally {
        hideLoading();
    }
}

async function createManualBackup() {
    if (!currentServerPath) {
        showModal('Erro', 'Selecione a pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const result = await eel.create_server_backup()();
        
        if (result.success) {
            updateStatus('Backup criado com sucesso');
            showModal('Sucesso', `Backup criado: ${result.backup_name}`);
            await loadServerBackups();
        } else {
            showModal('Erro', result.error || 'Erro ao criar backup');
        }
    } catch (error) {
        console.error('Erro ao criar backup:', error);
        showModal('Erro', 'Erro ao criar backup');
    } finally {
        hideLoading();
    }
}

async function loadServerBackups() {
    if (!currentServerPath) {
        elements.backupsList.innerHTML = '<p>Selecione a pasta do servidor primeiro</p>';
        return;
    }
    
    try {
        const result = await eel.list_server_backups()();
        
        if (result.success) {
            const backups = result.backups;
            
            if (backups.length === 0) {
                elements.backupsList.innerHTML = '<p>Nenhum backup encontrado</p>';
                return;
            }
            
            elements.backupsList.innerHTML = `
                <div class="backups-grid">
                    ${backups.map(backup => `
                        <div class="backup-item">
                            <div class="backup-info">
                                <h4><i class="fas fa-archive"></i> ${backup.name}</h4>
                                <p><strong>Data:</strong> ${backup.date}</p>
                                <p><strong>Tamanho:</strong> ${backup.size}</p>
                                <p><strong>Caminho:</strong> ${backup.path}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            elements.backupsList.innerHTML = `<p class="error">Erro: ${result.error}</p>`;
        }
    } catch (error) {
        console.error('Erro ao carregar backups:', error);
        elements.backupsList.innerHTML = '<p class="error">Erro ao carregar lista de backups</p>';
    }
}

// Console Functions
async function sendCommand() {
    const command = elements.commandInput.value.trim();
    
    if (!command) {
        return;
    }
    
    try {
        const result = await eel.send_server_command(command)();
        
        if (result.success) {
            // Add command to console
            addToConsole('serverConsole', `> ${command}`, 'command');
            elements.commandInput.value = '';
        } else {
            showModal('Erro', result.error || 'Erro ao enviar comando');
        }
    } catch (error) {
        console.error('Erro ao enviar comando:', error);
        showModal('Erro', 'Erro ao enviar comando');
    }
}

function clearConsole() {
    elements.serverConsole.innerHTML = '';
}

function addToConsole(consoleId, message, type = 'log') {
    const console = document.getElementById(consoleId);
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    line.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
    
    console.appendChild(line);
    console.scrollTop = console.scrollHeight;
    
    // Limitar número de linhas (máximo 1000)
    while (console.children.length > 1000) {
        console.removeChild(console.firstChild);
    }
}

// Log Updates
function startLogUpdates() {
    logUpdateInterval = setInterval(async () => {
        try {
            // Update server logs
            const serverLogs = await eel.get_server_logs()();
            serverLogs.forEach(log => {
                addToConsole('serverConsole', log, 'server');
            });
            
            // Update playit logs
            const playitLogs = await eel.get_playit_logs()();
            playitLogs.forEach(log => {
                addToConsole('playitConsole', log, 'playit');
            });
            
        } catch (error) {
            // Silently handle errors to avoid spam
        }
    }, 1000);
}

// Configuration Management (keeping existing functions)
async function loadServerConfig() {
    if (!currentServerPath) {
        updateStatus('Selecione a pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const result = await eel.get_server_config()();
        
        if (result.success) {
            currentConfig = result.config;
            renderConfigForm(result.config);
            updateStatus('Configurações carregadas');
        } else {
            showModal('Erro', result.error || 'Erro ao carregar configurações');
        }
    } catch (error) {
        console.error('Erro ao carregar config:', error);
        showModal('Erro', 'Erro ao carregar configurações');
    } finally {
        hideLoading();
    }
}

function renderConfigForm(config) {
    const configDescriptions = {
        'server-name': 'Nome do servidor',
        'gamemode': 'Modo de jogo',
        'force-gamemode': 'Forçar modo de jogo',
        'difficulty': 'Dificuldade',
        'allow-cheats': 'Permitir cheats',
        'max-players': 'Máximo de jogadores',
        'online-mode': 'Modo online',
        'allow-list': 'Lista de permitidos',
        'server-port': 'Porta do servidor',
        'server-portv6': 'Porta IPv6',
        'view-distance': 'Distância de visão',
        'tick-distance': 'Distância de tick',
        'player-idle-timeout': 'Timeout de inatividade',
        'max-threads': 'Máximo de threads',
        'level-name': 'Nome do mundo',
        'level-seed': 'Seed do mundo',
        'default-player-permission-level': 'Nível de permissão padrão',
        'texturepack-required': 'Texture pack obrigatório',
        'content-log-file-enabled': 'Log de conteúdo habilitado',
        'compression-threshold': 'Limite de compressão',
        'compression-algorithm': 'Algoritmo de compressão'
    };
    
    const selectOptions = {
        'gamemode': ['survival', 'creative', 'adventure'],
        'difficulty': ['peaceful', 'easy', 'normal', 'hard'],
        'default-player-permission-level': ['visitor', 'member', 'operator'],
        'compression-algorithm': ['zlib', 'snappy']
    };
    
    const booleanFields = [
        'force-gamemode', 'allow-cheats', 'online-mode', 'allow-list',
        'texturepack-required', 'content-log-file-enabled'
    ];
    
    elements.configGrid.innerHTML = '';
    
    Object.entries(config).forEach(([key, value]) => {
        const item = document.createElement('div');
        item.className = 'config-item';
        
        const label = document.createElement('label');
        label.textContent = configDescriptions[key] || key;
        label.setAttribute('for', key);
        
        let input;
        
        if (selectOptions[key]) {
            input = document.createElement('select');
            input.className = 'input';
            selectOptions[key].forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                optionElement.selected = value === option;
                input.appendChild(optionElement);
            });
        } else if (booleanFields.includes(key)) {
            input = document.createElement('select');
            input.className = 'input';
            ['true', 'false'].forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option === 'true' ? 'Sim' : 'Não';
                optionElement.selected = value === option;
                input.appendChild(optionElement);
            });
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'input';
            input.value = value;
        }
        
        input.id = key;
        input.name = key;
        
        item.appendChild(label);
        item.appendChild(input);
        elements.configGrid.appendChild(item);
    });
}

async function saveServerConfig() {
    if (!currentServerPath) {
        showModal('Erro', 'Selecione a pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const config = {};
        
        // Collect all config values
        const inputs = elements.configGrid.querySelectorAll('input, select');
        inputs.forEach(input => {
            config[input.name] = input.value;
        });
        
        const result = await eel.save_server_config(config)();
        
        if (result.success) {
            currentConfig = config;
            updateStatus('Configurações salvas com sucesso');
            showModal('Sucesso', result.message);
        } else {
            showModal('Erro', result.error || 'Erro ao salvar configurações');
        }
    } catch (error) {
        console.error('Erro ao salvar config:', error);
        showModal('Erro', 'Erro ao salvar configurações');
    } finally {
        hideLoading();
    }
}

// World Management
async function loadWorlds() {
    if (!currentServerPath) {
        updateStatus('Selecione a pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const result = await eel.get_current_world()();
        
        if (result.success) {
            renderWorldsList(result.worlds, result.active_world);
            updateStatus(`${result.worlds.length} mundo(s) encontrado(s)`);
        } else {
            showModal('Erro', result.error || 'Erro ao carregar mundos');
        }
    } catch (error) {
        console.error('Erro ao carregar mundos:', error);
        showModal('Erro', 'Erro ao carregar mundos');
    } finally {
        hideLoading();
    }
}

function renderWorldsList(worlds, activeWorld) {
    elements.worldsList.innerHTML = '';
    
    if (worlds.length === 0) {
        elements.worldsList.innerHTML = '<p class="text-center">Nenhum mundo encontrado</p>';
        return;
    }
    
    worlds.forEach(world => {
        const item = document.createElement('div');
        item.className = `world-item ${world.is_active ? 'active-world' : ''}`;
        
        const statusIcon = world.is_active ? '🟢' : '⚪';
        const statusText = world.is_active ? 'ATIVO' : 'Inativo';
        
        item.innerHTML = `
            <div class="world-header">
                <h4><i class="fas fa-globe"></i> ${world.display_name}</h4>
                <div class="world-status ${world.is_active ? 'active' : 'inactive'}">
                    ${statusIcon} ${statusText}
                </div>
            </div>
            <div class="world-details">
                <div class="world-info-grid">
                    <div class="world-info-item">
                        <strong>Pasta:</strong> ${world.name}
                    </div>
                    <div class="world-info-item">
                        <strong>Tamanho:</strong> ${world.size || 'Calculando...'}
                    </div>
                    <div class="world-info-item">
                        <strong>Modificado:</strong> ${world.last_modified || 'Desconhecido'}
                    </div>
                    <div class="world-info-item">
                        <strong>Addons:</strong> ${world.addon_count || 0} aplicados
                    </div>
                    <div class="world-info-item">
                        <strong>Level.dat:</strong> ${world.has_level_dat ? '✅ Presente' : '❌ Ausente'}
                    </div>
                    <div class="world-info-item">
                        <strong>Levelname.txt:</strong> ${world.has_levelname ? '✅ Presente' : '❌ Ausente'}
                    </div>
                </div>
                <div class="world-actions">
                    ${!world.is_active ? `
                        <button class="btn btn-success btn-sm" onclick="activateWorld('${world.name}')">
                            <i class="fas fa-play"></i> Ativar
                        </button>
                    ` : `
                        <button class="btn btn-success btn-sm" disabled>
                            <i class="fas fa-check"></i> Ativo
                        </button>
                    `}
                    <button class="btn btn-secondary btn-sm" onclick="openWorldConfig()">
                        <i class="fas fa-cog"></i> Configurar
                    </button>
                    ${!world.is_active ? `
                        <button class="btn btn-danger btn-sm" onclick="deleteWorld('${world.name}')">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        elements.worldsList.appendChild(item);
    });
}

async function activateWorld(worldName) {
    const confirmed = await showConfirmModal(
        'Ativar Mundo',
        `Deseja ativar o mundo "${worldName}"?\n\nO mundo atual será desativado e este se tornará o mundo ativo do servidor.`
    );
    
    if (confirmed) {
        showLoading();
        try {
            const result = await eel.activate_world(worldName)();
            
            if (result.success) {
                updateStatus(`Mundo "${worldName}" ativado`);
                showModal('Sucesso', result.message);
                await loadWorlds();
                await loadWorldConfigPreview();
            } else {
                showModal('Erro', result.error || 'Erro ao ativar mundo');
            }
        } catch (error) {
            console.error('Erro ao ativar mundo:', error);
            showModal('Erro', 'Erro ao ativar mundo');
        } finally {
            hideLoading();
        }
    }
}

async function deleteWorld(worldName) {
    const confirmed = await showConfirmModal(
        'Excluir Mundo',
        `Tem certeza que deseja excluir o mundo "${worldName}"?\n\nO mundo será movido para a pasta de backup, mas esta ação deve ser feita com cuidado.`
    );
    
    if (confirmed) {
        showLoading();
        try {
            const result = await eel.delete_world(worldName)();
            
            if (result.success) {
                updateStatus(`Mundo "${worldName}" excluído`);
                showModal('Sucesso', result.message);
                await loadWorlds();
            } else {
                showModal('Erro', result.error || 'Erro ao excluir mundo');
            }
        } catch (error) {
            console.error('Erro ao excluir mundo:', error);
            showModal('Erro', 'Erro ao excluir mundo');
        } finally {
            hideLoading();
        }
    }
}

async function backupWorld() {
    if (!currentServerPath) {
        showModal('Erro', 'Selecione a pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const result = await eel.backup_world()();
        
        if (result.success) {
            updateStatus('Backup criado com sucesso');
            showModal('Sucesso', result.message);
        } else {
            showModal('Erro', result.error || 'Erro ao criar backup');
        }
    } catch (error) {
        console.error('Erro ao criar backup:', error);
        showModal('Erro', 'Erro ao criar backup do mundo');
    } finally {
        hideLoading();
    }
}

async function importWorld() {
    if (!currentServerPath) {
        showModal('Erro', 'Selecione a pasta do servidor primeiro');
        return;
    }
    
    try {
        updateStatus('Abrindo diálogo de seleção de arquivo...');
        const fileResult = await eel.select_file('world')();
        
        if (!fileResult.success || !fileResult.path) {
            updateStatus('Importação cancelada');
            return;
        }
        
        showLoading();
        updateStatus('Importando mundo...');
        
        const result = await eel.import_world(fileResult.path)();
        
        if (result.success) {
            updateStatus('Mundo importado com sucesso');
            showModal('Sucesso', result.message);
            await loadWorlds();
            await loadWorldConfigPreview();
        } else {
            showModal('Erro', result.error || 'Erro ao importar mundo');
        }
    } catch (error) {
        console.error('Erro ao importar mundo:', error);
        showModal('Erro', 'Erro ao importar mundo');
    } finally {
        hideLoading();
    }
}

// Addon Management (keeping existing functions)
async function loadAddons() {
    if (!currentServerPath) {
        updateStatus('Selecione a pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const result = await eel.get_installed_addons()();
        
        if (result.success) {
            renderAddonsList(result.addons);
            const total = result.addons.behavior_packs.length + result.addons.resource_packs.length;
            updateStatus(`${total} addon(s) instalado(s)`);
        } else {
            showModal('Erro', result.error || 'Erro ao carregar addons');
        }
    } catch (error) {
        console.error('Erro ao carregar addons:', error);
        showModal('Erro', 'Erro ao carregar addons');
    } finally {
        hideLoading();
    }
}

function renderAddonsList(addons) {
    // Render behavior packs
    elements.behaviorPacksList.innerHTML = '';
    if (addons.behavior_packs.length === 0) {
        elements.behaviorPacksList.innerHTML = '<p class="text-center">Nenhum behavior pack instalado</p>';
    } else {
        addons.behavior_packs.forEach(addon => {
            const item = createAddonItem(addon, 'behavior');
            elements.behaviorPacksList.appendChild(item);
        });
    }
    
    // Render resource packs
    elements.resourcePacksList.innerHTML = '';
    if (addons.resource_packs.length === 0) {
        elements.resourcePacksList.innerHTML = '<p class="text-center">Nenhum resource pack instalado</p>';
    } else {
        addons.resource_packs.forEach(addon => {
            const item = createAddonItem(addon, 'resource');
            elements.resourcePacksList.appendChild(item);
        });
    }
}

function createAddonItem(addon, type) {
    const item = document.createElement('div');
    item.className = 'addon-item';
    
    const icon = type === 'behavior' ? 'fas fa-code' : 'fas fa-image';
    
    item.innerHTML = `
        <h4><i class="${icon}"></i> ${addon.name || addon.folder}</h4>
        <p><strong>Descrição:</strong> ${addon.description || 'Sem descrição'}</p>
        <p><strong>UUID:</strong> ${addon.uuid || 'N/A'}</p>
        <p><strong>Versão:</strong> ${Array.isArray(addon.version) ? addon.version.join('.') : addon.version || 'N/A'}</p>
        <p><strong>Pasta:</strong> ${addon.folder}</p>
    `;
    
    return item;
}

async function importAddon() {
    if (!currentServerPath) {
        showModal('Erro', 'Selecione a pasta do servidor primeiro');
        return;
    }
    
    try {
        updateStatus('Abrindo diálogo de seleção de arquivo...');
        const fileResult = await eel.select_file('addon')();
        
        if (!fileResult.success || !fileResult.path) {
            updateStatus('Importação cancelada');
            return;
        }
        
        showLoading();
        updateStatus('Importando addon...');
        
        const result = await eel.import_addon(fileResult.path)();
        
        if (result.success) {
            updateStatus('Addon importado com sucesso');
            showModal('Sucesso', result.message);
            await loadAddons();
            await loadWorldConfigPreview(); // Atualizar preview dos addons aplicados
        } else {
            showModal('Erro', result.error || 'Erro ao importar addon');
        }
    } catch (error) {
        console.error('Erro ao importar addon:', error);
        showModal('Erro', 'Erro ao importar addon');
    } finally {
        hideLoading();
    }
}

// Player Management (keeping existing functions)
async function loadOperators() {
    if (!currentServerPath) {
        updateStatus('Selecione a pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const result = await eel.get_operators()();
        
        if (result.success) {
            renderOperatorsList(result.operators);
            updateStatus(`${result.operators.length} operador(es) configurado(s)`);
        } else {
            showModal('Erro', result.error || 'Erro ao carregar operadores');
        }
    } catch (error) {
        console.error('Erro ao carregar operadores:', error);
        showModal('Erro', 'Erro ao carregar operadores');
    } finally {
        hideLoading();
    }
}

function renderOperatorsList(operators) {
    elements.operatorsList.innerHTML = '';
    
    if (operators.length === 0) {
        elements.operatorsList.innerHTML = '<p class="text-center">Nenhum operador configurado</p>';
        return;
    }
    
    operators.forEach(operator => {
        const item = document.createElement('div');
        item.className = 'player-item';
        
        item.innerHTML = `
            <h4><i class="fas fa-crown"></i> ${operator.name}</h4>
            <p><strong>XUID:</strong> ${operator.xuid || 'Será preenchido automaticamente'}</p>
            <p><strong>Nível:</strong> ${operator.level}</p>
            <button class="btn btn-danger btn-sm" onclick="removeOperator('${operator.name}')">
                <i class="fas fa-trash"></i> Remover
            </button>
        `;
        
        elements.operatorsList.appendChild(item);
    });
}

async function addOperator() {
    const nickname = elements.newOpInput.value.trim();
    
    if (!nickname) {
        showModal('Erro', 'Digite o nome do jogador');
        return;
    }
    
    if (!currentServerPath) {
        showModal('Erro', 'Selecione a pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const result = await eel.add_operator(nickname)();
        
        if (result.success) {
            elements.newOpInput.value = '';
            updateStatus('Operador adicionado com sucesso');
            showModal('Sucesso', result.message);
            await loadOperators();
        } else {
            showModal('Erro', result.error || 'Erro ao adicionar operador');
        }
    } catch (error) {
        console.error('Erro ao adicionar operador:', error);
        showModal('Erro', 'Erro ao adicionar operador');
    } finally {
        hideLoading();
    }
}

async function removeOperator(nickname) {
    const confirmed = await showConfirmModal(
        'Remover Operador',
        `Tem certeza que deseja remover o operador "${nickname}"?`
    );
    
    if (confirmed) {
        showLoading();
        try {
            const result = await eel.remove_operator(nickname)();
            
            if (result.success) {
                updateStatus('Operador removido com sucesso');
                showModal('Sucesso', result.message);
                await loadOperators();
            } else {
                showModal('Erro', result.error || 'Erro ao remover operador');
            }
        } catch (error) {
            console.error('Erro ao remover operador:', error);
            showModal('Erro', 'Erro ao remover operador');
        } finally {
            hideLoading();
        }
    }
}

// Utility Functions
function updateStatus(message) {
    elements.statusMessage.textContent = message;
    console.log('Status:', message);
}

function showLoading() {
    elements.loadingOverlay.classList.add('show');
}

function hideLoading() {
    elements.loadingOverlay.classList.remove('show');
}

function showModal(title, message) {
    elements.modalTitle.textContent = title;
    elements.modalBody.innerHTML = `<p>${message}</p>`;
    elements.modalConfirm.style.display = 'none';
    elements.modal.classList.add('show');
}

function showConfirmModal(title, message) {
    return new Promise((resolve) => {
        elements.modalTitle.textContent = title;
        elements.modalBody.innerHTML = `<p style="white-space: pre-line;">${message}</p>`;
        elements.modalConfirm.style.display = 'block';
        elements.modal.classList.add('show');
        
        elements.modalConfirm.onclick = () => {
            hideModal();
            resolve(true);
        };
        
        elements.modalCancel.onclick = () => {
            hideModal();
            resolve(false);
        };
    });
}

function hideModal() {
    elements.modal.classList.remove('show');
}

// Global functions for onclick handlers
window.removeOperator = removeOperator;
window.activateWorld = activateWorld;
window.deleteWorld = deleteWorld;