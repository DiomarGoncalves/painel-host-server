import { world, ItemStack } from '@minecraft/server'

const blocks = [
    "minecraft:stone",
    "minecraft:copper_ore",
    "minecraft:deepslate_copper_ore",
    "minecraft:iron_ore",
    "minecraft:deepslate_iron_ore",
    "minecraft:gold_ore",
    "minecraft:deepslate_gold_ore",
    "minecraft:ancient_debris",
    "minecraft:deepslate"
]

const drops = [
    "minecraft:stone",
    "minecraft:copper_ingot",
    "minecraft:copper_ingot",
    "minecraft:iron_ingot",
    "minecraft:iron_ingot",
    "minecraft:gold_ingot",
    "minecraft:gold_ingot",
    "minecraft:netherite_scrap",
    "minecraft:deepslate"
]

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.itemComponentRegistry.registerCustomComponent('twm:smelting', {
        onMineBlock(e) {
            const { block, minedBlockPermutation } = e
            let { x, y, z } = block.location
            x += 0.5, z += 0.5, y += 0.2
            const minedBlockId = minedBlockPermutation.type.id
            for (let i = 0; i < blocks.length; i++) {
                if (minedBlockId == blocks[i]) {
                    const closest = block.dimension.getEntities({ type: 'item', maxDistance: 2, location: { x, y, z } })[0]
                    closest.kill()
                    block.dimension.spawnItem(new ItemStack(`${drops[i]}`, 1), { x, y, z })
                }
            }
        }
    })
})