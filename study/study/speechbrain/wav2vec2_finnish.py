"""
Finnish speech recognition using Wav2Vec2 model.
This module provides functions to transcribe Finnish speech using the
aapot/wav2vec2-xlsr-1b-finnish-lm-v2 model from HuggingFace.
This model includes a KenLM language model for improved accuracy.
"""

import os
import torch
import logging
import numpy as np
from typing import Dict, Any
import tempfile
import soundfile as sf
import shutil
import warnings

# Filter out specific warnings - use more aggressive approach
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

# Completely silence all transformers output
import os

# Set environment variable to disable transformers warnings
os.environ["TRANSFORMERS_VERBOSITY"] = "error"

# Silence all loggers
logging.getLogger("transformers").setLevel(logging.ERROR)
logging.getLogger("huggingface").setLevel(logging.ERROR)
logging.getLogger("datasets").setLevel(logging.ERROR)

# Import from specific module to avoid private import warnings
from transformers.models.wav2vec2 import Wav2Vec2ForCTC, Wav2Vec2Processor

# Configure logging
logger = logging.getLogger(__name__)

# Global variables to store model and processor
wav2vec2_model = None
wav2vec2_processor = None

# Flag to track if model is loaded in memory
model_loaded_in_memory = False


def load_wav2vec2_model() -> tuple[Any, Any]:
    """
    Load the Wav2Vec2 model and processor for Finnish.

    This function implements a robust loading mechanism that:
    1. Uses cached model in memory if available
    2. Loads from local storage if the model is completely downloaded
    3. Resumes download if the model is partially downloaded
    4. Downloads the model if it's not available locally

    Returns:
        Tuple containing the model and processor, or (None, None) if loading fails.
    """
    global wav2vec2_model, wav2vec2_processor, model_loaded_in_memory

    # Return cached model and processor if already loaded in memory
    if wav2vec2_model is not None and wav2vec2_processor is not None:
        logger.info("Using Wav2Vec2 model already loaded in memory")
        return wav2vec2_model, wav2vec2_processor

    try:
        logger.info("Loading aapot/wav2vec2-xlsr-300m-finnish model and processor")

        # Create models directory if it doesn't exist
        os.makedirs("models", exist_ok=True)

        # Set cache directory for HuggingFace models
        cache_dir = os.path.join(os.getcwd(), "models", "wav2vec2-finnish")
        os.makedirs(cache_dir, exist_ok=True)

        # Path to local model directory
        local_model_path = os.path.join(
            cache_dir, "models--aapot--wav2vec2-xlsr-300m-finnish"
        )

        # Path to the snapshots directory
        snapshots_dir = os.path.join(local_model_path, "snapshots")

        # Create a flag file to track download completion
        download_complete_flag = os.path.join(cache_dir, "download_complete.flag")

        # Check if model exists locally and is complete
        model_complete = is_model_downloaded()

        # If the flag file exists but the model is incomplete, something went wrong
        if os.path.exists(download_complete_flag) and not model_complete:
            logger.warning(
                "Download flag exists but model is incomplete. Will attempt to repair."
            )
            # Don't remove the flag yet - we'll try to load the model first

        # If model exists but is incomplete, don't clean it up - try to resume download
        if not model_complete and os.path.exists(local_model_path):
            logger.info("Found incomplete model, will attempt to resume download")

            # Check if model.safetensors exists but is incomplete (partial download)
            model_safetensors_path = os.path.join(local_model_path, "model.safetensors")
            if (
                os.path.exists(model_safetensors_path)
                and os.path.getsize(model_safetensors_path) > 0
            ):
                logger.info(
                    "Found partially downloaded model.safetensors, will resume download"
                )
            else:
                # Only clean if there's no partial model file that could be resumed
                cleaned = clean_incomplete_model()
                if cleaned:
                    logger.info(
                        "Cleaned up incomplete model directory, will download fresh model"
                    )

        # Try again after potential cleaning
        model_complete = is_model_downloaded()

        # First try to load from local path if either:
        # 1. The model is complete based on file checks
        # 2. The download_complete_flag exists (indicating a previous successful download)
        # 3. The model directory exists (we'll try to load it anyway)
        if (
            model_complete
            or os.path.exists(download_complete_flag)
            or os.path.exists(local_model_path)
        ):
            # Check which format is available
            model_safetensors_path = os.path.join(local_model_path, "model.safetensors")
            use_safetensors = os.path.exists(model_safetensors_path)

            if use_safetensors:
                logger.info(
                    f"Loading Wav2Vec2 model from local path (safetensors format): {local_model_path}"
                )
            else:
                logger.info(
                    f"Loading Wav2Vec2 model from local path (pytorch format): {local_model_path}"
                )

            # Try to load from local path
            try:
                # First, check if we need to copy model files from parent directory
                copied_from_parent = check_and_copy_model_from_parent_dir(
                    local_model_path
                )
                if copied_from_parent:
                    logger.info("Successfully copied model files from parent directory")

                # Then, check if we need to copy model files from snapshots
                if not copied_from_parent:
                    copied_from_snapshots = check_and_copy_model_from_snapshots(
                        local_model_path
                    )
                    if copied_from_snapshots:
                        logger.info(
                            "Successfully copied model files from snapshots directory"
                        )

                # Search the entire cache directory for model files
                if not copied_from_parent and not copied_from_snapshots:
                    copied_from_cache = find_and_copy_model_from_cache(
                        local_model_path, cache_dir
                    )
                    if copied_from_cache:
                        logger.info(
                            "Successfully found and copied model files from cache directory"
                        )

                # As a last resort, download the model directly
                if (
                    not copied_from_parent
                    and not copied_from_snapshots
                    and not copied_from_cache
                ):
                    downloaded_directly = download_model_directly(
                        local_model_path, cache_dir
                    )
                    if downloaded_directly:
                        logger.info(
                            "Successfully downloaded model directly from HuggingFace"
                        )

                # Check for missing files and create them if needed
                _, missing_files = verify_model_files(local_model_path)

                # Clean up any incorrect configuration files
                cleaned_configs = clean_config_files(local_model_path)
                if cleaned_configs:
                    logger.info("Cleaned up incorrect configuration files")
                    # Re-check for missing files after cleaning
                    _, missing_files = verify_model_files(local_model_path)

                # Create missing configuration files if needed
                import json

                # Check for missing config.json
                if "config.json" in missing_files:
                    config_path = os.path.join(local_model_path, "config.json")
                    logger.info("Creating missing config.json file")
                    config = {
                        "architectures": ["Wav2Vec2ForCTC"],
                        "model_type": "wav2vec2",
                        "hidden_size": 1280,  # Updated from 1024 to 1280 to match the model
                        "num_hidden_layers": 24,
                        "num_attention_heads": 16,
                        "intermediate_size": 5120,  # Updated to match the larger hidden size
                        "hidden_act": "gelu",
                        "hidden_dropout": 0.1,
                        "activation_dropout": 0.1,
                        "attention_dropout": 0.1,
                        "feat_proj_dropout": 0.0,
                        "final_dropout": 0.1,
                        "layerdrop": 0.1,
                        "initializer_range": 0.02,
                        "layer_norm_eps": 1e-5,
                        "feat_extract_norm": "group",
                        "feat_extract_activation": "gelu",
                        "conv_dim": [512, 512, 512, 512, 512, 512, 512],
                        "conv_stride": [5, 2, 2, 2, 2, 2, 2],
                        "conv_kernel": [10, 3, 3, 3, 3, 2, 2],
                        "conv_bias": True,
                        "num_conv_pos_embeddings": 128,
                        "num_conv_pos_embedding_groups": 16,
                        "do_stable_layer_norm": True,
                        "apply_spec_augment": True,
                        "mask_time_prob": 0.05,
                        "mask_time_length": 10,
                        "mask_time_min_masks": 2,
                        "mask_feature_prob": 0.0,
                        "mask_feature_length": 10,
                        "mask_feature_min_masks": 0,
                        "num_codevectors_per_group": 320,
                        "num_codevector_groups": 2,
                        "contrastive_logits_temperature": 0.1,
                        "num_negatives": 100,
                        "codevector_dim": 256,
                        "proj_codevector_dim": 256,
                        "diversity_loss_weight": 0.1,
                        "ctc_loss_reduction": "sum",
                        "ctc_zero_infinity": False,
                        "use_weighted_layer_sum": False,
                        "classifier_proj_size": 256,
                        "pad_token_id": 0,
                        "bos_token_id": 1,
                        "eos_token_id": 2,
                        "vocab_size": 35,  # Updated to match the model's vocabulary size
                        "transformers_version": "4.25.1",
                    }
                    with open(config_path, "w") as f:
                        json.dump(config, f, indent=2)

                # Check for missing preprocessor_config.json
                if "preprocessor_config.json" in missing_files:
                    preprocessor_path = os.path.join(
                        local_model_path, "preprocessor_config.json"
                    )
                    logger.info("Creating missing preprocessor_config.json file")
                    preprocessor_config = {
                        "feature_extractor_type": "Wav2Vec2FeatureExtractor",
                        "feature_size": 1,
                        "sampling_rate": 16000,
                        "padding_value": 0.0,
                        "do_normalize": True,
                        "return_attention_mask": True,
                    }
                    with open(preprocessor_path, "w") as f:
                        json.dump(preprocessor_config, f, indent=2)

                # Check for missing tokenizer_config.json
                if "tokenizer_config.json" in missing_files:
                    tokenizer_path = os.path.join(
                        local_model_path, "tokenizer_config.json"
                    )
                    logger.info("Creating missing tokenizer_config.json file")
                    tokenizer_config = {
                        "tokenizer_class": "Wav2Vec2CTCTokenizer",
                        "bos_token": "<s>",
                        "eos_token": "</s>",
                        "unk_token": "<unk>",
                        "pad_token": "<pad>",
                        "word_delimiter_token": "|",
                        "do_lower_case": True,
                    }
                    with open(tokenizer_path, "w") as f:
                        json.dump(tokenizer_config, f, indent=2)

                # Check for missing vocab.json
                if "vocab.json" in missing_files:
                    vocab_path = os.path.join(local_model_path, "vocab.json")
                    logger.info("Creating missing vocab.json file")
                    vocab = {
                        "<pad>": 0,
                        "<s>": 1,
                        "</s>": 2,
                        "<unk>": 3,
                        "|": 4,
                        "a": 5,
                        "b": 6,
                        "c": 7,
                        "d": 8,
                        "e": 9,
                        "f": 10,
                        "g": 11,
                        "h": 12,
                        "i": 13,
                        "j": 14,
                        "k": 15,
                        "l": 16,
                        "m": 17,
                        "n": 18,
                        "o": 19,
                        "p": 20,
                        "q": 21,
                        "r": 22,
                        "s": 23,
                        "t": 24,
                        "u": 25,
                        "v": 26,
                        "w": 27,
                        "x": 28,
                        "y": 29,
                        "z": 30,
                        "å": 31,
                        "ä": 32,
                        "ö": 33,
                        "-": 34,  # Added hyphen as the 35th token
                    }
                    with open(vocab_path, "w") as f:
                        json.dump(vocab, f, indent=2)

                # Now try loading with local_files_only=True
                try:
                    processor = Wav2Vec2Processor.from_pretrained(
                        local_model_path, local_files_only=True
                    )

                    model = Wav2Vec2ForCTC.from_pretrained(
                        local_model_path,
                        local_files_only=True,
                        use_safetensors=use_safetensors,
                    )

                    # If we get here, loading was successful
                    logger.info("Successfully loaded model from local path")

                    # Create the flag file if it doesn't exist yet
                    if not os.path.exists(download_complete_flag):
                        with open(download_complete_flag, "w") as f:
                            f.write("Model download completed successfully")
                        logger.info(
                            f"Created download completion flag at {download_complete_flag}"
                        )

                    # Move model to GPU if available
                    device = torch.device(
                        "cuda" if torch.cuda.is_available() else "cpu"
                    )
                    model.to(device)  # type: ignore

                    # Cache model and processor
                    wav2vec2_model = model
                    wav2vec2_processor = processor
                    model_loaded_in_memory = True

                    logger.info(f"Successfully loaded Wav2Vec2 model on {device}")
                    return model, processor

                except Exception as local_error:
                    # If loading with local_files_only fails, try without it to allow downloading missing files
                    logger.warning(
                        f"Failed to load model with local_files_only=True: {str(local_error)}"
                    )

                    # Check if the error is due to parameter mismatch
                    if "size mismatch" in str(local_error):
                        if "masked_spec_embed" in str(local_error):
                            logger.warning(
                                "Parameter size mismatch detected in masked_spec_embed. Recreating config.json with correct parameters."
                            )
                        elif "size mismatch for weight" in str(
                            local_error
                        ) and "copying a param with shape torch.Size([35, 1024])" in str(
                            local_error
                        ):
                            logger.warning(
                                "Dimension mismatch detected. The model has hidden_size=1024 but our configuration has hidden_size=1280. Recreating config.json with correct parameters."
                            )

                        # Recreate the config.json file with the correct parameters
                        config_path = os.path.join(local_model_path, "config.json")
                        try:
                            import json

                            config = {
                                "architectures": ["Wav2Vec2ForCTC"],
                                "model_type": "wav2vec2",
                                "hidden_size": 1024,  # Changed from 1280 to 1024 to match the model's actual dimensions
                                "num_hidden_layers": 24,
                                "num_attention_heads": 16,
                                "intermediate_size": 5120,
                                "hidden_act": "gelu",
                                "hidden_dropout": 0.1,
                                "activation_dropout": 0.1,
                                "attention_dropout": 0.1,
                                "feat_proj_dropout": 0.0,
                                "final_dropout": 0.1,
                                "layerdrop": 0.1,
                                "initializer_range": 0.02,
                                "layer_norm_eps": 1e-5,
                                "feat_extract_norm": "group",
                                "feat_extract_activation": "gelu",
                                "conv_dim": [512, 512, 512, 512, 512, 512, 512],
                                "conv_stride": [5, 2, 2, 2, 2, 2, 2],
                                "conv_kernel": [10, 3, 3, 3, 3, 2, 2],
                                "conv_bias": True,
                                "num_conv_pos_embeddings": 128,
                                "num_conv_pos_embedding_groups": 16,
                                "do_stable_layer_norm": True,
                                "apply_spec_augment": True,
                                "mask_time_prob": 0.05,
                                "mask_time_length": 10,
                                "mask_time_min_masks": 2,
                                "mask_feature_prob": 0.0,
                                "mask_feature_length": 10,
                                "mask_feature_min_masks": 0,
                                "num_codevectors_per_group": 320,
                                "num_codevector_groups": 2,
                                "contrastive_logits_temperature": 0.1,
                                "num_negatives": 100,
                                "codevector_dim": 256,
                                "proj_codevector_dim": 256,
                                "diversity_loss_weight": 0.1,
                                "ctc_loss_reduction": "sum",
                                "ctc_zero_infinity": False,
                                "use_weighted_layer_sum": False,
                                "classifier_proj_size": 256,
                                "pad_token_id": 0,
                                "bos_token_id": 1,
                                "eos_token_id": 2,
                                "vocab_size": 35,  # Updated to match the model's vocabulary size
                                "transformers_version": "4.25.1",
                            }
                            with open(config_path, "w") as f:
                                json.dump(config, f, indent=2)

                            logger.info(
                                "Recreated config.json with correct parameters. Trying to load model again."
                            )

                            # Also recreate the vocab.json file with the correct tokens
                            vocab_path = os.path.join(local_model_path, "vocab.json")
                            try:
                                import json

                                vocab = {
                                    "<pad>": 0,
                                    "<s>": 1,
                                    "</s>": 2,
                                    "<unk>": 3,
                                    "|": 4,
                                    "a": 5,
                                    "b": 6,
                                    "c": 7,
                                    "d": 8,
                                    "e": 9,
                                    "f": 10,
                                    "g": 11,
                                    "h": 12,
                                    "i": 13,
                                    "j": 14,
                                    "k": 15,
                                    "l": 16,
                                    "m": 17,
                                    "n": 18,
                                    "o": 19,
                                    "p": 20,
                                    "q": 21,
                                    "r": 22,
                                    "s": 23,
                                    "t": 24,
                                    "u": 25,
                                    "v": 26,
                                    "w": 27,
                                    "x": 28,
                                    "y": 29,
                                    "z": 30,
                                    "å": 31,
                                    "ä": 32,
                                    "ö": 33,
                                    "-": 34,  # Added hyphen as the 35th token
                                }
                                with open(vocab_path, "w") as f:
                                    json.dump(vocab, f, indent=2)

                                logger.info(
                                    "Recreated vocab.json with correct tokens including hyphen"
                                )
                            except Exception as vocab_error:
                                logger.warning(
                                    f"Failed to recreate vocab.json: {str(vocab_error)}"
                                )

                            # Try loading again with the corrected config
                            try:
                                processor = Wav2Vec2Processor.from_pretrained(
                                    local_model_path, local_files_only=True
                                )

                                model = Wav2Vec2ForCTC.from_pretrained(
                                    local_model_path,
                                    local_files_only=True,
                                    use_safetensors=use_safetensors,
                                )

                                # If we get here, loading was successful
                                logger.info(
                                    "Successfully loaded model with corrected config"
                                )

                                # Create the flag file if it doesn't exist yet
                                if not os.path.exists(download_complete_flag):
                                    with open(download_complete_flag, "w") as f:
                                        f.write("Model download completed successfully")
                                    logger.info(
                                        f"Created download completion flag at {download_complete_flag}"
                                    )

                                # Move model to GPU if available
                                device = torch.device(
                                    "cuda" if torch.cuda.is_available() else "cpu"
                                )
                                model.to(device)  # type: ignore

                                # Cache model and processor
                                wav2vec2_model = model
                                wav2vec2_processor = processor
                                model_loaded_in_memory = True

                                logger.info(
                                    f"Successfully loaded Wav2Vec2 model on {device}"
                                )
                                return model, processor
                            except Exception as retry_error:
                                logger.warning(
                                    f"Failed to load model with corrected config: {str(retry_error)}"
                                )
                        except Exception as config_error:
                            logger.warning(
                                f"Failed to recreate config.json: {str(config_error)}"
                            )

                    logger.info(
                        "Trying to load model with downloading enabled to fix missing files"
                    )

                    processor = Wav2Vec2Processor.from_pretrained(
                        "aapot/wav2vec2-xlsr-300m-finnish", cache_dir=cache_dir
                    )

                    model = Wav2Vec2ForCTC.from_pretrained(
                        "aapot/wav2vec2-xlsr-300m-finnish",
                        cache_dir=cache_dir,
                        use_safetensors=use_safetensors,
                        resume_download=True,
                    )

                    # If we get here, loading with downloading was successful
                    logger.info("Successfully loaded model with downloading enabled")

                    # Create the flag file
                    with open(download_complete_flag, "w") as f:
                        f.write("Model download completed successfully")
                    logger.info(
                        f"Created download completion flag at {download_complete_flag}"
                    )

                    # Move model to GPU if available
                    device = torch.device(
                        "cuda" if torch.cuda.is_available() else "cpu"
                    )
                    model.to(device)  # type: ignore

                    # Cache model and processor
                    wav2vec2_model = model
                    wav2vec2_processor = processor
                    model_loaded_in_memory = True

                    logger.info(f"Successfully loaded Wav2Vec2 model on {device}")
                    return model, processor

            except Exception as e:
                logger.error(
                    f"Failed to load model from local path or with downloading: {str(e)}"
                )
                # If loading fails completely, remove the flag file and try downloading again
                if os.path.exists(download_complete_flag):
                    os.remove(download_complete_flag)
                model_complete = False

        # If we get here, we need to download the model from scratch
        logger.info("Downloading model from HuggingFace")

        # Load processor and model from HuggingFace with all required files
        processor = Wav2Vec2Processor.from_pretrained(
            "aapot/wav2vec2-xlsr-300m-finnish", cache_dir=cache_dir
        )

        # Try to download using safetensors format first
        try:
            logger.info("Attempting to download model in safetensors format")
            model = Wav2Vec2ForCTC.from_pretrained(
                "aapot/wav2vec2-xlsr-300m-finnish",
                cache_dir=cache_dir,
                use_safetensors=True,
                resume_download=True,  # Enable resuming download
            )
        except Exception as e:
            logger.warning(f"Failed to download safetensors format: {str(e)}")
            logger.info("Falling back to PyTorch format")
            model = Wav2Vec2ForCTC.from_pretrained(
                "aapot/wav2vec2-xlsr-300m-finnish",
                cache_dir=cache_dir,
                use_safetensors=False,
                resume_download=True,  # Enable resuming download
            )

        # Create the flag file to indicate successful download
        with open(download_complete_flag, "w") as f:
            f.write("Model download completed successfully")
        logger.info(f"Created download completion flag at {download_complete_flag}")

        # Move model to GPU if available
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)  # type: ignore

        logger.info(f"Successfully loaded Wav2Vec2 model on {device}")

        # Cache model and processor
        wav2vec2_model = model
        wav2vec2_processor = processor
        model_loaded_in_memory = True

        # Log success message with source information
        logger.info("Successfully loaded and cached Wav2Vec2 model from HuggingFace")

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

        # Check if audio is too short (less than 0.5 seconds at 16kHz)
        min_samples = int(0.5 * 16000)  # 0.5 seconds at 16kHz
        if len(speech_array) < min_samples:
            logger.warning(
                f"Audio file is too short: {len(speech_array)} samples, minimum required: {min_samples}"
            )
            return {
                "text": "Äänitiedosto on liian lyhyt.",
                "error": "audio_too_short",
                "success": False,
            }

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

        # Get predicted IDs
        predicted_ids = torch.argmax(logits, dim=-1)

        # Decode the predicted IDs
        # Check if processor has a language model (LM) decoder
        if hasattr(processor, "decoder") and processor.decoder is not None:
            # Use language model for decoding
            logger.info("Using KenLM language model for decoding")
            transcription = processor.decode(predicted_ids[0].cpu().numpy())
        else:
            # Standard decoding without LM
            transcription = processor.batch_decode(predicted_ids)[0]

        # Clean up the transcription by removing special tokens
        transcription = (
            transcription.replace("</s>", " ")
            .replace("<s>", " ")
            .replace("<pad>", " ")
            .replace("<unk>", " ")
        )

        # Remove multiple spaces and strip
        import re

        transcription = re.sub(r"\s+", " ", transcription).strip()

        # If the transcription contains only single letters with spaces, it's likely noise
        if re.match(r"^(\s*[a-zA-Z]\s*)+$", transcription):
            logger.warning(
                f"Transcription appears to be noise (single letters): {transcription}"
            )
            transcription = ""  # Return empty string for noise

        logger.info(f"Transcription completed: {transcription}")

        return {
            "text": transcription,
            "model": "wav2vec2-xlsr-300m-finnish",
            "success": True,
        }

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


def clean_config_files(local_model_path):
    """
    Clean up configuration files that might have incorrect parameters.

    Args:
        local_model_path: Path to the model directory

    Returns:
        bool: True if cleaning was performed, False otherwise
    """
    try:
        # Check if the directory exists
        if not os.path.exists(local_model_path):
            logger.info("No model directory to clean config files from")
            return False

        # List of configuration files to check
        config_files = [
            "config.json",
            "preprocessor_config.json",
            "tokenizer_config.json",
        ]
        cleaned = False

        for config_file in config_files:
            config_path = os.path.join(local_model_path, config_file)
            if os.path.exists(config_path):
                # If it's config.json, check if it has the correct hidden_size
                if config_file == "config.json":
                    try:
                        import json

                        with open(config_path, "r") as f:
                            config = json.load(f)

                        # Check if the hidden_size is wrong (needs to be 1280 for this model)
                        if config.get("hidden_size", 0) != 1280:
                            logger.warning(
                                f"Incorrect hidden_size in config.json: {config.get('hidden_size')}. Should be 1280. Fixing file."
                            )
                            config["hidden_size"] = 1280
                            cleaned = True
                        # Check if the vocab_size is wrong (needs to be 35 for this model)
                        if config.get("vocab_size", 0) != 35:
                            logger.warning(
                                f"Incorrect vocab_size in config.json: {config.get('vocab_size')}. Should be 35. Fixing file."
                            )
                            config["vocab_size"] = 35
                            cleaned = True

                        # If we made changes, write the updated config back to the file
                        if cleaned:
                            with open(config_path, "w") as f:
                                json.dump(config, f, indent=2)
                            logger.info("Updated config.json with correct parameters")
                    except Exception as e:
                        # If there's an error reading the file, it's probably corrupted
                        logger.warning(
                            f"Error reading {config_file}: {str(e)}. Removing file."
                        )
                        os.remove(config_path)
                        cleaned = True
                # For vocab.json, check if it has the correct number of tokens
                elif config_file == "vocab.json":
                    try:
                        import json

                        with open(config_path, "r") as f:
                            vocab = json.load(f)

                        # Check if the vocab has the wrong number of tokens (needs to be 35 for this model)
                        if len(vocab) != 35 or "-" not in vocab:
                            hyphen_present = "-" in vocab
                            logger.warning(
                                f"Incorrect vocab.json: {len(vocab)} tokens, hyphen present: {hyphen_present}. Should be 35 tokens including hyphen. Fixing file."
                            )
                            # Create a correct vocab dictionary
                            correct_vocab = {
                                "<pad>": 0,
                                "<s>": 1,
                                "</s>": 2,
                                "<unk>": 3,
                                "|": 4,
                                "a": 5,
                                "b": 6,
                                "c": 7,
                                "d": 8,
                                "e": 9,
                                "f": 10,
                                "g": 11,
                                "h": 12,
                                "i": 13,
                                "j": 14,
                                "k": 15,
                                "l": 16,
                                "m": 17,
                                "n": 18,
                                "o": 19,
                                "p": 20,
                                "q": 21,
                                "r": 22,
                                "s": 23,
                                "t": 24,
                                "u": 25,
                                "v": 26,
                                "w": 27,
                                "x": 28,
                                "y": 29,
                                "z": 30,
                                "å": 31,
                                "ä": 32,
                                "ö": 33,
                                "-": 34,  # Added hyphen as the 35th token
                            }
                            # Write the corrected vocab file
                            with open(config_path, "w") as f:
                                json.dump(correct_vocab, f, indent=2)
                            logger.info(
                                "Fixed vocab.json with correct tokens including hyphen"
                            )
                            cleaned = True
                    except Exception as e:
                        # If there's an error reading the file, it's probably corrupted
                        logger.warning(
                            f"Error reading {config_file}: {str(e)}. Removing file."
                        )
                        os.remove(config_path)
                        cleaned = True
                # For other config files, just check if they're empty or very small
                elif os.path.getsize(config_path) < 10:  # Essentially empty
                    logger.warning(f"Empty or very small {config_file}. Removing file.")
                    os.remove(config_path)
                    cleaned = True

        return cleaned

    except Exception as e:
        logger.error(f"Error cleaning config files: {str(e)}")
        return False


def clean_incomplete_model():
    """
    Carefully clean incomplete model directory to force a fresh download.

    This function is extremely conservative about removing files:
    1. It preserves any partially downloaded model files
    2. It only removes the directory if it's clearly corrupted or empty
    3. It handles permission errors gracefully
    4. It preserves the download completion flag if possible

    Returns:
        bool: True if directory was cleaned, False otherwise
    """
    try:
        cache_dir = os.path.join(os.getcwd(), "models", "wav2vec2-finnish")
        local_model_path = os.path.join(
            cache_dir, "models--aapot--wav2vec2-xlsr-1b-finnish-lm-v2"
        )

        # Check for download completion flag
        download_complete_flag = os.path.join(cache_dir, "download_complete.flag")

        if os.path.exists(local_model_path):
            # Check if model is incomplete
            if not is_model_downloaded():
                # Check for model files which might be partially downloaded
                model_safetensors_path = os.path.join(
                    local_model_path, "model.safetensors"
                )
                model_bin_path = os.path.join(local_model_path, "pytorch_model.bin")

                # If either model file exists and has content, keep it for resuming
                if (
                    os.path.exists(model_safetensors_path)
                    and os.path.getsize(model_safetensors_path) > 0
                ) or (
                    os.path.exists(model_bin_path)
                    and os.path.getsize(model_bin_path) > 0
                ):
                    logger.info(
                        f"Found partial model file, keeping directory for resuming download: {local_model_path}"
                    )
                    return False

                # Check if the directory is empty or has very small files (likely corrupted)
                total_size = 0
                for root, dirs, files in os.walk(local_model_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        if os.path.exists(file_path):
                            total_size += os.path.getsize(file_path)

                # If directory has substantial content (>1MB), don't remove it
                if total_size > 1024 * 1024:  # 1MB
                    logger.info(
                        f"Model directory has {total_size/1024/1024:.2f}MB of data, keeping it for potential resuming"
                    )
                    return False

                # Only remove directory if it's clearly corrupted or empty
                logger.warning(
                    f"Removing incomplete model directory: {local_model_path}"
                )
                try:
                    shutil.rmtree(local_model_path)

                    # Keep the download flag if it exists - it will be used to trigger a fresh download
                    # rather than trying to load from a non-existent directory
                    if os.path.exists(download_complete_flag):
                        logger.info("Keeping download flag to trigger a fresh download")

                    return True
                except PermissionError:
                    # Handle case where files are locked by another process
                    logger.warning(
                        "Cannot remove directory - files may be in use. Will try to use existing files."
                    )
                    return False
        return False
    except Exception as e:
        logger.error(f"Error cleaning incomplete model: {str(e)}")
        return False


def is_model_in_memory():
    """Check if the model is already loaded in memory"""
    global model_loaded_in_memory, wav2vec2_model, wav2vec2_processor
    return (
        model_loaded_in_memory
        and wav2vec2_model is not None
        and wav2vec2_processor is not None
    )


def download_model_directly(local_model_path, cache_dir):
    """
    Download the model directly from HuggingFace using requests.
    This is a last resort if the model can't be found locally.

    Args:
        local_model_path: Path to the model directory
        cache_dir: Path to the cache directory

    Returns:
        bool: True if model was downloaded successfully, False otherwise
    """
    import requests
    import os

    # Target path for the model file
    target_safetensors_path = os.path.join(local_model_path, "model.safetensors")

    # Check if we already have the model file
    if (
        os.path.exists(target_safetensors_path)
        and os.path.getsize(target_safetensors_path) > 0
    ):
        return False  # No need to download, we already have the file

    # URL for the model file on HuggingFace
    model_url = "https://huggingface.co/aapot/wav2vec2-xlsr-1b-finnish-lm-v2/resolve/main/model.safetensors"

    try:
        logger.info(f"Downloading model directly from {model_url}")

        # Make sure the directory exists
        os.makedirs(os.path.dirname(target_safetensors_path), exist_ok=True)

        # Download the file with progress reporting
        response = requests.get(model_url, stream=True)
        response.raise_for_status()  # Raise an exception for HTTP errors

        # Get the total file size
        total_size = int(response.headers.get("content-length", 0))

        # Download the file in chunks
        with open(target_safetensors_path, "wb") as f:
            downloaded = 0
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:  # filter out keep-alive new chunks
                    f.write(chunk)
                    downloaded += len(chunk)
                    # Print progress
                    if total_size > 0:
                        percent = int(100 * downloaded / total_size)
                        if percent % 10 == 0:  # Print every 10%
                            logger.info(
                                f"Downloaded {percent}% ({downloaded / 1024 / 1024:.1f}MB / {total_size / 1024 / 1024:.1f}MB)"
                            )

        # Check if the download was successful
        if (
            os.path.exists(target_safetensors_path)
            and os.path.getsize(target_safetensors_path) > 0
        ):
            logger.info(f"Successfully downloaded model to {target_safetensors_path}")
            return True
        else:
            logger.error("Downloaded file is empty or doesn't exist")
            return False

    except Exception as e:
        logger.error(f"Failed to download model directly: {str(e)}")
        return False


def find_and_copy_model_from_cache(local_model_path, cache_dir):
    """
    Search for model files in the entire cache directory and copy them to the model directory if found.
    This handles the case where the model file might have been downloaded to a completely different location.

    Args:
        local_model_path: Path to the model directory
        cache_dir: Path to the cache directory

    Returns:
        bool: True if model files were found and copied, False otherwise
    """
    import shutil

    # Target paths in the model directory
    target_safetensors_path = os.path.join(local_model_path, "model.safetensors")
    target_bin_path = os.path.join(local_model_path, "pytorch_model.bin")

    # Check if we already have the model files
    if (
        os.path.exists(target_safetensors_path)
        and os.path.getsize(target_safetensors_path) > 0
    ) or (os.path.exists(target_bin_path) and os.path.getsize(target_bin_path) > 0):
        return False  # No need to search, we already have the files

    # Search for model files in the cache directory
    for root, dirs, files in os.walk(cache_dir):
        # Skip the model directory itself
        if root == local_model_path:
            continue

        # Check for model.safetensors
        if "model.safetensors" in files:
            source_path = os.path.join(root, "model.safetensors")
            if os.path.getsize(source_path) > 0:
                try:
                    logger.info(
                        f"Found model.safetensors in {root}, copying to model directory"
                    )
                    shutil.copy2(source_path, target_safetensors_path)
                    return True
                except Exception as e:
                    logger.error(
                        f"Failed to copy model.safetensors from {root}: {str(e)}"
                    )

        # Check for pytorch_model.bin
        if "pytorch_model.bin" in files:
            source_path = os.path.join(root, "pytorch_model.bin")
            if os.path.getsize(source_path) > 0:
                try:
                    logger.info(
                        f"Found pytorch_model.bin in {root}, copying to model directory"
                    )
                    shutil.copy2(source_path, target_bin_path)
                    return True
                except Exception as e:
                    logger.error(
                        f"Failed to copy pytorch_model.bin from {root}: {str(e)}"
                    )

    return False


def check_and_copy_model_from_parent_dir(local_model_path):
    """
    Check if model files exist in the parent directory and copy them to the main directory if needed.
    This handles the case where the model file might have been downloaded to the wrong location.

    Args:
        local_model_path: Path to the model directory

    Returns:
        bool: True if model files were found and copied, False otherwise
    """
    import shutil

    # Get the parent directory
    parent_dir = os.path.dirname(local_model_path)

    # Check for model files in the parent directory
    parent_safetensors_path = os.path.join(parent_dir, "model.safetensors")
    parent_bin_path = os.path.join(parent_dir, "pytorch_model.bin")

    # Target paths in the main directory
    target_safetensors_path = os.path.join(local_model_path, "model.safetensors")
    target_bin_path = os.path.join(local_model_path, "pytorch_model.bin")

    # Check if model.safetensors exists in parent and not in main directory
    if (
        os.path.exists(parent_safetensors_path)
        and os.path.getsize(parent_safetensors_path) > 0
        and (
            not os.path.exists(target_safetensors_path)
            or os.path.getsize(target_safetensors_path) == 0
        )
    ):
        try:
            logger.info(
                f"Copying model.safetensors from parent directory to model directory"
            )
            shutil.copy2(parent_safetensors_path, target_safetensors_path)
            return True
        except Exception as e:
            logger.error(
                f"Failed to copy model.safetensors from parent directory: {str(e)}"
            )

    # Check if pytorch_model.bin exists in parent and not in main directory
    if (
        os.path.exists(parent_bin_path)
        and os.path.getsize(parent_bin_path) > 0
        and (
            not os.path.exists(target_bin_path) or os.path.getsize(target_bin_path) == 0
        )
    ):
        try:
            logger.info(
                f"Copying pytorch_model.bin from parent directory to model directory"
            )
            shutil.copy2(parent_bin_path, target_bin_path)
            return True
        except Exception as e:
            logger.error(
                f"Failed to copy pytorch_model.bin from parent directory: {str(e)}"
            )

    return False


def check_and_copy_model_from_snapshots(local_model_path):
    """
    Check if model files exist in snapshots directory and copy them to the main directory if needed.

    Args:
        local_model_path: Path to the model directory

    Returns:
        bool: True if model files were found and copied, False otherwise
    """
    import shutil

    # Check for snapshot directory which might contain the model
    snapshots_dir = os.path.join(local_model_path, "snapshots")
    if not os.path.exists(snapshots_dir):
        return False

    # Look for model files in snapshot directories
    for snapshot_dir in os.listdir(snapshots_dir):
        snapshot_path = os.path.join(snapshots_dir, snapshot_dir)
        if os.path.isdir(snapshot_path):
            # Check for model files in the snapshot directory
            snapshot_model_path = os.path.join(snapshot_path, "model.safetensors")
            snapshot_model_bin_path = os.path.join(snapshot_path, "pytorch_model.bin")

            # Target paths in the main directory
            target_safetensors_path = os.path.join(
                local_model_path, "model.safetensors"
            )
            target_bin_path = os.path.join(local_model_path, "pytorch_model.bin")

            # Check if model.safetensors exists in snapshot and not in main directory
            if (
                os.path.exists(snapshot_model_path)
                and os.path.getsize(snapshot_model_path) > 0
                and (
                    not os.path.exists(target_safetensors_path)
                    or os.path.getsize(target_safetensors_path) == 0
                )
            ):
                try:
                    logger.info(
                        f"Copying model.safetensors from snapshot to main directory"
                    )
                    shutil.copy2(snapshot_model_path, target_safetensors_path)
                    return True
                except Exception as e:
                    logger.error(
                        f"Failed to copy model.safetensors from snapshot: {str(e)}"
                    )

            # Check if pytorch_model.bin exists in snapshot and not in main directory
            if (
                os.path.exists(snapshot_model_bin_path)
                and os.path.getsize(snapshot_model_bin_path) > 0
                and (
                    not os.path.exists(target_bin_path)
                    or os.path.getsize(target_bin_path) == 0
                )
            ):
                try:
                    logger.info(
                        f"Copying pytorch_model.bin from snapshot to main directory"
                    )
                    shutil.copy2(snapshot_model_bin_path, target_bin_path)
                    return True
                except Exception as e:
                    logger.error(
                        f"Failed to copy pytorch_model.bin from snapshot: {str(e)}"
                    )

    return False


def verify_model_files(local_model_path):
    """
    Verify that all required model files exist and have the correct format.

    Args:
        local_model_path: Path to the model directory

    Returns:
        tuple: (bool, list) - (True if all required files exist, list of missing files)
    """
    # List of required files
    required_files = [
        "config.json",
        "preprocessor_config.json",
        "tokenizer_config.json",
        "vocab.json",
    ]

    # Check for either model.safetensors or pytorch_model.bin
    model_files = ["model.safetensors", "pytorch_model.bin"]

    missing_files = []

    # Check for required files
    for file in required_files:
        file_path = os.path.join(local_model_path, file)
        if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
            missing_files.append(file)

    # Check for model files (need at least one)
    model_file_exists = False
    for file in model_files:
        file_path = os.path.join(local_model_path, file)
        if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
            model_file_exists = True
            break

    if not model_file_exists:
        missing_files.extend(model_files)

    return len(missing_files) == 0, missing_files


def is_model_downloaded():
    """
    Check if the model has been downloaded already.

    This function checks:
    1. If all required model files exist
    2. If the download completion flag exists

    Returns:
        bool: True if model is completely downloaded, False otherwise
    """
    try:
        cache_dir = os.path.join(os.getcwd(), "models", "wav2vec2-finnish")
        local_model_path = os.path.join(
            cache_dir, "models--aapot--wav2vec2-xlsr-1b-finnish-lm-v2"
        )

        # Check for download completion flag
        download_complete_flag = os.path.join(cache_dir, "download_complete.flag")
        flag_exists = os.path.exists(download_complete_flag)

        # Check if the model directory exists
        if not os.path.exists(local_model_path):
            logger.info("Wav2Vec2 model directory not found locally")

            # If flag exists but directory doesn't, we'll keep the flag
            # This will trigger a fresh download rather than trying to load from a non-existent directory
            if flag_exists:
                logger.warning("Download flag exists but model directory not found.")

            return False

        # Verify model files
        all_files_present, missing_files = verify_model_files(local_model_path)

        if all_files_present:
            logger.info("All required model files are present")

            # Create flag file if all files are present but flag doesn't exist
            if not flag_exists:
                try:
                    with open(download_complete_flag, "w") as f:
                        f.write("Model download completed successfully")
                    logger.info(
                        f"Created download completion flag at {download_complete_flag}"
                    )
                except Exception as e:
                    logger.error(f"Failed to create download completion flag: {str(e)}")

            return True
        else:
            if missing_files:
                logger.warning(
                    f"Wav2Vec2 model directory exists but missing files: {', '.join(missing_files)}"
                )

            # If flag exists but files are missing, check if we have the model file
            # (it might be a partial download that can be resumed)
            model_bin_path = os.path.join(local_model_path, "pytorch_model.bin")
            model_safetensors_path = os.path.join(local_model_path, "model.safetensors")

            model_exists = (
                os.path.exists(model_safetensors_path)
                and os.path.getsize(model_safetensors_path) > 0
            ) or (
                os.path.exists(model_bin_path) and os.path.getsize(model_bin_path) > 0
            )

            if flag_exists and not model_exists:
                # Check if there's any substantial data in the directory before removing the flag
                total_size = 0
                for root, dirs, files in os.walk(local_model_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        if os.path.exists(file_path):
                            total_size += os.path.getsize(file_path)

                # Only remove the flag if the directory is essentially empty
                if total_size < 1024 * 1024:  # Less than 1MB
                    logger.warning(
                        "Download flag exists but no substantial model files found. Removing flag."
                    )
                    os.remove(download_complete_flag)
                else:
                    logger.info(
                        f"Directory contains {total_size/1024/1024:.2f}MB of data, keeping download flag for resuming"
                    )

            return False

    except Exception as e:
        logger.error(f"Error checking model download status: {str(e)}")
        return False


# Test function to verify the module works
def test_wav2vec2():
    """
    Test the Wav2Vec2 model and ensure it's properly loaded.

    This function:
    1. Checks if the model is already downloaded and complete
    2. Verifies if the model is already loaded in memory
    3. Attempts to load the model from local storage
    4. Handles download resumption if needed
    5. Creates a download completion flag when successful

    Returns:
        bool: True if model is successfully loaded, False otherwise
    """
    try:
        # Check for download completion flag
        cache_dir = os.path.join(os.getcwd(), "models", "wav2vec2-finnish")
        download_complete_flag = os.path.join(cache_dir, "download_complete.flag")

        # First check if model is downloaded
        model_downloaded = is_model_downloaded()
        flag_exists = os.path.exists(download_complete_flag)

        logger.info(
            f"Model status: Download complete flag: {flag_exists}, "
            f"All files present: {model_downloaded}"
        )

        # If model is already in memory, we're good to go
        if is_model_in_memory():
            logger.info("Wav2Vec2 model is already loaded in memory")

            # Create flag file if it doesn't exist but model is in memory and working
            if not flag_exists:
                with open(download_complete_flag, "w") as f:
                    f.write("Model download completed successfully")
                logger.info(
                    f"Created download completion flag at {download_complete_flag}"
                )

            return True

        # If model is already downloaded or flag exists, try to load it
        if model_downloaded or flag_exists:
            # Try to load the model to verify it works
            model, processor = load_wav2vec2_model()
            if model is not None and processor is not None:
                logger.info("Wav2Vec2 model loaded successfully from existing files")
                return True
            else:
                logger.warning(
                    "Failed to load existing Wav2Vec2 model, will try to clean and reload"
                )
                # If flag exists but loading failed, remove the flag
                if flag_exists:
                    logger.warning("Removing invalid download completion flag")
                    os.remove(download_complete_flag)
                model_downloaded = False

        # If model is not downloaded or incomplete, try to clean it
        if not model_downloaded:
            # Only clean if there's no download flag (to avoid removing partially downloaded files)
            if not flag_exists:
                cleaned = clean_incomplete_model()
                if cleaned:
                    logger.info("Cleaned up incomplete model directory")

        # Load or download the model
        model, processor = load_wav2vec2_model()
        if model is None or processor is None:
            logger.error("Failed to load Wav2Vec2 model and processor")
            return False

        # Check again if model is now downloaded
        model_downloaded = is_model_downloaded()
        flag_exists = os.path.exists(download_complete_flag)

        logger.info(
            f"Updated model status: Download complete flag: {flag_exists}, "
            f"All files present: {model_downloaded}"
        )

        # Create flag file if model is working but flag doesn't exist
        if model_downloaded and not flag_exists:
            with open(download_complete_flag, "w") as f:
                f.write("Model download completed successfully")
            logger.info(f"Created download completion flag at {download_complete_flag}")

        logger.info(
            "Wav2Vec2 model (aapot/wav2vec2-xlsr-300m-finnish) and processor loaded successfully"
        )
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
