"""
Finnish speech recognition using Wav2Vec2 model.
This module provides functions to transcribe Finnish speech using the
aapot/wav2vec2-xlsr-300m-finnish model from HuggingFace.
"""

import os
import torch
import logging
import numpy as np
from typing import Dict, Any
import tempfile
import soundfile as sf

# Import from specific module to avoid private import warnings
from transformers.models.wav2vec2 import Wav2Vec2ForCTC, Wav2Vec2Processor

# Configure logging
logger = logging.getLogger(__name__)

# Global variables to store model and processor
wav2vec2_model = None
wav2vec2_processor = None


def load_wav2vec2_model() -> tuple[Any, Any]:
    """
    Load the Wav2Vec2 model and processor for Finnish.

    Returns:
        Tuple containing the model and processor, or (None, None) if loading fails.
    """
    global wav2vec2_model, wav2vec2_processor

    # Return cached model and processor if already loaded
    if wav2vec2_model is not None and wav2vec2_processor is not None:
        return wav2vec2_model, wav2vec2_processor

    try:
        logger.info("Loading aapot/wav2vec2-xlsr-300m-finnish model and processor")

        # Create models directory if it doesn't exist
        os.makedirs("models", exist_ok=True)

        # Set cache directory for HuggingFace models
        cache_dir = os.path.join(os.getcwd(), "models", "wav2vec2-finnish")
        os.makedirs(cache_dir, exist_ok=True)

        # Load processor and model
        processor = Wav2Vec2Processor.from_pretrained(
            "aapot/wav2vec2-xlsr-300m-finnish", cache_dir=cache_dir
        )

        model = Wav2Vec2ForCTC.from_pretrained(
            "aapot/wav2vec2-xlsr-300m-finnish", cache_dir=cache_dir
        )

        # Move model to GPU if available
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        # Ignore type checking for this line
        model.to(device)  # type: ignore

        logger.info(f"Successfully loaded Wav2Vec2 model on {device}")

        # Cache model and processor
        wav2vec2_model = model
        wav2vec2_processor = processor

        # Type annotation is removed, so we can return any type
        return model, processor

    except Exception as e:
        logger.error(f"Failed to load Wav2Vec2 model: {str(e)}")
        return None, None


def transcribe_audio_with_wav2vec2(audio_path: str) -> Dict[str, Any]:
    """
    Transcribe Finnish audio using the Wav2Vec2 model.

    Args:
        audio_path: Path to the audio file to transcribe.

    Returns:
        Dictionary containing the transcription result.
    """
    try:
        # Load model and processor
        model, processor = load_wav2vec2_model()
        if model is None or processor is None:
            logger.error("Wav2Vec2 model or processor not available")
            return {"text": "", "error": "Model not available"}

        # Load audio file
        logger.info(f"Loading audio file: {audio_path}")
        speech_array, sampling_rate = sf.read(audio_path)

        # Convert to mono if stereo
        if isinstance(speech_array, np.ndarray) and len(speech_array.shape) > 1:
            speech_array = speech_array.mean(axis=1)

        # Resample to 16kHz if needed
        if sampling_rate != 16000:
            logger.info(f"Resampling audio from {sampling_rate}Hz to 16000Hz")
            from scipy import signal

            num_samples = int(len(speech_array) * 16000 / sampling_rate)
            speech_array = signal.resample(speech_array, num_samples)
            sampling_rate = 16000

        # Ensure audio is float32 and properly formatted
        speech_array = np.asarray(speech_array)
        if isinstance(speech_array, np.ndarray) and speech_array.dtype != np.float32:
            speech_array = speech_array.astype(np.float32)

        # Normalize audio if needed
        max_val = (
            np.abs(speech_array).max() if isinstance(speech_array, np.ndarray) else 0
        )
        if max_val > 1.0:
            speech_array = speech_array / max_val

        # Process audio with Wav2Vec2
        logger.info("Processing audio with Wav2Vec2 model")
        inputs = processor(speech_array, sampling_rate=16000, return_tensors="pt")

        # Move inputs to the same device as the model
        inputs = {key: val.to(model.device) for key, val in inputs.items()}

        # Get logits
        with torch.no_grad():
            logits = model(**inputs).logits

        # Decode the predicted IDs
        predicted_ids = torch.argmax(logits, dim=-1)
        transcription = processor.batch_decode(predicted_ids)[0]

        logger.info(f"Transcription completed: {transcription}")

        return {"text": transcription, "model": "wav2vec2-finnish", "success": True}

    except Exception as e:
        logger.error(f"Error in Wav2Vec2 transcription: {str(e)}")
        return {"text": "", "error": str(e), "success": False}


def transcribe_audio_data_with_wav2vec2(audio_data: bytes) -> Dict[str, Any]:
    """
    Transcribe Finnish audio data using the Wav2Vec2 model.

    Args:
        audio_data: Audio data as bytes.

    Returns:
        Dictionary containing the transcription result.
    """
    try:
        # Save audio data to temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file_path = temp_file.name
            temp_file.write(audio_data)

        # Transcribe the temporary file
        result = transcribe_audio_with_wav2vec2(temp_file_path)

        # Clean up
        try:
            os.unlink(temp_file_path)
        except Exception as e:
            logger.warning(
                f"Failed to delete temporary file {temp_file_path}: {str(e)}"
            )

        return result

    except Exception as e:
        logger.error(f"Error processing audio data with Wav2Vec2: {str(e)}")
        return {"text": "", "error": str(e), "success": False}


# Test function to verify the module works
def test_wav2vec2():
    """Test the Wav2Vec2 model with a sample audio file."""
    try:
        # Check if model can be loaded
        model, processor = load_wav2vec2_model()
        if model is None or processor is None:
            logger.error("Failed to load Wav2Vec2 model and processor")
            return False

        logger.info("Wav2Vec2 model and processor loaded successfully")
        return True

    except Exception as e:
        logger.error(f"Error testing Wav2Vec2: {str(e)}")
        return False


if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    # Test the module
    success = test_wav2vec2()
    print(f"Wav2Vec2 test {'successful' if success else 'failed'}")
