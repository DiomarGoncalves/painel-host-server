import { treecapitatorManager } from './classes/treecapitatorManager';
import { veinminerManager } from './classes/veinminerManager';
import { world, EquipmentSlot, EntityEquippableComponent } from '@minecraft/server';
world.beforeEvents.playerBreakBlock.subscribe((data) => {
    const { block, dimension, itemStack, player } = data;
    if (!itemStack) return;
    const mainhand = player.getComponent(EntityEquippableComponent.componentId).getEquipmentSlot(EquipmentSlot.Mainhand);
    const item = mainhand.getItem();
    if (!item) return;
    if (!player.isSneaking) return;
    if (item.hasTag("minecraft:is_pickaxe")) {
        if (veinminerManager.oreIDs.includes(block.typeId)) {
            veinminerManager.start(player, block, item, mainhand);
        }
    }
});
