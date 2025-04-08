import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  IconButton,
  Paper,
  useMediaQuery,
  useTheme,
  CircularProgress
} from "@mui/material";
import { MicNone, Stop, Clear } from "@mui/icons-material";
// Assuming SpeechService is in the correct relative path
import { convertSpeechToText } from "../services/SpeechService"; // Adjust path if needed

// --- Interfaces (assuming they are defined correctly elsewhere or copied here) ---
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation?: Record<string, unknown>; // Make interpretation optional
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionError) => void;
  onend: () => void;
  onstart?: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
    webkitAudioContext: typeof AudioContext; // Keep this if needed elsewhere
  }
}

// --- Component Props ---
interface SimpleVoiceRecorderProps {
  /** Callback with the final audio blob and the best available transcript */
  onAudioRecorded: (audioBlob: Blob, finalTranscript: string) => void;
  /** Optional callback for real-time browser transcript updates (final parts) */
  onSpeechRecognized?: (transcript: string) => void;
  /** Language code (e.g., 'en-US', 'fi-FI') */
  language: string;
  /** Disable the component */
  disabled?: boolean;
  /** Specify languages that MUST use the server for transcription */
  serverLanguages?: string[];
}

// --- Component Implementation ---
const SimpleVoiceRecorder: React.FC<SimpleVoiceRecorderProps> = ({
  onAudioRecorded,
  onSpeechRecognized,
  language,
  disabled = false,
  serverLanguages = ["fi", "fi-FI"] // Default Finnish to server
}) => {
  // --- Hooks ---
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // --- State ---
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For async operations (start/stop/server)
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState(""); // Final transcript (browser or server)
  const [interimTranscript, setInterimTranscript] = useState(""); // Real-time browser transcript
  const [error, setError] = useState<string | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null); // For playback
  const [processingServerRequest, setProcessingServerRequest] = useState(false);
  const [browserRecognitionActive, setBrowserRecognitionActive] =
    useState(false); // Tracks if browser API is *supposed* to be running
  const [showRestartButton, setShowRestartButton] = useState<boolean>(false);
  const [restartCount, setRestartCount] = useState(0);

  // --- Refs ---
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null); // Browser SpeechRecognition instance
  const isRecordingRef = useRef<boolean>(false); // To access current state in callbacks/intervals
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const forceRestartIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const lastRestartTimeRef = useRef<number>(0);
  const lastSpeechTimeRef = useRef<number>(0);
  const transcriptContainerRef = useRef<HTMLDivElement>(null); // For auto-scrolling
  const wasVisibleRef = useRef<boolean>(true); // Track visibility changes

  // --- Constants ---
  const USE_BROWSER_RECOGNITION =
    !serverLanguages.some((lang) => language.toLowerCase().startsWith(lang)) &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const MAX_RECORDING_TIME_SECONDS = 300; // 5 minutes
  const RECOGNITION_RESTART_INTERVAL = 300; // Check browser recognition status often
  const FORCE_RESTART_INTERVAL = 5000; // Force restart browser recognition periodically
  const SILENCE_TIMEOUT = 4000; // Restart browser recognition after silence
  const MAX_RESTART_ATTEMPTS = 50; // Limit automatic restarts for browser recognition

  // --- Helper Functions ---

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const clearState = () => {
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    setAudioURL(null);
    setRecordingTime(0);
    setProcessingServerRequest(false);
    setBrowserRecognitionActive(false);
    setShowRestartButton(false);
    setRestartCount(0);
    audioChunksRef.current = [];
    if (onSpeechRecognized) {
      onSpeechRecognized(""); // Notify parent
    }
  };

  const clearTranscriptOnly = () => {
    setTranscript("");
    setInterimTranscript("");
    if (onSpeechRecognized) {
      onSpeechRecognized(""); // Notify parent
    }
  };

  // --- Browser Speech Recognition Logic (Adapted from SimpleVoiceRecognition) ---

  const stopBrowserRecognition = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (forceRestartIntervalRef.current) {
      clearInterval(forceRestartIntervalRef.current);
      forceRestartIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        console.log("Stopping browser speech recognition...");
        recognitionRef.current.stop(); // onend should handle cleanup
      } catch (e) {
        console.warn("Error stopping browser recognition:", e);
        recognitionRef.current = null; // Force clear if stop fails
      }
    }
    setBrowserRecognitionActive(false); // Mark as inactive
    setShowRestartButton(false); // Hide restart button when stopping normally
  }, []);

  const restartBrowserSpeechRecognition = useCallback((): boolean => {
    if (!isRecordingRef.current || !USE_BROWSER_RECOGNITION) {
      console.log(
        "Skipping browser recognition restart (not recording or not applicable)"
      );
      return false;
    }

    console.log("🔄 Attempting to restart browser speech recognition");
    lastRestartTimeRef.current = Date.now();

    setRestartCount((prevCount) => {
      if (prevCount + 1 > MAX_RESTART_ATTEMPTS) {
        console.warn(
          `Max browser restart attempts (${MAX_RESTART_ATTEMPTS}) reached.`
        );
        setShowRestartButton(true); // Show manual restart if auto fails too often
      }
      return prevCount + 1;
    });

    const restartAttemptTime = Date.now();

    // Stop existing instance first
    if (recognitionRef.current) {
      try {
        console.log("Stopping existing browser recognition before restart");
        recognitionRef.current.stop(); // Let onend clear the ref ideally
      } catch (err) {
        console.warn("Error stopping existing browser recognition:", err);
        recognitionRef.current = null; // Force clear if stop fails
      }
    }

    // Use setTimeout to allow the previous instance to potentially clean up
    // and prevent race conditions.
    setTimeout(() => {
      // Check if still recording and if another restart hasn't occurred more recently
      if (
        !isRecordingRef.current ||
        lastRestartTimeRef.current > restartAttemptTime
      ) {
        console.log(
          "Aborting delayed restart (recording stopped or newer restart occurred)"
        );
        return;
      }

      console.log("Executing delayed restart...");
      const success = startBrowserSpeechRecognition(); // Attempt to start new instance
      if (success) {
        console.log("✅ Browser recognition restarted successfully.");
        setShowRestartButton(false); // Hide button on successful restart
      } else {
        console.error("❌ Failed to restart browser speech recognition.");
        setShowRestartButton(true); // Show button if restart fails
      }
    }, 150); // Delay slightly (e.g., 150ms)

    return true; // Indicate an attempt was made
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, USE_BROWSER_RECOGNITION]); // Dependencies needed

  const startBrowserSpeechRecognition = useCallback((): boolean => {
    if (!USE_BROWSER_RECOGNITION) return false;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("Browser speech recognition not supported.");
      return false;
    }

    // Ensure previous intervals are cleared
    if (heartbeatIntervalRef.current)
      clearInterval(heartbeatIntervalRef.current);
    if (forceRestartIntervalRef.current)
      clearInterval(forceRestartIntervalRef.current);

    lastSpeechTimeRef.current = Date.now(); // Reset silence timer

    try {
      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      console.log(
        `Attempting to start browser recognition for lang: ${language}`
      );

      recognition.onstart = () => {
        console.log("🎙️ Browser speech recognition started.");
        setBrowserRecognitionActive(true); // Mark as active
        setShowRestartButton(false); // Hide manual button
        lastRestartTimeRef.current = Date.now(); // Record start time
        setRestartCount(0); // Reset counter on successful start
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        lastSpeechTimeRef.current = Date.now(); // Update last speech time
        let finalTranscriptPart = "";
        let currentInterim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptPart += event.results[i][0].transcript + " ";
          } else {
            currentInterim = event.results[i][0].transcript;
          }
        }

        // Update interim transcript immediately for responsiveness
        setInterimTranscript(currentInterim);

        if (finalTranscriptPart) {
          const trimmedFinalPart = finalTranscriptPart.trim();
          console.log(`Browser final part: "${trimmedFinalPart}"`);
          setTranscript((prev) =>
            (prev ? prev + " " + trimmedFinalPart : trimmedFinalPart).trim()
          );
          // Optionally notify parent component of the final part
          if (onSpeechRecognized) {
            onSpeechRecognized(trimmedFinalPart);
          }
          setInterimTranscript(""); // Clear interim after final
        }
      };

      recognition.onerror = (event: SpeechRecognitionError) => {
        console.error(
          `Browser recognition error: ${event.error}`,
          event.message
        );
        if (event.error !== "no-speech" && event.error !== "aborted") {
          setError(`Recognition Error: ${event.error}`);
          // Attempt to restart on significant errors if still recording
          if (isRecordingRef.current) {
            console.log(`Attempting restart after error: ${event.error}`);
            // Use timeout to avoid instant loop on some errors
            setTimeout(() => restartBrowserSpeechRecognition(), 200);
          }
        } else if (event.error === "no-speech") {
          console.log("Browser: No speech detected.");
          // Potentially restart here too if silence persists, handled by heartbeat
        } else if (event.error === "aborted") {
          console.log(
            "Browser: Recognition aborted (likely intentional stop or restart)."
          );
        }
        // Don't clear the ref here, let onend handle it or the restart logic
        setBrowserRecognitionActive(false); // Mark as inactive on error
      };

      recognition.onend = () => {
        console.log("Browser speech recognition service ended.");
        // Check if this end was expected (due to stopRecording or restart)
        // or unexpected (browser timeout, network issue)
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null; // Clear the ref if it's the current one
        }
        setBrowserRecognitionActive(false); // Mark as inactive

        // If we are *still supposed* to be recording, it means the service stopped unexpectedly.
        if (isRecordingRef.current && USE_BROWSER_RECOGNITION) {
          console.log(
            "Browser recognition ended unexpectedly, attempting auto-restart..."
          );
          // Attempt immediate restart with a small delay
          setTimeout(() => {
            if (isRecordingRef.current) {
              // Double-check if still recording
              restartBrowserSpeechRecognition();
            }
          }, 50);
        }
      };

      recognition.start();

      // --- Heartbeat and Forced Restart Intervals ---
      heartbeatIntervalRef.current = setInterval(() => {
        if (!isRecordingRef.current || !recognitionRef.current) {
          // If recording stopped or recognition ended, clear interval
          if (heartbeatIntervalRef.current)
            clearInterval(heartbeatIntervalRef.current);
          return;
        }

        const now = Date.now();
        // Check for prolonged silence
        if (now - lastSpeechTimeRef.current > SILENCE_TIMEOUT) {
          console.log(
            `🎤 Silence detected for >${
              SILENCE_TIMEOUT / 1000
            }s, restarting browser recognition.`
          );
          lastSpeechTimeRef.current = now; // Prevent immediate re-trigger
          restartBrowserSpeechRecognition();
        }

        // Check visibility - restart if returning to tab
        const isVisible = document.visibilityState === "visible";
        if (isVisible && !wasVisibleRef.current) {
          console.log("👀 Tab became visible, restarting browser recognition.");
          restartBrowserSpeechRecognition();
        }
        wasVisibleRef.current = isVisible;
      }, RECOGNITION_RESTART_INTERVAL);

      forceRestartIntervalRef.current = setInterval(() => {
        if (!isRecordingRef.current || !recognitionRef.current) {
          // If recording stopped or recognition ended, clear interval
          if (forceRestartIntervalRef.current)
            clearInterval(forceRestartIntervalRef.current);
          return;
        }
        console.log(`⏰ Forced periodic restart of browser recognition.`);
        restartBrowserSpeechRecognition();
      }, FORCE_RESTART_INTERVAL);

      return true;
    } catch (err) {
      console.error("❌ Failed to start browser speech recognition:", err);
      setError(
        `Could not start browser recognition: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      recognitionRef.current = null;
      setBrowserRecognitionActive(false);
      setShowRestartButton(true); // Show manual restart if initial start fails
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, USE_BROWSER_RECOGNITION, restartBrowserSpeechRecognition]); // Dependencies

  // --- Server Speech Recognition (Finnish Example) ---
  const processServerSpeechRecognition = async (
    audioBlob: Blob
  ): Promise<string> => {
    if (
      !serverLanguages.some((lang) => language.toLowerCase().startsWith(lang))
    ) {
      return ""; // Not a server language
    }
    if (audioBlob.size < 1000) {
      // Basic check for empty blob
      console.warn("Audio blob too small for server processing, skipping.");
      return "";
    }

    console.log(
      `☁️ Sending audio to server for ${language} transcription... Blob size: ${audioBlob.size}`
    );
    setProcessingServerRequest(true);
    setError(null); // Clear previous errors

    try {
      // Use the imported service function
      const result = await convertSpeechToText(audioBlob, language);

      if (result && result.transcript) {
        console.log(`☁️ Server transcript received: "${result.transcript}"`);
        return result.transcript.trim();
      } else {
        console.log("☁️ Server returned no transcript.");
        return "";
      }
    } catch (error) {
      console.error("☁️ Error during server speech recognition:", error);
      setError(
        `Server Error: ${
          error instanceof Error ? error.message : "Failed to get transcript"
        }`
      );
      return "";
    } finally {
      setProcessingServerRequest(false);
    }
  };

  // --- Media Recorder Logic ---

  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      audioChunksRef.current.push(event.data);
    }
  };

  const startRecording = async () => {
    clearState(); // Reset everything before starting
    setIsLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine MIME type
      const MimeTypes = [
        "audio/webm;codecs=opus", // Often preferred for quality/size
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4" // Less common for just audio but possible
        // Add 'audio/wav' if specifically needed and supported
      ];
      const supportedMimeType = MimeTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );
      if (!supportedMimeType) {
        throw new Error("No suitable audio format supported by this browser.");
      }
      console.log(`Using MIME type: ${supportedMimeType}`);

      const recorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType
      });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = []; // Ensure chunks are reset

      recorder.ondataavailable = handleDataAvailable;

      recorder.onstop = async () => {
        console.log("MediaRecorder stopped.");
        isRecordingRef.current = false; // Update ref immediately
        setIsRecording(false); // Update state
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;

        setIsLoading(true); // Indicate processing starts

        // --- Final Processing ---
        const audioBlob = new Blob(audioChunksRef.current, {
          type: supportedMimeType
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        console.log(
          `Final audio blob created: Size=${audioBlob.size}, Type=${audioBlob.type}`
        );

        let finalTranscriptResult = "";

        // Decide transcript source based on language
        if (
          serverLanguages.some((lang) =>
            language.toLowerCase().startsWith(lang)
          )
        ) {
          // Get transcript from server
          finalTranscriptResult = await processServerSpeechRecognition(
            audioBlob
          );
          setTranscript(finalTranscriptResult); // Update state with server result
        } else {
          // Use browser transcript (combine final + last interim if any)
          finalTranscriptResult = (transcript + " " + interimTranscript).trim();
          setTranscript(finalTranscriptResult); // Update state
          setInterimTranscript(""); // Clear interim after stop
        }

        console.log(`Final Transcript: "${finalTranscriptResult}"`);

        // Call the main callback
        onAudioRecorded(audioBlob, finalTranscriptResult);

        // Clean up stream tracks
        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        setIsLoading(false); // Processing finished
      };

      // Start recording
      recorder.start(1000); // Record in 1-second chunks (or adjust as needed)
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start browser recognition if applicable
      if (USE_BROWSER_RECOGNITION) {
        startBrowserSpeechRecognition();
      } else {
        console.log(
          "Browser speech recognition not used for this language or not supported."
        );
      }

      setIsLoading(false); // Finished starting
    } catch (err) {
      console.error("Error starting recording:", err);
      setError(
        `Failed to start recording: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      // Cleanup on error
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
      mediaRecorderRef.current = null;
      isRecordingRef.current = false;
      setIsRecording(false);
      setIsLoading(false);
      if (timerRef.current) clearInterval(timerRef.current);
      stopBrowserRecognition(); // Ensure browser recognition is also stopped
    }
  };

  const stopRecording = () => {
    console.log("Stop recording requested...");
    // Stop browser recognition first (if running)
    if (USE_BROWSER_RECOGNITION) {
      stopBrowserRecognition();
    }

    // Stop MediaRecorder (will trigger onstop)
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop(); // onstop handler will do the rest
    } else {
      console.log("MediaRecorder not recording or already stopped.");
      // If somehow recorder didn't stop, force state update
      isRecordingRef.current = false;
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setIsLoading(false); // Ensure loading is false if recorder was not active
    }
    // Note: isLoading will be set to true within recorder.onstop when processing starts
  };

  const manuallyRestartBrowserRecognition = () => {
    if (!isRecording || !USE_BROWSER_RECOGNITION) return;
    console.log("Manual browser recognition restart triggered.");
    setShowRestartButton(false); // Hide button immediately
    restartBrowserSpeechRecognition();
  };

  // --- Effects ---

  // Auto-scroll transcript container
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop =
        transcriptContainerRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("SimpleVoiceRecorder unmounting: Cleaning up...");
      if (timerRef.current) clearInterval(timerRef.current);
      stopBrowserRecognition(); // Clean up recognition intervals and instance
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current.stream
          ?.getTracks()
          .forEach((track) => track.stop());
      }
      // Revoke object URL if it exists
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioURL, stopBrowserRecognition]); // Include stopBrowserRecognition if it's stable

  // Max recording time limit
  useEffect(() => {
    let maxTimeTimeout: ReturnType<typeof setTimeout> | null = null;
    if (isRecording) {
      maxTimeTimeout = setTimeout(() => {
        if (isRecordingRef.current) {
          // Check ref for current state
          console.warn(
            `Max recording time (${MAX_RECORDING_TIME_SECONDS}s) reached. Stopping.`
          );
          setError(
            `Max recording time (${formatTime(
              MAX_RECORDING_TIME_SECONDS
            )}) reached.`
          );
          stopRecording();
        }
      }, MAX_RECORDING_TIME_SECONDS * 1000);
    }
    return () => {
      if (maxTimeTimeout) clearTimeout(maxTimeTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]); // Rerun when recording state changes

  // Visibility change handler for browser recognition restart
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";
      if (
        USE_BROWSER_RECOGNITION &&
        isRecordingRef.current &&
        isVisible &&
        !wasVisibleRef.current
      ) {
        console.log(
          "👁️ Tab became visible during recording, restarting browser recognition."
        );
        restartBrowserSpeechRecognition();
      }
      wasVisibleRef.current = isVisible;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [USE_BROWSER_RECOGNITION, restartBrowserSpeechRecognition]); // Effect dependencies

  // --- Render ---
  return (
    <Paper
      elevation={2}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: isMobile ? 1.5 : 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden" // Prevent content spilling out
      }}
    >
      {/* Header / Controls */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="left"
        flexWrap="wrap" // Allow wrapping on small screens
        gap={1}
      >
        <Button
          variant="contained"
          color={isRecording ? "error" : "primary"} // Use error color for Stop
          startIcon={
            isLoading && !isRecording ? (
              <CircularProgress size={20} color="inherit" />
            ) : isRecording ? (
              <Stop />
            ) : (
              <MicNone />
            )
          }
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || (isLoading && isRecording)} // Disable stop briefly if processing on stop
          sx={{ minWidth: isMobile ? "120px" : "160px", order: 1 }} // Control order
          aria-label={
            isRecording
              ? `Stop Recording (${formatTime(recordingTime)})`
              : "Start Recording"
          }
        >
          {isLoading && !isRecording
            ? "Starting..."
            : isRecording
            ? `Stop (${formatTime(recordingTime)})`
            : "Record"}
        </Button>

        {/* Manual Restart Button for Browser Recognition */}
        {showRestartButton && isRecording && USE_BROWSER_RECOGNITION && (
          <Button
            variant="outlined"
            color="warning"
            size="small"
            onClick={manuallyRestartBrowserRecognition}
            sx={{ order: 2, ml: 1 }}
            startIcon={
              restartCount > MAX_RESTART_ATTEMPTS / 2 ? (
                <CircularProgress size={14} color="inherit" />
              ) : null
            }
          >
            Restart Mic ({restartCount})
          </Button>
        )}

        {/* Clear Button */}
        {(transcript || interimTranscript) && !isRecording && (
          <IconButton
            onClick={clearTranscriptOnly}
            size="small"
            aria-label="Clear Transcript"
            title="Clear Transcript"
            sx={{ order: 3 }}
            disabled={isLoading}
          >
            <Clear />
          </IconButton>
        )}

        {/* Audio Player */}
        {audioURL && !isRecording && !isLoading && (
          <Box
            sx={{ order: 4, ml: "auto", display: "flex", alignItems: "left" }}
          >
            <audio src={audioURL} controls style={{ maxWidth: "200px" }} />
          </Box>
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Typography color="error" variant="caption" sx={{ mt: -1, mb: 1 }}>
          {error}
        </Typography>
      )}

      {/* Transcript Area */}
      {(isRecording ||
        transcript ||
        interimTranscript ||
        isLoading ||
        processingServerRequest) && (
        <Box
          ref={transcriptContainerRef}
          sx={{
            mt: 1,
            p: 1.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            minHeight: "100px", // Min height
            maxHeight: "300px", // Max height <<<< SCROLL LIMIT
            overflowY: "auto", // <<<< ENABLE SCROLLING
            bgcolor: "background.default", // Use theme background
            position: "relative", // For status indicators
            wordBreak: "break-word",
            whiteSpace: "pre-wrap", // Preserve line breaks and wrap text
            display: "flex", // Use flexbox for content layout
            flexDirection: "column", // Stack content vertically
            // Custom scrollbar (optional)
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-track": { background: "rgba(0,0,0,0.05)" },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(0,0,0,0.2)",
              borderRadius: "4px"
            },
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(0,0,0,0.2) rgba(0,0,0,0.05)"
          }}
        >
          {/* Status Indicators */}
          {isRecording && (
            <Box
              sx={{
                position: "absolute",
                top: 4,
                right: 8,
                display: "flex",
                alignItems: "center",
                gap: 1,
                zIndex: 1,
                bgcolor: "rgba(255, 255, 255, 0.8)",
                padding: "2px 5px",
                borderRadius: "10px"
              }}
            >
              {/* Browser Recognition Status */}
              {USE_BROWSER_RECOGNITION && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: recognitionRef.current
                        ? "success.main"
                        : "warning.main",
                      animation: recognitionRef.current
                        ? "pulse 1.5s infinite ease-in-out"
                        : "none",
                      "@keyframes pulse": {
                        "0%, 100%": { opacity: 0.6 },
                        "50%": { opacity: 1 }
                      }
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ fontSize: "0.65rem", color: "text.secondary" }}
                  >
                    {recognitionRef.current ? "Mic Active" : "Mic Init..."}
                  </Typography>
                </Box>
              )}
              {/* Server Processing Status (shows after stop) */}
              {processingServerRequest && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <CircularProgress size={10} thickness={5} />
                  <Typography
                    variant="caption"
                    sx={{ fontSize: "0.65rem", color: "text.secondary" }}
                  >
                    Server
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Transcript Content */}
          <Box sx={{ flexGrow: 1 }}>
            {transcript && (
              <Typography variant="body1" component="div">
                {" "}
                {/* Use div for block display */}
                {transcript}
              </Typography>
            )}
            {interimTranscript && (
              <Typography
                variant="body2"
                component="div"
                sx={{
                  color: "text.secondary",
                  fontStyle: "italic",
                  mt: transcript ? 0.5 : 0
                }}
              >
                {interimTranscript}
              </Typography>
            )}
            {/* Placeholder when recording but no text yet */}
            {!transcript && !interimTranscript && isRecording && (
              <Typography
                variant="body2"
                sx={{ color: "text.disabled", fontStyle: "italic" }}
              >
                {USE_BROWSER_RECOGNITION
                  ? "Listening..."
                  : "Recording audio..."}
              </Typography>
            )}
            {/* Placeholder when processing server request */}
            {!transcript &&
              !interimTranscript &&
              !isRecording &&
              processingServerRequest && (
                <Typography
                  variant="body2"
                  sx={{ color: "text.disabled", fontStyle: "italic" }}
                >
                  Processing audio...
                </Typography>
              )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default SimpleVoiceRecorder;
