# Verifica se o Python está disponível
if (-not (Get-Command py -ErrorAction SilentlyContinue)) {
    Write-Output "Python não encontrado. Baixando instalador..."
    $url = "https://www.python.org/ftp/python/3.11.5/python-3.11.5-amd64.exe"
    $installer = "python_installer.exe"
    Invoke-WebRequest -Uri $url -OutFile $installer
    Write-Output "Instalando Python..."
    Start-Process -Wait .\$installer -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1 Include_tcltk=1"
    Remove-Item $installer
} else {
    Write-Output "Python já está instalado."
}

# Usa o launcher 'py' para garantir que vai funcionar mesmo sem reiniciar o PATH
py -m pip install --upgrade pip
py -m pip install eel==0.16.0 psutil==5.9.0 pyinstaller==5.13.2 pywebview==4.4.1
