/**
 * Specialized service for handling Finnish speech-to-text operations
 * This is separated from the main SpeechService to handle the specific requirements
 * of Finnish speech recognition
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

  // Calculate timeout - Finnish needs more time
  const timeoutValue = 180000; // 3 minutes for Finnish
  console.log(
    `ud83cudfa4 FINNISH: Processing audio: ${audioBlob.size} bytes, ${audioBlob.type}, timeout: ${timeoutValue}ms`
  );

  // Create FormData for the request
  const formData = new FormData();
  const fileExtension = audioBlob.type.includes("wav") ? "wav" : "webm";
  const filename = `finnish_recording.${fileExtension}`;
  formData.append("file", audioBlob, filename);

  // Add Finnish-specific parameters
  formData.append("language", "fi-FI");
  formData.append("optimize", "true");
  formData.append("priority", "accuracy");
  formData.append("beam_size", "5"); // Larger beam size for better accuracy
  formData.append("vad_filter", "true"); // Voice activity detection
  formData.append("language_code", "fi"); // Explicitly set language code

  // Verify the server is available with a quick health check
  try {
    console.log(
      `ud83cudfa4 FINNISH: Performing health check before Finnish processing`
    );
    const healthResponse = await fetch(`${API_BASE_URI}/health`, {
      method: "GET",
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

    // Add a small delay to ensure server is ready
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (healthError) {
    console.error(
      `ud83cudfa4 FINNISH: Server health check failed:`,
      healthError
    );
    return {
      transcript: "Error: Could not connect to speech recognition server.",
    };
  }

  // Determine the correct endpoint
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
      `ud83cudfa4 FINNISH: Received response with status: ${response.status}`
    );

    if (response.ok) {
      const data = await response.json();
      const result = { transcript: data.transcript || "" };

      const endTime = performance.now();
      console.log(
        `ud83cudfa4 FINNISH: Speech to text completed in ${Math.round(
          endTime - startTime
        )}ms: "${result.transcript}"`
      );
      return result;
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
