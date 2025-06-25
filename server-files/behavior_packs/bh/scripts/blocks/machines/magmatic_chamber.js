import { world, ItemStack, system } from '@minecraft/server'
import { msg, formattedEnergy, formattedEnergyv1, formatInputsLiquids, convertInfoLiquid, displayBar } from '../../generators/utils.js'
import { setQuality } from '../../generators/utility_quality.js'

import { meltableItems, magmaticChamberSettings, speedCalculate, energyEfficienyCalculate } from './a_machines_config.js'

const { energyCost, energyCap, rateSpeedBase, lavaCap } = magmaticChamberSettings

const capsMagmator = {
    'twm:basic_magmator': 8000,
    'twm:advanced_magmator': 32000,
    'twm:expert_magmator': 128000,
    'twm:ultimate_magmator': 800000
}

const capsTanks = {
    'twm:basic_fluid_tank': 8000,
    'twm:advanced_fluid_tank': 32000,
    'twm:expert_fluid_tank': 128000,
    'twm:ultimate_fluid_tank': 512000
}


world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('twm:magmatic_chamber', {
        beforeOnPlayerPlace(e) {
            const { block, player } = e
            let { x, y, z } = block.location
            y += 0.250, x += 0.5, z += 0.5

            let energy = 0
            let lava = 0

            const itemInfo = player.getComponent('equippable').getEquipment('Mainhand').getLore()
            if (itemInfo[0] != undefined) {
                energy = formattedEnergyv1(itemInfo[0], 4)
                lava = convertInfoLiquid(itemInfo[1], 4)
            }

            system.run(() => {
                const entity = block.dimension.spawnEntity('twm:magmatic_chamber', { x, y, z })
                entity.nameTag = 'entity.twm:magmatic_chamber.name'

                entity.setDynamicProperty('twm:energy', energy)
                entity.setDynamicProperty('twm:energyCap', energyCap)
                entity.setDynamicProperty('twm:liquid', lava)
                entity.setDynamicProperty('twm:liquidType', 'lava')
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
                entity.nameTag = 'entity.twm:magmatic_chamber.name'
            setQuality(block);

            // Basic info of the machine
            const inv = entity.getComponent('minecraft:inventory')?.container;
            if (!inv) return
            let item = inv?.getItem(3);

            let energy = entity.getDynamicProperty('twm:energy') || 0;
            let progress = entity.getDynamicProperty('twm:progress') || 0;
            let lava = entity.getDynamicProperty('twm:liquid') || 0;

            const itemToProcess = meltableItems[item?.typeId]

            // We obtain the rate speed and energy efficiency
            const speedMulti = speedCalculate(block.permutation.getState('twm:speed'))
            const energyEfficiency = energyEfficienyCalculate(block.permutation.getState('twm:energy')) * speedMulti

            let rateSpeed = rateSpeedBase * speedMulti * block.permutation.getState('twm:refreshSpeed')

            // Facing direction
            const facingOffsets = { up: [0, -1, 0], down: [0, 1, 0], north: [0, 0, 1], south: [0, 0, -1], west: [1, 0, 0], east: [-1, 0, 0] };
            const facing = facingOffsets[block.permutation.getState('minecraft:facing_direction')];
            if (facing) [x, y, z] = [x + facing[0], y + facing[1], z + facing[2]];

            // Transfer section
            const nextContainer = block.dimension.getBlock({ x, y, z })
            if (lava >= 250 && nextContainer) {
                if (nextContainer?.typeId.includes('fluid_tank')) {
                    const hasLiquid = nextContainer.permutation.getState('twm:hasliquid');
                    if (hasLiquid) {
                        const tank = block.dimension.getEntitiesAtBlockLocation(nextContainer.location)[0]
                        if (tank?.typeId.includes('lava')) {
                            let tankAmount = tank.getDynamicProperty('twm:liquid');
                            const cap = capsTanks[nextContainer?.typeId]
                            if (cap && tankAmount + 250 <= cap) {
                                tankAmount += 250
                                lava -= 250
                                tank.setDynamicProperty('twm:liquid', tankAmount);
                                tank.setDynamicProperty('twm:liquidType', 'lava');
                                tank.getComponent('minecraft:health').setCurrentValue(tankAmount);
                            }

                        }
                    } else {
                        nextContainer.setPermutation(nextContainer.permutation.withState('twm:hasliquid', true));
                        const tank = block.dimension.spawnEntity(`twm:fluid_tank_lava`, { x, y: y - 0.25, z });
                        lava -= 250
                        tank.setDynamicProperty('twm:liquid', 250);
                        tank.getComponent('minecraft:health').setCurrentValue(250);
                    }
                }

                if (nextContainer?.typeId.includes('magmator')) {
                    const cap = capsMagmator[nextContainer?.typeId]
                    const magmator = block.dimension.getEntitiesAtBlockLocation(nextContainer.location)[0]
                    if (magmator) {
                        let magmatorAmount = magmator.getDynamicProperty('twm:liquid')
                        if (magmatorAmount + 250 <= cap) {
                            magmatorAmount += 250
                            lava -= 250
                            magmator.setDynamicProperty('twm:liquid', magmatorAmount)

                        }

                    }

                }
            }

            // If theres no item to process or the machine is full return
            if (!itemToProcess) {
                lavaDisplay(lava, lavaCap, inv)
                displayBar(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
                returnFunction(entity, block, inv)
                return;
            }

            // Do process
            if (lava + itemToProcess?.amount <= lavaCap && itemToProcess) {
                if (progress >= energyCost) {
                    let processCount = Math.min(Math.floor(progress / energyCost), item.amount);
                    lava += processCount * itemToProcess.amount
                    progress -= processCount * energyCost;

                    item.amount > processCount ? item.amount -= processCount : item = undefined;
                    inv.setItem(3, item);
                } else {
                    let usedEnergy = rateSpeed * energyEfficiency
                    if (usedEnergy > energy) { usedEnergy = energy }
                    progress += usedEnergy / energyEfficiency;
                    energy -= usedEnergy;
                }
            }

            // Display progress
            let progressValue = Math.max(0, Math.min(16, Math.floor(progress / 500)));
            inv.setItem(7, new ItemStack(`twm:arrow_right_${progressValue}`));

            entity.setDynamicProperty('twm:energy', energy);
            entity.setDynamicProperty('twm:progress', progress);
            entity.setDynamicProperty('twm:liquid', lava);

            // Display
            lavaDisplay(lava, lavaCap, inv)
            displayBar(energy, energyCap, rateSpeedBase * speedMulti, inv, 'energy', energyEfficiency);
        },
        onPlayerDestroy(e) {
            const { block, player, destroyedBlockPermutation } = e
            let { x, y, z } = block.location
            x += 0.5, z += 0.5, y += 0.250

            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return

            let item = new ItemStack(`${destroyedBlockPermutation.type.id}`)

            let lava = entity.getDynamicProperty('twm:liquid')
            let energy = entity.getDynamicProperty('twm:energy')

            if (energy > 0 || lava > 0) {
                item.setLore([
                    `§r§7  Stored Energy: ${formattedEnergy(energy)}/${formattedEnergy(energyCap)}`,
                    `§r§7  Stored Lava: ${formatInputsLiquids(lava, lavaCap)}`
                ])
            }
            system.run(() => {
                if (player.getGameMode() != 'creative') {
                    block.dimension.getEntities({ type: 'item', maxDistance: 2, location: { x, y, z } })[0].kill()
                }
                block.dimension.spawnItem(item, { x, y, z })
                entity.remove()
            });
        }
    })
})


function returnFunction(entity, block, inv) {
    entity.setDynamicProperty('twm:progress', 0);
    block?.setPermutation(block?.permutation.withState('twm:on', false))
    inv.setItem(7, new ItemStack(`twm:arrow_right_0`));
}


function lavaDisplay(lava, lavaCap, inv) {
    // Display
    let lavaP = Math.floor((lava / lavaCap) * 48)
    let lavaPercentage = lavaP
    for (let i = 4; i <= 6; i++) {
        lavaPercentage = lavaP - 16 * (i - 4)
        if (lavaPercentage < 0) lavaPercentage = 0
        if (lavaPercentage > 16) lavaPercentage = 16
        let lavaBar = new ItemStack(`twm:lava_bar_${lavaPercentage}`)
        lavaBar.setLore([
            `§r§7  Stored Lava: ${formatInputsLiquids(lava, lavaCap)}`,
            `§r§7  Percentage: ${Math.floor((lava / lavaCap) * 10000) / 100}%`
        ])
        inv.setItem(i, lavaBar)
    }
}