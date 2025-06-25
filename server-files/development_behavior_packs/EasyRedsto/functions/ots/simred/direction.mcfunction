#entity run this
tag @s add ots_simred_spawn

tp @s[ry=0,rym=-45] ~ ~ ~ 0 0
tp @s[ry=-45,rym=-135] ~ ~ ~ -90 0
tp @s[ry=-135,rym=-180] ~ ~ ~ -180 0
tp @s[ry=180,rym=135] ~ ~ ~ 180 0
tp @s[ry=135,rym=45] ~ ~ ~ 90 0
tp @s[ry=45,rym=0] ~ ~ ~ 0 0
tp @s[family=ots_simred:redstone] ~ ~-0.5 ~

execute at @s[ry=0,rym=0] run event entity @s ots_simred:direction.south
execute at @s[ry=90,rym=90] run event entity @s ots_simred:direction.west
execute at @s[ry=-90,rym=-90] run event entity @s ots_simred:direction.east
execute at @s[ry=-180,rym=-180] run event entity @s ots_simred:direction.north

execute at @s[ry=0,rym=0] run event entity @s ots_simred:structure.border.xyz.0
execute at @s[ry=90,rym=90] run event entity @s ots_simred:structure.border.xyz.1
execute at @s[ry=-90,rym=-90] run event entity @s ots_simred:structure.border.xyz.1
execute at @s[ry=-180,rym=-180] run event entity @s ots_simred:structure.border.xyz.0

execute at @s[family=ots_simred:structure] at @e[family=ots_simred:structure,tag=!ots_simred_spawn,r=0.5] run event entity @s ots_simred:drop

tag @s remove ots_simred_spawn