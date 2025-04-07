from faster_whisper import WhisperModel
from fastapi import (
    FastAPI,
    WebSocket,
    UploadFile,
    File,
    HTTPException,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import uvicorn
import asyncio
import logging
from typing import List, Dict, Any
import io

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("whisper-api")

app = FastAPI(title="Finnish Speech Recognition API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instance - load once at startup
model = None


@app.on_event("startup")
async def startup_event():
    global model
    logger.info("Loading Whisper model...")
    # Initialize with CUDA (if available) and optimize for Finnish
    model = WhisperModel(
        "large-v3",
        device="cuda",
        compute_type="float16",
        download_root="./models",  # Cache models locally
    )
    logger.info("Model loaded successfully")


@app.post("/api/speech/transcribe")
async def transcribe(audio: UploadFile = File(...), language: str = "fi"):
    """Transcribe audio file (non-streaming API)"""
    global model
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # Read audio file
        audio_data = await audio.read()
        # Convert to 16kHz mono PCM if needed
        audio_np = np.frombuffer(audio_data, dtype=np.float32)

        # Run transcription with optimized parameters for Finnish
        segments, info = model.transcribe(
            audio_np,
            language=language,
            beam_size=5,
            vad_filter=True,  # Use VAD to filter out silence
            vad_parameters=dict(min_silence_duration_ms=300),
        )

        # Extract text and timing information
        result = []
        for segment in segments:
            result.append(
                {"text": segment.text, "start": segment.start, "end": segment.end}
            )

        return {
            "text": " ".join(segment["text"] for segment in result),
            "segments": result,
            "language": info.language,
            "language_probability": info.language_probability,
        }

    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# WebSocket endpoint for real-time transcription
@app.websocket("/api/speech/stream")
async def stream_transcribe(websocket: WebSocket):
    global model
    if model is None:
        await websocket.close(code=1011, reason="Model not loaded")
        return

    await websocket.accept()

    try:
        # Initial configuration
        config = await websocket.receive_json()
        language = config.get("language", "fi")
        logger.info(f"Starting streaming session with language: {language}")

        while True:
            # Receive audio chunk
            audio_data = await websocket.receive_bytes()

            if not audio_data:
                continue

            # Convert to numpy array
            audio_np = np.frombuffer(audio_data, dtype=np.float32)

            # Process only if we have enough audio
            if len(audio_np) < 1600:  # At least 0.1s of audio @ 16kHz
                await websocket.send_json({"status": "need_more_audio"})
                continue

            # Transcribe chunk
            segments, info = model.transcribe(
                audio_np,
                language=language,
                beam_size=5,  # Higher beam size for better accuracy
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=300),
            )

            # Collect results
            result = []
            for segment in segments:
                result.append(
                    {"text": segment.text, "start": segment.start, "end": segment.end}
                )

            full_text = " ".join(segment["text"] for segment in result).strip()

            # Only send if we have actual transcription
            if full_text:
                await websocket.send_json(
                    {"status": "success", "text": full_text, "segments": result}
                )
            else:
                await websocket.send_json({"status": "no_speech_detected"})

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        try:
            await websocket.close(code=1011, reason=str(e))
        except Exception:
            pass  # Already closed


@app.get("/api/speech/health")
async def health_check():
    """Health check endpoint"""
    global model
    return {
        "status": "healthy" if model is not None else "initializing",
        "model": "large-v3",
        "device": "cuda" if model and model.model.device == "cuda" else "cpu",
    }


if __name__ == "__main__":
    uvicorn.run("whisper_server:app", host="0.0.0.0", port=9008, log_level="info")
