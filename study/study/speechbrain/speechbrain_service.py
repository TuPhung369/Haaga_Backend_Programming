from fastapi import (
    FastAPI,
    File,
    UploadFile,
    Form,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import base64
import os
import tempfile
import logging
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

# Handle missing speechbrain components
speechbrain_tts_available = False
try:
    from speechbrain.inference import Tacotron2
    from speechbrain.inference import HIFIGAN

    speechbrain_tts_available = True
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

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Speech API",
    description="API for Speech-to-Text and Text-to-Speech with multilingual support",
)

# Allow more origins to fix CORS issues
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
# Add a cache for recent results to avoid duplicate processing
recent_transcriptions = deque(maxlen=50)
# Create a mutex for whisper model access
whisper_mutex = threading.RLock()

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
    },
    "fi-FI": {
        "code": "fi",
        "stt_models": ["whisper"],  # Whisper is good for Finnish
        "tts_models": ["gtts"],  # Using gTTS for Finnish as requested
        "whisper_size": "medium",  # medium is better for Finnish
    },
}


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


@app.get("/health")
async def health_check():
    """Health check endpoint for the server status"""
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

    return {
        "status": "ok",
        "whisper_available": whisper_available,
        "whisper_model_loaded": whisper_model is not None,
        "speechbrain_tts": speechbrain_status,
    }


@app.post("/api/speech-to-text")
async def speech_to_text(
    file: UploadFile = File(...),
    language: str = Form("en-US"),
    optimize: str = Form("false"),
    priority: str = Form("quality"),
):
    """
    Convert speech to text with support for multiple languages
    Now with optimization options for faster processing of small chunks
    """
    temp_path = None
    start_time = time.time()

    try:
        # Check if Whisper is required for this language
        lang_config = LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG["en-US"])
        if "whisper" in lang_config["stt_models"] and not whisper_available:
            if language == "fi-FI":
                return {
                    "error": "Whisper not available for Finnish. Install with: pip install openai-whisper",
                    "transcript": "Virhe: Whisper-malli ei ole käytettävissä. Asenna se komennolla: pip install openai-whisper",
                }
            else:
                return {
                    "error": "Whisper not available but required for this language",
                    "transcript": "Error: Whisper model is not available but required for this language.",
                }

        # Create a unique filename to avoid conflicts
        unique_filename = f"audio_{uuid.uuid4().hex}.wav"
        temp_path = os.path.join(tempfile.gettempdir(), unique_filename)

        # Write file content
        content = await file.read()

        # Check if content is too small - under 1KB is likely empty
        if len(content) < 1024:
            return {
                "transcript": "Too short or empty audio. Please speak longer.",
                "processing_time": 0,
            }

        # Check cache based on content hash before processing
        audio_hash = get_audio_hash(content, language)
        for item in recent_transcriptions:
            if item["hash"] == audio_hash:
                logger.info(f"Cache hit for audio hash {audio_hash}")
                processing_time = time.time() - start_time
                return {
                    "transcript": item["transcript"],
                    "cached": True,
                    "processing_time": processing_time,
                }

        with open(temp_path, "wb") as f:
            f.write(content)

        # Default transcript if all methods fail
        transcript = "I couldn't transcribe the audio clearly."
        transcription_success = False

        # Get language configuration
        lang_config = LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG["en-US"])

        # Method 1: Try Whisper if available and configured for this language
        if (
            not transcription_success
            and whisper_available
            and "whisper" in lang_config["stt_models"]
        ):
            try:
                logger.info(f"Using Whisper for {language} transcription")

                # Choose model size based on content length and optimization settings
                file_size = os.path.getsize(temp_path)

                # Determine model size - use smaller models for real-time chunks
                if priority == "speed" or optimize == "true" or file_size < 300000:
                    # For short recordings or when speed is prioritized, use tiny/base models
                    if file_size < 100000:  # < 100KB
                        model_size = "tiny"
                    else:
                        model_size = "base"
                else:
                    # For longer recordings, use the configured model size
                    model_size = lang_config.get("whisper_size", "base")

                logger.info(f"Selected {model_size} model for {file_size} bytes audio")
                model = get_whisper_model(model_size)

                if model:
                    # Optimize transcription options based on priority
                    options = {
                        "language": (
                            lang_config["code"] if language == "fi-FI" else None
                        ),
                    }

                    # For speed priority, add performance optimizations
                    if priority == "speed" or optimize == "true":
                        options.update(
                            {
                                "beam_size": 1,  # Reduce beam size for faster results
                                "best_of": 1,  # Don't generate multiple candidates
                                "temperature": 0.0,  # Deterministic results
                                "fp16": False,  # Avoid precision issues
                                "condition_on_previous_text": False,  # Skip context conditioning
                            }
                        )

                    # Process with Whisper
                    result = model.transcribe(temp_path, **options)

                    if result and "text" in result:
                        transcript = result["text"].strip()
                        logger.info(f"Whisper transcription: {transcript}")
                        if transcript:
                            transcription_success = True

                            # Add to cache
                            recent_transcriptions.append(
                                {
                                    "hash": audio_hash,
                                    "transcript": transcript,
                                    "timestamp": time.time(),
                                }
                            )
                else:
                    # Model couldn't be loaded
                    logger.error(f"Whisper model for {model_size} couldn't be loaded")
                    if language == "fi-FI":
                        return {
                            "error": "Whisper model couldn't be loaded",
                            "transcript": "Virhe: Whisper-mallia ei voitu ladata. Tarkista että openai-whisper on asennettu oikein.",
                        }
                    return {
                        "error": "Whisper model couldn't be loaded",
                        "transcript": "Error: Whisper model couldn't be loaded. Check that openai-whisper is installed correctly.",
                    }
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Whisper transcription error: {error_msg}")

                # If the error indicates an installation issue, provide specific guidance
                if (
                    "No module named" in error_msg
                    or "not installed" in error_msg.lower()
                ):
                    missing_module = (
                        error_msg.split("'")[1]
                        if "'" in error_msg
                        else "required dependency"
                    )
                    specific_error = f"Missing dependency: {missing_module}"
                    if language == "fi-FI":
                        return {
                            "error": specific_error,
                            "transcript": f"Virhe: Puuttuva riippuvuus: {missing_module}. Asenna se pip:llä.",
                        }
                    return {
                        "error": specific_error,
                        "transcript": f"Error: Missing dependency: {missing_module}. Install it using pip.",
                    }

        # Calculate processing time
        processing_time = time.time() - start_time
        logger.info(f"Speech-to-text processing time: {processing_time:.2f} seconds")

        return {"transcript": transcript, "processing_time": processing_time}

    except Exception as e:
        error_message = str(e)
        logger.error(f"Error in speech-to-text: {error_message}")

        # Calculate processing time even for errors
        processing_time = time.time() - start_time

        # Provide language-specific error messages
        if language == "fi-FI":
            return {
                "error": error_message,
                "transcript": "Virhe tekstintunnistuksessa. Tarkista että Whisper-palvelin on käynnissä ja Whisper on asennettu.",
                "processing_time": processing_time,
            }
        return {
            "error": error_message,
            "transcript": f"Error: {error_message}",
            "processing_time": processing_time,
        }
    finally:
        # Clean up temp file with retries in case it's still being accessed
        if temp_path and os.path.exists(temp_path):
            for _ in range(3):  # Try 3 times
                try:
                    os.unlink(temp_path)
                    break
                except PermissionError:
                    # File might still be in use, wait a bit
                    logger.warning(
                        f"Couldn't delete {temp_path} immediately, retrying..."
                    )
                    await asyncio.sleep(0.5)
                except Exception as e:
                    logger.error(f"Error deleting temp file: {str(e)}")
                    break


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


# Add WebSocket endpoint for Finnish transcription
@app.websocket("/ws/finnish")
async def websocket_finnish(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)

    logger.info("WebSocket connection established for Finnish transcription")

    # Buffer to accumulate audio chunks
    audio_buffer = io.BytesIO()
    last_transcription_time = time.time()

    try:
        while True:
            # Receive binary audio data
            audio_chunk = await websocket.receive_bytes()
            logger.info(f"Received audio chunk: {len(audio_chunk)} bytes")

            # Append to buffer
            audio_buffer.write(audio_chunk)
            audio_buffer.seek(0, io.SEEK_END)  # Move to end after writing
            buffer_size = audio_buffer.tell()  # Get current size

            # Process if we have enough data or enough time has passed
            current_time = time.time()
            time_since_last = current_time - last_transcription_time

            if (
                buffer_size > 16000 or time_since_last > 2.0
            ):  # Process every 2 seconds or when buffer is large enough
                logger.info(f"Processing audio buffer of size {buffer_size} bytes")

                # Create a temporary file
                with tempfile.NamedTemporaryFile(
                    suffix=".webm", delete=False
                ) as temp_file:
                    # Reset buffer position and write to temp file
                    audio_buffer.seek(0)
                    temp_file.write(audio_buffer.read())
                    temp_path = temp_file.name

                try:
                    # Reset buffer for new data but keep a small overlap
                    if buffer_size > 4000:  # Keep last 4KB for overlap
                        audio_buffer.seek(max(0, buffer_size - 4000))
                        overlap_data = audio_buffer.read()
                        audio_buffer = io.BytesIO()
                        audio_buffer.write(overlap_data)
                    else:
                        audio_buffer = io.BytesIO()  # Reset if too small

                    # Use Whisper for transcription if available
                    if whisper_available:
                        whisper_model = get_whisper_model(
                            "medium"
                        )  # Use medium model for Finnish

                        if whisper_model:
                            # Configure Whisper for Finnish
                            options = {
                                "language": "fi",  # Finnish language code
                                "task": "transcribe",
                                "fp16": False,  # Avoid precision issues
                                "temperature": 0.0,  # Deterministic output for streaming
                                "suppress_tokens": [
                                    -1
                                ],  # Avoid suppression for partial transcripts
                                "condition_on_previous_text": True,  # Maintain context
                            }

                            try:
                                result = whisper_model.transcribe(temp_path, **options)

                                # Extract transcript
                                transcript = result.get("text", "").strip()
                                logger.info(
                                    f"Real-time Finnish transcript: {transcript}"
                                )

                                # Build response with full and partial transcripts
                                response = {
                                    "text": transcript,
                                    "partial": (
                                        result.get("segments", [{}])[-1].get("text", "")
                                        if result.get("segments")
                                        else ""
                                    ),
                                    "is_final": False,
                                }

                                # Send transcription back to client
                                await websocket.send_json(response)
                                last_transcription_time = current_time
                            except Exception as e:
                                logger.error(
                                    f"Error in Whisper transcription: {str(e)}"
                                )
                                await websocket.send_json(
                                    {
                                        "error": f"Transcription error: {str(e)}",
                                        "text": "",
                                    }
                                )
                        else:
                            logger.error("Whisper model not available for Finnish")
                            await websocket.send_json(
                                {"error": "Whisper model not available", "text": ""}
                            )
                    else:
                        logger.error("Whisper not installed")
                        await websocket.send_json(
                            {"error": "Whisper not installed", "text": ""}
                        )
                finally:
                    # Clean up temp file
                    try:
                        os.unlink(temp_path)
                    except Exception as e:
                        logger.error(f"Error removing temp file: {str(e)}")
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        active_connections.remove(websocket)
        logger.info("WebSocket connection closed")


# Add a function to check if any WebSocket connections are active
def has_active_websocket_connections():
    return len(active_connections) > 0


# Add WebSocket status endpoint
@app.get("/api/websocket-status")
async def websocket_status():
    return {
        "active_connections": len(active_connections),
        "whisper_available": whisper_available,
        "websocket_enabled": True,
    }


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8008))
    logger.info(f"Starting Speech API service on port {port}")
    logger.info(
        f"CORS origins allowed: {['http://localhost:3000', 'http://127.0.0.1:3000']}"
    )
    logger.info(f"To test if server is running, open: http://localhost:{port}/health")

    # Make sure Whisper is available for Finnish
    if whisper_available:
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
            "Whisper is NOT available - Finnish speech recognition will not work"
        )

    uvicorn.run(app, host="0.0.0.0", port=port)
