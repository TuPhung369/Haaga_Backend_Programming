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

# Speech Service with Finnish Language Support

This service provides Speech-to-Text (STT) and Text-to-Speech (TTS) capabilities with enhanced support for Finnish language using advanced AI models.

## Features

- **Speech-to-Text (STT)**: 
  - English: Browser Web Speech API, Whisper, SpeechBrain
  - Finnish: OpenAI Whisper (optimized for Finnish)
  
- **Text-to-Speech (TTS)**:
  - English: SpeechBrain, Browser voices, gTTS
  - Finnish: Google Text-to-Speech (gTTS)

## Setup

1. Install the required dependencies:
   ```
   python install_dependencies.py
   ```

2. Start the service:
   ```
   python speechbrain_service.py
   ```

3. The service will run at http://localhost:8008

## Finnish Language Support

### Speech-to-Text (STT)
Finnish speech recognition is powered by OpenAI's Whisper model, which provides excellent results for Finnish language. When using the VoiceRecorder component with `language="fi-FI"`, it automatically:

1. Detects Finnish language setting
2. Disables browser-based recognition (which is poor for Finnish)
3. Uses Whisper through the Python backend for transcription

### Text-to-Speech (TTS)
Finnish text-to-speech is handled by Google Text-to-Speech (gTTS), which produces natural-sounding Finnish speech. When using `convertTextToSpeech` with `language="fi-FI"`:

1. The system selects the appropriate language code for Finnish
2. Renders speech with proper Finnish pronunciation
3. Allows speed adjustment for normal or slow speech

## API Endpoints

### Speech-to-Text
```
POST /api/speech-to-text
Form data:
  - file: Audio file (WAV format)
  - language: Language code (e.g., "fi-FI")
```

### Text-to-Speech
```
POST /api/text-to-speech
JSON body:
  - text: Text to synthesize
  - language: Language code (e.g., "fi-FI")
  - voice: Voice ID (e.g., "finnish-neutral")
  - speed: Speech rate (default: 1.0)
```

### Other Endpoints
- `GET /api/supported-languages` - Lists all supported languages with their capabilities
- `GET /api/supported-voices` - Lists all available voice options
- `GET /health` - Service health check

## Frontend Integration

The speech service is automatically used by the VoiceRecorder component and the SpeechService.ts functions without any additional configuration. Simply set the `language` prop to "fi-FI" to activate Finnish language support:

```typescript
// For voice recording with Finnish support
<VoiceRecorder 
  language="fi-FI"
  onAudioRecorded={handleAudioRecorded}
  onSpeechRecognized={handleSpeechRecognized}
/>

// For text-to-speech with Finnish support
const audioUrl = await convertTextToSpeech(
  "Hyvää päivää, mitä kuuluu?", 
  "fi-FI",
  "finnish-neutral"
);
```

## Extending to Other Languages

The modular design makes it easy to add support for additional languages. To add a new language:

1. Add language configuration to LANGUAGE_CONFIG in both Python and TypeScript code
2. Specify appropriate STT and TTS technologies for the language
3. Ensure the required models are available

This architecture allows for seamless scaling to additional languages in the future. 