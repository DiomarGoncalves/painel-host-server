import { world, ItemStack, system } from '@minecraft/server'
import { msg, formattedEnergy, formattedEnergyv1, displayBarv2 } from '../../generators/utils.js'
import { blockPlacerSettings } from './a_machines_config.js'

const { energyCap, energyCost } = blockPlacerSettings

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('twm:block_placer', {
        beforeOnPlayerPlace(e) {
            const { block, player } = e
            let { x, y, z } = block.location
            y += 0.250, x += 0.5, z += 0.5

            const itemInfo = player.getComponent('equippable').getEquipment('Mainhand').getLore()
            let energy = 0
            if (itemInfo[0]) energy = formattedEnergyv1(itemInfo[0], 4)

            system.run(() => {
                const entity = block.dimension.spawnEntity('twm:machine1x1', { x, y, z })
                const inv = entity.getComponent('minecraft:inventory')?.container;
                entity.nameTag = 'entity.twm:block_placer.name'

                entity.setDynamicProperty('twm:energy', energy)
                entity.setDynamicProperty('twm:energyCap', energyCap)
                displayBarv2(energy, energyCap, energyCost, inv, 'energy');
            })
        },
        onTick(e) {
            const { block } = e
            let { x, y, z } = block.location;
            [x, y, z] = [x + 0.5, y + 0.25, z + 0.5];

            // Entity of the machine
            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return;
            entity.nameTag = 'entity.twm:block_placer.name'

            const inv = entity.getComponent('minecraft:inventory')?.container;
            if (!inv) return

            let energy = entity.getDynamicProperty('twm:energy') || 0;
            const realEnergyCost = Math.ceil(energyCost * (1 - 0.2 * block.permutation.getState('twm:energy')))

            // If theres no energy, return
            if (energy < realEnergyCost) {
                block?.setPermutation(block?.permutation.withState('twm:on', false))
                displayBarv2(energy, energyCap, realEnergyCost, inv, 'energy');
                return
            }

            let item = inv?.getItem(3)
            // If theres no block to place, return
            if (!item) {
                block?.setPermutation(block?.permutation.withState('twm:on', false))
                displayBarv2(energy, energyCap, realEnergyCost, inv, 'energy');
                return
            }
            // Facing direction
            const facingOffsets = { up: [0, -1, 0], down: [0, 1, 0], north: [0, 0, 1], south: [0, 0, -1], west: [1, 0, 0], east: [-1, 0, 0] };
            const facing = facingOffsets[block.permutation.getState('minecraft:facing_direction')];
            if (facing) [x, y, z] = [x + facing[0], y + facing[1], z + facing[2]];

            const blockNext = block.dimension.getBlock({ x, y, z })
            // If the next block isnt air, return
            if (blockNext?.typeId != 'minecraft:air') {
                block?.setPermutation(block?.permutation.withState('twm:on', false))
                displayBarv2(energy, energyCap, realEnergyCost, inv, 'energy');
                return
            }

            // Try to place the block, if catch, that means is not a block 
            try {
                blockNext.setType(`${item.typeId}`)
                item.amount > 1 ? item.amount -= 1 : item = undefined;
                inv.setItem(3, item);
                energy -= realEnergyCost
                block?.setPermutation(block?.permutation.withState('twm:on', true))
            } catch {
                block?.setPermutation(block?.permutation.withState('twm:on', false))
            }

            entity.setDynamicProperty('twm:energy', energy);
            displayBarv2(energy, energyCap, realEnergyCost, inv, 'energy');
        },
        onPlayerDestroy(e) {
            const { block, destroyedBlockPermutation, player } = e
            let { x, y, z } = block.location
            x += 0.5, z += 0.5, y += 0.250
            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return
            const inv = entity.getComponent('minecraft:inventory').container

            let item = new ItemStack(`${destroyedBlockPermutation.type.id}`)
            const energy = entity.getDynamicProperty('twm:energy')

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
                block.dimension.spawnItem(item, { x, y, z })
                entity.remove()
            });
        }
    })
})