import { world, Dimension, system } from "@minecraft/server";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import { ots_simred_redstoneMaterial } from "./material";

function getNearbyEntities(entity, distance) {
    return entity.dimension.getEntities({ location: entity.location, maxDistance: distance });
}
function capitalizeWords(itemId) {
    return itemId.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

const selectSound = `playsound trial_spawner.open_shutter @a ^ ^ ^ 1 ${Math.random() * (0, 0.25) + 1.75}`
const backSound = `playsound ominous_item_spawner.spawn_item @a ^ ^ ^ 0.5 ${Math.random() * (0, 0.25) + 1}`

export function showMenuForm(player, sourceEntity) {

    const form = new ActionFormData()
        .title({ translate: 'entity.ots_simred:structure.name' })
        .body({ translate: 'ots_simred:form.menu.main.body', with: ['\n'] })
        .button({ translate: 'ots_simred:form.menu.small.title' }, "textures/ots/simred/icon/icon_small")
        .button({ translate: 'ots_simred:form.menu.medium.title' }, "textures/ots/simred/icon/icon_medium")
        .button({ translate: 'ots_simred:form.menu.large.title' }, "textures/ots/simred/icon/icon_large")
        .button({ translate: 'ots_simred:form.menu.remove' }, "textures/ots/simred/icon/icon_remove")

    form.show(player).then(r => {
        if (r.canceled) {
            sourceEntity.setProperty("ots_simred:structure.ui", false)
            return;
        }
        switch (r.selection) {
            case 0:
                sourceEntity.runCommand(selectSound)
                showMenuSmallForm(player, sourceEntity);
                break;
            case 1:
                sourceEntity.runCommand(selectSound)
                showMenuMediumForm(player, sourceEntity);
                break;
            case 2:
                sourceEntity.runCommand(selectSound)
                showMenuLargeForm(player, sourceEntity);
                break;
            case 3:
                sourceEntity.dimension.spawnParticle("ots_simred:df_break", sourceEntity.location)
                sourceEntity.runCommand(`playsound block.lantern.break @a ~ ~ ~ 0.75 ${Math.random() * (-0.1, 0.1) + 0.25}`)
                sourceEntity.runCommand(`playsound block.scaffolding.break @a ~ ~ ~ 1 ${Math.random() * (-0.1, 0.1) + 0.5}`)
                sourceEntity.runCommand("event entity @e[family=ots_simred,r=0.25] ots_simred:drop");
                break;
        }
    });
}

export function showMenuSmallForm(player, sourceEntity) {
    const size = 10
    const redstoneType = [
        { redstone: 'ots_simred:redstone_1', icon: 'textures/ots/simred/icon/i_redstone_1' },
        { redstone: 'ots_simred:redstone_2', icon: 'textures/ots/simred/icon/i_redstone_2' },
        { redstone: 'ots_simred:redstone_3', icon: 'textures/ots/simred/icon/i_redstone_3' },
        { redstone: 'ots_simred:redstone_4', icon: 'textures/ots/simred/icon/i_redstone_4' },
        { redstone: 'ots_simred:redstone_5', icon: 'textures/ots/simred/icon/i_redstone_5' },
        { redstone: 'ots_simred:redstone_16', icon: 'textures/ots/simred/icon/i_redstone_16' },
        { redstone: 'ots_simred:redstone_17', icon: 'textures/ots/simred/icon/i_redstone_17' },
        { redstone: 'ots_simred:redstone_18', icon: 'textures/ots/simred/icon/i_redstone_18' },
        { redstone: 'ots_simred:redstone_21', icon: 'textures/ots/simred/icon/i_redstone_21' },
        { redstone: 'ots_simred:redstone_22', icon: 'textures/ots/simred/icon/i_redstone_22' },
        { redstone: 'ots_simred:redstone_32', icon: 'textures/ots/simred/icon/i_redstone_32' },
        { redstone: 'ots_simred:redstone_33', icon: 'textures/ots/simred/icon/i_redstone_33' },
        { redstone: 'ots_simred:redstone_39', icon: 'textures/ots/simred/icon/i_redstone_39' },
        { redstone: 'ots_simred:redstone_40', icon: 'textures/ots/simred/icon/i_redstone_40' },
        { redstone: 'ots_simred:redstone_41', icon: 'textures/ots/simred/icon/i_redstone_41' },
        { redstone: 'ots_simred:redstone_34', icon: 'textures/ots/simred/icon/i_redstone_34' },
        { redstone: 'ots_simred:redstone_35', icon: 'textures/ots/simred/icon/i_redstone_35' },
        { redstone: 'ots_simred:redstone_36', icon: 'textures/ots/simred/icon/i_redstone_36' },
        { redstone: 'ots_simred:redstone_42', icon: 'textures/ots/simred/icon/i_redstone_42' },
        { redstone: 'ots_simred:redstone_43', icon: 'textures/ots/simred/icon/i_redstone_43' },
        { redstone: 'ots_simred:redstone_44', icon: 'textures/ots/simred/icon/i_redstone_44' },
        { redstone: 'ots_simred:redstone_50', icon: 'textures/ots/simred/icon/i_redstone_50' }
    ];

    const form = new ActionFormData()
        .title({ translate: 'ots_simred:form.menu.small.title' })
        .body({ translate: 'ots_simred:form.menu.size.body', with: ['\n'] })

    redstoneType.forEach(entry => {
        const redstone = entry.redstone
        const icon = entry.icon
        form.button({ translate: `entity.${redstone}.name` }, icon);
    });

    form.button({ translate: 'ots_simred:form.menu.back' }, "textures/ots/simred/icon/icon_back")

    form.show(player).then(r => {
        if (r.canceled) {
            sourceEntity.setProperty("ots_simred:structure.ui", false)
            return;
        }
        handleRedstoneSelection(r.selection, player, sourceEntity, redstoneType, size);
    });
}

export function showMenuMediumForm(player, sourceEntity) {
    const size = 18
    const redstoneType = [
        { redstone: 'ots_simred:redstone_6', icon: 'textures/ots/simred/icon/i_redstone_6' },
        { redstone: 'ots_simred:redstone_7', icon: 'textures/ots/simred/icon/i_redstone_7' },
        { redstone: 'ots_simred:redstone_8', icon: 'textures/ots/simred/icon/i_redstone_8' },
        { redstone: 'ots_simred:redstone_9', icon: 'textures/ots/simred/icon/i_redstone_9' },
        { redstone: 'ots_simred:redstone_10', icon: 'textures/ots/simred/icon/i_redstone_10' },
        { redstone: 'ots_simred:redstone_19', icon: 'textures/ots/simred/icon/i_redstone_19' },
        { redstone: 'ots_simred:redstone_20', icon: 'textures/ots/simred/icon/i_redstone_20' },
        { redstone: 'ots_simred:redstone_23', icon: 'textures/ots/simred/icon/i_redstone_23' },
        { redstone: 'ots_simred:redstone_24', icon: 'textures/ots/simred/icon/i_redstone_24' },
        { redstone: 'ots_simred:redstone_26', icon: 'textures/ots/simred/icon/i_redstone_26' },
        { redstone: 'ots_simred:redstone_27', icon: 'textures/ots/simred/icon/i_redstone_27' },
        { redstone: 'ots_simred:redstone_28', icon: 'textures/ots/simred/icon/i_redstone_28' },
        { redstone: 'ots_simred:redstone_31', icon: 'textures/ots/simred/icon/i_redstone_31' },
        { redstone: 'ots_simred:redstone_37', icon: 'textures/ots/simred/icon/i_redstone_37' },
        { redstone: 'ots_simred:redstone_38', icon: 'textures/ots/simred/icon/i_redstone_38' },
        { redstone: 'ots_simred:redstone_47', icon: 'textures/ots/simred/icon/i_redstone_47' },
        { redstone: 'ots_simred:redstone_45', icon: 'textures/ots/simred/icon/i_redstone_45' },
        { redstone: 'ots_simred:redstone_46', icon: 'textures/ots/simred/icon/i_redstone_46' },
        { redstone: 'ots_simred:redstone_48', icon: 'textures/ots/simred/icon/i_redstone_48' },
        { redstone: 'ots_simred:redstone_49', icon: 'textures/ots/simred/icon/i_redstone_49' }
    ];

    const form = new ActionFormData()
        .title({ translate: 'ots_simred:form.menu.medium.title' })
        .body({ translate: 'ots_simred:form.menu.size.body', with: ['\n'] })

    redstoneType.forEach(entry => {
        const redstone = entry.redstone
        const icon = entry.icon
        form.button({ translate: `entity.${redstone}.name` }, icon);
    });

    form.button({ translate: 'ots_simred:form.menu.back' }, "textures/ots/simred/icon/icon_back")

    form.show(player).then(r => {
        if (r.canceled) {
            sourceEntity.setProperty("ots_simred:structure.ui", false)
            return;
        }
        handleRedstoneSelection(r.selection, player, sourceEntity, redstoneType, size);
    });
}

export function showMenuLargeForm(player, sourceEntity) {
    const size = 34
    const redstoneType = [
        { redstone: 'ots_simred:redstone_11', icon: 'textures/ots/simred/icon/i_redstone_11' },
        { redstone: 'ots_simred:redstone_12', icon: 'textures/ots/simred/icon/i_redstone_12' },
        { redstone: 'ots_simred:redstone_13', icon: 'textures/ots/simred/icon/i_redstone_13' },
        { redstone: 'ots_simred:redstone_14', icon: 'textures/ots/simred/icon/i_redstone_14' },
        { redstone: 'ots_simred:redstone_15', icon: 'textures/ots/simred/icon/i_redstone_15' },
        { redstone: 'ots_simred:redstone_25', icon: 'textures/ots/simred/icon/i_redstone_25' },
        { redstone: 'ots_simred:redstone_29', icon: 'textures/ots/simred/icon/i_redstone_29' },
        { redstone: 'ots_simred:redstone_30', icon: 'textures/ots/simred/icon/i_redstone_30' }
    ];

    const form = new ActionFormData()
        .title({ translate: 'ots_simred:form.menu.large.title' })
        .body({ translate: 'ots_simred:form.menu.size.body', with: ['\n'] })

    redstoneType.forEach(entry => {
        const redstone = entry.redstone
        const icon = entry.icon
        form.button({ translate: `entity.${redstone}.name` }, icon);
    });

    form.button({ translate: 'ots_simred:form.menu.back' }, "textures/ots/simred/icon/icon_back")

    form.show(player).then(r => {
        if (r.canceled) {
            sourceEntity.setProperty("ots_simred:structure.ui", false)
            return;
        }
        handleRedstoneSelection(r.selection, player, sourceEntity, redstoneType, size);
    });
}

export function showRedstoneForm(player, sourceEntity) {
    const entities = getNearbyEntities(sourceEntity, 0.25);

    entities.forEach(entity => {
        const familyType = entity.getComponent("minecraft:type_family")
        if (familyType && familyType.hasTypeFamily("ots_simred:redstone")) {
            const width = entity.getProperty("ots_simred:structure.width")
            const redstoneType = ots_simred_redstoneMaterial.get(entity.typeId);
            const rawtext = { translate: 'ots_simred:select_redstone', with: { rawtext: [{ translate: `entity.${entity.typeId}.name` }] } };
            const rawtext_info = { translate: 'ots_simred:form.build.info' };
            let actionbarTimer = 0

            if (!redstoneType) return;

            let bodyText = "";

            redstoneType.material.forEach((entry) => {
                const itemId = capitalizeWords(entry.itemId.split(':')[1]);
                const max = entry.max;

                bodyText += `- ${max} ${itemId}\n`;
            });

            //vfx
            sourceEntity.runCommand(`playsound ominous_item_spawner.spawn_item_begin @a ^ ^ ^ 1 ${Math.random() * (0, 0.25) + 1.25}`)
            sourceEntity.runCommand(`playsound trial_spawner.close_shutter @a ~ ~ ~ 1 ${Math.random() * (0, 0.25) + 0.75}`)
            //

            const form = new MessageFormData()
                .title({ translate: `entity.${entity.typeId}.name` })
                .body({ rawtext: [{ translate: `%%s%%s%%s%%s`, with: { rawtext: [{ translate: redstoneType.rawtext, with: ["\n"] }, { translate: "ots_simred:redstone.reqmat", with: ["\n"] }, { text: bodyText }, { translate: redstoneType.req, with: ["\n"] }] } }] })
                .button1({ translate: 'ots_simred:form.menu.back' })
                .button2({ translate: 'ots_simred:form.menu.accept' });

            form.show(player).then(r => {
                if (r.canceled) {
                    sourceEntity.setProperty("ots_simred:structure.ui", false)
                    entity.runCommand("event entity @s ots_simred:drop")
                    return;
                }
                switch (r.selection) {
                    case 0:
                        sourceEntity.runCommand(`playsound ominous_item_spawner.spawn_item @a ^ ^ ^ 1 ${Math.random() * (0, 0.25) + 1.5}`)
                        entity.runCommand("event entity @s ots_simred:drop")
                        switch (width) {
                            case 10:
                                showMenuSmallForm(player, sourceEntity);
                                break;
                            case 18:
                                showMenuMediumForm(player, sourceEntity);
                                break;
                            case 34:
                                showMenuLargeForm(player, sourceEntity);
                                break;
                        }
                        break;
                    case 1:
                        const actionbarLoop = system.runInterval(() => {
                            actionbarTimer++
                            
                            if (actionbarTimer >= 0 && actionbarTimer <= 3) {
                                player.onScreenDisplay.setActionBar(rawtext)
                            } else if (actionbarTimer >= 4 && actionbarTimer <= 8) {
                                player.onScreenDisplay.setActionBar(rawtext_info)
                            }

                            if (actionbarTimer >= 8 || !sourceEntity.isValid() || sourceEntity.getProperty("ots_simred:structure.load") === true || sourceEntity.getProperty("ots_simred:structure.ui") === true) {
                                system.clearRun(actionbarLoop)
                            }
                        }, 10)

                        sourceEntity.runCommand(`playsound trial_spawner.open_shutter @a ~ ~ ~ 0.75 ${Math.random() * (0, 0.25) + 1}`)
                        sourceEntity.runCommand(`playsound beacon.power @a ~ ~ ~ 0.75 ${Math.random() * (0, 0.25) + 1.5}`)
                        sourceEntity.runCommand(`playsound ominous_item_spawner.about_to_spawn_item @a ~ ~ ~ 0.25 ${Math.random() * (0, 0.25) + 2}`)
                        system.runTimeout(() => { sourceEntity.runCommand(`playsound block.cartography_table.use @a ~ ~ ~ 1 0.75`) }, 15)
                        sourceEntity.setProperty("ots_simred:structure.select", true)
                        sourceEntity.setProperty("ots_simred:structure.ui", false)
                        entity.setProperty("ots_simred:structure.material.display", true)
                        entity.setProperty("ots_simred:structure.golem", true)
                        switch (width) {
                            case 10:
                                entity.runCommand("summon ots_simred:effect_select ~ ~ ~ ~ ~ ots_simred:effect_select.0")
                                break;
                            case 18:
                                entity.runCommand("summon ots_simred:effect_select ~ ~ ~ ~ ~ ots_simred:effect_select.1")
                                break;
                            case 34:
                                entity.runCommand("summon ots_simred:effect_select ~ ~ ~ ~ ~ ots_simred:effect_select.2")
                                break;
                        }
                        break;

                }
            });
        }
    })
}

function handleRedstoneSelection(selection, player, sourceEntity, redstoneType, size) {
    if (selection >= 0 && selection < redstoneType.length) {
        const particleCommand = `particle ots_simred:str_build_floor_${size} ^${(size / 2) - 0.5} ^ ^-${(size / 2) - 0.5}`;
        const redstoneEvent = `event entity @s ${redstoneType[selection].redstone}`;
        sourceEntity.runCommand(particleCommand);
        sourceEntity.runCommand(redstoneEvent);
        system.runTimeout(() => { showRedstoneForm(player, sourceEntity); }, 1);

    } else if (selection === redstoneType.length) {
        sourceEntity.runCommand(backSound);
        showMenuForm(player, sourceEntity);
    }
}