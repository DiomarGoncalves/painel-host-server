import os
import json

class PlayerManager:
    def __init__(self, server_path):
        self.server_path = server_path
        self.permissions_file = os.path.join(server_path, "permissions.json")

    def list_operators(self):
        """Listar operadores atuais do permissions.json"""
        operators = []
        if os.path.exists(self.permissions_file):
            try:
                with open(self.permissions_file, 'r', encoding='utf-8') as file:
                    perms_data = json.load(file)
                for entry in perms_data:
                    if entry.get("permission") == "operator":
                        operators.append({
                            "xuid": entry.get("xuid", ""),
                            "permission": entry.get("permission", "")
                        })
            except Exception:
                operators = []
        return operators

    def add_operator(self, xuid):
        """Adicionar novo operador pelo XUID"""
        if not xuid.strip():
            raise ValueError("XUID do jogador não pode estar vazio")
        xuid = xuid.strip()
        perms = self._load_permissions_file()
        # Verifica se já existe
        for entry in perms:
            if entry.get("xuid") == xuid and entry.get("permission") == "operator":
                raise ValueError(f"O XUID '{xuid}' já é operador")
        # Adiciona novo operador
        perms.append({
            "permission": "operator",
            "xuid": xuid
        })
        self._save_permissions_file(perms)

    def remove_operator(self, xuid):
        """Remover operador pelo XUID"""
        if not xuid.strip():
            raise ValueError("XUID do jogador não pode estar vazio")
        xuid = xuid.strip()
        perms = self._load_permissions_file()
        original_count = len(perms)
        perms = [
            entry for entry in perms
            if not (entry.get("xuid") == xuid and entry.get("permission") == "operator")
        ]
        if len(perms) == original_count:
            raise ValueError(f"O XUID '{xuid}' não encontrado como operador")
        self._save_permissions_file(perms)

    def _load_permissions_file(self):
        """Carregar arquivo permissions.json"""
        if not os.path.exists(self.permissions_file):
            return []
        try:
            with open(self.permissions_file, 'r', encoding='utf-8') as file:
                return json.load(file)
        except Exception:
            return []

    def _save_permissions_file(self, perms):
        """Salvar arquivo permissions.json"""
        try:
            with open(self.permissions_file, 'w', encoding='utf-8') as file:
                json.dump(perms, file, indent=3, ensure_ascii=False)
        except Exception as e:
            raise Exception(f"Erro ao salvar arquivo permissions.json: {str(e)}")

    def is_operator(self, xuid):
        """Verificar se um XUID é operador"""
        if not xuid.strip():
            return False
        xuid = xuid.strip()
        operators = self.list_operators()
        for op in operators:
            if op["xuid"] == xuid:
                return True
        return False

    def list_operators_with_names(self, xuid_name_map):
        """
        Listar operadores com nomes, usando um dicionário {xuid: nome}.
        Retorna lista de dicts: {"xuid": ..., "permission": ..., "name": ...}
        """
        ops = self.list_operators()
        for op in ops:
            op["name"] = xuid_name_map.get(op["xuid"], "")
        return ops

    # Métodos relacionados a nome de jogador não são possíveis sem um mapeamento XUID <-> nome.
    # Se necessário, implemente um método para buscar XUID pelo nome em outro local.

# ...restante do código, se houver...