import nbtlib

# Caminho para o level.dat
caminho = "world/level.dat"

try:
    nbt_file = nbtlib.load(caminho)
    data = nbt_file.root['Data']

    print("🗺️ Nome do Mundo:", data.get('LevelName'))
    print("🌱 Seed:", data.get('RandomSeed'))
    print("🎮 Game Mode:", data.get('GameType'))
    print("⏳ Tempo de Jogo (ticks):", data.get('DayTime'))
    spawn = data.get('SpawnPoint')
    if spawn:
        print(f"📍 Spawn: X = {spawn.get('X')}, Y = {spawn.get('Y')}, Z = {spawn.get('Z')}")

    # Gravar em um txt
    with open("informacoes_level.txt", "w", encoding="utf-8") as f:
        f.write(f"🗺️ Nome do Mundo: {data.get('LevelName')}\n")
        f.write(f"🌱 Seed: {data.get('RandomSeed')}\n")
        f.write(f"🎮 Game Mode: {data.get('GameType')}\n")
        f.write(f"⏳ Tempo de Jogo (ticks): {data.get('DayTime')}\n")
        if spawn:
            f.write(f"📍 Spawn: X = {spawn.get('X')}, Y = {spawn.get('Y')}, Z = {spawn.get('Z')}\n")

    print("\n✅ Informações salvas em 'informacoes_level.txt'")

except Exception as e:
    print("❌ Erro ao ler o arquivo level.dat:", e)
