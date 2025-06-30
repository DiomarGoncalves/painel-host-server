@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo  Instalando dependências do projeto
echo ========================================
echo.

REM Verifica se o Python está disponível
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Python não encontrado no PATH!
    echo Instale o Python 3.11+ e tente novamente.
    pause
    exit /b 1
)

REM Verifica se o pip está disponível
python -m pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] pip não encontrado!
    echo Instalando pip...
    python -m ensurepip --upgrade
)

REM Instala as dependências do projeto
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar as dependências!
    echo Instale manualmente com:
    echo    pip install -r requirements.txt
    pause
    exit /b 1
)

echo.
echo [OK] Dependências instaladas com sucesso!
pause
