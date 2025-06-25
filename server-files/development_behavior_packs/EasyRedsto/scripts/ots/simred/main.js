import { world, system, BlockPermutation, ItemStack, GameMode, StructureSaveMode, LocationInUnloadedChunkError } from "@minecraft/server";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import { ots_simred_redstoneMaterial } from "./material";
import { redstoneFixList } from "./rail";
import * as menu_form from "./menu_form"
import { ots_simred_guidebook, ots_simred_player } from "./guidebook"
//import * as dev from "./dev"

function ots_simred_structure() {
    system.afterEvents.scriptEventReceive.subscribe((event) => {
        const { id, message, sourceEntity } = event;

        const playerOptions = {
            type: "minecraft:player",
            location: sourceEntity.location,
            maxDistance: 6,
            closest: 1
        }

        for (const player of sourceEntity.dimension.getEntities(playerOptions)) {
            /////////////////////////////////////////////////////////////////////////////
            /////////////////////////////////////////////////////////////////////////////
            const playerDev = player.hasTag("overtalesDev")
            /////////////////////////////////////////////////////////////////////////////
            const selectSound = `playsound trial_spawner.open_shutter @a ^ ^ ^ 1 ${Math.random() * (0, 0.25) + 1.75}`
            const backSound = `playsound ominous_item_spawner.spawn_item @a ^ ^ ^ 0.5 ${Math.random() * (0, 0.25) + 1}`
            /////////////////////////////////////////////////////////////////////////////
            function showMainForm() {
                const entities = getNearbyEntities(sourceEntity, 0.25);

                entities.forEach(entity => {
                    const familyType = entity.getComponent("minecraft:type_family")
                    if (familyType && familyType.hasTypeFamily("ots_simred:redstone")) {
                        const redstoneType = ots_simred_redstoneMaterial.get(entity.typeId);

                        //setDynamicProperty to lock
                        entity.setDynamicProperty("ots_simred:structure.lock", true)
                        sourceEntity.setDynamicProperty("ots_simred:structure.lock", true)
                        //

                        if (!redstoneType) return;

                        const rawtext = `${entity.typeId}.info`

                        const form = new ActionFormData()
                            .title({ translate: 'entity.ots_simred:structure.name' })
                            .body({ translate: rawtext, with: ['\n'] })
                            .button({ translate: 'ots_simred:form.build.title' }, "textures/ots/simred/icon/icon_build")
                            .button({ translate: 'ots_simred:form.rotate.title' }, "textures/ots/simred/icon/icon_rotate")
                            .button({ translate: 'ots_simred:form.setting.title' }, "textures/ots/simred/icon/icon_setting")
                            .button({ translate: 'ots_simred:form.remove.redstone.title' }, "textures/ots/simred/icon/icon_remove")

                        form.show(player).then(r => {
                            if (r.canceled) {
                                sourceEntity.setProperty("ots_simred:structure.ui", false)
                                return;
                            }
                            switch (r.selection) {
                                case 0:
                                    sourceEntity.runCommand(selectSound)
                                    showBuildForm();
                                    break;
                                case 1:
                                    sourceEntity.runCommand(`playsound trial_spawner.close_shutter @a ~ ~ ~ 1 ${Math.random() * (0, 0.25) + 0.7}`)
                                    handleRotate();
                                    break;
                                case 2:
                                    sourceEntity.runCommand(selectSound)
                                    showSettingForm();
                                    break;
                                case 3:
                                    sourceEntity.runCommand(selectSound)
                                    showRemoveRedstoneForm();
                                    break;
                            }
                        });
                    }
                })
            }
            /////////////////////////////////////////////////////////////////////////////
            function showRedstoneMainForm() {
                const entities = getNearbyEntities(sourceEntity, 0.25);

                entities.forEach(entity => {
                    const familyType = entity.getComponent("minecraft:type_family")
                    if (familyType && familyType.hasTypeFamily("ots_simred:redstone")) {
                        const redstoneType = ots_simred_redstoneMaterial.get(entity.typeId);

                        if (!redstoneType) return;

                        const rawtext = `${entity.typeId}.info`

                        const form = new ActionFormData()
                            .title({ translate: 'entity.ots_simred:structure.name' })
                            .body({ translate: rawtext, with: ['\n'] })
                            .button({ translate: 'ots_simred:form.reset.title' }, "textures/ots/simred/icon/icon_reset")
                            .button({ translate: 'ots_simred:form.theme.title' }, "textures/ots/simred/icon/icon_theme")
                            .button({ translate: 'ots_simred:form.setting.title' }, "textures/ots/simred/icon/icon_setting")
                            .button({ translate: 'ots_simred:form.remove.title' }, "textures/ots/simred/icon/icon_remove_menu")

                        form.show(player).then(r => {
                            if (r.canceled) {
                                sourceEntity.setProperty("ots_simred:structure.ui", false)
                                return;
                            }
                            switch (r.selection) {
                                case 0:
                                    sourceEntity.runCommand(selectSound)
                                    showResetForm();
                                    break;
                                case 1:
                                    sourceEntity.runCommand(selectSound)
                                    showThemeSelectForm(entity);
                                    break;
                                case 2:
                                    sourceEntity.runCommand(selectSound)
                                    showSettingForm();
                                    break;
                                case 3:
                                    sourceEntity.runCommand(selectSound)
                                    showRemoveForm();
                                    break;
                            }
                        });
                    }
                })
            }
            /////////////////////////////////////////////////////////////////////////////
            /////////////////////////////////////////////////////////////////////////////
            /////////////////////////////////////////////////////////////////////////////
            function showBuildForm() {
                const entities = getNearbyEntities(sourceEntity, 0.25);

                entities.forEach(entity => {
                    const familyType = entity.getComponent("minecraft:type_family")
                    if (familyType && familyType.hasTypeFamily("ots_simred:redstone")) {
                        const redstoneType = ots_simred_redstoneMaterial.get(entity.typeId);

                        if (!redstoneType) return;

                        let bodyText = "";

                        redstoneType.material.forEach((entry) => {
                            const propertyValue = entity.getProperty(entry.property) || 0;
                            const itemId = capitalizeWords(entry.itemId.split(':')[1]);
                            const max = entry.max;
                            const color = propertyValue < max ? '§c' : '§a';

                            bodyText += `- ${color}${propertyValue} §f/ §r${max}    ${itemId}§r\n`;
                        });

                        const form = new MessageFormData()
                            .title({ translate: 'ots_simred:form.build.title' })
                            .body({ rawtext: [{ translate: `%%s%%s%%s`, with: { rawtext: [{ translate: "ots_simred:redstone.reqmat", with: ["\n"] }, { text: bodyText }, { translate: redstoneType.req, with: ["\n"] }] } }] })
                            .button1({ translate: 'ots_simred:form.build.back' })
                            .button2({ translate: 'ots_simred:form.build.accept' });

                        form.show(player).then(r => {
                            if (r.canceled) {
                                sourceEntity.setProperty("ots_simred:structure.ui", false)
                                return;
                            }
                            switch (r.selection) {
                                case 0:
                                    sourceEntity.runCommand(backSound)
                                    showMainForm();
                                    break;
                                case 1:
                                    handleBuild();
                                    break;
                            }
                        });
                    }
                })
            }
            /////////////////////////////////////////////////////////////////////////////
            function showResetForm() {
                const form = new MessageFormData()
                    .title({ translate: 'ots_simred:form.reset.title' })
                    .body({ translate: 'ots_simred:form.reset.body', with: ['\n'] })
                    .button1({ translate: 'ots_simred:form.reset.back' })
                    .button2({ translate: 'ots_simred:form.reset.accept' });

                form.show(player).then(r => {
                    if (r.canceled) {
                        sourceEntity.setProperty("ots_simred:structure.ui", false)
                        return;
                    }
                    switch (r.selection) {
                        case 0:
                            sourceEntity.runCommand(backSound)
                            showRedstoneMainForm();
                            break;
                        case 1:
                            sourceEntity.dimension.spawnParticle("ots_simred:str_icon_reset", sourceEntity.location)
                            loadStructure();
                            break;
                    }
                });
            }
            /////////////////////////////////////////////////////////////////////////////
            function showSettingForm() {
                const entities = getNearbyEntities(sourceEntity, 0.25);
                entities.forEach(entity => {
                    const familyType = entity.getComponent("minecraft:type_family")
                    if (familyType && familyType.hasTypeFamily("ots_simred:redstone")) {
                        const propertyRedstoneDisplay = entity.getProperty("ots_simred:structure.display")
                        const propertyGolem = entity.getProperty("ots_simred:structure.golem")
                        const propertyMaterialDisplay = entity.getProperty("ots_simred:structure.material.display")
                        const propertyBorderDisplay = entity.getProperty("ots_simred:structure.border")
                        const propertyBorderXray = entity.getProperty("ots_simred:structure.border.xray")

                        const propertyLoad = sourceEntity.getProperty("ots_simred:structure.load")

                        const form = new ModalFormData()
                            .title({ translate: 'ots_simred:form.setting.title' })
                            .toggle({ translate: 'ots_simred:form.setting.redstone.display' }, propertyRedstoneDisplay)

                        if (!propertyLoad) {
                            form.toggle({ translate: 'ots_simred:form.setting.golem.display' }, propertyGolem)
                                .toggle({ translate: 'ots_simred:form.setting.material.display' }, propertyMaterialDisplay)
                        }

                        form.toggle({ translate: 'ots_simred:form.setting.border.display' }, propertyBorderDisplay)
                            .toggle({ translate: 'ots_simred:form.setting.border.xray' }, propertyBorderXray)
                            .submitButton({ translate: 'ots_simred:form.setting.apply' })

                        form.show(player).then(r => {
                            if (r.canceled) {
                                sourceEntity.setProperty("ots_simred:structure.ui", false)
                                return;
                            } else {
                                const toggle = r.formValues;
                                if (toggle && toggle.length) {
                                    if (!propertyLoad) {
                                        entity.setProperty("ots_simred:structure.display", toggle[0])
                                        entity.setProperty("ots_simred:structure.golem", toggle[1])
                                        entity.setProperty("ots_simred:structure.material.display", toggle[2])
                                        entity.setProperty("ots_simred:structure.border", toggle[3])
                                        entity.setProperty("ots_simred:structure.border.xray", toggle[4])
                                    } else {
                                        entity.setProperty("ots_simred:structure.display", toggle[0])
                                        entity.setProperty("ots_simred:structure.border", toggle[1])
                                        entity.setProperty("ots_simred:structure.border.xray", toggle[2])
                                    }
                                }
                                if (toggle[0] === false) {
                                    entity.setProperty("ots_simred:structure.golem", false)
                                }

                                const rawtext = { translate: 'ots_simred:text.settings' };
                                player.onScreenDisplay.setActionBar(rawtext)

                                sourceEntity.runCommand(`playsound apply_effect.trial_omen @a ^ ^ ^ 0.75 ${Math.random() * (0, 0.25) + 1.5}`)
                                sourceEntity.dimension.spawnParticle("ots_simred:str_icon_setting", sourceEntity.location)
                                sourceEntity.setProperty("ots_simred:structure.ui", false)
                            }
                        });
                    }
                })
            }
            /////////////////////////////////////////////////////////////////////////////
            function showRemoveForm() {
                const form = new ActionFormData()
                    .title({ translate: 'ots_simred:form.remove.title' })
                    .button({ translate: 'ots_simred:form.remove.redstone.title' }, "textures/ots/simred/icon/icon_remove")
                    .button({ translate: 'ots_simred:form.remove.permanent.title' }, "textures/ots/simred/icon/icon_permanent")
                    .button({ translate: 'ots_simred:form.remove.back' }, "textures/ots/simred/icon/icon_back")

                form.show(player).then(r => {
                    if (r.canceled) {
                        sourceEntity.setProperty("ots_simred:structure.ui", false)
                        return;
                    }
                    switch (r.selection) {
                        case 0:
                            sourceEntity.runCommand(selectSound)
                            showRemoveRedstoneForm();
                            break;
                        case 1:
                            sourceEntity.runCommand(selectSound)
                            showRemovePermanentForm();
                            break;
                        case 2:
                            sourceEntity.runCommand(backSound)
                            showRedstoneMainForm();
                            break;
                    }
                });
            }
            /////////////////////////////////////////////////////////////////////////////
            function showRemoveRedstoneForm() {
                const structureLoad = sourceEntity.getProperty("ots_simred:structure.load")
                const form = new MessageFormData()
                    .title({ translate: 'ots_simred:form.remove.redstone.title' })

                if (!structureLoad) {
                    form.body({ translate: 'ots_simred:form.remove.redstone.body', with: ['\n'] })
                } else {
                    form.body({ translate: 'ots_simred:form.remove.redstone.body2', with: ['\n'] })
                }

                form.button1({ translate: 'ots_simred:form.remove.back' })
                    .button2({ translate: 'ots_simred:form.remove.accept' });

                form.show(player).then(r => {
                    if (r.canceled) {
                        sourceEntity.setProperty("ots_simred:structure.ui", false)
                        return;
                    }
                    switch (r.selection) {
                        case 0:
                            sourceEntity.runCommand(backSound)
                            if (structureLoad) {
                                showRemoveForm();
                            } else {
                                showMainForm();
                            }
                            break;
                        case 1:
                            sourceEntity.runCommand(`playsound block.lantern.break @a ~ ~ ~ 0.75 ${Math.random() * (-0.1, 0.1) + 0.25}`)
                            sourceEntity.runCommand(`playsound block.scaffolding.break @a ~ ~ ~ 1 ${Math.random() * (-0.1, 0.1) + 0.5}`)
                            sourceEntity.runCommand(`playsound beacon.deactivate @a ~ ~ ~ 0.75 ${Math.random() * (0, 0.25) + 2.5}`)
                            sourceEntity.runCommand(selectSound)
                            handleRemoveRedstone();
                            break;
                    }
                });
            }
            /////////////////////////////////////////////////////////////////////////////
            function showRemovePermanentForm() {
                const structureLoad = sourceEntity.getProperty("ots_simred:structure.load")
                const entityId = getEntityId(sourceEntity.id)
                const form = new MessageFormData()
                    .title({ translate: 'ots_simred:form.remove.permanent.title' })
                    .body({ translate: 'ots_simred:form.remove.permanent.body', with: ['\n'] })
                    .button1({ translate: 'ots_simred:form.remove.back' })
                    .button2({ translate: 'ots_simred:form.remove.accept' });

                form.show(player).then(r => {
                    if (r.canceled) {
                        sourceEntity.setProperty("ots_simred:structure.ui", false)
                        return;
                    }
                    switch (r.selection) {
                        case 0:
                            sourceEntity.runCommand(backSound)
                            if (structureLoad) {
                                showRemoveForm();
                            } else {
                                showMainForm();
                            }
                            break;
                        case 1:
                            world.structureManager.delete(`ots_simred:${entityId}`)
                            sourceEntity.runCommand(`playsound block.lantern.break @a ~ ~ ~ 0.75 ${Math.random() * (-0.1, 0.1) + 0.25}`)
                            sourceEntity.runCommand(`playsound block.scaffolding.break @a ~ ~ ~ 1 ${Math.random() * (-0.1, 0.1) + 0.5}`)
                            sourceEntity.runCommand(`playsound random.levelup @a ~ ~ ~ 1 ${Math.random() * (0, 0.25) + 1.25}`)
                            sourceEntity.dimension.spawnParticle("ots_simred:str_icon_build", sourceEntity.location)
                            sourceEntity.runCommand("event entity @e[family=ots_simred,r=0.25] ots_simred:despawn");
                            break;
                    }
                });
            }
            /////////////////////////////////////////////////////////////////////////////
            /////////////////////////////////////////////////////////////////////////////
            /////////////////////////////////////////////////////////////////////////////
            function handleRotate() {
                const rawtext = { translate: 'ots_simred:text.rotate' };
                player.onScreenDisplay.setActionBar(rawtext)

                const entities = getNearbyEntities(sourceEntity, 0.25);
                sourceEntity.dimension.spawnParticle("ots_simred:str_icon_rotate", sourceEntity.location)

                entities.forEach(entity => {
                    const familyType = entity.getComponent("minecraft:type_family")
                    if (familyType && familyType.hasTypeFamily("ots_simred:redstone")) {
                        const direction = entity.getProperty("ots_simred:structure.direction");
                        const rotate = entity.getProperty("ots_simred:structure.rotate");
                        const display = entity.getProperty("ots_simred:structure.display");

                        const directions = ["north", "east", "south", "west"];
                        const newDirection = directions[(directions.indexOf(direction) + 1) % directions.length];


                        if (!display) {
                            entity.setProperty("ots_simred:structure.display", true);
                            system.runTimeout(() => {
                                if (entity.isValid()) entity.setProperty("ots_simred:structure.direction", newDirection);
                                if (entity.isValid()) entity.setProperty("ots_simred:structure.rotate", (rotate + 1) % 4);
                            }, 10)
                            system.runTimeout(() => {
                                if (entity.isValid()) entity.setProperty("ots_simred:structure.display", false);
                            }, 40)
                        } else {
                            entity.setProperty("ots_simred:structure.direction", newDirection);
                            entity.setProperty("ots_simred:structure.rotate", (rotate + 1) % 4);
                        }
                    }
                });
                sourceEntity.setProperty("ots_simred:structure.ui", false)
            }
            /////////////////////////////////////////////////////////////////////////////
            function handleRemoveRedstone() {
                const entities = getNearbyEntities(sourceEntity, 0.25);
                let { width, height } = getStructureArea(entities);

                const direction = sourceEntity.getProperty("ots_simred:structure.direction");
                const loadStructure = sourceEntity.getProperty("ots_simred:structure.load");

                if (loadStructure === true) {
                    const entityId = getEntityId(sourceEntity.id)
                    const directionToOffset = {
                        north: { dx: (width * -1), dy: -1, dz: 0 },
                        south: { dx: 0, dy: -1, dz: (width * -1) },
                        east: { dx: (width * -1), dy: -1, dz: (width * -1) },
                        west: { dx: 0, dy: -1, dz: 0 }
                    };
                    const offset = directionToOffset[direction];

                    //fill air
                    const { removeBlock, removetotalBlock } = removeStructureArea(sourceEntity, direction, width, height, entities);

                    //load floor
                    if (sourceEntity.isValid && world.structureManager.get(`ots_simred:${entityId}`)) {
                        world.structureManager.place(
                            `ots_simred:${entityId}`,
                            sourceEntity.dimension,
                            { x: sourceEntity.location.x + offset.dx, y: sourceEntity.location.y + offset.dy, z: sourceEntity.location.z + offset.dz }
                        )
                        world.structureManager.delete(`ots_simred:${entityId}`)
                    } else {
                        for (let x = 0; x <= width; x++) {
                            for (let y = 0; y <= 0; y++) {
                                for (let z = 0; z <= width; z++) {
                                    const checkX = sourceEntity.location.x + (x * dx);
                                    const checkY = sourceEntity.location.y - 1;
                                    const checkZ = sourceEntity.location.z + (z * dz);
                                    const block = sourceEntity.dimension.getBlock({ x: checkX, y: checkY, z: checkZ });

                                    if (block) {
                                        sourceEntity.runCommand(`fill ${checkX} ${checkY} ${checkZ} ${checkX} ${checkY} ${checkZ} minecraft:air`)
                                    }
                                }
                            }
                        }
                    }

                    if (playerDev) {
                        player.sendMessage(`remove: ${removeBlock} total: ${removetotalBlock}`)
                    }
                }

                entities.forEach(entity => {
                    const familyType = entity.getComponent("minecraft:type_family")
                    if (familyType && familyType.hasTypeFamily("ots_simred:redstone")) {
                        const redstoneMaterial = ots_simred_redstoneMaterial.get(entity.typeId);

                        if (!redstoneMaterial) return;

                        redstoneMaterial.material.forEach(entry => {
                            const property = entity.getProperty(entry.property);
                            const block = sourceEntity.dimension.getBlock({ x: sourceEntity.location.x, y: sourceEntity.location.y, z: sourceEntity.location.z });

                            if (property > 0) {
                                block.setPermutation(BlockPermutation.resolve("minecraft:chest", {
                                    "minecraft:cardinal_direction": `${sourceEntity.getProperty("ots_simred:structure.direction")}`
                                }))

                                const blockInventory = block.getComponent("minecraft:inventory").container;
                                let remainingItem = property;

                                while (remainingItem > 0) {
                                    const itemMaxStack = Math.min(remainingItem, 64)
                                    const itemStack = new ItemStack(entry.itemId, itemMaxStack);
                                    blockInventory.addItem(itemStack);
                                    remainingItem -= itemMaxStack
                                }
                            }
                        })

                        switch (entity.getProperty("ots_simred:structure.width")) {
                            case 10:
                                entity.runCommand("particle ots_simred:str_remove_10 ^4.5 ^ ^-4.5")
                                sourceEntity.runCommand("summon ots_simred:effect_build ~ ~ ~ ~ ~ ots_simred:effect_build.0")
                                break;
                            case 18:
                                entity.runCommand("particle ots_simred:str_remove_18 ^6.5 ^ ^-6.5")
                                sourceEntity.runCommand("summon ots_simred:effect_build ~ ~ ~ ~ ~ ots_simred:effect_build.1")
                                break;
                            case 34:
                                entity.runCommand("particle ots_simred:str_remove_34 ^16.5 ^ ^-16.5")
                                sourceEntity.runCommand("summon ots_simred:effect_build ~ ~ ~ ~ ~ ots_simred:effect_build.2")
                                break;
                        }

                        const effectBuild = getNearbyEntities(entity, 0.25);

                        effectBuild.forEach(effectBuild => {
                            const familyType = effectBuild.getComponent("minecraft:type_family")
                            if (familyType && familyType.hasTypeFamily("ots_simred:effect_build")) {
                                effectBuild.setProperty("ots_simred:effect_build.width", width + 1)
                                effectBuild.setProperty("ots_simred:effect_build.height", height + 1)
                                effectBuild.runCommand("event entity @s ots_simred:effect_remove")
                            }
                        })


                    }
                });
                sourceEntity.dimension.spawnParticle("ots_simred:df_break", sourceEntity.location)
                sourceEntity.dimension.spawnParticle("ots_simred:str_icon_remove", sourceEntity.location)
                system.runTimeout(() => {
                    sourceEntity.runCommand("event entity @e[family=ots_simred,r=0.25] ots_simred:drop");
                }, 1)
            }
            /////////////////////////////////////////////////////////////////////////////
            function removeStructureArea(entity, direction, width, height, entities) {
                const directions = {
                    north: { dx: -1, dy: 1, dz: 1 },
                    south: { dx: 1, dy: 1, dz: -1 },
                    east: { dx: -1, dy: 1, dz: -1 },
                    west: { dx: 1, dy: 1, dz: 1 }
                };
                const { dx, dy, dz } = directions[direction];

                const redstoneRemoveMob = [
                    { redstone: "ots_simred:redstone_4", removeMob: ["minecraft:hopper_minecart"] },
                    { redstone: "ots_simred:redstone_5", removeMob: ["minecraft:chicken"] },
                    { redstone: "ots_simred:redstone_16", removeMob: ["minecraft:bee"] },
                    { redstone: "ots_simred:redstone_17", removeMob: ["minecraft:hopper_minecart"] },
                    { redstone: "ots_simred:redstone_22", removeMob: ["minecraft:hopper_minecart"] },
                    { redstone: "ots_simred:redstone_33", removeMob: ["minecraft:chicken"] },
                    { redstone: "ots_simred:redstone_35", removeMob: ["minecraft:sheep", "minecraft:hopper_minecart"] },
                    { redstone: "ots_simred:redstone_39", removeMob: ["minecraft:cow"] },
                    { redstone: "ots_simred:redstone_40", removeMob: ["minecraft:sheep"] },
                    { redstone: "ots_simred:redstone_41", removeMob: ["minecraft:pig"] },
                    { redstone: "ots_simred:redstone_43", removeMob: ["minecraft:hopper_minecart", "minecraft:chest_minecart"] },
                    { redstone: "ots_simred:redstone_50", removeMob: ["minecraft:hopper_minecart", "minecraft:armadillo"] },

                    { redstone: "ots_simred:redstone_9", removeMob: ["minecraft:allay", "minecraft:silverfish", "minecraft:armor_stand"] },
                    { redstone: "ots_simred:redstone_10", removeMob: ["minecraft:zombie", "minecraft:slime"] },
                    { redstone: "ots_simred:redstone_19", removeMob: ["minecraft:sheep", "minecraft:hopper_minecart"] },
                    { redstone: "ots_simred:redstone_23", removeMob: ["minecraft:armor_stand"] },
                    { redstone: "ots_simred:redstone_27", removeMob: ["minecraft:armor_stand"] },
                    { redstone: "ots_simred:redstone_28", removeMob: ["minecraft:villager", "minecraft:villager_v2"] },
                    { redstone: "ots_simred:redstone_37", removeMob: ["minecraft:hopper_minecart", "minecraft:chest_minecart"] },
                    { redstone: "ots_simred:redstone_38", removeMob: ["minecraft:zombie", "minecraft:skeleton", "minecraft:armor_stand"] },
                    { redstone: "ots_simred:redstone_45", removeMob: ["minecraft:chicken", "minecraft:sheep", "minecraft:cow", "minecraft:pig"] },
                    { redstone: "ots_simred:redstone_47", removeMob: ["minecraft:spider", "minecraft:cave_spider", "minecraft:armor_stand"] },
                    { redstone: "ots_simred:redstone_49", removeMob: ["minecraft:armor_stand"] },

                    { redstone: "ots_simred:redstone_14", removeMob: ["minecraft:chicken"] },
                    { redstone: "ots_simred:redstone_15", removeMob: ["minecraft:zombie", "minecraft:skeleton", "minecraft:creeper", "minecraft:drowned", "minecraft:armor_stand"] },
                    { redstone: "ots_simred:redstone_25", removeMob: ["minecraft:armor_stand"] },
                    { redstone: "ots_simred:redstone_29", removeMob: ["minecraft:zombie_pigman"] },
                ]

                let removeBlock = 0;

                entities.forEach(redstoneType => {
                    const familyType = redstoneType.getComponent("minecraft:type_family")
                    if (familyType && familyType.hasTypeFamily("ots_simred:redstone")) {
                        const redstoneTypeId = redstoneType.typeId

                        for (let x = 0; x <= width; x++) {
                            for (let y = 0; y <= height; y++) {
                                for (let z = 0; z <= width; z++) {
                                    const checkX = entity.location.x + (x * dx);
                                    const checkY = entity.location.y + (y * dy);
                                    const checkZ = entity.location.z + (z * dz);
                                    const block = entity.dimension.getBlock({ x: checkX, y: checkY, z: checkZ });

                                    const getEntities = entity.dimension.getEntities({ location: { x: checkX, y: checkY, z: checkZ }, maxDistance: 1.25 })

                                    if (block && !block.isAir) {
                                        removeBlock++
                                        block.setType("minecraft:glass")
                                        block.setType("minecraft:air")
                                    }

                                    getEntities.forEach(getEntity => {
                                        const familyType = getEntity.getComponent("minecraft:type_family")
                                        if (familyType && familyType.hasTypeFamily("ots_simred")) return

                                        if (getEntity.typeId === "minecraft:item") {
                                            getEntity.remove();
                                        }
                                        redstoneRemoveMob.forEach(({ redstone, removeMob }) => {
                                            if (redstoneTypeId !== redstone) return
                                            if (redstoneTypeId === redstone && removeMob.includes(getEntity.typeId)) {
                                                getEntity.remove();
                                            }
                                        });
                                    })
                                }
                            }
                        }
                    }
                })

                const removetotalBlock = ((width + 1) * (width + 1)) * (height + 1);
                return { removeBlock, removetotalBlock }
            }
            /////////////////////////////////////////////////////////////////////////////
            function handleBuild() {
                const playerAirPass = player.getDynamicProperty("ots_simred:air_pass")
                const entities = getNearbyEntities(sourceEntity, 0.25);
                let { width, height } = getStructureArea(entities);

                const direction = sourceEntity.getProperty("ots_simred:structure.direction");

                if (!playerAirPass) {
                    const { emptyBlock, totalBlock } = checkStructureArea(sourceEntity, direction, width, height);

                    if (playerDev) {
                        player.sendMessage(`§8All Block: ${totalBlock} | §7Empty Block:§a ${emptyBlock}`);
                    }

                    if (emptyBlock === totalBlock) {
                        if (player.matches({ gameMode: GameMode.survival })) {
                            checkInventoryPlayer(player, entities);
                        } else {
                            sourceEntity.dimension.spawnParticle("ots_simred:str_icon_build", sourceEntity.location)
                            loadStructure()
                        }
                    } else {
                        const rawtext = { translate: 'ots_simred:text.clear_area', with: [`${totalBlock - emptyBlock}`, `\n`, `${totalBlock}`] };
                        player.onScreenDisplay.setActionBar(rawtext)
                        system.runTimeout(() => { player.onScreenDisplay.setActionBar(rawtext) }, 20)
                        system.runTimeout(() => { player.onScreenDisplay.setActionBar(rawtext) }, 40)

                        if (playerDev) {
                            player.sendMessage(`§c[!] Need Clear: ${totalBlock - emptyBlock}`);
                        }

                        sourceEntity.runCommand(`playsound block.false_permissions @a ~ ~ ~ 1 ${Math.random() * (0, 0.25) + 0.6}`)
                        sourceEntity.runCommand(`playsound apply_effect.trial_omen @a ~ ~ ~ 0.5 ${Math.random() * (0, 0.25) + 1.25}`)
                        sourceEntity.setProperty("ots_simred:structure.ui", false)
                        sourceEntity.runCommand('event entity @e[family=ots_simred:redstone,r=0.25,c=1] ots_simred:structure.border.red.true');

                        entities.forEach(entity => {
                            const familyType = entity.getComponent("minecraft:type_family")
                            if (familyType && familyType.hasTypeFamily("ots_simred:redstone")) {
                                const properties = [
                                    { name: "ots_simred:structure.display", defaultValue: false, revertValue: true },
                                    { name: "ots_simred:structure.golem", defaultValue: false, revertValue: true },
                                    { name: "ots_simred:structure.border", defaultValue: true, revertValue: false },
                                    { name: "ots_simred:structure.border.xray", defaultValue: true, revertValue: false }
                                ];

                                properties.forEach(property => {
                                    const currentValue = entity.getProperty(property.name);

                                    if (currentValue !== property.defaultValue) {
                                        entity.setProperty(property.name, property.defaultValue);
                                        system.runTimeout(() => {
                                            if (entity.isValid()) entity.setProperty(property.name, property.revertValue);
                                        }, 60);
                                    }
                                });
                            }
                        })
                    }
                } else {
                    if (player.matches({ gameMode: GameMode.survival })) {
                        checkInventoryPlayer(player, entities);
                    } else {
                        sourceEntity.dimension.spawnParticle("ots_simred:str_icon_build", sourceEntity.location)
                        loadStructure()
                    }
                }
            }
            /////////////////////////////////////////////////////////////////////////////
            function getStructureArea(entities) {
                let width = 0;
                let height = 0;

                entities.forEach(entity => {
                    const familyType = entity.getComponent("minecraft:type_family")
                    if (familyType && familyType.hasTypeFamily("ots_simred:redstone")) {
                        width = parseInt(entity.getProperty("ots_simred:structure.width")) - 1;
                        height = parseInt(entity.getProperty("ots_simred:structure.height")) - 1;

                        if (playerDev) {
                            player.sendMessage(`§7Width:§6 ${width + 1} | §7Height:§6 ${height + 1}`);
                        }
                    }
                });

                return { width, height };
            }
            /////////////////////////////////////////////////////////////////////////////
            function checkStructureArea(entity, direction, width, height) {
                const directions = {
                    north: { dx: -1, dy: 1, dz: 1 },
                    south: { dx: 1, dy: 1, dz: -1 },
                    east: { dx: -1, dy: 1, dz: -1 },
                    west: { dx: 1, dy: 1, dz: 1 }
                };
                const { dx, dy, dz } = directions[direction];
                const rawtext = { translate: 'ots_simred:text.chunk_unload', with: ["\n"] };

                let emptyBlock = 0;
                let chunkUnload = 0;

                for (let x = 0; x <= width; x++) {
                    for (let y = 0; y <= height; y++) {
                        for (let z = 0; z <= width; z++) {
                            const checkX = entity.location.x + (x * dx);
                            const checkY = entity.location.y + (y * dy);
                            const checkZ = entity.location.z + (z * dz);

                            try {
                                const block = entity.dimension.getBlock({ x: checkX, y: checkY, z: checkZ });
                                if (block?.typeId === "minecraft:air") {
                                    emptyBlock++;
                                } else {
                                    entity.dimension.spawnParticle("ots_simred:str_icon_remove2", { x: checkX, y: checkY, z: checkZ });
                                }
                            } catch (error) {
                                if (error instanceof LocationInUnloadedChunkError) {
                                    chunkUnload++
                                    continue;
                                }
                            }
                        }
                    }
                }

                if (chunkUnload > 0) {
                    player.sendMessage(rawtext)
                }
                const totalBlock = ((width + 1) * (width + 1)) * (height + 1);
                return { emptyBlock, totalBlock };
            }
            /////////////////////////////////////////////////////////////////////////////
            function checkInventoryPlayer(player, entities) {
                const inventory = player.getComponent("inventory").container;

                entities.forEach(entity => {
                    const familyType = entity.getComponent("minecraft:type_family")
                    if (familyType && familyType.hasTypeFamily("ots_simred:redstone")) {
                        const redstoneMaterial = ots_simred_redstoneMaterial.get(entity.typeId);
                        const width = entity.getProperty("ots_simred:structure.width")

                        if (!redstoneMaterial) return;

                        let allMaterialMax = true;
                        let playerAddItem = 0

                        redstoneMaterial.material.forEach((entry, index) => {
                            let maxRemove = entry.max;
                            let property = entity.getProperty(entry.property);
                            let currentRemove = maxRemove - property;

                            if (property >= maxRemove) {
                                if (playerDev) {
                                    player.sendMessage(`§a- ${entry.itemId} max`);
                                }
                                return;
                            }

                            let playerHaveItem = false;

                            for (let i = 0; i < inventory.size && currentRemove > 0; i++) {
                                const item = inventory.getItem(i);

                                const logFamily = [
                                    "minecraft:acacia_log",
                                    "minecraft:birch_log",
                                    "minecraft:cherry_log",
                                    "minecraft:jungle_log",
                                    "minecraft:mangrove_log",
                                    "minecraft:oak_log",
                                    "minecraft:spruce_log",
                                    "minecraft:dark_oak_log"
                                ]

                                if (item && (item.typeId === entry.itemId || (entry.itemId === "minecraft:oak_log" && logFamily.includes(item.typeId)))) {
                                    playerHaveItem = true;
                                    playerAddItem++
                                    let itemRemove = Math.min(item.amount, currentRemove);

                                    if (item.amount > itemRemove) {
                                        item.amount -= itemRemove;
                                        inventory.setItem(i, item);
                                    } else {
                                        inventory.setItem(i, null);
                                    }

                                    currentRemove -= itemRemove;
                                    property += itemRemove;

                                    if (playerDev) {
                                        player.sendMessage(`§a- Removed: §7${item.typeId} ${itemRemove} | [§7${maxRemove - currentRemove}/${maxRemove}]`);
                                    }

                                    if (currentRemove <= 0) {
                                        break;
                                    }
                                }
                            }

                            if (!playerHaveItem) {
                                if (playerDev) {
                                    player.sendMessage(`§c- Need: §7${entry.itemId} §c${maxRemove - currentRemove}/${maxRemove}`);
                                }
                            }

                            entity.setProperty(entry.property, property);

                            if (property < maxRemove) {
                                allMaterialMax = false;
                            }

                        });

                        if (playerAddItem > 0) {
                            if (!allMaterialMax) {
                                const rawtext = { translate: 'ots_simred:text.item_add' };
                                player.onScreenDisplay.setActionBar(rawtext)
                                system.runTimeout(() => { player.onScreenDisplay.setActionBar(rawtext) }, 20)
                                system.runTimeout(() => { player.onScreenDisplay.setActionBar(rawtext) }, 40)
                                sourceEntity.runCommand(`playsound random.levelup @a ~ ~ ~ 0.75 ${Math.random() * (0, 0.25) + 1.25}`)
                                sourceEntity.dimension.spawnParticle("ots_simred:str_icon_additem", sourceEntity.location)
                            }
                            switch (width) {
                                case 10:
                                    entity.runCommand("particle ots_simred:str_build_floor_10 ^4.5 ^ ^-4.5")
                                    break;
                                case 18:
                                    entity.runCommand("particle ots_simred:str_build_floor_18 ^8.5 ^ ^-8.5")
                                    break;
                                case 34:
                                    entity.runCommand("particle ots_simred:str_build_floor_34 ^16.5 ^ ^-16.5")
                                    break;
                            }
                        } else {
                            if (!allMaterialMax) {
                                const rawtext = { translate: 'ots_simred:text.item_fail' };
                                player.onScreenDisplay.setActionBar(rawtext)
                                system.runTimeout(() => { player.onScreenDisplay.setActionBar(rawtext) }, 20)
                                system.runTimeout(() => { player.onScreenDisplay.setActionBar(rawtext) }, 40)
                                sourceEntity.runCommand(`playsound note.bass @a ~ ~ ~ 0.3 ${Math.random() * (0, 0.25) + 1}`)
                                sourceEntity.dimension.spawnParticle("ots_simred:str_icon_remove", sourceEntity.location)
                            }
                            switch (width) {
                                case 10:
                                    entity.runCommand("particle ots_simred:str_build_floor_f_10 ^4.5 ^ ^-4.5")
                                    break;
                                case 18:
                                    entity.runCommand("particle ots_simred:str_build_floor_f_18 ^8.5 ^ ^-8.5")
                                    break;
                                case 34:
                                    entity.runCommand("particle ots_simred:str_build_floor_f_34 ^16.5 ^ ^-16.5")
                                    break;
                            }
                        }

                        sourceEntity.setProperty("ots_simred:structure.ui", false)

                        if (allMaterialMax) {
                            sourceEntity.dimension.spawnParticle("ots_simred:str_icon_build", sourceEntity.location)
                            loadStructure()
                        }
                    }
                });
            }
            /////////////////////////////////////////////////////////////////////////////
            function loadStructure() {
                if (playerDev) {
                    player.sendMessage("Structure Load");
                    player.sendMessage(`sourceEntity id: ${sourceEntity.id}`)
                }

                const loadStructureDone = sourceEntity.getProperty("ots_simred:structure.load")
                const entities = getNearbyEntities(sourceEntity, 0.25);
                let { width, height } = getStructureArea(entities);

                const directionToOffset = {
                    north: { dx: (width * -1), dy: -1, dz: 0 },
                    south: { dx: 0, dy: -1, dz: (width * -1) },
                    east: { dx: (width * -1), dy: -1, dz: (width * -1) },
                    west: { dx: 0, dy: -1, dz: 0 }
                };

                const floorToOffset = {
                    north: { dx: (width * -1), dy: height, dz: width },
                    south: { dx: width, dy: height, dz: (width * -1) },
                    east: { dx: (width * -1), dy: height, dz: (width * -1) },
                    west: { dx: width, dy: height, dz: width }
                };

                const directionToRotate = {
                    north: {
                        0: "Rotate180",
                        1: "Rotate270",
                        2: "None",
                        3: "Rotate90"
                    },
                    west: {
                        0: "Rotate90",
                        1: "Rotate180",
                        2: "Rotate270",
                        3: "None"
                    },
                    south: {
                        0: "None",
                        1: "Rotate90",
                        2: "Rotate180",
                        3: "Rotate270"
                    },
                    east: {
                        0: "Rotate270",
                        1: "None",
                        2: "Rotate90",
                        3: "Rotate180"
                    }
                };

                const redstoneCrafterList = [
                    "ots_simred:redstone_11",
                    "ots_simred:redstone_12",
                    "ots_simred:redstone_13",
                    "ots_simred:redstone_14",
                    "ots_simred:redstone_15",
                    "ots_simred:redstone_28",
                    "ots_simred:redstone_29",
                    "ots_simred:redstone_30"
                ]

                const directionToRotateCrafter = {
                    north: {
                        0: "180",
                        1: "270",
                        2: "0",
                        3: "90"
                    },
                    west: {
                        0: "90",
                        1: "180",
                        2: "270",
                        3: "0"
                    },
                    south: {
                        0: "0",
                        1: "90",
                        2: "180",
                        3: "270"
                    },
                    east: {
                        0: "270",
                        1: "0",
                        2: "90",
                        3: "180"
                    }
                };

                entities.forEach(entity => {
                    const familyType = entity.getComponent("minecraft:type_family")
                    if (familyType && familyType.hasTypeFamily("ots_simred:redstone")) {
                        const direction = sourceEntity.getProperty("ots_simred:structure.direction")
                        const rotate = entity.getProperty("ots_simred:structure.rotate");

                        const offset = directionToOffset[direction];
                        const floorOffset = floorToOffset[direction];

                        const rotateToDegrees = directionToRotate[direction];
                        const degrees = rotateToDegrees[rotate];
                        const degreesCrafter = directionToRotateCrafter[direction][rotate];

                        const directions = {
                            north: { dx: -1, dy: 1, dz: 1 },
                            south: { dx: 1, dy: 1, dz: -1 },
                            east: { dx: -1, dy: 1, dz: -1 },
                            west: { dx: 1, dy: 1, dz: 1 }
                        };

                        const { dx, dy, dz } = directions[direction];

                        sourceEntity.runCommand("tag @e[family=ots_simred,r=0.25] add ots_simred_load")

                        if (!loadStructureDone) {
                            getXYZEntitiesPosition(entity, width, height, dx, dy, dz, getEntity => {
                                const familyType = getEntity.getComponent("minecraft:type_family")
                                if (familyType && familyType.hasTypeFamily("ots_simred") && getEntity.getDynamicProperty("ots_simred:structure.lock") !== true && !getEntity.hasTag("ots_simred_load")) {
                                    getEntity.runCommand("event entity @s ots_simred:drop")
                                }
                                if (familyType && !familyType.hasTypeFamily("ots_simred")) {
                                    getEntity.teleport({ x: entity.location.x, y: entity.location.y, z: entity.location.z })
                                }
                            })

                            system.runTimeout(() => {
                                getXYZEntitiesPosition(entity, width, height, dx, dy, dz, getEntity => {
                                    if (getEntity.typeId === "minecraft:item") {
                                        getEntity.teleport({ x: entity.location.x, y: entity.location.y, z: entity.location.z })
                                    }
                                })
                            }, 1)
                        }

                        sourceEntity.runCommand("tag @e[family=ots_simred,r=0.25] remove ots_simred_load")

                        switch (entity.getProperty("ots_simred:structure.width")) {
                            case 10:
                                sourceEntity.runCommand(`particle ots_simred:str_build_10 ${sourceEntity.location.x + ((width + 1) / 2) * dx} ${sourceEntity.location.y} ${sourceEntity.location.z + ((width + 1) / 2) * dz}`)
                                sourceEntity.runCommand("summon ots_simred:effect_build ~ ~ ~ ~ ~ ots_simred:effect_build.0")
                                break;
                            case 18:
                                sourceEntity.runCommand(`particle ots_simred:str_build_18 ${sourceEntity.location.x + ((width + 1) / 2) * dx} ${sourceEntity.location.y} ${sourceEntity.location.z + ((width + 1) / 2) * dz}`)
                                sourceEntity.runCommand("summon ots_simred:effect_build ~ ~ ~ ~ ~ ots_simred:effect_build.1")
                                break;
                            case 34:
                                sourceEntity.runCommand(`particle ots_simred:str_build_34 ${sourceEntity.location.x + ((width + 1) / 2) * dx} ${sourceEntity.location.y} ${sourceEntity.location.z + ((width + 1) / 2) * dz}`)
                                sourceEntity.runCommand("summon ots_simred:effect_build ~ ~ ~ ~ ~ ots_simred:effect_build.2")
                                break;
                        }

                        const effectBuild = getNearbyEntities(entity, 0.25);

                        effectBuild.forEach(effectBuild => {
                            const familyType = effectBuild.getComponent("minecraft:type_family")
                            if (familyType && familyType.hasTypeFamily("ots_simred:effect_build")) {
                                effectBuild.setProperty("ots_simred:effect_build.width", width + 1)
                                effectBuild.setProperty("ots_simred:effect_build.height", height + 1)
                            }
                        })

                        if (loadStructureDone) {
                            //load redstone
                            world.structureManager.place(
                                `${entity.typeId}`,
                                entity.dimension,
                                { x: sourceEntity.location.x + offset.dx, y: sourceEntity.location.y + offset.dy, z: sourceEntity.location.z + offset.dz },
                                { rotation: degrees, includeEntities: false }
                            )
                            //load crafter
                            if (redstoneCrafterList.includes(entity.typeId)) {
                                world.structureManager.place(
                                    `${entity.typeId}_${degreesCrafter}`,
                                    entity.dimension,
                                    { x: sourceEntity.location.x + offset.dx, y: sourceEntity.location.y, z: sourceEntity.location.z + offset.dz },
                                    { includeEntities: false }
                                )
                            }

                        } else {
                            //save floor
                            const entityId = getEntityId(sourceEntity.id)
                            world.structureManager.createFromWorld(
                                `ots_simred:${entityId}`,
                                sourceEntity.dimension,
                                { x: sourceEntity.location.x, y: sourceEntity.location.y - 1, z: sourceEntity.location.z },
                                { x: sourceEntity.location.x + floorOffset.dx, y: sourceEntity.location.y + floorOffset.dy, z: sourceEntity.location.z + floorOffset.dz },
                                { saveMode: StructureSaveMode.World, includeEntities: false }
                            )
                            //load redstone
                            world.structureManager.place(
                                `${entity.typeId}`,
                                entity.dimension,
                                { x: sourceEntity.location.x + offset.dx, y: sourceEntity.location.y + offset.dy, z: sourceEntity.location.z + offset.dz },
                                { rotation: degrees, includeEntities: true }
                            )
                            //load crafter
                            if (redstoneCrafterList.includes(entity.typeId)) {
                                world.structureManager.place(
                                    `${entity.typeId}_${degreesCrafter}`,
                                    entity.dimension,
                                    { x: sourceEntity.location.x + offset.dx, y: sourceEntity.location.y, z: sourceEntity.location.z + offset.dz },
                                    { includeEntities: false }
                                )
                            }

                            const rawtext = { translate: 'ots_simred:text.build' };
                            player.onScreenDisplay.setActionBar(rawtext)
                            system.runTimeout(() => { player.onScreenDisplay.setActionBar(rawtext) }, 20)
                            system.runTimeout(() => { player.onScreenDisplay.setActionBar(rawtext) }, 40)
                        }

                        // fix rail
                        const redstoneDirection = entity.getProperty("ots_simred:structure.direction")
                        fixRail(entity, redstoneDirection, rotate, direction)
                        ///////////

                        sourceEntity.runCommand(`playsound random.levelup @a ~ ~ ~ 0.5 ${Math.random() * (0, 0.25) + 0.75}`)
                        sourceEntity.runCommand(`playsound beacon.power @a ~ ~ ~ 0.5 ${Math.random() * (0, 0.25) + 1}`)
                        sourceEntity.runCommand(`playsound beacon.power @a ~ ~ ~ 0.25 ${Math.random() * (0, 0.25) + 3}`)
                        sourceEntity.runCommand(`playsound ominous_item_spawner.spawn_item_begin @a ^ ^ ^ 1 ${Math.random() * (0, 0.25) + 1.25}`)
                        sourceEntity.runCommand(`playsound trial_spawner.close_shutter @a ~ ~ ~ 1 ${Math.random() * (0, 0.25) + 0.75}`)
                        system.runTimeout(() => { sourceEntity.runCommand(`playsound block.cartography_table.use @a ~ ~ ~ 1 1`) }, 20)

                        entity.setProperty("ots_simred:structure.border", false)
                        entity.setProperty("ots_simred:structure.display", false)
                        entity.setProperty("ots_simred:structure.material.display", false)
                        entity.setProperty("ots_simred:structure.golem", false)
                        entity.setProperty("ots_simred:structure.theme", 1)
                        sourceEntity.setProperty("ots_simred:structure.load", true)
                        sourceEntity.setProperty("ots_simred:structure.ui", false)

                        const redstoneReedsType = [
                            "ots_simred:redstone_1",
                            "ots_simred:redstone_6",
                            "ots_simred:redstone_17"
                        ]
                        const redstoneCropsType = [
                            "ots_simred:redstone_3",
                            "ots_simred:redstone_8"
                        ]
                        const redstoneFruitsType = [
                            "ots_simred:redstone_2",
                            "ots_simred:redstone_7"
                        ]

                        const redstoneAutoSortType = [
                            "ots_simred:redstone_44",
                            "ots_simred:redstone_48"
                        ]

                        if (redstoneReedsType.includes(entity.typeId)) {
                            sourceEntity.setProperty("ots_simred:structure.ui", true)
                            showReedsSelectForm(entity, width, height, dx, dy, dz);
                        }

                        if (redstoneCropsType.includes(entity.typeId)) {
                            sourceEntity.setProperty("ots_simred:structure.ui", true)
                            showCropsSelectForm(entity, width, height, dx, dy, dz);
                        }

                        if (redstoneFruitsType.includes(entity.typeId)) {
                            sourceEntity.setProperty("ots_simred:structure.ui", true)
                            showFruitsSelectForm(entity, width, height, dx, dy, dz);
                        }

                        if (redstoneAutoSortType.includes(entity.typeId)) {
                            sourceEntity.setProperty("ots_simred:structure.ui", true)
                            showAutoSortSelectForm(entity, degrees, offset);
                        }
                    }
                });
            }
            /////////////////////////////////////////////////////////////////////////////
            function showReedsSelectForm(entity, width, height, dx, dy, dz) {
                const form = new ActionFormData()
                    .title({ translate: 'ots_simred:form.reeds.title' })
                    .body({ translate: 'ots_simred:form.reeds.body', with: ['\n'] })
                    .button({ translate: 'ots_simred:form.reeds.1' }, "textures/items/reeds")
                    .button({ translate: 'ots_simred:form.reeds.2' }, "textures/items/bamboo")

                form.show(player).then(r => {
                    switch (r.selection) {
                        case 0:
                            entity.addTag("ots_simred:reeds")
                            handleSelectFarm(entity, width, height, dx, dy, dz);
                            break;
                        case 1:
                            entity.addTag("ots_simred:bamboo")
                            handleSelectFarm(entity, width, height, dx, dy, dz);
                            break;
                        default:
                            entity.addTag("ots_simred:reeds")
                            handleSelectFarm(entity, width, height, dx, dy, dz);
                    }
                });
            }
            /////////////////////////////////////////////////////////////////////////////
            function showCropsSelectForm(entity, width, height, dx, dy, dz) {
                const form = new ActionFormData()
                    .title({ translate: 'ots_simred:form.crops.title' })
                    .body({ translate: 'ots_simred:form.crops.body', with: ['\n'] })
                    .button({ translate: 'ots_simred:form.crops.1' }, "textures/items/wheat")
                    .button({ translate: 'ots_simred:form.crops.2' }, "textures/items/potato")
                    .button({ translate: 'ots_simred:form.crops.3' }, "textures/items/carrot")
                    .button({ translate: 'ots_simred:form.crops.4' }, "textures/items/beetroot")

                form.show(player).then(r => {
                    switch (r.selection) {
                        case 0:
                            entity.addTag("ots_simred:wheat")
                            handleSelectFarm(entity, width, height, dx, dy, dz);
                            break;
                        case 1:
                            entity.addTag("ots_simred:potato")
                            handleSelectFarm(entity, width, height, dx, dy, dz);
                            break;
                        case 2:
                            entity.addTag("ots_simred:carrot")
                            handleSelectFarm(entity, width, height, dx, dy, dz);
                            break;
                        case 3:
                            entity.addTag("ots_simred:beetroot")
                            handleSelectFarm(entity, width, height, dx, dy, dz);
                            break;
                        default:
                            entity.addTag("ots_simred:wheat")
                            handleSelectFarm(entity, width, height, dx, dy, dz);
                    }
                });
            }
            /////////////////////////////////////////////////////////////////////////////
            function showFruitsSelectForm(entity, width, height, dx, dy, dz) {
                const form = new ActionFormData()
                    .title({ translate: 'ots_simred:form.fruits.title' })
                    .body({ translate: 'ots_simred:form.fruits.body', with: ['\n'] })
                    .button({ translate: 'ots_simred:form.fruits.1' }, "textures/items/melon")
                    .button({ translate: 'ots_simred:form.fruits.2' }, "textures/blocks/pumpkin_side")

                form.show(player).then(r => {
                    switch (r.selection) {
                        case 0:
                            entity.addTag("ots_simred:melon")
                            handleSelectFarm(entity, width, height, dx, dy, dz);
                            break;
                        case 1:
                            entity.addTag("ots_simred:pumpkin")
                            handleSelectFarm(entity, width, height, dx, dy, dz);
                            break;
                        default:
                            entity.addTag("ots_simred:melon")
                            handleSelectFarm(entity, width, height, dx, dy, dz);
                    }
                });
            }
            /////////////////////////////////////////////////////////////////////////////
            function showAutoSortSelectForm(entity, degrees, offset) {
                const form = new ActionFormData()
                    .title({ translate: 'ots_simred:form.sort.title' })
                    .body({ translate: 'ots_simred:form.sort.body', with: ['\n'] })
                    .button({ translate: 'ots_simred:form.sort.1' }, "textures/ots/simred/icon/stone")
                    .button({ translate: 'ots_simred:form.sort.2' }, "textures/items/diamond")
                    .button({ translate: 'ots_simred:form.sort.3' }, "textures/items/wheat")
                    .button({ translate: 'ots_simred:form.sort.4' }, "textures/items/beef_cooked")

                form.show(player).then(r => {
                    switch (r.selection) {
                        case 0:
                            entity.addTag("ots_simred:block")
                            handleSelectAutoSort(entity, degrees, offset);
                            break;
                        case 1:
                            entity.addTag("ots_simred:ore")
                            handleSelectAutoSort(entity, degrees, offset);
                            break;
                        case 2:
                            entity.addTag("ots_simred:farm")
                            handleSelectAutoSort(entity, degrees, offset);
                            break;
                        case 3:
                            entity.addTag("ots_simred:food")
                            handleSelectAutoSort(entity, degrees, offset);
                            break;
                        default:
                            entity.addTag("ots_simred:block")
                            handleSelectAutoSort(entity, degrees, offset);
                    }
                });
            }
            /////////////////////////////////////////////////////////////////////////////
            function handleSelectFarm(entity, width, height, dx, dy, dz) {
                for (let x = 0; x <= width; x++) {
                    for (let y = 0; y <= height; y++) {
                        for (let z = 0; z <= width; z++) {
                            const checkX = entity.location.x + (x * dx);
                            const checkY = entity.location.y + (y * dy);
                            const checkZ = entity.location.z + (z * dz);
                            const block = entity.dimension.getBlock({ x: checkX, y: checkY, z: checkZ });

                            //entity.dimension.spawnParticle("minecraft:heart_particle", { x: checkX, y: checkY, z: checkZ });

                            if (block?.typeId === "minecraft:trip_wire") {
                                if (entity.hasTag("ots_simred:reeds")) {
                                    block.setPermutation(BlockPermutation.resolve("minecraft:reeds"));
                                } else if (entity.hasTag("ots_simred:bamboo")) {
                                    block.setPermutation(BlockPermutation.resolve("minecraft:bamboo"));
                                } else if (entity.hasTag("ots_simred:wheat")) {
                                    block.setPermutation(BlockPermutation.resolve("minecraft:wheat"));
                                } else if (entity.hasTag("ots_simred:potato")) {
                                    block.setPermutation(BlockPermutation.resolve("minecraft:potatoes"));
                                } else if (entity.hasTag("ots_simred:carrot")) {
                                    block.setPermutation(BlockPermutation.resolve("minecraft:carrots"));
                                } else if (entity.hasTag("ots_simred:beetroot")) {
                                    block.setPermutation(BlockPermutation.resolve("minecraft:beetroot"));
                                } else if (entity.hasTag("ots_simred:melon")) {
                                    block.setPermutation(BlockPermutation.resolve("minecraft:melon_stem", { "growth": 7 }));
                                } else if (entity.hasTag("ots_simred:pumpkin")) {
                                    block.setPermutation(BlockPermutation.resolve("minecraft:pumpkin_stem", { "growth": 7 }));
                                }
                            }
                        }
                    }
                }
                const removeTag = [
                    "ots_simred:reeds", "ots_simred:bamboo", "ots_simred:wheat", "ots_simred:potato",
                    "ots_simred:carrot", "ots_simred:beetroot", "ots_simred:melon", "ots_simred:pumpkin"
                ];

                removeTag.forEach(tag => entity.removeTag(tag));
                sourceEntity.setProperty("ots_simred:structure.ui", false)
            }
            /////////////////////////////////////////////////////////////////////////////
            function handleSelectAutoSort(entity, degrees, offset) {
                let sortType = ""
                if (entity.hasTag("ots_simred:block")) {
                    sortType = "_0"
                } else if (entity.hasTag("ots_simred:ore")) {
                    sortType = "_1"
                } else if (entity.hasTag("ots_simred:farm")) {
                    sortType = "_2"
                } else if (entity.hasTag("ots_simred:food")) {
                    sortType = "_3"
                }

                world.structureManager.place(
                    `${entity.typeId}${sortType}`,
                    entity.dimension,
                    { x: sourceEntity.location.x + offset.dx, y: sourceEntity.location.y + offset.dy, z: sourceEntity.location.z + offset.dz },
                    { rotation: degrees, includeEntities: false }
                )

                const removeTag = ["ots_simred:block", "ots_simred:ore", "ots_simred:farm", "ots_simred:food"]
                removeTag.forEach(tag => entity.removeTag(tag))

                sourceEntity.setProperty("ots_simred:structure.ui", false)
            }
            /////////////////////////////////////////////////////////////////////////////
            function showThemeSelectForm() {
                const form = new ActionFormData()
                    .title({ translate: 'ots_simred:form.theme.title' })
                    .body({ translate: 'ots_simred:form.theme.body', with: ['\n'] })
                    .button({ translate: 'ots_simred:form.theme.1' }, "textures/blocks/concrete_white")
                    .button({ translate: 'ots_simred:form.theme.2' }, "textures/blocks/concrete_black")
                    .button({ translate: 'ots_simred:form.theme.3' }, "textures/blocks/concrete_red")
                    .button({ translate: 'ots_simred:form.theme.4' }, "textures/blocks/concrete_orange")
                    .button({ translate: 'ots_simred:form.theme.5' }, "textures/blocks/concrete_yellow")
                    .button({ translate: 'ots_simred:form.theme.6' }, "textures/blocks/concrete_lime")
                    .button({ translate: 'ots_simred:form.theme.7' }, "textures/blocks/concrete_cyan")
                    .button({ translate: 'ots_simred:form.theme.8' }, "textures/blocks/concrete_blue")
                    .button({ translate: 'ots_simred:form.theme.9' }, "textures/blocks/concrete_magenta")
                    .button({ translate: 'ots_simred:form.menu.back' }, "textures/ots/simred/icon/icon_back")

                form.show(player).then(r => {
                    if (r.canceled) {
                        sourceEntity.setProperty("ots_simred:structure.ui", false)
                        return;
                    }

                    if (r.selection >= 0 && r.selection <= 8) {
                        sourceEntity.runCommand(selectSound);
                        handleTheme(r.selection + 1);
                    } else if (r.selection === 9) {
                        sourceEntity.runCommand(backSound);
                        showRedstoneMainForm();
                    }
                });
            }
            /////////////////////////////////////////////////////////////////////////////
            function handleTheme(selectNewTheme) {
                const rawtext = { translate: 'ots_simred:text.theme' };
                player.onScreenDisplay.setActionBar(rawtext)

                const themeBlock = {
                    1: ["minecraft:quartz_block", "minecraft:white_concrete", "minecraft:gray_stained_glass", "minecraft:white_stained_glass"],//white
                    2: ["minecraft:black_concrete", "minecraft:gray_concrete", "minecraft:black_stained_glass", "minecraft:gray_stained_glass"],//black
                    3: ["minecraft:gray_concrete", "minecraft:red_concrete", "minecraft:black_stained_glass", "minecraft:red_stained_glass"],//red
                    4: ["minecraft:orange_terracotta", "minecraft:orange_concrete", "minecraft:red_stained_glass", "minecraft:orange_stained_glass"],//orange
                    5: ["minecraft:yellow_terracotta", "minecraft:yellow_concrete", "minecraft:orange_stained_glass", "minecraft:yellow_stained_glass"],//yellow
                    6: ["minecraft:lime_terracotta", "minecraft:lime_concrete", "minecraft:green_stained_glass", "minecraft:lime_stained_glass"],//green
                    7: ["minecraft:cyan_concrete", "minecraft:light_blue_concrete", "minecraft:cyan_stained_glass", "minecraft:light_blue_stained_glass"],//cyan
                    8: ["minecraft:blue_terracotta", "minecraft:blue_concrete", "minecraft:light_blue_stained_glass", "minecraft:blue_stained_glass"],// blue
                    9: ["minecraft:magenta_concrete", "minecraft:pink_concrete", "minecraft:magenta_stained_glass", "minecraft:pink_stained_glass"],//purple
                };

                const entities = getNearbyEntities(sourceEntity, 0.25);
                let { width, height } = getStructureArea(entities);

                entities.forEach(entity => {
                    const familyType = entity.getComponent("minecraft:type_family")
                    if (familyType && familyType.hasTypeFamily("ots_simred:redstone")) {
                        const direction = sourceEntity.getProperty("ots_simred:structure.direction")
                        const currentTheme = entity.getProperty("ots_simred:structure.theme")

                        if (currentTheme === selectNewTheme) {
                            sourceEntity.setProperty("ots_simred:structure.ui", false)
                            return;
                        }

                        const directions = {
                            north: { dx: -1, dy: 1, dz: 1 },
                            south: { dx: 1, dy: 1, dz: -1 },
                            east: { dx: -1, dy: 1, dz: -1 },
                            west: { dx: 1, dy: 1, dz: 1 }
                        };

                        const { dx, dy, dz } = directions[direction];

                        for (let x = 0; x <= width; x++) {
                            for (let y = 0; y <= height; y++) {
                                for (let z = 0; z <= width; z++) {
                                    const checkX = entity.location.x + (x * dx);
                                    const checkY = entity.location.y + (y * dy);
                                    const checkZ = entity.location.z + (z * dz);
                                    const block = entity.dimension.getBlock({ x: checkX, y: checkY, z: checkZ });

                                    if (block && !block.isAir && !block.isLiquid) {
                                        const currentBlockType = block.typeId;
                                        const blockIndex = themeBlock[currentTheme].indexOf(currentBlockType);
                                        if (blockIndex !== -1) {
                                            const newBlockType = themeBlock[selectNewTheme][blockIndex];

                                            block.setType(newBlockType);
                                        }
                                    }
                                }
                            }
                        }

                        switch (entity.getProperty("ots_simred:structure.width")) {
                            case 10:
                                entity.runCommand(`particle ots_simred:str_build_10 ${sourceEntity.location.x + ((width + 1) / 2) * dx} ${sourceEntity.location.y} ${sourceEntity.location.z + ((width + 1) / 2) * dz}`)
                                entity.runCommand("summon ots_simred:effect_build ~ ~ ~ ~ ~ ots_simred:effect_build.0")
                                break;
                            case 18:
                                entity.runCommand(`particle ots_simred:str_build_18 ${sourceEntity.location.x + ((width + 1) / 2) * dx} ${sourceEntity.location.y} ${sourceEntity.location.z + ((width + 1) / 2) * dz}`)
                                entity.runCommand("summon ots_simred:effect_build ~ ~ ~ ~ ~ ots_simred:effect_build.1")
                                break;
                            case 34:
                                entity.runCommand(`particle ots_simred:str_build_34 ${sourceEntity.location.x + ((width + 1) / 2) * dx} ${sourceEntity.location.y} ${sourceEntity.location.z + ((width + 1) / 2) * dz}`)
                                entity.runCommand("summon ots_simred:effect_build ~ ~ ~ ~ ~ ots_simred:effect_build.2")
                                break;
                        }

                        const effectBuild = getNearbyEntities(entity, 0.25);

                        effectBuild.forEach(effectBuild => {
                            const familyType = effectBuild.getComponent("minecraft:type_family")
                            if (familyType && familyType.hasTypeFamily("ots_simred:effect_build")) {
                                effectBuild.setProperty("ots_simred:effect_build.width", width + 1)
                                effectBuild.setProperty("ots_simred:effect_build.height", height + 1)
                            }
                        })

                        sourceEntity.runCommand(`playsound random.orb @a ~ ~ ~ 0.5 ${Math.random() * (0, 0.25) + 0.75}`)
                        sourceEntity.runCommand(`playsound beacon.power @a ~ ~ ~ 0.25 ${Math.random() * (0, 0.25) + 3}`)
                        sourceEntity.runCommand(`playsound ominous_item_spawner.spawn_item_begin @a ^ ^ ^ 1 ${Math.random() * (0, 0.25) + 1.25}`)
                        sourceEntity.runCommand(`playsound trial_spawner.close_shutter @a ~ ~ ~ 1 ${Math.random() * (0, 0.25) + 0.75}`)

                        entity.setProperty("ots_simred:structure.theme", selectNewTheme);
                        sourceEntity.dimension.spawnParticle("ots_simred:str_icon_theme", sourceEntity.location)
                        sourceEntity.setProperty("ots_simred:structure.ui", false)
                    }
                })
            }
            /////////////////////////////////////////////////////////////////////////////
            function getNearbyEntities(entity, distance) {
                return entity.dimension.getEntities({ location: entity.location, maxDistance: distance });
            }
            /////////////////////////////////////////////////////////////////////////////
            function capitalizeWords(itemId) {
                return itemId.split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            }
            function getEntityId(entityId) {
                return entityId.replace('-', '');
            }
            /////////////////////////////////////////////////////////////////////////////
            function fixRail(entity, redstoneDirection, rotate, direction) {
                const directions = {
                    north: { dx: -1, dy: 1, dz: 1 },
                    south: { dx: 1, dy: 1, dz: -1 },
                    east: { dx: -1, dy: 1, dz: -1 },
                    west: { dx: 1, dy: 1, dz: 1 }
                };

                const offsetRotate = {
                    north: {
                        0: { ox: 0, oz: 0 },
                        1: { ox: 0, oz: -1 },
                        2: { ox: -1, oz: -1 },
                        3: { ox: -1, oz: 0 }
                    },
                    west: {
                        0: { ox: 0, oz: 0 },
                        1: { ox: -1, oz: 0 },
                        2: { ox: -1, oz: -1 },
                        3: { ox: 0, oz: -1 }
                    },
                    south: {
                        0: { ox: 0, oz: 0 },
                        1: { ox: 0, oz: -1 },
                        2: { ox: -1, oz: -1 },
                        3: { ox: -1, oz: 0 }
                    },
                    east: {
                        0: { ox: 0, oz: 0 },
                        1: { ox: -1, oz: 0 },
                        2: { ox: -1, oz: -1 },
                        3: { ox: 0, oz: -1 }
                    }
                };

                const redstoneEntry = redstoneFixList.find(entry => entry.redstone === entity.typeId);
                if (!redstoneEntry) {
                    return;
                }

                const { dx, dy, dz } = directions[redstoneDirection];
                const { ox, oz } = offsetRotate[direction][rotate];

                redstoneFixList.forEach(({ redstone, offset, blockList }) => {
                    const offsetX = offset * ox
                    const offsetZ = offset * oz
                    if (redstone === entity.typeId) {
                        blockList.forEach(({ block, x, y, z, state }) => {
                            const posX = (x + offsetX) * dx;
                            const posY = y * dy;
                            const posZ = (z + offsetZ) * dz;

                            const invertposX = (z + offsetX) * dx;
                            const invertposZ = (x + offsetZ) * dz;

                            const setState = state[redstoneDirection];

                            const setBlock = entity.dimension.getBlock({
                                x: entity.location.x + (redstoneDirection === "north" || redstoneDirection === "south" ? posX : invertposX),
                                y: entity.location.y + posY,
                                z: entity.location.z + (redstoneDirection === "north" || redstoneDirection === "south" ? posZ : invertposZ)
                            });

                            setBlock.setPermutation(BlockPermutation.resolve(block, { "rail_direction": setState }));
                            if (block === "minecraft:rail" || block === "minecraft:detector_rail") {
                                setBlock.setPermutation(BlockPermutation.resolve(block, { "rail_direction": setState }));
                            } else {
                                setBlock.setPermutation(BlockPermutation.resolve(block, { "rail_direction": setState, "rail_data_bit": true }));
                            }
                        });
                    }
                });
            }
            /////////////////////////////////////////////////////////////////////////////
            function getXYZEntitiesPosition(entity, width, height, dx, dy, dz, callback) {
                for (let x = 0; x <= width; x++) {
                    for (let y = 0; y <= height; y++) {
                        for (let z = 0; z <= width; z++) {
                            const checkX = entity.location.x + (x * dx);
                            const checkY = entity.location.y + (y * dy);
                            const checkZ = entity.location.z + (z * dz);
                            const getEntities = entity.dimension.getEntities({ location: { x: checkX, y: checkY, z: checkZ }, maxDistance: 0.75 });

                            getEntities.forEach(getEntity => callback(getEntity));
                        }
                    }
                }
            }
            /////////////////////////////////////////////////////////////////////////////
            /////////////////////////////////////////////////////////////////////////////
            /////////////////////////////////////////////////////////////////////////////

            if (id === "ots_simred:structure" && message === "ots_simred_formMain") {
                sourceEntity.setProperty("ots_simred:structure.ui", true)
                const propertyLoad = sourceEntity.getProperty("ots_simred:structure.load")
                const propertySelect = sourceEntity.getProperty("ots_simred:structure.select")
                const entities = getNearbyEntities(sourceEntity, 0.25);
                entities.forEach(entity => {
                    if (playerDev) {
                        player.sendMessage(`§8[${entity.typeId}]§r §8Yrot: ${entity.getRotation().y}§r | Direction:§a ${entity.getProperty("ots_simred:structure.direction")}§r | Rotate:§7 ${entity.getProperty("ots_simred:structure.rotate")}§r | Load: §7${propertyLoad}`);
                    }
                });
                if (!propertySelect && !propertyLoad) menu_form.showMenuForm(player, sourceEntity);
                if (propertySelect && !propertyLoad) showMainForm();
                if (propertySelect && propertyLoad) showRedstoneMainForm();
            }
            /////////////////////////////////////////////////////////////////////////////
            /////////////////////////////////////////////////////////////////////////////
            /////////////////////////////////////////////////////////////////////////////
        }
    });
}

function ots_simred_lockPosition() {
    const dimensionNames = ["overworld", "nether", "the_end"];
    dimensionNames.forEach(dimensionID => {
        const dimension = world.getDimension(dimensionID);
        if (dimension) {
            dimension.getEntities().forEach(entity => {
                const familyType = entity.getComponent("minecraft:type_family");
                if (familyType && familyType.hasTypeFamily("ots_simred")) {
                    entity.runCommand("damage @e[family=boat,c=1,r=2.5] 50")
                    entity.runCommand("effect @s clear")
                    entity.teleport({ x: entity.location.x, y: entity.location.y, z: entity.location.z });
                }
            });
        }
    });
}

function ots_simred_draftingTable() {
    world.afterEvents.playerPlaceBlock.subscribe((event) => {
        const player = event.player
        const block = event.block
        const blockPos = block.location
        if (block.typeId !== "ots_simred:structure") return
        if (block.typeId === "ots_simred:structure") {
            player.runCommand(`summon ots_simred:structure ${blockPos.x} ${blockPos.y} ${blockPos.z} facing @s ots_simred:direction`)
            block.setType("minecraft:air")
        }
    })
}

system.runInterval(ots_simred_lockPosition, 0);
ots_simred_structure();
ots_simred_draftingTable();