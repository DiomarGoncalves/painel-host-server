import os

class ServerPropertiesManager:
    def __init__(self, server_path):
        self.server_path = server_path
        self.properties_file = os.path.join(server_path, "server.properties")
    
    def load_properties(self):
        """Carregar propriedades do arquivo server.properties"""
        properties = {}
        
        if not os.path.exists(self.properties_file):
            raise FileNotFoundError("Arquivo server.properties não encontrado")
        
        with open(self.properties_file, 'r', encoding='utf-8') as file:
            for line in file:
                line = line.strip()
                
                # Ignorar comentários e linhas vazias
                if line.startswith('#') or not line:
                    continue
                
                # Separar chave e valor
                if '=' in line:
                    key, value = line.split('=', 1)
                    properties[key.strip()] = value.strip()
        
        return properties
    
    def save_properties(self, new_properties):
        """Salvar propriedades no arquivo server.properties"""
        if not os.path.exists(self.properties_file):
            raise FileNotFoundError("Arquivo server.properties não encontrado")
        
        # Ler arquivo original para preservar comentários e ordem
        lines = []
        with open(self.properties_file, 'r', encoding='utf-8') as file:
            lines = file.readlines()
        
        # Atualizar linhas existentes
        updated_keys = set()
        for i, line in enumerate(lines):
            stripped_line = line.strip()
            
            # Pular comentários e linhas vazias
            if stripped_line.startswith('#') or not stripped_line:
                continue
            
            # Atualizar propriedade existente
            if '=' in stripped_line:
                key = stripped_line.split('=', 1)[0].strip()
                if key in new_properties:
                    lines[i] = f"{key}={new_properties[key]}\n"
                    updated_keys.add(key)
        
        # Adicionar novas propriedades que não existiam
        for key, value in new_properties.items():
            if key not in updated_keys:
                lines.append(f"{key}={value}\n")
        
        # Salvar arquivo
        with open(self.properties_file, 'w', encoding='utf-8') as file:
            file.writelines(lines)
    
    def get_property(self, key):
        """Obter valor de uma propriedade específica"""
        properties = self.load_properties()
        return properties.get(key)
    
    def set_property(self, key, value):
        """Definir valor de uma propriedade específica"""
        properties = self.load_properties()
        properties[key] = str(value)
        self.save_properties(properties)