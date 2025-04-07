/**
 * Service for handling speech-to-text and text-to-speech operations
 */

// API URL - using the absolute URL of the Spring Boot server as a proxy
const API_BASE_URI = import.meta.env.VITE_API_BASE_URI;
import { findAuthToken } from './LanguageService';

/**
 * Language configuration for different speech technologies
 */
export const LANGUAGE_CONFIG = {
  "en-US": {
    code: "en",
    name: "English",
    sttTechnologies: ["whisper", "browser", "server"],
    ttsTechnologies: ["speechbrain", "browser", "gtts"],
    defaultVoice: "neutral"
  },
  "fi-FI": {
    code: "fi",
    name: "Finnish",
    sttTechnologies: ["whisper"],
    ttsTechnologies: ["gtts"],
    defaultVoice: "finnish-neutral"
  }
};

// Create a variable to track if health check has been performed
let healthCheckPerformed = false;

export interface SpeechToTextResult {
  transcript: string;
}

/**
 * Converts speech from audio blob to text using Whisper
 * @param audioBlob - The audio blob to transcribe
 * @param language - The language of the audio (fi-FI for Finnish)
 * @returns The transcribed text
 */
export async function convertSpeechToText(audioBlob: Blob, language: string = 'en-US'): Promise<SpeechToTextResult> {
  const startTime = performance.now();

  // Calculate timeout based on blob size
  const timeoutValue = calculateTimeout(audioBlob.size);

  console.log(`🎤 Processing audio: ${audioBlob.size} bytes, ${audioBlob.type}, timeout: ${timeoutValue}ms, language: ${language}`);

  // Check audio format and optimize if needed
  let processedBlob = audioBlob;
  if (!audioBlob.type || !audioBlob.type.includes("audio/")) {
    console.log(`🎤 Setting MIME type for blob to audio/webm`);
    processedBlob = new Blob([audioBlob], { type: "audio/webm" });
  }

  // Optimize blob if it's too large (more than 50KB)
  if (processedBlob.size > 50000) {
    console.log(`🎤 Audio blob is large (${processedBlob.size} bytes), truncating to optimize`);
    processedBlob = new Blob([await processedBlob.slice(0, 50000).arrayBuffer()], { type: processedBlob.type });
  }

  // Get auth token from localStorage or cookies if available
  const authToken = localStorage.getItem('auth_token') || getCookie('auth_token') || '';

  const formData = new FormData();
  formData.append("audio", processedBlob);

  let response: Response;
  let result: SpeechToTextResult = { transcript: "" };
  let serverUrl = "";

  // Determine language-specific endpoint
  const languageCode = language.toLowerCase().includes('fi') ? 'fi' : 'en';

  console.log(`🎤 Language detected: ${language}, using endpoint for: ${languageCode}`);

  try {
    // Try direct server first with language-specific endpoint
    serverUrl = `http://localhost:9095/identify_service/speech-to-text/${languageCode}`;
    console.log(`🎤 Sending request to direct server: ${serverUrl}`);

    response = await Promise.race([
      fetch(serverUrl, {
        method: "POST",
        body: formData,
        headers: {
          // Add authentication header if token exists
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        }
      }),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), timeoutValue)
      ) as Promise<Response>
    ]);

    // If direct server succeeds, process response
    if (response.ok) {
      result = await response.json();
    } else {
      // If direct server gives auth error, throw specific error
      if (response.status === 401) {
        throw new Error("Authentication required. Please log in to use speech-to-text service.");
      }
      // For other errors, try fallback
      throw new Error(`Server error: ${response.status}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`🎤 Error with direct server (${errorMessage}), trying fallback`);

    // Fallback to proxy server with language-specific endpoint
    try {
      serverUrl = `http://localhost:8008/api/speech-to-text/${languageCode}`;
      console.log(`🎤 Sending request to fallback server: ${serverUrl}`);

      response = await Promise.race([
        fetch(serverUrl, {
          method: "POST",
          body: formData,
          headers: {
            // Add authentication header if token exists
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
          }
        }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), timeoutValue)
        ) as Promise<Response>
      ]);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in to use speech-to-text service.");
        }
        throw new Error(`Server error: ${response.status}`);
      }

      result = await response.json();
    } catch (fallbackError: unknown) {
      const fallbackErrorMessage = fallbackError instanceof Error ?
        fallbackError.message : String(fallbackError);
      console.error(`🎤 Speech to text error (${serverUrl}):`, fallbackErrorMessage);

      // If language-specific endpoint fails, try general endpoint as final fallback
      try {
        serverUrl = `http://localhost:8008/api/speech-to-text`;
        console.log(`🎤 Trying general endpoint as final fallback: ${serverUrl}`);

        const generalFallbackResponse = await fetch(serverUrl, {
          method: "POST",
          body: formData,
          headers: {
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
          }
        });

        if (generalFallbackResponse.ok) {
          result = await generalFallbackResponse.json();
        } else {
          throw new Error(`General fallback failed with status: ${generalFallbackResponse.status}`);
        }
      } catch {
        // If all attempts fail, return error message in transcript
        return {
          transcript: `Error: ${fallbackErrorMessage || "Failed to process speech"}. Please try again.`
        };
      }
    }
  }

  const endTime = performance.now();
  console.log(`🎤 Speech to text completed in ${Math.round(endTime - startTime)}ms: "${result.transcript}"`);

  return result;
}

// Helper function to get a cookie value by name
function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

/**
 * Calculate optimal timeout value based on the audio blob size
 */
function calculateTimeout(blobSize: number): number {
  // Scale the timeout based on blob size
  if (blobSize < 5000) {
    return 5000; // 5s for very small blobs
  } else if (blobSize < 20000) {
    return 8000; // 8s for small blobs
  } else if (blobSize < 50000) {
    return 12000; // 12s for medium blobs
  } else {
    return 20000; // 20s for large blobs
  }
}

/**
 * Convert text to speech
 * @param text Text to convert to speech
 * @param language Language code (e.g., "fi-FI")
 * @param voice Voice to use (e.g., "male", "female", "finnish-neutral")
 * @returns Promise with the audio URL or base64 string
 */
export const convertTextToSpeech = async (
  text: string,
  language: string = 'en-US',
  voice: string = 'neutral'
): Promise<string> => {
  try {
    console.log(`🔊 [Text-to-Speech] Starting conversion for text: "${text.substring(0, 30)}..." in language: ${language}, voice: ${voice}`);

    // Use default voice for language if not specified or if using a mismatched voice
    if (!voice || voice === 'neutral') {
      const langConfig = LANGUAGE_CONFIG[language as keyof typeof LANGUAGE_CONFIG];
      if (langConfig && langConfig.defaultVoice) {
        voice = langConfig.defaultVoice;
        console.log(`🔊 [Text-to-Speech] Using default voice for ${language}: ${voice}`);
      }
    }

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

/**
 * Fetch information about the speech services available for each language
 * @returns Promise with information about language support
 */
export const getSpeechServiceInfo = async (): Promise<Array<{
  code: string;
  name: string;
  stt_support: string[];
  tts_support: string[];
  whisper_available: boolean;
}>> => {
  try {
    const response = await fetch('http://localhost:8008/api/supported-languages');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Could not fetch speech service info:', error);
  }

  // Return default configuration if server is unavailable
  return Object.keys(LANGUAGE_CONFIG).map(langCode => {
    const config = LANGUAGE_CONFIG[langCode as keyof typeof LANGUAGE_CONFIG];
    return {
      code: langCode,
      name: config.name,
      stt_support: config.sttTechnologies,
      tts_support: config.ttsTechnologies,
      whisper_available: false,
    };
  });
};

// Function to get supported languages
export const getSupportedLanguages = (): Array<{ code: string, name: string }> => {
  // Return languages from our configuration
  return Object.keys(LANGUAGE_CONFIG).map(code => {
    const config = LANGUAGE_CONFIG[code as keyof typeof LANGUAGE_CONFIG];
    return {
      code,
      name: config.name
    };
  });
};

// Function to get supported voice types
export const getSupportedVoices = (): Array<{ id: string, name: string, description?: string, hidden?: boolean }> => {
  // Return voices in the format expected by both frontend and backend
  return [
    { id: "neutral", name: "Neutral", description: "SpeechBrain Neural Voice" },
    { id: "david-en-us", name: "David", description: "Male English" },
    { id: "zira-en-us", name: "Zira", description: "Female English" },
    { id: "finnish-neutral", name: "Finnish", description: "Google TTS Finnish voice" },
    // Legacy IDs for backward compatibility
    { id: "male", name: "Male (David)", description: "Maps to David voice", hidden: true },
    { id: "female", name: "Female (Zira)", description: "Maps to Zira voice", hidden: true },
    { id: "neutral-en-us", name: "Neutral (English)", description: "SpeechBrain", hidden: true },
  ];
};

/**
 * Checks if the Python Whisper server is running
 * @returns Always returns true to avoid constant connection errors
 */
export const isPythonServerRunning = async (): Promise<boolean> => {
  // Only check health once per page load
  if (healthCheckPerformed) {
    return true;
  }

  try {
    const response = await fetch('http://localhost:8008/health', {
      signal: AbortSignal.timeout(2000) // 2-second timeout
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Whisper server health check:', data);
      healthCheckPerformed = true;
      return data.status === 'ok' && data.whisper_available;
    }
  } catch (error) {
    console.warn('Health check failed:', error);
  }

  healthCheckPerformed = true; // Mark as performed even on failure
  return true; // Return true anyway to avoid blocking the UI
};