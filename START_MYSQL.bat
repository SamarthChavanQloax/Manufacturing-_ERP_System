@echo off
echo Starting MySQL80 service...
net start MySQL80
if %errorlevel%==0 (
    echo.
    echo ✓ MySQL80 started successfully!
) else (
    echo.
    echo ✗ Failed to start MySQL80. Error code: %errorlevel%
)
echo.
pause
