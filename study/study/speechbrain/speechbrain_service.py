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
import json
from typing import List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Speech API",
    description="API for Speech-to-Text and Text-to-Speech using open source tools",
)

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],  # Allow React app to access the API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create models directory
os.makedirs("models", exist_ok=True)

# In-memory database for language sessions and interactions
language_sessions = {}
language_interactions = []

try:
    # Simple setup check
    logger.info("Set up successful for speech API")
except Exception as e:
    logger.error(f"Error setting up speech API: {str(e)}")
    raise


class TTSRequest(BaseModel):
    text: str
    language: str = "en-US"  # Default to English


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

        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            # Write the uploaded file to the temporary file
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        # Process (simulated for now)
        try:
            logger.info(f"Transcribing audio file: {temp_path}")
            # For now, return a simple simulated response as a placeholder
            # In a real implementation, this would use an ASR service
            transcript = "This is a simulated transcript. The actual transcription will be implemented with your chosen ASR library."
            logger.info(f"Transcription result: {transcript}")
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)

        return {"success": True, "transcript": transcript, "language": language}
    except Exception as e:
        logger.error(f"Error in speech-to-text: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Speech-to-text processing failed: {str(e)}"
        )


@app.post("/api/text-to-speech")
async def text_to_speech(request: TTSRequest):
    try:
        text = request.text
        language = request.language.split("-")[
            0
        ]  # Extract the language code (e.g., "en" from "en-US")

        logger.info(f"Processing TTS request: '{text}' in language: {language}")

        # Use gTTS (Google Text-to-Speech)
        tts = gTTS(text=text, lang=language)

        # Save to a bytes buffer
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)

        # Convert to base64
        audio_base64 = base64.b64encode(mp3_fp.read()).decode("utf-8")

        return {
            "success": True,
            "audio": audio_base64,
            "format": "mp3",
            "language": language,
        }
    except Exception as e:
        logger.error(f"Error in text-to-speech: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Text-to-speech processing failed: {str(e)}"
        )


# New endpoints for Language AI functionality


@app.post("/api/ai-response")
async def ai_response(request: AIResponseRequest):
    try:
        logger.info(
            f"Processing AI response request: '{request.message}' in language: {request.language}"
        )

        # Simulate AI processing
        time.sleep(0.5)

        # Generate a simulated response
        ai_response = f"This is a simulated AI response. In a real application, this would come from your AI service. How can I help you practice your {request.language.split('-')[0]} language skills today?"

        return {"response": ai_response, "language": request.language}
    except Exception as e:
        logger.error(f"Error in AI response generation: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"AI response generation failed: {str(e)}"
        )


@app.post("/api/language-sessions")
async def create_language_session(request: LanguageSessionRequest):
    try:
        logger.info(
            f"Creating language session for user: {request.userId}, language: {request.language}"
        )

        # Generate a session ID
        session_id = f"session-{uuid.uuid4()}"

        # Store the session
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
        logger.error(f"Error creating language session: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create language session: {str(e)}"
        )


@app.get("/api/language-sessions/{userId}")
async def get_language_sessions(userId: str):
    try:
        logger.info(f"Fetching language sessions for user: {userId}")

        # Find sessions for the user
        user_sessions = [
            session
            for session_id, session in language_sessions.items()
            if session["userId"] == userId
        ]

        # If no sessions exist, return an empty list
        if not user_sessions:
            return []

        return user_sessions
    except Exception as e:
        logger.error(f"Error fetching language sessions: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch language sessions: {str(e)}"
        )


@app.post("/api/language-ai/interactions")
async def save_language_interaction(request: LanguageInteractionRequest):
    try:
        logger.info(f"Saving language interaction for session: {request.sessionId}")

        # Create an interaction record
        interaction_id = f"interaction-{uuid.uuid4()}"
        interaction = {
            "id": interaction_id,
            "sessionId": request.sessionId,
            "userMessage": request.userMessage,
            "aiResponse": request.aiResponse,
            "audioUrl": request.audioUrl,
            "timestamp": request.timestamp or time.time(),
        }

        # Store the interaction
        language_interactions.append(interaction)

        return {
            "id": interaction_id,
            "sessionId": request.sessionId,
            "timestamp": interaction["timestamp"],
        }
    except Exception as e:
        logger.error(f"Error saving language interaction: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to save interaction: {str(e)}"
        )


@app.get("/api/language-ai/interactions/{sessionId}")
async def get_language_interactions(sessionId: str):
    try:
        logger.info(f"Fetching language interactions for session: {sessionId}")

        # Find interactions for the session
        session_interactions = [
            interaction
            for interaction in language_interactions
            if interaction["sessionId"] == sessionId
        ]

        # Sort by timestamp
        session_interactions.sort(key=lambda x: x["timestamp"])

        return session_interactions
    except Exception as e:
        logger.error(f"Error fetching language interactions: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch interactions: {str(e)}"
        )


@app.get("/api/users/{userId}/language-proficiency")
async def get_language_proficiency(userId: str, language: Optional[str] = None):
    try:
        logger.info(
            f"Fetching language proficiency for user: {userId}, language: {language}"
        )

        # Create a simulated response
        proficiency_levels = [
            "beginner",
            "intermediate",
            "advanced",
            "fluent",
            "native",
        ]

        # If a specific language is requested, return just that
        if language:
            return {
                "userId": userId,
                "language": language,
                "level": "intermediate",  # Simulated level
                "lastUpdated": time.time(),
            }

        # Otherwise return a list of language proficiencies
        languages = ["en-US", "fi-FI", "fr-FR", "de-DE", "es-ES"]
        proficiencies = []

        for lang in languages:
            proficiencies.append(
                {
                    "userId": userId,
                    "language": lang,
                    "level": proficiency_levels[
                        languages.index(lang) % len(proficiency_levels)
                    ],
                    "lastUpdated": time.time(),
                }
            )

        return proficiencies
    except Exception as e:
        logger.error(f"Error fetching language proficiency: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch language proficiency: {str(e)}"
        )


if __name__ == "__main__":
    # Run the FastAPI server
    port = int(os.environ.get("PORT", 8008))
    logger.info(f"Starting Speech API service on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
