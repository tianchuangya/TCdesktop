@echo off
setlocal
cd /d "%~dp0"

set "TOOLS_DIR=%~dp0..\.tools"
set "LOCAL_NODE_DIR=%TOOLS_DIR%\node"

if exist "%LOCAL_NODE_DIR%\node.exe" if exist "%LOCAL_NODE_DIR%\npm.cmd" (
  set "PATH=%LOCAL_NODE_DIR%;%PATH%"
  set "npm_config_cache=%TOOLS_DIR%\npm-cache"
  set "ELECTRON_CACHE=%TOOLS_DIR%\electron-cache"
)

where node.exe >nul 2>&1
if errorlevel 1 goto missing_node
where npm.cmd >nul 2>&1
if errorlevel 1 goto missing_node

set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
if not exist node_modules\electron\dist\electron.exe call npm.cmd install
if not exist node_modules\electron\dist\electron.exe if exist node_modules\electron\install.js call node.exe node_modules\electron\install.js
if exist node_modules\electron\dist\electron.exe goto electron

echo Electron runtime download failed. Opening the interaction preview in Microsoft Edge.
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" "%~dp0src\index.html"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" "%~dp0src\index.html"
) else (
  start "" "%~dp0src\index.html"
)
pause
exit /b 1

:missing_node
echo.
echo TCdesktop could not find Node.js and npm.
echo Expected portable tools in: "%LOCAL_NODE_DIR%"
echo.
pause
exit /b 1

:electron
call npm.cmd start
set "ORBITDESK_EXIT_CODE=%ERRORLEVEL%"
if not "%ORBITDESK_EXIT_CODE%"=="0" (
  echo.
  echo TCdesktop failed to start. Exit code: %ORBITDESK_EXIT_CODE%
  echo.
  pause
)
exit /b %ORBITDESK_EXIT_CODE%
