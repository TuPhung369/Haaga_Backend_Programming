// src/components/SimpleVoiceRecorder.tsx
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
import { convertSpeechToText } from "../services/SpeechService"; // Adjust path if needed

// --- TypeScript Interfaces for SpeechRecognition ---
// (Define these here or import from a central types file like ../types/speech.ts)
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
  readonly interpretation?: unknown; // Optional based on browser
}
interface SpeechRecognitionErrorEvent extends Event {
  // Renamed to avoid conflict with DOMError
  readonly error: string;
  readonly message: string;
}
interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}
interface SpeechRecognition extends EventTarget {
  grammars: SpeechGrammarList;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI: string;

  start(): void;
  stop(): void;
  abort(): void;

  onaudiostart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown)
    | null;
  onnomatch:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown)
    | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown)
    | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;

  addEventListener<K extends keyof SpeechRecognitionEventMap>(
    type: K,
    listener: (
      this: SpeechRecognition,
      ev: SpeechRecognitionEventMap[K]
    ) => unknown,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof SpeechRecognitionEventMap>(
    type: K,
    listener: (
      this: SpeechRecognition,
      ev: SpeechRecognitionEventMap[K]
    ) => unknown,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}
interface SpeechRecognitionEventMap {
  audiostart: Event;
  audioend: Event;
  end: Event;
  error: SpeechRecognitionErrorEvent;
  nomatch: SpeechRecognitionEvent;
  result: SpeechRecognitionEvent;
  soundstart: Event;
  soundend: Event;
  speechstart: Event;
  speechend: Event;
  start: Event;
}
interface SpeechGrammar {
  src: string;
  weight?: number;
}
interface SpeechGrammarList {
  readonly length: number;
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
}

// --- Global Declaration ---
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
    // webkitAudioContext: typeof AudioContext; // Already declared above if needed
  }
}

// --- Component Props ---
interface SimpleVoiceRecorderProps {
  onAudioRecorded: (audioBlob: Blob, finalTranscript: string) => void;
  onSpeechRecognized?: (transcript: string) => void;
  language: string;
  disabled?: boolean;
  serverLanguages?: string[];
}

// --- Component Implementation ---
const SimpleVoiceRecorder: React.FC<SimpleVoiceRecorderProps> = ({
  onAudioRecorded,
  onSpeechRecognized,
  language,
  disabled = false,
  serverLanguages = ["fi", "fi-FI"]
}) => {
  // --- Hooks ---
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // --- State ---
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcriptUi, setTranscriptUi] = useState(""); // State for displaying final transcript in UI
  const [interimTranscript, setInterimTranscript] = useState(""); // State for displaying interim results in UI
  const [error, setError] = useState<string | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [processingServerRequest, setProcessingServerRequest] = useState(false);
  const [browserRecognitionActive, setBrowserRecognitionActive] =
    useState(false);
  const [showRestartButton, setShowRestartButton] = useState<boolean>(false);
  const [restartCount, setRestartCount] = useState(0);

  // --- Refs ---
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const forceRestartIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const lastRestartTimeRef = useRef<number>(0);
  const lastSpeechTimeRef = useRef<number>(0);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const wasVisibleRef = useRef<boolean>(true);
  // Refs for reliable transcript accumulation
  const finalTranscriptRef = useRef<string>("");
  const lastInterimTranscriptRef = useRef<string>("");

  // --- Constants ---
  const SpeechRecognitionAPI =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const USE_BROWSER_RECOGNITION =
    !serverLanguages.some((lang) => language.toLowerCase().startsWith(lang)) &&
    !!SpeechRecognitionAPI; // Check if API exists

  const MAX_RECORDING_TIME_SECONDS = 300;
  const RECOGNITION_RESTART_INTERVAL = 300;
  const FORCE_RESTART_INTERVAL = 5000;
  const MAX_RESTART_ATTEMPTS = 50;

  // --- Helper Functions ---

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Clears state and importantly, the transcript refs
  const clearStateAndRefs = useCallback(() => {
    setError(null);
    setTranscriptUi("");
    setInterimTranscript("");
    setAudioURL(null);
    setRecordingTime(0);
    setProcessingServerRequest(false);
    setBrowserRecognitionActive(false);
    setShowRestartButton(false);
    setRestartCount(0);
    audioChunksRef.current = [];
    finalTranscriptRef.current = ""; // Reset ref
    lastInterimTranscriptRef.current = ""; // Reset ref
    if (onSpeechRecognized) {
      onSpeechRecognized("");
    }
  }, [onSpeechRecognized]);

  const clearTranscriptDisplayOnly = useCallback(() => {
    setTranscriptUi("");
    setInterimTranscript("");
    // Optionally reset refs too if clear should affect next recording
    // finalTranscriptRef.current = "";
    // lastInterimTranscriptRef.current = "";
    if (onSpeechRecognized) {
      onSpeechRecognized("");
    }
  }, [onSpeechRecognized]);

  // --- Browser Speech Recognition Logic ---

  const stopBrowserRecognition = useCallback(() => {
    // Clear intervals
    if (heartbeatIntervalRef.current)
      clearInterval(heartbeatIntervalRef.current);
    if (forceRestartIntervalRef.current)
      clearInterval(forceRestartIntervalRef.current);
    heartbeatIntervalRef.current = null;
    forceRestartIntervalRef.current = null;

    // Stop recognition instance
    if (recognitionRef.current) {
      try {
        console.log("Stopping browser speech recognition...");
        recognitionRef.current.stop(); // onend should handle cleanup/ref nulling
      } catch (e) {
        console.warn("Error stopping browser recognition:", e);
        recognitionRef.current = null; // Force clear ref if stop fails
      }
    } else {
      console.log("Stop requested but no active recognition ref found.");
    }
    // Update state
    setBrowserRecognitionActive(false);
    setShowRestartButton(false);
  }, []);

  const restartBrowserSpeechRecognition = useCallback((): boolean => {
    if (!isRecordingRef.current || !USE_BROWSER_RECOGNITION) {
      console.log(
        "Skipping browser recognition restart (not recording or not applicable)."
      );
      return false;
    }

    console.log("🔄 Attempting to restart browser speech recognition");
    lastRestartTimeRef.current = Date.now();
    setRestartCount((prevCount) => {
      /* ... handle max attempts ... */ return prevCount + 1;
    });
    const restartAttemptTime = Date.now();

    // Stop existing instance cleanly first
    if (recognitionRef.current) {
      try {
        console.log("Stopping existing browser recognition before restart");
        recognitionRef.current.stop(); // Let onend clear the ref
      } catch (err) {
        console.warn("Error stopping existing browser recognition:", err);
        recognitionRef.current = null; // Force clear
      }
    }

    // Delay restart slightly
    setTimeout(() => {
      if (
        !isRecordingRef.current ||
        lastRestartTimeRef.current > restartAttemptTime
      ) {
        console.log(
          "Aborting delayed restart (recording stopped or newer restart occurred)."
        );
        return;
      }
      console.log("Executing delayed restart...");
      const success = startBrowserSpeechRecognition();
      if (success) {
        console.log("✅ Browser recognition restarted successfully.");
        setShowRestartButton(false);
      } else {
        console.error("❌ Failed to restart browser speech recognition.");
        setShowRestartButton(true);
      }
    }, 150);

    return true;
    // It's okay that startBrowserSpeechRecognition is defined later due to hoisting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [USE_BROWSER_RECOGNITION]); // Removed language as it doesn't change during restart

  // Define startBrowserSpeechRecognition before it's used in restart's timeout
  const startBrowserSpeechRecognition = useCallback((): boolean => {
    if (!USE_BROWSER_RECOGNITION || !SpeechRecognitionAPI) return false; // Check API again

    // Ensure previous intervals are cleared
    if (heartbeatIntervalRef.current)
      clearInterval(heartbeatIntervalRef.current);
    if (forceRestartIntervalRef.current)
      clearInterval(forceRestartIntervalRef.current);
    heartbeatIntervalRef.current = null;
    forceRestartIntervalRef.current = null;

    lastSpeechTimeRef.current = Date.now();

    try {
      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition; // Set ref immediately

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      console.log(
        `Attempting to start browser recognition for lang: ${language}`
      );

      recognition.onstart = () => {
        console.log("🎙️ Browser speech recognition started.");
        setBrowserRecognitionActive(true);
        setShowRestartButton(false);
        lastRestartTimeRef.current = Date.now();
        setRestartCount(0);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        lastSpeechTimeRef.current = Date.now();
        let finalTranscriptPart = "";
        let currentInterim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i]; // Individual result
          if (result && result[0]) {
            // Check if result and alternative exist
            const transcriptText = result[0].transcript;
            if (result.isFinal) {
              finalTranscriptPart += transcriptText + " ";
            } else {
              currentInterim = transcriptText;
            }
          }
        }

        setInterimTranscript(currentInterim); // Update UI state for interim
        lastInterimTranscriptRef.current = currentInterim; // Store last interim in ref

        if (finalTranscriptPart) {
          const trimmedFinalPart = finalTranscriptPart.trim();
          console.log(`Browser final part: "${trimmedFinalPart}"`); // Log new final part

          // Append to the final transcript ref
          finalTranscriptRef.current = (
            finalTranscriptRef.current
              ? finalTranscriptRef.current + " " + trimmedFinalPart
              : trimmedFinalPart
          ).trim();

          // Update UI state with the full accumulated transcript from ref
          setTranscriptUi(finalTranscriptRef.current);

          // Notify parent only of the *new* final part received in this event
          if (onSpeechRecognized) {
            onSpeechRecognized(trimmedFinalPart);
          }

          // Clear interim UI state and ref after processing final part
          setInterimTranscript("");
          lastInterimTranscriptRef.current = "";
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error(
          `Browser recognition error: ${event.error}`,
          event.message
        );
        // ... existing error handling ...
        if (event.error !== "no-speech" && event.error !== "aborted") {
          setError(`Recognition Error: ${event.error}`);
          if (isRecordingRef.current) {
            setTimeout(() => restartBrowserSpeechRecognition(), 200);
          }
        }
        setBrowserRecognitionActive(false); // Mark as inactive on error
      };

      recognition.onend = () => {
        console.log("Browser speech recognition service ended.");
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null; // Clear the ref only if it's the one that ended
        }
        setBrowserRecognitionActive(false);

        // Auto-restart if ended unexpectedly while still recording
        if (isRecordingRef.current && USE_BROWSER_RECOGNITION) {
          console.log(
            "Browser recognition ended unexpectedly, attempting auto-restart..."
          );
          setTimeout(() => {
            if (isRecordingRef.current) {
              // Double-check
              restartBrowserSpeechRecognition();
            }
          }, 50);
        }
      };

      recognition.start();
      console.log("recognition.start() called.");

      // --- Heartbeat and Forced Restart Intervals ---
      heartbeatIntervalRef.current = setInterval(() => {
        /* ... as before ... */
      }, RECOGNITION_RESTART_INTERVAL);
      forceRestartIntervalRef.current = setInterval(() => {
        /* ... as before ... */
      }, FORCE_RESTART_INTERVAL);

      return true;
    } catch (err) {
      console.error("❌ Failed to start browser speech recognition:", err);
      // ... error handling ...
      return false;
    }
    // Ensure restartBrowserSpeechRecognition is stable if included
  }, [
    language,
    USE_BROWSER_RECOGNITION,
    restartBrowserSpeechRecognition,
    onSpeechRecognized,
    SpeechRecognitionAPI
  ]);

  // --- Server Speech Recognition ---
  const processServerSpeechRecognition = useCallback(
    async (audioBlob: Blob): Promise<string> => {
      // ... unchanged server processing logic ...
      if (
        !serverLanguages.some((lang) => language.toLowerCase().startsWith(lang))
      )
        return "";
      if (audioBlob.size < 1000) return "";
      console.log(`☁️ Sending audio to server for ${language}...`);
      setProcessingServerRequest(true);
      setError(null);
      try {
        const result = await convertSpeechToText(audioBlob, language);
        return result?.transcript?.trim() ?? "";
      } catch (error) {
        console.error("☁️ Error during server STT:", error);
        setError(
          `Server Error: ${error instanceof Error ? error.message : "Failed"}`
        );
        return "";
      } finally {
        setProcessingServerRequest(false);
      }
    },
    [language, serverLanguages]
  ); // Dependencies

  // --- Media Recorder Logic ---

  const handleDataAvailable = useCallback((event: BlobEvent) => {
    if (event.data.size > 0) {
      audioChunksRef.current.push(event.data);
    }
  }, []); // No dependencies needed

  const startRecording = useCallback(async () => {
    clearStateAndRefs(); // Reset state and refs
    setIsLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const MimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg"
      ];
      const supportedMimeType = MimeTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );
      if (!supportedMimeType)
        throw new Error("No suitable audio format supported.");

      console.log(`Using MIME type: ${supportedMimeType}`);
      const recorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = handleDataAvailable;

      recorder.onstop = async () => {
        console.log("MediaRecorder stopped.");
        isRecordingRef.current = false;
        setIsRecording(false); // Update state after ref
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setIsLoading(true);

        const audioBlob = new Blob(audioChunksRef.current, {
          type: supportedMimeType
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        console.log(
          `Final audio blob: Size=${audioBlob.size}, Type=${audioBlob.type}`
        );

        let finalTranscriptResult = "";

        // Decide transcript source
        if (
          serverLanguages.some((lang) =>
            language.toLowerCase().startsWith(lang)
          )
        ) {
          finalTranscriptResult = await processServerSpeechRecognition(
            audioBlob
          );
          setTranscriptUi(finalTranscriptResult); // Update UI display state
        } else if (USE_BROWSER_RECOGNITION) {
          // Use accumulated transcript from refs
          finalTranscriptResult = (
            finalTranscriptRef.current +
            " " +
            lastInterimTranscriptRef.current
          ).trim();
          console.log(
            `✅ Final Transcript from refs: "${finalTranscriptResult}"`
          );
          // Sync UI state just in case
          setTranscriptUi(finalTranscriptRef.current);
          setInterimTranscript(lastInterimTranscriptRef.current); // Show last interim briefly
        } else {
          finalTranscriptResult = ""; // No recognition used
          setTranscriptUi("");
          setInterimTranscript("");
        }

        console.log(
          `--> Passing to onAudioRecorded: "${finalTranscriptResult}"`
        );
        onAudioRecorded(audioBlob, finalTranscriptResult); // Pass reliable transcript

        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null; // Clear recorder ref
        setIsLoading(false);
        setTimeout(() => setInterimTranscript(""), 150); // Clear interim display after a short delay
      };

      recorder.start(1000); // Chunks every second
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(
        () => setRecordingTime((prev) => prev + 1),
        1000
      );

      if (USE_BROWSER_RECOGNITION) {
        startBrowserSpeechRecognition();
      } else {
        console.log("Browser STT not used/supported for this configuration.");
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError(
        `Start Recording Failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      // Cleanup on start error
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
      stopBrowserRecognition();
      clearStateAndRefs(); // Ensure state/refs are reset on failure
    }
    // Include all stable functions/variables needed
  }, [
    clearStateAndRefs,
    handleDataAvailable,
    language,
    USE_BROWSER_RECOGNITION,
    startBrowserSpeechRecognition,
    serverLanguages,
    processServerSpeechRecognition,
    onAudioRecorded,
    stopBrowserRecognition
  ]);

  const stopRecording = useCallback(() => {
    console.log("Stop recording requested...");
    // Stop browser recognition *first* to prevent potential race conditions with onstop
    if (USE_BROWSER_RECOGNITION) {
      stopBrowserRecognition();
    }
    // Then stop the recorder
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop(); // onstop handler does the rest
    } else {
      console.log("MediaRecorder not recording or already stopped.");
      // Manually update state if recorder wasn't active
      isRecordingRef.current = false;
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setIsLoading(false);
    }
  }, [USE_BROWSER_RECOGNITION, stopBrowserRecognition]);

  const manuallyRestartBrowserRecognition = useCallback(() => {
    if (!isRecordingRef.current || !USE_BROWSER_RECOGNITION) return;
    console.log("Manual browser recognition restart triggered.");
    setShowRestartButton(false);
    restartBrowserSpeechRecognition(); // Call the restart function
  }, [USE_BROWSER_RECOGNITION, restartBrowserSpeechRecognition]);

  // --- Effects ---

  // Auto-scroll transcript container
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop =
        transcriptContainerRef.current.scrollHeight;
    }
    // Depend on the UI state variables
  }, [transcriptUi, interimTranscript]);

  // Cleanup on unmount
  useEffect(() => {
    // Capture refs in effect scope
    const currentTimerRef = timerRef.current;
    const currentAudioURL = audioURL;
    const currentMediaRecorder = mediaRecorderRef.current;

    return () => {
      console.log("SimpleVoiceRecorder unmounting: Cleaning up...");
      if (currentTimerRef) clearInterval(currentTimerRef);
      stopBrowserRecognition(); // Ensure recognition stops and intervals clear
      if (currentMediaRecorder) {
        if (currentMediaRecorder.state === "recording") {
          currentMediaRecorder.stop();
        }
        currentMediaRecorder.stream
          ?.getTracks()
          .forEach((track) => track.stop());
      }
      if (currentAudioURL) {
        URL.revokeObjectURL(currentAudioURL);
      }
    };
    // audioURL needs to be dependency if revoke is needed
    // stopBrowserRecognition is stable due to useCallback
  }, [audioURL, stopBrowserRecognition]);

  // Max recording time limit
  useEffect(() => {
    let maxTimeTimeout: ReturnType<typeof setTimeout> | null = null;
    if (isRecording) {
      maxTimeTimeout = setTimeout(() => {
        if (isRecordingRef.current) {
          console.warn(
            `Max recording time (${MAX_RECORDING_TIME_SECONDS}s) reached. Stopping.`
          );
          setError(
            `Max recording time (${formatTime(
              MAX_RECORDING_TIME_SECONDS
            )}) reached.`
          );
          stopRecording(); // Use the useCallback version
        }
      }, MAX_RECORDING_TIME_SECONDS * 1000);
    }
    return () => {
      if (maxTimeTimeout) clearTimeout(maxTimeTimeout);
    };
  }, [isRecording, stopRecording]); // Add stopRecording dependency

  // Visibility change handler
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
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [USE_BROWSER_RECOGNITION, restartBrowserSpeechRecognition]);

  // --- Render ---
  return (
    <Paper
      elevation={2}
      sx={
        {
          /* ... styles ... */
        }
      }
    >
      {/* Header / Controls */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
      >
        <Button
          variant="contained"
          color={isRecording ? "error" : "primary"}
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
          disabled={disabled || (isLoading && isRecording)}
          sx={{ minWidth: isMobile ? "120px" : "160px", order: 1 }}
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
            {" "}
            Restart Mic ({restartCount}){" "}
          </Button>
        )}

        {(transcriptUi || interimTranscript) && !isRecording && (
          <IconButton
            onClick={clearTranscriptDisplayOnly}
            size="small"
            aria-label="Clear Transcript"
            title="Clear Transcript"
            sx={{ order: 3 }}
            disabled={isLoading}
          >
            <Clear />
          </IconButton>
        )}

        {audioURL && !isRecording && !isLoading && (
          <Box
            sx={{ order: 4, ml: "auto", display: "flex", alignItems: "center" }}
          >
            <audio
              src={audioURL}
              controls
              style={{ maxWidth: "200px", height: "35px" }}
            />
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
        transcriptUi ||
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
            minHeight: "100px",
            maxHeight: "300px",
            overflowY: "auto",
            bgcolor: "background.default",
            position: "relative",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            display: "flex",
            flexDirection: "column",
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
              {/* Server Processing Status */}
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
          <Box sx={{ flexGrow: 1, minHeight: "1.5em" }}>
            {transcriptUi ? (
              <Typography variant="body1" component="div">
                {transcriptUi}
              </Typography>
            ) : null}
            {interimTranscript ? (
              <Typography
                variant="body2"
                component="div"
                sx={{
                  color: "text.secondary",
                  fontStyle: "italic",
                  mt: transcriptUi ? 0.5 : 0
                }}
              >
                {interimTranscript}
              </Typography>
            ) : null}
            {!transcriptUi && !interimTranscript && isRecording && (
              <Typography
                variant="body2"
                sx={{ color: "text.disabled", fontStyle: "italic" }}
              >
                {USE_BROWSER_RECOGNITION
                  ? "Listening..."
                  : "Recording audio..."}
              </Typography>
            )}
            {!transcriptUi &&
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
          {/* <<< This is where the inner Box ends */}
        </Box>
        // <<< This is where the outer conditional Box should end
      )}
      {/* --- Transcript Area END --- */}
    </Paper> // <<< This is the main closing Paper tag
  );
};

export default SimpleVoiceRecorder;
