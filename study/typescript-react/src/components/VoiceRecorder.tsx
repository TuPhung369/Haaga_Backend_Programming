import React, { useState, useRef, useEffect } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { MicNone, Stop } from "@mui/icons-material";
import { convertFinnishSpeechToText } from "../services/FinnishSpeechService";

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

            // Return empty string to trigger server fallback in parent component
            onAudioRecorded(audioBlob, "");
          } else {
            // Use the captured transcript value for English fallback
            // Transcribe using server
            const serverResult = await transcribeAudio(
              audioBlob,
              currentTranscriptValue
            );
            setServerTranscript(serverResult);

            // Pass both audio and transcript to parent
            onAudioRecorded(audioBlob, serverResult);
          }
        }

        stream.getTracks().forEach((track) => track.stop());
        setIsLoading(false);
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      recorder.start(1000);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      setIsRecording(true);
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
    const isFinnish = language.toLowerCase().includes("fi");
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
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Error starting speech recognition:", err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // API URL - using the same base URI as SpeechService
  const API_BASE_URI = "http://localhost:8008";

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
      `🎤 VoiceRecorder: Using specialized Finnish transcription service`
    );

    // Show a specific message for Finnish
    setServerTranscript(
      "Processing Finnish audio... This may take several minutes."
    );

    try {
      // Use our specialized Finnish speech service
      const result = await convertFinnishSpeechToText(file);
      return result.transcript;
    } catch (error) {
      console.error("🎤 VoiceRecorder: Finnish API request failed:", error);

      if (error instanceof DOMException && error.name === "AbortError") {
        return "Finnish request timed out after 3 minutes. The server may be busy processing your audio.";
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
      // We already checked if it's Finnish above, so no need to check again
      return transcribeFinnishAudio(file);
    }
    const endpoint = getTranscriptionEndpoint(language);
    console.log(`🎤 VoiceRecorder: Using endpoint: ${endpoint}`);

    const formData = new FormData();
    formData.append("file", file);

    // Add language parameter for all endpoints for consistency
    formData.append("language", language);

    // Add Finnish-specific parameters if needed
    if (isFinnish) {
      formData.append("optimize", "true");
      formData.append("priority", "accuracy");
      formData.append("beam_size", "5"); // Larger beam size for better accuracy
      formData.append("vad_filter", "true"); // Voice activity detection
    }

    try {
      // Show a more specific message for Finnish
      if (isFinnish) {
        setServerTranscript(
          "Processing Finnish audio... This may take a moment."
        );
      } else {
        setServerTranscript("Processing audio...");
      }

      console.log(
        `🎤 VoiceRecorder: Sending ${file.size} bytes to ${endpoint}`
      );

      // Special handling for Finnish endpoint which may take longer - we already have isFinnish from above
      const timeoutDuration = isFinnish ? 180000 : 60000; // 3 minutes for Finnish, 1 minute for others

      if (isFinnish) {
        console.log(
          `🎤 VoiceRecorder: Using extended timeout of ${
            timeoutDuration / 1000
          } seconds for Finnish`
        );
        // Pre-process the audio for Finnish to make it smaller if possible
        if (file.size > 100000) {
          // If larger than 100KB
          console.log(
            `🎤 VoiceRecorder: Large Finnish audio file (${file.size} bytes), server may take longer to process`
          );
        }
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error(
          `🎤 VoiceRecorder: Request timed out after ${
            timeoutDuration / 1000
          } seconds`
        );
      }, timeoutDuration); // Use the language-specific timeout

      const response = await fetch(endpoint, {
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
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Determine if we're processing Finnish audio
  const isFinnishLanguage = language.toLowerCase().includes("fi");

  return (
    <Box sx={{ mb: 2 }}>
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Button
          variant="contained"
          color={isRecording ? "secondary" : "primary"}
          startIcon={isRecording ? <Stop /> : <MicNone />}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : isRecording ? (
            `Stop (${formatTime(recordingTime)})`
          ) : isFinnishLanguage ? (
            "Record Finnish"
          ) : (
            "Record"
          )}
        </Button>

        {audioURL && !isRecording && <audio src={audioURL} controls />}
      </Box>

      {/* Processing indicator for Finnish */}
      {isLoading && isFinnishLanguage && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mt: 2,
            p: 2,
            bgcolor: "info.light",
            color: "info.contrastText",
            borderRadius: 1,
          }}
        >
          <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
          <Typography variant="body2">
            Processing Finnish audio... This may take longer than other
            languages.
          </Typography>
        </Box>
      )}

      {transcript && language.includes("en") && (
        <Typography
          variant="body1"
          sx={{ mt: 2, p: 2, bgcolor: "rgba(0, 0, 0, 0.05)", borderRadius: 1 }}
        >
          Browser Transcript: {transcript}
        </Typography>
      )}
      {serverTranscript && isFinnishLanguage && (
        <Typography
          variant="body1"
          sx={{
            mt: 2,
            p: 2,
            bgcolor: serverTranscript.startsWith("Processing")
              ? "rgba(25, 118, 210, 0.1)"
              : "rgba(0, 0, 0, 0.05)",
            borderRadius: 1,
            color: serverTranscript.startsWith("Processing")
              ? "primary.main"
              : "text.primary",
          }}
        >
          Server Transcript: {serverTranscript}
        </Typography>
      )}

      {/* Finnish language tips */}
      {isFinnishLanguage && !isRecording && !isLoading && (
        <Typography
          variant="caption"
          sx={{ display: "block", mt: 2, color: "text.secondary" }}
        >
          Tip: For Finnish speech recognition, speak clearly and pause briefly
          between sentences for better results.
        </Typography>
      )}
    </Box>
  );
};

export default VoiceRecorder;

