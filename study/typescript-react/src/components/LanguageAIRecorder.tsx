import React, { useState, useRef, useEffect } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { MicNone, Stop } from "@mui/icons-material";

// Import API_SPEECHBRAIN_URI from SpeechService
const API_SPEECHBRAIN_URI = "http://localhost:8008";

// Interface definitions (unchanged)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: Record<string, unknown>;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionError) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
    voiceRecorderServerChecked?: boolean;
    webkitAudioContext: typeof AudioContext;
  }
}

interface LanguageAIRecorderProps {
  onAudioRecorded: (audioBlob: Blob, transcript: string) => void;
  onSpeechRecognized?: (transcript: string) => void;
  language: string;
  disabled?: boolean;
}

const LanguageAIRecorder: React.FC<LanguageAIRecorderProps> = ({
  onAudioRecorded,
  onSpeechRecognized,
  language,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [displayTime, setDisplayTime] = useState("00:00");
  const [transcript, setTranscript] = useState(""); // Browser transcript
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentTranscriptRef = useRef<string>("");
  const isRecordingRef = useRef<boolean>(false);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  // Add a ref for the timer display element
  const timerDisplayRef = useRef<HTMLSpanElement>(null);

  // Check if the server is available
  const checkServerAvailability = async (): Promise<boolean> => {
    try {
      // Determine the correct health check endpoint based on language
      let healthEndpoint = `${API_SPEECHBRAIN_URI}/api/health`;

      // For language not English
      if (!language.toLowerCase().includes("en")) {
        healthEndpoint = `${API_SPEECHBRAIN_URI}/api/speech/health`;
      }

      console.log(
        `🎤 LanguageAIRecorder: Checking server availability at ${healthEndpoint}`
      );

      const response = await fetch(healthEndpoint, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        // Short timeout for health check
        signal: AbortSignal.timeout(5000),
      });

      const isAvailable = response.ok;
      console.log(
        `🎤 LanguageAIRecorder: Server health check result for ${language}: ${
          isAvailable ? "Available" : "Unavailable"
        }`
      );
      return isAvailable;
    } catch (error) {
      console.error(
        `🎤 LanguageAIRecorder: Server health check failed for ${language}:`,
        error
      );
      return false;
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      setIsLoading(true);
      setTranscript(""); // Clear browser transcript
      currentTranscriptRef.current = ""; // Clear transcript ref
      console.log("Transcript reset at start of recording");
      audioChunksRef.current = [];

      // For English, we can skip server check since we'll use browser recognition
      const isEnglish = language.toLowerCase().includes("en");

      // Only check server availability for non-English languages
      if (!isEnglish) {
        const serverAvailable = await checkServerAvailability();
        if (!serverAvailable) {
          setError(
            "Speech recognition server is not available. Please try again later."
          );
          setIsLoading(false);
          return;
        }
      }

      console.log(`Starting recording for language: ${language}`);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let options = {};
      if (MediaRecorder.isTypeSupported("audio/wav")) {
        options = { mimeType: "audio/wav" };
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/webm" };
      }

      console.log(`Using MediaRecorder with options:`, options);
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Use the transcript from the ref that was set in stopRecording
        const currentTranscriptValue = currentTranscriptRef.current;
        console.log("MediaRecorder stopped");
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        // For English, use browser transcript if available to improve performance
        const isEnglish = language.toLowerCase().includes("en");
        console.log(
          "DEBUG: Transcript value in onstop:",
          currentTranscriptValue,
          "Length:",
          currentTranscriptValue ? currentTranscriptValue.length : 0
        );
        if (
          isEnglish &&
          currentTranscriptValue &&
          currentTranscriptValue.trim() !== ""
        ) {
          console.log(
            "🎤 LanguageAIRecorder: Using browser transcript for English"
          );
          // Pass audio and browser transcript to parent - don't call server API for English
          onAudioRecorded(audioBlob, currentTranscriptValue);

          stream.getTracks().forEach((track) => track.stop());
          setIsLoading(false);
          setIsRecording(false);
          // Timer should already be cleared in stopRecording, but clear it again just to be safe
          if (timerRef.current) {
            console.log(
              "Clearing animation frame in onstop handler:",
              timerRef.current
            );
            cancelAnimationFrame(timerRef.current);
            timerRef.current = null;
          }
          return;
        }

        // For non-English (like Finnish) or if browser transcript is empty, use server
        // Skip server call for English with transcript - we already handled it above
        if (!isEnglish || !transcript) {
          // Check server availability before transcribing
          const serverStillAvailable = await checkServerAvailability();
          if (!serverStillAvailable) {
            setIsLoading(false);
            setIsRecording(false);
            stream.getTracks().forEach((track) => track.stop());
            // Timer should already be cleared in stopRecording, but clear it again just to be safe
            if (timerRef.current) {
              console.log(
                "Clearing animation frame in server unavailable case:",
                timerRef.current
              );
              cancelAnimationFrame(timerRef.current);
              timerRef.current = null;
            }
            return;
          }

          // Special handling for English with no transcript
          if (
            isEnglish &&
            (!currentTranscriptValue || currentTranscriptValue.trim() === "")
          ) {
            console.log(
              "WARNING: LanguageAIRecorder: English detected but no transcript available"
            );

            // Update the transcript container immediately
            const container = document.getElementById("transcript-container");
            if (container) {
              const processingBox = document.createElement("div");
              processingBox.style.padding = "16px";
              processingBox.style.margin = "8px";
              processingBox.style.backgroundColor = "rgba(25, 118, 210, 0.08)";
              processingBox.style.borderRadius = "4px";
              processingBox.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
              processingBox.style.border = "1px solid #90caf9";

              const titleEl = document.createElement("div");
              titleEl.style.fontWeight = "600";
              titleEl.style.marginBottom = "10px";
              titleEl.style.fontSize = "1rem";
              titleEl.style.color = "#1976d2";
              titleEl.textContent = "Processing...";

              const loadingIndicator = document.createElement("div");
              loadingIndicator.style.display = "inline-block";
              loadingIndicator.style.width = "16px";
              loadingIndicator.style.height = "16px";
              loadingIndicator.style.border =
                "3px solid rgba(25, 118, 210, 0.3)";
              loadingIndicator.style.borderRadius = "50%";
              loadingIndicator.style.borderTop = "3px solid #1976d2";
              loadingIndicator.style.animation = "spin 1s linear infinite";
              loadingIndicator.style.marginRight = "10px";
              loadingIndicator.style.verticalAlign = "middle";

              titleEl.insertBefore(loadingIndicator, titleEl.firstChild);

              const contentEl = document.createElement("div");
              contentEl.style.fontSize = "1.1rem";
              contentEl.style.lineHeight = "1.5";
              contentEl.style.color = "#1976d2";
              contentEl.textContent =
                "Converting speech to text using server...";

              processingBox.appendChild(titleEl);
              processingBox.appendChild(contentEl);

              // Clear container first
              while (container.firstChild) {
                container.removeChild(container.firstChild);
              }

              container.appendChild(processingBox);
            }

            // Return empty string to trigger server fallback in parent component
            onAudioRecorded(audioBlob, "");
          } else {
            // Use the captured transcript value for English fallback
            // Transcribe using server
            // Show processing message in transcript container
            const container = document.getElementById("transcript-container");
            if (container) {
              const processingBox = document.createElement("div");
              processingBox.style.padding = "16px";
              processingBox.style.margin = "8px";
              processingBox.style.backgroundColor = "rgba(25, 118, 210, 0.08)";
              processingBox.style.borderRadius = "4px";
              processingBox.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
              processingBox.style.border = "1px solid #90caf9";

              const titleEl = document.createElement("div");
              titleEl.style.fontWeight = "600";
              titleEl.style.marginBottom = "10px";
              titleEl.style.fontSize = "1rem";
              titleEl.style.color = "#1976d2";
              titleEl.textContent = "Processing...";

              const loadingIndicator = document.createElement("div");
              loadingIndicator.style.display = "inline-block";
              loadingIndicator.style.width = "16px";
              loadingIndicator.style.height = "16px";
              loadingIndicator.style.border =
                "3px solid rgba(25, 118, 210, 0.3)";
              loadingIndicator.style.borderRadius = "50%";
              loadingIndicator.style.borderTop = "3px solid #1976d2";
              loadingIndicator.style.animation = "spin 1s linear infinite";
              loadingIndicator.style.marginRight = "10px";
              loadingIndicator.style.verticalAlign = "middle";

              titleEl.insertBefore(loadingIndicator, titleEl.firstChild);

              const contentEl = document.createElement("div");
              contentEl.style.fontSize = "1.1rem";
              contentEl.style.lineHeight = "1.5";
              contentEl.style.color = "#1976d2";
              contentEl.textContent = "Transcribing audio...";

              processingBox.appendChild(titleEl);
              processingBox.appendChild(contentEl);

              // Clear container first
              while (container.firstChild) {
                container.removeChild(container.firstChild);
              }

              container.appendChild(processingBox);
            }

            try {
              // Transcribe using server
              const serverResult = await transcribeAudio(
                audioBlob,
                currentTranscriptValue
              );

              // Update transcript container with result
              if (container) {
                // Clear container
                while (container.firstChild) {
                  container.removeChild(container.firstChild);
                }

                const resultBox = document.createElement("div");
                resultBox.style.padding = "16px";
                resultBox.style.margin = "8px";
                resultBox.style.backgroundColor = "white";
                resultBox.style.borderRadius = "4px";
                resultBox.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
                resultBox.style.border = "1px solid #e0e0e0";

                const titleEl = document.createElement("div");
                titleEl.style.fontWeight = "600";
                titleEl.style.marginBottom = "10px";
                titleEl.style.fontSize = "1rem";
                titleEl.style.color = "#333";
                titleEl.textContent = "Server Transcript:";

                const contentEl = document.createElement("div");
                contentEl.style.fontSize = "1.1rem";
                contentEl.style.lineHeight = "1.5";
                contentEl.style.color = "#000";
                contentEl.style.fontWeight = "500";

                if (serverResult && serverResult.trim() !== "") {
                  contentEl.textContent = serverResult;
                } else {
                  contentEl.textContent = "No transcription available.";
                  contentEl.style.color = "#888";
                  contentEl.style.fontStyle = "italic";
                }

                resultBox.appendChild(titleEl);
                resultBox.appendChild(contentEl);
                container.appendChild(resultBox);
              }

              // Pass both audio and transcript to parent
              onAudioRecorded(audioBlob, serverResult || "");
            } catch (error) {
              console.error("Error during transcription:", error);

              // Update transcript container with error message
              if (container) {
                // Clear container
                while (container.firstChild) {
                  container.removeChild(container.firstChild);
                }

                const errorBox = document.createElement("div");
                errorBox.style.padding = "16px";
                errorBox.style.margin = "8px";
                errorBox.style.backgroundColor = "#fff8f8";
                errorBox.style.borderRadius = "4px";
                errorBox.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
                errorBox.style.border = "1px solid #ffcccc";

                const titleEl = document.createElement("div");
                titleEl.style.fontWeight = "600";
                titleEl.style.marginBottom = "10px";
                titleEl.style.fontSize = "1rem";
                titleEl.style.color = "#d32f2f";
                titleEl.textContent = "Transcription Error:";

                const contentEl = document.createElement("div");
                contentEl.style.fontSize = "1.1rem";
                contentEl.style.lineHeight = "1.5";
                contentEl.style.color = "#d32f2f";
                contentEl.style.fontWeight = "500";
                contentEl.textContent =
                  "Transcription failed. Please try again.";

                errorBox.appendChild(titleEl);
                errorBox.appendChild(contentEl);
                container.appendChild(errorBox);
              }

              // Still pass the audio to the parent, but with empty transcript
              onAudioRecorded(audioBlob, "");
            }
          }
        }

        stream.getTracks().forEach((track) => track.stop());
        setIsLoading(false);
        setIsRecording(false);
        isRecordingRef.current = false;
        // Timer should already be cleared in stopRecording, but clear it again just to be safe
        if (timerRef.current) {
          console.log(
            "Final clearing of animation frame in onstop handler:",
            timerRef.current
          );
          cancelAnimationFrame(timerRef.current);
          timerRef.current = null;
        }
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      };

      recorder.start(1000);

      // Reset recording time
      setRecordingTime(0);
      setDisplayTime("00:00");

      // Directly update the DOM for immediate feedback
      if (timerDisplayRef.current) {
        timerDisplayRef.current.textContent = "00:00";
        console.log("Directly updated timer display at start of recording");
      } else {
        // Fallback to getElementById
        const timeDisplay = document.getElementById("recording-time-display");
        if (timeDisplay) {
          timeDisplay.textContent = "00:00";
          console.log(
            "Directly updated timer display via getElementById at start of recording"
          );
        }
      }

      // Cancel any existing animation frame
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }

      // Store the start time - ensure it's the current time
      startTimeRef.current = Date.now();
      console.log("Set start time to:", startTimeRef.current);

      // Create a function to update the timer
      const updateTimer = () => {
        // Check if we should continue updating
        if (!isRecordingRef.current) {
          console.log("Not updating timer because isRecordingRef is false");
          return;
        }

        try {
          const now = Date.now();

          // Ensure startTimeRef has a valid value
          if (!startTimeRef.current || startTimeRef.current <= 0) {
            console.log("Start time was invalid, resetting to now:", now);
            startTimeRef.current = now;
          }

          const elapsedSeconds = Math.floor(
            (now - startTimeRef.current) / 1000
          );
          const formattedTime = formatTime(elapsedSeconds);

          console.log(
            `Timer update: elapsed=${elapsedSeconds}s, formatted=${formattedTime}`
          );

          // Update both states
          setDisplayTime(formattedTime);
          setRecordingTime(elapsedSeconds);

          // Update DOM directly for more reliable display
          if (timerDisplayRef.current) {
            timerDisplayRef.current.textContent = formattedTime;
            console.log("Updated timer display via ref:", formattedTime);
          } else {
            const timeDisplay = document.getElementById(
              "recording-time-display"
            );
            if (timeDisplay) {
              timeDisplay.textContent = formattedTime;
              console.log(
                "Updated timer display via getElementById:",
                formattedTime
              );
            } else {
              console.warn("Could not find timer display element to update");
            }
          }

          // Request next frame only if still recording
          if (isRecordingRef.current) {
            timerRef.current = requestAnimationFrame(updateTimer);
          } else {
            console.log(
              "Not requesting next animation frame because isRecordingRef is false"
            );
          }
        } catch (error) {
          console.error("Error in timer update function:", error);
          // Still try to continue the timer if we're recording
          if (isRecordingRef.current) {
            timerRef.current = requestAnimationFrame(updateTimer);
          }
        }
      };

      // Start the animation frame loop
      timerRef.current = requestAnimationFrame(updateTimer);

      // Set up a more aggressive fallback timer that updates every 500ms
      // This ensures we have a backup if requestAnimationFrame isn't working
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      // Use a standalone timer implementation that doesn't rely on React state
      // Use the same start time as the main timer for consistency
      const timerStartTime = startTimeRef.current;
      console.log("Fallback timer using start time:", timerStartTime);

      heartbeatIntervalRef.current = setInterval(() => {
        if (!isRecordingRef.current) {
          if (heartbeatIntervalRef.current) {
            console.log(
              "Clearing fallback interval timer because not recording"
            );
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
          }
          return;
        }

        try {
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - timerStartTime) / 1000);
          const formattedTime = formatTime(elapsedSeconds);

          console.log(
            `Fallback timer update: elapsed=${elapsedSeconds}s, formatted=${formattedTime}`
          );

          // Update React state
          setRecordingTime(elapsedSeconds);
          setDisplayTime(formattedTime);

          // Update DOM directly using the ref
          if (timerDisplayRef.current) {
            timerDisplayRef.current.textContent = formattedTime;
            console.log(
              "Fallback timer updated display via ref:",
              formattedTime
            );
          } else {
            // Fallback to getElementById
            const timeDisplay = document.getElementById(
              "recording-time-display"
            );
            if (timeDisplay) {
              timeDisplay.textContent = formattedTime;
              console.log(
                "Fallback timer updated display via getElementById:",
                formattedTime
              );
            } else {
              console.log(
                "Fallback timer trying to find display element in DOM"
              );
              // Try to find the element by traversing the DOM
              const buttons = document.querySelectorAll("button");
              for (let i = 0; i < buttons.length; i++) {
                const button = buttons[i];
                if (button.textContent?.includes("Recording...")) {
                  // Found the recording button, now find the time display
                  const spans = button.querySelectorAll("span");
                  for (let j = 0; j < spans.length; j++) {
                    const span = spans[j];
                    if (span.textContent?.match(/\d\d:\d\d/)) {
                      // This is likely our time display
                      span.textContent = formattedTime;
                      console.log(
                        "Fallback timer updated display via DOM traversal:",
                        formattedTime
                      );
                      break;
                    }
                  }
                  break;
                }
              }
            }
          }
        } catch (error) {
          console.error("Error in fallback timer:", error);
        }
      }, 500);

      // Timer initialization complete

      setIsRecording(true);
      isRecordingRef.current = true;
      setIsLoading(false);

      // Always try to use browser speech recognition for English
      if (language.toLowerCase().includes("en")) {
        try {
          console.log(
            "🎤 LanguageAIRecorder: Starting browser speech recognition for English"
          );
          startBrowserSpeechRecognition();
        } catch (err) {
          console.warn("Browser speech recognition failed:", err);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Error starting recording:", errorMessage);
      setError(`Could not access microphone: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;

    console.log("Stop recording called, current time:", recordingTime);

    // Check if we're recording Finnish and enforce minimum recording time
    const isFinnish = language.toLowerCase().includes("fi");
    const minRecordingTimeForFinnish = 1; // 1 second minimum for Finnish

    // Calculate the current elapsed time directly to ensure accuracy
    const currentElapsedSeconds = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : recordingTime;

    console.log(`Calculated current elapsed time: ${currentElapsedSeconds}s`);

    // Use the greater of the calculated time or the state time
    const effectiveRecordingTime = Math.max(
      currentElapsedSeconds,
      recordingTime
    );
    console.log(`Effective recording time: ${effectiveRecordingTime}s`);

    if (isFinnish && effectiveRecordingTime < minRecordingTimeForFinnish) {
      console.log(
        `Recording time (${effectiveRecordingTime}s) is less than minimum required for Finnish (${minRecordingTimeForFinnish}s). Please record longer.`
      );
      setError(
        `Please record for at least ${minRecordingTimeForFinnish} second for Finnish.`
      );
      return;
    }

    // Stop the timer immediately to prevent further updates
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    } else {
      console.warn(
        "No animation frame to cancel - timer may not have been running"
      );
    }

    // Also clear the fallback interval timer
    if (heartbeatIntervalRef.current) {
      console.log("Clearing fallback interval timer");
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Force isRecordingRef to false to ensure timer stops
    isRecordingRef.current = false;

    // Save the current transcript before stopping
    if (recognitionRef.current) {
      console.log(
        "Stopping browser speech recognition, current transcript:",
        transcript
      );
      // Store the current transcript in the ref so it's available in the onstop handler
      currentTranscriptRef.current = transcript;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    console.log("Stopping MediaRecorder");
    setIsLoading(true);
    mediaRecorderRef.current.stop();
  };

  // Function to transcribe audio using the server
  const transcribeAudio = async (
    audioBlob: Blob,
    fallbackTranscript: string = ""
  ): Promise<string> => {
    try {
      console.log(
        `🎤 LanguageAIRecorder: Transcribing audio for language: ${language}`
      );

      // Verify server is available before attempting transcription
      const serverAvailable = await checkServerAvailability();
      if (!serverAvailable) {
        throw new Error("Speech recognition server is not available");
      }

      // Create form data with the audio blob
      const formData = new FormData();

      // Different endpoints might expect different parameter names
      if (language.toLowerCase().includes("fi")) {
        // Finnish endpoint might expect different parameters
        formData.append("file", audioBlob, "recording.webm");
        // Some endpoints might need language code in a specific format
        formData.append("language", "fi-FI");
      } else if (language.toLowerCase().includes("vi")) {
        // Vietnamese endpoint parameters
        formData.append("file", audioBlob, "recording.webm");
        formData.append("language", "vi-VN");
      } else {
        // Standard parameters for other languages
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("language", language);

        // Add fallback transcript if available
        if (fallbackTranscript) {
          formData.append("fallbackTranscript", fallbackTranscript);
        }
      }

      // Determine the correct endpoint based on language
      let endpoint = `${API_SPEECHBRAIN_URI}/api/speech-to-text`;

      // Special handling for Finnish
      if (language.toLowerCase().includes("fi")) {
        endpoint = `${API_SPEECHBRAIN_URI}/api/speech-to-text/fi`;
        console.log("Using unified endpoint for Finnish:", endpoint);
      }
      // Special handling for Vietnamese
      else if (language.toLowerCase().includes("vi")) {
        endpoint = `${API_SPEECHBRAIN_URI}/api/speech-to-text/vi`;
        console.log("Using dedicated endpoint for Vietnamese:", endpoint);
      }
      // For other non-English languages
      else if (!language.toLowerCase().includes("en")) {
        console.log(
          "Using general speech-to-text endpoint for non-English:",
          endpoint
        );
      }
      // For English, we should have already used browser recognition, but just in case
      else {
        console.log(
          "Using general speech-to-text endpoint for English fallback"
        );
      }

      // Send to server for transcription
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        // Longer timeout for transcription
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("🎤 LanguageAIRecorder: Transcription result:", data);

      // Different endpoints might have different response formats
      // Check for various possible response formats
      if (data.transcript) {
        // Standard format
        if (data.transcript.trim() === "") {
          console.warn("Server returned empty transcript");
          return fallbackTranscript || "";
        }
        return data.transcript;
      } else if (data.text) {
        // Alternative format used by some endpoints
        if (data.text.trim() === "") {
          console.warn("Server returned empty text");
          return fallbackTranscript || "";
        }
        return data.text;
      } else if (data.result) {
        // Another possible format
        if (typeof data.result === "string") {
          if (data.result.trim() === "") {
            console.warn("Server returned empty result");
            return fallbackTranscript || "";
          }
          return data.result;
        } else if (data.result.text) {
          if (data.result.text.trim() === "") {
            console.warn("Server returned empty result.text");
            return fallbackTranscript || "";
          }
          return data.result.text;
        }
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        console.warn("Unexpected response format:", data);
        throw new Error("No transcript returned from server");
      }

      // Add a default return to ensure all code paths return a value
      return fallbackTranscript || "";
    } catch (error) {
      console.error("🎤 LanguageAIRecorder: Transcription error:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setError(`Transcription failed: ${errorMessage}`);

      // For non-English languages, we should return an empty string instead of "Transcription failed"
      // so the parent component can handle it appropriately
      const isEnglish = language.toLowerCase().includes("en");
      if (isEnglish && fallbackTranscript) {
        return fallbackTranscript;
      } else {
        return ""; // Return empty string to indicate failure
      }
    }
  };

  // Start browser speech recognition (for English)
  const startBrowserSpeechRecognition = () => {
    // Check if browser supports speech recognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Browser speech recognition not supported");
      return;
    }

    // Create a new recognition instance
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    // Handle results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      // Get the current transcript as a base
      const currentText = currentTranscriptRef.current || "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // For final results, accumulate them
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // If we have a final transcript, add it to our accumulated transcript
      if (finalTranscript) {
        // Only add a space if we already have some text
        const separator = currentText ? " " : "";
        currentTranscriptRef.current =
          currentText + separator + finalTranscript;
      }

      // For display, show both accumulated transcript and current interim results
      const displayTranscript = interimTranscript
        ? currentTranscriptRef.current + " " + interimTranscript
        : currentTranscriptRef.current;

      console.log("Accumulated transcript:", currentTranscriptRef.current);
      console.log("Current display transcript:", displayTranscript);

      // Update the state with the combined transcript
      setTranscript(displayTranscript);

      // Update the transcript container
      const container = document.getElementById("transcript-container");
      if (container) {
        // Clear container
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }

        const transcriptBox = document.createElement("div");
        transcriptBox.style.padding = "16px";
        transcriptBox.style.margin = "8px";
        transcriptBox.style.backgroundColor = "white";
        transcriptBox.style.borderRadius = "4px";
        transcriptBox.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
        transcriptBox.style.border = "1px solid #e0e0e0";

        const titleEl = document.createElement("div");
        titleEl.style.fontWeight = "600";
        titleEl.style.marginBottom = "10px";
        titleEl.style.fontSize = "1rem";
        titleEl.style.color = "#333";
        titleEl.textContent = "Transcript:";

        const contentEl = document.createElement("div");
        contentEl.style.fontSize = "1.1rem";
        contentEl.style.lineHeight = "1.5";
        contentEl.style.color = "#000";
        contentEl.style.fontWeight = "500";
        contentEl.textContent = displayTranscript;

        transcriptBox.appendChild(titleEl);
        transcriptBox.appendChild(contentEl);
        container.appendChild(transcriptBox);
      }

      // Call the onSpeechRecognized callback if provided
      if (onSpeechRecognized && finalTranscript) {
        onSpeechRecognized(currentTranscriptRef.current);
      }
    };

    // Handle errors
    recognition.onerror = (event: SpeechRecognitionError) => {
      console.error("Speech recognition error:", event.error, event.message);
      if (event.error === "no-speech") {
        // This is a common error, don't show it to the user
        console.log("No speech detected");
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    // Handle end of recognition
    recognition.onend = () => {
      console.log("Speech recognition ended");
      // Don't restart if we're not recording anymore
      if (isRecordingRef.current && recognitionRef.current) {
        console.log("Restarting speech recognition");
        try {
          recognition.start();
        } catch (err) {
          console.warn("Failed to restart speech recognition:", err);
        }
      }
    };

    // Start recognition
    try {
      recognition.start();
      console.log("Speech recognition started");
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
    }
  };

  // Component lifecycle and initialization
  useEffect(() => {
    // Initialize component

    // Create a standalone timer that updates every 100ms to ensure the display is always updated
    const standaloneTimer = setInterval(() => {
      // Only update if we're recording
      if (isRecordingRef.current && startTimeRef.current > 0) {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
        const formattedTime = formatTime(elapsedSeconds);

        // Try to update the display using the ref first
        if (timerDisplayRef.current) {
          timerDisplayRef.current.textContent = formattedTime;
        } else {
          // Fall back to getElementById
          const timeDisplay = document.getElementById("recording-time-display");
          if (timeDisplay) {
            timeDisplay.textContent = formattedTime;
          }
        }
      }
    }, 100);

    return () => {
      // Clean up all timers
      clearInterval(standaloneTimer);

      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  // Keep isRecordingRef in sync with isRecording state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        console.log("Cleanup: Canceling animation frame:", timerRef.current);
        cancelAnimationFrame(timerRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [isRecording, audioURL]);

  // Format recording time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Add a useEffect to update the DOM directly when displayTime changes
  useEffect(() => {
    if (timerDisplayRef.current && isRecording) {
      timerDisplayRef.current.textContent = displayTime;
      console.log("Updated time display from useEffect via ref:", displayTime);
    } else if (isRecording) {
      console.log(
        "Timer display ref is null in useEffect, falling back to getElementById"
      );
      const timeDisplay = document.getElementById("recording-time-display");
      if (timeDisplay) {
        timeDisplay.textContent = displayTime;
        console.log(
          "Updated time display from useEffect via getElementById:",
          displayTime
        );
      }
    }
  }, [displayTime, isRecording]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      {error && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 1,
            bgcolor: "rgba(211, 47, 47, 0.08)",
            border: "1px solid rgba(211, 47, 47, 0.2)",
          }}
        >
          <Typography
            variant="body2"
            color="error"
            sx={{ textAlign: "center", fontWeight: 500 }}
          >
            {error}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        {isRecording ? (
          // Recording in progress UI
          <Button
            variant="contained"
            color="error"
            onClick={stopRecording}
            disabled={isLoading || disabled}
            startIcon={<Stop />}
            sx={{
              borderRadius: "24px",
              py: 0.5,
              px: 2,
              textTransform: "none",
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                animation: "pulse 1.5s infinite",
                "@keyframes pulse": {
                  "0%": { opacity: 1 },
                  "50%": { opacity: 0.6 },
                  "100%": { opacity: 1 },
                },
              }}
            >
              Recording...
            </Typography>
            <Typography
              variant="caption"
              sx={{ ml: 1 }}
              id="recording-time-display"
              ref={timerDisplayRef}
            >
              {displayTime}
            </Typography>
          </Button>
        ) : (
          // Start recording button
          <Button
            variant="contained"
            color="primary"
            onClick={startRecording}
            disabled={isLoading || disabled}
            startIcon={
              isLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <MicNone />
              )
            }
            sx={{
              borderRadius: "24px",
              py: 0.5,
              px: 2,
              textTransform: "none",
              width: "100%",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              "&:hover": {
                boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
              },
            }}
          >
            {isLoading ? "Initializing..." : "Start Speaking"}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default LanguageAIRecorder;

