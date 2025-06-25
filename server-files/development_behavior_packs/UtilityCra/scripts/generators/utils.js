import { world, ItemStack } from '@minecraft/server'
export { msg, formattedEnergy, formattedEnergyv1, formattedEnergyv2, format, formatInputsLiquids, formatLiquid, convertInfoLiquid, displayBar, displayBarv2 }

export function displayEnergy(energy, energyCap, value, inv, type, efficiency) {
    let energyP = Math.floor((energy / energyCap) * 48)
    let energyPercentage = energyP

    // Common lore
    let lore = [
        `§r§7  Stored Energy: ${formattedEnergy(energy)}/${formattedEnergy(energyCap)}`
    ]

    // Add appropriate second line depending on whether efficiency is defined
    if (efficiency !== undefined) {
        lore.push(`§r§7  Rate: ${formattedEnergy(value)}/t`)
        lore.push(`§r§7  Efficiency: ${Math.ceil(100 / efficiency)}%`)
    } else { // For machines that uses energy cost such as Harvester or Block Breaker
        lore.push(`§r§7  Energy Cost: ${formattedEnergy(value)} per block`)
    }

    // Add percentage
    lore.push(`§r§7  Percentage: ${Math.floor((energy / energyCap) * 10000) / 100}%`)

    // Generate bar items
    for (let i = 0; i <= 2; i++) {
        energyPercentage = Math.max(0, Math.min(16, energyP - 16 * i))
        let energyBar = new ItemStack(`twm:${type}_bar_${energyPercentage}`)
        energyBar.setLore(lore)
        inv.setItem(i, energyBar)
    }
}

function format(str) {
    const cut = str.split(':')[1]
    const formatted = cut
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    return formatted;
}

function msg(str) {
    world.sendMessage(`${str}`)
}

function formattedEnergy(value) {
    let unit = 'DE';
    if (value >= 1e12) {
        unit = 'TDE';
        value /= 1e12;
    } else if (value >= 1e9) {
        unit = 'GDE';
        value /= 1e9;
    } else if (value >= 1e6) {
        unit = 'MDE';
        value /= 1e6;
    } else if (value >= 1e3) {
        unit = 'kDE';
        value /= 1e3;
    }
    return value + ' ' + unit;
}

function formattedEnergyv1(input, num) {
    const cleaned = input.split(' ')[num]
    const prefix = input.split(' ')[num + 1]
    let multiplier = 1;
    if (prefix.includes('kDE')) {
        multiplier = 1e3;
    }
    if (prefix.includes('MDE')) {
        multiplier = 1e6;
    }
    if (prefix.includes('GDE')) {
        multiplier = 1e9;
    }
    if (prefix.includes('TDE')) {
        multiplier = 1e12;
    }
    return parseFloat(cleaned) * multiplier;;

}

function formattedEnergyv2(input) {
    const cleaned = input.split('/')[1].split(' ')[0]
    let multiplier = 1;
    if (input.includes('kDE')) {
        multiplier = 1e3;
    }
    if (input.includes('MDE')) {
        multiplier = 1e6;
    }
    if (input.includes('GDE')) {
        multiplier = 1e9;
    }
    if (input.includes('TDE')) {
        multiplier = 1e12;
    }
    return parseFloat(cleaned) * multiplier;;

}

function convertInfoLiquid(input, num) {
    const cleaned = input.split(' ')[num]
    const prefix = input.split(' ')[num + 1]
    let multiplier = 1;
    if (prefix.includes('kB')) {
        multiplier = 1e3;
    }
    if (prefix.includes('MB')) {
        multiplier = 1e6;
    }
    const energy = parseFloat(cleaned) * multiplier;
    return energy;
}

function formatLiquid(value) {
    let unit = 'mB';
    if (value >= 1e15) {
        unit = 'GB';
        value /= 1e12;
    } else if (value >= 1e12) {
        unit = 'MB';
        value /= 1e9;
    } else if (value >= 1e9) {
        unit = 'kB';
        value /= 1e6;
    } else if (value >= 1e6) {
        unit = 'B';
        value /= 1e3;
    }
    return value.toFixed(1) + ' ' + unit;
}

function formatInputsLiquids(input1, input2) {
    const formattedInput1 = formatLiquid(input1);
    const formattedInput2 = formatLiquid(input2);

    return `${formattedInput1}/${formattedInput2}`;
}

export function transferItems(block, inv, i, o) {

    // Define slots to transfer, if they are not defined, last slot will be output\
    let start, end; start = end = inv.size - 1;
    if (i && o) { start = i; end = o }

    // Starting Point
    let { x, y, z } = block.location;
    [x, y, z] = [x + 0.5, y + 0.25, z + 0.5];

    // Facing direction
    const facingOffsets = { up: [0, -1, 0], down: [0, 1, 0], north: [0, 0, 1], south: [0, 0, -1], west: [1, 0, 0], east: [-1, 0, 0] };
    const facing = facingOffsets[block.permutation.getState('minecraft:facing_direction')];
    if (facing) [x, y, z] = [x + facing[0], y + facing[1], z + facing[2]];

    // Getting the next block
    const blockPos = { x, y, z };
    const nextBlock = block.dimension.getBlock(blockPos)

    // If theres no next block return
    if (!nextBlock) return
    if (nextBlock.typeId == 'minecraft:air') return

    // Start the transfer Section
    for (let i = start; i <= end; i++) {
        let itemToTransfer = inv.getItem(i)
        if (!itemToTransfer) continue
        // Drawers Section
        if (nextBlock.typeId.includes('dustveyn:storage_drawers')) {
            const targetEnt = block.dimension.getEntitiesAtBlockLocation(nextBlock.location)[0];
            if (!targetEnt.hasTag(`${itemToTransfer.typeId}`)) continue
            const targetId = targetEnt.scoreboardIdentity
            let capacity = world.scoreboard.getObjective("capacity").getScore(targetId)
            let max_capacity = world.scoreboard.getObjective("max_capacity").getScore(targetId)
            if (capacity < max_capacity) {
                let amount = Math.min(itemToTransfer.amount, max_capacity - capacity)
                itemToTransfer.amount > amount ? itemToTransfer.amount -= amount : itemToTransfer = undefined;
                inv.setItem(i, itemToTransfer);
                targetEnt.runCommandAsync(`scoreboard players add @s capacity ${amount}`);
            }
            return
        }
        const blockInv = nextBlock.getComponent('minecraft:inventory')?.container;
        const nextEntity = block.dimension.getEntitiesAtBlockLocation(blockPos)[0]
        const entityInv = nextEntity?.getComponent('minecraft:inventory')?.container;
        if (!blockInv && !entityInv) return

        if (blockInv?.emptySlotsCount > 0) {
            inv.transferItem(i, blockInv);
            continue
        }

        if (entityInv) {
            // Simple container: Only accepts items at slot 3
            if (nextEntity.getComponent("minecraft:type_family")?.hasTypeFamily("dorios:simple_container")) {
                const slotNext = entityInv.getItem(3);
                if (!slotNext) {
                    inv.transferItem(i, entityInv);
                    continue
                }
                if (itemToTransfer.typeId == slotNext.typeId && slotNext.amount < 64) {
                    const amount = Math.min(itemToTransfer.amount, 64 - slotNext.amount);
                    entityInv.addItem(new ItemStack(itemToTransfer.typeId, amount));
                    itemToTransfer.amount > amount ? itemToTransfer.amount -= amount : itemToTransfer = undefined;
                    inv.setItem(i, itemToTransfer);
                }
                continue
            }
            // Assemblers shouldnt accept new items if it has less than 2 empty slots, it could cause filling the output
            if (nextEntity?.typeId == 'twm:assembler' && entityInv.emptySlotsCount < 2) return
            // Normal entities
            if (entityInv.emptySlotsCount > 0) {
                inv.transferItem(i, entityInv);
                continue
            }
        }
    }
}

export function returnFunction(entity, block, inv, slot) {
    entity.setDynamicProperty('twm:progress', 0);
    block?.setPermutation(block?.permutation.withState('twm:on', false))
    inv.setItem(slot, new ItemStack(`twm:arrow_right_0`));
}










function displayBar(energy, energyCap, transferSpeed, inv, type, efficiency) {
    // Display the energy level
    let energyP = Math.floor((energy / energyCap) * 48)
    let energyPercentage = energyP
    let lore = [
        `§r§7  Stored Energy: ${formattedEnergy(energy)}/${formattedEnergy(energyCap)}`,
        `§r§7  Rate: ${formattedEnergy(transferSpeed)}/t`
    ]
    if (efficiency) lore.push(`§r§7  Efficiency: ${Math.ceil(100 / efficiency)}%`)
    lore.push(`§r§7  Percentage: ${Math.floor((energy / energyCap) * 10000) / 100}%`)
    // Energy bar display
    for (let i = 0; i <= 2; i++) {
        energyPercentage = energyP - 16 * i
        if (energyPercentage < 0) energyPercentage = 0
        if (energyPercentage > 16) energyPercentage = 16
        let energyBar = new ItemStack(`twm:${type}_bar_${energyPercentage}`)
        energyBar.setLore(lore)
        inv.setItem(i, energyBar)
    }
}

function displayBarv2(energy, energyCap, energyCost, inv, type) {
    // Display the energy level
    let energyP = Math.floor((energy / energyCap) * 48)
    let energyPercentage = energyP

    // Energy bar display
    for (let i = 0; i <= 2; i++) {
        energyPercentage = energyP - 16 * i
        if (energyPercentage < 0) energyPercentage = 0
        if (energyPercentage > 16) energyPercentage = 16
        let energyBar = new ItemStack(`twm:${type}_bar_${energyPercentage}`)
        energyBar.setLore([
            `§r§7  Stored Energy: ${formattedEnergy(energy)}/${formattedEnergy(energyCap)}`,
            `§r§7  Energy Cost: ${formattedEnergy(energyCost)} per block`,
            `§r§7  Percentage: ${Math.floor((energy / energyCap) * 10000) / 100}%`
        ])
        inv.setItem(i, energyBar)
    }
}
