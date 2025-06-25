import { world, system, ItemStack } from '@minecraft/server'
import { ActionFormData, ModalFormData } from '@minecraft/server-ui'

const vanillaContainers = [
    'minecraft:chest',
    'minecraft:trapped_chest',
    'minecraft:barrel',
    'minecraft:furnace',
    'minecraft:blast_furnace',
    'minecraft:hopper',
    'minecraft:smoker',
    'minecraft:shulker',
    'minecraft:dropper'
];

const blockFaceOffsets = {
    up: [0, -1, 0],
    down: [0, 1, 0],
    north: [0, 0, 1],
    south: [0, 0, -1],
    west: [1, 0, 0],
    east: [-1, 0, 0],
};

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('twm:exporter', {
        beforeOnPlayerPlace(e) {
            const { block } = e
            let { x, y, z } = block.location
            y += 0.375, x += 0.5, z += 0.5
            system.run(() => {
                const entity = block.dimension.spawnEntity('twm:pipe', { x, y, z })
                entity.setDynamicProperty('twm:whitelistOn', true)
            })
        },
        onPlayerDestroy(e) {
            e.block.dimension.getEntitiesAtBlockLocation(e.block.location)[0].remove()
        },
        onPlayerInteract(e) {
            const { block, player } = e
            let { x, y, z } = block.location
            x += 0.5, z += 0.5, y += 0.375
            if (player.isSneaking) return
            const hasFilter = block.permutation.getState('twm:filter')
            if (!hasFilter) return
            const mainHand = player.getComponent('equippable').getEquipment('Mainhand')
            if (mainHand?.typeId.includes('wrench')) return
            openMenu({ x, y, z }, block, player)
        },
        onTick(e) {
            const { block, dimension } = e
            let { x, y, z } = block.location

            const entity = dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return
            let state = entity.getDynamicProperty('twm:whitelistOn')
            const hasFilter = block.permutation.getState('twm:filter')

            const face = block.permutation.getState("minecraft:block_face");
            const faceOffset = blockFaceOffsets[face];

            if (faceOffset) {
                x = x + faceOffset[0];
                y = y + faceOffset[1];
                z = z + faceOffset[2];
            }

            const firstBlock = dimension.getBlock({ x, y, z })
            if (!firstBlock) return

            const tags = entity.getTags().filter(tag =>
                tag.startsWith("ent:[") || tag.startsWith("van:[") || tag.startsWith("dra:[")
            );
            if (!tags) return

            let targetEnt = undefined
            let nextInv = undefined;

            // Drawers Temporal. Will be reworked
            if (firstBlock.typeId.includes('dustveyn:storage_drawers')) {
                const firstEnt = dimension.getEntitiesAtBlockLocation(firstBlock.location)[0]
                if (!firstEnt) return
                let itemToTransfer = firstEnt.getTags()[0]
                if (!itemToTransfer) return
                const firstId = firstEnt.scoreboardIdentity
                let firstAmount = Math.min(64, world.scoreboard.getObjective("capacity").getScore(firstId))
                if (firstAmount == 0) return
                if (hasFilter) {
                    if (entity.hasTag(`filt:${itemToTransfer}`) != state) return
                }
                for (const tag of tags) {
                    const coords = tag.substring(4)
                        .split(",")
                        .map(val => parseInt(val.replace(/[^\d-]/g, '')));
                    const pos = { x: coords[0], y: coords[1], z: coords[2] };

                    const targetBlock = dimension.getBlock(pos);
                    if (tag.startsWith('van')) {
                        nextInv = targetBlock?.getComponent("minecraft:inventory")?.container;
                        if (nextInv.emptySlotsCount == 0) continue
                        nextInv.addItem(new ItemStack(itemToTransfer, firstAmount))
                        firstEnt.runCommandAsync(`scoreboard players add @s capacity ${-firstAmount}`);
                        return

                    }
                    targetEnt = dimension.getEntitiesAtBlockLocation(pos)[0];
                    if (!targetEnt) continue
                    // Drawers section
                    if (tag.startsWith('dra')) {
                        if (!targetEnt.hasTag(`${itemToTransfer}`)) continue
                        const targetId = targetEnt.scoreboardIdentity
                        let capacity = world.scoreboard.getObjective("capacity").getScore(targetId)
                        let max_capacity = world.scoreboard.getObjective("max_capacity").getScore(targetId)
                        if (capacity < max_capacity) {
                            let amount = Math.min(firstAmount, max_capacity - capacity)
                            firstEnt.runCommandAsync(`scoreboard players add @s capacity ${-amount}`);
                            targetEnt.runCommandAsync(`scoreboard players add @s capacity ${amount}`);
                            return
                        }
                        continue
                    }
                    nextInv = targetEnt?.getComponent("minecraft:inventory")?.container;
                    if (!nextInv) continue
                    if (targetEnt?.getComponent("minecraft:type_family").hasTypeFamily('dorios:simple_container')) {
                        const nextSlot = nextInv.getItem(3)
                        if (!nextSlot) {
                            nextInv.addItem(new ItemStack(itemToTransfer, firstAmount))
                            firstEnt.runCommandAsync(`scoreboard players add @s capacity ${-firstAmount}`);
                            return
                        }
                        if (nextSlot.typeId != itemToTransfer) continue
                        if (nextSlot.amount < 64) {
                            const amount = Math.min(firstAmount, 64 - nextSlot.amount);
                            nextSlot.amount += amount
                            nextInv.setItem(3, nextSlot)
                            firstEnt.runCommandAsync(`scoreboard players add @s capacity ${-amount}`);
                            return
                        }
                        continue
                    }
                    const nextFilter = targetBlock.permutation.getState('twm:filter')
                    if (nextFilter) {
                        if (targetEnt.hasTag(`${itemToTransfer}`) != targetEnt.getDynamicProperty('twm:whitelistOn')) continue
                    }
                    if (targetEnt.typeId == 'twm:assembler' && nextInv.emptySlotsCount < 2) continue
                    nextInv.addItem(new ItemStack(itemToTransfer, firstAmount))
                    firstEnt.runCommandAsync(`scoreboard players add @s capacity ${-firstAmount}`);
                    return
                }
                return
            }



            let firstInv = undefined
            let firstIsSimple = false
            let firstIsComplex = false

            if (vanillaContainers.includes(firstBlock.typeId)) {
                firstInv = firstBlock.getComponent('minecraft:inventory').container
            }
            if (firstBlock.hasTag('dorios:item')) {
                const firstEnt = dimension.getEntitiesAtBlockLocation(firstBlock.location)[0]
                if (!firstEnt) return
                firstInv = firstEnt.getComponent("minecraft:inventory")?.container
                let firstTF = firstEnt.getComponent("minecraft:type_family")
                firstIsSimple = firstTF.hasTypeFamily('dorios:simple_output')
                firstIsComplex = firstTF.hasTypeFamily('dorios:3x3_output')
                if (firstIsComplex) firstIsSimple = false
            }

            if (!firstInv) return
            if (firstInv.emptySlotsCount == firstInv.size) return

            for (let i = 0; i < firstInv.size; i++) {
                let itemToTransfer = firstInv.getItem(i)
                if (!itemToTransfer) continue
                if (firstIsSimple && i != firstInv.size - 1) continue
                if (firstIsComplex && (5 > i || i == 14)) continue
                if (hasFilter) {
                    if (entity.hasTag(`filt:${itemToTransfer.typeId}`) != state) continue
                }
                for (const tag of tags) {
                    const coords = tag.substring(4)
                        .split(",")
                        .map(val => parseInt(val.replace(/[^\d-]/g, '')));
                    const pos = { x: coords[0], y: coords[1], z: coords[2] };

                    const targetBlock = dimension.getBlock(pos);
                    if (tag.startsWith('van')) {
                        nextInv = targetBlock?.getComponent("minecraft:inventory")?.container;
                        const transfered = firstInv.transferItem(i, nextInv)
                        if (!transfered) return
                        continue
                    }
                    targetEnt = dimension.getEntitiesAtBlockLocation(pos)[0];
                    if (!targetEnt) continue
                    // Drawers section
                    if (tag.startsWith('dra')) {
                        if (!targetEnt.hasTag(`${itemToTransfer?.typeId}`)) continue
                        const targetId = targetEnt.scoreboardIdentity
                        let capacity = world.scoreboard.getObjective("capacity").getScore(targetId)
                        let max_capacity = world.scoreboard.getObjective("max_capacity").getScore(targetId)
                        if (capacity < max_capacity) {
                            let amount = Math.min(itemToTransfer.amount, max_capacity - capacity)
                            itemToTransfer.amount > amount ? itemToTransfer.amount -= amount : itemToTransfer = undefined;
                            firstInv.setItem(i, itemToTransfer);
                            targetEnt.runCommandAsync(`scoreboard players add @s capacity ${amount}`);
                            return
                        }
                        continue
                    }
                    nextInv = targetEnt?.getComponent("minecraft:inventory")?.container;
                    if (!nextInv) continue
                    if (targetEnt?.getComponent("minecraft:type_family").hasTypeFamily('dorios:simple_container')) {
                        const nextSlot = nextInv.getItem(3)
                        if (!nextSlot) {
                            firstInv.transferItem(i, nextInv)
                            return
                        }
                        if (nextSlot.typeId != itemToTransfer.typeId) continue
                        if (nextSlot.amount < 64) {
                            const amount = Math.min(itemToTransfer.amount, 64 - nextSlot.amount);
                            nextSlot.amount += amount
                            nextInv.setItem(3, nextSlot)
                            itemToTransfer.amount > amount ? itemToTransfer.amount -= amount : itemToTransfer = undefined;
                            firstInv.setItem(i, itemToTransfer);
                            return
                        }
                        continue
                    }
                    const nextFilter = targetBlock.permutation.getState('twm:filter')
                    if (nextFilter) {
                        if (targetEnt.hasTag(`${itemToTransfer.typeId}`) != targetEnt.getDynamicProperty('twm:whitelistOn')) continue
                    }
                    if (targetEnt.typeId == 'twm:assembler' && nextInv.emptySlotsCount < 2) continue
                    const transfered = firstInv.transferItem(i, nextInv)
                    if (!transfered) return
                    continue
                }
            }
        }
    })
})

const caps = {
    'twm:basic_fluid_tank': 8000,
    'twm:advanced_fluid_tank': 32000,
    'twm:expert_fluid_tank': 128000,
    'twm:ultimate_fluid_tank': 512000,
    'twm:basic_magmator': 8000 * 1,
    'twm:advanced_magmator': 8000 * 4,
    'twm:expert_magmator': 8000 * 16,
    'twm:ultimate_magmator': 8000 * 100,
    'twm:basic_thermo_generator': 2000 * 1,
    'twm:advanced_thermo_generator': 2000 * 4,
    'twm:expert_thermo_generator': 2000 * 16,
    'twm:ultimate_thermo_generator': 2000 * 100,
    'twm:magmatic_chamber': 16000
};
const liquids = {
    'minecraft:water': 'water',
    'minecraft:lava': 'lava'
}
world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('twm:extractor', {
        beforeOnPlayerPlace(e) {
            const { block } = e
            let { x, y, z } = block.location
            y += 0.375, x += 0.5, z += 0.5
            system.run(() => {
                block.dimension.spawnEntity('twm:pipe', { x, y, z })
            })
        },
        onPlayerDestroy(e) {
            e.block.dimension.getEntitiesAtBlockLocation(e.block.location)[0].remove()
        },
        onTick(e) {
            const { block, dimension } = e
            let { x, y, z } = block.location

            // If by any chance the script is executed when you break the machine, returns to avoid errors
            if (block?.typeId == 'minecraft:air') return;

            const entity = dimension.getEntitiesAtBlockLocation(block.location)[0]
            if (!entity) return

            const face = block.permutation.getState("minecraft:block_face")
            const faceOffset = blockFaceOffsets[face]
            if (faceOffset) {
                x += faceOffset[0]
                y += faceOffset[1]
                z += faceOffset[2]
            }

            const firstBlock = dimension.getBlock({ x, y, z })
            if (!firstBlock) return

            const firstContainer = dimension.getEntitiesAtBlockLocation(firstBlock.location)[0]
            let firstAmount = 0
            let liquidType = null
            let isInfinite = false
            let speed = 1000 * (2 ** block.permutation.getState('twm:speed'))

            // Detectar tipo de fuente
            if (firstContainer) {
                firstAmount = firstContainer.getDynamicProperty('twm:liquid')
                if (firstAmount <= 0) return
                liquidType = firstContainer.getDynamicProperty('twm:liquidType')
            } else if (liquids[firstBlock.typeId]) {
                // Bloques líquidos vanilla
                if (firstBlock.permutation.getState("liquid_depth") !== 0) return
                firstAmount = 1000
                liquidType = liquids[firstBlock.typeId]
            } else if (firstBlock.typeId === 'twm:crucible') {
                const lavaLevel = firstBlock.permutation.getState('twm:lava')
                if (lavaLevel < 1) return
                firstAmount = 250 * lavaLevel
                liquidType = 'lava'
            } else if (firstBlock.typeId === 'twm:sink') {
                liquidType = 'water'
                firstAmount = Infinity
                isInfinite = true
            } else {
                return // Fuente inválida
            }

            const tags = entity.getTags()
            if (!tags) return

            let nextType, nextAmount, nextCap

            for (const tag of tags) {
                const coords = tag.substring(4).split(",").map(val => parseInt(val.replace(/[^\d-]/g, '')))
                const pos = { x: coords[0], y: coords[1], z: coords[2] }

                const targetEnt = dimension.getEntitiesAtBlockLocation(pos)[0]
                const nextBlock = dimension.getBlock(pos)

                if (targetEnt) {
                    nextAmount = targetEnt.getDynamicProperty('twm:liquid') || 0
                    nextType = targetEnt.getDynamicProperty('twm:liquidType')
                    nextCap = caps[nextBlock?.typeId]

                    if (!nextCap) continue

                    if (nextType !== liquidType && nextAmount > 0) continue
                    if (nextAmount >= nextCap) continue

                    const transfer = Math.min(speed, firstAmount, nextCap - nextAmount)
                    if (transfer <= 0) continue

                    targetEnt.setDynamicProperty('twm:liquid', nextAmount + transfer)
                    targetEnt.setDynamicProperty('twm:liquidType', liquidType)
                    if (nextBlock.typeId.includes('fluid_tank')) {
                        targetEnt.getComponent('minecraft:health').setCurrentValue(nextAmount + transfer)
                    }

                    // Actualiza fuente
                    if (!isInfinite) {
                        firstAmount -= transfer

                        if (firstContainer) {
                            firstContainer.setDynamicProperty('twm:liquid', firstAmount)
                            if (firstContainer.typeId.includes('fluid_tank')) {
                                firstContainer.getComponent('minecraft:health').setCurrentValue(firstAmount)
                            }
                            if (firstAmount <= 0 && firstBlock.typeId.includes('fluid_tank')) {
                                firstContainer.remove()
                                firstBlock.setPermutation(firstBlock.permutation.withState('twm:hasliquid', false))
                            }
                        } else if (liquids[firstBlock.typeId]) {
                            firstBlock.setType('minecraft:air')
                        } else if (firstBlock.typeId === 'twm:crucible') {
                            firstBlock.setPermutation(firstBlock.permutation.withState('twm:lava', 0))
                        }
                    }

                    return
                }

                // Si no hay entidad y es un tag de tanque (crear nuevo tanque)
                if (tag.startsWith("tan:") && !targetEnt && nextBlock.typeId.includes('fluid_tank')) {
                    const tank = dimension.spawnEntity(`twm:fluid_tank_${liquidType}`, {
                        x: pos.x + 0.5,
                        y: pos.y,
                        z: pos.z + 0.5
                    })

                    const nextBlock = dimension.getBlock(pos)
                    const transfer = Math.min(speed, firstAmount)

                    tank.setDynamicProperty('twm:liquid', transfer)
                    tank.setDynamicProperty('twm:liquidType', liquidType)
                    tank.getComponent('minecraft:health').setCurrentValue(transfer)
                    nextBlock.setPermutation(nextBlock.permutation.withState('twm:hasliquid', true))

                    if (!isInfinite) {
                        firstAmount -= transfer

                        if (firstContainer) {
                            firstContainer.setDynamicProperty('twm:liquid', firstAmount)
                            if (firstAmount <= 0 && firstBlock.typeId.includes('fluid_tank')) {
                                firstContainer.remove()
                                firstBlock.setPermutation(firstBlock.permutation.withState('twm:hasliquid', false))
                            }
                        } else if (liquids[firstBlock.typeId]) {
                            firstBlock.setType('minecraft:air')
                        } else if (firstBlock.typeId === 'twm:crucible') {
                            firstBlock.setPermutation(firstBlock.permutation.withState('twm:lava', 0))
                        }
                    }
                    return
                }
            }

        }
    })
})

// Check surronding blocks, if its compatible, it sets the permutation to show the bone
function updateGeometry(block, tag) {
    const directions = {
        up: block.above(1),
        down: block.below(1),
        north: block.north(1),
        south: block.south(1),
        east: block.east(1),
        west: block.west(1)
    };
    for (const [dir, neighbor] of Object.entries(directions)) {
        const shouldConnect =
            // Check if its from the same category
            neighbor?.hasTag(`${tag}`)
            // If its a conduit, vanilla containers needs to be considered
            || (block.hasTag('dorios:item') && (vanillaContainers.includes(neighbor?.typeId) /*Borrar*/ || neighbor?.typeId.includes('dustveyn:storage_drawers')/*Borrar*/));

        // Set the perm
        block.setPermutation(block.permutation.withState(`twm:${dir}`, shouldConnect));
    }
}

function updateGeometryExporter(block, tag) {
    const permutation = block.permutation;
    const facing = permutation.getState("minecraft:block_face");

    const directionMap = {
        north: { north: "south", south: "north", east: "west", west: "east", up: "up", down: "down" },
        south: { north: "north", south: "south", east: "east", west: "west", up: "up", down: "down" },
        east: { north: "east", south: "west", east: "south", west: "north", up: "up", down: "down" },
        west: { north: "west", south: "east", east: "north", west: "south", up: "up", down: "down" },
        up: { north: "up", south: "down", east: "east", west: "west", up: "south", down: "north" },
        down: { north: "down", south: "up", east: "east", west: "west", up: "north", down: "south" }
    };

    const neighborAccess = {
        up: block.above(1),
        down: block.below(1),
        north: block.north(1),
        south: block.south(1),
        east: block.east(1),
        west: block.west(1)
    };

    const map = directionMap[facing] || directionMap.north;

    let newPerm = permutation;

    for (const [dir, visualDir] of Object.entries(map)) {
        const neighbor = neighborAccess[dir];
        const shouldConnect =
            neighbor?.hasTag(tag) ||
            (block.hasTag("dorios:item") && (vanillaContainers.includes(neighbor?.typeId) /*Borrar*/ || neighbor?.typeId.includes('dustveyn:storage_drawers')/*Borrar*/));

        newPerm = newPerm.withState(`twm:${visualDir}`, shouldConnect);
    }

    block.setPermutation(newPerm);
}

// Executes the scan function and update geometry
function updatePipes(block, tag, rescanFunction) {
    const directions = [
        block.above(1),
        block.below(1),
        block.north(1),
        block.south(1),
        block.east(1),
        block.west(1)
    ];
    for (const neighbor of directions) {
        if (neighbor?.hasTag(tag)) {
            if (neighbor?.hasTag('dorios:isExporter')) {
                updateGeometryExporter(neighbor, tag);
            } else if (neighbor?.hasTag('dorios:isTube')) {
                updateGeometry(neighbor, tag);
            }
            rescanFunction(neighbor.location, block.dimension);
        }
    }
    rescanFunction(block.location, block.dimension);
}

world.afterEvents.playerBreakBlock.subscribe(e => {
    const { block, brokenBlockPermutation } = e;

    if (brokenBlockPermutation.hasTag('dorios:energy')) {
        updatePipes(block, 'dorios:energy', startRescanEnergy);
    }

    if (brokenBlockPermutation.hasTag('dorios:item') || vanillaContainers.includes(brokenBlockPermutation.type.id) /*Borrar*/ || brokenBlockPermutation.type.id.includes('dustveyn:storage_drawers')/*Borrar*/) {
        updatePipes(block, 'dorios:item', startRescanItem);
    }

    if (brokenBlockPermutation.hasTag('dorios:fluid')) {
        updatePipes(block, 'dorios:fluid', startRescanFluid);
    }
});

world.afterEvents.playerPlaceBlock.subscribe(e => {
    const { block } = e;

    if (block.hasTag('dorios:energy')) {
        if (block.typeId === 'twm:energy_cable') updateGeometry(block, 'dorios:energy');
        updatePipes(block, 'dorios:energy', startRescanEnergy);
    }

    if (block.hasTag('dorios:item') || vanillaContainers.includes(block.typeId)) {
        if (block.typeId === 'twm:item_conduit') updateGeometry(block, 'dorios:item');
        if (block.typeId === 'twm:item_exporter') updateGeometryExporter(block, 'dorios:item');
        updatePipes(block, 'dorios:item', startRescanItem);
    }

    if (block.hasTag('dorios:fluid')) {
        if (block.typeId === 'twm:fluid_pipe') updateGeometry(block, 'dorios:fluid');
        if (block.typeId === 'twm:fluid_extractor') updateGeometryExporter(block, 'dorios:fluid');
        updatePipes(block, 'dorios:fluid', startRescanFluid);
    }
});

function startRescanEnergy(startPos, dimension) {
    const queue = [startPos];
    const visited = new Set();
    const machines = [];
    const generators = [];

    const offsets = [
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: -1 },
    ];

    while (queue.length > 0) {
        const pos = queue.shift();
        const key = `${pos.x},${pos.y},${pos.z}`;
        if (visited.has(key)) continue;
        visited.add(key);

        const block = dimension.getBlock(pos);
        // If it's a pipe and not verified, mark it as verified and continue the scan
        if (block?.typeId == "twm:energy_cable") {

            // Add surrounding blocks to queue to continue the scan
            for (const offset of offsets) {
                queue.push({
                    x: pos.x + offset.x,
                    y: pos.y + offset.y,
                    z: pos.z + offset.z,
                });
            }
            continue; // Skip the rest of the logic for pipes
        }

        // Get the entity at this position (should only be one if it's a machine/gen)
        const entity = dimension.getEntitiesAtBlockLocation(pos)[0];
        if (!entity) continue;

        const tf = entity.getComponent("minecraft:type_family");
        if (!tf) continue;

        // Check if the entity is a generator or machine
        if (tf.hasTypeFamily("dorios:energy_source")) {
            generators.push(entity);
        }

        if (tf.hasTypeFamily("dorios:energy_container")) {
            machines.push(pos);
        }
    }

    // Tag each generator with all connected machine positions
    for (const gen of generators) {
        // Remove old tags starting with net:[
        const oldNetTags = gen.getTags().filter(tag => tag.startsWith("net:["));
        for (const tag of oldNetTags) gen.removeTag(tag);

        // Add the machines' positions as tags to the generator
        for (const pos of machines) {
            gen.addTag(`net:[${pos.x},${pos.y},${pos.z}]`);
        }
    }
}

function startRescanItem(startPos, dimension) {
    const queue = [startPos];
    const visited = new Set();
    const outputs = [];
    const extractors = [];

    const offsets = [
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: -1 }
    ];

    const globalBlockedTags = new Set();

    while (queue.length > 0) {
        const pos = queue.shift();
        const key = `${pos.x},${pos.y},${pos.z}`;
        if (visited.has(key)) continue;
        visited.add(key);

        const block = dimension.getBlock(pos);

        if (block?.typeId === "twm:item_conduit" || block?.typeId === "twm:item_exporter") {
            for (const offset of offsets) {
                queue.push({
                    x: pos.x + offset.x,
                    y: pos.y + offset.y,
                    z: pos.z + offset.z,
                });
            }
        }

        if (vanillaContainers.includes(block?.typeId)) {
            outputs.push(`van:[${pos.x},${pos.y},${pos.z}]`);
            continue;
        }

        if (block?.typeId.includes('dustveyn:storage_drawers')) {
            outputs.push(`dra:[${pos.x},${pos.y},${pos.z}]`);
            continue;
        }

        const entities = dimension.getEntitiesAtBlockLocation(pos);
        if (entities.length > 0) {
            const ent = entities[0];

            if (ent.typeId === "twm:pipe") {
                extractors.push(ent);
                continue;
            }

            const tf = ent.getComponent("minecraft:type_family");
            if (tf?.hasTypeFamily("dorios:container")) {
                outputs.push(`ent:[${pos.x},${pos.y},${pos.z}]`);
            }
        }
    }

    for (const ext of extractors) {
        const extLoc = ext.location;
        const extPos = {
            x: Math.floor(extLoc.x),
            y: Math.floor(extLoc.y),
            z: Math.floor(extLoc.z)
        };

        const block = dimension.getBlock(extPos);
        const face = block.permutation.getState("minecraft:block_face");
        const faceOffset = blockFaceOffsets[face];

        if (faceOffset) {
            const bx = extPos.x + faceOffset[0];
            const by = extPos.y + faceOffset[1];
            const bz = extPos.z + faceOffset[2];
            globalBlockedTags.add(`van:[${bx},${by},${bz}]`);
            globalBlockedTags.add(`ent:[${bx},${by},${bz}]`);
            globalBlockedTags.add(`dra:[${bx},${by},${bz}]`);
        }
    }

    for (const ext of extractors) {
        const oldTags = ext.getTags().filter(tag => tag.startsWith("van:") || tag.startsWith("ent:") || tag.startsWith("dra:"));
        for (const tag of oldTags) ext.removeTag(tag);

        for (const tag of outputs) {
            if (globalBlockedTags.has(tag)) continue;
            ext.addTag(tag);
        }
    }
}



function startRescanFluid(startPos, dimension) {
    const queue = [startPos];
    const visited = new Set();
    const outputs = [];
    const extractors = [];

    const offsets = [
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: -1 }
    ];

    const globalBlockedTags = new Set();

    while (queue.length > 0) {
        const pos = queue.shift();
        const key = `${pos.x},${pos.y},${pos.z}`;
        if (visited.has(key)) continue;
        visited.add(key);

        const block = dimension.getBlock(pos);

        if (block?.typeId === "twm:fluid_pipe" || block?.typeId === "twm:fluid_extractor") {
            for (const offset of offsets) {
                queue.push({
                    x: pos.x + offset.x,
                    y: pos.y + offset.y,
                    z: pos.z + offset.z,
                });
            }
        }

        if (block?.typeId.includes('fluid_tank')) {
            outputs.push(`tan:[${pos.x},${pos.y},${pos.z}]`);
            continue;
        }

        const entities = dimension.getEntitiesAtBlockLocation(pos);
        if (entities.length > 0) {
            const ent = entities[0];

            if (ent.typeId === "twm:pipe") {
                extractors.push(ent);
                continue;
            }

            const tf = ent.getComponent("minecraft:type_family");
            if (tf?.hasTypeFamily("dorios:fluid_container")) {
                outputs.push(`ent:[${pos.x},${pos.y},${pos.z}]`);
            }
        }
    }

    // Taggear outputs válidos a cada extractor, excluyendo la cara hacia la que está orientado
    for (const ext of extractors) {
        const extLoc = ext.location;
        const extPos = {
            x: Math.floor(extLoc.x),
            y: Math.floor(extLoc.y),
            z: Math.floor(extLoc.z)
        };

        const block = dimension.getBlock(extPos);
        const face = block.permutation.getState("minecraft:block_face");
        const faceOffset = blockFaceOffsets[face];

        if (faceOffset) {
            const bx = extPos.x + faceOffset[0];
            const by = extPos.y + faceOffset[1];
            const bz = extPos.z + faceOffset[2];
            globalBlockedTags.add(`tan:[${bx},${by},${bz}]`);
            globalBlockedTags.add(`ent:[${bx},${by},${bz}]`);
        }
    }

    for (const ext of extractors) {
        const oldTags = ext.getTags().filter(tag => tag.startsWith("tan:") || tag.startsWith("ent:"));
        for (const tag of oldTags) ext.removeTag(tag);

        for (const tag of outputs) {
            if (globalBlockedTags.has(tag)) continue;
            ext.addTag(tag);
        }
    }
}

function openMenu({ x, y, z }, block, player) {
    let menu = new ActionFormData()
    const entity = block.dimension.getEntitiesAtBlockLocation(block.location)[0]
    let state = entity.getDynamicProperty('twm:whitelistOn')

    menu.title('Filter')

    if (state) {
        menu.button(`Whitelist Mode \n(Click to Change)`, 'textures/items/whitelist.png')
    } else {
        menu.button(`Blacklist Mode \n(Click to Change)`, 'textures/items/blacklist.png')

    }

    menu.button(`Add item \n(Adds the item in your Mainhand)`)

    const acceptedItems = entity.getTags().filter(tag => tag.startsWith("filt:"));

    if (acceptedItems) {
        for (let item of acceptedItems) {
            menu.button(`${formatId(item)}`)
        }
    }

    menu.show(player)
        .then(result => {
            let selection = result.selection
            if (selection == undefined) return;

            if (selection == 0) {
                entity.setDynamicProperty('twm:whitelistOn', !state)
                openMenu({ x, y, z }, block, player)
                return
            }

            if (selection == 1) {
                const mainHand = player.getComponent('equippable').getEquipment('Mainhand')
                if (mainHand) {
                    entity.addTag(`filt:${mainHand.typeId}`)
                }
                return
            }
            entity.removeTag(`${acceptedItems[selection - 2]}`)
            openMenu({ x, y, z }, block, player)
        })
}

function formatId(id) {
    // Elimina el prefijo (antes de los dos puntos)
    const parts = id.split(':');
    const name = parts[2]

    // Reemplaza guiones bajos con espacios y capitaliza cada palabra
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}