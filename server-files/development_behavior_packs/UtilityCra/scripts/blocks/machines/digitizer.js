import { world, system, ItemStack } from '@minecraft/server'
import { msg, formattedEnergy, formattedEnergyv1, displayBar } from '../../generators/utils.js'
import { setQuality } from '../../generators/utility_quality.js'

import { digitizerSettings, recipes, speedCalculate, energyEfficienyCalculate } from './a_machines_config.js'

const { energyCost, energyCap, rateSpeedBase } = digitizerSettings

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('twm:digitizer', {
        beforeOnPlayerPlace(e) {
            const { block, player } = e
            let { x, y, z } = block.location
            y += 0.250, x += 0.5, z += 0.5

            const itemInfo = player.getComponent('equippable').getEquipment('Mainhand').getLore()
            let energy = 0
            if (itemInfo[0]) energy = formattedEnergyv1(itemInfo[0], 4)

            system.run(() => {
                const entity = block.dimension.spawnEntity('twm:machine3x3', { x, y, z })
                entity.nameTag = 'entity.twm:digitizer.name'

                entity.setDynamicProperty('twm:energy', energy)
                entity.setDynamicProperty('twm:energyCap', energyCap)
                entity.setDynamicProperty('twm:progress', 0)
                entity.setDynamicProperty('crafting', false)
            })
        },
        onTick(e) {
            const { block, dimension } = e;
            let { x, y, z } = block.location;

            // If by any chance the script is executed when you break the machine, returns to avoid errors
            if (block?.typeId == 'minecraft:air') return;

            // Entity of the machine
            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            // const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return;
            entity.nameTag = 'entity.twm:digitizer.name'
            if (entity.getDynamicProperty('crafting')) return


            setQuality(block);

            const inv = entity.getComponent('minecraft:inventory')?.container;
            if (!inv) return

            // Process Section

            // We obtain the rate speed and energy efficiency
            const speedMulti = speedCalculate(block.permutation.getState('twm:speed'))
            const energyEfficiency = energyEfficienyCalculate(block.permutation.getState('twm:energy')) * speedMulti

            let rateSpeed = rateSpeedBase * speedMulti * block.permutation.getState('twm:refreshSpeed')

            // Get Basic Machine Info
            let energy = entity.getDynamicProperty('twm:energy') || 0;
            let progress = entity.getDynamicProperty('twm:progress') || 0;

            let blueprint = inv.getItem(3);

            if (y < -60) {
                displayBar(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                returnFunction(entity, block, inv)
                return
            }

            if (!blueprint) {
                displayBar(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                returnFunction(entity, block, inv)
                return
            }

            if (blueprint.typeId != 'twm:blueprint_paper') {
                displayBar(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                returnFunction(entity, block, inv)
                return
            }
            let itemToTransfer = inv.getItem(14);
            // Transfer
            if (itemToTransfer) {
                displayBar(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                returnFunction(entity, block, inv)
                //transferItems(block, inv, itemToTransfer, [x, y, z])
                return
            }

            // If theres no energy left, return (Maintains progress)
            if (energy <= 0) {
                energy = 0;
                displayBar(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                block?.setPermutation(block?.permutation.withState('twm:on', false))
                return;
            }

            let itemCount = 0
            for (let i = 5; i < inv.size - 1; i++) {
                if (inv.getItem(i)) itemCount++
            }
            if (itemCount == 0) {
                displayBar(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                returnFunction(entity, block, inv)
                return
            }

            if (progress >= energyCost) {
                let materialMap = {}
                let recipeArray = []
                entity.setDynamicProperty('crafting', true)
                const crafterBlockId = dimension.getBlock({ x: x, y: -64, z })?.typeId
                const redstoneBlockId = dimension.getBlock({ x: x, y: -63, z })?.typeId
                dimension.setBlockType({ x: x, y: -64, z }, 'minecraft:crafter')
                // Get Recipes and Materials
                for (let i = 5; i < inv.size - 1; i++) {
                    let item = inv.getItem(i)
                    if (item) {
                        let id = item.typeId
                        materialMap[id] = (materialMap[id] || 0) + 1
                        dimension.runCommand(`replaceitem block ${x} -64 ${z} slot.container ${i - 5} ${id}`)
                        recipeArray.push(item.typeId.split(':')[1])
                    } else recipeArray.push('air')
                }
                dimension.setBlockType({ x, y: -63, z }, 'minecraft:redstone_block')
                const recipeString = recipeArray.join(',')

                let recipeData = Object.entries(materialMap).map(([id, amount]) => ({ id, amount }))
                let newBlueprint = new ItemStack('twm:blueprint', 1)

                system.runTimeout(() => {
                    const itemEntity = dimension.getEntitiesAtBlockLocation({ x, y: -65, z })[0]
                    let recipeExists = false

                    let outputAmount = 0
                    let outputId = undefined

                    if (itemEntity) {
                        const itemStack = itemEntity.getComponent('minecraft:item').itemStack
                        outputAmount = itemStack.amount
                        outputId = itemStack.typeId
                        itemEntity.remove()
                        recipeExists = true
                    } else {
                        const itemRecipe = recipes[recipeString]
                        if (itemRecipe) {
                            outputAmount = itemRecipe.amount
                            outputId = itemRecipe.output
                            recipeExists = true
                            if (itemRecipe.leftover) newBlueprint.setDynamicProperty('leftover', itemRecipe.leftover)
                        }
                    }

                    if (recipeExists) {
                        newBlueprint.setDynamicProperty('amount', outputAmount)
                        newBlueprint.setDynamicProperty('id', outputId)

                        let lore = [`§r§7 Recipe: §r§f${formatItemId(outputId)}`, '§r§7 Materials:'];

                        for (let mat of recipeData) {
                            lore.push(`§r§7 - ${formatItemId(mat.id)} x${mat.amount}`);
                        }
                        newBlueprint.setDynamicProperty('materials', JSON.stringify(recipeData));
                        newBlueprint.setLore(lore);

                        if (blueprint.amount > 1) {
                            blueprint.amount--
                            inv.setItem(3, blueprint)
                        } else inv.setItem(3,)
                        inv.setItem(14, newBlueprint)
                        progress -= energyCost
                    }

                    removeCrafter(dimension, { x, y, z }, entity, crafterBlockId, redstoneBlockId)
                }, 9)
            } else {
                let usedEnergy = rateSpeed * energyEfficiency
                if (usedEnergy > energy) { usedEnergy = energy }
                progress += usedEnergy / energyEfficiency;
                energy -= usedEnergy;
            }

            // Display progress
            let progressValue = Math.max(0, Math.min(16, Math.floor(16 * progress / energyCost)));
            inv.setItem(4, new ItemStack(`twm:arrow_right_${progressValue}`));

            block?.setPermutation(block?.permutation.withState('twm:on', true))
            entity.setDynamicProperty('twm:energy', energy);
            entity.setDynamicProperty('twm:progress', progress);
            displayBar(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
        },
        onPlayerDestroy(e) {
            const { block, destroyedBlockPermutation, player } = e
            let { x, y, z } = block.location
            x += 0.5, z += 0.5, y += 0.250

            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return
            const inv = entity.getComponent('minecraft:inventory').container

            let item = new ItemStack(`${destroyedBlockPermutation.type.id}`)
            const energy = entity.getDynamicProperty('twm:energy') || 0

            if (energy > 0) {
                item.setLore([
                    `§r§7  Stored Energy: ${formattedEnergy(energy)}/${formattedEnergy(energyCap)}`
                ])
            }

            system.run(() => {
                if (player.getGameMode() != 'creative') {
                    block.dimension.getEntities({ type: 'item', maxDistance: 2, location: { x, y, z } })[0].kill()
                }
                for (let i = 3; i < inv.size; i++) {
                    if (i == 4) continue
                    if (inv.getItem(i)) block.dimension.spawnItem(inv.getItem(i), { x, y, z })
                }
                block.dimension.spawnItem(item, { x, y, z })
                entity.remove()
            });
        },
        onPlayerInteract(e) {

        }
    })
})

function returnFunction(entity, block, inv) {
    entity.setDynamicProperty('twm:progress', 0);
    block?.setPermutation(block?.permutation.withState('twm:on', false))
    inv.setItem(4, new ItemStack(`twm:arrow_right_0`));
}

function formatItemId(typeId) {
    // Quitar namespace (minecraft: o lo que sea)
    let cleanId = typeId.split(':')[1] || typeId;

    // Separar por guiones bajos y capitalizar cada palabra
    return cleanId
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function removeCrafter(dimension, { x, y, z }, entity, crafterBlockId, redstoneBlockId) {
    for (let i = 0; i < 9; i++) {
        dimension.runCommand(`replaceitem block ${x} -64 ${z} slot.container ${i} air`)
    }
    dimension.setBlockType({ x, y: -64, z }, crafterBlockId)
    dimension.setBlockType({ x, y: -63, z }, redstoneBlockId)
    entity.setDynamicProperty('crafting', false)
}