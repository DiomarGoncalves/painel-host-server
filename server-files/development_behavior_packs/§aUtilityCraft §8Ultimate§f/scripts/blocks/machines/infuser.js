import { world, system, ItemStack } from '@minecraft/server'
import { msg, formattedEnergy, formattedEnergyv1, displayBar, transferItems, returnFunction } from '../../generators/utils.js'
import { setQuality } from '../../generators/utility_quality.js'

import { infusableItems, infuserSettings, speedCalculate, energyEfficienyCalculate } from './a_machines_config.js'

const { energyCost, energyCap, rateSpeedBase } = infuserSettings

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('twm:infuser', {
        beforeOnPlayerPlace(e) {
            const { block, player } = e
            let { x, y, z } = block.location
            y += 0.250, x += 0.5, z += 0.5

            const itemInfo = player.getComponent('equippable').getEquipment('Mainhand').getLore()
            let energy = 0
            if (itemInfo[0]) energy = formattedEnergyv1(itemInfo[0], 4)

            system.run(() => {
                const entity = block.dimension.spawnEntity('twm:infuser', { x, y, z })
                const inv = entity.getComponent('minecraft:inventory')?.container;
                entity.nameTag = 'entity.twm:infuser.name'

                inv.setItem(6, new ItemStack('twm:arrow_indicator_90', 1))

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
            entity.nameTag = 'entity.twm:infuser.name'
            setQuality(block);

            const inv = entity.getComponent('minecraft:inventory')?.container;
            if (!inv) return
            let itemToTransfer = inv.getItem(7);
            let itemInfuser = inv?.getItem(5);


            // Transfer
            transferItems(block, inv)

            const inputBlock = block.above(1)

            if (inputBlock && (itemInfuser?.amount < 64 || !itemInfuser)) {
                const inputContainer = inputBlock.getComponent('minecraft:inventory')?.container
                if (inputContainer) {
                    for (let i = 0; i < inputContainer.size; i++) {
                        let inputItem = inputContainer.getItem(i)
                        if (!inputItem) continue
                        if (inputItem.typeId != itemInfuser?.typeId && itemInfuser) continue
                        if (!itemInfuser) {
                            inputContainer.moveItem(i, 5, inv)
                            break
                        }
                        const amount = Math.min(inputItem.amount, 64 - itemInfuser.amount)
                        inputItem.amount > amount ? inputItem.amount -= amount : inputItem = undefined;
                        itemInfuser.amount += amount
                        inputContainer.setItem(i, inputItem)
                        inv.setItem(5, itemInfuser)
                        break
                    }
                }
            }



            // Process Section

            // We obtain the rate speed and energy efficiency
            const speedMulti = speedCalculate(block.permutation.getState('twm:speed'))
            const energyEfficiency = energyEfficienyCalculate(block.permutation.getState('twm:energy')) * speedMulti

            let rateSpeed = rateSpeedBase * speedMulti * block.permutation.getState('twm:refreshSpeed')

            // Get Basic Machine Info
            let energy = entity.getDynamicProperty('twm:energy') || 0;
            let progress = entity.getDynamicProperty('twm:progress') || 0;


            const itemInfuserGroup = infusableItems[itemInfuser?.typeId]

            // If theres no infuser item or the machine is full return
            if (!itemInfuserGroup || itemToTransfer?.amount >= 64) {
                displayBar(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                returnFunction(entity, block, inv, 4)
                return;
            }

            // Item to Infuse
            let item = inv?.getItem(3);
            const itemToProcess = itemInfuserGroup[item?.typeId]

            // If theres no item to infuse 
            if (!itemToProcess) {
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

            // If theres not enough input items, return
            if (itemToProcess.required > itemInfuser.amount) {
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
                let processCount = Math.min(Math.floor(progress / energyCost), item.amount, Math.floor(itemInfuser.amount / itemToProcess.required));
                inv.addItem(new ItemStack(itemToProcess.output, processCount));
                progress -= processCount * energyCost;

                item.amount > processCount ? item.amount -= processCount : item = undefined;
                itemInfuser.amount > processCount * itemToProcess.required ? itemInfuser.amount -= processCount * itemToProcess.required : itemInfuser = undefined;
                inv.setItem(3, item);
                inv.setItem(5, itemInfuser);
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
            let energy = entity.getDynamicProperty('twm:energy') || 0;


            let item = new ItemStack(`${destroyedBlockPermutation.type.id}`)

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
                if (inv.getItem(7)) block.dimension.spawnItem(inv.getItem(7), { x, y, z })
                block.dimension.spawnItem(item, { x, y, z })
                entity.remove()
            });
        }
    })
})