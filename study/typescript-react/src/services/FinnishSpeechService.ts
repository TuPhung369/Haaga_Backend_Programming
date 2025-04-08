/**
 * Specialized service for handling Finnish speech-to-text operations
 * This is separated from the main SpeechService to handle the specific requirements
 * of Finnish speech recognition
 * 
 * Note: This service now uses a smaller 'tiny' Whisper model for faster processing
 * with reduced timeout (60 seconds instead of 180 seconds)
 */

// API URL - using the Python server directly
const API_BASE_URI = "http://localhost:8008";

// Define the result interface here instead of importing it
export interface SpeechToTextResult {
  transcript: string;
}

/**
 * Converts speech from audio blob to text using specialized Finnish processing
 * @param audioBlob - The audio blob to transcribe
 * @returns The transcribed text
 */
export async function convertFinnishSpeechToText(
  audioBlob: Blob
): Promise<SpeechToTextResult> {
  const startTime = performance.now();
  console.log(
    `ud83cudfa4 FINNISH: Starting specialized Finnish speech-to-text conversion`
  );

  // Calculate timeout - Using a smaller model now so we can reduce the timeout
  const timeoutValue = 60000; // 1 minute for Finnish (reduced from 3 minutes)
  console.log(
    `ud83cudfa4 FINNISH: Processing audio: ${audioBlob.size} bytes, ${audioBlob.type}, timeout: ${timeoutValue}ms`
  );

  // Create FormData for the request - SIMPLIFIED VERSION - SIMPLIFIED VERSION
  const formData = new FormData();
  const fileExtension = audioBlob.type.includes("wav") ? "wav" : "webm";
  const filename = `finnish_recording.${fileExtension}`;
  formData.append("file", audioBlob, filename);

  // Add Finnish-specific parameters
  formData.append("language", "fi-FI");
  formData.append("optimize", "true");
  // Use speed priority since we're now using a smaller model
  formData.append("priority", "speed"); // Changed from accuracy to speed
  formData.append("language_code", "fi"); // Explicitly set language code

  // Log all form data entries for debugging
  console.log(`ud83cudfa4 FINNISH: FormData entries:`);
  // Use type assertion to access entries() method which exists at runtime but TypeScript doesn't recognize
  const formDataAny = formData as any;
  if (typeof formDataAny.entries === "function") {
    for (const pair of formDataAny.entries()) {
      if (pair[0] === "file") {
        console.log(
          `ud83cudfa4 FINNISH: ${pair[0]}: ${pair[1].name}, size: ${pair[1].size} bytes, type: ${pair[1].type}`
        );
      } else {
        console.log(`ud83cudfa4 FINNISH: ${pair[0]}: ${pair[1]}`);
      }
    }
  } else {
    console.log(
      `ud83cudfa4 FINNISH: FormData logging not supported in this environment`
    );
  }

  // Verify the server is available with a quick health check
  try {
    console.log(
      `ud83cudfa4 FINNISH: Performing health check before Finnish processing`
    );
    const healthResponse = await fetch(`${API_BASE_URI}/health`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!healthResponse.ok) {
      console.warn(
        `ud83cudfa4 FINNISH: Server health check failed with status: ${healthResponse.status}`
      );
      return {
        transcript:
          "Error: Speech recognition server is not available. Please try again later.",
      };
    }
  } catch (healthError) {
    console.error(
      `ud83cudfa4 FINNISH: Server health check failed:`,
      healthError
    );
    return {
      transcript: "Error: Could not connect to speech recognition server.",
    };
  }

  // Use the same endpoint structure as the English endpoint
  const serverUrl = `${API_BASE_URI}/api/speech-to-text/fi`;
  console.log(`ud83cudfa4 FINNISH: Using endpoint: ${serverUrl}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.error(
      `ud83cudfa4 FINNISH: Request timed out after ${
        timeoutValue / 1000
      } seconds`
    );
  }, timeoutValue);

  try {
    console.log(`ud83cudfa4 FINNISH: Sending fetch request to server`);

    // Send the request with a timeout - SIMPLIFIED VERSION
    const response = await fetch(serverUrl, {
      method: "POST",
      body: formData,
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
      },
    });

    clearTimeout(timeoutId);
    console.log(
      `ud83cudfa4 FINNISH: Received response with status: ${response.status}`
    );

    if (response.ok) {
      try {
        const data = await response.json();
        const result = { transcript: data.transcript || "" };

        const endTime = performance.now();
        const processingTime = Math.round(endTime - startTime);
        console.log(
          `ud83cudfa4 FINNISH: Speech to text completed in ${processingTime}ms: "${result.transcript}"`
        );
        
        // Add a note about using the tiny model if processing was fast
        if (processingTime < 10000) { // Less than 10 seconds
          console.log(`ud83cudfa4 FINNISH: Fast processing achieved using tiny Whisper model`);
        }
        return result;
      } catch (parseError) {
        console.error(
          `ud83cudfa4 FINNISH: Error parsing response: ${parseError}`
        );
        return {
          transcript: `Error parsing server response: ${
            parseError instanceof Error
              ? parseError.message
              : String(parseError)
          }`,
        };
      }
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
      console.error(`ud83cudfa4 FINNISH: Server error: ${errorBody}`);
      return { transcript: `Error: ${errorBody}. Please try again.` };
    }
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DOMException && error.name === "AbortError") {
      console.error(
        `ud83cudfa4 FINNISH: Request timed out after ${
          timeoutValue / 1000
        } seconds`
      );
      return {
        transcript: `Error: Finnish speech recognition timed out after ${Math.round(
          timeoutValue / 1000
        )} seconds. The server may be busy or the audio file is too large.`,
      };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`ud83cudfa4 FINNISH: Fetch request error: ${errorMessage}`);
    return {
      transcript: `Error: ${
        errorMessage || "Failed to process Finnish speech"
      }. Please try again.`,
    };
  }
}

