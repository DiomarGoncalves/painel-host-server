import { world, ItemStack, system } from '@minecraft/server'
import { msg, formattedEnergy, formattedEnergyv1, formattedEnergyv2, displayBar } from './utils.js'
import { addSurroundingPosTags, transferEnergyToEnergyContainers } from './transfer_config.js'
import { setQuality } from './utility_quality.js'

let burnSpeedBase = 10 //DE per tick (DE/t) = 100 DE/s
let energyCapBase = 16000

const solar_panelMultis = {
    'twm:basic_solar_panel': 1,
    'twm:advanced_solar_panel': 4,
    'twm:expert_solar_panel': 16,
    'twm:ultimate_solar_panel': 100
}

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('twm:solar_panel', {
        beforeOnPlayerPlace(e) {
            const { block, player } = e
            let { x, y, z } = block.location
            y += 0.125, x += 0.5, z += 0.5

            let energy = 0
            const itemInfo = player.getComponent('equippable').getEquipment('Mainhand').getLore()
            if (itemInfo[0] != undefined) energy = formattedEnergyv1(itemInfo[0], 4)

            system.run(() => {
                const entity = block.dimension.spawnEntity('twm:solar_panel', { x, y, z })
                entity.nameTag = 'entity.twm:solar_panel.name'

                entity.setDynamicProperty('twm:energy', energy)
                addSurroundingPosTags(entity, x, y, z);
            })
        },
        onTick(e) {
            const { block } = e

            // Get the entity of the generator
            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return
            entity.nameTag = 'entity.twm:solar_panel.name'

            const inv = entity.getComponent('minecraft:inventory').container
            if (!inv) return

            // Set the quality mode activated
            setQuality(block)

            /// Get the generator tier and its capacities
            let multi = solar_panelMultis[block.typeId]
            let burnSpeed = burnSpeedBase * multi
            let energyCap = energyCapBase * multi

            // We obtain how much DE the generator currently has, and energyR (How much energy of the previous item remain)
            let energy = entity.getDynamicProperty('twm:energy')

            displayBar(energy, energyCap, burnSpeed, inv, 'energy')

            burnSpeed *= block.permutation.getState('twm:refreshSpeed')

            if (energy < energyCap && world.getTimeOfDay() > 0 && world.getTimeOfDay() < 13000) {
                burnSpeed = Math.min(burnSpeed, energyCap - energy)
                energy += burnSpeed
                block?.setPermutation(block?.permutation.withState('twm:on', true))
            } else {
                block?.setPermutation(block?.permutation.withState('twm:on', false))
            }

            if (energy > 0) energy = transferEnergyToEnergyContainers(block, entity, burnSpeed, energy);
            entity.setDynamicProperty('twm:energy', energy)
        },
        onPlayerDestroy(e) {
            const { block, player, destroyedBlockPermutation } = e
            let { x, y, z } = block.location
            x += 0.5, z += 0.5, y += 0.125

            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return

            let item = new ItemStack(`${destroyedBlockPermutation.type.id}`)
            let energy = entity.getDynamicProperty('twm:energy')

            let multi = solar_panelMultis[destroyedBlockPermutation.type.id]
            let energyCap = energyCapBase * multi

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

