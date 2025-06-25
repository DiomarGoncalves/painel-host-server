import { world, ItemStack, system } from '@minecraft/server'
import { msg, formattedEnergy, formattedEnergyv1, displayBar } from '../../generators/utils.js'

const rateSpeedBase = 5
const energyCap = 16000

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('twm:induction_anvil', {
        beforeOnPlayerPlace(e) {
            const { block, player } = e
            let { x, y, z } = block.location
            y += 0.250, x += 0.5, z += 0.5

            const itemInfo = player.getComponent('equippable').getEquipment('Mainhand').getLore()
            let energy = 0
            if (itemInfo[0]) energy = formattedEnergyv1(itemInfo[0], 4)

            system.run(() => {
                const entity = block.dimension.spawnEntity('twm:machine1x1', { x, y, z })
                entity.nameTag = 'entity.twm:induction_anvil.name'

                entity.setDynamicProperty('twm:energy', energy)
                entity.setDynamicProperty('twm:energyCap', energyCap)
                block.dimension.playSound('random.anvil_land', { x, y, z })
            })
        },
        onTick(e) {
            const { block } = e
            let { x, y, z } = block.location;
            [x, y, z] = [x + 0.5, y + 0.25, z + 0.5];

            // Entity of the machine
            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return;
                entity.nameTag = 'entity.twm:induction_anvil.name'
                
            const inv = entity.getComponent('minecraft:inventory')?.container;
            if (!inv) return

            let item = inv?.getItem(3)
            let energy = entity.getDynamicProperty('twm:energy') || 0;
            let rateSpeed = rateSpeedBase * Math.pow(2, block.permutation.getState('twm:speed'));
            rateSpeed *= block.permutation.getState('twm:refreshSpeed')


            if (item && energy >= rateSpeed) {
                const durability = item.getComponent('minecraft:durability')

                if (!durability || durability?.damage == 0) return

                durability.damage = Math.max(durability.damage - rateSpeed / 5)

                energy -= rateSpeed

                inv.setItem(3, item)
                entity.setDynamicProperty('twm:energy', energy);
            }

            displayBar(energy, energyCap, rateSpeed, inv, 'energy');
        },
        onPlayerDestroy(e) {
            const { block, destroyedBlockPermutation, player } = e
            let { x, y, z } = block.location
            x += 0.5, z += 0.5, y += 0.250
            const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return
            let energy = entity.getDynamicProperty('twm:energy') || 0;

            const inv = entity.getComponent('minecraft:inventory').container

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

                block.dimension.spawnItem(item, { x, y, z })
                entity.remove()
            });
        }
    })
})