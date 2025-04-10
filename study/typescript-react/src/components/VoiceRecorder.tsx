import React, { useState, useRef, useEffect } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { MicNone, Stop } from "@mui/icons-material";

// Import API_BASE_URI from SpeechService
const API_BASE_URI = "http://localhost:8008";

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

interface VoiceRecorderProps {
  onAudioRecorded: (audioBlob: Blob, transcript: string) => void;
  onSpeechRecognized?: (transcript: string) => void;
  language: string;
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onAudioRecorded,
  onSpeechRecognized,
  language,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState(""); // Browser transcript
  const [serverTranscript, setServerTranscript] = useState(""); // Server transcript
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentTranscriptRef = useRef<string>("");
  const isRecordingRef = useRef<boolean>(false);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Check if the server is available
  const checkServerAvailability = async (): Promise<boolean> => {
    try {
      console.log(
        `🎤 VoiceRecorder: Checking server availability at ${API_BASE_URI}/health`
      );
      const response = await fetch(`${API_BASE_URI}/health`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        // Short timeout for health check
        signal: AbortSignal.timeout(5000),
      });

      const isAvailable = response.ok;
      console.log(
        `🎤 VoiceRecorder: Server health check result: ${
          isAvailable ? "Available" : "Unavailable"
        }`
      );
      return isAvailable;
    } catch (error) {
      console.error("🎤 VoiceRecorder: Server health check failed:", error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      setIsLoading(true);
      setTranscript(""); // Clear browser transcript
      setServerTranscript(""); // Clear server transcript
      currentTranscriptRef.current = ""; // Clear transcript ref
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
          console.log(`Audio chunk received: ${event.data.size} bytes`);
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
          console.log("🎤 VoiceRecorder: Using browser transcript for English");
          setServerTranscript(
            "Using browser recognition: " + currentTranscriptValue
          );
          // Pass audio and browser transcript to parent - don't call server API for English
          onAudioRecorded(audioBlob, currentTranscriptValue);

          stream.getTracks().forEach((track) => track.stop());
          setIsLoading(false);
          setIsRecording(false);
          if (timerRef.current) {
            clearInterval(timerRef.current);
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
            setServerTranscript(
              "Error: Speech recognition server is not available."
            );
            setIsLoading(false);
            setIsRecording(false);
            stream.getTracks().forEach((track) => track.stop());
            if (timerRef.current) {
              clearInterval(timerRef.current);
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
              "WARNING: VoiceRecorder: English detected but no transcript available"
            );
            setServerTranscript("English detected but no transcript available");

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

            // Transcribe using server
            const serverResult = await transcribeAudio(
              audioBlob,
              currentTranscriptValue
            );
            setServerTranscript(serverResult);

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
              contentEl.textContent = serverResult;

              resultBox.appendChild(titleEl);
              resultBox.appendChild(contentEl);
              container.appendChild(resultBox);
            }

            // Pass both audio and transcript to parent
            onAudioRecorded(audioBlob, serverResult);
          }
        }

        stream.getTracks().forEach((track) => track.stop());
        setIsLoading(false);
        setIsRecording(false);
        isRecordingRef.current = false;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      };

      recorder.start(1000);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      setIsRecording(true);
      isRecordingRef.current = true;
      setIsLoading(false);

      // Always try to use browser speech recognition for English
      if (language.toLowerCase().includes("en")) {
        try {
          console.log(
            "🎤 VoiceRecorder: Starting browser speech recognition for English"
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

    // Check if we're recording Finnish and enforce minimum recording time
    const isFinnish = language.toLowerCase().includes("fi");
    const minRecordingTimeForFinnish = 1; // 1 second minimum for Finnish

    if (isFinnish && recordingTime < minRecordingTimeForFinnish) {
      console.log(
        `Recording time (${recordingTime}s) is less than minimum required for Finnish (${minRecordingTimeForFinnish}s). Please record longer.`
      );
      // Show a message to the user
      const container = document.getElementById("transcript-container");
      if (container) {
        // Clear container first
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }

        const messageBox = document.createElement("div");
        messageBox.style.padding = "16px";
        messageBox.style.margin = "8px";
        messageBox.style.backgroundColor = "rgba(255, 152, 0, 0.08)";
        messageBox.style.borderRadius = "4px";
        messageBox.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
        messageBox.style.border = "1px solid #ffb74d";

        const messageText = document.createElement("div");
        messageText.style.fontSize = "1.1rem";
        messageText.style.lineHeight = "1.5";
        messageText.style.color = "#e65100";
        messageText.textContent = isFinnish
          ? "Äänitys on liian lyhyt. Ole hyvä ja puhu pidempään."
          : "Recording is too short. Please speak longer.";

        messageBox.appendChild(messageText);
        container.appendChild(messageBox);
      }

      return; // Don't stop recording yet
    }

    // Set recording flag to false to prevent auto-restart
    isRecordingRef.current = false;

    // Clear any heartbeat interval
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Store the current transcript before stopping recognition
    const currentTranscript = transcript;
    // Store in ref so it can be accessed in the onstop handler
    currentTranscriptRef.current = currentTranscript;
    console.log(
      "DEBUG: Transcript value in stopRecording:",
      currentTranscript,
      "Length:",
      currentTranscript ? currentTranscript.length : 0
    );
    const isEnglish = language.toLowerCase().includes("en");

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Error stopping speech recognition:", err);
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    setIsLoading(true);

    // For English, we'll use the browser transcript directly in the onstop handler
    if (isEnglish) {
      if (currentTranscript) {
        console.log(
          "🎤 VoiceRecorder: Using browser transcript for English:",
          currentTranscript
        );
        setServerTranscript("Using browser recognition: " + currentTranscript);
      } else {
        console.log(
          "WARNING: VoiceRecorder: No browser transcript available for English"
        );
        setServerTranscript("No browser transcript available for English");
      }
    }

    // Provide immediate feedback for Finnish language processing
    if (isFinnish) {
      setServerTranscript("Preparing to process Finnish audio...");
      // Log the start of Finnish processing for debugging
      console.log(
        `Starting Finnish speech-to-text processing at ${new Date().toISOString()}`
      );
    }
  };

  const startBrowserSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0].transcript;
          if (result.isFinal) {
            finalTranscript += transcriptText;
          }
        }
        if (finalTranscript) {
          console.log("DEBUG: Setting transcript to:", finalTranscript);
          setTranscript((prev) => {
            const newTranscript = prev
              ? `${prev} ${finalTranscript}`
              : finalTranscript;
            console.log("DEBUG: New transcript value:", newTranscript);
            // Also update the ref
            currentTranscriptRef.current = newTranscript;
            return newTranscript;
          });
          if (onSpeechRecognized) onSpeechRecognized(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
      };

      recognition.onend = () => {
        console.log("Speech recognition ended");

        // Auto-restart if we're still in recording mode
        if (isRecordingRef.current) {
          console.log("Auto-restarting speech recognition...");
          setTimeout(() => {
            if (isRecordingRef.current) {
              try {
                startBrowserSpeechRecognition();
              } catch (err) {
                console.error("Error restarting speech recognition:", err);
              }
            }
          }, 100); // Small delay before restarting
        }
      };

      recognition.start();
      recognitionRef.current = recognition;

      // Set up a heartbeat to ensure continuous recording
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      heartbeatIntervalRef.current = setInterval(() => {
        if (
          isRecordingRef.current &&
          (!recognitionRef.current || document.hidden)
        ) {
          console.log("Heartbeat check: Restarting speech recognition");
          try {
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
            startBrowserSpeechRecognition();
          } catch (err) {
            console.error("Error in heartbeat restart:", err);
          }
        }
      }, 5000); // Check every 5 seconds
    } catch (err) {
      console.error("Error starting speech recognition:", err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Log the API base URI to ensure it's correct
  console.log(`🎤 VoiceRecorder: Using API base URI: ${API_BASE_URI}`);

  function getTranscriptionEndpoint(language: string) {
    const langPrefix = language.split("-")[0].toLowerCase();
    if (langPrefix === "fi") {
      return `${API_BASE_URI}/api/speech-to-text/fi`;
    } else if (langPrefix === "en") {
      // We should never reach this code for English as we have an early return in transcribeAudio
      // This is only kept for completeness
      console.log(
        "⚠️ VoiceRecorder: Warning - English endpoint should be skipped"
      );
      return `${API_BASE_URI}/api/speech-to-text/en`;
    } else {
      return `${API_BASE_URI}/api/speech-to-text`;
    }
  }

  // Special function for Finnish transcription with extended timeout
  async function transcribeFinnishAudio(file: Blob) {
    console.log(
      `🎤 VoiceRecorder: Using Finnish transcription service from SpeechService`
    );
    console.log(
      `🎤 VoiceRecorder: Finnish audio blob size: ${file.size} bytes, type: ${file.type}`
    );

    // Show a specific message for Finnish
    setServerTranscript("Processing Finnish audio... This may take a moment.");

    // Set loading state to true at the beginning
    setIsLoading(true);

    try {
      // First check if the server is available
      const healthCheck = await fetch(`${API_BASE_URI}/health`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      console.log(
        `🎤 VoiceRecorder: Finnish health check status: ${healthCheck.status}`
      );

      if (!healthCheck.ok) {
        console.error(
          `🎤 VoiceRecorder: Finnish server health check failed with status: ${healthCheck.status}`
        );
        setIsLoading(false); // Clear loading state
        return "Error: Speech recognition server is not available. Please try again later.";
      }

      // Use the main SpeechService with Finnish language code
      console.log(
        `🎤 VoiceRecorder: Calling convertSpeechToText with ${file.size} bytes and language fi-FI`
      );
      // Import the function from SpeechService
      const { convertSpeechToText } = await import("../services/SpeechService");
      const result = await convertSpeechToText(file, "fi-FI");
      console.log(`🎤 VoiceRecorder: Finnish transcription result:`, result);

      // Add additional debug logging for Finnish transcription
      if (result && result.transcript) {
        console.log(
          `🎤 VoiceRecorder: Finnish transcript content: "${result.transcript}"`
        );
        // Update the transcript display immediately for debugging
        setServerTranscript(result.transcript);

        // Make sure we return the transcript for Finnish language
        const transcript = result.transcript.trim();
        if (transcript) {
          console.log(
            `🎤 VoiceRecorder: Returning Finnish transcript: "${transcript}"`
          );
          // Clear loading state after successful response
          setIsLoading(false);
          return transcript;
        } else {
          console.warn(
            `🎤 VoiceRecorder: Finnish transcript is empty after trimming, checking raw result`
          );
          // If the transcript is empty after trimming, check if there's any content in the raw result
          if (result.transcript) {
            console.log(
              `🎤 VoiceRecorder: Using raw Finnish transcript: "${result.transcript}"`
            );
            setIsLoading(false);
            return result.transcript;
          }
        }
      } else {
        console.error(
          `🎤 VoiceRecorder: Empty or invalid Finnish transcript result`
        );
      }

      // Clear loading state after successful response
      setIsLoading(false);
      return result?.transcript || "";
    } catch (error) {
      console.error("🎤 VoiceRecorder: Finnish API request failed:", error);

      // Clear loading state on error
      setIsLoading(false);

      if (error instanceof DOMException && error.name === "AbortError") {
        return "Finnish request timed out. The server may be busy processing your audio.";
      }

      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  async function transcribeAudio(file: Blob, currentTranscript: string = "") {
    // Note: For English, we use browser transcript directly (see recorder.onstop handler)
    // and never call this function for English with transcript available
    // This function is only called for non-English languages or if browser transcript is empty

    // Skip processing completely for English - we should use browser transcript instead
    const isEnglish = language.toLowerCase().includes("en");
    if (isEnglish) {
      console.log(
        "🎤 VoiceRecorder: Skipping server transcription for English language"
      );
      // If we have a transcript, use it
      if (currentTranscript && currentTranscript.trim() !== "") {
        console.log(
          "INFO: VoiceRecorder: Using provided transcript for English:",
          currentTranscript
        );
        return currentTranscript;
      }

      // If we don't have a transcript, check the ref as a fallback
      if (
        currentTranscriptRef.current &&
        currentTranscriptRef.current.trim() !== ""
      ) {
        console.log(
          "INFO: VoiceRecorder: Using ref transcript for English:",
          currentTranscriptRef.current
        );
        return currentTranscriptRef.current;
      }

      // If we still don't have a transcript, check the state variable as a last resort
      if (transcript && transcript.trim() !== "") {
        console.log(
          "INFO: VoiceRecorder: Using state transcript for English:",
          transcript
        );
        return transcript;
      }

      // If we still don't have a transcript, return an empty string to trigger server fallback
      console.log(
        "WARNING: VoiceRecorder: No transcript available for English"
      );
      return ""; // Return empty string to trigger server fallback in parent component
    }

    // Use specialized function for Finnish
    const isFinnish = language.toLowerCase().includes("fi");
    if (isFinnish) {
      console.log(
        "🎤 VoiceRecorder: Using specialized Finnish transcription path"
      );
      // We already checked if it's Finnish above, so no need to check again
      return transcribeFinnishAudio(file);
    }
    const endpoint = getTranscriptionEndpoint(language);
    console.log(`🎤 VoiceRecorder: Using endpoint: ${endpoint}`);

    const formData = new FormData();
    formData.append("file", file);

    // Add language parameter for all endpoints for consistency
    formData.append("language", language);

    try {
      // Show a processing message
      setServerTranscript("Processing audio...");

      console.log(
        `🎤 VoiceRecorder: Sending ${file.size} bytes to ${endpoint}`
      );

      // Standard timeout for all languages
      const timeoutDuration = 60000; // 1 minute

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error(
          `🎤 VoiceRecorder: Request timed out after ${
            timeoutDuration / 1000
          } seconds`
        );
      }, timeoutDuration);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
        },
      });

      clearTimeout(timeoutId);
      console.log(
        `🎤 VoiceRecorder: Received response with status: ${response.status}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `🎤 VoiceRecorder: Server error: ${response.status} - ${errorText}`
        );
        return `Error ${response.status}: ${errorText.substring(0, 100)}...`;
      }

      const data = await response.json();
      console.log(`🎤 VoiceRecorder: Successfully parsed response JSON`);
      return data.transcript || "Transcription failed";
    } catch (error) {
      console.error("🎤 VoiceRecorder: API request failed:", error);

      // More descriptive error message
      if (error instanceof DOMException && error.name === "AbortError") {
        return "Request timed out. The server may be busy or unavailable.";
      }

      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (heartbeatIntervalRef.current)
        clearInterval(heartbeatIntervalRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) recognitionRef.current.stop();
      isRecordingRef.current = false;
    };
  }, []);

  // Determine if we're processing Finnish audio
  const isFinnishLanguage = language.toLowerCase().includes("fi");

  // Function to update transcript in the container
  useEffect(() => {
    const updateTranscriptContainer = () => {
      const container = document.getElementById("transcript-container");
      if (container) {
        // Clear previous content
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }

        // For English, show server transcript if available (when browser transcript is empty)
        const isEnglish = language.toLowerCase().includes("en");
        const hasServerTranscript =
          serverTranscript && serverTranscript.trim() !== "";
        const hasTranscript = transcript && transcript.trim() !== "";

        // Determine what to display
        let displayText = "";
        let titleText = "";
        let isProcessing = false;

        if (isEnglish) {
          // For English
          if (hasTranscript) {
            displayText = transcript;
            titleText = "Transcript:";
          } else if (
            hasServerTranscript &&
            !serverTranscript.startsWith("Using browser")
          ) {
            displayText = serverTranscript;
            titleText = "Server Transcript:";
          } else if (isLoading) {
            displayText = "Converting speech to text...";
            titleText = "Processing...";
            isProcessing = true;
          }
        } else if (isFinnishLanguage) {
          // For Finnish
          if (hasServerTranscript) {
            if (serverTranscript.startsWith("Processing")) {
              displayText =
                "Converting speech to text. This may take a moment...";
              titleText = "Processing...";
              isProcessing = true;
            } else {
              displayText = serverTranscript;
              titleText = "Finnish Transcript:";
            }
          } else if (isLoading) {
            displayText = "Processing Finnish audio... This may take a moment.";
            titleText = "Processing...";
            isProcessing = true;
          }
        }

        // Only create box if we have something to display
        if (displayText) {
          const transcriptBox = document.createElement("div");
          transcriptBox.style.padding = "16px";
          transcriptBox.style.margin = "8px";
          transcriptBox.style.backgroundColor = isProcessing
            ? "rgba(25, 118, 210, 0.08)"
            : "white";
          transcriptBox.style.borderRadius = "4px";
          transcriptBox.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
          transcriptBox.style.border = "1px solid";
          transcriptBox.style.borderColor = isProcessing
            ? "#90caf9"
            : "#e0e0e0";

          const titleEl = document.createElement("div");
          titleEl.style.fontWeight = "600";
          titleEl.style.marginBottom = "10px";
          titleEl.style.fontSize = "1rem";
          titleEl.style.color = isProcessing ? "#1976d2" : "#333";
          titleEl.textContent = titleText;

          const contentEl = document.createElement("div");
          contentEl.style.fontSize = "1.1rem";
          contentEl.style.lineHeight = "1.5";
          contentEl.style.color = isProcessing ? "#1976d2" : "#000";
          contentEl.style.fontWeight = isProcessing ? "400" : "500";
          contentEl.textContent = displayText;

          transcriptBox.appendChild(titleEl);
          transcriptBox.appendChild(contentEl);
          container.appendChild(transcriptBox);

          // Add a loading indicator if processing
          if (isProcessing) {
            const loadingIndicator = document.createElement("div");
            loadingIndicator.style.display = "inline-block";
            loadingIndicator.style.width = "16px";
            loadingIndicator.style.height = "16px";
            loadingIndicator.style.border = "3px solid rgba(25, 118, 210, 0.3)";
            loadingIndicator.style.borderRadius = "50%";
            loadingIndicator.style.borderTop = "3px solid #1976d2";
            loadingIndicator.style.animation = "spin 1s linear infinite";
            loadingIndicator.style.marginRight = "10px";
            loadingIndicator.style.verticalAlign = "middle";

            // Add keyframes for the spin animation
            const style = document.createElement("style");
            style.textContent = `
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `;
            document.head.appendChild(style);

            titleEl.insertBefore(loadingIndicator, titleEl.firstChild);
          }
        }
      }
    };

    updateTranscriptContainer();

    // Update when any relevant state changes
    const intervalId = setInterval(updateTranscriptContainer, 500); // Update every 500ms to catch changes

    return () => {
      clearInterval(intervalId);
    };
  }, [transcript, serverTranscript, isLoading, language, isFinnishLanguage]);

  return (
    <Box sx={{ mb: 0 }}>
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}

      <Box
        sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}
      >
        <Button
          variant="contained"
          color={isRecording ? "secondary" : "primary"}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isLoading}
          sx={{
            minWidth: "unset",
            width: "36px",
            height: "36px",
            p: 0,
            borderRadius: "50%",
            flexShrink: 0, // Prevent the button from shrinking
          }}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : isRecording ? (
            <Stop fontSize="small" />
          ) : (
            <MicNone fontSize="small" />
          )}
        </Button>

        {isRecording && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ ml: 1, flexShrink: 0 }}
          >
            {formatTime(recordingTime)}
          </Typography>
        )}

        {audioURL && !isRecording && (
          <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
            <audio
              src={audioURL}
              controls
              style={{ height: "36px", width: "100%" }}
            />
          </Box>
        )}
      </Box>

      {/* Transcript content is now displayed in the transcript-container */}
    </Box>
  );
};

export default VoiceRecorder;

