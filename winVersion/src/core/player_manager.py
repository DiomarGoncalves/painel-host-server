import os
import json

class PlayerManager:
    def __init__(self, server_path):
        self.server_path = server_path
        self.ops_file = os.path.join(server_path, "ops.json")
        self.permissions_file = os.path.join(server_path, "permissions.json")
    
    def list_operators(self):
        """Listar operadores atuais"""
        operators = []
        
        # Tentar carregar ops.json
        if os.path.exists(self.ops_file):
            try:
                with open(self.ops_file, 'r', encoding='utf-8') as file:
                    ops_data = json.load(file)
                
                for op in ops_data:
                    if isinstance(op, dict):
                        operators.append({
                            "name": op.get("name", ""),
                            "xuid": op.get("xuid", ""),
                            "permission": op.get("permission", 4)
                        })
                    elif isinstance(op, str):
                        # Formato simples (apenas nome)
                        operators.append({
                            "name": op,
                            "xuid": "",
                            "permission": 4
                        })
            except:
                # Arquivo corrompido, criar lista vazia
                operators = []
        
        return sorted(operators, key=lambda x: x["name"].lower())
    
    def add_operator(self, player_name, permission_level=4):
        """Adicionar novo operador"""
        if not player_name.strip():
            raise ValueError("Nome do jogador não pode estar vazio")
        
        player_name = player_name.strip()
        
        # Carregar operadores existentes
        operators = self._load_ops_file()
        
        # Verificar se já existe
        for op in operators:
            if isinstance(op, dict) and op.get("name", "").lower() == player_name.lower():
                raise ValueError(f"Jogador '{player_name}' já é operador")
            elif isinstance(op, str) and op.lower() == player_name.lower():
                raise ValueError(f"Jogador '{player_name}' já é operador")
        
        # Adicionar novo operador
        new_operator = {
            "name": player_name,
            "xuid": "",
            "permission": permission_level
        }
        
        operators.append(new_operator)
        
        # Salvar arquivo
        self._save_ops_file(operators)
    
    def remove_operator(self, player_name):
        """Remover operador"""
        if not player_name.strip():
            raise ValueError("Nome do jogador não pode estar vazio")
        
        player_name = player_name.strip()
        
        # Carregar operadores existentes
        operators = self._load_ops_file()
        
        # Filtrar operador a ser removido
        original_count = len(operators)
        operators = [
            op for op in operators
            if not (
                (isinstance(op, dict) and op.get("name", "").lower() == player_name.lower()) or
                (isinstance(op, str) and op.lower() == player_name.lower())
            )
        ]
        
        if len(operators) == original_count:
            raise ValueError(f"Jogador '{player_name}' não encontrado na lista de operadores")
        
        # Salvar arquivo
        self._save_ops_file(operators)
    
    def _load_ops_file(self):
        """Carregar arquivo ops.json"""
        if not os.path.exists(self.ops_file):
            return []
        
        try:
            with open(self.ops_file, 'r', encoding='utf-8') as file:
                return json.load(file)
        except:
            return []
    
    def _save_ops_file(self, operators):
        """Salvar arquivo ops.json"""
        try:
            with open(self.ops_file, 'w', encoding='utf-8') as file:
                json.dump(operators, file, indent=2, ensure_ascii=False)
        except Exception as e:
            raise Exception(f"Erro ao salvar arquivo ops.json: {str(e)}")
    
    def update_operator_permission(self, player_name, permission_level):
        """Atualizar nível de permissão de um operador"""
        if not player_name.strip():
            raise ValueError("Nome do jogador não pode estar vazio")
        
        if not isinstance(permission_level, int) or permission_level < 0 or permission_level > 4:
            raise ValueError("Nível de permissão deve ser um número entre 0 e 4")
        
        player_name = player_name.strip()
        
        # Carregar operadores existentes
        operators = self._load_ops_file()
        
        # Encontrar e atualizar operador
        found = False
        for i, op in enumerate(operators):
            if isinstance(op, dict) and op.get("name", "").lower() == player_name.lower():
                operators[i]["permission"] = permission_level
                found = True
                break
            elif isinstance(op, str) and op.lower() == player_name.lower():
                # Converter formato simples para formato completo
                operators[i] = {
                    "name": op,
                    "xuid": "",
                    "permission": permission_level
                }
                found = True
                break
        
        if not found:
            raise ValueError(f"Jogador '{player_name}' não encontrado na lista de operadores")
        
        # Salvar arquivo
        self._save_ops_file(operators)
    
    def is_operator(self, player_name):
        """Verificar se um jogador é operador"""
        if not player_name.strip():
            return False
        
        player_name = player_name.strip().lower()
        operators = self.list_operators()
        
        for op in operators:
            if op["name"].lower() == player_name:
                return True
        
        return False
    
    def get_operator_permission(self, player_name):
        """Obter nível de permissão de um operador"""
        if not player_name.strip():
            return None
        
        player_name = player_name.strip().lower()
        operators = self.list_operators()
        
        for op in operators:
            if op["name"].lower() == player_name:
                return op.get("permission", 4)
        
        return None