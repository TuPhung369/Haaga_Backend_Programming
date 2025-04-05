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


@app.get("/api/supported-voices")
async def get_supported_voices():
    """Return list of supported voices matching frontend"""
    # Initialize pyttsx3 engine to check available voices
    try:
        engine = get_pyttsx3_engine()
        if engine:
            voices = engine.getProperty("voices")
            logger.info(f"Available system voices: {len(voices)}")
            for i, voice in enumerate(voices):
                logger.info(f"System voice {i}: {voice.name} ({voice.id})")
    except Exception as e:
        logger.error(f"Error checking system voices: {str(e)}")

    voices = [
        {"id": "neutral", "name": "Neutral", "description": "Default neutral voice"},
        {
            "id": "male",
            "name": "Male",
            "description": "Standard male voice (system voice)",
        },
        {
            "id": "female",
            "name": "Female",
            "description": "Standard female voice (pitch-adjusted)",
        },
        {
            "id": "male-1",
            "name": "Male (Deep)",
            "description": "Deep male voice (system voice)",
        },
        {
            "id": "female-1",
            "name": "Female (Soft)",
            "description": "Soft female voice (pitch-adjusted)",
        },
    ]
    return voices


def generate_pyttsx3_audio(text, voice="male", speed=0.9):
    """Generate audio using pyttsx3 with the specified voice and speed"""
    try:
        engine = get_pyttsx3_engine()
        if engine is None:
            logger.error("pyttsx3 engine initialization failed")
            return None

        # Get available voices
        voices = engine.getProperty("voices")
        if not voices:
            logger.error("No voices available in pyttsx3")
            return None

        logger.info(f"Found {len(voices)} system voices")

        # Default to the first voice
        voice_id = voices[0].id

        # FIXED VOICE SELECTION - Make sure female gets female voice and male gets male voice
        if "female" in voice.lower():
            # For female voices, look for female voice names
            female_found = False
            for i, v in enumerate(voices):
                logger.info(f"Voice {i}: {v.name} ({v.id})")
                if any(term in v.name.lower() for term in ["female", "zira", "helen"]):
                    voice_id = v.id
                    logger.info(f"Selected female voice: {v.name}")
                    female_found = True
                    break

            # If no female voice found but we have multiple voices, try to use the one that's likely female
            if not female_found and len(voices) > 1:
                # In Windows, often the second voice is female (Zira)
                # Try to find an index that's likely female
                for i, v in enumerate(voices):
                    if (
                        "zira" in v.id.lower() or i == 1
                    ):  # Often Zira is the second voice
                        voice_id = v.id
                        logger.info(f"Using likely female voice: {v.name}")
                        break

        elif "male" in voice.lower() or voice.lower() == "neutral":
            # For male voices, look for male voice names
            male_found = False
            for i, v in enumerate(voices):
                logger.info(f"Voice {i}: {v.name} ({v.id})")
                if any(
                    term in v.name.lower()
                    for term in ["male", "david", "mark", "james"]
                ):
                    voice_id = v.id
                    logger.info(f"Selected male voice: {v.name}")
                    male_found = True
                    break

            # If no male voice found but we have voices, use the first one (often David in Windows)
            if not male_found and len(voices) > 0:
                voice_id = voices[0].id
                logger.info(f"Using likely male voice: {v.name}")

        # Set voice
        logger.info(f"Setting voice to: {voice_id}")
        engine.setProperty("voice", voice_id)

        # Set speed (rate in pyttsx3) - make it 10% slower by default
        current_rate = engine.getProperty("rate")
        # Apply both the default slower speed (0.9) and any user-specified speed
        adjusted_speed = speed * 0.9  # Apply additional 10% slowdown
        new_rate = int(current_rate * adjusted_speed)
        engine.setProperty("rate", new_rate)

        logger.info(
            f"Using pyttsx3 voice: {voice_id}, rate: {new_rate} (adjusted to be 10% slower)"
        )

        # Create unique temp filename to avoid conflicts
        temp_file = f"temp_{uuid.uuid4()}.wav"

        # Save to file
        engine.save_to_file(text, temp_file)
        engine.runAndWait()

        # Verify the file was created
        if not os.path.exists(temp_file):
            logger.error(f"pyttsx3 failed to create audio file: {temp_file}")
            return None

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

        return base64.b64encode(mp3_buffer.read()).decode("utf-8")

    except Exception as e:
        logger.error(f"pyttsx3 audio generation failed: {str(e)}", exc_info=True)
        return None


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
    voice = request.voice or "neutral"
    speed = request.speed  # Use the speed parameter from request

    logger.info(
        f"Processing TTS request: '{text[:30]}...' in language: {language}, voice: {voice}, speed: {speed}"
    )

    # Use pyttsx3 for both male and female voices to ensure correct gender voices
    if "male" in voice.lower() or "female" in voice.lower():
        logger.info(f"Using pyttsx3 for voice: {voice}")
        try:
            audio_base64 = generate_pyttsx3_audio(text, voice, speed)
            if audio_base64:
                logger.info(
                    f"Successfully generated audio with pyttsx3 for {voice} voice"
                )
                return {
                    "success": True,
                    "audio": audio_base64,
                    "format": "mp3",
                    "language": language,
                    "voice": voice,
                    "source": "pyttsx3",
                }
            else:
                logger.error("pyttsx3 generated empty audio")
        except Exception as e:
            logger.error(f"pyttsx3 TTS failed: {str(e)}", exc_info=True)
            # Fall through to SpeechBrain or gTTS

    # Use SpeechBrain for female voices and neutral
    MAX_CHARS_FOR_SPEECHBRAIN = 2000
    if len(text) <= MAX_CHARS_FOR_SPEECHBRAIN:
        tacotron2, hifigan, pitch_shift, base_speed = get_tts_models(language, voice)
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
