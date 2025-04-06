"""
Dependency installer for the Speech Service.
This script checks for and installs required dependencies for Finnish language support.
"""

import subprocess
import sys
import os
import platform


def check_package_installed(package_name):
    """Check if a package is installed"""
    try:
        __import__(package_name)
        return True
    except ImportError:
        return False


def install_package(package_name, extras=None):
    """Install a package using pip"""
    try:
        if extras:
            package_spec = f"{package_name}[{extras}]"
        else:
            package_spec = package_name

        print(f"Installing {package_spec}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package_spec])
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error installing {package_name}: {e}")
        return False


def main():
    print("Checking and installing dependencies for Finnish language support...")

    # Required packages
    packages = {
        "whisper": "openai-whisper",  # For Finnish STT
        "pydub": "pydub",  # For audio processing
        "torch": "torch torchaudio",  # Base requirement for models
        "fastapi": "fastapi uvicorn",  # For the API server
        "soundfile": "soundfile",  # For audio file handling
        "gtts": "gTTS",  # Google TTS for Finnish
    }

    # Platform-specific packages
    if platform.system() == "Windows":
        packages["pyttsx3"] = "pyttsx3"  # Windows TTS voices

    # Additional installs that might be needed
    additional_packages = {
        "speechbrain": "speechbrain",  # For neutral voice TTS (English)
        "speech_recognition": "SpeechRecognition",  # For fallback recognition
    }

    # Check and install required packages
    for module_name, package_name in packages.items():
        if not check_package_installed(module_name):
            print(f"{module_name} is not installed. Installing {package_name}...")
            install_package(package_name)
        else:
            print(f"{module_name} is already installed.")

    # Check and install additional packages
    for module_name, package_name in additional_packages.items():
        if not check_package_installed(module_name):
            print(f"{module_name} is not installed. Installing {package_name}...")
            install_package(package_name)
        else:
            print(f"{module_name} is already installed.")

    print("\nAll dependencies installed. You can now run the speech service.")
    print("Start the server with: python speechbrain_service.py")


if __name__ == "__main__":
    main()
