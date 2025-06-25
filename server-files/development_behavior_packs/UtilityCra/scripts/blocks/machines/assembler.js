import { world, system, ItemStack } from '@minecraft/server'
import { msg, formattedEnergy, formattedEnergyv1, transferItems, returnFunction, displayEnergy } from '../../generators/utils.js'
import { setQuality } from '../../generators/utility_quality.js'

import { assemblerSettings, speedCalculate, energyEfficienyCalculate } from './a_machines_config.js'

const { energyCost, energyCap, rateSpeedBase } = assemblerSettings

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('twm:assembler', {
        beforeOnPlayerPlace(e) {
            const { block, player } = e
            let { x, y, z } = block.location
            y += 0.250, x += 0.5, z += 0.5

            const itemInfo = player.getComponent('equippable').getEquipment('Mainhand').getLore()
            let energy = 0
            if (itemInfo[0]) energy = formattedEnergyv1(itemInfo[0], 4)

            system.run(() => {
                const entity = block.dimension.spawnEntity('twm:assembler', { x, y, z })
                entity.nameTag = 'Assembler'

                entity.setDynamicProperty('twm:energy', energy)
                entity.setDynamicProperty('twm:energyCap', energyCap)
                entity.setDynamicProperty('twm:progress', 0)
            })
        },
        onTick(e) {
            const { block } = e;
            let { x, y, z } = block.location;
            y += 0.250, x += 0.5, z += 0.5

            // If by any chance the script is executed when you break the machine, returns to avoid errors
            if (block?.typeId == 'minecraft:air') return;

            // Entity of the machine
            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            // const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return;
            setQuality(block);

            const inv = entity.getComponent('minecraft:inventory')?.container;
            if (!inv) return


            // We obtain the rate speed and energy efficiency
            const speedMulti = speedCalculate(block.permutation.getState('twm:speed'))
            const energyEfficiency = energyEfficienyCalculate(block.permutation.getState('twm:energy')) * speedMulti

            let rateSpeed = rateSpeedBase * block.permutation.getState('twm:refreshSpeed')

            // Get Basic Machine Info
            let energy = entity.getDynamicProperty('twm:energy') || 0;
            let progress = entity.getDynamicProperty('twm:progress') || 0;


            // Transfer
            let itemToTransfer = inv.getItem(14);
            transferItems(block, inv)

            // We get the blueprint item
            let blueprint = inv.getItem(3);
            if (!blueprint) {
                displayEnergy(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                returnFunction(entity, block, inv, 4)
                return
            }

            // Verify its a blueprint
            if (blueprint.typeId != 'twm:blueprint') {
                displayEnergy(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                returnFunction(entity, block, inv, 4)
                return
            }

            // If there are no materials to craft return
            let itemCount = 0
            for (let i = 5; i < inv.size - 1; i++) {
                if (inv.getItem(i)) itemCount++
            }
            if (itemCount == 0) {
                displayEnergy(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                returnFunction(entity, block, inv, 4)
                return
            }

            // If theres no energy left, return (Maintains progress)
            if (energy <= 0) {
                energy = 0;
                displayEnergy(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                block?.setPermutation(block?.permutation.withState('twm:on', false))
                return;
            }

            // We get the recipe item
            const resultItem = blueprint.getDynamicProperty('id')
            const resultAmount = blueprint.getDynamicProperty('amount')
            const leftover = blueprint.getDynamicProperty('leftover') || false

            // Verify its a blueprint
            if (!resultItem) {
                displayEnergy(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                returnFunction(entity, block, inv, 4)
                return
            }


            // If theres an item in the output slot and its not the same of the resulting item return
            let outputSlot = inv.getItem(14)
            let amountLeft = 64
            if (outputSlot) amountLeft = outputSlot.maxAmount - outputSlot.amount
            if ((amountLeft == 0 || amountLeft <= resultAmount || itemToTransfer?.typeId != resultItem) && itemToTransfer) {
                displayEnergy(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                returnFunction(entity, block, inv, 4)
                return;
            }
            let speed = 8 * block.permutation.getState('twm:speed')
            if (speed == 0) speed = 4
            let maxCraftAmount = Math.min(Math.floor(amountLeft / resultAmount), speed)

            // Do process
            if (progress >= energyCost) {
                let craftAmount = amountToCraft(blueprint, inv, maxCraftAmount)
                if (craftAmount <= 0) {
                    displayEnergy(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                    block?.setPermutation(block?.permutation.withState('twm:on', false))
                    return;
                }
                if (!outputSlot) {
                    inv.setItem(14, new ItemStack(resultItem, craftAmount * resultAmount))
                } else {
                    outputSlot.amount += craftAmount * resultAmount
                    inv.setItem(14, outputSlot)
                }
                if (leftover != false) inv.addItem(new ItemStack(leftover, 1))
                progress -= energyCost;
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
            displayEnergy(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
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
        }
    })
})


function amountToCraft(blueprint, inputInventory, maxCraftAmount) {
    const recipe = JSON.parse(blueprint.getDynamicProperty('materials') || '[]');
    // 1. Contar materiales en los slots 6 al 14
    let materialMap = {};
    for (let i = 5; i < 14; i++) {
        let item = inputInventory.getItem(i);
        if (item) {
            let id = item.typeId;
            materialMap[id] = (materialMap[id] || 0) + item.amount;
        }
    }

    // 2. Calcular cuántas veces podemos craftear con lo que tenemos
    let possible = 64;
    for (let mat of recipe) {
        const available = materialMap[mat.id] || 0;
        const craftsForThisMaterial = Math.floor(available / mat.amount);
        if (craftsForThisMaterial === 0) return 0;
        possible = Math.min(possible, craftsForThisMaterial);
    }

    // 3. Limitar al máximo permitido
    const timesToCraft = Math.min(possible, maxCraftAmount);
    if (timesToCraft === 0) return 0;

    // 4. Consumir materiales
    for (let mat of recipe) {
        let remaining = mat.amount * timesToCraft;

        for (let i = 5; i < 14 && remaining > 0; i++) {
            let item = inputInventory.getItem(i);
            if (item && item.typeId === mat.id) {
                if (item.amount <= remaining) {
                    remaining -= item.amount;
                    inputInventory.setItem(i, undefined); // vacía slot
                } else {
                    item.amount -= remaining;
                    inputInventory.setItem(i, item);
                    remaining = 0;
                }
            }
        }
    }

    return timesToCraft;
}
