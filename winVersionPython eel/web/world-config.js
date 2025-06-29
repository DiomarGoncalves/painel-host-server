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
    loadAddonLists();
});

function setupEventListeners() {
    // Botões principais
    elements.saveBtn.addEventListener('click', saveWorldSettings);
    elements.loadBtn.addEventListener('click', loadWorldSettings);
    elements.resetBtn.addEventListener('click', resetToDefaults);
    elements.backBtn.addEventListener('click', () => window.location.href = 'index.html');
    
    // Botões de addon
    elements.applyAddonBtn.addEventListener('click', applySelectedAddon);
    elements.removeAddonBtn.addEventListener('click', removeSelectedAddon);
    elements.refreshAddonsBtn.addEventListener('click', loadAddonLists);
    
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
        const result = await eel.get_world_settings()();
        
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
        
        const result = await eel.save_world_settings(settings)();
        
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
            const result = await eel.get_default_world_settings()();
            
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

async function loadAddonLists() {
    showLoading();
    try {
        // Carregar addons disponíveis
        const availableResult = await eel.get_available_world_addons()();
        if (availableResult.success) {
            availableAddons = availableResult.addons;
            renderAvailableAddons();
        }
        
        // Carregar addons aplicados
        const appliedResult = await eel.get_applied_world_addons()();
        if (appliedResult.success) {
            appliedAddons = appliedResult.addons;
            renderAppliedAddons();
        }
    } catch (error) {
        console.error('Erro ao carregar listas de addons:', error);
        showModal('Erro', 'Erro ao carregar listas de addons');
    } finally {
        hideLoading();
    }
}

function renderAvailableAddons() {
    elements.availableAddons.innerHTML = '';
    
    const allAvailable = [
        ...availableAddons.behavior_packs || [],
        ...availableAddons.resource_packs || []
    ];
    
    if (allAvailable.length === 0) {
        elements.availableAddons.innerHTML = `
            <p class="text-center" style="color: #90a4ae;">
                Nenhum addon disponível<br>
                <small>Importe addons na aba principal</small>
            </p>
        `;
        return;
    }
    
    allAvailable.forEach(addon => {
        const addonElement = createAddonElement(addon, 'available');
        elements.availableAddons.appendChild(addonElement);
    });
}

function renderAppliedAddons() {
    elements.appliedAddons.innerHTML = '';
    
    const allApplied = [
        ...appliedAddons.behavior_packs || [],
        ...appliedAddons.resource_packs || []
    ];
    
    if (allApplied.length === 0) {
        elements.appliedAddons.innerHTML = `
            <p class="text-center" style="color: #90a4ae;">
                Nenhum addon aplicado
            </p>
        `;
        return;
    }
    
    allApplied.forEach(addon => {
        const addonElement = createAddonElement(addon, 'applied');
        elements.appliedAddons.appendChild(addonElement);
    });
}

function createAddonElement(addon, type) {
    const div = document.createElement('div');
    div.className = 'addon-item';
    div.onclick = () => selectAddon(addon, type);
    
    const isSelected = (type === 'available' && selectedAvailableAddon?.uuid === addon.uuid) ||
                      (type === 'applied' && selectedAppliedAddon?.uuid === addon.uuid);
    
    if (isSelected) {
        div.classList.add('selected');
    }
    
    div.innerHTML = `
        <input type="radio" name="${type}Addon" value="${addon.uuid}" ${isSelected ? 'checked' : ''}>
        <div class="addon-info">
            <div class="addon-name">
                <i class="fas fa-puzzle-piece"></i> ${addon.name || 'Addon sem nome'}
            </div>
            <div class="addon-description">
                ${addon.description || 'Sem descrição'}
            </div>
        </div>
    `;
    
    return div;
}

function selectAddon(addon, type) {
    if (type === 'available') {
        selectedAvailableAddon = addon;
        selectedAppliedAddon = null;
    } else {
        selectedAppliedAddon = addon;
        selectedAvailableAddon = null;
    }
    
    // Re-renderizar para atualizar seleção
    renderAvailableAddons();
    renderAppliedAddons();
}

async function applySelectedAddon() {
    if (!selectedAvailableAddon) {
        showModal('Aviso', 'Selecione um addon da biblioteca primeiro.');
        return;
    }
    
    showLoading();
    try {
        const result = await eel.apply_addon_to_world(selectedAvailableAddon)();
        
        if (result.success) {
            showModal('Sucesso', result.message);
            selectedAvailableAddon = null;
            await loadAddonLists();
        } else {
            showModal('Erro', result.error || 'Erro ao aplicar addon');
        }
    } catch (error) {
        console.error('Erro ao aplicar addon:', error);
        showModal('Erro', 'Erro ao aplicar addon ao mundo');
    } finally {
        hideLoading();
    }
}

async function removeSelectedAddon() {
    if (!selectedAppliedAddon) {
        showModal('Aviso', 'Selecione um addon aplicado primeiro.');
        return;
    }
    
    const confirmed = await showConfirmModal(
        'Confirmar Remoção',
        `Deseja remover o addon "${selectedAppliedAddon.name}" do mundo?`
    );
    
    if (confirmed) {
        showLoading();
        try {
            const result = await eel.remove_addon_from_world(selectedAppliedAddon)();
            
            if (result.success) {
                showModal('Sucesso', result.message);
                selectedAppliedAddon = null;
                await loadAddonLists();
            } else {
                showModal('Erro', result.error || 'Erro ao remover addon');
            }
        } catch (error) {
            console.error('Erro ao remover addon:', error);
            showModal('Erro', 'Erro ao remover addon do mundo');
        } finally {
            hideLoading();
        }
    }
}

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

// Expor função para HTML
window.toggleSection = toggleSection;