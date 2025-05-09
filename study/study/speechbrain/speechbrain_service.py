from fastapi import (
    FastAPI,
    File,
    UploadFile,
    Form,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    Request,
)
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import base64
import os
import tempfile
import logging
import warnings
from gtts import gTTS
import io
import uuid
import time
import sys
import platform
from typing import List, Optional, Dict, Any, Set
import functools
import threading
from collections import deque
import subprocess

# Filter out specific warnings - use more aggressive approach
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

# Completely silence all transformers output
import logging
import os

# Set environment variable to disable transformers warnings
os.environ["TRANSFORMERS_VERBOSITY"] = "error"

# Silence all loggers
logging.getLogger("transformers").setLevel(logging.ERROR)
logging.getLogger("huggingface").setLevel(logging.ERROR)
logging.getLogger("datasets").setLevel(logging.ERROR)

# Import Wav2Vec2 module for Finnish
try:
    # Redirect stdout to suppress warnings during import
    import sys
    import io

    original_stdout = sys.stdout
    sys.stdout = io.StringIO()

    try:
        from wav2vec2_finnish import (
            transcribe_audio_with_wav2vec2,
            test_wav2vec2,
            is_model_downloaded,
            is_model_in_memory,
            clean_incomplete_model,
        )

        wav2vec2_available = True
        wav2vec2_model_downloaded = is_model_downloaded()
        wav2vec2_model_in_memory = is_model_in_memory()
        logger = logging.getLogger(__name__)
        logger.info(
            f"Wav2Vec2 module for Finnish is available, model downloaded: {wav2vec2_model_downloaded}, model in memory: {wav2vec2_model_in_memory}"
        )
    finally:
        # Restore stdout
        sys.stdout = original_stdout
except ImportError as e:
    wav2vec2_available = False
    wav2vec2_model_downloaded = False
    wav2vec2_model_in_memory = False
    logger = logging.getLogger(__name__)
    logger.warning(f"Wav2Vec2 module for Finnish is not available: {e}")

# Add faster-whisper import
try:
    from faster_whisper import WhisperModel

    faster_whisper_available = True
    logging.info("Successfully initialized faster-whisper")
except ImportError:
    faster_whisper_available = False
    logging.warning(
        "faster-whisper not available. Install with: pip install faster-whisper"
    )

# Handle missing speechbrain components
speechbrain_tts_available = False
speechbrain_available = False  # Add this for STT
try:
    from speechbrain.inference import Tacotron2
    from speechbrain.inference import HIFIGAN

    speechbrain_tts_available = True
    speechbrain_available = True  # Set to True if SpeechBrain is available
    logging.info("Successfully loaded SpeechBrain TTS modules")
except ImportError:
    logging.warning(
        "SpeechBrain TTS modules not available. Some features will be limited."
    )

import torch
import torchaudio
import re
from pydub import AudioSegment
import numpy as np
import librosa
import soundfile as sf
from scipy import signal
import asyncio
from tempfile import NamedTemporaryFile
import importlib.util

# Check if running on Windows
IS_WINDOWS = platform.system() == "Windows"

# Try to import pyttsx3 on Windows
pyttsx3_available = False
if IS_WINDOWS:
    try:
        import pyttsx3

        pyttsx3_available = True
        logging.info("Successfully initialized pyttsx3")
    except ImportError:
        logging.warning("pyttsx3 not available. Install with: pip install pyttsx3")

# Check if whisper is available
whisper_available = False
try:
    import whisper

    whisper_available = True
    logging.info("Successfully initialized OpenAI Whisper")
except ImportError:
    logging.warning(
        "OpenAI Whisper not available. Install with: pip install openai-whisper"
    )


# Configure logging with custom filter
class WarningFilter(logging.Filter):
    def filter(self, record):
        # Filter out specific warning messages
        if record.levelname == "WARNING":
            msg = record.getMessage()
            if (
                "Some weights of the model checkpoint" in msg
                or "were not used when initializing" in msg
            ):
                return False
        return True


logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)
logger.addFilter(WarningFilter())

# Also filter transformers logger
transformers_logger = logging.getLogger("transformers")
transformers_logger.addFilter(WarningFilter())

# Add lifespan context manager for startup/shutdown events
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app):
    # Startup code - runs before the application starts
    # Preload Wav2Vec2 model for Finnish if available
    if wav2vec2_available:
        try:
            # Check if model is already downloaded and complete
            if wav2vec2_model_downloaded:
                logger.info("Wav2Vec2 Finnish model already downloaded, skipping test")
            else:
                # Try to clean incomplete model if needed
                clean_incomplete_model()

                # Test and load the model only if not already downloaded
                # Redirect stdout to suppress warnings during model loading
                import sys
                import io

                original_stdout = sys.stdout
                sys.stdout = io.StringIO()

                try:
                    test_result = test_wav2vec2()
                    if test_result:
                        logger.info(
                            "Wav2Vec2 Finnish model loaded successfully during startup"
                        )
                    else:
                        logger.warning(
                            "Failed to load Wav2Vec2 Finnish model during startup"
                        )
                finally:
                    # Restore stdout
                    sys.stdout = original_stdout
        except Exception as e:
            logger.error(f"Error loading Wav2Vec2 model during startup: {str(e)}")

    yield  # This is where the application runs

    # Shutdown code - runs when the application is shutting down


app = FastAPI(
    title="Speech API",
    description="API for Speech-to-Text and Text-to-Speech with multilingual support",
    lifespan=lifespan,
)

# Allow more origins to fix CORS issues
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    expose_headers=["Content-Length"],
    max_age=86400,
)


logger.info(
    "CORS middleware configured with: allow_origins=['http://localhost:3000', 'http://127.0.0.1:3000', '*']"
)

os.makedirs("models", exist_ok=True)
language_sessions = {}
language_interactions = []
tacotron2_models = {}
hifigan_models = {}

# Add model cache for Whisper
whisper_models = {}
# Add cache for faster-whisper model
faster_whisper_model = None
# Add a cache for recent results to avoid duplicate processing
recent_transcriptions = deque(maxlen=50)
# Create a mutex for whisper model access
whisper_mutex = threading.RLock()
faster_whisper_mutex = threading.RLock()

# Add a global set to track active WebSocket connections
active_connections: Set[WebSocket] = set()


class TTSRequest(BaseModel):
    text: str
    language: str = "en-US"
    voice: str = "david-en-us"
    speed: float = 1.0


class AIResponseRequest(BaseModel):
    message: str
    language: str = "en-US"
    userId: str = "guest"
    proficiencyLevel: str = "intermediate"


class LanguageSessionRequest(BaseModel):
    userId: str
    language: str
    proficiencyLevel: str


class LanguageInteractionRequest(BaseModel):
    sessionId: str
    userMessage: str
    aiResponse: str
    audioUrl: str
    timestamp: Optional[float] = None


class LanguageProficiencyRequest(BaseModel):
    userId: str
    language: str


# Language-specific configuration for models
LANGUAGE_CONFIG = {
    "en-US": {
        "code": "en",
        "stt_models": ["whisper", "speechbrain"],
        "tts_models": ["speechbrain", "gtts"],
        "whisper_size": "base",  # base is a good balance for English
        "timeout": 60,  # 60 seconds timeout for English
    },
    "fi-FI": {
        "code": "fi",
        "stt_models": [
            "wav2vec2-finnish",  # Use specialized Finnish model as first choice
            "faster-whisper",
            "whisper",
        ],  # Prefer wav2vec2-finnish for Finnish
        "tts_models": ["gtts"],  # Using gTTS for Finnish as requested
        "whisper_size": "medium",  # medium is better for Finnish
        "timeout": 120,  # Increase timeout to 120 seconds for Finnish
    },
    "vi-VN": {
        "code": "vi",
        "stt_models": [
            "whisper",
            "faster-whisper",
        ],  # Prefer faster-whisper for Vietnamese
        "tts_models": ["gtts"],  # Using gTTS for Vietnamese
        "whisper_size": "medium",  # medium is better for Vietnamese
        "timeout": 120,  # 120 seconds timeout for Vietnamese
    },
}


# Function to check if model is already downloaded locally
def is_model_downloaded_locally(model_name):
    """Check if a model is already downloaded locally"""
    if model_name == "wav2vec2-finnish":
        return wav2vec2_model_downloaded
    elif model_name == "faster-whisper":
        # Check if faster-whisper model is downloaded
        model_dir = os.path.join(os.getcwd(), "models", "faster-whisper")
        return os.path.exists(model_dir)
    elif model_name == "whisper":
        # Check if whisper model is downloaded
        return len(whisper_models) > 0

    return False


# Add a helper function to enable caching of recent transcriptions
def get_audio_hash(audio_data, language):
    """Create a simple hash of audio data for caching purposes"""
    import hashlib

    if isinstance(audio_data, bytes):
        h = hashlib.md5(audio_data).hexdigest()
    else:
        # For file paths
        try:
            with open(audio_data, "rb") as f:
                first_kb = f.read(1024)  # Just use first KB for quicker hashing
                h = hashlib.md5(first_kb).hexdigest()
        except:
            h = str(hash(audio_data))
    return f"{h}-{language}"


def get_whisper_model(model_size: str = "base"):
    """Load or retrieve Whisper model from cache"""
    global whisper_models

    with whisper_mutex:
        if model_size not in whisper_models:
            if not whisper_available:
                logger.warning("Whisper is not available, can't load model")
                return None

            logger.info(f"Loading Whisper {model_size} model")
            try:
                whisper_models[model_size] = whisper.load_model(model_size)
                logger.info(f"Whisper {model_size} model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load Whisper model: {str(e)}")
                return None

        return whisper_models[model_size]


# Add function to get or initialize faster-whisper model
def get_faster_whisper_model(model_size: str = "large-v3"):
    """Load or retrieve faster-whisper model"""
    global faster_whisper_model

    with faster_whisper_mutex:
        if faster_whisper_model is None:
            if not faster_whisper_available:
                logger.warning("faster-whisper is not available, can't load model")
                return None

            logger.info(f"Loading faster-whisper {model_size} model")
            try:
                # Initialize with CUDA if available, or fall back to CPU
                device = "cuda" if torch.cuda.is_available() else "cpu"
                compute_type = "float16" if device == "cuda" else "int8"

                # Force model to use float32 for processing to avoid double/float64 issues
                faster_whisper_model = WhisperModel(
                    model_size,
                    device=device,
                    compute_type=compute_type,
                    download_root="./models",  # Cache models locally
                    local_files_only=False,  # Allow downloading if needed
                    cpu_threads=4,  # Set reasonable number of CPU threads
                    num_workers=2,  # Set reasonable number of workers for better performance
                )

                logger.info(
                    f"faster-whisper {model_size} model loaded successfully on {device} with compute type {compute_type}"
                )
            except Exception as e:
                logger.error(f"Failed to load faster-whisper model: {str(e)}")
                return None

        return faster_whisper_model


def get_tts_models(language="en", voice="neutral"):
    """Load TTS models and return voice parameters"""
    # If SpeechBrain TTS is not available, return default parameters
    if not speechbrain_tts_available:
        logging.warning("SpeechBrain TTS not available, returning default parameters")
        return None, None, 0, 1.0

    model_key = f"{language}_{voice}"

    voice_config = {
        "neutral": {"pitch_shift": 0, "base_speed": 1},
        "male": {"pitch_shift": -5, "base_speed": 1},
        "female": {"pitch_shift": 5, "base_speed": 1},
    }

    config = voice_config.get(voice, voice_config["neutral"])

    if model_key in tacotron2_models:
        hifi_key = f"{language}_hifigan"
        if hifi_key in hifigan_models:
            return (
                tacotron2_models[model_key],
                hifigan_models[hifi_key],
                config["pitch_shift"],
                config["base_speed"],
            )

    tacotron2_source = "speechbrain/tts-tacotron2-ljspeech"
    hifigan_source = "speechbrain/tts-hifigan-ljspeech"

    try:
        tacotron2 = Tacotron2.from_hparams(
            source=tacotron2_source,
            savedir=f"pretrained_models/tts-tacotron2-{model_key}",
            run_opts={"device": "cpu"},
        )

        hifi_key = f"{language}_hifigan"
        if hifi_key not in hifigan_models:
            hifigan = HIFIGAN.from_hparams(
                source=hifigan_source,
                savedir=f"pretrained_models/tts-hifigan-{language}",
                run_opts={"device": "cpu"},
            )
            hifigan_models[hifi_key] = hifigan
        else:
            hifigan = hifigan_models[hifi_key]

        tacotron2_models[model_key] = tacotron2

        return tacotron2, hifigan, config["pitch_shift"], config["base_speed"]

    except Exception as e:
        logger.error(f"Failed to load SpeechBrain models: {str(e)}")
        return None, None, 0, 1.0


def pydub_speed_change(
    waveform: np.ndarray, speed_factor: float, sample_rate=22050
) -> np.ndarray:
    try:
        if abs(speed_factor - 1.0) < 0.01:
            return waveform

        if speed_factor > 3.0:
            logger.warning(f"Speed factor too high ({speed_factor}), limiting to 3.0")
            speed_factor = 3.0
        elif speed_factor < 0.3:
            logger.warning(f"Speed factor too low ({speed_factor}), increasing to 0.3")
            speed_factor = 0.3

        if waveform.dtype == np.float32:
            waveform_int = (waveform * 32767).astype(np.int16)
        else:
            waveform_int = waveform.astype(np.int16)

        audio = AudioSegment(
            waveform_int.tobytes(),
            frame_rate=sample_rate,
            sample_width=2,
            channels=1,
        )

        new_frame_rate = int(audio.frame_rate * speed_factor)

        speed_changed = audio._spawn(
            audio.raw_data, overrides={"frame_rate": new_frame_rate}
        ).set_frame_rate(sample_rate)

        samples = np.array(speed_changed.get_array_of_samples())
        return samples.astype(np.float32) / 32767.0

    except Exception as e:
        logger.error(f"PyDub speed change failed: {str(e)}")
        return waveform


async def get_system_voices():
    """Get available voices using pyttsx3"""
    voice_list = []

    # Use pyttsx3 on Windows
    if pyttsx3_available:
        try:
            engine = pyttsx3.init()
            voices = engine.getProperty("voices")

            for idx, voice in enumerate(voices):
                voice_info = {
                    "id": voice.id,
                    "name": voice.name,
                    "language": voice.languages[0] if voice.languages else "unknown",
                    "gender": "Unknown",
                }
                voice_list.append(voice_info)

            return voice_list
        except Exception as e:
            logger.error(f"Error getting voices via pyttsx3: {str(e)}")

    return voice_list


async def generate_audio_with_pyttsx3(text, voice_id="david-en-us", speed=1.0):
    """Generate audio using pyttsx3 with the specified voice ID and speed"""
    if not pyttsx3_available:
        return None, "pyttsx3 is not available"

    try:
        import pyttsx3

        engine = pyttsx3.init()

        # Log available voices
        voices = engine.getProperty("voices")
        for i, v in enumerate(voices):
            logger.info(f"Voice {i}: {v.name} ({v.id})")

        # Find matching voice
        found_voice = None
        voice_name = voice_id.split("-")[0].lower()  # e.g., "david", "zira"

        for v in voices:
            if voice_name in v.name.lower():
                found_voice = v
                break

        if found_voice:
            engine.setProperty("voice", found_voice.id)

        # Set speech rate (adjust the multiplier as needed)
        rate = int(180 * speed)  # 180 is a default rate for pyttsx3
        engine.setProperty("rate", rate)

        # Create a temporary file
        temp_wav = f"temp_{uuid.uuid4()}.wav"
        engine.save_to_file(text, temp_wav)
        engine.runAndWait()

        # Check if file was created
        if os.path.exists(temp_wav):
            file_size = os.path.getsize(temp_wav)

            # Convert to MP3
            audio = AudioSegment.from_wav(temp_wav)
            mp3_buffer = io.BytesIO()
            audio.export(mp3_buffer, format="mp3", bitrate="128k")
            mp3_buffer.seek(0)

            # Clean up
            try:
                os.remove(temp_wav)
            except Exception as e:
                logger.warning(f"Failed to delete temp file {temp_wav}: {str(e)}")

            return base64.b64encode(mp3_buffer.read()).decode("utf-8"), None
        else:
            logger.error(f"pyttsx3 failed to create audio file: {temp_wav}")
            return None, "Failed to create audio file with pyttsx3"

    except Exception as e:
        logger.error(f"pyttsx3 audio generation failed: {str(e)}")
        return None, f"Audio generation failed: {str(e)}"


async def generate_audio_with_gtts(text, language="fi-FI", speed=1.0):
    """Generate audio using Google Text-to-Speech with specific language support"""
    try:
        # Get language code
        lang_config = LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG["en-US"])
        lang_code = lang_config["code"]

        logger.info(
            f"Generating gTTS audio for language: {language}, text: {text[:50]}..."
        )

        # Create gTTS object
        tts = gTTS(text=text, lang=lang_code, slow=(speed < 0.9))

        # Save to buffer
        mp3_buffer = io.BytesIO()
        tts.write_to_fp(mp3_buffer)
        mp3_buffer.seek(0)

        # If speed is different from normal and not "slow" mode
        if abs(speed - 1.0) > 0.1 and speed >= 0.9:
            # We need to adjust speed manually since gTTS only has "slow" mode
            # First convert to AudioSegment
            mp3_buffer.seek(0)
            audio = AudioSegment.from_file(mp3_buffer, format="mp3")

            # Change speed
            speed_factor = 1.0 / speed  # Inverse because we're changing playback speed
            audio_adjusted = audio._spawn(
                audio.raw_data,
                overrides={"frame_rate": int(audio.frame_rate * speed_factor)},
            ).set_frame_rate(audio.frame_rate)

            # Export back to buffer
            adjusted_buffer = io.BytesIO()
            audio_adjusted.export(adjusted_buffer, format="mp3", bitrate="128k")
            adjusted_buffer.seek(0)

            return base64.b64encode(adjusted_buffer.read()).decode("utf-8"), None

        return base64.b64encode(mp3_buffer.read()).decode("utf-8"), None

    except Exception as e:
        logger.error(f"gTTS audio generation failed: {str(e)}")
        return None, f"Audio generation failed: {str(e)}"


@app.get("/api/system-voices")
async def get_system_voices_endpoint():
    """Return detailed list of all system voices"""
    voices = await get_system_voices()
    return [
        {
            "id": v["id"],
            "name": v["name"],
            "language": v["language"],
            "gender": v["gender"],
            "source": "system",
        }
        for v in voices
    ]


def update_supported_voices_with_system_info():
    """Update the frontend voice list with information from the system voices"""
    frontend_voices = [
        {"id": "neutral", "name": "Neutral", "description": "SpeechBrain neural voice"},
        {"id": "david-en-us", "name": "David", "description": "M-English"},
        {"id": "zira-en-us", "name": "Zira", "description": "FM-English"},
        {
            "id": "finnish-neutral",
            "name": "Finnish",
            "description": "Google TTS Finnish voice",
        },
        # These are legacy mappings
        {"id": "male", "name": "Male", "description": "Maps to David"},
        {"id": "female", "name": "Female", "description": "Maps to Zira"},
    ]

    # Get system voices
    system_voices = asyncio.run(get_system_voices())
    system_voice_names = [
        voice["name"].lower().split("-")[0].strip() for voice in system_voices
    ]

    available_voices = []
    for voice in frontend_voices:
        name = voice["name"].lower()
        is_available = False

        # Neutral is always "available" as it uses SpeechBrain or gTTS
        if name == "neutral":
            is_available = True
        # Finnish voice is available as it uses gTTS
        elif name == "finnish":
            is_available = True
        # For David and Zira, check if they're in system voices or if we have pyttsx3
        elif name in ["david", "zira", "male", "female"]:
            is_available = pyttsx3_available and any(
                name in system_name or system_name in name
                for system_name in system_voice_names
            )

        voice_with_availability = {**voice, "available": is_available}
        available_voices.append(voice_with_availability)

    return available_voices


@app.get("/api/supported-voices")
async def get_supported_voices():
    return update_supported_voices_with_system_info()


@app.get("/api/supported-languages")
async def get_supported_languages():
    """Return list of supported languages with their available technologies"""
    languages = []

    for lang_code, config in LANGUAGE_CONFIG.items():
        language_info = {
            "code": lang_code,
            "name": lang_code.split("-")[0],
            "stt_support": config["stt_models"],
            "tts_support": config["tts_models"],
            "whisper_available": whisper_available
            and "whisper" in config["stt_models"],
            "gtts_available": True,  # gTTS is always available
        }
        languages.append(language_info)

    return languages


@app.get("/")
def read_root():
    return {"status": "Speech API is running"}


@app.options("/api/debug/echo")
async def options_debug_echo():
    # Handle CORS preflight requests
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",  # 24 hours
    }
    return JSONResponse(content={}, headers=headers)


@app.post("/api/debug/echo")
async def debug_echo(request: Request):
    """Debug endpoint to echo back request information"""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Access-Control-Allow-Credentials": "true",
    }

    # Get request headers
    request_headers = dict(request.headers.items())

    # Get request body
    body = await request.body()
    body_str = (
        body.decode() if len(body) < 1000 else f"Body too large: {len(body)} bytes"
    )

    # Get form data if available
    form_data = {}
    try:
        form = await request.form()
        for key, value in form.items():
            if isinstance(value, UploadFile):
                form_data[key] = (
                    f"File: {value.filename}, size: {value.size if hasattr(value, 'size') else 'unknown'}"
                )
            else:
                form_data[key] = str(value)
    except Exception as e:
        form_data = {"error": f"Could not parse form data: {str(e)}"}

    response_data = {
        "method": request.method,
        "url": str(request.url),
        "headers": request_headers,
        "body": body_str,
        "form_data": form_data,
        "client": request.client.host if request.client else "unknown",
    }

    return JSONResponse(content=response_data, headers=headers)


@app.get("/health")
async def health_check():
    """Health check endpoint for the server status"""
    # Add CORS headers to response
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Access-Control-Allow-Credentials": "true",
    }

    whisper_model = None
    if whisper_available:
        try:
            # Try to load the base model to verify Whisper is working
            try:
                import whisper

                # Check if whisper can import correctly
                logger.info("Whisper package imported successfully")

                # Get the whisper path to check installation
                whisper_path = os.path.dirname(whisper.__file__)
                logger.info(f"Whisper installation path: {whisper_path}")

                # Verify whisper package has necessary modules
                if hasattr(whisper, "load_model"):
                    logger.info("Whisper load_model function exists")
                else:
                    logger.error("Whisper package missing load_model function")

                # Try to load the base model
                whisper_model = get_whisper_model("base")
                if whisper_model:
                    logger.info("Whisper base model loaded successfully")
            except Exception as e:
                logger.error(f"Error importing or checking whisper: {e}")
        except Exception as e:
            logger.error(f"Error loading Whisper model: {e}")

    # Check if SpeechBrain TTS is available
    speechbrain_status = "available" if speechbrain_tts_available else "unavailable"

    # Add Wav2Vec2 Finnish model status
    wav2vec2_status = {
        "available": wav2vec2_available,
        "model_downloaded": wav2vec2_model_downloaded,
        "model_in_memory": wav2vec2_model_in_memory,
        "model_path": (
            os.path.join(
                os.getcwd(),
                "models",
                "wav2vec2-finnish",
                "models--aapot--wav2vec2-xlsr-1b-finnish-lm-v2",
            )
            if wav2vec2_model_downloaded
            else None
        ),
        "model_size": "3.85GB",
        "cached": wav2vec2_available and wav2vec2_model_downloaded,
    }

    response_content = {
        "status": "ok",
        "whisper_available": whisper_available,
        "whisper_model_loaded": whisper_model is not None,
        "speechbrain_tts": speechbrain_status,
        "wav2vec2_finnish": wav2vec2_status,
    }

    return JSONResponse(content=response_content, headers=headers)


@app.post("/api/speech-to-text")
async def transcribe_speech(
    file: UploadFile = File(...),
    language: str = Form("en"),
    optimize: str = Form("false"),
    priority: str = Form("accuracy"),
    chunk_size: str = Form("0"),
):
    """
    Transcribe speech from an audio file using Whisper.
    """
    logger.info(
        f"Received request to general /api/speech-to-text endpoint with language={language}"
    )

    # Validate the file
    if not file or not file.filename:
        return {"transcript": "No file provided", "error": "missing_file"}

    # Check if file has content
    try:
        content_length = file.size
        if content_length is not None and content_length <= 0:
            return {"transcript": "Empty file provided", "error": "empty_file"}
    except:
        # Size might not be available
        pass

    # Check content type
    valid_mime_types = [
        "audio/webm",
        "audio/wav",
        "audio/mp3",
        "audio/mpeg",
        "audio/ogg",
        "application/octet-stream",
    ]
    content_type = file.content_type or ""

    # Log request details
    logger.info(
        f"File: {file.filename}, Content-Type: {content_type}, Language: {language}"
    )

    # Allow any audio content or unknown content type (treat as binary)
    if not (
        content_type.startswith("audio/") or content_type == "application/octet-stream"
    ):
        logger.warning(
            f"Unexpected content type: {content_type}, but proceeding anyway"
        )

    return await _transcribe_speech(file, language, optimize, priority, chunk_size)


@app.post("/api/speech-to-text/en")
async def transcribe_speech_english(
    file: UploadFile = File(...),
    optimize: str = Form("false"),
    priority: str = Form("accuracy"),
    chunk_size: str = Form("0"),
):
    """
    Transcribe speech from an audio file using Whisper specifically for English.
    """
    logger.info(f"Received request to English /api/speech-to-text/en endpoint")
    return await _transcribe_speech(file, "en", optimize, priority, chunk_size)


@app.options("/api/speech-to-text/fi")
@app.options("/api/speech-to-text/fi/json")
async def options_speech_to_text_finnish():
    # Handle CORS preflight requests
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",  # 24 hours
    }
    return JSONResponse(content={}, headers=headers)


@app.post("/api/speech-to-text/fi/json")
async def transcribe_speech_finnish_json(request: Request):
    """Alternative endpoint that accepts JSON with base64 encoded audio"""
    request_id = str(uuid.uuid4())[:8]
    logger.info(f"[{request_id}] Received Finnish JSON transcription request")

    # Add CORS headers to response
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Access-Control-Allow-Credentials": "true",
    }

    try:
        # Parse JSON request
        data = await request.json()
        logger.info(f"[{request_id}] Received JSON data with keys: {list(data.keys())}")

        # Extract base64 audio
        if "audio" not in data:
            return JSONResponse(
                status_code=400,
                content={
                    "transcript": "Error: No audio data provided",
                    "error": "missing_audio",
                    "success": False,
                },
                headers=headers,
            )

        # Decode base64 audio
        try:
            audio_base64 = data["audio"]
            audio_bytes = base64.b64decode(audio_base64)
            logger.info(
                f"[{request_id}] Decoded {len(audio_bytes)} bytes of audio data"
            )

            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
                temp_file_path = temp_file.name
                temp_file.write(audio_bytes)

            # Process with Finnish-specific settings
            optimize = data.get("optimize", "true")
            priority = data.get("priority", "accuracy")
            chunk_size = data.get("chunk_size", "0")

            # Convert to WAV using FFmpeg
            output_path = f"{temp_file_path}_converted.wav"
            cmd = [
                "ffmpeg",
                "-y",
                "-i",
                temp_file_path,
                "-ar",
                "16000",
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                "-fflags",
                "+discardcorrupt+genpts+igndts",
                "-err_detect",
                "ignore_err",
                output_path,
            ]

            try:
                subprocess.run(cmd, check=True, capture_output=True, text=True)
                logger.info(f"[{request_id}] Converted audio to WAV format")
            except subprocess.CalledProcessError as e:
                logger.error(f"[{request_id}] FFmpeg failed: {e.stderr}")
                return JSONResponse(
                    status_code=500,
                    content={
                        "transcript": "Error: Failed to convert audio format",
                        "error": str(e),
                        "success": False,
                    },
                    headers=headers,
                )
            finally:
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)

            # Transcribe using Whisper
            if whisper_available:
                # Use the existing _transcribe_speech function instead of undefined transcribe_with_whisper
                with open(output_path, "rb") as audio_file:
                    file_content = audio_file.read()
                    temp_upload_file = UploadFile(
                        filename=os.path.basename(output_path),
                        file=io.BytesIO(file_content),
                    )
                    result = await _transcribe_speech(
                        temp_upload_file, "fi", "true", "accuracy", "0"
                    )
                if os.path.exists(output_path):
                    os.unlink(output_path)

                if result and result.get("text", "").strip():
                    # Clean up the transcript by removing special tokens for Finnish
                    transcript = result["text"]
                    # Remove special tokens that might be present
                    transcript = transcript.replace("</s>", " ").replace("<s>", " ")
                    transcript = transcript.replace("<pad>", "").replace("<unk>", "")
                    transcript = transcript.replace("|", " ")  # Remove pipe characters
                    # Clean up extra spaces
                    transcript = " ".join(transcript.split())
                    logger.info(
                        f"[{request_id}] Cleaned Finnish JSON transcript: {transcript}"
                    )

                    return JSONResponse(
                        content={"transcript": transcript}, headers=headers
                    )

                return JSONResponse(
                    content={"transcript": "En saanut selvää puheesta."},
                    headers=headers,
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={
                        "transcript": "Whisper model unavailable.",
                        "error": "whisper_unavailable",
                        "success": False,
                    },
                    headers=headers,
                )

        except Exception as decode_error:
            logger.error(f"[{request_id}] Error decoding audio: {str(decode_error)}")
            return JSONResponse(
                status_code=400,
                content={
                    "transcript": f"Error decoding audio: {str(decode_error)}",
                    "error": str(decode_error),
                    "success": False,
                },
                headers=headers,
            )
    except Exception as e:
        logger.error(
            f"[{request_id}] Unhandled error in Finnish JSON endpoint: {str(e)}"
        )
        return JSONResponse(
            status_code=500,
            content={
                "transcript": f"Error: {str(e)}",
                "error": str(e),
                "success": False,
            },
            headers=headers,
        )


@app.post("/api/speech-to-text/fi")
async def transcribe_speech_finnish(
    file: UploadFile = File(...),
    optimize: str = Form("false"),
    priority: str = Form("accuracy"),
    chunk_size: str = Form("0"),
    language_code: str = Form("fi"),
    beam_size: str = Form("5"),
    vad_filter: str = Form("true"),
    language: str = Form("fi-FI"),  # Add language parameter to match client
):
    """
    Transcribe speech from an audio file using Whisper specifically for Finnish.
    This endpoint is simplified to match the English endpoint structure.
    """
    request_id = str(uuid.uuid4())[:8]
    logger.info(
        f"[{request_id}] Received request to Finnish /api/speech-to-text/fi endpoint"
    )
    logger.info(
        f"[{request_id}] File: {file.filename}, size: {file.size if hasattr(file, 'size') else 'unknown'}"
    )
    logger.info(
        f"[{request_id}] Parameters: optimize={optimize}, priority={priority}, chunk_size={chunk_size}"
    )
    logger.info(
        f"[{request_id}] Finnish-specific: language_code={language_code}, beam_size={beam_size}, vad_filter={vad_filter}"
    )

    # Add CORS headers to response
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Access-Control-Allow-Credentials": "true",
    }

    try:
        # Determine which model to use
        model_to_use = get_stt_model("fi-FI")
        logger.info(f"[{request_id}] Using {model_to_use} model for Finnish processing")

        # Process with the selected model
        if model_to_use == "wav2vec2-finnish" and wav2vec2_available:
            # Use Wav2Vec2 for Finnish
            logger.info(f"[{request_id}] Using specialized Wav2Vec2 model for Finnish")

            # Save and convert audio
            contents = await file.read()
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
                temp_file_path = temp_file.name
                temp_file.write(contents)

            # Convert to WAV
            output_path = f"{temp_file_path}_converted.wav"
            cmd = [
                "ffmpeg",
                "-y",
                "-i",
                temp_file_path,
                "-ar",
                "16000",
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                output_path,
            ]

            try:
                subprocess.run(cmd, check=True, capture_output=True, text=True)
            except subprocess.CalledProcessError as e:
                logger.error(f"[{request_id}] FFmpeg failed: {e.stderr}")
                os.unlink(temp_file_path)
                return JSONResponse(
                    content={"transcript": "Äänitiedoston muuntaminen epäonnistui."},
                    headers=headers,
                )
            finally:
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)

            # Use Wav2Vec2 model
            # Redirect stdout to suppress warnings during transcription
            import sys
            import io

            original_stdout = sys.stdout
            sys.stdout = io.StringIO()

            try:
                result = transcribe_audio_with_wav2vec2(output_path)
            finally:
                # Restore stdout
                sys.stdout = original_stdout

            # Clean up
            if os.path.exists(output_path):
                os.unlink(output_path)

            # Check if result indicates audio is too short
            if result and "error" in result and result["error"] == "audio_too_short":
                logger.warning(
                    f"[{request_id}] Audio file is too short for Wav2Vec2 processing"
                )
                # Return the error message directly
                return JSONResponse(
                    content={"transcript": result["text"]}, headers=headers
                )

            if result and result.get("text", "").strip():
                # Clean up the transcript by removing special tokens for Finnish
                transcript = result["text"]

                # If the transcript is already cleaned in wav2vec2_finnish.py, use it directly
                if not any(
                    token in transcript for token in ["</s>", "<s>", "<pad>", "<unk>"]
                ):
                    logger.info(
                        f"[{request_id}] Using pre-cleaned transcript: {transcript}"
                    )
                else:
                    # Remove special tokens that might be present
                    transcript = transcript.replace("</s>", " ").replace("<s>", " ")
                    transcript = transcript.replace("<pad>", "").replace("<unk>", "")
                    transcript = transcript.replace("|", " ")  # Remove pipe characters
                    # Clean up extra spaces
                    transcript = " ".join(transcript.split())
                    logger.info(
                        f"[{request_id}] Cleaned Wav2Vec2 Finnish transcript: {transcript}"
                    )

                # Check if the transcript contains only single letters with spaces (likely noise)
                import re

                if re.match(r"^(\s*[a-zA-Z]\s*)+$", transcript):
                    logger.warning(
                        f"[{request_id}] Transcript appears to be noise (single letters): {transcript}"
                    )
                    # Fall back to Whisper for noisy transcripts
                    logger.info(
                        f"[{request_id}] Falling back to Whisper for noisy transcript"
                    )
                else:
                    # Return the cleaned transcript
                    return JSONResponse(
                        content={"transcript": transcript}, headers=headers
                    )

            # Fall back to Whisper if Wav2Vec2 fails
            logger.warning(
                f"[{request_id}] Wav2Vec2 transcription failed, falling back to Whisper"
            )

        # Use Whisper as fallback
        logger.info(f"[{request_id}] Using Whisper model for Finnish processing")
        # Set priority to speed for faster processing
        priority = "speed"
        # This is the same approach used by the English endpoint
        result = await _transcribe_speech(file, "fi", optimize, priority, chunk_size)

        # Clean up the transcript by removing special tokens for Finnish
        if result and "transcript" in result:
            transcript = result["transcript"]
            # Remove special tokens that might be present
            transcript = transcript.replace("</s>", " ").replace("<s>", " ")
            transcript = transcript.replace("<pad>", "").replace("<unk>", "")
            transcript = transcript.replace("|", " ")  # Remove pipe characters
            # Clean up extra spaces
            transcript = " ".join(transcript.split())
            result["transcript"] = transcript
            logger.info(f"[{request_id}] Cleaned Finnish transcript: {transcript}")

        logger.info(
            f"[{request_id}] Finnish transcription completed successfully: {result}"
        )
        return JSONResponse(content=result, headers=headers)
    except Exception as e:
        logger.error(f"[{request_id}] Error in Finnish transcription: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "transcript": f"Virhe puheentunnistuksessa: {str(e)}",
                "error": str(e),
                "success": False,
            },
            headers=headers,
        )


@app.post("/api/speech-to-text/vi")
async def transcribe_speech_vietnamese(
    file: UploadFile = File(...),
    optimize: str = Form("false"),
    priority: str = Form("accuracy"),
    chunk_size: str = Form("0"),
    language: str = Form("vi-VN"),  # Add language parameter to match client
):
    """
    Transcribe speech from an audio file using Whisper specifically for Vietnamese.
    """
    request_id = str(uuid.uuid4())[:8]
    logger.info(
        f"[{request_id}] Received request to Vietnamese /api/speech-to-text/vi endpoint"
    )
    logger.info(
        f"[{request_id}] File: {file.filename}, size: {file.size if hasattr(file, 'size') else 'unknown'}"
    )
    logger.info(
        f"[{request_id}] Parameters: optimize={optimize}, priority={priority}, chunk_size={chunk_size}"
    )

    # Add CORS headers to response
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Access-Control-Allow-Credentials": "true",
    }

    try:
        # Use the medium model for Vietnamese for better accuracy
        result = await _transcribe_speech(file, "vi", optimize, priority, chunk_size)

        # Clean up the transcript if needed
        if result and "transcript" in result:
            transcript = result["transcript"]
            # Clean up extra spaces
            transcript = " ".join(transcript.split())
            result["transcript"] = transcript
            logger.info(f"[{request_id}] Vietnamese transcript: {transcript}")

        logger.info(f"[{request_id}] Vietnamese transcription completed successfully")
        return JSONResponse(content=result, headers=headers)
    except Exception as e:
        logger.error(f"[{request_id}] Error in Vietnamese transcription: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "transcript": f"Lỗi trong nhận dạng giọng nói: {str(e)}",
                "error": str(e),
                "success": False,
            },
            headers=headers,
        )


@app.options("/api/speech-to-text/vi")
async def options_speech_to_text_vietnamese():
    # Handle CORS preflight requests
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",  # 24 hours
    }
    return JSONResponse(content={}, headers=headers)


async def _transcribe_speech(
    file: UploadFile, language: str, optimize: str, priority: str, chunk_size: str
):
    request_id = str(uuid.uuid4())[:8]
    start_time = time.time()
    logger.info(f"[{request_id}] Processing file: {file.filename}, size: {file.size}")

    contents = await file.read()
    if len(contents) < 50:
        return {
            "transcript": (
                "Äänitiedosto on liian lyhyt."
                if language == "fi"
                else "Audio file is too short."
            )
        }

    # Save and validate audio
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
        temp_file_path = temp_file.name
        temp_file.write(contents)

    # Check if file is valid WebM
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_streams",
        "-print_format",
        "json",
        temp_file_path,
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            logger.error(f"[{request_id}] ffprobe error: {result.stderr}")
            os.unlink(temp_file_path)
            return {
                "transcript": (
                    "Äänitiedosto on viallinen."
                    if language == "fi"
                    else "Audio file is corrupted."
                )
            }
    except Exception as e:
        logger.error(f"[{request_id}] ffprobe failed: {str(e)}")
        os.unlink(temp_file_path)
        return {
            "transcript": (
                "Äänitiedoston tarkistus epäonnistui."
                if language == "fi"
                else "Audio validation failed."
            )
        }

    # Proceed with FFmpeg conversion
    output_path = f"{temp_file_path}_converted.wav"
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        temp_file_path,
        "-ar",
        "16000",
        "-ac",
        "1",
        "-c:a",
        "pcm_s16le",
        "-fflags",
        "+discardcorrupt+genpts+igndts",
        "-err_detect",
        "ignore_err",
        output_path,
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        logger.error(f"[{request_id}] FFmpeg failed: {e.stderr}")
        os.unlink(temp_file_path)
        return {
            "transcript": (
                "Äänitiedoston muuntaminen epäonnistui."
                if language == "fi"
                else "Failed to convert audio."
            )
        }
    finally:
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

    # Transcribe
    if whisper_available:
        result = transcribe_with_whisper(output_path, language)
        if os.path.exists(output_path):
            os.unlink(output_path)
        if result and result.get("text", "").strip():
            transcript = result["text"]

            # Additional cleanup for Finnish transcriptions
            if language and language.lower().startswith("fi"):
                # Remove any remaining special tokens that might have been missed
                transcript = transcript.replace("</s>", " ").replace("<s>", " ")
                transcript = transcript.replace("<pad>", "").replace("<unk>", "")
                transcript = transcript.replace("|", " ")  # Remove pipe characters
                # Clean up extra spaces
                transcript = " ".join(transcript.split())

                # Check if the transcript contains only single letters with spaces (likely noise)
                import re

                if re.match(r"^(\s*[a-zA-Z]\s*)+$", transcript) or re.match(
                    r"^(\s*[a-zA-Z0-9]\s*)+$", transcript
                ):
                    logger.warning(
                        f"[{request_id}] Transcript appears to be noise (single letters): {transcript}"
                    )
                    # Return a message for noisy transcripts
                    transcript = "En saanut selvää puheesta."

                logger.info(
                    f"[{request_id}] Final cleaned Finnish transcript: {transcript}"
                )

            return {"transcript": transcript}
        return {
            "transcript": (
                "En saanut selvää puheesta."
                if language == "fi"
                else "Couldn’t transcribe audio."
            )
        }
    return {
        "transcript": (
            "Whisper-malli ei ole käytettävissä."
            if language == "fi"
            else "Whisper model unavailable."
        )
    }


@app.post("/api/text-to-speech")
async def text_to_speech(request: TTSRequest):
    text = request.text
    language = request.language
    voice = request.voice or "david-en-us"
    speed = request.speed

    # Get language configuration
    lang_code = language.split("-")[0]
    lang_config = LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG["en-US"])

    # For legacy voice names, map to preferred voice
    if voice in ["male", "neutral"] or voice.startswith("neutral-"):
        voice = "neutral"
    elif voice in ["female", "female-en-us"]:
        voice = "zira-en-us"
    elif voice in ["male-en-us"]:
        voice = "david-en-us"

    logger.info(f"TTS request: language={language}, voice={voice}, text={text[:30]}...")

    # SCENARIO 1: Finnish language with gTTS
    if language == "fi-FI":
        audio_base64, error_message = await generate_audio_with_gtts(
            text, language, speed
        )
        if audio_base64:
            return {
                "success": True,
                "audio": audio_base64,
                "format": "mp3",
                "language": language,
                "voice": voice,
                "source": "gtts",
            }
        else:
            logger.warning(f"gTTS failed for {language}: {error_message}")
            # Fall through to general gTTS section as fallback

    # SCENARIO 2: David or Zira voices using pyttsx3 on Windows (for English)
    if voice in ["david-en-us", "zira-en-us"] and pyttsx3_available:
        audio_base64, error_message = await generate_audio_with_pyttsx3(
            text, voice, speed
        )
        if audio_base64:
            return {
                "success": True,
                "audio": audio_base64,
                "format": "mp3",
                "language": language,
                "voice": voice,
                "source": "pyttsx3",
            }
        else:
            logger.warning(f"pyttsx3 failed for {voice}: {error_message}")
            # Fall through to next method

    # SCENARIO 3: Neutral voice using SpeechBrain (for English)
    if (
        voice == "neutral"
        and "speechbrain" in lang_config["tts_models"]
        and speechbrain_tts_available
    ):
        # Try SpeechBrain for neutral voice
        MAX_CHARS_FOR_SPEECHBRAIN = 2000
        if len(text) <= MAX_CHARS_FOR_SPEECHBRAIN:
            tacotron2, hifigan, pitch_shift, base_speed = get_tts_models(
                lang_code, "neutral"
            )

            if tacotron2 and hifigan:
                try:
                    with torch.no_grad():
                        waveform = process_long_text(text, tacotron2, hifigan)

                    if waveform is None:
                        raise ValueError("Failed to generate waveform")

                    final_speed = base_speed * speed
                    if abs(final_speed - 1.0) > 0.01:
                        try:
                            waveform_np = waveform.squeeze().numpy()
                            speed_adjusted = pydub_speed_change(
                                waveform_np, final_speed
                            )
                            waveform = torch.from_numpy(speed_adjusted).unsqueeze(0)
                        except Exception as e:
                            logger.error(f"Speed adjustment failed: {str(e)}")

                    if waveform.dim() == 3:
                        waveform = waveform.squeeze(0)
                    elif waveform.dim() == 1:
                        waveform = waveform.unsqueeze(0)

                    buffer = io.BytesIO()
                    torchaudio.save(buffer, waveform.cpu(), 22050, format="wav")
                    buffer.seek(0)
                    audio = AudioSegment.from_wav(buffer)
                    mp3_buffer = io.BytesIO()
                    audio.export(mp3_buffer, format="mp3", bitrate="128k")
                    mp3_buffer.seek(0)
                    audio_base64 = base64.b64encode(mp3_buffer.read()).decode("utf-8")

                    logger.info(
                        "SpeechBrain TTS completed successfully for neutral voice"
                    )
                    return {
                        "success": True,
                        "audio": audio_base64,
                        "format": "mp3",
                        "language": language,
                        "voice": voice,
                        "source": "speechbrain",
                    }
                except Exception as e:
                    logger.error(f"SpeechBrain TTS failed: {str(e)}")
                    # Continue to gTTS fallback

    # FALLBACK FOR ALL SCENARIOS: gTTS
    logger.info(f"Falling back to gTTS for language: {language}, voice: {voice}")
    try:
        gtts_lang = language
        # Ensure language code is compatible with gTTS
        if len(gtts_lang) > 2 and "-" in gtts_lang:
            gtts_lang = gtts_lang.split("-")[0]

        tts = gTTS(text=text, lang=gtts_lang)
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        audio_base64 = base64.b64encode(mp3_fp.read()).decode("utf-8")
        return {
            "success": True,
            "audio": audio_base64,
            "format": "mp3",
            "language": language,
            "voice": voice,
            "source": "gtts",
        }
    except Exception as e:
        logger.error(f"gTTS fallback failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")


def process_long_text(text, tacotron2, hifigan):
    if not speechbrain_tts_available:
        logger.warning("SpeechBrain TTS not available, cannot process text")
        return None

    sentences = re.split(r"(?<=[.!?])\s+", text)
    all_waveforms = []
    sample_rate = 22050
    silence = torch.zeros(int(0.3 * sample_rate))

    for i, sentence in enumerate(sentences):
        if not sentence.strip():
            continue
        try:
            mel_outputs, mel_lengths, _ = tacotron2.encode_text(sentence)
            waveforms = hifigan.decode_batch(mel_outputs)
            waveform_slice = waveforms[0].squeeze(0).squeeze(0)
            all_waveforms.append(waveform_slice)
            if i < len(sentences) - 1:
                all_waveforms.append(silence)
        except Exception as e:
            logger.warning(f"Failed to process sentence: {sentence}. Error: {str(e)}")
            continue

    if all_waveforms:
        try:
            combined = torch.cat(all_waveforms, dim=0)
            return combined.unsqueeze(0)
        except Exception as e:
            logger.error(f"Failed to combine waveforms: {str(e)}")
    return None


@app.post("/api/ai-response")
async def ai_response(request: AIResponseRequest):
    try:
        time.sleep(0.5)
        ai_response = f"Simulated AI response for {request.language} practice."
        return {"response": ai_response, "language": request.language}
    except Exception as e:
        logger.error(f"Error in AI response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI response failed: {str(e)}")


@app.post("/api/language-sessions")
async def create_language_session(request: LanguageSessionRequest):
    try:
        session_id = f"session-{uuid.uuid4()}"
        language_sessions[session_id] = {
            "id": session_id,
            "userId": request.userId,
            "language": request.language,
            "proficiencyLevel": request.proficiencyLevel,
            "createdAt": time.time(),
        }
        return {
            "id": session_id,
            "userId": request.userId,
            "language": request.language,
            "proficiencyLevel": request.proficiencyLevel,
        }
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Session creation failed: {str(e)}"
        )


@app.get("/api/language-sessions/{userId}")
async def get_language_sessions(userId: str):
    try:
        user_sessions = [s for s in language_sessions.values() if s["userId"] == userId]
        return user_sessions if user_sessions else []
    except Exception as e:
        logger.error(f"Error fetching sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fetch sessions failed: {str(e)}")


@app.post("/api/language-ai/interactions")
async def save_language_interaction(request: LanguageInteractionRequest):
    try:
        interaction_id = f"interaction-{uuid.uuid4()}"
        interaction = {
            "id": interaction_id,
            "sessionId": request.sessionId,
            "userMessage": request.userMessage,
            "aiResponse": request.aiResponse,
            "audioUrl": request.audioUrl,
            "timestamp": request.timestamp or time.time(),
        }
        language_interactions.append(interaction)
        return {
            "id": interaction_id,
            "sessionId": request.sessionId,
            "timestamp": interaction["timestamp"],
        }
    except Exception as e:
        logger.error(f"Error saving interaction: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Save interaction failed: {str(e)}"
        )


@app.get("/api/language-ai/interactions/{sessionId}")
async def get_language_interactions(sessionId: str):
    try:
        session_interactions = [
            i for i in language_interactions if i["sessionId"] == sessionId
        ]
        session_interactions.sort(key=lambda x: x["timestamp"])
        return session_interactions
    except Exception as e:
        logger.error(f"Error fetching interactions: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Fetch interactions failed: {str(e)}"
        )


@app.get("/api/users/{userId}/language-proficiency")
async def get_language_proficiency(userId: str, language: Optional[str] = None):
    try:
        proficiency_levels = [
            "beginner",
            "intermediate",
            "advanced",
            "fluent",
            "native",
        ]
        if language:
            return {
                "userId": userId,
                "language": language,
                "level": "intermediate",
                "lastUpdated": time.time(),
            }
        languages = ["en-US", "fi-FI", "fr-FR", "de-DE", "es-ES"]
        return [
            {
                "userId": userId,
                "language": lang,
                "level": proficiency_levels[
                    languages.index(lang) % len(proficiency_levels)
                ],
                "lastUpdated": time.time(),
            }
            for lang in languages
        ]
    except Exception as e:
        logger.error(f"Error fetching proficiency: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Fetch proficiency failed: {str(e)}"
        )


# Replace existing WebSocket endpoint for Finnish transcription with optimized version
@app.websocket("/ws/finnish")
async def websocket_finnish(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)

    logger.info("WebSocket connection established for Finnish transcription")

    # Get configuration from client
    config = None
    try:
        config = await asyncio.wait_for(websocket.receive_json(), timeout=5.0)
        logger.info(f"Received client configuration: {config}")
    except Exception as e:
        logger.warning(f"No initial config received: {str(e)}")
        config = {"language": "fi"}

    language = "fi"
    # Make sure to parse chunk_size_limit as an integer
    chunk_size_limit = int(config.get("chunkSize", 50000))  # Default 50KB limit

    await handle_websocket_transcription(websocket, language, chunk_size_limit)


@app.websocket("/ws/english")
async def websocket_english(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)

    logger.info("WebSocket connection established for English transcription")

    # Get configuration from client
    config = None
    try:
        config = await asyncio.wait_for(websocket.receive_json(), timeout=5.0)
        logger.info(f"Received client configuration: {config}")
    except Exception as e:
        logger.warning(f"No initial config received: {str(e)}")
        config = {"language": "en"}

    language = "en"
    # Make sure to parse chunk_size_limit as an integer
    chunk_size_limit = int(config.get("chunkSize", 50000))  # Default 50KB limit

    await handle_websocket_transcription(websocket, language, chunk_size_limit)


@app.websocket("/ws/vietnamese")
async def websocket_vietnamese(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)

    logger.info("WebSocket connection established for Vietnamese transcription")

    # Get configuration from client
    config = None
    try:
        config = await asyncio.wait_for(websocket.receive_json(), timeout=5.0)
        logger.info(f"Received client configuration: {config}")
    except Exception as e:
        logger.warning(f"No initial config received: {str(e)}")
        config = {"language": "vi"}

    language = "vi"
    # Make sure to parse chunk_size_limit as an integer
    chunk_size_limit = int(config.get("chunkSize", 50000))  # Default 50KB limit

    await handle_websocket_transcription(websocket, language, chunk_size_limit)


async def handle_websocket_transcription(
    websocket: WebSocket, language: str, chunk_size_limit: int
):
    """
    Shared handler for WebSocket-based speech recognition for different languages.
    """
    logger.info(
        f"WebSocket configured with language={language}, chunk_size_limit={chunk_size_limit}"
    )

    # Determine which model to use based on language
    use_faster_whisper = True
    model_size = "medium"  # "large-v3" base

    if language == "en":
        # For English, we can use a smaller model for better performance
        model_size = "medium" if faster_whisper_available else "small"
    elif language == "fi":  # Finnish language
        # Use smaller model for Finnish to improve speed
        model_size = "small" if faster_whisper_available else "tiny"
    else:  # Other languages
        model_size = "medium" if faster_whisper_available else "small"

    # Get faster-whisper model if available
    model = None
    if faster_whisper_available and use_faster_whisper:
        model = get_faster_whisper_model(model_size)

    # Fall back to standard whisper if needed
    if model is None:
        # Use appropriate model size based on language
        if language == "fi":
            whisper_size = "tiny"  # Use tiny model for Finnish for faster processing
        elif language == "en":
            whisper_size = "small"  # Use small model for English
        else:
            whisper_size = "small"  # Use small model for other languages
        model = get_whisper_model(whisper_size)

    if model is None:
        await websocket.close(code=1011, reason="No transcription model available")
        active_connections.remove(websocket)
        return

    try:
        while True:
            # Receive binary audio chunk
            try:
                audio_chunk = await websocket.receive_bytes()
                chunk_size = len(audio_chunk)
                logger.info(
                    f"Received {language} WebSocket audio chunk: {chunk_size} bytes"
                )

                # Send immediate acknowledgment to client
                await websocket.send_json(
                    {"status": "chunk_received", "size": chunk_size}
                )

                # Skip processing if chunk is too small or empty
                if chunk_size < 1000:
                    await websocket.send_json({"status": "need_more_audio"})
                    continue

                # Limit chunk size for faster processing
                if chunk_size > chunk_size_limit:
                    logger.info(
                        f"Limiting chunk size from {chunk_size} to {chunk_size_limit} bytes"
                    )
                    audio_chunk = audio_chunk[:chunk_size_limit]
            except WebSocketDisconnect:
                logger.info(f"{language} WebSocket disconnected during receive")
                break
            except Exception as e:
                logger.error(f"Error receiving WebSocket data: {str(e)}")
                try:
                    await websocket.send_json({"error": "Failed to receive audio data"})
                except:
                    # If we can't send a message, the connection is probably closed
                    logger.error(
                        "Failed to send error message, connection may be closed"
                    )
                    break
                continue

            # Skip processing if chunk is too small
            if len(audio_chunk) < 4000:  # At least 0.25s of audio @ 16kHz
                await websocket.send_json({"status": "need_more_audio"})
                continue

            try:
                # Save audio chunk to temporary file to ensure it can be processed correctly
                with tempfile.NamedTemporaryFile(
                    suffix=".webm", delete=False
                ) as temp_file:
                    temp_file_path = temp_file.name
                    temp_file.write(audio_chunk)

                # Process with faster-whisper if available
                if faster_whisper_available and isinstance(model, WhisperModel):
                    try:
                        # Convert WebM to WAV using ffmpeg for better compatibility
                        wav_path = f"{temp_file_path}.wav"

                        # Use FFmpeg to convert WebM to WAV
                        cmd = [
                            "ffmpeg",
                            "-y",
                            "-i",
                            temp_file_path,
                            "-ar",
                            "16000",
                            "-ac",
                            "1",
                            "-c:a",
                            "pcm_s16le",
                            "-fflags",
                            "+discardcorrupt+genpts+igndts",
                            "-err_detect",
                            "ignore_err",
                            wav_path,
                        ]

                        try:
                            logger.info(
                                f"Converting WebM to WAV for {language} WebSocket processing"
                            )
                            process = subprocess.run(
                                cmd, capture_output=True, text=True
                            )

                            if process.returncode != 0:
                                logger.warning(
                                    f"FFmpeg conversion error: {process.stderr}"
                                )
                                # Try to process the original WebM file
                            else:
                                logger.info(
                                    f"Successfully converted to WAV: {wav_path}"
                                )
                                # Use the WAV file instead of the WebM
                                temp_file_path = wav_path
                        except Exception as e:
                            logger.warning(f"FFmpeg conversion failed: {str(e)}")
                            # Continue with original file

                        # First try to load with soundfile as it's faster
                        try:
                            import soundfile as sf

                            audio_np, sr = sf.read(temp_file_path)

                            # Explicitly ensure audio is float32 type
                            if hasattr(audio_np, "astype"):
                                audio_np = audio_np.astype(np.float32)
                            else:
                                # Handle case where audio_np is a tuple
                                audio_np = np.array(audio_np[0], dtype=np.float32)

                            # Resample if needed
                            if sr != 16000:
                                from scipy import signal

                                resampled = signal.resample(
                                    audio_np, int(len(audio_np) * 16000 / sr)
                                )
                                # Handle potential tuple return from resample
                                try:
                                    # Try to convert directly to float32
                                    audio_np = np.array(resampled, dtype=np.float32)
                                except Exception as e:
                                    logger.warning(
                                        f"Error converting resampled audio: {str(e)}"
                                    )
                                    # Handle case where resampled is a tuple
                                    if isinstance(resampled, tuple):
                                        audio_np = np.array(
                                            resampled[0], dtype=np.float32
                                        )
                                    else:
                                        # Last resort - try to make it work somehow
                                        audio_np = np.array(
                                            resampled, dtype=np.float32, copy=True
                                        )
                                sr = 16000
                            logger.info(
                                f"Loaded {language} WebSocket audio with soundfile: {len(audio_np)} samples, dtype: {audio_np.dtype}"
                            )
                        except Exception as sf_error:
                            logger.warning(
                                f"Soundfile loading failed: {str(sf_error)}, trying librosa"
                            )
                            # Fall back to librosa

                            import librosa

                            audio_np, sr = librosa.load(
                                temp_file_path,
                                sr=16000,
                                mono=True,
                                dtype=np.float32,  # Explicitly request float32
                            )
                            logger.info(
                                f"Loaded {language} WebSocket audio with librosa: {len(audio_np)} samples, dtype: {audio_np.dtype}"
                            )

                        # If still no audio data, try raw numpy conversion
                        if len(audio_np) == 0 or sr == 0:
                            logger.warning(
                                "Audio loading produced empty array, trying direct conversion"
                            )
                            audio_np = (
                                np.frombuffer(audio_chunk, dtype=np.int16).astype(
                                    np.float32  # Ensure conversion to float32
                                )
                                / 32768.0
                            )

                        # Final type check/conversion to ensure float32
                        if (
                            hasattr(audio_np, "dtype")
                            and hasattr(audio_np, "astype")
                            and audio_np.dtype != np.float32
                        ):
                            logger.warning(
                                f"Converting audio from {audio_np.dtype} to float32"
                            )
                            audio_np = audio_np.astype(np.float32)
                        elif not hasattr(audio_np, "astype"):
                            # Handle case where audio_np might be a tuple
                            logger.warning(
                                "Audio data doesn't have astype method, converting to numpy array"
                            )
                            audio_np = np.array(
                                (
                                    audio_np[0]
                                    if isinstance(audio_np, tuple)
                                    else audio_np
                                ),
                                dtype=np.float32,
                            )

                        # Safely log audio information
                        if hasattr(audio_np, "dtype") and hasattr(audio_np, "shape"):
                            logger.info(
                                f"Final audio data type: {audio_np.dtype}, shape: {audio_np.shape}"
                            )
                        else:
                            logger.warning(
                                "Cannot log audio data type and shape - not a NumPy array"
                            )

                        # Ensure we have valid audio data before processing
                        if hasattr(audio_np, "__len__") and len(audio_np) > 0:
                            # Log detailed information about the audio data if it's a proper NumPy array
                            if hasattr(audio_np, "shape") and hasattr(
                                audio_np, "dtype"
                            ):
                                try:
                                    logger.info(
                                        f"Processing audio: shape={audio_np.shape}, dtype={audio_np.dtype}, "
                                        f"min={np.min(audio_np):.6f}, max={np.max(audio_np):.6f}, "
                                        f"mean={np.mean(audio_np):.6f}, std={np.std(audio_np):.6f}"
                                    )
                                except Exception as e:
                                    logger.warning(
                                        f"Error logging audio stats: {str(e)}"
                                    )
                            else:
                                logger.warning(
                                    "Cannot log detailed audio stats - not a proper NumPy array"
                                )

                            # Ensure array is contiguous in memory (if it's a NumPy array)
                            if hasattr(audio_np, "flags") and hasattr(
                                audio_np.flags, "c_contiguous"
                            ):
                                if not audio_np.flags.c_contiguous:
                                    logger.info(
                                        "Converting audio array to be contiguous in memory"
                                    )
                                    audio_np = np.ascontiguousarray(audio_np)

                            # Normalize audio if needed (only for NumPy arrays)
                            try:
                                max_val = np.max(np.abs(audio_np))
                                if max_val > 1.0:
                                    logger.info(
                                        f"Normalizing audio with max value: {max_val}"
                                    )
                                    audio_np = audio_np / max_val
                            except Exception as e:
                                logger.warning(f"Could not normalize audio: {str(e)}")

                            # Transcribe with faster-whisper
                            try:
                                segments, info = model.transcribe(
                                    audio_np,
                                    language=language,
                                    beam_size=5,
                                    vad_filter=True,
                                    vad_parameters=dict(min_silence_duration_ms=300),
                                )

                                # Collect segments
                                segment_list = []
                                for segment in segments:
                                    segment_list.append(
                                        {
                                            "text": segment.text,
                                            "start": segment.start,
                                            "end": segment.end,
                                        }
                                    )

                                # Join all text
                                transcript = " ".join(
                                    seg["text"] for seg in segment_list
                                ).strip()

                                # Only send if we have actual transcription
                                if transcript:
                                    await websocket.send_json(
                                        {
                                            "status": "success",
                                            "text": transcript,
                                            "segments": segment_list,
                                            "is_final": False,
                                            "language": info.language,
                                            "language_probability": info.language_probability,
                                        }
                                    )
                                else:
                                    await websocket.send_json(
                                        {"status": "no_speech_detected"}
                                    )
                            except Exception as e:
                                # Get detailed error information
                                import traceback

                                error_details = traceback.format_exc()
                                logger.error(
                                    f"Transcription error: {str(e)}\n{error_details}"
                                )
                                await websocket.send_json(
                                    {
                                        "error": f"Transcription failed: {str(e)}",
                                        "text": "",
                                    }
                                )
                        else:
                            await websocket.send_json({"status": "invalid_audio_data"})
                    except Exception as e:
                        logger.error(
                            f"Error processing audio with faster-whisper: {str(e)}"
                        )
                        await websocket.send_json({"error": str(e), "text": ""})
                    finally:
                        # Clean up the temp files
                        try:
                            # Remove original WebM file
                            if os.path.exists(temp_file_path):
                                os.unlink(temp_file_path)

                            # Also remove the WAV file if it was created
                            wav_path = f"{temp_file_path}.wav"
                            if os.path.exists(wav_path):
                                os.unlink(wav_path)
                        except Exception as e:
                            logger.warning(f"Failed to delete temp files: {str(e)}")

                # Fall back to original whisper implementation
                elif whisper_available and model is not None:
                    # Create a temporary file
                    try:
                        # Configure Whisper for the specified language
                        options = {
                            "language": language,
                            "task": "transcribe",
                            "fp16": False,
                            "temperature": 0.0,
                            "suppress_tokens": [-1],
                            "condition_on_previous_text": True,
                        }

                        result = model.transcribe(temp_file_path, **options)
                        # Handle result as a dictionary, not a tuple
                        if isinstance(result, dict):
                            transcript = result.get("text", "").strip()
                        else:
                            # If result is a tuple or other type, try to extract text differently
                            transcript = (
                                str(result[0]) if result and len(result) > 0 else ""
                            )
                            transcript = transcript.strip()

                        if transcript:
                            await websocket.send_json(
                                {
                                    "status": "success",
                                    "text": transcript,
                                    "partial": "",  # Simplified to avoid tuple access issues
                                    "is_final": False,
                                }
                            )
                        else:
                            await websocket.send_json({"status": "no_speech_detected"})
                    except Exception as e:
                        logger.error(f"Error processing with Whisper: {str(e)}")
                        await websocket.send_json({"error": str(e), "text": ""})
                    finally:
                        try:
                            os.unlink(temp_file_path)
                        except Exception as e:
                            logger.error(f"Error removing temp file: {str(e)}")
                else:
                    await websocket.send_json(
                        {"error": "No transcription model available", "text": ""}
                    )
            except Exception as e:
                logger.error(f"Error processing audio chunk: {str(e)}")
                await websocket.send_json({"error": str(e), "text": ""})

    except WebSocketDisconnect:
        logger.info(f"{language} WebSocket disconnected")
    except Exception as e:
        logger.error(f"{language} WebSocket error: {str(e)}")
    finally:
        active_connections.remove(websocket)
        logger.info(f"{language} WebSocket connection closed")


# Function to get the appropriate STT model based on language
def get_stt_model(language: str) -> str:
    """
    Determine which speech-to-text model to use for a given language.

    Args:
        language (str): The language code (e.g., "fi-FI", "en-US")

    Returns:
        str: The name of the model to use (e.g., "wav2vec2-finnish", "whisper", "faster-whisper")
    """
    # Get language configuration
    lang_config = LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG["en-US"])

    # Get the list of STT models for this language
    stt_models = lang_config.get("stt_models", ["whisper"])

    # Try each model in order of preference
    for model_name in stt_models:
        # Check if the model is available
        if (
            model_name == "wav2vec2-finnish"
            and wav2vec2_available
            and wav2vec2_model_downloaded
            and language == "fi-FI"  # Specific check for Finnish language
        ):
            return model_name
        elif model_name == "faster-whisper" and faster_whisper_available:
            return model_name
        elif model_name == "whisper" and whisper_available:
            return model_name
        elif model_name == "speechbrain" and speechbrain_available:
            return model_name

    # Fallback options if no preferred model from the configuration is available
    if faster_whisper_available:
        return "faster-whisper"
    elif whisper_available:
        return "whisper"

    # Ultimate fallback
    return "whisper"


# Add health check endpoint
@app.get("/api/speech/health")
async def speech_health_check():
    """Health check endpoint"""
    model_status = "initializing"
    device = "unknown"

    if faster_whisper_available and faster_whisper_model is not None:
        model_status = "healthy"
        device = "cuda" if torch.cuda.is_available() else "cpu"
    elif whisper_available and "medium" in whisper_models:
        model_status = "healthy"
        device = "cpu"  # Standard whisper uses CPU

    # Add Wav2Vec2 status
    wav2vec2_status = "available" if wav2vec2_available else "unavailable"

    return {
        "status": model_status,
        "model": "large-v3" if faster_whisper_available else "medium",
        "device": device,
        "faster_whisper_available": faster_whisper_available,
        "whisper_available": whisper_available,
        "wav2vec2_finnish_available": wav2vec2_status,
    }


# Add a function to check if any WebSocket connections are active
def has_active_websocket_connections():
    return len(active_connections) > 0


# Add WebSocket status endpoint
@app.get("/api/websocket-status")
async def websocket_status():
    return {
        "active_connections": len(active_connections),
        "whisper_available": whisper_available,
        "faster_whisper_available": faster_whisper_available,
        "websocket_enabled": True,
    }


# Add function to transcribe with Wav2Vec2 Finnish model
def transcribe_with_wav2vec2_finnish(audio_path):
    """
    Transcribe audio using Wav2Vec2 Finnish model
    """
    try:
        if not wav2vec2_available:
            logger.error("Wav2Vec2 Finnish model not available")
            return None

        # Use the imported function from wav2vec2_finnish.py
        result = transcribe_audio_with_wav2vec2(audio_path)
        return result
    except Exception as e:
        logger.error(f"Wav2Vec2 Finnish transcription error: {str(e)}")
        return None


# Add function to transcribe with whisper
def transcribe_with_whisper(audio_path, language):
    """
    Transcribe audio using Whisper model
    """
    try:
        # Default to base model for faster processing
        model = get_whisper_model("base")

        # Use small model for non-English languages
        if language and not language.lower().startswith("en"):
            model = get_whisper_model("small")

        # For Finnish specifically, use medium model for better accuracy
        if language and language.lower().startswith("fi"):
            model = get_whisper_model(
                "medium"
            )  # Changed from tiny to medium for better accuracy

        if not model:
            logger.error("Failed to load Whisper model")
            return None

        # Configure transcription options
        options = {
            "language": language[:2] if language else None,
            "task": "transcribe",
            "fp16": False,
            "temperature": 0.0,
            "beam_size": 5,
            "best_of": 1,
            "condition_on_previous_text": False,
        }

        # Transcribe
        logger.info(f"Transcribing with Whisper {audio_path}")
        result = model.transcribe(audio_path, **options)

        # Clean up the transcript by removing special tokens like </s>
        if result and "text" in result:
            # Remove special tokens from the text
            cleaned_text = result["text"]
            # Remove </s> tokens which are causing the messy output
            cleaned_text = cleaned_text.replace("</s>", " ").replace("<s>", " ")
            # Remove any other special tokens that might be present
            cleaned_text = cleaned_text.replace("<pad>", "").replace("<unk>", "")
            # Clean up extra spaces
            cleaned_text = " ".join(cleaned_text.split())

            # Check if the transcript contains only single letters with spaces (likely noise)
            import re

            if re.match(r"^(\s*[a-zA-Z]\s*)+$", cleaned_text) or re.match(
                r"^(\s*[a-zA-Z0-9]\s*)+$", cleaned_text
            ):
                logger.warning(
                    f"Whisper transcript appears to be noise (single letters): {cleaned_text}"
                )
                # Return empty result for noisy transcripts
                if language and language.lower().startswith("fi"):
                    cleaned_text = "En saanut selvää puheesta."
                else:
                    cleaned_text = "Could not understand the speech."

            # Update the result with cleaned text
            result["text"] = cleaned_text
            logger.info(f"Cleaned up transcript: {cleaned_text}")

        return result

    except Exception as e:
        logger.error(f"Whisper transcription error: {str(e)}")
        return None


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8008))
    logger.info(f"Starting Speech API service on port {port}")
    logger.info(
        f"CORS origins allowed: {['http://localhost:3000', 'http://127.0.0.1:3000']}"
    )
    logger.info(f"To test if server is running, open: http://localhost:{port}/health")

    # Preload Wav2Vec2 model for Finnish if available
    if wav2vec2_available:
        logger.info("Wav2Vec2 Finnish model is available. Preloading model...")
        try:
            # Just initialize the model without actual transcription
            from wav2vec2_finnish import load_wav2vec2_model

            model, processor = load_wav2vec2_model()
            if model is not None and processor is not None:
                logger.info("Wav2Vec2 Finnish model loaded successfully")
            else:
                logger.warning("Failed to load Wav2Vec2 Finnish model")
        except Exception as e:
            logger.error(f"Error preloading Wav2Vec2 Finnish model: {e}")

    # Preload faster-whisper model if available
    if faster_whisper_available:
        logger.info("faster-whisper is available. Preloading model...")
        try:
            model = get_faster_whisper_model()
            if model:
                logger.info("faster-whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Error preloading faster-whisper model: {e}")
    # If not, check original whisper
    elif whisper_available:
        logger.info("Whisper is available. Preloading models...")
        try:
            base_model = get_whisper_model("base")
            if base_model:
                logger.info("Whisper base model loaded successfully")

            # Try to load the medium model for Finnish
            medium_model = get_whisper_model("medium")
            if medium_model:
                logger.info(
                    "Whisper medium model loaded successfully (required for Finnish)"
                )
        except Exception as e:
            logger.error(f"Error preloading Whisper models: {e}")
    else:
        logger.warning(
            "Neither faster-whisper nor whisper is available - Finnish speech recognition will not work properly"
        )

    uvicorn.run(app, host="0.0.0.0", port=port)
