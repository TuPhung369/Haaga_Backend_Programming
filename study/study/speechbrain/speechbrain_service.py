from fastapi import FastAPI, File, UploadFile, Form, HTTPException
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
from typing import List, Optional
from speechbrain.inference import Tacotron2
from speechbrain.inference import HIFIGAN
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

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Speech API",
    description="API for Speech-to-Text and Text-to-Speech with SpeechBrain and gTTS fallback",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("models", exist_ok=True)
language_sessions = {}
language_interactions = []
tacotron2_models = {}
hifigan_models = {}


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


def get_tts_models(language="en", voice="neutral"):
    """Load TTS models and return voice parameters"""
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


@app.get("/")
def read_root():
    return {"status": "Speech API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "services_available": True}


@app.post("/api/speech-to-text")
async def speech_to_text(file: UploadFile = File(...), language: str = Form("en-US")):
    """
    Convert speech to text
    """
    temp_path = None
    try:
        # Create a unique filename to avoid conflicts
        import uuid

        unique_filename = f"audio_{uuid.uuid4().hex}.wav"
        temp_path = os.path.join(tempfile.gettempdir(), unique_filename)

        # Write file content
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        # Default transcript if all methods fail
        transcript = "I couldn't transcribe the audio clearly."

        # Try different transcription methods
        transcription_success = False

        # Method 1: Try whisper model if available
        if not transcription_success:
            try:
                logger.info("Checking for whisper module...")
                # Only attempt to import if module might be available
                if importlib.util.find_spec("whisper") is not None:
                    import whisper

                    logger.info("Using whisper model for transcription")
                    model = whisper.load_model("base")
                    result = model.transcribe(temp_path)
                    if result and "text" in result:
                        transcript = result["text"].strip()
                        logger.info(f"Whisper transcription: {transcript}")
                        if transcript:
                            transcription_success = True
                else:
                    logger.warning("Whisper module not available in the system")
            except Exception as e:
                logger.error(f"Whisper transcription error: {str(e)}")

        # Method 2: Try system speech recognition
        if not transcription_success:
            try:
                logger.info("Checking for speech_recognition module...")
                # Only attempt to import if module might be available
                if importlib.util.find_spec("speech_recognition") is not None:
                    import speech_recognition as sr

                    logger.info("Using speech_recognition for transcription")
                    recognizer = sr.Recognizer()
                    with sr.AudioFile(temp_path) as source:
                        audio = recognizer.record(source)
                    transcript = recognizer.recognize_google(audio, language=language)
                    logger.info(f"Google transcription: {transcript}")
                    if transcript:
                        transcription_success = True
                else:
                    logger.warning(
                        "speech_recognition module not available in the system"
                    )
            except Exception as e:
                logger.error(f"Speech recognition error: {str(e)}")

        # Method 3: Fall back to SpeechBrain if available
        if not transcription_success:
            # Add SpeechBrain ASR implementation here if available
            pass

        return {"transcript": transcript}

    except Exception as e:
        logger.error(f"Error in speech-to-text: {str(e)}")
        return {"error": str(e)}
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
    language = request.language.split("-")[0]
    voice = request.voice or "david-en-us"
    speed = request.speed

    # For legacy voice names, map to preferred voice
    if voice in ["male", "neutral"] or voice.startswith("neutral-"):
        voice = "neutral"
    elif voice in ["female", "female-en-us"]:
        voice = "zira-en-us"
    elif voice in ["male-en-us"]:
        voice = "david-en-us"

    # SCENARIO 1: David or Zira voices using pyttsx3 on Windows
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
            # Fall through to gTTS

    # SCENARIO 2: Neutral voice using SpeechBrain
    if voice == "neutral":
        # Try SpeechBrain for neutral voice
        MAX_CHARS_FOR_SPEECHBRAIN = 2000
        if len(text) <= MAX_CHARS_FOR_SPEECHBRAIN:
            tacotron2, hifigan, pitch_shift, base_speed = get_tts_models(
                language, "neutral"
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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8008))
    logger.info(f"Starting Speech API service on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
