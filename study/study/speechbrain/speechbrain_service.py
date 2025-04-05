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
import pyttsx3

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
pyttsx3_engine = None


class TTSRequest(BaseModel):
    text: str
    language: str = "en-US"
    voice: str = "neutral"
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


def change_pitch(audio, semitone_shift):
    audio = AudioSegment(
        audio.tobytes(), frame_rate=22050, sample_width=audio.dtype.itemsize, channels=1
    )

    shifted = audio._spawn(
        audio.raw_data,
        overrides={"frame_rate": int(audio.frame_rate * (2 ** (semitone_shift / 12)))},
    )

    shifted = shifted.set_frame_rate(22050)
    return np.array(shifted.get_array_of_samples())


def get_tts_models(language="en", voice="neutral"):
    """Load TTS models and return voice parameters"""
    model_key = f"{language}_{voice}"

    voice_config = {
        "neutral": {"pitch_shift": 0, "base_speed": 0.9},
        "male": {"pitch_shift": -5, "base_speed": 0.9},
        "female": {"pitch_shift": 5, "base_speed": 0.8},
    }

    # Get config for current voice
    config = voice_config.get(voice, voice_config["neutral"])

    # Check if we already have the tacotron2 model for this specific voice
    if model_key in tacotron2_models:
        # For HiFi-GAN, we use the same model for all voices
        hifi_key = f"{language}_hifigan"
        if hifi_key in hifigan_models:
            return (
                tacotron2_models[model_key],
                hifigan_models[hifi_key],
                config["pitch_shift"],
                config["base_speed"],
            )

    # Sources for models - use female model for all voices as we'll use pyttsx3 for male
    tacotron2_source = "speechbrain/tts-tacotron2-ljspeech"
    # Use the same HiFi-GAN model for all voices
    hifigan_source = "speechbrain/tts-hifigan-ljspeech"

    try:
        logger.info(f"Loading SpeechBrain models for {language}/{voice}")

        # Load Tacotron2 model specific to this voice
        tacotron2 = Tacotron2.from_hparams(
            source=tacotron2_source,
            savedir=f"pretrained_models/tts-tacotron2-{model_key}",
            run_opts={"device": "cpu"},
        )

        # Load HiFi-GAN model (shared across all voices)
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
        return None, None, 0, 1.0  # Return default values on error


def apply_pitch_shift(
    waveform: np.ndarray, semitone_shift: int, sample_rate=22050
) -> np.ndarray:
    """Apply pitch shift using pydub while maintaining original duration"""
    try:
        # Convert to int16 if needed (PCM 16-bit format requirement)
        if waveform.dtype == np.float32:
            waveform = (waveform * 32767).astype(np.int16)

        # Create AudioSegment from numpy array
        audio = AudioSegment(
            waveform.tobytes(),
            frame_rate=sample_rate,
            sample_width=2,  # Force 16-bit PCM
            channels=1,
        )

        # Calculate new rate based on semitone shift
        new_rate = int(sample_rate * (2 ** (semitone_shift / 12)))

        # Apply pitch shift
        shifted_audio = audio._spawn(
            audio.raw_data, overrides={"frame_rate": new_rate}
        ).set_frame_rate(sample_rate)

        # Convert back to numpy array and normalize
        shifted_samples = np.array(shifted_audio.get_array_of_samples())
        return shifted_samples.astype(np.float32) / 32767.0

    except Exception as e:
        logger.error(f"Pitch shift failed: {str(e)}")
        return waveform


def pydub_speed_change(
    waveform: np.ndarray, speed_factor: float, sample_rate=22050
) -> np.ndarray:
    """Change the speed of the audio using PyDub - more reliable than librosa for speed changes"""
    try:
        if abs(speed_factor - 1.0) < 0.01:
            return waveform

        # Ensure speed_factor is within reasonable range to avoid issues
        if speed_factor > 3.0:
            logger.warning(f"Speed factor too high ({speed_factor}), limiting to 3.0")
            speed_factor = 3.0
        elif speed_factor < 0.3:
            logger.warning(f"Speed factor too low ({speed_factor}), increasing to 0.3")
            speed_factor = 0.3

        logger.info(f"Applying DIRECT speed change: {speed_factor}x (visible)")

        # Convert to int16 for PyDub
        if waveform.dtype == np.float32:
            waveform_int = (waveform * 32767).astype(np.int16)
        else:
            waveform_int = waveform.astype(np.int16)

        # Create AudioSegment
        audio = AudioSegment(
            waveform_int.tobytes(),
            frame_rate=sample_rate,
            sample_width=2,  # 16-bit PCM
            channels=1,
        )

        # IMPORTANT: For speedup (speed_factor > 1.0), we need to INCREASE the frame_rate
        # For slowdown (speed_factor < 1.0), we need to DECREASE the frame_rate
        new_frame_rate = int(audio.frame_rate * speed_factor)

        logger.info(f"Changing frame rate from {audio.frame_rate} to {new_frame_rate}")

        # Apply speed change by changing frame rate and then setting back
        speed_changed = audio._spawn(
            audio.raw_data, overrides={"frame_rate": new_frame_rate}
        ).set_frame_rate(sample_rate)

        # Convert back to numpy array
        samples = np.array(speed_changed.get_array_of_samples())

        # Convert back to float32 and normalize
        return samples.astype(np.float32) / 32767.0

    except Exception as e:
        logger.error(f"PyDub speed change failed: {str(e)}")
        return waveform


def apply_speed_change(waveform: np.ndarray, speed_factor: float) -> np.ndarray:
    """Change the speed of the audio without affecting pitch"""
    try:
        if abs(speed_factor - 1.0) < 0.01:
            return waveform

        target_length = int(len(waveform) / speed_factor)
        return librosa.effects.time_stretch(waveform, rate=speed_factor)
    except Exception as e:
        logger.error(f"Speed change failed: {str(e)}")
        return waveform


def apply_true_pitch_shift(
    waveform: np.ndarray, semitone_shift: int, sample_rate=22050
) -> np.ndarray:
    """Apply pitch shift using librosa without affecting speed"""
    try:
        if semitone_shift == 0:
            return waveform

        logger.info(f"Shifting pitch by {semitone_shift} semitones")

        # Make sure input is float32 and in the right range for librosa
        if waveform.dtype != np.float32:
            waveform = waveform.astype(np.float32)

        if waveform.max() > 1.0:
            waveform = waveform / 32767.0

        # Use librosa's pitch shift which preserves duration
        shifted = librosa.effects.pitch_shift(
            waveform, sr=sample_rate, n_steps=semitone_shift
        )

        return shifted

    except Exception as e:
        logger.error(f"True pitch shift failed: {str(e)}")
        return waveform


def fix_speed_after_pitch_shift(
    waveform: np.ndarray, semitone_shift: int
) -> np.ndarray:
    """Adjust speed after pitch shift to maintain original speed"""
    # Calculate speed correction factor (inverse of pitch shift effect)
    speed_correction = 2 ** (semitone_shift / 12)

    try:
        # If pitch is lower, speed up to compensate
        # If pitch is higher, slow down to compensate
        target_length = int(len(waveform) / speed_correction)

        # Use scipy.signal.resample for more accurate resampling
        return signal.resample(waveform, target_length)
    except Exception as e:
        logger.error(f"Failed to correct speed: {str(e)}")
        return waveform


def get_pyttsx3_engine():
    """Get or initialize the pyttsx3 TTS engine"""
    global pyttsx3_engine
    if pyttsx3_engine is None:
        try:
            pyttsx3_engine = pyttsx3.init()
            # Get available voices and log them
            voices = pyttsx3_engine.getProperty("voices")
            logger.info(f"Initialized pyttsx3 with {len(voices)} voices")
            for i, voice in enumerate(voices):
                logger.info(f"Voice {i}: {voice.name} ({voice.id})")
        except Exception as e:
            logger.error(f"Failed to initialize pyttsx3: {str(e)}")
    return pyttsx3_engine


@app.get("/api/system-voices")
async def get_system_voices():
    """Return detailed list of all system voices using direct SAPI access"""
    voices = []

    # First try the pyttsx3 method (already implemented)
    try:
        engine = get_pyttsx3_engine()
        if engine:
            system_voices = engine.getProperty("voices")
            logger.info(f"pyttsx3 found {len(system_voices)} voices")
            for voice in system_voices:
                voices.append({"id": voice.id, "name": voice.name, "source": "pyttsx3"})
    except Exception as e:
        logger.error(f"Error getting voices via pyttsx3: {str(e)}")

    # Then try the direct SAPI method via comtypes
    try:
        from comtypes.client import CreateObject
        import comtypes.gen

        # Ensure the SpeechLib is available in comtypes
        try:
            from comtypes.gen import SpeechLib
        except (ImportError, AttributeError):
            # If not already available, create the gen module
            engine = CreateObject("SAPI.SpVoice")
            # Now the SpeechLib should be available
            from comtypes.gen import SpeechLib

        # Get voices via SAPI directly
        engine = CreateObject("SAPI.SpVoice")
        sapi_voices = engine.GetVoices()

        logger.info(f"SAPI found {sapi_voices.Count} voices")

        for i in range(sapi_voices.Count):
            voice = sapi_voices.Item(i)
            try:
                voice_id = voice.Id
                voice_name = voice.GetAttribute("Name")
                voice_lang = voice.GetAttribute("Language")
                voice_gender = voice.GetAttribute("Gender")

                voices.append(
                    {
                        "id": voice_id,
                        "name": voice_name,
                        "language": voice_lang,
                        "gender": voice_gender,
                        "source": "sapi",
                    }
                )

                logger.info(
                    f"SAPI Voice: {voice_name} ({voice_id}), Language: {voice_lang}, Gender: {voice_gender}"
                )
            except Exception as e:
                logger.error(f"Error processing SAPI voice {i}: {str(e)}")

    except Exception as e:
        logger.error(f"Error getting voices via SAPI: {str(e)}")

    return voices


def update_supported_voices_with_system_info():
    """Update the frontend voice list with information from the system voices"""
    frontend_voices = [
        {"id": "mark-en-us", "name": "Mark", "description": "M-English"},
        {"id": "ryan-en-gb", "name": "Ryan", "description": "M-English"},
        {"id": "aria-en-us", "name": "Aria", "description": "FM-English"},
        {"id": "sonia-en-gb", "name": "Sonia", "description": "FM-English"},
        {"id": "guy-en-us", "name": "Guy", "description": "M-English"},
        {"id": "jenny-en-us", "name": "Jenny", "description": "FM-English"},
        {"id": "david-en-us", "name": "David", "description": "M-English"},
        {"id": "zira-en-us", "name": "Zira", "description": "FM-English"},
        {
            "id": "david-desktop-en-us",
            "name": "David Desktop",
            "description": "M-English",
        },
        {
            "id": "zira-desktop-en-us",
            "name": "Zira Desktop",
            "description": "FM-English",
        },
        {"id": "heidi-fi-fi", "name": "Heidi", "description": "FM-Finnish"},
        {"id": "an-vi-vn", "name": "An", "description": "M-Vietnamese"},
    ]

    # Get system voice information using both methods
    system_voice_names = []

    # Try pyttsx3 first
    try:
        engine = get_pyttsx3_engine()
        if engine:
            system_voices = engine.getProperty("voices")
            for voice in system_voices:
                # Clean the voice name for comparison
                clean_name = (
                    voice.name.lower()
                    .replace("microsoft ", "")
                    .replace(" desktop", "")
                    .split("-")[0]
                    .strip()
                )
                system_voice_names.append(clean_name)
                logger.info(f"System voice: {clean_name} ({voice.id})")
    except Exception as e:
        logger.error(f"Error checking pyttsx3 voices: {str(e)}")

    # Also try SAPI if available
    try:
        from comtypes.client import CreateObject

        try:
            from comtypes.gen import SpeechLib
        except (ImportError, AttributeError):
            engine = CreateObject("SAPI.SpVoice")
            from comtypes.gen import SpeechLib

        engine = CreateObject("SAPI.SpVoice")
        sapi_voices = engine.GetVoices()

        for i in range(sapi_voices.Count):
            voice = sapi_voices.Item(i)
            try:
                voice_name = voice.GetAttribute("Name")
                # Clean the voice name
                clean_name = (
                    voice_name.lower()
                    .replace("microsoft ", "")
                    .replace(" desktop", "")
                    .split("-")[0]
                    .strip()
                )
                if clean_name not in system_voice_names:
                    system_voice_names.append(clean_name)
                    logger.info(f"SAPI voice: {clean_name} ({voice.Id})")
            except Exception as e:
                logger.error(f"Error processing SAPI voice name: {str(e)}")
    except Exception as e:
        logger.error(f"Error checking SAPI voices: {str(e)}")

    # Mark which frontend voices are available
    available_voices = []
    for voice in frontend_voices:
        # Extract the base name without language
        name = voice["name"].lower()

        # Check if this voice is available on the system
        is_available = False
        for system_name in system_voice_names:
            if name in system_name or system_name in name:
                is_available = True
                break

        # Add availability info to the voice
        voice_with_availability = {**voice, "available": is_available}
        available_voices.append(voice_with_availability)

    return available_voices


@app.get("/api/supported-voices")
async def get_supported_voices():
    """Return list of all supported voices including system voices"""
    return update_supported_voices_with_system_info()


def generate_pyttsx3_audio(text, voice_id="david-en-us", speed=0.9):
    """Generate audio using pyttsx3 with the specified voice ID and speed"""
    try:
        engine = get_pyttsx3_engine()
        if engine is None:
            logger.error("pyttsx3 engine initialization failed")
            return None, "Text-to-speech engine could not be initialized"

        # Get available voices
        system_voices = engine.getProperty("voices")
        if not system_voices:
            logger.error("No voices available in pyttsx3")
            return None, "No voice options are available on this system"

        logger.info(f"Found {len(system_voices)} system voices")

        # Parse the voice_id to get the base name and language
        voice_parts = voice_id.split("-")
        voice_name = voice_parts[0].lower()  # e.g., "david", "zira"

        # Default to the first voice
        system_voice_id = system_voices[0].id
        voice_found = False

        # Try to find the matching voice
        for system_voice in system_voices:
            # Clean up the system voice name for comparison
            system_name = (
                system_voice.name.lower()
                .replace("microsoft ", "")
                .replace(" desktop", "")
                .split("-")[0]
                .strip()
            )

            # Check if the requested voice matches this system voice
            if voice_name in system_name or system_name in voice_name:
                system_voice_id = system_voice.id
                voice_found = True
                logger.info(
                    f"Found matching voice: {system_voice.name} for requested voice: {voice_id}"
                )
                break

        if not voice_found:
            logger.warning(
                f"Voice '{voice_id}' not found on system. Using default voice: {system_voices[0].name}"
            )
            return (
                None,
                f"Voice '{voice_parts[0]}' is not available on this system. Please choose another voice.",
            )

        # Set voice
        logger.info(f"Setting voice to: {system_voice_id}")
        engine.setProperty("voice", system_voice_id)

        # Set speed (rate in pyttsx3) - make it 10% slower by default
        current_rate = engine.getProperty("rate")
        # Apply both the default slower speed (0.9) and any user-specified speed
        adjusted_speed = speed * 0.9  # Apply additional 10% slowdown
        new_rate = int(current_rate * adjusted_speed)
        engine.setProperty("rate", new_rate)

        logger.info(f"Using pyttsx3 voice: {system_voice_id}, rate: {new_rate}")

        # Create unique temp filename to avoid conflicts
        temp_file = f"temp_{uuid.uuid4()}.wav"

        # Save to file
        engine.save_to_file(text, temp_file)
        engine.runAndWait()

        # Verify the file was created
        if not os.path.exists(temp_file):
            logger.error(f"pyttsx3 failed to create audio file: {temp_file}")
            return None, "Failed to generate audio file"

        logger.info(
            f"Audio file created: {temp_file} ({os.path.getsize(temp_file)} bytes)"
        )

        # Read the saved file
        audio = AudioSegment.from_wav(temp_file)
        mp3_buffer = io.BytesIO()
        audio.export(mp3_buffer, format="mp3", bitrate="128k")
        mp3_buffer.seek(0)

        # Clean up
        try:
            os.remove(temp_file)
        except Exception as e:
            logger.warning(f"Failed to delete temp file {temp_file}: {str(e)}")

        return base64.b64encode(mp3_buffer.read()).decode("utf-8"), None

    except Exception as e:
        logger.error(f"pyttsx3 audio generation failed: {str(e)}", exc_info=True)
        return None, f"Audio generation failed: {str(e)}"


@app.get("/")
def read_root():
    return {"status": "Speech API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "services_available": True}


@app.post("/api/speech-to-text")
async def speech_to_text(file: UploadFile = File(...), language: str = Form("en-US")):
    try:
        logger.info(f"Processing STT request with language: {language}")
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        try:
            transcript = "Simulated transcript. Replace with SpeechBrain ASR."
            logger.info(f"Transcription result: {transcript}")
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        return {"success": True, "transcript": transcript, "language": language}
    except Exception as e:
        logger.error(f"Error in speech-to-text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Speech-to-text failed: {str(e)}")


@app.post("/api/text-to-speech")
async def text_to_speech(request: TTSRequest):
    text = request.text
    language = request.language.split("-")[0]
    voice = request.voice or "david-en-us"  # Default to david-en-us instead of neutral
    speed = request.speed  # Use the speed parameter from request

    logger.info(
        f"Processing TTS request: '{text[:30]}...' in language: {language}, voice: {voice}, speed: {speed}"
    )

    # Use pyttsx3 for all voice types
    if "-" in voice:  # Modern voice format like "david-en-us"
        logger.info(f"Using pyttsx3 for voice: {voice}")
        try:
            audio_base64, error_message = generate_pyttsx3_audio(text, voice, speed)
            if audio_base64:
                logger.info(f"Successfully generated audio with pyttsx3 for {voice}")
                return {
                    "success": True,
                    "audio": audio_base64,
                    "format": "mp3",
                    "language": language,
                    "voice": voice,
                    "source": "pyttsx3",
                }
            elif error_message:
                logger.error(f"pyttsx3 error: {error_message}")
                # Return an error response with the specific message
                return {
                    "success": False,
                    "error": error_message,
                    "language": language,
                    "voice": voice,
                }
        except Exception as e:
            logger.error(f"pyttsx3 TTS failed: {str(e)}", exc_info=True)
            # Fall through to SpeechBrain or gTTS

    # Legacy voice handling (male, female, neutral)
    elif voice in ["male", "female", "neutral"]:
        # Map legacy voices to specific voices
        legacy_mapping = {
            "male": "david-en-us",
            "female": "zira-en-us",
            "neutral": "david-en-us",
        }
        mapped_voice = legacy_mapping.get(voice, "david-en-us")

        logger.info(f"Mapped legacy voice {voice} to {mapped_voice}")
        try:
            audio_base64, error_message = generate_pyttsx3_audio(
                text, mapped_voice, speed
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
            elif error_message:
                logger.error(f"pyttsx3 error: {error_message}")
                # Return an error response
                return {
                    "success": False,
                    "error": error_message,
                    "language": language,
                    "voice": voice,
                }
        except Exception as e:
            logger.error(f"pyttsx3 TTS failed: {str(e)}", exc_info=True)
            # Fall through to fallbacks

    # Use SpeechBrain as fallback
    MAX_CHARS_FOR_SPEECHBRAIN = 2000
    if len(text) <= MAX_CHARS_FOR_SPEECHBRAIN:
        # For SpeechBrain, we need to map the voice back to male/female/neutral
        sb_voice = "neutral"
        if (
            "male" in voice
            or "david" in voice
            or "guy" in voice
            or "ryan" in voice
            or "mark" in voice
        ):
            sb_voice = "male"
        elif (
            "female" in voice
            or "zira" in voice
            or "aria" in voice
            or "sonia" in voice
            or "jenny" in voice
        ):
            sb_voice = "female"

        tacotron2, hifigan, pitch_shift, base_speed = get_tts_models(language, sb_voice)
        logger.info(
            f"Voice config - pitch_shift: {pitch_shift}, base_speed: {base_speed}"
        )

        if tacotron2 and hifigan:
            try:
                logger.info("Using SpeechBrain with text chunking")
                with torch.no_grad():
                    waveform = process_long_text(text, tacotron2, hifigan)

                if waveform is None:
                    raise ValueError("Failed to generate waveform")

                # Apply pitch shift without adjusting speed afterward
                if pitch_shift != 0:
                    try:
                        waveform_np = waveform.squeeze().numpy()
                        shifted_waveform = apply_pitch_shift(waveform_np, pitch_shift)
                        waveform = torch.from_numpy(shifted_waveform).unsqueeze(0)
                        logger.info(f"Applied pitch shift: {pitch_shift} semitones")
                    except Exception as e:
                        logger.error(f"Pitch shift failed: {str(e)}")

                # Apply speed change independently with clear values
                final_speed = base_speed * speed
                logger.info(
                    f"Calculating final_speed = {base_speed} (base) * {speed} (user) = {final_speed}"
                )

                if abs(final_speed - 1.0) > 0.01:
                    try:
                        waveform_np = waveform.squeeze().numpy()
                        # For PyDub speed change:
                        # If we want faster (>1.0), we need to increase frame_rate
                        # If we want slower (<1.0), we need to decrease frame_rate
                        pydub_speed = final_speed
                        speed_adjusted = pydub_speed_change(waveform_np, pydub_speed)
                        waveform = torch.from_numpy(speed_adjusted).unsqueeze(0)
                        logger.info(
                            f"Applied speed adjustment: {final_speed}x (should be audible)"
                        )
                    except Exception as e:
                        logger.error(f"Speed adjustment failed: {str(e)}")

                # Fix tensor dimensions before saving
                logger.info(f"Waveform shape before saving: {waveform.shape}")

                # Ensure correct dimensions: [channels, time] (2D)
                if waveform.dim() == 3:
                    waveform = waveform.squeeze(0)  # Remove batch dimension
                elif waveform.dim() == 1:
                    waveform = waveform.unsqueeze(0)  # Add channel dimension

                # Convert to MP3
                buffer = io.BytesIO()
                torchaudio.save(
                    buffer,
                    waveform.cpu(),
                    22050,
                    format="wav",
                )
                buffer.seek(0)
                audio = AudioSegment.from_wav(buffer)
                mp3_buffer = io.BytesIO()
                audio.export(mp3_buffer, format="mp3", bitrate="128k")
                mp3_buffer.seek(0)
                audio_base64 = base64.b64encode(mp3_buffer.read()).decode("utf-8")

                logger.info("SpeechBrain TTS completed successfully")
                logger.info(
                    f"Applying speed adjustment: {final_speed} (base: {base_speed}, request: {speed})"
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

    # Fallback to gTTS
    logger.info(f"Falling back to gTTS for language: {language}")
    try:
        tts = gTTS(text=text, lang=language)
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
    silence = torch.zeros(int(0.3 * sample_rate))  # 300ms silence

    for i, sentence in enumerate(sentences):
        if not sentence.strip():
            continue
        logger.info(f"Processing sentence {i+1}/{len(sentences)}: '{sentence[:30]}...'")
        try:
            mel_outputs, mel_lengths, _ = tacotron2.encode_text(sentence)
            waveforms = hifigan.decode_batch(mel_outputs)

            # Get 1D audio tensor [time_steps]
            waveform_slice = waveforms[0].squeeze(0).squeeze(0)
            all_waveforms.append(waveform_slice)

            # Add silence only between sentences
            if i < len(sentences) - 1:
                all_waveforms.append(silence)

        except Exception as e:
            logger.warning(f"Failed to process sentence: {sentence}. Error: {str(e)}")
            continue

    if all_waveforms:
        try:
            combined = torch.cat(all_waveforms, dim=0)
            return combined.unsqueeze(0)  # Add channel dimension [1, time_steps]
        except Exception as e:
            logger.error(f"Failed to combine waveforms: {str(e)}")
    return None


@app.post("/api/ai-response")
async def ai_response(request: AIResponseRequest):
    try:
        logger.info(
            f"Processing AI response: '{request.message}' in {request.language}"
        )
        time.sleep(0.5)
        ai_response = f"Simulated AI response for {request.language} practice."
        return {"response": ai_response, "language": request.language}
    except Exception as e:
        logger.error(f"Error in AI response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI response failed: {str(e)}")


@app.post("/api/language-sessions")
async def create_language_session(request: LanguageSessionRequest):
    try:
        logger.info(
            f"Creating session for user: {request.userId}, lang: {request.language}"
        )
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
        logger.info(f"Fetching sessions for user: {userId}")
        user_sessions = [s for s in language_sessions.values() if s["userId"] == userId]
        return user_sessions if user_sessions else []
    except Exception as e:
        logger.error(f"Error fetching sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fetch sessions failed: {str(e)}")


@app.post("/api/language-ai/interactions")
async def save_language_interaction(request: LanguageInteractionRequest):
    try:
        logger.info(f"Saving interaction for session: {request.sessionId}")
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
        logger.info(f"Fetching interactions for session: {sessionId}")
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
        logger.info(f"Fetching proficiency for user: {userId}, lang: {language}")
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
