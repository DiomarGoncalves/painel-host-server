import { world, ItemStack, system } from '@minecraft/server'
import { msg, formattedEnergy, formattedEnergyv1, formattedEnergyv2, displayBar } from './utils.js'
import { addSurroundingPosTags, transferEnergyToEnergyContainers } from './transfer_config.js'
import { setQuality } from './utility_quality.js'

const fuels = [
    { id: 'compressed_coal_block_4', de: 800000000 },
    { id: 'compressed_coal_block_3', de: 80000000 },
    { id: 'compressed_coal_block_2', de: 8000000 },
    { id: 'compressed_coal_block', de: 800000 },
    { id: 'coal_block', de: 80000 },
    { id: 'coal', de: 8000 },
    { id: 'charcoal', de: 8000 },
    { id: 'plank', de: 1500 },
    { id: 'stair', de: 1500 },
    { id: 'fence', de: 1500 },
    { id: 'stick', de: 500 },
    { id: 'door', de: 1000 },
    { id: 'ladder', de: 750 },
    { id: 'scaffolding', de: 250 },
    { id: 'log', de: 1500 },
    { id: '_wood', de: 1500 },
    { id: 'stem', de: 1500 },
    { id: 'hyphae', de: 1500 },
    { id: 'sapling', de: 500 },
    { id: 'dried_kelp_block', de: 20000 },
    { id: 'twm:lava_ball', de: 100000 },
    { id: 'blaze_rod', de: 12000 },
    { id: 'boat', de: 6000 },
    { id: 'button', de: 500 },
    { id: 'wooden', de: 1000 },
    { id: 'banner', de: 1500 },
    { id: 'chest', de: 3000 },
    { id: 'leaves', de: 500 }
]

const furnatorMultis = {
    'twm:basic_furnator': 1,
    'twm:advanced_furnator': 4,
    'twm:expert_furnator': 16,
    'twm:ultimate_furnator': 100
}

let burnSpeedBase = 40  //DE per tick (DE/t) = 800 DE/s
let energyCapBase = 48000


world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('twm:furnator', {
        beforeOnPlayerPlace(e) {
            const { block, player } = e
            let { x, y, z } = block.location
            y += 0.250, x += 0.5, z += 0.5

            let energy = 0
            let energyR = 0
            let energyF = 0

            const itemInfo = player.getComponent('equippable').getEquipment('Mainhand').getLore()
            if (itemInfo[0] != undefined) {
                energy = formattedEnergyv1(itemInfo[0], 4)
                energyR = formattedEnergyv1(itemInfo[1], 4)
                energyF = formattedEnergyv2(itemInfo[1])
            }

            system.run(() => {
                const entity = block.dimension.spawnEntity('twm:furnator', { x, y, z })
                entity.nameTag = 'entity.twm:furnator.name'

                entity.setDynamicProperty('twm:energy', energy)
                entity.setDynamicProperty('twm:energyR', energyR)
                entity.setDynamicProperty('twm:energyF', energyF)

                addSurroundingPosTags(entity, x, y, z);
            })
        },
        onTick(e) {
            // let start = Date.now()
            const { block } = e
            let { x, y, z } = block.location
            y += 0.250, x += 0.5, z += 0.5
            // Get the entity of the furnator
            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return
                entity.nameTag = 'entity.twm:furnator.name'
                
            const inv = entity.getComponent('minecraft:inventory').container
            if (!inv) return
            setQuality(block)

            // Get the furnator tier and its capacities
            let multi = furnatorMultis[block.typeId]
            let burnSpeed = burnSpeedBase * multi
            let energyCap = energyCapBase * multi

            // Generate section

            // We obtain how much DE the furnator currently has, and energyR (How much energy of the previous item remain)
            // energyF is how much DE does the previous fuel gives
            let energy = entity.getDynamicProperty('twm:energy')
            let energyR = entity.getDynamicProperty('twm:energyR')
            let energyF = entity.getDynamicProperty('twm:energyF')

            // display
            let fuelP = 0
            if (energyF > 0) {
                fuelP = Math.floor((energyR / energyF) * 13)
            }
            let fuelBar = new ItemStack(`twm:fuel_bar_${fuelP}`)
            fuelBar.setLore([
                `§r§7  Fuel Remaining: ${formattedEnergy(energyR)}/${formattedEnergy(energyF)}`
            ])
            inv.setItem(4, fuelBar)

            displayBar(energy, energyCap, burnSpeed, inv, 'energy')

            // Set the quality mode activated

            burnSpeed *= block.permutation.getState('twm:refreshSpeed')

            // If the furnator cant storage more energy it stops burning
            if (energy < energyCap) {

                // If there is energy remaining, we will extract energy from it, if not, we will burn a new item
                if (energyR > 0) {

                    burnSpeed = Math.min(energyR, burnSpeed, energyCap - energy)
                    energyR -= burnSpeed
                    energy += burnSpeed
                    block?.setPermutation(block?.permutation.withState('twm:on', true))

                } else {
                    // Check for the item in the furnator, if it doesnt have one, then return
                    entity.setDynamicProperty('twm:energyF', 0)
                    let item = inv.getItem(3)
                    if (item != undefined) {

                        // If the item isnt fuel return
                        const fuel = fuels.find(fuel => item.typeId.includes(fuel.id))
                        if (fuel) {
                            burnSpeed = Math.min(fuel.de, burnSpeed, energyCap - energy)
                            block?.setPermutation(block?.permutation.withState('twm:on', true))
                            energyR = fuel.de - burnSpeed
                            energy += burnSpeed

                            // Removes 1 item from the stack
                            if (item.amount > 1) {
                                item.amount--
                                inv.setItem(3, item)
                            } else {
                                inv.setItem(3,)
                            }

                            entity.setDynamicProperty('twm:energyF', fuel.de)
                        } else {
                            block?.setPermutation(block?.permutation.withState('twm:on', false))
                        }
                    } else {
                        block?.setPermutation(block?.permutation.withState('twm:on', false))
                    }
                }
            } else {
                block?.setPermutation(block?.permutation.withState('twm:on', false))
            }

            if (energy > 0) energy = transferEnergyToEnergyContainers(block, entity, burnSpeed, energy);
            entity.setDynamicProperty('twm:energyR', energyR)
            entity.setDynamicProperty('twm:energy', energy)
        },
        onPlayerDestroy(e) {
            const { block, player, destroyedBlockPermutation } = e
            let { x, y, z } = block.location
            x += 0.5, z += 0.5, y += 0.250

            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return
            const inv = entity.getComponent('minecraft:inventory').container

            let multi = furnatorMultis[destroyedBlockPermutation.type.id]

            let energyCap = energyCapBase * multi

            let item = new ItemStack(`${destroyedBlockPermutation.type.id}`)
            let energy = entity.getDynamicProperty('twm:energy')
            let energyR = entity.getDynamicProperty('twm:energyR')
            let energyF = entity.getDynamicProperty('twm:energyF')

            if (energy > 0) {
                item.setLore([
                    `§r§7  Stored Energy: ${formattedEnergy(energy)}/${formattedEnergy(energyCap)}`,
                    `§r§7  Fuel Remaining: ${formattedEnergy(energyR)}/${formattedEnergy(energyF)}`
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

