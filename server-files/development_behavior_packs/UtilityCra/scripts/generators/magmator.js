import { world, ItemStack, system } from '@minecraft/server'
import { msg, formattedEnergy, formattedEnergyv1, formatInputsLiquids, convertInfoLiquid, displayBar } from './utils.js'
import { addSurroundingPosTags, transferEnergyToEnergyContainers } from './transfer_config.js'
import { setQuality } from './utility_quality.js'

let burnSpeedBase = 50 //DE per tick (DE/t) = 1000 DE/s
let energyCapBase = 64000
let lavaCapBase = 8000
const multis = {
    'twm:basic_magmator': 1,
    'twm:advanced_magmator': 4,
    'twm:expert_magmator': 16,
    'twm:ultimate_magmator': 100
}

const fuels = [
    { input: 'minecraft:lava_bucket', amount: 1000, output: 'minecraft:bucket' },
    { input: 'twm:lava_ball', amount: 1000 }
]


world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('twm:magmator', {
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
                const entity = block.dimension.spawnEntity('twm:magmator', { x, y, z })
                entity.nameTag = 'entity.twm:magmator.name'
                entity.setDynamicProperty('twm:energy', energy)
                entity.setDynamicProperty('twm:liquid', lava)
                entity.setDynamicProperty('twm:liquidType', 'lava')

                entity.getComponent('minecraft:inventory').container.setItem(6, new ItemStack(`twm:arrow_indicator`))
                addSurroundingPosTags(entity, x, y, z);
            })
        },
        onTick(e) {
            const { block } = e
            let { x, y, z } = block.location
            y += 0.250, x += 0.5, z += 0.5

            // Get the entity of the magmator
            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return
                entity.nameTag = 'entity.twm:magmator.name'
                
            const inv = entity.getComponent('minecraft:inventory').container
            if (!inv) return

            setQuality(block)
            // Get the magmator tier and its capacities

            const multi = multis[block?.typeId]
            let burnSpeed = burnSpeedBase * multi
            let energyCap = energyCapBase * multi
            let lavaCap = lavaCapBase * multi

            // Generate section

            // We obtain how much DE the magmator currently has, and energyR (How much energy of the previous item remain)
            let energy = entity.getDynamicProperty('twm:energy')
            let lava = entity.getDynamicProperty('twm:liquid')


            let lavaP = Math.floor((lava / lavaCap) * 48)
            let lavaPercentage = lavaP

            // display
            for (let i = 3; i <= 5; i++) {
                lavaPercentage = lavaP - 16 * (i - 3)
                if (lavaPercentage < 0) lavaPercentage = 0
                if (lavaPercentage > 16) lavaPercentage = 16
                let lavaBar = new ItemStack(`twm:lava_bar_${lavaPercentage}`)
                lavaBar.setLore([
                    `§r§7  Stored Lava: ${formatInputsLiquids(lava, lavaCap)}`,
                    `§r§7  Percentage: ${Math.floor((lava / lavaCap) * 10000) / 100}%`
                ])
                inv.setItem(i, lavaBar)
            }
            displayBar(energy, energyCap, burnSpeed, inv, 'energy')

            // Set the quality mode activated

            burnSpeed *= block.permutation.getState('twm:refreshSpeed')


            if (energy < energyCap && lava > 0) {
                burnSpeed = Math.min(burnSpeed, energyCap - energy, lava * 100)
                lava -= burnSpeed / 100
                energy += burnSpeed
                block?.setPermutation(block?.permutation.withState('twm:on', true))
            } else {
                block?.setPermutation(block?.permutation.withState('twm:on', false))
            }

            if (energy > 0) energy = transferEnergyToEnergyContainers(block, entity, burnSpeed, energy);
            entity.setDynamicProperty('twm:energy', energy)

            entity.setDynamicProperty('twm:liquid', lava)
        },
        onPlayerInteract(e) {
            const { block, player } = e
            let { x, y, z } = block.location
            y += 0.250, x += 0.5, z += 0.5

            ////////////////////////////////////////////////// Get the magmator tier and its capacities
            const multi = multis[block?.typeId]

            let lavaCap = lavaCapBase * multi

            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return
            let lava = entity.getDynamicProperty('twm:liquid')

            let mainhand = player.getComponent('equippable').getEquipment('Mainhand')

            if (mainhand == undefined) return
            const item = fuels.find(fuel => fuel.input == mainhand.typeId)
            if (lava + item?.amount <= lavaCap && item) {
                entity.setDynamicProperty('twm:liquid', lava + item.amount)
                if (player.getGameMode() != 'creative') {
                    player.runCommandAsync(`clear @s ${item.input} 0 1`)
                    if (item.output) {
                        player.getComponent('minecraft:inventory').container.addItem(new ItemStack(`${item.output}`))
                    }
                }
            }
        },
        onPlayerDestroy(e) {
            const { block, player, destroyedBlockPermutation } = e
            let { x, y, z } = block.location
            x += 0.5, z += 0.5, y += 0.250

            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return

            let lava = entity.getDynamicProperty('twm:liquid')

            const multi = multis[destroyedBlockPermutation?.type.id]
            let energyCap = energyCapBase * multi
            let lavaCap = lavaCapBase * multi

            let item = new ItemStack(`${destroyedBlockPermutation.type.id}`)
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

