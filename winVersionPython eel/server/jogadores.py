import json
from pathlib import Path

class PlayerManager:
    def __init__(self):
        self.server_path = None
        self.ops_file = None
        self.allowlist_file = None
    
    def set_server_path(self, path):
        """Define o caminho do servidor"""
        self.server_path = Path(path)
        self.ops_file = self.server_path / "ops.json"
        self.allowlist_file = self.server_path / "allowlist.json"
    
    def get_operators(self):
        """Lista operadores atuais"""
        if not self.ops_file:
            return {"error": "Caminho do servidor não definido"}
        
        try:
            operators = []
            
            # Ler ops.json
            if self.ops_file.exists():
                with open(self.ops_file, 'r', encoding='utf-8') as f:
                    ops_data = json.load(f)
                    
                for op in ops_data:
                    operators.append({
                        "name": op.get("name", ""),
                        "xuid": op.get("xuid", ""),
                        "level": op.get("level", 4)
                    })
            
            return {"success": True, "operators": operators}
            
        except Exception as e:
            return {"error": f"Erro ao ler operadores: {str(e)}"}
    
    def add_operator(self, nickname):
        """Adiciona um operador"""
        if not self.ops_file:
            return {"success": False, "error": "Caminho do servidor não definido"}
        
        try:
            nickname = nickname.strip()
            if not nickname:
                return {"success": False, "error": "Nome do jogador não pode estar vazio"}
            
            # Ler ops atuais
            operators = []
            if self.ops_file.exists():
                with open(self.ops_file, 'r', encoding='utf-8') as f:
                    operators = json.load(f)
            
            # Verificar se já existe
            for op in operators:
                if op.get("name", "").lower() == nickname.lower():
                    return {"success": False, "error": f"Jogador '{nickname}' já é operador"}
            
            # Adicionar novo operador
            new_operator = {
                "name": nickname,
                "xuid": "",  # XUID será preenchido automaticamente pelo servidor
                "level": 4   # Nível máximo de operador
            }
            operators.append(new_operator)
            
            # Salvar arquivo
            with open(self.ops_file, 'w', encoding='utf-8') as f:
                json.dump(operators, f, indent=2)
            
            return {
                "success": True,
                "message": f"Jogador '{nickname}' adicionado como operador"
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao adicionar operador: {str(e)}"}
    
    def remove_operator(self, nickname):
        """Remove um operador"""
        if not self.ops_file:
            return {"success": False, "error": "Caminho do servidor não definido"}
        
        try:
            if not self.ops_file.exists():
                return {"success": False, "error": "Arquivo ops.json não encontrado"}
            
            # Ler ops atuais
            with open(self.ops_file, 'r', encoding='utf-8') as f:
                operators = json.load(f)
            
            # Encontrar e remover operador
            original_count = len(operators)
            operators = [op for op in operators if op.get("name", "").lower() != nickname.lower()]
            
            if len(operators) == original_count:
                return {"success": False, "error": f"Jogador '{nickname}' não encontrado na lista de operadores"}
            
            # Salvar arquivo
            with open(self.ops_file, 'w', encoding='utf-8') as f:
                json.dump(operators, f, indent=2)
            
            return {
                "success": True,
                "message": f"Jogador '{nickname}' removido da lista de operadores"
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao remover operador: {str(e)}"}
    
    def get_allowlist(self):
        """Lista jogadores na allowlist"""
        if not self.allowlist_file:
            return {"error": "Caminho do servidor não definido"}
        
        try:
            players = []
            
            if self.allowlist_file.exists():
                with open(self.allowlist_file, 'r', encoding='utf-8') as f:
                    allowlist_data = json.load(f)
                    
                for player in allowlist_data:
                    players.append({
                        "name": player.get("name", ""),
                        "xuid": player.get("xuid", "")
                    })
            
            return {"success": True, "players": players}
            
        except Exception as e:
            return {"error": f"Erro ao ler allowlist: {str(e)}"}
    
    def add_to_allowlist(self, nickname):
        """Adiciona jogador à allowlist"""
        if not self.allowlist_file:
            return {"success": False, "error": "Caminho do servidor não definido"}
        
        try:
            nickname = nickname.strip()
            if not nickname:
                return {"success": False, "error": "Nome do jogador não pode estar vazio"}
            
            # Ler allowlist atual
            players = []
            if self.allowlist_file.exists():
                with open(self.allowlist_file, 'r', encoding='utf-8') as f:
                    players = json.load(f)
            
            # Verificar se já existe
            for player in players:
                if player.get("name", "").lower() == nickname.lower():
                    return {"success": False, "error": f"Jogador '{nickname}' já está na allowlist"}
            
            # Adicionar novo jogador
            new_player = {
                "name": nickname,
                "xuid": ""  # XUID será preenchido automaticamente
            }
            players.append(new_player)
            
            # Salvar arquivo
            with open(self.allowlist_file, 'w', encoding='utf-8') as f:
                json.dump(players, f, indent=2)
            
            return {
                "success": True,
                "message": f"Jogador '{nickname}' adicionado à allowlist"
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao adicionar à allowlist: {str(e)}"}
    
    def remove_from_allowlist(self, nickname):
        """Remove jogador da allowlist"""
        if not self.allowlist_file:
            return {"success": False, "error": "Caminho do servidor não definido"}
        
        try:
            if not self.allowlist_file.exists():
                return {"success": False, "error": "Arquivo allowlist.json não encontrado"}
            
            # Ler allowlist atual
            with open(self.allowlist_file, 'r', encoding='utf-8') as f:
                players = json.load(f)
            
            # Encontrar e remover jogador
            original_count = len(players)
            players = [player for player in players if player.get("name", "").lower() != nickname.lower()]
            
            if len(players) == original_count:
                return {"success": False, "error": f"Jogador '{nickname}' não encontrado na allowlist"}
            
            # Salvar arquivo
            with open(self.allowlist_file, 'w', encoding='utf-8') as f:
                json.dump(players, f, indent=2)
            
            return {
                "success": True,
                "message": f"Jogador '{nickname}' removido da allowlist"
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao remover da allowlist: {str(e)}"}