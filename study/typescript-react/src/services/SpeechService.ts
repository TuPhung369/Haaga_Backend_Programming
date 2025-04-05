/**
 * Service for handling speech-to-text and text-to-speech operations
 */

// API URL - using the absolute URL of the Spring Boot server as a proxy
const API_BASE_URI = import.meta.env.VITE_API_BASE_URI;
import { findAuthToken } from './LanguageService';

/**
 * Convert speech to text
 * @param audioBlob Audio blob to convert
 * @param language Language code (e.g., "fi-FI")
 * @returns Promise with the transcribed text
 */
export const convertSpeechToText = async (
  audioBlob: Blob,
  language: string = 'en-US'
): Promise<string> => {
  try {
    console.log(`🎤 [Speech-to-Text] Starting conversion for language: ${language}`);
    console.log(`🎤 [Speech-to-Text] Audio blob size: ${Math.round(audioBlob.size / 1024)} KB, type: ${audioBlob.type}`);

    // Ensure we have valid audio data
    if (audioBlob.size === 0) {
      console.error("🎤 [Speech-to-Text] Audio blob is empty!");
      return "No audio data detected. Please try again.";
    }

    // Create a form data object
    const formData = new FormData();

    // Generate a unique filename with timestamp
    const timestamp = new Date().getTime();
    const filename = `recording_${timestamp}.wav`;

    formData.append('file', audioBlob, filename);
    formData.append('language', language);

    console.log(`🎤 [Speech-to-Text] Sending request to server with filename ${filename}`);

    // Try the local Python server first
    try {
      const pythonResponse = await fetch(`http://localhost:8008/api/speech-to-text`, {
        method: 'POST',
        body: formData,
      });

      if (pythonResponse.ok) {
        const pythonData = await pythonResponse.json();
        if (pythonData.transcript && pythonData.transcript.trim() !== "") {
          console.log(`🎤 [Speech-to-Text] Python server transcript: "${pythonData.transcript}"`);
          return pythonData.transcript;
        }
      }
    } catch (pythonError) {
      console.warn("🎤 [Speech-to-Text] Python server not available:", pythonError);
    }

    // Fall back to the Spring Boot server
    const response = await fetch(`${API_BASE_URI}/api/speech/speech-to-text`, {
      method: 'POST',
      body: formData,
    });

    console.log(`🎤 [Speech-to-Text] Response status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log(`🎤 [Speech-to-Text] Server response:`, data);

    if (data.transcript) {
      console.log(`🎤 [Speech-to-Text] Transcript: "${data.transcript}"`);
      return data.transcript;
    } else if (data.error) {
      throw new Error(`Server error: ${data.error}`);
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error(`❌ [Speech-to-Text] Error:`, error);
    return "Error transcribing audio. Please try again.";
  }
};

/**
 * Convert text to speech
 * @param text Text to convert to speech
 * @param language Language code (e.g., "fi-FI")
 * @param voice Voice to use (e.g., "male", "female")
 * @returns Promise with the audio URL or base64 string
 */
export const convertTextToSpeech = async (
  text: string,
  language: string = 'en-US',
  voice: string = 'neutral'
): Promise<string> => {
  try {
    console.log(`🔊 [Text-to-Speech] Starting conversion for text: "${text.substring(0, 30)}..." in language: ${language}, voice: ${voice}`);

    // Try the local Python server first
    try {
      console.log(`🔊 [Text-to-Speech] Trying local Python server first for faster response`);
      const fallbackResponse = await fetch(`http://localhost:8008/api/text-to-speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, voice }),
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();

        if (fallbackData.success === false) {
          throw new Error(fallbackData.error || 'Fallback server reported an error');
        }

        if (fallbackData.audio) {
          console.log(`🔊 [Text-to-Speech] Python server audio generated successfully using ${fallbackData.source || 'unknown'} source`);
          return `data:audio/mp3;base64,${fallbackData.audio}`;
        }

        throw new Error('No audio data in Python server response');
      }
    } catch (pythonError) {
      console.warn(`🔊 [Text-to-Speech] Python server unavailable: ${pythonError instanceof Error ? pythonError.message : String(pythonError)}`);
      // Continue to Spring Boot API attempt
    }

    // Get any available auth token from the app
    const authInfo = findAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if a token is available
    if (authInfo && authInfo.token) {
      headers['Authorization'] = `Bearer ${authInfo.token}`;
      console.log(`🔊 [Text-to-Speech] Using authentication token from ${authInfo.source}`);
    }

    // Try the Spring Boot API endpoint
    try {
      const response = await fetch(`${API_BASE_URI}/api/text-to-speech`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, language, voice }),
        credentials: 'include', // Include cookies for session-based auth
        redirect: 'manual' // Don't follow redirects automatically
      });

      // Consider both redirects (302) and unauthorized (401) as failures
      if (response.ok && !response.redirected && response.status !== 302) {
        const data = await response.json();

        // Handle error response from server
        if (data.success === false) {
          throw new Error(data.error || 'Server reported an error');
        }

        // Check if response contains base64 audio data
        if (data.audio) {
          console.log(`🔊 [Text-to-Speech] Spring Boot audio generated successfully using ${data.source || 'unknown'} source`);
          return `data:audio/mp3;base64,${data.audio}`;
        } else if (data.audioUrl) {
          console.log(`🔊 [Text-to-Speech] Audio URL received`);
          return data.audioUrl;
        }

        throw new Error('No audio data in response');
      }

      // If we get here, the Spring Boot endpoint failed or redirected
      if (response.redirected || response.status === 302) {
        console.warn(`🔊 [Text-to-Speech] Spring Boot server requires authentication, trying browser TTS`);
        throw new Error('Authentication required');
      } else {
        console.warn(`🔊 [Text-to-Speech] Spring Boot server request failed with status: ${response.status}`);
        throw new Error(`Request failed with status: ${response.status}`);
      }
    } catch (mainApiError) {
      console.warn(`🔊 [Text-to-Speech] Spring Boot TTS failed: ${mainApiError instanceof Error ? mainApiError.message : String(mainApiError)}`);

      // If we get here, all API options failed, try browser speech synthesis as final option
      if ('speechSynthesis' in window) {
        console.log(`🔊 [Text-to-Speech] Attempting browser speech synthesis`);
        return textToSpeechWithBrowser(text, language, voice);
      }

      // If we get here, all options failed
      throw new Error('All text-to-speech methods failed');
    }
  } catch (error) {
    console.error('🔊 [Text-to-Speech] Error:', error);
    // We can't generate fallback audio, so return an empty string and let the caller handle it
    return '';
  }
};

/**
 * Fallback function to use browser's built-in speech synthesis
 * @param text Text to speak
 * @param language Language code
 * @param voiceType Voice type preference
 * @returns Promise that resolves to a dummy string when speech starts
 */
const textToSpeechWithBrowser = (
  text: string,
  language: string = 'en-US',
  voiceType: string = 'neutral'
): Promise<string> => {
  return new Promise((resolve) => {
    try {
      if (!('speechSynthesis' in window)) {
        console.warn('Browser speech synthesis not available');
        resolve(''); // Return empty to indicate failure
        return;
      }

      const synthesis = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);

      // Set language
      utterance.lang = language;

      // Try to find an appropriate voice
      const voices = synthesis.getVoices();
      console.log(`🔊 [Browser TTS] Found ${voices.length} voices`);

      if (voices.length > 0) {
        // Filter voices by language
        const langVoices = voices.filter(v =>
          v.lang.toLowerCase().includes(language.split('-')[0].toLowerCase())
        );

        if (langVoices.length > 0) {
          // Choose voice based on gender preference if specified in voiceType
          if (voiceType.includes('male') || voiceType.includes('david')) {
            const maleVoice = langVoices.find(v => v.name.toLowerCase().includes('male') ||
              v.name.toLowerCase().includes('david'));
            if (maleVoice) utterance.voice = maleVoice;
          } else if (voiceType.includes('female') || voiceType.includes('zira')) {
            const femaleVoice = langVoices.find(v => v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('zira'));
            if (femaleVoice) utterance.voice = femaleVoice;
          } else {
            // Default to first matching language voice
            utterance.voice = langVoices[0];
          }
        }
      }

      // Handle speech start
      utterance.onstart = () => {
        console.log(`🔊 [Browser TTS] Speech started`);
        resolve('browser-tts'); // Return indicator that browser TTS is being used
      };

      // Handle errors
      utterance.onerror = (event) => {
        console.error(`🔊 [Browser TTS] Error: ${event.error}`);
        resolve(''); // Return empty on error
      };

      // Speak the text
      synthesis.speak(utterance);

      // Handle case where onstart might not fire
      setTimeout(() => {
        if (synthesis.speaking) {
          resolve('browser-tts-timeout');
        } else {
          resolve('');
        }
      }, 1000);
    } catch (error) {
      console.error(`🔊 [Browser TTS] Error: ${error}`);
      resolve('');
    }
  });
};

/**
 * Play the audio from a base64 string or URL
 * @param audioData Base64 encoded audio or URL
 */
export const playAudio = (audioData: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Skip if audioData is empty or the browser TTS marker
      if (!audioData || audioData === 'browser-tts' || audioData === 'browser-tts-timeout') {
        resolve();
        return;
      }

      const audio = new Audio(audioData);

      audio.onended = () => {
        resolve();
      };

      audio.onerror = (error) => {
        console.error('Error playing audio:', error);
        reject(error);
      };

      audio.play().catch((error) => {
        console.error('Error playing audio:', error);
        reject(error);
      });
    } catch (error) {
      console.error('Error creating audio element:', error);
      reject(error);
    }
  });
};

/**
 * Record audio from microphone
 * @param timeLimit Maximum recording time in milliseconds (default: 10 seconds)
 * @returns Promise with the recorded audio blob
 */
export const recordAudio = async (timeLimit: number = 10000): Promise<Blob> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: BlobPart[] = [];

    mediaRecorder.addEventListener('dataavailable', (event) => {
      audioChunks.push(event.data);
    });

    mediaRecorder.start();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, timeLimit);

      mediaRecorder.addEventListener('stop', () => {
        clearTimeout(timeoutId);

        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        resolve(audioBlob);
      });

      mediaRecorder.addEventListener('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error recording audio:', error);
    throw error;
  }
};

// Function to get supported languages
export const getSupportedLanguages = (): Array<{ code: string, name: string }> => {
  // This would typically come from your backend which would query Google's API
  // For now, we'll hardcode some common languages
  return [
    { code: 'en-US', name: 'English (US)' },
    { code: 'vi-VN', name: 'Vietnamese' },
    { code: 'fi-FI', name: 'Finnish' },
  ];
};

// Function to get supported voice types
export const getSupportedVoices = (): Array<{ id: string, name: string, description?: string, hidden?: boolean }> => {
  // Return voices in the format expected by both frontend and backend
  return [
    { id: "neutral", name: "Neutral", description: "SpeechBrain Neural Voice" },
    { id: "david-en-us", name: "David", description: "Male English" },
    { id: "zira-en-us", name: "Zira", description: "Female English" },
    // Legacy IDs for backward compatibility
    { id: "male", name: "Male (David)", description: "Maps to David voice", hidden: true },
    { id: "female", name: "Female (Zira)", description: "Maps to Zira voice", hidden: true },
    { id: "neutral-en-us", name: "Neutral (English)", description: "SpeechBrain", hidden: true },
  ];
};