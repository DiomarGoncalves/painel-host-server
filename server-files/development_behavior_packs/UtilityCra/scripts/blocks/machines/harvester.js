import { world, system, ItemStack } from '@minecraft/server'
import { msg, formattedEnergy, formattedEnergyv1, displayBarv2 } from '../../generators/utils.js'

const energyCost = 100
const energyCap = 32000

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('twm:harvest', {
        beforeOnPlayerPlace(e) {
            const { block, player } = e
            let { x, y, z } = block.location
            y += 0.250, x += 0.5, z += 0.5

            const itemInfo = player.getComponent('equippable').getEquipment('Mainhand').getLore()
            let energy = 0
            if (itemInfo[0]) energy = formattedEnergyv1(itemInfo[0], 4)

            system.run(() => {
                const entity = block.dimension.spawnEntity('twm:basic_machine', { x, y, z })
                const inv = entity.getComponent('minecraft:inventory')?.container;
                entity.nameTag = 'entity.twm:harvester.name'

                entity.setDynamicProperty('twm:energy', energy)
                entity.setDynamicProperty('twm:energyCap', energyCap)
                displayBarv2(energy, energyCap, energyCost, inv, 'energy');
            })
        },
        onTick(e) {
            const { block } = e
            let { x, y, z } = block.location
            // Entity of the machine
            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return;
                entity.nameTag = 'entity.twm:harvester.name'
                
            const inv = entity.getComponent('minecraft:inventory')?.container;
            if (!inv) return

            const range = block.permutation.getState('twm:range')
            let side = (range * 2) + 3
            let area = side ** 2

            let energy = entity.getDynamicProperty('twm:energy') || 0;
            const realEnergyCost = Math.ceil(energyCost * (1 - 0.2 * block.permutation.getState('twm:energy')))

            if (energy <= realEnergyCost * area) {
                block?.setPermutation(block?.permutation.withState('twm:on', false))
                displayBarv2(energy, energyCap, realEnergyCost, inv, 'energy');
                return
            }
            energy -= realEnergyCost * area

            let xtp = x, ytp = y, ztp = z
            let tx = 1, tz = 1
            side = (side == 11) ? 9 : side

            switch (block.permutation.getState('minecraft:facing_direction')) {
                case 'up':
                    y--
                    ytp++
                    x += ((side - 1) / 2)
                    z -= ((side - 1) / 2) + 1
                    tx = -1
                    break
                case 'down':
                    y += 2
                    ytp--
                    x += ((side - 1) / 2)
                    z -= ((side - 1) / 2) + 1
                    tx = -1
                    break
                case 'north':
                    x += ((side - 1) / 2)
                    tx = -1
                    ztp--
                    break
                case 'south':
                    z -= (1 + side)
                    x += ((side - 1) / 2)
                    tx = -1
                    ztp++
                    break
                case 'west':
                    x += (((side - 1)) + 1)
                    z -= ((side - 1) / 2) + 1
                    tx = -1
                    xtp--
                    break
                case 'east':
                    x--
                    z -= ((side - 1) / 2) + 1
                    tx = -1
                    xtp++
                    break
            }

            for (let i = 1; i <= side; i++) {
                for (let j = 1; j <= side; j++) {
                    z += tz
                    block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run function harvester`)
                }
                z -= side * tz
                x += tx
            }

            system.runTimeout(() => {
                block.dimension.runCommand(`tp @e[x=${x},y=${y - 1},z=${z},dx=${side},dz=${side},dy=${y - 1},type=item] ${xtp} ${ytp} ${ztp} `)
                let energy = entity?.getDynamicProperty('twm:energy') || 0;
                displayBarv2(energy, energyCap, realEnergyCost, inv, 'energy');
            }, 30);

            displayBarv2(energy, energyCap, realEnergyCost, inv, 'energy');
            block?.setPermutation(block?.permutation.withState('twm:on', true))
            entity.setDynamicProperty('twm:energy', energy);
        },
        onPlayerDestroy(e) {
            const { block, destroyedBlockPermutation, player } = e
            let { x, y, z } = block.location
            x += 0.5, z += 0.5, y += 0.250
            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return
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
                block.dimension.spawnItem(item, { x, y, z })
                entity.remove()
            });
        }

    })
})