import { world, ItemStack, system } from "@minecraft/server";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";

function ots_simred_player() {
    world.afterEvents.playerSpawn.subscribe((event) => {
        const { player, initialSpawn } = event;

        const guidebook = player.getDynamicProperty("ots_simred:guidebook")
        const airPass = player.getDynamicProperty("ots_simred:air_pass")
        
        /*world.sendMessage(`air_pass: ${airPass}`)
        world.sendMessage(`guidebook: ${guidebook}`)*/

        if (!initialSpawn) return;

        if (guidebook === undefined) {
            player.dimension.spawnItem(new ItemStack("ots_simred:guidebook"), player.location)
            player.setDynamicProperty("ots_simred:guidebook", true)
        }
        if (airPass === undefined) {
            player.setDynamicProperty("ots_simred:air_pass", false)
        }

        //give recipe
        player.runCommand("recipe give @s ots_simred:guidebook");
        player.runCommand("recipe give @s ots_simred:structure");
        ///////////////////////
    })
}

function ots_simred_guidebook() {
    world.afterEvents.itemUse.subscribe((event) => {
        const player = event.source
        const item = event.itemStack

        const closeSound = `playsound pickup.chiseled_bookshelf @s ~ ~ ~ 1 ${Math.random() * (0, 0.25) + 0.75}`
        /////////////////////////////////////////////////////////////////////////////
        function showGuidebookForm() {
            const form = new ActionFormData()
                .title({ translate: 'ots_simred:form.guidebook.main.title' })
                //.body({ translate: 'ots_simred:form.guidebook.main.body', with: ['\n'] })
                .button({ translate: 'ots_simred:form.guidebook.intro.title' }, "textures/ots/simred/icon/icon_intro")
                .button({ translate: 'ots_simred:form.guidebook.redstone.title' }, "textures/ots/simred/icon/icon_redstone")
                .button({ translate: 'ots_simred:form.guidebook.setting.title' }, "textures/ots/simred/icon/icon_addon")
                .button({ translate: 'ots_simred:form.guidebook.debug.title' }, "textures/ots/simred/icon/icon_debug")
                .button({ translate: 'ots_simred:form.guidebook.log.title' }, "textures/ots/simred/icon/icon_log")

            form.show(player).then(r => {
                if (r.canceled) {
                    player.runCommand(closeSound)
                    return;
                }
                switch (r.selection) {
                    case 0:
                        showIntroduceForm()
                        break;
                    case 1:
                        showListRedstoneForm()
                        break;
                    case 2:
                        showAddonSettingMainForm()
                        break;
                    case 3:
                        showDebugForm()
                        break;
                    case 4:
                        showChangelogForm()
                        break;
                }
            });
        }
        /////////////////////////////////////////////////////////////////////////////
        function showIntroduceForm() {
            const form = new ActionFormData()
                .title({ translate: 'ots_simred:form.guidebook.intro.title' })
                .body({ translate: 'ots_simred:form.guidebook.intro.body', with: ['\n'] })
                .button({ translate: 'ots_simred:form.guidebook.back' }, "textures/ots/simred/icon/icon_back")

            form.show(player).then(r => {
                if (r.canceled) {
                    player.runCommand(closeSound)
                    return;
                }
                if (r.selection === 0) {
                    showGuidebookForm()
                }
            });
        }
        /////////////////////////////////////////////////////////////////////////////
        function showListRedstoneForm() {
            const form = new ActionFormData()
                .title({ translate: 'ots_simred:form.guidebook.redstone.title' })
                .body({ translate: 'ots_simred:form.guidebook.redstone.body', with: ['\n'] })
                .button({ translate: 'ots_simred:form.guidebook.back' }, "textures/ots/simred/icon/icon_back")

            form.show(player).then(r => {
                if (r.canceled) {
                    player.runCommand(closeSound)
                    return;
                }
                if (r.selection === 0) {
                    showGuidebookForm()
                }
            });
        }
        /////////////////////////////////////////////////////////////////////////////
        function showAddonSettingMainForm() {
            const form = new MessageFormData()
                .title({ translate: 'ots_simred:form.guidebook.setting.title' })
                .body({ translate: 'ots_simred:form.guidebook.setting.body', with: ['\n'] })
                .button1({ translate: 'ots_simred:form.guidebook.back' })
                .button2({ translate: 'ots_simred:form.guidebook.accept' });

            form.show(player).then(r => {
                if (r.canceled) {
                    player.runCommand(closeSound)
                    return;
                }
                switch (r.selection) {
                    case 0:
                        showGuidebookForm();
                        break;
                    case 1:
                        showAddonSettingForm();
                        break;
                }
            });
        }
        /////////////////////////////////////////////////////////////////////////////
        function showAddonSettingForm() {
            const airPass = player.getDynamicProperty("ots_simred:air_pass")

            const form = new ModalFormData()
                .title({ translate: 'ots_simred:form.guidebook.setting.title' })
                .toggle({ translate: 'ots_simred:form.guidebook.setting.air' }, airPass)
                .submitButton({ translate: 'ots_simred:form.setting.apply' })

            form.show(player).then(r => {
                if (r.canceled) {
                    player.runCommand(closeSound)
                    return
                } else {
                    const toggle = r.formValues;
                    const rawtext = { translate: 'ots_simred:text.settings' };
                    player.onScreenDisplay.setActionBar(rawtext)
                    player.setDynamicProperty("ots_simred:air_pass", toggle[0])
                    player.runCommand(`playsound ominous_item_spawner.spawn_item_begin @s ^ ^ ^ 1 ${Math.random() * (0, 0.25) + 1.25}`)
                    player.runCommand(`playsound trial_spawner.close_shutter @s ~ ~ ~ 0.5 ${Math.random() * (0, 0.25) + 0.75}`)
                }
            });
        }
        /////////////////////////////////////////////////////////////////////////////
        function showDebugForm() {
            const form = new MessageFormData()
                .title({ translate: 'ots_simred:form.guidebook.debug.title' })
                .body({ translate: 'ots_simred:form.guidebook.debug.body', with: ['\n'] })
                .button1({ translate: 'ots_simred:form.guidebook.back' })
                .button2({ translate: 'ots_simred:form.guidebook.accept' });

            form.show(player).then(r => {
                if (r.canceled) {
                    player.runCommand(closeSound)
                    return;
                }
                switch (r.selection) {
                    case 0:
                        showGuidebookForm();
                        break;
                    case 1:
                        handleDebug();
                        break;
                }
            });
        }
        /////////////////////////////////////////////////////////////////////////////
        function handleDebug() {
            const rawtext = { translate: 'ots_simred:form.guidebook.debug.done' };
            player.onScreenDisplay.setActionBar(rawtext)
            player.runCommand("event entity @e ots_simred:structure.ui.default")
            player.runCommand(`playsound trial_spawner.close_shutter @s ~ ~ ~ 0.5 ${Math.random() * (0, 0.25) + 0.75}`)
            player.runCommand(`playsound block.lantern.break @a ~ ~ ~ 0.5 ${Math.random() * (-0.1, 0.1) + 0.25}`)
            player.runCommand(`playsound block.scaffolding.break @a ~ ~ ~ 0.75 ${Math.random() * (-0.1, 0.1) + 0.5}`)
            
            /*const strlist = world.structureManager.getWorldStructureIds();
            strlist.forEach((structureId) => {
                if (structureId.startsWith("ots_simred:")) {
                    world.sendMessage(`Found structure: ${structureId}`);
                }
            })*/
        }
        /////////////////////////////////////////////////////////////////////////////
        function showChangelogForm() {
            const form = new ActionFormData()
                .title({ translate: 'ots_simred:form.guidebook.log.title' })
                .body({ translate: 'ots_simred:form.guidebook.log.body', with: ['\n'] })
                .button({ translate: 'ots_simred:form.guidebook.back' }, "textures/ots/simred/icon/icon_back")

            form.show(player).then(r => {
                if (r.canceled) {
                    player.runCommand(closeSound)
                    return;
                }
                if (r.selection === 0) {
                    showGuidebookForm()
                }
            });
        }
        /////////////////////////////////////////////////////////////////////////////
        if (item.typeId === "ots_simred:guidebook") {
            player.runCommand(`playsound item.book.page_turn @s ~ ~ ~ 0.5 ${Math.random() * (0, 0.25) + 1.25}`)
            showGuidebookForm()
        }
    })
}

ots_simred_guidebook()
ots_simred_player()
export { ots_simred_guidebook, ots_simred_player }