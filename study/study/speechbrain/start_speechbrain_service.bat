@echo off
echo Starting SpeechBrain service setup...

REM Create Python virtual environment if it doesn't exist
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Start the SpeechBrain service
echo Starting SpeechBrain service...
python speechbrain_service.py

pause 