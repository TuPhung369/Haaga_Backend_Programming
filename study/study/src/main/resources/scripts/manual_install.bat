@echo off
echo Manual installation of dependencies for Speech API

REM Create Python virtual environment if it doesn't exist
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Display Python version
echo Python version:
python --version

REM Install each package individually
echo Installing packages individually...

echo Installing FastAPI...
pip install fastapi==0.95.2
if %ERRORLEVEL% neq 0 (
    echo Error installing FastAPI. Please check the error message above.
    pause
    exit /b 1
)

echo Installing Uvicorn...
pip install uvicorn==0.22.0
if %ERRORLEVEL% neq 0 (
    echo Error installing Uvicorn. Please check the error message above.
    pause
    exit /b 1
)

echo Installing python-multipart...
pip install python-multipart==0.0.6
if %ERRORLEVEL% neq 0 (
    echo Error installing python-multipart. Please check the error message above.
    pause
    exit /b 1
)

echo Installing pydantic...
pip install pydantic==1.10.8
if %ERRORLEVEL% neq 0 (
    echo Error installing pydantic. Please check the error message above.
    pause
    exit /b 1
)

echo Installing gTTS...
pip install gTTS==2.3.2
if %ERRORLEVEL% neq 0 (
    echo Error installing gTTS. Please check the error message above.
    pause
    exit /b 1
)

echo All dependencies installed successfully!
echo You can now run the Speech API service using:
echo python speechbrain_service.py

pause 