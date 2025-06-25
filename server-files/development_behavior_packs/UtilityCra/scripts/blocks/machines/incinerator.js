import { world, system, ItemStack } from '@minecraft/server'
import { msg, formattedEnergy, formattedEnergyv1, displayBar, transferItems, returnFunction } from '../../generators/utils.js'
import { setQuality } from '../../generators/utility_quality.js'

import { smeltableItems, incineratorSettings, speedCalculate, energyEfficienyCalculate } from './a_machines_config.js'

const { energyCost, energyCap, rateSpeedBase } = incineratorSettings

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('twm:incinerator', {
        beforeOnPlayerPlace(e) {
            const { block, player } = e
            let { x, y, z } = block.location
            y += 0.250, x += 0.5, z += 0.5

            const itemInfo = player.getComponent('equippable').getEquipment('Mainhand').getLore()
            let energy = 0
            if (itemInfo[0]) energy = formattedEnergyv1(itemInfo[0], 4)

            system.run(() => {
                const entity = block.dimension.spawnEntity('twm:machine_general', { x, y, z })
                entity.nameTag = 'entity.twm:incinerator.name'

                entity.setDynamicProperty('twm:energy', energy)
                entity.setDynamicProperty('twm:energyCap', energyCap)
                entity.setDynamicProperty('twm:progress', 0)
            })
        },
        onTick(e) {
            const { block } = e;
            let { x, y, z } = block.location;
            [x, y, z] = [x + 0.5, y + 0.25, z + 0.5];

            // If by any chance the script is executed when you break the machine, returns to avoid errors
            if (block?.typeId == 'minecraft:air') return;

            // Entity of the machine
            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return;
            entity.nameTag = 'entity.twm:incinerator.name'
            setQuality(block);

            const inv = entity.getComponent('minecraft:inventory')?.container;
            if (!inv) return

            // Transfer
            let itemToTransfer = inv.getItem(5);
            transferItems(block, inv)

            // Process Section

            // We obtain the rate speed and energy efficiency
            const speedMulti = speedCalculate(block.permutation.getState('twm:speed'))
            const energyEfficiency = energyEfficienyCalculate(block.permutation.getState('twm:energy')) * speedMulti

            let rateSpeed = rateSpeedBase * speedMulti * block.permutation.getState('twm:refreshSpeed')

            // Get Basic Machine Info
            let energy = entity.getDynamicProperty('twm:energy') || 0;
            let progress = entity.getDynamicProperty('twm:progress') || 0;

            // Item to Process
            let item = inv?.getItem(3);
            const itemToProcess = smeltableItems[item?.typeId]

            // If theres no item to process or the machine is full return
            if (!itemToProcess || itemToTransfer?.amount >= 64) {
                displayBar(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                returnFunction(entity, block, inv, 4)
                return;
            }

            // If theres an item in the output slot and its not the same of the resulting item return
            if (itemToTransfer?.typeId != itemToProcess.output && itemToTransfer) {
                displayBar(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                returnFunction(entity, block, inv, 4)
                return;
            }

            const amountLeft = 64 - itemToTransfer?.amount || 64
            if (1 > amountLeft) {
                displayBar(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                returnFunction(entity, block, inv, 4)
                return;
            }

            // If theres no energy left, return (Maintains progress)
            if (energy <= 0) {
                energy = 0;
                displayBar(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                block?.setPermutation(block?.permutation.withState('twm:on', false))
                return;
            }

            // Do process
            if (progress >= energyCost) {
                let processCount = Math.min(Math.floor(progress / energyCost), item.amount, amountLeft);
                inv.addItem(new ItemStack(itemToProcess.output, processCount));
                progress -= processCount * energyCost;
                item.amount > processCount ? item.amount -= processCount : item = undefined;
                inv.setItem(3, item);
            } else {
                let usedEnergy = rateSpeed * energyEfficiency
                if (usedEnergy > energy) { usedEnergy = energy }
                progress += usedEnergy / energyEfficiency;
                energy -= usedEnergy;
            }
            // Display progress
            let progressValue = Math.max(0, Math.min(16, Math.floor(progress / 50)));
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
            let energy = entity.getDynamicProperty('twm:energy') || 0;

            if (energy > 0) {
                item.setLore([
                    `§r§7  Stored Energy: ${formattedEnergy(energy)}/${formattedEnergy(energyCap)}`
                ])
            }

            system.run(() => {
                if (player.getGameMode() != 'creative') {
                    block.dimension.getEntities({ type: 'item', maxDistance: 2, location: { x, y, z } })[0].kill()
                }
                if (inv.getItem(3)) block.dimension.spawnItem(inv.getItem(3), { x, y, z })
                if (inv.getItem(5)) block.dimension.spawnItem(inv.getItem(5), { x, y, z })
                block.dimension.spawnItem(item, { x, y, z })
                entity.remove()
            });
        }
    })
})