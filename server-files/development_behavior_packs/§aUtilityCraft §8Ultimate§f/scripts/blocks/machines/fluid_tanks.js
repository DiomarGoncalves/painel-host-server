import { world, ItemStack, system } from '@minecraft/server'
const acceptedItems = [
    { id: 'minecraft:lava_bucket', value: 1000, liquid: 'lava', result: 'bucket' },
    { id: 'minecraft:water_bucket', value: 1000, liquid: 'water', result: 'bucket' },
    { id: 'minecraft:milk_bucket', value: 1000, liquid: 'milk', result: 'bucket' },
    { id: 'twm:lava_ball', value: 1000, liquid: 'lava', result: 'air' },
    { id: 'twm:water_ball', value: 1000, liquid: 'water', result: 'air' },
    { id: 'minecraft:experience_bottle', value: 8, liquid: 'xp', result: 'air' }
]

const tankCaps = {
    'twm:basic_fluid_tank': 8000,
    'twm:advanced_fluid_tank': 32000,
    'twm:expert_fluid_tank': 128000,
    'twm:ultimate_fluid_tank': 512000
};


world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('twm:fluid_tanks', {
        onPlayerInteract(e) {
            const { block, player } = e;
            const { x, y, z } = block.location;
            const pos = { x: x + 0.5, y, z: z + 0.5 };
            const mainhand = player.getComponent('equippable').getEquipment('Mainhand');


            const hasLiquid = block.permutation.getState('twm:hasliquid');

            const tankCap = tankCaps[block.typeId] || 8000;

            if (!mainhand) {
                if (hasLiquid) {
                    const tank = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
                    if (tank) {
                        let tankAmount = tank.getDynamicProperty('twm:liquid');
                        const liquid = tank.typeId.slice(15);
                        const percent = Math.floor((tankAmount / tankCap) * 10000) / 100;
                        player.onScreenDisplay.setActionBar(`${capitalizeWords(liquid)}: ${tankAmount}mB  Capacity: ${percent}% of ${tankCap}mB`);
                    }
                } else {
                    player.onScreenDisplay.setActionBar('Empty');
                }
                return;
            }

            const item = acceptedItems.find(x => mainhand.typeId == x.id);

            if (!hasLiquid && item) {
                block.setPermutation(block.permutation.withState('twm:hasliquid', true));
                const tank = block.dimension.spawnEntity(`twm:fluid_tank_${item.liquid}`, pos);
                tank.setDynamicProperty('twm:liquid', item.value);
                tank.setDynamicProperty('twm:liquidType', item.liquid);
                tank.getComponent('minecraft:health').setCurrentValue(item.value);
                if (player.getGameMode() !== 'creative') {
                    player.runCommandAsync(`clear @s ${item.id} 0 1`);
                    player.runCommandAsync(`give @s ${item.result} 1`);
                }
                const percent = Math.floor((item.value / tankCap) * 10000) / 100;
                player.onScreenDisplay.setActionBar(`${capitalizeWords(item.liquid)}: ${item.value}mB  Capacity: ${percent}% of ${tankCap}mB`);
                return;
            }

            if (!hasLiquid) {
                player.onScreenDisplay.setActionBar('Empty');
                return;
            }

            const tank = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!tank) return;

            let tankAmount = tank.getDynamicProperty('twm:liquid');
            const liquid = tank.typeId.slice(15);

            if (item && liquid == item.liquid && tankAmount <= tankCap - item.value) {
                tankAmount += item.value;
                if (player.getGameMode() !== 'creative') {
                    player.runCommandAsync(`clear @s ${item.id} 0 1`);
                    player.runCommandAsync(`give @s ${item.result} 1`);
                }
            }

            if (mainhand.typeId == 'minecraft:bucket' && tankAmount >= 1000 && ['lava', 'water', 'milk'].includes(liquid)) {
                tankAmount -= 1000;
                player.runCommandAsync(`clear @s bucket 0 1`);
                player.runCommandAsync(`give @s ${liquid}_bucket 1`);
            }

            if (tankAmount == 0) {
                tank.remove();
                block.setPermutation(block.permutation.withState('twm:hasliquid', false));
            } else {
                tank.getComponent('minecraft:health').setCurrentValue(tankAmount);
                tank.setDynamicProperty('twm:liquid', tankAmount);
            }

            const percent = Math.floor((tankAmount / tankCap) * 10000) / 100;
            player.onScreenDisplay.setActionBar(`${capitalizeWords(liquid)}: ${tankAmount}mB  Capacity: ${percent}% of ${tankCap}mB`);

        },
        onPlayerDestroy(e) {
            const { block, player, destroyedBlockPermutation } = e
            let { x, y, z } = block.location
            x += 0.5, z += 0.5
            if (!destroyedBlockPermutation.getState('twm:hasliquid')) return

            const tankCap = tankCaps[destroyedBlockPermutation.type.id] || 8000;

            const tank = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (tank) {
                const tankItem = new ItemStack(destroyedBlockPermutation.type.id, 1)
                const liquidName = capitalizeWords(tank.typeId.slice(15, tank.typeId.length))
                const tankAmount = tank.getDynamicProperty('twm:liquid');

                if (!tankAmount || tankAmount == NaN) return

                const percent = (Math.floor(((tankAmount) / (tankCap)) * 10000)) / 100
                tank.remove()
                tankItem.setLore([
                    `§r§7  Liquid: ${liquidName}`,
                    `§r§7  Amount: ${tankAmount}mB`,
                    `§r§7  Capacity: ${percent}% of ${tankCap}mB`
                ])
                system.run(() => {
                    if (player.getGameMode() != 'creative') {
                        block.dimension.getEntities({ type: 'item', maxDistance: 2, location: { x, y, z } })[0].kill()
                    }
                    block.dimension.spawnItem(tankItem, { x, y, z })
                });
            }
        },
        beforeOnPlayerPlace(e) {
            const { player, block, permutationToPlace } = e
            let { x, y, z } = block.location
            x += 0.5, z += 0.5
            const tankLore = player.getComponent('equippable').getEquipment('Mainhand').getLore()

            if (tankLore[0] != undefined) {
                system.run(() => {
                    const liquid = formatString(tankLore[0])
                    const tankAmount = parseInt(tankLore[1].split(': ')[1].slice(0, tankLore[1].length - 2))
                    const tank = block.dimension.spawnEntity(`twm:fluid_tank_${liquid}`, { x, y, z })

                    tank.addTag('tank')
                    tank.addTag('twm_fluid_container')
                    tank.setDynamicProperty('twm:liquid', tankAmount);
                    tank.setDynamicProperty('twm:liquidType', `${liquid}`);
                    const tankBlock = block.above(0)
                    tankBlock.setPermutation(block.permutation.withState('twm:hasliquid', true))
                    tank.addTag(`${tankBlock.typeId}`)
                    system.run(() => {
                        tank.getComponent('minecraft:health').setCurrentValue(tankAmount);
                    })
                })

            }
        }
    })
})

function capitalizeWords(input) {
    return input.split('_').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}
function formatString(input) {
    let parts = input.split(": ");
    let formattedString = parts[1].toLowerCase().replace(/ /g, "_");
    return formattedString;
}