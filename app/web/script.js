// Estado global da aplicação
let currentServerPath = null;
let serverStatus = { isRunning: false };
let currentTab = 'config';

// Elementos DOM principais
const elements = {
    // Botões principais
    selectServerBtn: document.getElementById('selectServerBtn'),
    startServerBtn: document.getElementById('startServerBtn'),
    stopServerBtn: document.getElementById('stopServerBtn'),
    
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Status
    serverPath: document.getElementById('serverPath'),
    statusMessage: document.getElementById('statusMessage'),
    serverStatusDot: document.getElementById('serverStatusDot'),
    serverStatusText: document.getElementById('serverStatusText'),
    
    // Loading
    loadingOverlay: document.getElementById('loadingOverlay'),
    
    // Modal
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    modalConfirm: document.getElementById('modalConfirm'),
    modalCancel: document.getElementById('modalCancel'),
    modalClose: document.querySelector('.modal-close')
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateServerStatus();
    loadInitialData();
    
    // Atualizar status a cada 5 segundos
    setInterval(updateServerStatus, 5000);
});

function setupEventListeners() {
    // Botões principais
    elements.selectServerBtn.addEventListener('click', selectServerFolder);
    elements.startServerBtn.addEventListener('click', startServer);
    elements.stopServerBtn.addEventListener('click', stopServer);
    
    // Tabs
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Modal
    elements.modalClose.addEventListener('click', hideModal);
    elements.modalCancel.addEventListener('click', hideModal);
    elements.modal.addEventListener('click', function(e) {
        if (e.target === elements.modal) {
            hideModal();
        }
    });
    
    // Configurações
    setupConfigTab();
    
    // Mundos
    setupWorldsTab();
    
    // Configurações do Mundo
    setupWorldConfigTab();
    
    // Addons
    setupAddonsTab();
    
    // Jogadores
    setupPlayersTab();
    
    // Rede
    setupNetworkTab();
    
    // Atualizar
    setupUpdaterTab();
    
    // Console
    setupConsoleTab();
}

// === TAB SWITCHING ===
function switchTab(tabName) {
    // Atualizar botões
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Atualizar conteúdo
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
    
    currentTab = tabName;
    
    // Carregar dados específicos da tab
    loadTabData(tabName);
}

function loadTabData(tabName) {
    switch(tabName) {
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
            loadNetworkStatus();
            break;
        case 'updater':
            loadUpdaterInfo();
            break;
        case 'console':
            loadConsoleLogs();
            break;
    }
}

// === SERVER MANAGEMENT ===
async function selectServerFolder() {
    showLoading();
    try {
        const result = await window.electronAPI.selectServerFolder();
        
        if (result.success) {
            currentServerPath = result.path;
            elements.serverPath.textContent = result.path;
            elements.statusMessage.textContent = 'Pasta do servidor selecionada';
            
            // Recarregar dados
            loadInitialData();
        } else if (result.error) {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao selecionar pasta:', error);
        showModal('Erro', 'Erro ao selecionar pasta do servidor');
    } finally {
        hideLoading();
    }
}

async function startServer() {
    if (!currentServerPath) {
        showModal('Erro', 'Selecione uma pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const result = await window.electronAPI.startServer();
        
        if (result.success) {
            elements.statusMessage.textContent = 'Servidor iniciado';
            updateServerStatus();
        } else {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao iniciar servidor:', error);
        showModal('Erro', 'Erro ao iniciar servidor');
    } finally {
        hideLoading();
    }
}

async function stopServer() {
    showLoading();
    try {
        const result = await window.electronAPI.stopServer();
        
        if (result.success) {
            elements.statusMessage.textContent = 'Servidor parado';
            updateServerStatus();
        } else {
            showModal('Erro', result.error);
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
        const result = await window.electronAPI.getServerStatus();
        
        if (result.success) {
            serverStatus = result.status;
            
            // Atualizar UI
            if (serverStatus.isRunning) {
                elements.serverStatusDot.className = 'status-dot online';
                elements.serverStatusText.textContent = 'Servidor Online';
                elements.startServerBtn.disabled = true;
                elements.stopServerBtn.disabled = false;
            } else {
                elements.serverStatusDot.className = 'status-dot offline';
                elements.serverStatusText.textContent = 'Servidor Offline';
                elements.startServerBtn.disabled = false;
                elements.stopServerBtn.disabled = true;
            }
            
            if (serverStatus.serverPath) {
                currentServerPath = serverStatus.serverPath;
                elements.serverPath.textContent = serverStatus.serverPath;
            }
        }
    } catch (error) {
        console.error('Erro ao verificar status:', error);
    }
}

// === CONFIGURAÇÕES TAB ===
function setupConfigTab() {
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    const loadConfigBtn = document.getElementById('loadConfigBtn');
    
    if (saveConfigBtn) saveConfigBtn.addEventListener('click', saveServerConfig);
    if (loadConfigBtn) loadConfigBtn.addEventListener('click', loadServerConfig);
}

async function loadServerConfig() {
    if (!currentServerPath) return;
    
    showLoading();
    try {
        const result = await window.electronAPI.getServerConfig();
        
        if (result.success) {
            renderConfigForm(result.config);
        } else {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        showModal('Erro', 'Erro ao carregar configurações');
    } finally {
        hideLoading();
    }
}

function renderConfigForm(config) {
    const configGrid = document.getElementById('configGrid');
    if (!configGrid) return;
    
    configGrid.innerHTML = '';
    
    const configFields = [
        { key: 'server-name', label: 'Nome do Servidor', type: 'text' },
        { key: 'gamemode', label: 'Modo de Jogo', type: 'select', options: ['survival', 'creative', 'adventure'] },
        { key: 'difficulty', label: 'Dificuldade', type: 'select', options: ['peaceful', 'easy', 'normal', 'hard'] },
        { key: 'max-players', label: 'Máximo de Jogadores', type: 'number', min: 1, max: 100 },
        { key: 'server-port', label: 'Porta do Servidor', type: 'number', min: 1, max: 65535 },
        { key: 'view-distance', label: 'Distância de Visão', type: 'number', min: 4, max: 64 },
        { key: 'allow-cheats', label: 'Permitir Cheats', type: 'boolean' },
        { key: 'online-mode', label: 'Modo Online', type: 'boolean' },
        { key: 'allow-list', label: 'Lista de Permitidos', type: 'boolean' },
        { key: 'level-name', label: 'Nome do Mundo', type: 'text' },
        { key: 'level-seed', label: 'Semente do Mundo', type: 'text' }
    ];
    
    configFields.forEach(field => {
        const configItem = document.createElement('div');
        configItem.className = 'config-item';
        
        const label = document.createElement('label');
        label.textContent = field.label;
        label.setAttribute('for', field.key);
        
        let input;
        
        if (field.type === 'select') {
            input = document.createElement('select');
            field.options.forEach(option => {
                const optionEl = document.createElement('option');
                optionEl.value = option;
                optionEl.textContent = option.charAt(0).toUpperCase() + option.slice(1);
                input.appendChild(optionEl);
            });
        } else if (field.type === 'boolean') {
            input = document.createElement('select');
            ['false', 'true'].forEach(option => {
                const optionEl = document.createElement('option');
                optionEl.value = option;
                optionEl.textContent = option === 'true' ? 'Sim' : 'Não';
                input.appendChild(optionEl);
            });
        } else {
            input = document.createElement('input');
            input.type = field.type;
            if (field.min !== undefined) input.min = field.min;
            if (field.max !== undefined) input.max = field.max;
        }
        
        input.id = field.key;
        input.className = 'input';
        input.value = config[field.key] || '';
        
        configItem.appendChild(label);
        configItem.appendChild(input);
        configGrid.appendChild(configItem);
    });
}

async function saveServerConfig() {
    if (!currentServerPath) {
        showModal('Erro', 'Selecione uma pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const config = {};
        const inputs = document.querySelectorAll('#configGrid input, #configGrid select');
        
        inputs.forEach(input => {
            let value = input.value;
            
            // Converter tipos
            if (value === 'true' || value === 'false') {
                config[input.id] = value === 'true';
            } else if (input.type === 'number') {
                config[input.id] = parseInt(value) || 0;
            } else {
                config[input.id] = value;
            }
        });
        
        const result = await window.electronAPI.saveServerConfig(config);
        
        if (result.success) {
            showModal('Sucesso', result.message);
        } else {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        showModal('Erro', 'Erro ao salvar configurações');
    } finally {
        hideLoading();
    }
}

// === MUNDOS TAB ===
function setupWorldsTab() {
    const importWorldBtn = document.getElementById('importWorldBtn');
    const backupWorldBtn = document.getElementById('backupWorldBtn');
    const refreshWorldsBtn = document.getElementById('refreshWorldsBtn');
    
    if (importWorldBtn) importWorldBtn.addEventListener('click', importWorld);
    if (backupWorldBtn) backupWorldBtn.addEventListener('click', backupActiveWorld);
    if (refreshWorldsBtn) refreshWorldsBtn.addEventListener('click', loadWorlds);
}

async function loadWorlds() {
    if (!currentServerPath) return;
    
    showLoading();
    try {
        const result = await window.electronAPI.getWorlds();
        
        if (result.success) {
            renderWorldsList(result.worlds);
        } else {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao carregar mundos:', error);
        showModal('Erro', 'Erro ao carregar mundos');
    } finally {
        hideLoading();
    }
}

function renderWorldsList(worlds) {
    const worldsList = document.getElementById('worldsList');
    if (!worldsList) return;
    
    worldsList.innerHTML = '';
    
    if (worlds.length === 0) {
        worldsList.innerHTML = '<p class="text-center">Nenhum mundo encontrado</p>';
        return;
    }
    
    worlds.forEach(world => {
        const worldItem = document.createElement('div');
        worldItem.className = `world-item ${world.isActive ? 'active-world' : ''}`;
        
        worldItem.innerHTML = `
            <div class="world-header">
                <h4><i class="fas fa-globe"></i> ${world.displayName || world.name}</h4>
                <span class="world-status ${world.isActive ? 'active' : 'inactive'}">
                    ${world.isActive ? 'Ativo' : 'Inativo'}
                </span>
            </div>
            <div class="world-details">
                <div class="world-info-grid">
                    <div class="world-info-item">
                        <strong>Pasta:</strong> ${world.folder}
                    </div>
                    <div class="world-info-item">
                        <strong>Tamanho:</strong> ${formatBytes(world.size)}
                    </div>
                    <div class="world-info-item">
                        <strong>Modificado:</strong> ${new Date(world.lastModified).toLocaleString()}
                    </div>
                    <div class="world-info-item">
                        <strong>Level.dat:</strong> ${world.hasLevelDat ? 'Sim' : 'Não'}
                    </div>
                </div>
                <div class="world-actions">
                    ${!world.isActive ? `<button class="btn btn-success btn-sm" onclick="setActiveWorld('${world.folder}')">
                        <i class="fas fa-play"></i> Ativar
                    </button>` : ''}
                    <button class="btn btn-secondary btn-sm" onclick="backupWorld('${world.folder}')">
                        <i class="fas fa-save"></i> Backup
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteWorld('${world.folder}')">
                        <i class="fas fa-trash"></i> Deletar
                    </button>
                </div>
            </div>
        `;
        
        worldsList.appendChild(worldItem);
    });
}

async function importWorld() {
    if (!currentServerPath) {
        showModal('Erro', 'Selecione uma pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const result = await window.electronAPI.importWorld();
        
        if (result.success) {
            showModal('Sucesso', result.message);
            loadWorlds();
        } else if (result.error) {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao importar mundo:', error);
        showModal('Erro', 'Erro ao importar mundo');
    } finally {
        hideLoading();
    }
}

async function backupActiveWorld() {
    if (!currentServerPath) {
        showModal('Erro', 'Selecione uma pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        // Primeiro, obter o mundo ativo
        const worldsResult = await window.electronAPI.getWorlds();
        if (!worldsResult.success) {
            showModal('Erro', 'Erro ao obter lista de mundos');
            return;
        }
        
        const activeWorld = worldsResult.worlds.find(w => w.isActive);
        if (!activeWorld) {
            showModal('Erro', 'Nenhum mundo ativo encontrado');
            return;
        }
        
        const result = await window.electronAPI.backupWorld(activeWorld.folder);
        
        if (result.success) {
            showModal('Sucesso', result.message);
        } else {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao fazer backup:', error);
        showModal('Erro', 'Erro ao fazer backup do mundo');
    } finally {
        hideLoading();
    }
}

async function setActiveWorld(worldName) {
    showLoading();
    try {
        const result = await window.electronAPI.setActiveWorld(worldName);
        
        if (result.success) {
            showModal('Sucesso', result.message);
            loadWorlds();
        } else {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao definir mundo ativo:', error);
        showModal('Erro', 'Erro ao definir mundo ativo');
    } finally {
        hideLoading();
    }
}

async function backupWorld(worldName) {
    showLoading();
    try {
        const result = await window.electronAPI.backupWorld(worldName);
        
        if (result.success) {
            showModal('Sucesso', result.message);
        } else {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao fazer backup:', error);
        showModal('Erro', 'Erro ao fazer backup do mundo');
    } finally {
        hideLoading();
    }
}

async function deleteWorld(worldName) {
    const confirmed = await showConfirmModal(
        'Confirmar Exclusão',
        `Deseja realmente deletar o mundo "${worldName}"?\n\nUm backup será criado automaticamente antes da exclusão.`
    );
    
    if (confirmed) {
        showLoading();
        try {
            const result = await window.electronAPI.deleteWorld(worldName);
            
            if (result.success) {
                showModal('Sucesso', result.message);
                loadWorlds();
            } else {
                showModal('Erro', result.error);
            }
        } catch (error) {
            console.error('Erro ao deletar mundo:', error);
            showModal('Erro', 'Erro ao deletar mundo');
        } finally {
            hideLoading();
        }
    }
}

// === CONFIGURAÇÕES DO MUNDO TAB ===
function setupWorldConfigTab() {
    const openWorldConfigBtn = document.getElementById('openWorldConfigBtn');
    const refreshWorldConfigBtn = document.getElementById('refreshWorldConfigBtn');
    
    if (openWorldConfigBtn) {
        openWorldConfigBtn.addEventListener('click', () => {
            window.location.href = 'world-config.html';
        });
    }
    
    if (refreshWorldConfigBtn) {
        refreshWorldConfigBtn.addEventListener('click', loadWorldConfigPreview);
    }
}

async function loadWorldConfigPreview() {
    if (!currentServerPath) return;
    
    const worldInfo = document.getElementById('worldInfo');
    const appliedAddonsPreview = document.getElementById('appliedAddonsPreview');
    
    if (!worldInfo || !appliedAddonsPreview) return;
    
    showLoading();
    try {
        // Carregar informações do mundo
        const worldSettingsResult = await window.electronAPI.getWorldSettings();
        
        if (worldSettingsResult.success) {
            const worldName = worldSettingsResult.world_name || 'Mundo Atual';
            const settings = worldSettingsResult.settings;
            
            worldInfo.innerHTML = `
                <div class="world-info-item">
                    <strong>Nome do Mundo:</strong> ${worldName}
                </div>
                <div class="world-info-item">
                    <strong>Dificuldade:</strong> ${getDifficultyName(settings.Difficulty)}
                </div>
                <div class="world-info-item">
                    <strong>Modo Hardcore:</strong> ${settings.IsHardcore ? 'Sim' : 'Não'}
                </div>
                <div class="world-info-item">
                    <strong>Comandos:</strong> ${settings.commandblocksenabled ? 'Habilitados' : 'Desabilitados'}
                </div>
                <div class="world-info-item">
                    <strong>PvP:</strong> ${settings.pvp ? 'Habilitado' : 'Desabilitado'}
                </div>
                <div class="world-info-item">
                    <strong>Manter Inventário:</strong> ${settings.keepinventory ? 'Sim' : 'Não'}
                </div>
            `;
        } else {
            worldInfo.innerHTML = '<p class="text-error">Erro ao carregar informações do mundo</p>';
        }
        
        // Carregar addons aplicados
        const appliedAddonsResult = await window.electronAPI.getAppliedWorldAddons();
        
        if (appliedAddonsResult.success) {
            const addons = appliedAddonsResult.addons;
            let addonsHtml = '';
            
            if (addons.behavior_packs && addons.behavior_packs.length > 0) {
                addonsHtml += '<h5><i class="fas fa-code"></i> Behavior Packs</h5>';
                addons.behavior_packs.forEach(addon => {
                    addonsHtml += `<div class="addon-preview-item">📦 ${addon.name || addon.folder}</div>`;
                });
            }
            
            if (addons.resource_packs && addons.resource_packs.length > 0) {
                addonsHtml += '<h5><i class="fas fa-image"></i> Resource Packs</h5>';
                addons.resource_packs.forEach(addon => {
                    addonsHtml += `<div class="addon-preview-item">🎨 ${addon.name || addon.folder}</div>`;
                });
            }
            
            if (addonsHtml === '') {
                addonsHtml = '<p class="text-center">Nenhum addon aplicado ao mundo</p>';
            }
            
            appliedAddonsPreview.innerHTML = addonsHtml;
        } else {
            appliedAddonsPreview.innerHTML = '<p class="text-error">Erro ao carregar addons aplicados</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar preview do mundo:', error);
        worldInfo.innerHTML = '<p class="text-error">Erro ao carregar informações</p>';
        appliedAddonsPreview.innerHTML = '<p class="text-error">Erro ao carregar addons</p>';
    } finally {
        hideLoading();
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

// === ADDONS TAB ===
function setupAddonsTab() {
    const importAddonBtn = document.getElementById('importAddonBtn');
    const refreshAddonsBtn = document.getElementById('refreshAddonsBtn');
    
    if (importAddonBtn) importAddonBtn.addEventListener('click', importAddon);
    if (refreshAddonsBtn) refreshAddonsBtn.addEventListener('click', loadAddons);
}

async function loadAddons() {
    if (!currentServerPath) return;
    
    showLoading();
    try {
        const result = await window.electronAPI.getAddons();
        
        if (result.success) {
            renderAddonsList(result.addons);
        } else {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao carregar addons:', error);
        showModal('Erro', 'Erro ao carregar addons');
    } finally {
        hideLoading();
    }
}

function renderAddonsList(addons) {
    const behaviorPacksList = document.getElementById('behaviorPacksList');
    const resourcePacksList = document.getElementById('resourcePacksList');
    
    if (!behaviorPacksList || !resourcePacksList) return;
    
    // Behavior Packs
    behaviorPacksList.innerHTML = '';
    if (addons.behavior_packs.length === 0) {
        behaviorPacksList.innerHTML = '<p class="text-center">Nenhum behavior pack encontrado</p>';
    } else {
        addons.behavior_packs.forEach(addon => {
            const addonItem = createAddonItem(addon, 'behavior');
            behaviorPacksList.appendChild(addonItem);
        });
    }
    
    // Resource Packs
    resourcePacksList.innerHTML = '';
    if (addons.resource_packs.length === 0) {
        resourcePacksList.innerHTML = '<p class="text-center">Nenhum resource pack encontrado</p>';
    } else {
        addons.resource_packs.forEach(addon => {
            const addonItem = createAddonItem(addon, 'resource');
            resourcePacksList.appendChild(addonItem);
        });
    }
}

function createAddonItem(addon, type) {
    const addonItem = document.createElement('div');
    addonItem.className = 'addon-item';
    
    const icon = type === 'behavior' ? '📦' : '🎨';
    const size = formatBytes(addon.size || 0);
    const version = Array.isArray(addon.version) ? addon.version.join('.') : (addon.version || '1.0.0');
    
    addonItem.innerHTML = `
        <h4>${icon} ${addon.name || addon.folder}</h4>
        <p><strong>Descrição:</strong> ${addon.description || 'Sem descrição'}</p>
        <p><strong>Versão:</strong> ${version}</p>
        <p><strong>Tamanho:</strong> ${size}</p>
        <p><strong>Modificado:</strong> ${new Date(addon.lastModified).toLocaleString()}</p>
        <div class="addon-actions">
            <button class="btn btn-danger btn-sm" onclick="deleteAddon('${addon.folder}', '${type}')">
                <i class="fas fa-trash"></i> Remover
            </button>
            <button class="btn btn-secondary btn-sm" onclick="showAddonInFolder('${addon.path}')">
                <i class="fas fa-folder-open"></i> Abrir Pasta
            </button>
        </div>
    `;
    
    return addonItem;
}

async function importAddon() {
    if (!currentServerPath) {
        showModal('Erro', 'Selecione uma pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const result = await window.electronAPI.importAddon();
        
        if (result.success) {
            showModal('Sucesso', result.message);
            loadAddons();
        } else if (result.error) {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao importar addon:', error);
        showModal('Erro', 'Erro ao importar addon');
    } finally {
        hideLoading();
    }
}

async function deleteAddon(addonId, addonType) {
    const confirmed = await showConfirmModal(
        'Confirmar Remoção',
        `Deseja realmente remover o addon "${addonId}"?\n\nUm backup será criado automaticamente.`
    );
    
    if (confirmed) {
        showLoading();
        try {
            const result = await window.electronAPI.deleteAddon(addonId, addonType);
            
            if (result.success) {
                showModal('Sucesso', result.message);
                loadAddons();
            } else {
                showModal('Erro', result.error);
            }
        } catch (error) {
            console.error('Erro ao remover addon:', error);
            showModal('Erro', 'Erro ao remover addon');
        } finally {
            hideLoading();
        }
    }
}

async function showAddonInFolder(addonPath) {
    try {
        await window.electronAPI.showItemInFolder(addonPath);
    } catch (error) {
        console.error('Erro ao abrir pasta:', error);
        showModal('Erro', 'Erro ao abrir pasta do addon');
    }
}

// === JOGADORES TAB ===
function setupPlayersTab() {
    const addOpBtn = document.getElementById('addOpBtn');
    const newOpInput = document.getElementById('newOpInput');
    
    if (addOpBtn) addOpBtn.addEventListener('click', addOperator);
    if (newOpInput) {
        newOpInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addOperator();
            }
        });
    }
}

async function loadOperators() {
    if (!currentServerPath) return;
    
    showLoading();
    try {
        const result = await window.electronAPI.getOperators();
        
        if (result.success) {
            renderOperatorsList(result.operators);
        } else {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao carregar operadores:', error);
        showModal('Erro', 'Erro ao carregar operadores');
    } finally {
        hideLoading();
    }
}

function renderOperatorsList(operators) {
    const operatorsList = document.getElementById('operatorsList');
    if (!operatorsList) return;
    
    operatorsList.innerHTML = '';
    
    if (operators.length === 0) {
        operatorsList.innerHTML = '<p class="text-center">Nenhum operador configurado</p>';
        return;
    }
    
    operators.forEach(op => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        
        playerItem.innerHTML = `
            <h4><i class="fas fa-crown"></i> ${op.name}</h4>
            <p><strong>Nível:</strong> ${op.level}</p>
            <p><strong>UUID:</strong> ${op.uuid || 'Não definido'}</p>
            <div class="player-actions">
                <button class="btn btn-danger btn-sm" onclick="removeOperator('${op.name}')">
                    <i class="fas fa-times"></i> Remover OP
                </button>
            </div>
        `;
        
        operatorsList.appendChild(playerItem);
    });
}

async function addOperator() {
    const newOpInput = document.getElementById('newOpInput');
    if (!newOpInput) return;
    
    const playerName = newOpInput.value.trim();
    if (!playerName) {
        showModal('Erro', 'Digite o nome do jogador');
        return;
    }
    
    showLoading();
    try {
        const result = await window.electronAPI.addOperator(playerName);
        
        if (result.success) {
            showModal('Sucesso', result.message);
            newOpInput.value = '';
            loadOperators();
        } else {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao adicionar operador:', error);
        showModal('Erro', 'Erro ao adicionar operador');
    } finally {
        hideLoading();
    }
}

async function removeOperator(playerName) {
    const confirmed = await showConfirmModal(
        'Confirmar Remoção',
        `Deseja remover "${playerName}" dos operadores?`
    );
    
    if (confirmed) {
        showLoading();
        try {
            const result = await window.electronAPI.removeOperator(playerName);
            
            if (result.success) {
                showModal('Sucesso', result.message);
                loadOperators();
            } else {
                showModal('Erro', result.error);
            }
        } catch (error) {
            console.error('Erro ao remover operador:', error);
            showModal('Erro', 'Erro ao remover operador');
        } finally {
            hideLoading();
        }
    }
}

// === REDE TAB ===
function setupNetworkTab() {
    const startPlayitBtn = document.getElementById('startPlayitBtn');
    const stopPlayitBtn = document.getElementById('stopPlayitBtn');
    const restartPlayitBtn = document.getElementById('restartPlayitBtn');
    const refreshPlayitBtn = document.getElementById('refreshPlayitBtn');
    const copyUrlBtn = document.getElementById('copyUrlBtn');
    const clearPlayitLogsBtn = document.getElementById('clearPlayitLogsBtn');
    
    if (startPlayitBtn) startPlayitBtn.addEventListener('click', startPlayit);
    if (stopPlayitBtn) stopPlayitBtn.addEventListener('click', stopPlayit);
    if (restartPlayitBtn) restartPlayitBtn.addEventListener('click', restartPlayit);
    if (refreshPlayitBtn) refreshPlayitBtn.addEventListener('click', loadNetworkStatus);
    if (copyUrlBtn) copyUrlBtn.addEventListener('click', copyTunnelUrl);
    if (clearPlayitLogsBtn) clearPlayitLogsBtn.addEventListener('click', clearPlayitLogs);
}

async function loadNetworkStatus() {
    if (!currentServerPath) return;
    
    try {
        const result = await window.electronAPI.getPlayitStatus();
        
        if (result.success) {
            updatePlayitUI(result.status);
            
            if (result.status.isRunning) {
                loadTunnelInfo();
                loadPlayitLogs();
            }
        }
    } catch (error) {
        console.error('Erro ao carregar status da rede:', error);
    }
}

function updatePlayitUI(status) {
    const playitStatusDot = document.getElementById('playitStatusDot');
    const playitStatusText = document.getElementById('playitStatusText');
    const startPlayitBtn = document.getElementById('startPlayitBtn');
    const stopPlayitBtn = document.getElementById('stopPlayitBtn');
    const restartPlayitBtn = document.getElementById('restartPlayitBtn');
    const tunnelInfo = document.getElementById('tunnelInfo');
    const playitDownload = document.getElementById('playitDownload');
    
    if (playitStatusDot && playitStatusText) {
        if (status.isRunning) {
            playitStatusDot.className = 'status-dot online';
            playitStatusText.textContent = 'Túnel Ativo';
        } else {
            playitStatusDot.className = 'status-dot offline';
            playitStatusText.textContent = 'Túnel Inativo';
        }
    }
    
    if (startPlayitBtn) startPlayitBtn.disabled = status.isRunning;
    if (stopPlayitBtn) stopPlayitBtn.disabled = !status.isRunning;
    if (restartPlayitBtn) restartPlayitBtn.disabled = !status.isRunning;
    
    if (tunnelInfo) {
        tunnelInfo.style.display = status.isRunning ? 'block' : 'none';
    }
    
    if (playitDownload) {
        playitDownload.style.display = !status.isInstalled ? 'block' : 'none';
    }
}

async function startPlayit() {
    if (!currentServerPath) {
        showModal('Erro', 'Selecione uma pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const result = await window.electronAPI.startPlayit();
        
        if (result.success) {
            showModal('Sucesso', result.message);
            setTimeout(loadNetworkStatus, 2000);
        } else {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao iniciar Playit:', error);
        showModal('Erro', 'Erro ao iniciar túnel');
    } finally {
        hideLoading();
    }
}

async function stopPlayit() {
    showLoading();
    try {
        const result = await window.electronAPI.stopPlayit();
        
        if (result.success) {
            showModal('Sucesso', result.message);
            loadNetworkStatus();
        } else {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao parar Playit:', error);
        showModal('Erro', 'Erro ao parar túnel');
    } finally {
        hideLoading();
    }
}

async function restartPlayit() {
    showLoading();
    try {
        const result = await window.electronAPI.restartPlayit();
        
        if (result.success) {
            showModal('Sucesso', result.message);
            setTimeout(loadNetworkStatus, 2000);
        } else {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao reiniciar Playit:', error);
        showModal('Erro', 'Erro ao reiniciar túnel');
    } finally {
        hideLoading();
    }
}

async function loadTunnelInfo() {
    try {
        const result = await window.electronAPI.getTunnelInfo();
        
        if (result.success && result.tunnelInfo) {
            const tunnelUrlInput = document.getElementById('tunnelUrlInput');
            const tunnelDetails = document.getElementById('tunnelDetails');
            
            if (tunnelUrlInput && result.tunnelInfo.address) {
                tunnelUrlInput.value = result.tunnelInfo.address;
            }
            
            if (tunnelDetails && result.tunnelInfo) {
                const info = result.tunnelInfo;
                tunnelDetails.innerHTML = `
                    <div class="tunnel-detail-grid">
                        ${info.host ? `<div class="tunnel-detail"><strong>Host:</strong> ${info.host}</div>` : ''}
                        ${info.port ? `<div class="tunnel-detail"><strong>Porta:</strong> ${info.port}</div>` : ''}
                        ${info.status ? `<div class="tunnel-detail"><strong>Status:</strong> ${info.status}</div>` : ''}
                        ${info.connectedAt ? `<div class="tunnel-detail"><strong>Conectado em:</strong> ${new Date(info.connectedAt).toLocaleString()}</div>` : ''}
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar informações do túnel:', error);
    }
}

async function loadPlayitLogs() {
    try {
        const result = await window.electronAPI.getPlayitLogs();
        
        if (result.success) {
            const playitConsole = document.getElementById('playitConsole');
            if (playitConsole) {
                playitConsole.innerHTML = '';
                
                result.logs.forEach(log => {
                    const logLine = document.createElement('div');
                    logLine.className = `console-line ${log.type}`;
                    
                    const timestamp = new Date(log.timestamp).toLocaleTimeString();
                    logLine.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${log.message}`;
                    
                    playitConsole.appendChild(logLine);
                });
                
                playitConsole.scrollTop = playitConsole.scrollHeight;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar logs do Playit:', error);
    }
}

async function copyTunnelUrl() {
    const tunnelUrlInput = document.getElementById('tunnelUrlInput');
    if (tunnelUrlInput && tunnelUrlInput.value) {
        try {
            await navigator.clipboard.writeText(tunnelUrlInput.value);
            showModal('Sucesso', 'URL copiada para a área de transferência');
        } catch (error) {
            // Fallback para navegadores mais antigos
            tunnelUrlInput.select();
            document.execCommand('copy');
            showModal('Sucesso', 'URL copiada para a área de transferência');
        }
    }
}

async function clearPlayitLogs() {
    try {
        const result = await window.electronAPI.clearPlayitLogs();
        
        if (result.success) {
            const playitConsole = document.getElementById('playitConsole');
            if (playitConsole) {
                playitConsole.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Erro ao limpar logs:', error);
    }
}

// === ATUALIZAR TAB ===
function setupUpdaterTab() {
    const selectNewServerBtn = document.getElementById('selectNewServerBtn');
    const validateServerBtn = document.getElementById('validateServerBtn');
    const updateServerBtn = document.getElementById('updateServerBtn');
    const createBackupBtn = document.getElementById('createBackupBtn');
    const refreshBackupsBtn = document.getElementById('refreshBackupsBtn');
    
    if (selectNewServerBtn) selectNewServerBtn.addEventListener('click', selectNewServer);
    if (validateServerBtn) validateServerBtn.addEventListener('click', validateServer);
    if (updateServerBtn) updateServerBtn.addEventListener('click', updateServer);
    if (createBackupBtn) createBackupBtn.addEventListener('click', createBackup);
    if (refreshBackupsBtn) refreshBackupsBtn.addEventListener('click', loadBackups);
}

async function loadUpdaterInfo() {
    if (!currentServerPath) return;
    
    showLoading();
    try {
        const result = await window.electronAPI.getServerInfo();
        
        if (result.success) {
            renderServerInfo(result.serverInfo);
        }
        
        loadBackups();
    } catch (error) {
        console.error('Erro ao carregar informações do atualizador:', error);
    } finally {
        hideLoading();
    }
}

function renderServerInfo(serverInfo) {
    const serverInfoContainer = document.getElementById('serverInfo');
    if (!serverInfoContainer) return;
    
    serverInfoContainer.innerHTML = `
        <div class="server-info-grid">
            <div class="info-item">
                <strong>Caminho:</strong><br>
                ${serverInfo.path}
            </div>
            <div class="info-item">
                <strong>Executável:</strong><br>
                ${serverInfo.executable}
            </div>
            <div class="info-item">
                <strong>Versão:</strong><br>
                ${serverInfo.version}
            </div>
            <div class="info-item">
                <strong>Tamanho:</strong><br>
                ${formatBytes(serverInfo.size)}
            </div>
            <div class="info-item">
                <strong>Última Modificação:</strong><br>
                ${new Date(serverInfo.lastModified).toLocaleString()}
            </div>
        </div>
    `;
}

let selectedServerFile = null;

async function selectNewServer() {
    try {
        const result = await window.electronAPI.selectNewServer();
        
        if (result.success) {
            selectedServerFile = result.serverFile;
            
            const validateServerBtn = document.getElementById('validateServerBtn');
            if (validateServerBtn) {
                validateServerBtn.disabled = false;
            }
            
            showModal('Sucesso', 'Arquivo selecionado. Clique em "Validar Versão" para continuar.');
        } else if (result.error) {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao selecionar servidor:', error);
        showModal('Erro', 'Erro ao selecionar arquivo do servidor');
    }
}

async function validateServer() {
    if (!selectedServerFile) {
        showModal('Erro', 'Selecione um arquivo do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const result = await window.electronAPI.validateServer(selectedServerFile);
        
        const validationResult = document.getElementById('validationResult');
        if (validationResult) {
            validationResult.style.display = 'block';
            
            if (result.success && result.validation.isValid) {
                validationResult.className = 'validation-result validation-success';
                validationResult.innerHTML = `
                    <h4><i class="fas fa-check-circle"></i> Servidor Válido</h4>
                    <p><strong>Versão:</strong> ${result.validation.version}</p>
                    <p>O servidor está pronto para atualização.</p>
                `;
                
                const updateServerBtn = document.getElementById('updateServerBtn');
                if (updateServerBtn) {
                    updateServerBtn.disabled = false;
                }
            } else {
                validationResult.className = 'validation-result validation-error';
                validationResult.innerHTML = `
                    <h4><i class="fas fa-exclamation-triangle"></i> Servidor Inválido</h4>
                    <p>${result.message || result.error}</p>
                    ${result.validation && result.validation.missingFiles ? 
                        `<p><strong>Arquivos faltando:</strong> ${result.validation.missingFiles.join(', ')}</p>` : ''}
                `;
            }
        }
    } catch (error) {
        console.error('Erro ao validar servidor:', error);
        showModal('Erro', 'Erro ao validar servidor');
    } finally {
        hideLoading();
    }
}

async function updateServer() {
    if (!selectedServerFile) {
        showModal('Erro', 'Selecione e valide um arquivo do servidor primeiro');
        return;
    }
    
    const confirmed = await showConfirmModal(
        'Confirmar Atualização',
        'Deseja realmente atualizar o servidor?\n\nUm backup será criado automaticamente antes da atualização.'
    );
    
    if (confirmed) {
        showLoading();
        try {
            const result = await window.electronAPI.updateServer(selectedServerFile);
            
            if (result.success) {
                showModal('Sucesso', result.message);
                
                // Reset form
                selectedServerFile = null;
                const validateServerBtn = document.getElementById('validateServerBtn');
                const updateServerBtn = document.getElementById('updateServerBtn');
                const validationResult = document.getElementById('validationResult');
                
                if (validateServerBtn) validateServerBtn.disabled = true;
                if (updateServerBtn) updateServerBtn.disabled = true;
                if (validationResult) validationResult.style.display = 'none';
                
                // Reload info
                loadUpdaterInfo();
            } else {
                showModal('Erro', result.error);
            }
        } catch (error) {
            console.error('Erro ao atualizar servidor:', error);
            showModal('Erro', 'Erro ao atualizar servidor');
        } finally {
            hideLoading();
        }
    }
}

async function createBackup() {
    if (!currentServerPath) {
        showModal('Erro', 'Selecione uma pasta do servidor primeiro');
        return;
    }
    
    showLoading();
    try {
        const result = await window.electronAPI.createBackup();
        
        if (result.success) {
            showModal('Sucesso', result.message);
            loadBackups();
        } else {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao criar backup:', error);
        showModal('Erro', 'Erro ao criar backup');
    } finally {
        hideLoading();
    }
}

async function loadBackups() {
    if (!currentServerPath) return;
    
    try {
        const result = await window.electronAPI.getBackups();
        
        if (result.success) {
            renderBackupsList(result.backups);
        }
    } catch (error) {
        console.error('Erro ao carregar backups:', error);
    }
}

function renderBackupsList(backups) {
    const backupsList = document.getElementById('backupsList');
    if (!backupsList) return;
    
    backupsList.innerHTML = '';
    
    if (backups.length === 0) {
        backupsList.innerHTML = '<p class="text-center">Nenhum backup encontrado</p>';
        return;
    }
    
    const backupsGrid = document.createElement('div');
    backupsGrid.className = 'backups-grid';
    
    backups.forEach(backup => {
        const backupItem = document.createElement('div');
        backupItem.className = 'backup-item';
        
        backupItem.innerHTML = `
            <div class="backup-info">
                <h4><i class="fas fa-archive"></i> ${backup.name}</h4>
                <p><strong>Tamanho:</strong> ${formatBytes(backup.size)}</p>
                <p><strong>Criado:</strong> ${new Date(backup.created).toLocaleString()}</p>
                <p><strong>Modificado:</strong> ${new Date(backup.modified).toLocaleString()}</p>
            </div>
            <div class="backup-actions">
                <button class="btn btn-secondary btn-sm" onclick="showBackupInFolder('${backup.path}')">
                    <i class="fas fa-folder-open"></i> Abrir Pasta
                </button>
            </div>
        `;
        
        backupsGrid.appendChild(backupItem);
    });
    
    backupsList.appendChild(backupsGrid);
}

async function showBackupInFolder(backupPath) {
    try {
        await window.electronAPI.showItemInFolder(backupPath);
    } catch (error) {
        console.error('Erro ao abrir pasta:', error);
        showModal('Erro', 'Erro ao abrir pasta do backup');
    }
}

// === CONSOLE TAB ===
function setupConsoleTab() {
    const sendCommandBtn = document.getElementById('sendCommandBtn');
    const clearConsoleBtn = document.getElementById('clearConsoleBtn');
    const commandInput = document.getElementById('commandInput');
    
    if (sendCommandBtn) sendCommandBtn.addEventListener('click', sendCommand);
    if (clearConsoleBtn) clearConsoleBtn.addEventListener('click', clearConsole);
    
    if (commandInput) {
        commandInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendCommand();
            }
        });
    }
}

async function loadConsoleLogs() {
    try {
        const result = await window.electronAPI.getConsoleLogs();
        
        if (result.success) {
            renderConsoleLogs(result.logs);
        }
    } catch (error) {
        console.error('Erro ao carregar logs do console:', error);
    }
}

function renderConsoleLogs(logs) {
    const serverConsole = document.getElementById('serverConsole');
    if (!serverConsole) return;
    
    serverConsole.innerHTML = '';
    
    logs.forEach(log => {
        const logLine = document.createElement('div');
        logLine.className = `console-line ${log.type}`;
        
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        logLine.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${log.message}`;
        
        serverConsole.appendChild(logLine);
    });
    
    serverConsole.scrollTop = serverConsole.scrollHeight;
}

async function sendCommand() {
    const commandInput = document.getElementById('commandInput');
    if (!commandInput) return;
    
    const command = commandInput.value.trim();
    if (!command) return;
    
    try {
        const result = await window.electronAPI.sendCommand(command);
        
        if (result.success) {
            commandInput.value = '';
            setTimeout(loadConsoleLogs, 500);
        } else {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao enviar comando:', error);
        showModal('Erro', 'Erro ao enviar comando');
    }
}

async function clearConsole() {
    try {
        const result = await window.electronAPI.clearConsole();
        
        if (result.success) {
            const serverConsole = document.getElementById('serverConsole');
            if (serverConsole) {
                serverConsole.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Erro ao limpar console:', error);
    }
}

// === UTILITY FUNCTIONS ===
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
        
        const confirmHandler = () => {
            hideModal();
            elements.modalConfirm.removeEventListener('click', confirmHandler);
            elements.modalCancel.removeEventListener('click', cancelHandler);
            resolve(true);
        };
        
        const cancelHandler = () => {
            hideModal();
            elements.modalConfirm.removeEventListener('click', confirmHandler);
            elements.modalCancel.removeEventListener('click', cancelHandler);
            resolve(false);
        };
        
        elements.modalConfirm.addEventListener('click', confirmHandler);
        elements.modalCancel.addEventListener('click', cancelHandler);
    });
}

function hideModal() {
    elements.modal.classList.remove('show');
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function loadInitialData() {
    if (!currentServerPath) return;
    
    // Carregar dados da tab atual
    loadTabData(currentTab);
}

// Auto-refresh para console e network quando estão ativos
setInterval(() => {
    if (currentTab === 'console' && serverStatus.isRunning) {
        loadConsoleLogs();
    }
    
    if (currentTab === 'network') {
        loadNetworkStatus();
        if (document.getElementById('playitStatusDot')?.classList.contains('online')) {
            loadPlayitLogs();
        }
    }
}, 3000);