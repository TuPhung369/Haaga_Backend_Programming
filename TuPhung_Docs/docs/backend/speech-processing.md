﻿﻿---
sidebar_position: 5
---

# Speech Processing with SpeechBrain

## Overview

The Haaga Backend Programming project integrates advanced speech processing capabilities using SpeechBrain, an open-source conversational AI toolkit. This integration enables speech-to-text, text-to-speech, and language analysis features that enhance the application's accessibility and user experience.

## SpeechBrain Architecture

The speech processing module is implemented as a separate Python service that communicates with the Spring Boot backend:

```mermaid
flowchart TD
    %% Styling
    classDef backend fill:#6DB33F,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold,font-size:14px
    classDef service fill:#FF6347,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold,font-size:14px
    classDef model fill:#9C27B0,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold,font-size:14px
    classDef function fill:#4169E1,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold,font-size:14px
    
    %% Main components
    A[Spring Boot Backend] <--> B[SpeechBrain Service]
    
    %% Models
    subgraph "AI Models"
        C[Whisper Model]
        D[Wav2Vec2 Finnish Model]
        E[TTS Models]
    end
    
    %% Functions
    subgraph "Speech Functions"
        F[Speech-to-Text]
        G[Text-to-Speech]
        H[Language Analysis]
    end
    
    %% Connections
    B --> C
    B --> D
    B --> E
    C --> F
    D --> F
    E --> G
    B --> H
    
    %% Apply styles
    class A backend
    class B service
    class C,D,E model
    class F,G,H function
    
    %% Styling for subgraphs
    style "AI Models" fill:#f9f9f9,stroke:#999,stroke-width:1px
    style "Speech Functions" fill:#f0f0f0,stroke:#999,stroke-width:1px
```

The SpeechBrain service integrates with the Spring Boot backend and manages multiple AI models for different speech processing tasks. The Whisper and Wav2Vec2 models handle speech-to-text conversion, while the TTS models provide text-to-speech capabilities. The service also performs language analysis on the processed text.

### Key Components

- **SpeechBrain Service**: Python-based service that handles speech processing requests
- **Model Management**: Handles loading and caching of AI models
- **API Interface**: REST endpoints for communication with the Spring Boot backend
- **Audio Processing**: Utilities for audio format conversion and processing

## Speech-to-Text Capabilities

The system uses multiple models for speech-to-text conversion:

### Whisper Model

- **Implementation**: Uses Systran's Faster Whisper implementation
- **Models**: Large-v3 (primary) and Medium (fallback)
- **Features**:
  - Multilingual support (80+ languages)
  - Automatic language detection
  - Punctuation and capitalization
  - Timestamp generation for word-level alignment
  - Noise resilience

### Wav2Vec2 Finnish Model

- **Implementation**: Uses the aapot/wav2vec2-xlsr-1b-finnish-lm-v2 model
- **Features**:
  - Specialized for Finnish language recognition
  - Language model integration for improved accuracy
  - Optimized for Finnish phonetics and grammar

### Implementation Details

```python
# Example of Whisper model initialization
def initialize_whisper_model():
    model_size = "large-v3"
    model_path = os.path.join(MODELS_DIR, f"models--Systran--faster-whisper-{model_size}")

    # Check if model exists, download if needed
    if not os.path.exists(model_path):
        print(f"Downloading model {model_size}...")
        model_path = f"Systran/faster-whisper-{model_size}"

    # Load model with appropriate settings
    model = WhisperModel(
        model_path,
        device="cuda" if torch.cuda.is_available() else "cpu",
        compute_type="float16" if torch.cuda.is_available() else "int8",
        cpu_threads=4,
        num_workers=1
    )
    return model
```

## Text-to-Speech Capabilities

The system provides high-quality text-to-speech synthesis:

### TTS Models

- **Implementation**: Uses SpeechBrain's Tacotron2 and HiFi-GAN models
- **Voice Options**:
  - Male and female voices
  - Different speaking styles (neutral, formal, casual)
- **Features**:
  - Natural-sounding speech
  - Prosody control (emphasis, pauses)
  - Adjustable speaking rate
  - SSML support for advanced control

### Implementation Details

```python
# Example of TTS model initialization
def initialize_tts_models(voice_type="female"):
    # Load Tacotron2 model for text-to-spectrogram
    tacotron2 = HPARAMS_REGISTRY["tacotron2"].create_model()
    tacotron2.load_state_dict(torch.load(f"pretrained_models/tts-tacotron2-en_{voice_type}/model.pth"))
    tacotron2.eval()

    # Load HiFi-GAN model for spectrogram-to-audio
    hifigan = HPARAMS_REGISTRY["hifigan"].create_model()
    hifigan.load_state_dict(torch.load(f"pretrained_models/tts-hifigan-en_{voice_type}/model.pth"))
    hifigan.eval()

    return tacotron2, hifigan
```

## Language Analysis

The system provides language analysis capabilities:

- **Pronunciation Assessment**: Evaluates pronunciation accuracy
- **Grammar Analysis**: Identifies grammatical errors
- **Vocabulary Assessment**: Analyzes vocabulary usage and diversity
- **Fluency Measurement**: Evaluates speaking fluency and natural flow

## Integration with Spring Boot

The SpeechBrain service is integrated with the Spring Boot backend through a REST API:

### API Endpoints

- `POST /api/speech/transcribe`: Transcribe speech to text
- `POST /api/speech/synthesize`: Convert text to speech
- `POST /api/speech/analyze`: Analyze speech for language proficiency

### Communication Flow

```mermaid
sequenceDiagram
    %% Styling
    participant Client as <strong style="font-size:14px; color:#61DAFB">React Client</strong>
    participant BE as <strong style="font-size:14px; color:#6DB33F">Spring Boot Backend</strong>
    participant SB as <strong style="font-size:14px; color:#FF6347">SpeechBrain Service</strong>
    
    %% Audio upload
    rect rgb(240, 248, 255, 0.6)
        note right of Client: Audio Upload
        Client->>+BE: Upload Audio File
    end
    
    %% Processing
    rect rgb(255, 245, 238, 0.6)
        note right of BE: Audio Processing
        BE->>+SB: Forward Audio for Processing
        
        %% Self-processing
        activate SB
        SB->>SB: Process with Appropriate Model
        deactivate SB
    end
    
    %% Results
    rect rgb(240, 255, 240, 0.6)
        note right of SB: Results Delivery
        SB-->>-BE: Return Results (JSON)
        BE-->>-Client: Return Processed Results
    end
    
    %% Notes
    note over Client,BE: Frontend-Backend Communication
    note over BE,SB: Backend-SpeechBrain Integration
```

## Deployment Configuration

The SpeechBrain service can be deployed in multiple ways:

- **Embedded Mode**: Runs within the Spring Boot application using ProcessBuilder
- **Standalone Mode**: Runs as a separate service with REST API
- **Docker Mode**: Runs in a Docker container with GPU support

### Startup Script

```bash
#!/bin/bash
# start_speechbrain_service.sh
cd speechbrain
python speechbrain_service.py --port 5000 --models whisper,wav2vec2,tts
```

## Performance Considerations

- **Model Caching**: Models are loaded once and kept in memory
- **Batch Processing**: Multiple requests can be processed in batches
- **Resource Management**: Automatic scaling based on load
- **Fallback Mechanisms**: Simpler models used when resources are constrained

## Future Enhancements

Planned enhancements to the speech processing module:

- **Emotion Detection**: Identify emotions in speech
- **Speaker Diarization**: Distinguish between multiple speakers
- **Custom Voice Training**: Allow users to create custom TTS voices
- **Real-time Processing**: Enable streaming transcription for live audio

