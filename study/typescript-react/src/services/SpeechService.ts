/**
 * Service for handling speech-to-text and text-to-speech operations
 */

// API URL - using the Python server directly
const API_BASE_URI = "http://localhost:8008";

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
    defaultVoice: "neutral",
  },
  "fi-FI": {
    code: "fi",
    name: "Finnish",
    sttTechnologies: ["whisper"],
    ttsTechnologies: ["gtts"],
    defaultVoice: "finnish-neutral",
  },
};

// Create a variable to track if health check has been performed
let healthCheckPerformed = false;

/**
 * Calculate appropriate timeout based on blob size and language
 */
function calculateTimeout(
  blobSize: number,
  language: string = "en-US"
): number {
  // Use appropriate timeout for Finnish language (now using a smaller model)
  const isFinnish = language.toLowerCase().includes("fi");
  const baseTimeout = isFinnish ? 30000 : 30000; // 30 seconds base for all languages

  // Adjust based on audio size
  const sizeAdjustment = Math.floor(blobSize / 10000) * 5000; // Add 5 sec per 10KB for all languages

  // Cap timeout
  const maxTimeout = isFinnish ? 60000 : 120000; // 1 minute for Finnish, 2 for others

  return Math.min(baseTimeout + sizeAdjustment, maxTimeout);
}

/**
 * Converts an audio blob to a format that's easier for the server to process
 * Intended to fix issues with WebSocket audio transmission
 * @param audioBlob The original audio blob to convert
 * @returns A processed audio blob in WAV format
 */
export async function convertAudioFormat(audioBlob: Blob): Promise<Blob> {
  console.log(
    `🎤 STEP 1: Processing audio blob: ${audioBlob.type}, size: ${audioBlob.size} bytes`
  );

  // IMPORTANT: Return the original blob with its original MIME type
  // The server will handle conversion with FFmpeg
  return audioBlob;
}

/**
 * Converts speech from audio blob to text using Whisper
 * @param audioBlob - The audio blob to transcribe
 * @param language - The language of the audio (e.g., 'en-US' for English, 'fi-FI' for Finnish)
 * @returns The transcribed text
 */
// Cache for transcriptions to avoid redundant processing
// Commented out until caching is fully implemented
// const transcriptionCache = new Map<string, SpeechToTextResult>();

/**
 * Optimizes audio blob for speech recognition
 * @param audioBlob Original audio blob
 * @param language Language code
 * @returns Optimized audio blob
 */
async function optimizeAudioForSpeechRecognition(
  audioBlob: Blob
): Promise<Blob> {
  // For Finnish, we might want to apply special processing in the future
  // const isFinnish = language.toLowerCase().includes("fi");

  // If it's already a WAV file and not too large, return as is
  if (audioBlob.type.includes("wav") && audioBlob.size < 1024 * 1024) {
    return audioBlob;
  }

  // For now, we'll just return the original blob
  // In a production environment, you might want to:
  // 1. Convert to WAV format if it's not already
  // 2. Normalize audio levels
  // 3. Apply noise reduction
  // 4. Trim silence from beginning and end
  console.log(
    `🎤 Audio optimization skipped - would implement audio processing here`
  );

  return audioBlob;
}

/**
 * Splits large audio files into chunks for better processing
 * @param audioBlob The audio blob to split
 * @param language The language code
 * @returns Array of smaller audio blobs
 */
async function splitAudioIntoChunks(
  audioBlob: Blob,
  language: string
): Promise<Blob[]> {
  const MAX_CHUNK_SIZE = language.toLowerCase().includes("fi")
    ? 500 * 1024 // 500KB for Finnish
    : 1024 * 1024; // 1MB for other languages

  // If the blob is small enough, return it as a single chunk
  if (audioBlob.size <= MAX_CHUNK_SIZE) {
    return [audioBlob];
  }

  console.log(
    `🎤 Audio file is large (${Math.round(
      audioBlob.size / 1024
    )} KB), splitting into chunks`
  );

  // For now, we'll just return the original blob as a single chunk
  // In a production environment, you would implement actual chunking logic:
  // 1. Convert to ArrayBuffer
  // 2. Split into chunks at silence points if possible
  // 3. Create new Blobs from each chunk

  // This is a placeholder for actual chunking implementation
  return [audioBlob];
}

/**
 * Generates a cache key for a given audio blob and language
 * Currently unused but kept for future implementation of caching
 */
// function generateCacheKey(audioBlob: Blob, language: string): string {
//   // Simple cache key based on size, type and first few bytes
//   return `${language}_${audioBlob.size}_${audioBlob.type}_${Date.now()}`;
// }

export async function convertSpeechToText(
  audioBlob: Blob,
  language: string = "en-US"
): Promise<SpeechToTextResult> {
  const startTime = performance.now();
  console.log(
    `🎤 STEP 1: Starting speech-to-text conversion process for ${language}`
  );

  // Check cache first (disabled for now as key generation needs improvement)
  // const cacheKey = generateCacheKey(audioBlob, language);
  // if (transcriptionCache.has(cacheKey)) {
  //   console.log(`🎤 Using cached transcription result`);
  //   return transcriptionCache.get(cacheKey)!;
  // }

  // Calculate timeout based on blob size and language
  const timeoutValue = calculateTimeout(audioBlob.size, language);
  console.log(
    `🎤 STEP 2: Processing audio: ${audioBlob.size} bytes, ${audioBlob.type}, timeout: ${timeoutValue}ms, language: ${language}`
  );

  // Optimize audio for speech recognition
  const optimizedAudio = await optimizeAudioForSpeechRecognition(audioBlob);
  console.log(
    `🎤 STEP 3: Audio optimization complete: ${optimizedAudio.size} bytes`
  );

  // Split into chunks if needed
  const audioChunks = await splitAudioIntoChunks(optimizedAudio, language);
  console.log(`🎤 STEP 4: Audio split into ${audioChunks.length} chunks`);

  // Process each chunk and combine results
  let combinedTranscript = "";

  for (let i = 0; i < audioChunks.length; i++) {
    const chunk = audioChunks[i];
    console.log(
      `🎤 Processing chunk ${i + 1}/${audioChunks.length}: ${chunk.size} bytes`
    );

    // Create FormData for the request
    const formData = new FormData();
    const fileExtension = chunk.type.includes("wav") ? "wav" : "webm";
    const filename = `recording_chunk_${i + 1}.${fileExtension}`;
    formData.append("file", chunk, filename);

    // Add optimization flags - these will help the server process Finnish audio better
    const isFinnish = language.toLowerCase().includes("fi");
    formData.append("optimize", isFinnish ? "true" : "false");
    formData.append("priority", isFinnish ? "accuracy" : "speed");
    formData.append("chunk_size", "0");

    if (isFinnish) {
      // Add Finnish-specific parameters
      formData.append("beam_size", "5"); // Larger beam size for better accuracy
      formData.append("vad_filter", "true"); // Voice activity detection
      formData.append("language_code", "fi"); // Explicitly set language code
    }

    console.log(`🎤 STEP 5: FormData created for chunk ${i + 1}`);

    // Determine the correct endpoint based on language
    const languageCode = language.toLowerCase().includes("fi") ? "fi" : "en";
    const serverUrl = `${API_BASE_URI}/api/speech-to-text/${languageCode}`;
    console.log(
      `🎤 STEP 6: Using Python server endpoint for ${language}: ${serverUrl}`
    );

    // Verify the server is available with a quick health check
    try {
      const healthResponse = await fetch(`${API_BASE_URI}/health`, {
        method: "GET",
      });
      console.log(`🎤 Health check response: ${healthResponse.status}`);
      if (!healthResponse.ok) {
        console.warn(
          `🎤 Server health check failed with status: ${healthResponse.status}`
        );
      }
    } catch (healthError) {
      console.error(`🎤 Server health check failed:`, healthError);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error(`🎤 Request timed out after ${timeoutValue}ms`);
    }, timeoutValue);

    try {
      console.log(
        `🎤 STEP 7: Sending fetch request to server for chunk ${i + 1}`
      );
      const response = await fetch(serverUrl, {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: {
          // Add CORS headers
          "Accept": "application/json",
          // Don't set Content-Type with FormData as the browser will set it with the boundary
        },
        // Ensure credentials are included if needed
        credentials: "same-origin",
      });

      clearTimeout(timeoutId);
      console.log(
        `🎤 STEP 8: Received response with status: ${response.status}`
      );

      if (response.ok) {
        const data = await response.json();
        const chunkTranscript = data.transcript || "";
        combinedTranscript +=
          (combinedTranscript && chunkTranscript ? " " : "") + chunkTranscript;
        console.log(
          `🎤 STEP 9: Successfully parsed response JSON for chunk ${i + 1}`
        );
      } else {
        let errorBody = `Server returned status code ${response.status}`;
        try {
          const errorData = await response.json();
          errorBody += errorData.error
            ? `: ${errorData.error}`
            : await response.text();
        } catch {
          errorBody += await response.text();
        }
        console.error(
          `🎤 STEP 9: Server error for chunk ${i + 1}: ${errorBody}`
        );

        // If this is the only chunk, return error
        if (audioChunks.length === 1) {
          return { transcript: `Error: ${errorBody}. Please try again.` };
        }
        // Otherwise continue with other chunks
      }
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === "AbortError") {
        console.error(
          `🎤 STEP 9: Request timed out after ${timeoutValue}ms for chunk ${
            i + 1
          }`
        );

        // If this is the only chunk, return timeout error
        if (audioChunks.length === 1) {
          return {
            transcript: `Error: Request timed out after ${Math.round(
              timeoutValue / 1000
            )} seconds. The server may be busy or the audio file is too large.`,
          };
        }
        // Otherwise continue with other chunks
      } else {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `🎤 STEP 9: Fetch request error for chunk ${i + 1}: ${errorMessage}`
        );

        // If this is the only chunk, return error
        if (audioChunks.length === 1) {
          return {
            transcript: `Error: ${
              errorMessage || "Failed to process speech"
            }. Please try again.`,
          };
        }
        // Otherwise continue with other chunks
      }
    }
  }

  const result: SpeechToTextResult = { transcript: combinedTranscript.trim() };

  // Store in cache for future use
  // transcriptionCache.set(cacheKey, result);

  const endTime = performance.now();
  console.log(
    `🎤 STEP 10: Speech to text completed in ${Math.round(
      endTime - startTime
    )}ms: "${result.transcript}"`
  );
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
  language: string = "en-US",
  voice: string = "neutral"
): Promise<string> => {
  try {
    console.log(
      `🔊 STEP 1: Starting text-to-speech conversion for text: "${text.substring(
        0,
        30
      )}..." in language: ${language}, voice: ${voice}`
    );

    // Use default voice for language if not specified or if using a mismatched voice
    if (!voice || voice === "neutral") {
      const langConfig =
        LANGUAGE_CONFIG[language as keyof typeof LANGUAGE_CONFIG];
      if (langConfig && langConfig.defaultVoice) {
        voice = langConfig.defaultVoice;
        console.log(`🔊 STEP 2: Using default voice for ${language}: ${voice}`);
      }
    }

    // Use the Python server endpoint directly
    console.log(
      `🔊 STEP 3: Sending TTS request to Python server endpoint at ${API_BASE_URI}/api/text-to-speech`
    );

    try {
      const response = await fetch(`${API_BASE_URI}/api/text-to-speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, language, voice }),
      });

      console.log(
        `🔊 STEP 4: Received response with status: ${response.status}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`🔊 STEP 5: Successfully parsed response JSON`);

        // Handle error response from server
        if (data.success === false) {
          console.log(
            `🔊 STEP 6: Server reported an error: ${
              data.error || "Unknown error"
            }`
          );
          throw new Error(data.error || "Server reported an error");
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
        throw new Error("No audio data in response");
      } else {
        console.warn(
          `🔊 STEP 6: Python server request failed with status: ${response.status}`
        );
        throw new Error(`Request failed with status: ${response.status}`);
      }
    } catch (error) {
      console.warn(
        `🔊 STEP 7: Python server TTS failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );

      // If we get here, try browser speech synthesis as final option
      if ("speechSynthesis" in window) {
        console.log(`🔊 STEP 8: Attempting browser speech synthesis`);
        return textToSpeechWithBrowser(text, language, voice);
      }

      // If we get here, all options failed
      throw new Error("All text-to-speech methods failed");
    }
  } catch (error) {
    console.error("🔊 STEP ERROR: Text-to-speech error:", error);
    // We can't generate fallback audio, so return an empty string and let the caller handle it
    return "";
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
  language: string = "en-US",
  voiceType: string = "neutral"
): Promise<string> => {
  return new Promise((resolve) => {
    try {
      if (!("speechSynthesis" in window)) {
        console.warn("Browser speech synthesis not available");
        resolve(""); // Return empty to indicate failure
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
        const langVoices = voices.filter((v) =>
          v.lang.toLowerCase().includes(language.split("-")[0].toLowerCase())
        );

        if (langVoices.length > 0) {
          // Choose voice based on gender preference if specified in voiceType
          if (voiceType.includes("male") || voiceType.includes("david")) {
            const maleVoice = langVoices.find(
              (v) =>
                v.name.toLowerCase().includes("male") ||
                v.name.toLowerCase().includes("david")
            );
            if (maleVoice) utterance.voice = maleVoice;
          } else if (
            voiceType.includes("female") ||
            voiceType.includes("zira")
          ) {
            const femaleVoice = langVoices.find(
              (v) =>
                v.name.toLowerCase().includes("female") ||
                v.name.toLowerCase().includes("zira")
            );
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
        resolve("browser-tts"); // Return indicator that browser TTS is being used
      };

      // Handle errors
      utterance.onerror = (event) => {
        console.error(`🔊 [Browser TTS] Error: ${event.error}`);
        resolve(""); // Return empty on error
      };

      // Speak the text
      synthesis.speak(utterance);

      // Handle case where onstart might not fire
      setTimeout(() => {
        if (synthesis.speaking) {
          resolve("browser-tts-timeout");
        } else {
          resolve("");
        }
      }, 1000);
    } catch (error) {
      console.error(`🔊 [Browser TTS] Error: ${error}`);
      resolve("");
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
      if (
        !audioData ||
        audioData === "browser-tts" ||
        audioData === "browser-tts-timeout"
      ) {
        resolve();
        return;
      }

      const audio = new Audio(audioData);

      audio.onended = () => {
        resolve();
      };

      audio.onerror = (error) => {
        console.error("Error playing audio:", error);
        reject(error);
      };

      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
        reject(error);
      });
    } catch (error) {
      console.error("Error creating audio element:", error);
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

    mediaRecorder.addEventListener("dataavailable", (event) => {
      audioChunks.push(event.data);
    });

    mediaRecorder.start();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, timeLimit);

      mediaRecorder.addEventListener("stop", () => {
        clearTimeout(timeoutId);

        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        resolve(audioBlob);
      });

      mediaRecorder.addEventListener("error", (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error("Error recording audio:", error);
    throw error;
  }
};

/**
 * Fetch information about the speech services available for each language
 * @returns Promise with information about language support
 */
export const getSpeechServiceInfo = async (): Promise<
  Array<{
    code: string;
    name: string;
    stt_support: string[];
    tts_support: string[];
    whisper_available: boolean;
  }>
> => {
  try {
    const response = await fetch(
      "http://localhost:8008/api/supported-languages"
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn("Could not fetch speech service info:", error);
  }

  // Return default configuration if server is unavailable
  return Object.keys(LANGUAGE_CONFIG).map((langCode) => {
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
export const getSupportedLanguages = (): Array<{
  code: string;
  name: string;
}> => {
  // Return languages from our configuration
  return Object.keys(LANGUAGE_CONFIG).map((code) => {
    const config = LANGUAGE_CONFIG[code as keyof typeof LANGUAGE_CONFIG];
    return {
      code,
      name: config.name,
    };
  });
};

// Function to get supported voice types
export const getSupportedVoices = (): Array<{
  id: string;
  name: string;
  description?: string;
  hidden?: boolean;
}> => {
  // Return voices in the format expected by both frontend and backend
  return [
    { id: "neutral", name: "Neutral", description: "SpeechBrain Neural Voice" },
    { id: "david-en-us", name: "David", description: "Male English" },
    { id: "zira-en-us", name: "Zira", description: "Female English" },
    {
      id: "finnish-neutral",
      name: "Finnish",
      description: "Google TTS Finnish voice",
    },
    // Legacy IDs for backward compatibility
    {
      id: "male",
      name: "Male (David)",
      description: "Maps to David voice",
      hidden: true,
    },
    {
      id: "female",
      name: "Female (Zira)",
      description: "Maps to Zira voice",
      hidden: true,
    },
    {
      id: "neutral-en-us",
      name: "Neutral (English)",
      description: "SpeechBrain",
      hidden: true,
    },
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
    const response = await fetch("http://localhost:8008/health", {
      signal: AbortSignal.timeout(2000), // 2-second timeout
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Whisper server health check:", data);
      healthCheckPerformed = true;
      return data.status === "ok" && data.whisper_available;
    }
  } catch (error) {
    console.warn("Health check failed:", error);
  }

  healthCheckPerformed = true; // Mark as performed even on failure
  return true; // Return true anyway to avoid blocking the UI
};

