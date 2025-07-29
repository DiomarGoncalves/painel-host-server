// Estado global
let currentSettings = {};
let availableAddons = {};
let appliedAddons = {};
let selectedAvailableAddon = null;
let selectedAppliedAddon = null;

// Elementos DOM
const elements = {
    // Botões principais
    saveBtn: document.getElementById('saveBtn'),
    loadBtn: document.getElementById('loadBtn'),
    resetBtn: document.getElementById('resetBtn'),
    backBtn: document.getElementById('backBtn'),
    
    // Botões de addon
    applyAddonBtn: document.getElementById('applyAddonBtn'),
    removeAddonBtn: document.getElementById('removeAddonBtn'),
    refreshAddonsBtn: document.getElementById('refreshAddonsBtn'),
    
    // Containers
    availableAddons: document.getElementById('availableAddons'),
    appliedAddons: document.getElementById('appliedAddons'),
    currentWorld: document.getElementById('currentWorld'),
    
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

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadWorldSettings();
    loadWorldAddons();
});

function setupEventListeners() {
    // Botões principais
    elements.saveBtn.addEventListener('click', saveWorldSettings);
    elements.loadBtn.addEventListener('click', loadWorldSettings);
    elements.resetBtn.addEventListener('click', resetToDefaults);
    elements.backBtn.addEventListener('click', () => window.location.href = 'index.html');
    
    // Botões de addon
    elements.refreshAddonsBtn.addEventListener('click', loadWorldAddons);
    
    // Modal
    elements.modalClose.addEventListener('click', hideModal);
    elements.modalCancel.addEventListener('click', hideModal);
    elements.modal.addEventListener('click', function(e) {
        if (e.target === elements.modal) {
            hideModal();
        }
    });
}

function toggleSection(sectionId) {
    const content = document.getElementById(`${sectionId}-content`);
    const toggle = document.getElementById(`${sectionId}-toggle`);
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        toggle.classList.remove('collapsed');
    } else {
        content.classList.add('collapsed');
        toggle.classList.add('collapsed');
    }
}

async function loadWorldSettings() {
    showLoading();
    try {
        const result = await window.electronAPI.getWorldSettings();
        
        if (result.success) {
            currentSettings = result.settings;
            populateSettingsForm(result.settings);
            elements.currentWorld.textContent = `Mundo: ${result.world_name || 'Mundo Atual'}`;
        } else {
            showModal('Erro', result.error || 'Erro ao carregar configurações do mundo');
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        showModal('Erro', 'Erro ao carregar configurações do mundo');
    } finally {
        hideLoading();
    }
}

function populateSettingsForm(settings) {
    // Preencher todos os campos de configuração
    Object.keys(settings).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = Boolean(settings[key]);
            } else if (element.tagName === 'SELECT') {
                element.value = String(settings[key]);
            } else {
                element.value = String(settings[key]);
            }
        }
    });
}

async function saveWorldSettings() {
    showLoading();
    try {
        const settings = {};
        
        // Coletar todas as configurações do formulário
        const configFields = [
            'RandomSeed', 'IsHardcore', 'Difficulty', 'educationFeaturesEnabled',
            'commandblockoutput', 'commandblocksenabled', 'functioncommandlimit',
            'maxcommandchainlength', 'sendcommandfeedback', 'dodaylightcycle',
            'doweathercycle', 'randomtickspeed', 'doinsomnia', 'doentitydrops',
            'dotiledrops', 'domobloot', 'drowningdamage', 'falldamage',
            'firedamage', 'freezedamage', 'keepinventory', 'doimmediaterespawn',
            'naturalregeneration', 'mobgriefing', 'pvp', 'playerssleepingpercentage',
            'spawnradius', 'dofiretick', 'tntexplodes', 'tntexplosiondropdecay',
            'respawnblocksexplode', 'showcoordinates', 'showdaysplayed',
            'showdeathmessages', 'showtags', 'recipesunlock', 'data_driven_biomes',
            'experimental_creator_cameras', 'gametest', 'jigsaw_structures',
            'upcoming_creator_features', 'villager_trades_rebalance', 'domobspawning'
        ];
        
        configFields.forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                let value = element.value;
                
                // Converter tipos apropriados
                if (value === 'true' || value === 'false') {
                    settings[key] = value === 'true';
                } else if (!isNaN(value) && value !== '') {
                    settings[key] = parseInt(value);
                } else {
                    settings[key] = value;
                }
            }
        });
        
        const result = await window.electronAPI.saveWorldSettings(settings);
        
        if (result.success) {
            currentSettings = settings;
            showModal('Sucesso', result.message);
        } else {
            showModal('Erro', result.error || 'Erro ao salvar configurações');
        }
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        showModal('Erro', 'Erro ao salvar configurações do mundo');
    } finally {
        hideLoading();
    }
}

async function resetToDefaults() {
    const confirmed = await showConfirmModal(
        'Confirmar Reset',
        'Deseja restaurar todas as configurações para os valores padrão?\n\nEsta ação não pode ser desfeita.'
    );
    
    if (confirmed) {
        showLoading();
        try {
            const result = await window.electronAPI.getDefaultWorldSettings();
            
            if (result.success) {
                populateSettingsForm(result.settings);
                showModal('Sucesso', 'Configurações restauradas para os valores padrão!');
            } else {
                showModal('Erro', 'Erro ao obter configurações padrão');
            }
        } catch (error) {
            console.error('Erro ao resetar configurações:', error);
            showModal('Erro', 'Erro ao resetar configurações');
        } finally {
            hideLoading();
        }
    }
}

// Função para carregar e separar addons disponíveis e aplicados
async function loadWorldAddons() {
    try {
        // Carregar addons disponíveis
        const available = await window.electronAPI.getAvailableWorldAddons();
        if (available.success) {
            renderAddonList('availableAddonsBehaviorList', available.addons.behavior_packs, 'behavior');
            renderAddonList('availableAddonsResourceList', available.addons.resource_packs, 'resource');
        } else {
            document.getElementById('availableAddonsBehaviorList').innerHTML = '<p>Erro ao carregar behavior packs</p>';
            document.getElementById('availableAddonsResourceList').innerHTML = '<p>Erro ao carregar resource packs</p>';
        }

        // Carregar addons aplicados
        const applied = await window.electronAPI.getAppliedWorldAddons();
        if (applied.success) {
            renderAddonList('appliedAddonsBehaviorList', applied.addons.behavior_packs, 'behavior', true);
            renderAddonList('appliedAddonsResourceList', applied.addons.resource_packs, 'resource', true);
        } else {
            document.getElementById('appliedAddonsBehaviorList').innerHTML = '<p>Erro ao carregar behavior packs aplicados</p>';
            document.getElementById('appliedAddonsResourceList').innerHTML = '<p>Erro ao carregar resource packs aplicados</p>';
        }
    } catch (e) {
        console.error('Erro ao carregar addons do mundo:', e);
        document.getElementById('availableAddonsBehaviorList').innerHTML = '<p>Erro ao carregar addons</p>';
        document.getElementById('availableAddonsResourceList').innerHTML = '<p>Erro ao carregar addons</p>';
        document.getElementById('appliedAddonsBehaviorList').innerHTML = '<p>Erro ao carregar addons</p>';
        document.getElementById('appliedAddonsResourceList').innerHTML = '<p>Erro ao carregar addons</p>';
    }
}

// Função para renderizar lista de addons
function renderAddonList(containerId, addons, type, applied = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    if (!addons || addons.length === 0) {
        container.innerHTML = `<p class="text-center">${applied ? 'Nenhum addon aplicado' : 'Nenhum addon disponível'}</p>`;
        return;
    }
    
    addons.forEach(addon => {
        const div = document.createElement('div');
        div.className = 'addon-preview-item';
        
        const icon = type === 'behavior' ? '📦' : '🎨';
        const name = addon.name || addon.folder || 'Addon sem nome';
        const version = Array.isArray(addon.version) ? addon.version.join('.') : (addon.version || '1.0.0');
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${icon} ${name}</span>
                <small style="color: #90a4ae;">v${version}</small>
            </div>
            ${addon.description ? `<div style="font-size: 0.8em; color: #b0bec5; margin-top: 0.25rem;">${addon.description}</div>` : ''}
        `;
        
        div.dataset.uuid = addon.uuid;
        div.dataset.type = type;
        div.dataset.name = name;
        
        // Permite seleção para aplicar/remover
        div.onclick = function() {
            document.querySelectorAll(`#${containerId} .addon-preview-item.selected`).forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            
            // Atualizar botões
            updateAddonButtons();
        };
        
        container.appendChild(div);
    });
}

// Função para atualizar estado dos botões
function updateAddonButtons() {
    const applyBtn = document.getElementById('applyAddonBtn');
    const removeBtn = document.getElementById('removeAddonBtn');
    
    const availableSelected = document.querySelector('#availableAddonsBehaviorList .addon-preview-item.selected') ||
                             document.querySelector('#availableAddonsResourceList .addon-preview-item.selected');
    
    const appliedSelected = document.querySelector('#appliedAddonsBehaviorList .addon-preview-item.selected') ||
                           document.querySelector('#appliedAddonsResourceList .addon-preview-item.selected');
    
    if (applyBtn) applyBtn.disabled = !availableSelected;
    if (removeBtn) removeBtn.disabled = !appliedSelected;
}

// Eventos para aplicar/remover addons
document.getElementById('applyAddonBtn').onclick = async function() {
    // Verifica seleção em behavior/resource disponíveis
    let selected = document.querySelector('#availableAddonsBehaviorList .addon-preview-item.selected') ||
                   document.querySelector('#availableAddonsResourceList .addon-preview-item.selected');
    if (!selected) {
        showModal('Aviso', 'Selecione um addon disponível para aplicar.');
        return;
    }
    
    const uuid = selected.dataset.uuid;
    const type = selected.dataset.type;
    const name = selected.dataset.name;
    
    showLoading();
    
    // Busca info completa do addon selecionado
    try {
        const available = await window.electronAPI.getAvailableWorldAddons();
        let addon = (type === 'behavior' ? available.addons.behavior_packs : available.addons.resource_packs)
            .find(a => a.uuid === uuid || a.folder === uuid);
        
        if (!addon) {
            // Criar objeto addon básico se não encontrado
            addon = {
                uuid: uuid,
                name: name,
                type: type,
                folder: uuid
            };
        }
        
        const result = await window.electronAPI.applyAddonToWorld(addon);
        
        if (result.success) {
            showModal('Sucesso', result.message);
            loadWorldAddons();
        } else {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao aplicar addon:', error);
        showModal('Erro', 'Erro ao aplicar addon ao mundo');
    } finally {
        hideLoading();
    }
};

document.getElementById('removeAddonBtn').onclick = async function() {
    // Verifica seleção em behavior/resource aplicados
    let selected = document.querySelector('#appliedAddonsBehaviorList .addon-preview-item.selected') ||
                   document.querySelector('#appliedAddonsResourceList .addon-preview-item.selected');
    if (!selected) {
        showModal('Aviso', 'Selecione um addon aplicado para remover.');
        return;
    }
    
    const uuid = selected.dataset.uuid;
    const type = selected.dataset.type;
    const name = selected.dataset.name;
    
    const confirmed = await showConfirmModal(
        'Confirmar Remoção',
        `Deseja remover o addon "${name}" do mundo atual?`
    );
    
    if (!confirmed) return;
    
    showLoading();
    
    // Busca info completa do addon selecionado
    try {
        const applied = await window.electronAPI.getAppliedWorldAddons();
        let addon = (type === 'behavior' ? applied.addons.behavior_packs : applied.addons.resource_packs)
            .find(a => a.uuid === uuid || a.folder === uuid);
        
        if (!addon) {
            // Criar objeto addon básico se não encontrado
            addon = {
                uuid: uuid,
                name: name,
                type: type,
                folder: uuid
            };
        }
        
        const result = await window.electronAPI.removeAddonFromWorld(addon);
        
        if (result.success) {
            showModal('Sucesso', result.message);
            loadWorldAddons();
        } else {
            showModal('Erro', result.error);
        }
    } catch (error) {
        console.error('Erro ao remover addon:', error);
        showModal('Erro', 'Erro ao remover addon do mundo');
    } finally {
        hideLoading();
    }
};

document.getElementById('refreshAddonsBtn').onclick = loadWorldAddons;

// Carregar ao abrir página
window.onload = function() {
    loadWorldSettings();
    loadWorldAddons();
};

// Utility Functions
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
        elements.modalBody.innerHTML = `<p>${message}</p>`;
        elements.modalConfirm.style.display = 'block';
        elements.modal.classList.add('show');

        // Remove listeners antigos para evitar múltiplas execuções
        elements.modalConfirm.onclick = null;
        elements.modalCancel.onclick = null;
        elements.modalClose.onclick = null;

        const confirmHandler = () => {
            hideModal();
            resolve(true);
        };
        const cancelHandler = () => {
            hideModal();
            resolve(false);
        };
        elements.modalConfirm.addEventListener('click', confirmHandler, { once: true });
        elements.modalCancel.addEventListener('click', cancelHandler, { once: true });
        elements.modalClose.addEventListener('click', cancelHandler, { once: true });
    });
}

function hideModal() {
    elements.modal.classList.remove('show');
}

// Expor função para HTML
window.toggleSection = toggleSection;