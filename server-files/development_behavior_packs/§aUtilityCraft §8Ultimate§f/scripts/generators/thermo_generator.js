import { world, ItemStack, system } from '@minecraft/server'
import { msg, formattedEnergy, formattedEnergyv1, formatInputsLiquids, convertInfoLiquid, displayBar } from './utils.js'
import { addSurroundingPosTags, transferEnergyToEnergyContainers } from './transfer_config.js'
import { setQuality } from './utility_quality.js'

let burnSpeedBase = 20 //DE per tick (DE/t) = 1000 DE/s
let energyCapBase = 32000
let waterCapBase = 2000

const coolants = [
    { input: 'minecraft:water_bucket', amount: 1000, output: 'minecraft:bucket' },
    { input: 'twm:water_ball', amount: 1000 }
]

const thermo_generatorMultis = {
    'twm:basic_thermo_generator': 1,
    'twm:advanced_thermo_generator': 4,
    'twm:expert_thermo_generator': 16,
    'twm:ultimate_thermo_generator': 100
}

const heatSources = {
    'twm:blaze_block': 1.5,
    'minecraft:lava': 1,
    'minecraft:flowing_lava': 1,
    'minecraft:soul_fire': 0.75,
    'minecraft:soul_torch': 0.75,
    'minecraft:soul_campfire': 0.75,
    'minecraft:fire': 0.5,
    'minecraft:campfire': 0.5,
    'minecraft:magma': 0.5,
    'minecraft:torch': 0.25
}

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('twm:thermo_generator', {
        beforeOnPlayerPlace(e) {
            const { block, player } = e
            let { x, y, z } = block.location
            y += 0.250, x += 0.5, z += 0.5

            let energy = 0
            let water = 0

            const itemInfo = player.getComponent('equippable').getEquipment('Mainhand').getLore()
            if (itemInfo[0] != undefined) {
                energy = formattedEnergyv1(itemInfo[0], 4)
                water = convertInfoLiquid(itemInfo[1], 4)
            }
            system.run(() => {
                const entity = block.dimension.spawnEntity('twm:thermo_generator', { x, y, z })
                entity.nameTag = 'entity.twm:thermo_generator.name'

                entity.setDynamicProperty('twm:energy', energy)
                entity.setDynamicProperty('twm:liquid', water)
                entity.setDynamicProperty('twm:liquidType', 'water')

                entity.getComponent('minecraft:inventory').container.setItem(6, new ItemStack(`twm:arrow_indicator`))
                addSurroundingPosTags(entity, x, y, z);
            })
        },
        onTick(e) {
            const { block } = e
            let { x, y, z } = block.location
            y += 0.250, x += 0.5, z += 0.5

            // Get the entity of the thermo_generator
            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return
            entity.nameTag = 'entity.twm:thermo_generator.name'

            const inv = entity.getComponent('minecraft:inventory').container
            if (!inv) return
            setQuality(block)

            // Get the thermo_generator tier and its capacities
            let multi = thermo_generatorMultis[block.typeId]
            let burnSpeed = burnSpeedBase * multi
            let energyCap = energyCapBase * multi
            let waterCap = waterCapBase * multi

            // Generate section

            // We obtain how much DE the thermo_generator currently has, and energyR (How much energy of the previous item remain)
            let energy = entity.getDynamicProperty('twm:energy')
            let water = entity.getDynamicProperty('twm:liquid')

            let waterP = Math.floor((water / waterCap) * 48)
            let waterPercentage = waterP


            // display
            for (let i = 3; i <= 5; i++) {
                waterPercentage = waterP - 16 * (i - 3)
                if (waterPercentage < 0) waterPercentage = 0
                if (waterPercentage > 16) waterPercentage = 16
                let waterBar = new ItemStack(`twm:water_bar_${waterPercentage}`)
                waterBar.setLore([
                    `§r§7  Stored Water: ${formatInputsLiquids(water, waterCap)}`,
                    `§r§7  Percentage: ${Math.floor((water / waterCap) * 10000) / 100}%`
                ])
                inv.setItem(i, waterBar)
            }

            const heatSource = heatSources[block.below(1)?.typeId] || 0
            burnSpeed *= heatSource
            displayBar(energy, energyCap, burnSpeed, inv, 'energy')


            // Set the quality mode activated

            burnSpeed *= block.permutation.getState('twm:refreshSpeed') * heatSource

            if (energy < energyCap && water > 0 && heatSource) {
                water -= burnSpeed / 40
                burnSpeed = Math.min(burnSpeed, energyCap - energy)
                energy += burnSpeed
                block?.setPermutation(block?.permutation.withState('twm:on', true))
            } else {
                block?.setPermutation(block?.permutation.withState('twm:on', false))
            }

            if (energy > 0) energy = transferEnergyToEnergyContainers(block, entity, burnSpeed, energy);
            entity.setDynamicProperty('twm:energy', energy)
            entity.setDynamicProperty('twm:liquid', water)
        },
        onPlayerInteract(e) {
            const { block, player } = e
            let { x, y, z } = block.location
            y += 0.250, x += 0.5, z += 0.5

            ////////////////////////////////////////////////// Get the thermo tier and its capacities
            let multi = thermo_generatorMultis[block.typeId]
            let waterCap = waterCapBase * multi

            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return
            let water = entity.getDynamicProperty('twm:liquid')

            let mainhand = player.getComponent('equippable').getEquipment('Mainhand')

            if (mainhand == undefined) return
            const item = coolants.find(heatSource => heatSource.input == mainhand.typeId)
            if (water + item?.amount <= waterCap && item) {
                entity.setDynamicProperty('twm:liquid', water + item.amount)
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

            let item = new ItemStack(`${destroyedBlockPermutation.type.id}`)

            let water = entity.getDynamicProperty('twm:liquid')
            let multi = thermo_generatorMultis[destroyedBlockPermutation.type.id]
            let waterCap = waterCapBase * multi
            let energyCap = energyCapBase * multi
            let energy = entity.getDynamicProperty('twm:energy')

            if (energy > 0 || water > 0) {
                item.setLore([
                    `§r§7  Stored Energy: ${formattedEnergy(energy)}/${formattedEnergy(energyCap)}`,
                    `§r§7  Stored Water: ${formatInputsLiquids(water, waterCap)}`
                ])
            }
            system.run(() => {
                if (player.getGameMode() != 'creative') {
                    block.dimension.getEntities({ type: 'item', maxDistance: 2, location: { x, y, z } })[0].kill()
                }
                block.dimension.spawnItem(item, { x, y, z })
                entity.addTag('despawn')
            });
        }
    })
})

