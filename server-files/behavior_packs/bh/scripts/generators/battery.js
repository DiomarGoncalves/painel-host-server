import { world, ItemStack, system } from '@minecraft/server'
import { msg, formattedEnergy, formattedEnergyv1, formattedEnergyv2, displayBar } from './utils.js'
import { addSurroundingPosTags, transferEnergyToEnergyContainers } from './transfer_config.js'

import { setQuality } from './utility_quality.js'


const energyCaps = {
    'twm:basic_battery': 256000,
    'twm:advanced_battery': 1024000,
    'twm:expert_battery': 4096000,
    'twm:ultimate_battery': 25600000
}


const batteryMultis = {
    'twm:basic_battery': 1,
    'twm:advanced_battery': 4,
    'twm:expert_battery': 16,
    'twm:ultimate_battery': 100
}

const transferSpeedBase = 100

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('twm:battery', {
        onTick(e) {
            const { block } = e

            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return
            entity.nameTag = 'entity.twm:battery.name'

            const inv = entity.getComponent('minecraft:inventory').container
            if (!inv) return
            const energyCap = entity.getDynamicProperty("twm:energyCap");

            // Set the quality mode activated
            setQuality(block)
            // Get the furnator tier and its capacities
            let multi = batteryMultis[block.typeId]
            let transferSpeed = transferSpeedBase * multi

            // energy is how much DE does the previous fuel gives
            let energy = entity.getDynamicProperty('twm:energy')

            displayBar(energy, energyCap, transferSpeed, inv, 'energy')

            transferSpeed *= block.permutation.getState('twm:refreshSpeed')

            if (energy > 0) energy = transferEnergyToEnergyContainers(block, entity, transferSpeed, energy);
            entity.setDynamicProperty('twm:energy', energy)

            let energyP = Math.ceil((energy / energyCap) * 48)
            block.setPermutation(block.permutation.withState('twm:capacity', Math.floor(energyP / 8)))

        },
        beforeOnPlayerPlace(e) {
            const { block, player, permutationToPlace } = e
            let { x, y, z } = block.location
            y += 0.250, x += 0.5, z += 0.5

            let energy = 0

            const itemInfo = player.getComponent('equippable').getEquipment('Mainhand').getLore()
            if (itemInfo[0] != undefined) {
                energy = formattedEnergyv1(itemInfo[0], 4)
            }

            system.run(() => {
                const entity = block.dimension.spawnEntity('twm:battery', { x, y, z })
                const batteryTier = energyCaps[permutationToPlace.type.id]
                entity.nameTag = 'entity.twm:battery.name'

                entity.setDynamicProperty('twm:energy', energy)
                entity.setDynamicProperty('twm:energyCap', batteryTier)
                addSurroundingPosTags(entity, x, y, z);
            })
        },
        onPlayerDestroy(e) {
            const { block, player, destroyedBlockPermutation } = e
            let { x, y, z } = block.location
            x += 0.5, z += 0.5, y += 0.250

            // Get the entity of the battery
            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return
            const energyCap = entity.getDynamicProperty("twm:energyCap");
            let energy = entity.getDynamicProperty('twm:energy')


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
                block.dimension.spawnItem(item, { x, y, z })
                entity.remove()
            });
        }
    })
})

