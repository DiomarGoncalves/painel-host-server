import { msg } from './utils.js'

function addSurroundingPosTags(entity, baseX, baseY, baseZ) {
    const directions = [
        [1, 0, 0], // East
        [-1, 0, 0], // West
        [0, 1, 0], // Up
        [0, -1, 0], // Down
        [0, 0, 1], // South
        [0, 0, -1]  // North
    ];

    for (const [dx, dy, dz] of directions) {
        const x = baseX + dx;
        const y = baseY + dy;
        const z = baseZ + dz;
        entity.addTag(`pos:[${x},${y},${z}]`);
    }
}

function transferEnergyToEnergyContainers(block, entity, speed, energy) {
    if (energy <= 0) return 0;
    const posTags = entity.getTags().filter(tag =>
        tag.startsWith("pos:[") || tag.startsWith("net:[")
    );
    const isBattery = block.typeId.includes('battery');

    for (const tag of posTags) {
        const raw = tag.slice(5, -1); // Remove "pos:[" and "]"
        const [x, y, z] = raw.split(",").map(Number);
        const location = { x, y, z };

        const machine = block.dimension.getEntitiesAtBlockLocation(location)[0];
        if (!machine) continue;

        const typeFamily = machine.getComponent("minecraft:type_family");
        if (!typeFamily?.hasTypeFamily("dorios:energy_container")) continue;

        if (isBattery && typeFamily.hasTypeFamily("dorios:battery")) continue;

        let machineEnergy = machine.getDynamicProperty("twm:energy");
        let machineEnergyCap = machine.getDynamicProperty("twm:energyCap");

        if (machineEnergy == null || machineEnergyCap == null) continue;

        const transferable = Math.min(speed, machineEnergyCap - machineEnergy, energy);

        if (transferable > 0) {
            machine.setDynamicProperty("twm:energy", machineEnergy + transferable);
            energy -= transferable;
        }
    }

    return energy; // Remaining energy after transfer
}

export { addSurroundingPosTags, transferEnergyToEnergyContainers }