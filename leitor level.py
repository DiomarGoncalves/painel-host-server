import nbtlib
from nbtlib import File
import os

# Caminho do level.dat
caminho = "world/level.dat"  # substitua pelo caminho correto do seu mundo

# Verifica se o arquivo existe
if not os.path.isfile(caminho):
    print(f"Arquivo '{caminho}' não encontrado.")
    exit(1)

# Carrega o level.dat
try:
    nbt_file = File.load(caminho)
except Exception as e:
    print("Erro ao ler o arquivo level.dat:", e)
    exit(1)

# Acesso ao conteúdo do level.dat
dados = nbt_file.root

# Converte os dados para uma string legível
texto = str(dados.pretty(indent=2))

# Salva no arquivo .txt
with open("informacoes_level.txt", "w", encoding="utf-8") as f:
    f.write(texto)

print("Informações salvas em 'informacoes_level.txt'")
