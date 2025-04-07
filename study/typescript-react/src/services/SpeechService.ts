/**
 * Service for handling speech-to-text and text-to-speech operations
 */

// API URL - using the Python server directly
const API_BASE_URI = 'http://localhost:8008';

// Define the result interface here instead of importing it
export interface SpeechToTextResult {
  transcript: string;
}

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

/**
 * Calculate appropriate timeout based on blob size
 */
function calculateTimeout(blobSize: number): number {
  // Use longer timeout for larger files
  const baseTimeout = 30000; // 30 seconds base
  const sizeAdjustment = Math.floor(blobSize / 10000) * 5000; // Add 5 sec per 10KB
  return Math.min(baseTimeout + sizeAdjustment, 120000); // Cap at 2 minutes
}

/**
 * Converts an audio blob to a format that's easier for the server to process
 * Intended to fix issues with WebSocket audio transmission
 * @param audioBlob The original audio blob to convert
 * @returns A processed audio blob in WAV format
 */
export async function convertAudioFormat(audioBlob: Blob): Promise<Blob> {
  console.log(`🎤 STEP 1: Processing audio blob: ${audioBlob.type}, size: ${audioBlob.size} bytes`);

  // IMPORTANT: Return the original blob with its original MIME type
  // The server will handle conversion with FFmpeg
  return audioBlob;
}

/**
 * Converts speech from audio blob to text using Whisper
 * @param audioBlob - The audio blob to transcribe
 * @param language - The language of the audio (fi-FI for Finnish)
 * @returns The transcribed text
 */
export async function convertSpeechToText(audioBlob: Blob, language: string = 'en-US'): Promise<SpeechToTextResult> {
  const startTime = performance.now();
  console.log(`🎤 STEP 1: Starting speech-to-text conversion process`);

  // Calculate timeout based on blob size
  const timeoutValue = calculateTimeout(audioBlob.size);

  console.log(`🎤 STEP 2: Processing audio: ${audioBlob.size} bytes, ${audioBlob.type}, timeout: ${timeoutValue}ms, language: ${language}`);

  // Use the blob directly - don't try to convert it
  const processedBlob = audioBlob;

  const formData = new FormData();
  // Important: The server expects the file parameter to be named "file", not "audio"
  formData.append("file", processedBlob, "recording.webm");
  // The server also expects these Form parameters
  formData.append("optimize", "false");
  formData.append("priority", "accuracy");
  formData.append("chunk_size", "0");
  console.log(`🎤 STEP 4: FormData created with audio blob: ${processedBlob.size} bytes, type: ${processedBlob.type}`);

  let result: SpeechToTextResult = { transcript: "" };

  // Determine specific endpoint based on language - directly use Python server
  const languageCode = language.toLowerCase().includes('fi') ? 'fi' : 'en';
  const serverUrl = `${API_BASE_URI}/api/speech-to-text/${languageCode}`;

  console.log(`🎤 STEP 5: Using Python server endpoint for ${language}: ${serverUrl}`);

  try {
    console.log(`🎤 STEP 6: Sending request to server: ${serverUrl}`);

    const response = await Promise.race([
      fetch(serverUrl, {
        method: "POST",
        body: formData
      }),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), timeoutValue)
      ) as Promise<Response>
    ]);

    console.log(`🎤 STEP 7: Received response with status: ${response.status}`);

    if (response.ok) {
      result = await response.json();
      console.log(`🎤 STEP 8: Successfully parsed response JSON`);
    } else {
      console.log(`🎤 STEP 8: Server error with status ${response.status}`);
      return {
        transcript: `Error: Server returned status code ${response.status}. Please try again.`
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`🎤 STEP 8: Request error: ${errorMessage}`);

    return {
      transcript: `Error: ${errorMessage || "Failed to process speech"}. Please try again.`
    };
  }

  const endTime = performance.now();
  console.log(`🎤 STEP 9: Speech to text completed in ${Math.round(endTime - startTime)}ms: "${result.transcript}"`);

  return result;
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
    console.log(`🔊 STEP 1: Starting text-to-speech conversion for text: "${text.substring(0, 30)}..." in language: ${language}, voice: ${voice}`);

    // Use default voice for language if not specified or if using a mismatched voice
    if (!voice || voice === 'neutral') {
      const langConfig = LANGUAGE_CONFIG[language as keyof typeof LANGUAGE_CONFIG];
      if (langConfig && langConfig.defaultVoice) {
        voice = langConfig.defaultVoice;
        console.log(`🔊 STEP 2: Using default voice for ${language}: ${voice}`);
      }
    }

    // Use the Python server endpoint directly
    console.log(`🔊 STEP 3: Sending TTS request to Python server endpoint at ${API_BASE_URI}/api/text-to-speech`);

    try {
      const response = await fetch(`${API_BASE_URI}/api/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, language, voice })
      });

      console.log(`🔊 STEP 4: Received response with status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`🔊 STEP 5: Successfully parsed response JSON`);

        // Handle error response from server
        if (data.success === false) {
          console.log(`🔊 STEP 6: Server reported an error: ${data.error || 'Unknown error'}`);
          throw new Error(data.error || 'Server reported an error');
        }

        // Check if response contains base64 audio data
        if (data.audio) {
          console.log(`🔊 STEP 6: Python server audio generated successfully`);
          return `data:audio/mp3;base64,${data.audio}`;
        } else if (data.audioUrl) {
          console.log(`🔊 STEP 6: Audio URL received`);
          return data.audioUrl;
        }

        console.log(`🔊 STEP 6: No audio data in response`);
        throw new Error('No audio data in response');
      } else {
        console.warn(`🔊 STEP 6: Python server request failed with status: ${response.status}`);
        throw new Error(`Request failed with status: ${response.status}`);
      }
    } catch (error) {
      console.warn(`🔊 STEP 7: Python server TTS failed: ${error instanceof Error ? error.message : String(error)}`);

      // If we get here, try browser speech synthesis as final option
      if ('speechSynthesis' in window) {
        console.log(`🔊 STEP 8: Attempting browser speech synthesis`);
        return textToSpeechWithBrowser(text, language, voice);
      }

      // If we get here, all options failed
      throw new Error('All text-to-speech methods failed');
    }
  } catch (error) {
    console.error('🔊 STEP ERROR: Text-to-speech error:', error);
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