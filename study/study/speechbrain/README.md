# Speech API Service Setup

This directory contains the necessary files to set up and run a Speech API service for Speech-to-Text (STT) and Text-to-Speech (TTS) processing. This service is integrated with the Spring Boot application to provide speech capabilities.

## Prerequisites

- Python 3.8+ installed
- pip package manager
- Internet connection for TTS service

## Files in this Directory

- `speechbrain_service.py`: The main Python script that sets up the FastAPI server with speech services
- `requirements.txt`: List of Python packages required to run the service
- `start_speechbrain_service.sh`: Shell script to set up and start the service on Linux/Mac
- `start_speechbrain_service.bat`: Batch script to set up and start the service on Windows

## Installation and Setup

### On Windows

1. Open a Command Prompt or PowerShell window
2. Navigate to this directory
3. Run the batch script:
   
```Scripts
   .\start_speechbrain_service.bat
```

4. The script will:
   - Create a Python virtual environment
   - Install required dependencies
   - Start the service on port 8008

### On Linux/Mac

1. Open a Terminal
2. Navigate to this directory
3. Make the shell script executable:
   ```
   chmod +x start_speechbrain_service.sh
   ```
4. Run the script:
   ```
   ./start_speechbrain_service.sh
   ```
5. The script will perform the same setup steps as the Windows version

## Configuration

The Speech API service uses:

- STT: Currently returns a simulated response (placeholder for your chosen ASR implementation)
- TTS: gTTS (Google Text-to-Speech) for converting text to speech in multiple languages

## API Endpoints

The service exposes the following endpoints:

- `GET /`: Basic health check
- `GET /health`: Detailed health check
- `POST /api/speech-to-text`: Convert speech audio to text
  - Parameters:
    - `file`: The audio file (form-data)
    - `language`: The language code (e.g., "en-US")
  - Returns: JSON with the transcribed text
- `POST /api/text-to-speech`: Convert text to speech
  - Parameters (JSON body):
    - `text`: The text to convert to speech
    - `language`: The language code (e.g., "en-US")
  - Returns: JSON with base64-encoded audio in MP3 format

## Troubleshooting

### Service Won't Start

- Check if Python 3.8+ is installed and in your PATH
- Ensure you have sufficient disk space
- Check that the required ports (8008 by default) are not in use

### Audio Issues

- Ensure audio files are in a supported format (WAV is recommended)
- Check that the sample rate is appropriate
- Verify that audio is not corrupted

## Integration with Spring Boot

The Spring Boot application is configured to communicate with this service via the `SpeechService` class. The API URL is configured in `application.properties` with the property `speech.service.url`.

## Note on Language Support

The TTS feature using gTTS supports multiple languages including English ("en") and many others. Simply change the language parameter in your API requests to use a different language (e.g., "en-US", "fi-FI", etc.). 