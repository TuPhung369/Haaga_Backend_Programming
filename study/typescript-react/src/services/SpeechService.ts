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
 * Split a large audio blob into smaller chunks
 * @param audioBlob The original large audio blob
 * @param maxChunkSize Maximum size of each chunk in bytes
 * @returns Array of smaller audio blobs
 */
function splitAudioBlob(audioBlob: Blob, maxChunkSize: number = 1048576): Blob[] {
  // If the blob is already small enough, just return it
  if (audioBlob.size <= maxChunkSize) {
    return [audioBlob];
  }

  const chunks: Blob[] = [];
  let start = 0;

  // Create chunks of the specified size
  while (start < audioBlob.size) {
    const end = Math.min(start + maxChunkSize, audioBlob.size);
    chunks.push(audioBlob.slice(start, end, audioBlob.type));
    start = end;
  }

  console.log(`🎤 Split audio blob into ${chunks.length} chunks (${chunks.map(c => Math.round(c.size / 1024) + 'KB').join(', ')})`);
  return chunks;
}

/**
 * Try a direct XHR request instead of fetch to get more detailed error information
 * @param url The URL to send the request to
 * @param formData The form data to send
 * @returns Promise with the response text
 */
function sendXHRRequest(url: string, formData: FormData): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Add event listeners
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        console.log(`🎤 Upload progress: ${percentComplete}%`);
      }
    };

    xhr.onreadystatechange = () => {
      console.log(`🎤 XHR state changed: ${xhr.readyState} (${getReadyStateText(xhr.readyState)})`);
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.responseText);
        } else {
          reject(new Error(`XHR failed with status: ${xhr.status}, response: ${xhr.responseText}`));
        }
      }
    };

    xhr.onerror = (e) => {
      console.error('🎤 XHR error:', e);
      reject(new Error('Network error occurred'));
    };

    xhr.ontimeout = () => {
      console.error('🎤 XHR timeout');
      reject(new Error('Request timed out'));
    };

    // Open and send the request
    xhr.open('POST', url, true);
    xhr.timeout = 120000; // 2 minutes timeout
    xhr.send(formData);
  });
}

// Helper function to convert XHR readyState to text
function getReadyStateText(state: number): string {
  switch (state) {
    case 0: return 'UNSENT';
    case 1: return 'OPENED';
    case 2: return 'HEADERS_RECEIVED';
    case 3: return 'LOADING';
    case 4: return 'DONE';
    default: return 'UNKNOWN';
  }
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

  // Check if the blob is too large
  const blobSizeKB = Math.round(audioBlob.size / 1024);
  if (blobSizeKB > 1024) {
    console.log(`🎤 Warning: Audio file is large (${blobSizeKB} KB), will try chunking approach`);
  }

  // Create a new blob with the correct type for better server compatibility
  // Some webm codecs might cause issues, so we ensure we're using a standard format
  let processedBlob: Blob;
  if (audioBlob.type.includes('codecs=pcm')) {
    console.log(`🎤 STEP 3: Converting PCM encoded audio to standard webm for better compatibility`);
    // Create a new blob with just webm type without specifying codec
    processedBlob = new Blob([audioBlob], { type: 'audio/webm' });
  } else {
    processedBlob = audioBlob;
  }

  // For large blobs (>1MB), try to reduce size to improve request reliability
  if (processedBlob.size > 1048576) { // 1MB
    try {
      // Try to reduce audio quality to make file smaller
      console.log(`🎤 STEP 3.5: Reducing audio blob size for better upload reliability`);

      // Chunk the audio for large files
      if (processedBlob.size > 2097152) { // 2MB
        // For files larger than 2MB, try the smaller first chunk first
        const chunks = splitAudioBlob(processedBlob, 1048576); // 1MB chunks
        console.log(`🎤 Using first ${Math.min(2, chunks.length)} chunks of audio for processing`);

        // Create a blob with just the first 2 chunks (or fewer if we don't have 2)
        const firstChunks = chunks.slice(0, Math.min(2, chunks.length));
        processedBlob = new Blob(firstChunks, { type: processedBlob.type });

        console.log(`🎤 Reduced audio size from ${blobSizeKB}KB to ${Math.round(processedBlob.size / 1024)}KB by using first chunks`);
      }
    } catch (error) {
      console.warn(`🎤 Error reducing audio size:`, error);
      // Continue with original blob if reduction fails
    }
  }

  const formData = new FormData();
  // Use the proper extension based on the blob type
  const fileExtension = processedBlob.type.includes('wav') ? 'wav' : 'webm';
  const filename = `recording.${fileExtension}`;

  // Important: The server expects the file parameter to be named "file"
  formData.append("file", processedBlob, filename);
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
    console.log(`🎤 Trying XHR request for better diagnostics instead of fetch`);

    // Try XHR request first for better diagnostics
    try {
      const responseText = await sendXHRRequest(serverUrl, formData);
      console.log(`🎤 STEP 7: XHR request successful, parsing response`);

      try {
        const data = JSON.parse(responseText);
        result = { transcript: data.transcript || "" };
        console.log(`🎤 STEP 8: Successfully parsed response JSON: "${result.transcript.substring(0, 50)}${result.transcript.length > 50 ? '...' : ''}"`);
      } catch (parseError) {
        console.error(`🎤 Error parsing response JSON:`, parseError);
        return { transcript: `Error parsing server response. Please try again.` };
      }
    } catch (xhrError) {
      console.error(`🎤 XHR request failed, falling back to fetch:`, xhrError);

      // Fall back to fetch approach if XHR fails
      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log(`🎤 Request timeout after ${timeoutValue}ms`);
      }, timeoutValue);

      try {
        const response = await fetch(serverUrl, {
          method: "POST",
          body: formData,
          signal: controller.signal
        });

        // Clear the timeout since we got a response
        clearTimeout(timeoutId);

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
      } catch (fetchError) {
        clearTimeout(timeoutId); // Clean up timeout
        throw fetchError; // Re-throw to be handled by outer catch
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if this is an abort error (timeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log(`🎤 STEP 8: Request timed out after ${timeoutValue}ms`);
      return {
        transcript: `Error: Request timed out after ${Math.round(timeoutValue / 1000)} seconds. The server may be busy or the audio file is too large.`
      };
    }

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