@echo off
chcp 65001 > nul
title Sistema Escolar - I.E.D. Maria Currea Manrique
echo ================================================================
echo    INICIANDO SISTEMA ESCOLAR - I.E.D. MARIA CURREA MANRIQUE    
echo ================================================================
echo.
echo Verificando Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
    echo Por favor instale Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo Iniciando servidor web institucional...
start http://localhost:3000
node server.js
pause
