import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  IconButton
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import ClearIcon from "@mui/icons-material/Clear";
import {
  convertSpeechToText,
  isPythonServerRunning
  // SpeechToTextResult is used through the convertSpeechToText return type
} from "../services/SpeechService";
import { LANGUAGE_CONFIG } from "../services/SpeechService";

// Add types for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: Record<string, unknown>;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

// Interface for the Speech Recognition API
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

// Declare the global SpeechRecognition constructor
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
    voiceRecorderServerChecked?: boolean;
    webkitAudioContext: typeof AudioContext;
  }
}

interface VoiceRecorderProps {
  onAudioRecorded: (audioBlob: Blob, browserTranscript: string) => void;
  onSpeechRecognized?: (transcript: string) => void;
  language: string;
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onAudioRecorded,
  onSpeechRecognized,
  language,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [_audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [browserTranscript, setBrowserTranscript] = useState<string>("");
  const [useFallback, setUseFallback] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [waitingForResponse, setWaitingForResponse] = useState<boolean>(false);
  const [languageSupport, setLanguageSupport] = useState<{
    hasBrowserSupport: boolean;
    usesWhisper: boolean;
  }>({ hasBrowserSupport: true, usesWhisper: false });
  const [serverRunning, setServerRunning] = useState<boolean | null>(null);
  const [serverTranscript, setServerTranscript] = useState<string>("");
  const [isProcessingServerChunks, setIsProcessingServerChunks] =
    useState(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [_transcript_ref, _setTranscript_ref] = useState<string>("");
  const [_isCoolingDown_ref, _setIsCoolingDown_ref] = useState<boolean>(false);
  const [_isProcessingFinnish_ref, _setIsProcessingFinnish_ref] =
    useState<boolean>(false);
  const [_finnishAudioChunks_ref, _setFinnishAudioChunks_ref] = useState<
    Blob[]
  >([]);
  const [silenceDetectionEnabled] = useState<boolean>(false); // Default to false since we're not implementing it
  const [recognitionEnded, setRecognitionEnded] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null); // Properly typed
  const fullTranscriptRef = useRef<string>(""); // Store complete transcript that won't be affected by re-renders
  const lastRecognitionRestartRef = useRef<number>(0); // Track last restart time to prevent too many restarts

  const processingTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Add WebSocket support for real-time Finnish transcription
  const [_wsConnection_ref, _setWsConnection_ref] = useState<WebSocket | null>(
    null
  );

  // Reference to store the WebSocket connection
  const wsConnectionRef = useRef<WebSocket | null>(null);

  // Function to set the WebSocket connection safely
  const setWsConnection = (ws: WebSocket | null) => {
    wsConnectionRef.current = ws;
    _setWsConnection_ref(ws);
  };

  // Add a dedicated timer reference for periodic transcription
  const transcriptionTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Add variables for speech detection
  const [hasSpeech_ref, setHasSpeech_ref] = useState<boolean>(false);
  const lastSpeechTimestampRef_ref = useRef<number>(0);
  const silenceThresholdRef_ref = useRef<number>(1500); // 1.5 seconds of silence threshold
  const audioAnalyserRef_ref = useRef<AnalyserNode | null>(null);
  const audioContextRef_ref = useRef<AudioContext | null>(null);

  // Add variables to track transcription progress
  const [processingTranscript, setProcessingTranscript] =
    useState<boolean>(false);

  // Add variables for speech processing optimization
  const minProcessingIntervalRef_ref = useRef<number>(800); // Minimum time between API calls in ms
  const lastProcessingTimeRef_ref = useRef<number>(0);

  // Add tracking for consecutive speech frames to avoid sporadic noise
  const consecutiveSpeechFramesRef_ref = useRef<number>(0);
  const REQUIRED_CONSECUTIVE_FRAMES_ref = 5; // Require 5 consecutive frames of speech (250ms at 50ms intervals)
  const MIN_SPEECH_DURATION_MS_ref = 500; // Minimum 500ms of speech before processing
  const speechStartTimeRef_ref = useRef<number>(0);

  // Add reference for API call lock and content comparison
  const lastProcessedContentRef_ref = useRef<string>("");
  const lastAudioSizeRef_ref = useRef<number>(0);
  const emptyCallCountRef_ref = useRef<number>(0);

  // Add a retry counter for WebSocket connection attempts
  const _wsRetryCountRef_ref = useRef<number>(0);
  const _MAX_WS_RETRY_ATTEMPTS_ref = 3;

  // Re-add the necessary references that were removed
  const processingTranscriptRef = useRef<boolean>(false);
  const setProcessingTranscriptRef_ref = useCallback((value: boolean) => {
    processingTranscriptRef.current = value;
    setProcessingTranscript(value); // Also update the state for UI
  }, []);

  // Helper function to write a string to a DataView
  const writeString = useCallback(
    (view: DataView, offset: number, string: string): void => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    },
    []
  );

  // Define the audioBufferToWav function with useCallback to prevent it changing on every render
  const audioBufferToWav = useCallback(
    (buffer: AudioBuffer): Blob => {
      const numChannels = buffer.numberOfChannels;
      const sampleRate = buffer.sampleRate;
      const length = buffer.length;
      const bitDepth = 16; // 16-bit audio

      // Calculate data sizes
      const dataSize = length * numChannels * (bitDepth / 8);
      const headerSize = 44; // Standard WAV header size
      const totalSize = headerSize + dataSize;

      // Create a buffer to hold the WAV file
      const arrayBuffer = new ArrayBuffer(totalSize);
      const view = new DataView(arrayBuffer);

      // Write the WAV header
      // "RIFF" chunk descriptor
      writeString(view, 0, "RIFF");
      view.setUint32(4, totalSize - 8, true);
      writeString(view, 8, "WAVE");

      // "fmt " sub-chunk
      writeString(view, 12, "fmt ");
      view.setUint32(16, 16, true); // fmt chunk size
      view.setUint16(20, 1, true); // PCM format
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true); // Byte rate
      view.setUint16(32, numChannels * (bitDepth / 8), true); // Block align
      view.setUint16(34, bitDepth, true);

      // "data" sub-chunk
      writeString(view, 36, "data");
      view.setUint32(40, dataSize, true);

      // Write the audio data
      const volume = 1;
      let offset = 44;

      for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
          // Get the sample from the channel
          let sample = buffer.getChannelData(channel)[i];

          // Clamp the value to the range of -1 to 1
          sample = Math.max(-1, Math.min(1, sample));

          // Apply volume
          sample = sample * volume;

          // Convert to 16-bit sample
          const sample16 = Math.round(
            sample < 0 ? sample * 32768 : sample * 32767
          );

          // Write the sample
          view.setInt16(offset, sample16, true);
          offset += 2;
        }
      }

      return new Blob([view], { type: "audio/wav" });
    },
    [writeString]
  );

  // Function to convert audio blob to WAV format
  const convertToWav = useCallback(
    async (audioBlob: Blob): Promise<Blob> => {
      // If the blob is already a WAV, just return it
      if (audioBlob.type === "audio/wav") {
        return audioBlob;
      }

      console.log(
        `Converting audio from ${audioBlob.type} to WAV format, size: ${audioBlob.size} bytes`
      );

      // Skip conversion for very small chunks as they might not contain enough data
      if (audioBlob.size < 1000) {
        console.log("Audio chunk too small, skipping conversion");
        return audioBlob;
      }

      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();

      return new Promise<Blob>((resolve) => {
        // Create a file reader to read the blob
        const fileReader = new FileReader();

        fileReader.onload = async (event) => {
          if (!event.target) {
            console.error("File reader event target is null");
            resolve(audioBlob); // Fallback to original blob
            return;
          }

          const arrayBuffer = event.target.result as ArrayBuffer;

          try {
            // Decode the audio data
            const audioBuffer = await audioContext
              .decodeAudioData(arrayBuffer)
              .catch((err) => {
                console.error("Error in decodeAudioData:", err);
                throw err;
              });

            // Convert to WAV
            const wavBlob = audioBufferToWav(audioBuffer);
            console.log(`WAV conversion successful: ${wavBlob.size} bytes`);
            resolve(wavBlob);
          } catch (error) {
            console.error("Error decoding audio data:", error);

            // If the audio can't be decoded, try to use the original blob
            // This is better than failing completely
            console.log("Using original audio blob as fallback");

            // Try to create a new blob with explicit audio MIME type
            try {
              const fallbackBlob = new Blob([arrayBuffer], {
                type: "audio/webm"
              });
              resolve(fallbackBlob);
            } catch (fallbackError) {
              console.error("Error creating fallback blob:", fallbackError);
              // Last resort, return the original blob
              resolve(audioBlob);
            }
          }
        };

        fileReader.onerror = () => {
          console.error("Error reading audio blob");
          // Fallback to original blob
          resolve(audioBlob);
        };

        // Read the blob as an array buffer
        fileReader.readAsArrayBuffer(audioBlob);
      });
    },
    [audioBufferToWav]
  );

  // Check language support
  useEffect(() => {
    // Check if this language is supported by browser speech recognition
    const checkLanguageSupport = () => {
      // Get language configuration
      const langConfig =
        LANGUAGE_CONFIG[language as keyof typeof LANGUAGE_CONFIG];

      // Default assumption
      let hasBrowserSupport = true;
      let usesWhisper = false;

      if (langConfig) {
        // Finnish primarily uses Whisper and doesn't have good browser support
        if (language.toLowerCase().includes("fi")) {
          hasBrowserSupport = false;
          usesWhisper = true;
          console.log("🎤 Finnish language detected, using Whisper for STT");
          // For Finnish, immediately set to use fallback without trying Web Speech API
          setUseFallback(true);
        } else {
          hasBrowserSupport = langConfig.sttTechnologies.includes("browser");
          usesWhisper = langConfig.sttTechnologies.includes("whisper");
        }
      }

      setLanguageSupport({ hasBrowserSupport, usesWhisper });

      // If no browser support, force fallback mode
      if (!hasBrowserSupport) {
        setUseFallback(true);
        console.log(
          `🎤 Browser speech recognition not supported for ${language}, using fallback`
        );
      }
    };

    checkLanguageSupport();

    // When language changes, reset transcripts
    setBrowserTranscript("");
    fullTranscriptRef.current = "";

    // Also reset waiting state when language changes
    setWaitingForResponse(false);
  }, [language]);

  // Check for Whisper server when Finnish is selected
  useEffect(() => {
    // Use a module-level static variable to track if we've already checked
    if (!window.voiceRecorderServerChecked) {
      const checkServerStatus = async () => {
        if (language === "fi-FI" || languageSupport.usesWhisper) {
          // Add a delay before checking server status to ensure UI is responsive
          setTimeout(async () => {
            try {
              // HACK: Force serverRunning to true as we know the server is running
              // Remove this line once the health check is working properly
              setServerRunning(true);

              const isRunning = await isPythonServerRunning();

              // Only update if the check returns false and we're not forcing it
              if (!isRunning) {
                console.warn(
                  "🎤 Whisper server check failed, but we know it's running"
                );
                // Don't update serverRunning here since we forced it true above
              } else {
                // Reset any error messages when server is detected
                if (
                  browserTranscript &&
                  browserTranscript.includes(
                    "Warning: Whisper server is not running"
                  )
                ) {
                  setBrowserTranscript("");
                }
              }
            } catch (error) {
              console.error("Error checking server status:", error);
              // Don't set serverRunning to false since we know it's running
            }

            // Mark that we've completed the server check
            window.voiceRecorderServerChecked = true;
          }, 1000);
        }
      };

      checkServerStatus();

      // No periodic check anymore - we only check once
    }
  }, [language, languageSupport.usesWhisper, browserTranscript]);

  // Add an effect to initialize speech recognition when needed
  useEffect(() => {
    // Initialize speech recognition
    if (!isInitialized && !initializing) {
      setInitializing(true);

      // Check if speech recognition is available
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          console.log("Initializing speech recognition");

          // Create the recognition object
          recognitionRef.current = new SpeechRecognition();

          // Configure for continuous speech recognition
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;

          // Try to set maxAlternatives if supported (this is not standard in all browsers)
          try {
            // Create a properly typed interface extension for our specific use
            interface ExtendedSpeechRecognition extends SpeechRecognition {
              maxAlternatives?: number;
            }

            // Cast to our extended interface and set the property
            (
              recognitionRef.current as ExtendedSpeechRecognition
            ).maxAlternatives = 3;
          } catch {
            console.log("maxAlternatives not supported in this browser");
          }

          recognitionRef.current.lang = language;

          console.log("Speech recognition created with language:", language);

          // Set up handlers
          recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            console.log(
              "Speech recognition result received:",
              event.results.length,
              "results"
            );

            const transcript = Array.from(event.results)
              .map((result) => result[0].transcript)
              .join(" ");

            console.log("Recognition result:", transcript);

            fullTranscriptRef.current = transcript;
            setBrowserTranscript(transcript);

            if (onSpeechRecognized) {
              onSpeechRecognized(transcript);
            }
          };

          recognitionRef.current.onerror = (event: SpeechRecognitionError) => {
            console.error(
              "Speech recognition error:",
              event.error,
              event.message
            );

            // Don't set this as an error for the user, just log it
            if (event.error !== "no-speech") {
              setError(`Speech recognition error: ${event.error}`);
            }
          };

          recognitionRef.current.onend = () => {
            console.log("Browser Speech Recognition Ended");
            setRecognitionEnded(true);
          };

          // Add optional event handlers if supported by the browser
          try {
            // Add event listeners for non-standard events using addEventListener
            if ("addEventListener" in recognitionRef.current) {
              (recognitionRef.current as EventTarget).addEventListener(
                "start",
                () => {
                  console.log("Speech recognition started");
                  setRecognitionEnded(false);
                }
              );

              (recognitionRef.current as EventTarget).addEventListener(
                "soundstart",
                () => {
                  console.log("Speech recognition detected sound");
                }
              );

              (recognitionRef.current as EventTarget).addEventListener(
                "speechstart",
                () => {
                  console.log("Speech recognition detected speech");
                }
              );
            }
          } catch {
            console.log(
              "Some speech recognition events not supported in this browser"
            );
          }

          setIsInitialized(true);
          console.log("Speech recognition initialized successfully");
        } catch (error) {
          console.error("Error initializing speech recognition:", error);
          setUseFallback(true);
        }
      } else {
        // Browser doesn't support speech recognition
        setUseFallback(true);
        console.log("Speech recognition not available in this browser");
      }

      setInitializing(false);
    }
  }, [isInitialized, initializing, language, onSpeechRecognized]);

  // Update speech recognition based on recording state
  useEffect(() => {
    // Skip Web Speech API completely for Finnish
    if (language.toLowerCase().includes("fi")) {
      return;
    }

    if (!recognitionRef.current) return;

    // Only start speech recognition if we're recording, not disabled, and not waiting
    if (isRecording && !disabled && !waitingForResponse && !useFallback) {
      try {
        // Set the current language
        recognitionRef.current.lang = language;

        // Check if recognition is already running before trying to start it
        try {
          // First stop it to ensure a clean state
          recognitionRef.current.stop();

          // Add a small delay before starting to ensure it's properly stopped
          setTimeout(() => {
            if (
              isRecording &&
              !disabled &&
              !waitingForResponse &&
              !useFallback &&
              recognitionRef.current
            ) {
              console.log("🎤 Starting speech recognition");
              recognitionRef.current.start();
            }
          }, 300);
        } catch (e) {
          console.warn("Could not stop/start speech recognition:", e);
          // Try to recover by recreating the recognition object
          try {
            const SpeechRecognition =
              window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = language;

            // Wait a bit and then try to start it again
            setTimeout(() => {
              if (recognitionRef.current && isRecording) {
                recognitionRef.current.start();
              }
            }, 500);
          } catch (recreateError) {
            console.error(
              "Failed to recreate speech recognition:",
              recreateError
            );
            setUseFallback(true);
          }
        }
      } catch (e) {
        console.warn("Could not start speech recognition:", e);
        setUseFallback(true);
      }
    } else {
      // Stop recognition when not recording or when disabled
      try {
        console.log("🎤 Stopping speech recognition");
        recognitionRef.current.stop();
      } catch {
        // Ignore errors when stopping
      }
    }

    // Clean up function to stop recognition when component changes
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore, might not be started
        }
      }
    };
  }, [isRecording, disabled, waitingForResponse, useFallback, language]);

  // Update speech recognition language when language prop changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  // Add a counter to keep track of consecutive no-speech errors
  const noSpeechErrorCountRef = useRef<number>(0);

  // Add effect to restart speech recognition if it ends while still recording
  useEffect(() => {
    // Skip restart for Finnish which uses server-side recognition
    if (
      language === "fi-FI" ||
      useFallback ||
      !recognitionEnded ||
      !isRecording
    ) {
      return;
    }

    // Prevent too many restarts in a short period (throttle to once per second)
    const now = Date.now();
    if (now - lastRecognitionRestartRef.current < 1000) {
      return;
    }
    lastRecognitionRestartRef.current = now;

    console.log(
      "🎤 Speech recognition ended while recording, automatically restarting"
    );

    // Function to restart speech recognition
    const startSpeechRecognition = () => {
      // Completely recreate the recognition instance to avoid getting stuck
      try {
        // Get speech recognition constructor
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        // Store the current transcript before restarting
        const existingTranscript = fullTranscriptRef.current;
        const existingBrowserTranscript = browserTranscript;

        // Stop the existing recognition if it exists
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {
            // Ignore errors when stopping
          }
        }

        // Create a new instance
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = language;

        // Set up event handlers
        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          // Get only the new content from current recognition session
          const currentSessionTranscript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join(" ");

          // Combine with previous transcript, ensuring we don't duplicate content
          // Only append if we have new content to avoid duplicating the last word
          if (currentSessionTranscript.trim()) {
            // If the transcript has changed significantly, append it
            const combinedTranscript = existingTranscript
              ? `${existingTranscript} ${currentSessionTranscript}`
              : currentSessionTranscript;

            fullTranscriptRef.current = combinedTranscript;
            setBrowserTranscript(combinedTranscript);
          } else {
            // If no new content, just keep the existing transcript
            fullTranscriptRef.current = existingTranscript;
            setBrowserTranscript(existingBrowserTranscript);
          }

          // Reset no-speech error counter when we get a result
          noSpeechErrorCountRef.current = 0;

          if (onSpeechRecognized) {
            onSpeechRecognized(fullTranscriptRef.current);
          }
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionError) => {
          console.error(
            "Speech recognition error:",
            event.error,
            event.message
          );

          // Track consecutive no-speech errors
          if (event.error === "no-speech") {
            noSpeechErrorCountRef.current++;

            // If we've had too many consecutive no-speech errors, try to reset the system
            if (noSpeechErrorCountRef.current > 3) {
              console.log(
                "🎤 Multiple no-speech errors, trying to reset audio system"
              );
              // This will trigger a clean restart through the recognitionEnded state
              if (recognitionRef.current) {
                recognitionRef.current.stop();
              }
            }
          } else {
            // Don't set this as an error for the user, just log it
            setError(`Speech recognition error: ${event.error}`);
          }
        };

        recognitionRef.current.onend = () => {
          console.log("Browser Speech Recognition Ended");
          setRecognitionEnded(true);
        };

        // Start the new recognition instance
        recognitionRef.current.start();
        setRecognitionEnded(false);
        console.log(
          "🎤 Successfully restarted speech recognition with new instance"
        );
      } catch (error) {
        console.error("Failed to restart speech recognition:", error);

        // If we can't restart recognition, may need to fall back to server-side processing
        if (languageSupport.usesWhisper) {
          console.log("🎤 Falling back to Whisper for continued processing");
          setUseFallback(true);
        }
      }
    };

    // Add a small delay before restarting
    const restartTimer = setTimeout(() => {
      startSpeechRecognition();
    }, 300);

    // Clean up timer on unmount or when dependencies change
    return () => {
      clearTimeout(restartTimer);
    };
  }, [
    recognitionEnded,
    isRecording,
    language,
    useFallback,
    languageSupport.usesWhisper,
    onSpeechRecognized,
    browserTranscript
  ]);

  // Fix the dependencies in the useEffect for processFinnishChunks timer
  useEffect(() => {
    // Only for Finnish and only when recording
    if (!language.toLowerCase().includes("fi") || !isRecording) {
      return;
    }

    // If WebSocket is connected and active, don't use the HTTP API
    if (
      wsConnectionRef.current &&
      wsConnectionRef.current.readyState === WebSocket.OPEN
    ) {
      console.log("WebSocket active for Finnish, skipping HTTP API processing");
      return;
    }

    console.log("Setting up HTTP API fallback for Finnish transcription");

    // Clear any existing timer
    if (processingTimerRef.current) {
      clearInterval(processingTimerRef.current);
    }

    // Set up timer to process chunks more frequently (every 1 second)
    processingTimerRef.current = setInterval(() => {
      if (
        audioChunksRef.current.length > 0 &&
        !isProcessingServerChunks &&
        processFinnishChunksRef.current
      ) {
        processFinnishChunksRef.current();
      }
    }, 1000); // Reduced from 2000ms to 1000ms for more responsive experience

    // Clean up timer
    return () => {
      if (processingTimerRef.current) {
        clearInterval(processingTimerRef.current);
        processingTimerRef.current = null;
      }
    };
  }, [language, isRecording, isProcessingServerChunks, wsConnectionRef]);

  // Fix the dependencies in the useEffect for server health tracking
  useEffect(() => {
    // Only for Finnish recording
    if (!language.toLowerCase().includes("fi") || !isRecording) {
      return;
    }

    // Track successful and failed requests to determine server health
    const serverHealthTracker = {
      lastSuccessTime: Date.now(),
      failureCount: 0,
      currentInterval: 1000, // Start with 1 second interval
      maxInterval: 5000, // Maximum 5 second interval when server is stressed

      // Function to adjust the request frequency based on server health
      checkServerHealth: () => {
        // If we've had consecutive failures, implement exponential backoff
        if (serverHealthTracker.failureCount > 0) {
          // Calculate new interval with exponential backoff (up to maxInterval)
          const newInterval = Math.min(
            serverHealthTracker.maxInterval,
            1000 * Math.pow(1.5, Math.min(serverHealthTracker.failureCount, 5))
          );

          if (newInterval !== serverHealthTracker.currentInterval) {
            serverHealthTracker.currentInterval = newInterval;

            // Update the processing timer with the new interval
            if (processingTimerRef.current) {
              clearInterval(processingTimerRef.current);
              processingTimerRef.current = setInterval(() => {
                if (
                  audioChunksRef.current.length > 0 &&
                  !isProcessingServerChunks &&
                  processFinnishChunksRef.current
                ) {
                  processFinnishChunksRef.current();
                }
              }, serverHealthTracker.currentInterval);

              console.log(
                `🎤 Server health issues detected, adjusting request frequency to ${serverHealthTracker.currentInterval}ms`
              );
            }
          }
        } else if (
          serverHealthTracker.failureCount === 0 &&
          serverHealthTracker.currentInterval > 1000
        ) {
          // If server is healthy again, gradually reduce the interval
          const newInterval = Math.max(
            1000,
            serverHealthTracker.currentInterval / 1.5
          );

          if (newInterval !== serverHealthTracker.currentInterval) {
            serverHealthTracker.currentInterval = newInterval;

            // Update the processing timer with the new interval
            if (processingTimerRef.current) {
              clearInterval(processingTimerRef.current);
              processingTimerRef.current = setInterval(() => {
                if (
                  audioChunksRef.current.length > 0 &&
                  !isProcessingServerChunks &&
                  processFinnishChunksRef.current
                ) {
                  processFinnishChunksRef.current();
                }
              }, serverHealthTracker.currentInterval);

              console.log(
                `🎤 Server appears to be recovering, adjusting request frequency to ${serverHealthTracker.currentInterval}ms`
              );
            }
          }
        }
      }
    };

    // Subscribe to serverTranscript changes to track success/failure
    const watchServerTranscript = () => {
      if (
        serverTranscript &&
        serverTranscript.trim() &&
        !serverTranscript.includes("Whisper-palvelin ei ole käytettävissä")
      ) {
        // Server responded successfully
        serverHealthTracker.lastSuccessTime = Date.now();
        serverHealthTracker.failureCount = 0;
        serverHealthTracker.checkServerHealth(); // Might reduce interval if was previously increased
      } else if (
        serverTranscript &&
        serverTranscript.includes("Whisper-palvelin ei ole käytettävissä")
      ) {
        // Server failed to respond
        serverHealthTracker.failureCount++;
        serverHealthTracker.checkServerHealth();
      }
    };

    // Watch for transcript changes
    watchServerTranscript();

    // Return cleanup function
    return () => {
      // Clean up any timers if needed
    };
  }, [language, isRecording, serverTranscript, isProcessingServerChunks]);

  // Add necessary refs for Finnish transcription if needed
  // Make sure this is defined before the function that uses it
  const processFinnishChunksRef = useRef<(() => Promise<void>) | null>(null);

  // Define the processFinnishChunks function using useCallback
  const processFinnishChunks = useCallback(async () => {
    if (!isRecording || processingTranscriptRef.current) return;

    // Get chunks to process
    const chunks = audioChunksRef.current;
    if (chunks.length === 0) {
      console.log("No audio chunks to process");
      return;
    }

    // Try to process the chunks
    try {
      setIsProcessingServerChunks(true);
      setProcessingTranscriptRef_ref(true);

      // Get the MIME type from the MediaRecorder
      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";

      // Combine the blobs - use only recent chunks to keep processing time reasonable
      const chunksToProcess = chunks.slice(-2); // Use last 2 chunks
      const combinedBlob = new Blob(chunksToProcess, { type: mimeType });

      console.log(`Processing audio with language: ${language}`);

      // Skip the WAV conversion for WebSocket streaming which uses direct WebM
      let blobToProcess = combinedBlob;

      // Only convert to WAV for HTTP API requests, not for WebSocket
      if (
        !wsConnectionRef.current ||
        wsConnectionRef.current.readyState !== WebSocket.OPEN
      ) {
        try {
          // Convert to WAV if needed
          blobToProcess = await convertToWav(combinedBlob);
        } catch (conversionError) {
          console.error(
            "Error converting to WAV, using original blob",
            conversionError
          );
          // Continue with original blob if conversion fails
          blobToProcess = combinedBlob;
        }
      }

      // Process the combined blob with the correct language
      const result = await convertSpeechToText(blobToProcess, language);

      if (result && result.transcript) {
        // Update the server transcript
        setServerTranscript((prev) => {
          // Only update if there's significant new content
          if (result.transcript && result.transcript.length > prev.length) {
            return result.transcript;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error processing Finnish chunks:", error);
      // Don't display error to user for every transcription attempt
    } finally {
      setIsProcessingServerChunks(false);
      setProcessingTranscriptRef_ref(false);
    }
  }, [
    isRecording,
    convertToWav,
    setProcessingTranscriptRef_ref,
    setIsProcessingServerChunks,
    setServerTranscript,
    language
  ]);

  // Assign the processFinnishChunks function to the ref after it's defined
  useEffect(() => {
    processFinnishChunksRef.current = processFinnishChunks;
  }, [processFinnishChunks]);

  // Format a time value in seconds to a MM:SS display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Add the initializeRecording function
  const initializeRecording = async () => {
    if (initializing) return;

    try {
      setInitializing(true);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Clean up immediately
      stream.getTracks().forEach((track) => track.stop());

      // Mark as initialized
      setIsInitialized(true);
      setInitializing(false);

      // Check if server is running for Finnish
      if (language.toLowerCase().includes("fi")) {
        isPythonServerRunning().then((running) => {
          setServerRunning(running);
        });
      }
    } catch (error) {
      console.error("Error initializing recording:", error);
      setInitializing(false);
      setBrowserTranscript(
        "Could not access microphone. Please check browser permissions."
      );
    }
  };

  // Add the startRecording function
  const startRecording = async () => {
    if (mediaRecorderRef.current || isRecording) {
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      console.log(`Starting recording for language: ${language}`);

      // Define audio constraints for better quality and compatibility
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        // Set reasonable audio settings to ensure compatibility
        channelCount: 1,
        sampleRate: 44100,
        sampleSize: 16
      };

      // Try to get the audio stream with more detailed logs
      console.log(
        "Attempting to access microphone with constraints:",
        audioConstraints
      );
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints
      });

      // Log successful access to microphone
      console.log(
        "Successfully accessed microphone. Tracks:",
        stream.getAudioTracks().length
      );
      const track = stream.getAudioTracks()[0];
      if (track) {
        console.log("Audio track settings:", track.getSettings());
        console.log("Audio track constraints:", track.getConstraints());
        console.log("Audio track ID:", track.id);
        console.log("Audio track label:", track.label);
        console.log("Audio track enabled:", track.enabled);
        console.log("Audio track muted:", track.muted);
        console.log("Audio track readyState:", track.readyState);
      }

      // Use a more compatible MIME type if available
      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
        console.log("Using opus codec for better audio quality");
      }

      // Initialize MediaRecorder with better settings
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000 // Higher bitrate for better quality
      });

      console.log("MediaRecorder created with mime type:", mimeType);
      console.log("MediaRecorder state:", mediaRecorderRef.current.state);

      // Reset audio chunks
      audioChunksRef.current = [];

      // Handle data availability
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(
            `Received audio chunk: ${event.data.size} bytes, type: ${event.data.type}`
          );
          audioChunksRef.current.push(event.data);
        } else {
          console.warn("Received empty audio chunk");
        }
      };

      // Handle recording stop
      mediaRecorderRef.current.onstop = async () => {
        console.log(
          `Recording stopped with ${audioChunksRef.current.length} chunks collected`
        );
        // Create a blob from all chunks
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorderRef.current?.mimeType || "audio/webm"
        });

        console.log(
          `Final audio size: ${audioBlob.size} bytes, type: ${audioBlob.type}`
        );

        // Create an object URL for the audio
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        // Send the audio and transcript to the parent component
        const finalTranscript = fullTranscriptRef.current.trim();
        console.log(`Sending final transcript: "${finalTranscript}"`);
        onAudioRecorded(audioBlob, finalTranscript);

        // Clean up
        stream.getTracks().forEach((track) => track.stop());
        setWaitingForResponse(false);
      };

      // Listen for errors
      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setError(`MediaRecorder error: ${event.error}`);
      };

      // Start the media recorder
      mediaRecorderRef.current.start(1000); // Collect chunks every second
      console.log("MediaRecorder started");

      // Start the timer
      const startTime = Date.now();

      // Update timer every second
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingTime(elapsed);

        // Also check for silence during recording
        if (silenceDetectionEnabled && elapsed > 2) {
          detectSilence();
        }

        // Log audio status every 5 seconds for debugging
        if (elapsed % 5 === 0) {
          console.log(
            `Recording in progress, ${elapsed}s elapsed, ${audioChunksRef.current.length} chunks collected`
          );
          if (mediaRecorderRef.current) {
            console.log("MediaRecorder state:", mediaRecorderRef.current.state);
          }
        }
      }, 1000);

      // Set recording state
      setIsRecording(true);

      // Also ensure we start with fresh transcript text
      setBrowserTranscript("");
      setServerTranscript("");
      fullTranscriptRef.current = "";

      console.log("Recording started successfully");
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsRecording(false);
      setError(
        `Could not access microphone. Please ensure you have granted permission and that no other app is using it. Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Add the stopRecording function
  const stopRecording = async () => {
    // Only attempt to stop if we're recording
    if (!isRecording || !mediaRecorderRef.current) {
      return;
    }

    console.log("🎤 Stopping recording...");

    try {
      // If there's an active timer, clear it
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // If we have a speech recognition instance, stop it
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore errors when stopping
        }
      }

      // Stop the media recorder
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();

        // Also stop the media stream tracks
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach((track) => {
            track.stop();
          });
        }
      }

      // Update state
      setIsRecording(false);
      setRecordingTime(0);
      setWaitingForResponse(true);

      // Clear WebSocket timer if active
      if (transcriptionTimerRef.current) {
        clearInterval(transcriptionTimerRef.current);
        transcriptionTimerRef.current = null;
      }

      // Clear the processing timer if active
      if (processingTimerRef.current) {
        clearInterval(processingTimerRef.current);
        processingTimerRef.current = null;
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      setIsRecording(false);
      setWaitingForResponse(false);
    }
  };

  // Add function to clear transcript
  const clearTranscript = () => {
    // Clear the text content
    setBrowserTranscript("");
    setServerTranscript("");
    setRecordingTime(0);
    fullTranscriptRef.current = "";

    // Revoke any existing audio URL if not recording
    if (_audioURL && !isRecording) {
      URL.revokeObjectURL(_audioURL);
      setAudioURL(null);
    }

    // Reset speech recognition without stopping the recording
    if (isRecording && !useFallback && language !== "fi-FI") {
      // Stop the existing recognition if it exists
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore errors when stopping
        }
      }

      // Wait a small delay to ensure everything is reset
      setTimeout(() => {
        // Create a new recognition instance
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
          // Create and configure new recognition instance
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = language;

          // Set up event handlers
          recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = Array.from(event.results)
              .map((result) => result[0].transcript)
              .join(" ");

            fullTranscriptRef.current = transcript;
            setBrowserTranscript(transcript);

            if (onSpeechRecognized) {
              onSpeechRecognized(transcript);
            }
          };

          recognitionRef.current.onerror = (event: SpeechRecognitionError) => {
            console.error(
              "Speech recognition error:",
              event.error,
              event.message
            );

            if (event.error !== "no-speech") {
              setError(`Speech recognition error: ${event.error}`);
            }
          };

          recognitionRef.current.onend = () => {
            console.log("Browser Speech Recognition Ended");
            setRecognitionEnded(true);
          };

          // Start the recognition
          try {
            recognitionRef.current.start();
            setRecognitionEnded(false);
            console.log(
              "Speech recognition restarted after clearing transcript"
            );
          } catch (error) {
            console.error("Could not restart speech recognition:", error);
          }
        }
      }, 300);
    }
  };

  // Move the detectSilence function up before it's used
  const detectSilence = useCallback(() => {
    // This is a placeholder function since we're not implementing silence detection
    console.log("Silence detection not implemented");
  }, []);

  // Add back the missing audio conversion utilities (after the declaration of state variables)
  // Add audio format conversion utilities
  const convertBlobToFloat32Array_ref = async (
    blob: Blob
  ): Promise<Float32Array> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          resolve(new Float32Array(arrayBuffer)); // Simply return the raw data as Float32Array
        } catch (error) {
          console.error("Error converting blob to float32 array:", error);
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  };

  // Clear waiting state after a timeout (in case the parent doesn't properly re-enable)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (waitingForResponse) {
      timeoutId = setTimeout(() => {
        setWaitingForResponse(false);
      }, 30000); // 30 seconds max wait time
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [waitingForResponse]);

  // Pre-initialize audio stream to speed up first recording
  useEffect(() => {
    let stream: MediaStream | null = null;

    const initializeAudio = async () => {
      if (!isInitialized && !initializing) {
        try {
          setInitializing(true);
          console.log("🎤 Pre-initializing audio stream...");

          // Request audio permission early to warm up the API
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });

          // Clean up the stream immediately after getting permission
          setTimeout(() => {
            if (stream) {
              stream.getTracks().forEach((track) => track.stop());
              stream = null;
            }
            setIsInitialized(true);
            setInitializing(false);
            console.log("🎤 Audio system pre-initialized successfully");
          }, 500);
        } catch (error) {
          console.error("Error pre-initializing audio:", error);
          setInitializing(false);
        }
      }
    };

    initializeAudio();

    return () => {
      // Clean up stream if component unmounts during initialization
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isInitialized, initializing]);

  // Set up WebSocket connection for real-time transcription
  useEffect(() => {
    // Don't set up WebSocket if not recording
    if (!isRecording) {
      return;
    }

    // Close any existing connection
    if (wsConnectionRef.current) {
      wsConnectionRef.current.close();
      setWsConnection(null);
    }

    // For English, prefer browser's native speech recognition rather than WebSocket
    if (language.toLowerCase().includes("en")) {
      console.log("Using browser's native speech recognition for English");
      return; // Skip WebSocket setup for English
    }

    // Determine WebSocket endpoint based on language
    let wsEndpoint = "";

    if (language.toLowerCase().includes("fi")) {
      wsEndpoint = "ws://localhost:8008/ws/finnish";
      console.log(`Using Finnish WebSocket endpoint: ${wsEndpoint}`);
    } else {
      wsEndpoint = "ws://localhost:8008/ws/english";
      console.log(`Using English WebSocket endpoint: ${wsEndpoint}`);
    }

    console.log(
      `Setting up WebSocket for real-time ${language} transcription: ${wsEndpoint}`
    );

    // Track connection attempts to prevent infinite reconnection
    let connectionAttempts = 0;
    const MAX_ATTEMPTS = 2;

    const connectWebSocket = () => {
      if (connectionAttempts >= MAX_ATTEMPTS) {
        console.log(
          `Maximum connection attempts (${MAX_ATTEMPTS}) reached, giving up`
        );
        return;
      }

      connectionAttempts++;

      try {
        // Create new WebSocket connection
        const ws = new WebSocket(wsEndpoint);

        // Set up event handlers
        ws.onopen = () => {
          console.log(`WebSocket connection established for ${language}`);
          connectionAttempts = 0; // Reset counter on successful connection

          // Send configuration to the server
          ws.send(
            JSON.stringify({
              language: language.substring(0, 2),
              chunkSize: 30000
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.status === "success" && data.text) {
              console.log(`Received real-time transcript: ${data.text}`);

              // Update the transcript
              setServerTranscript(data.text);

              // Also update the full transcript reference
              if (data.text.length > fullTranscriptRef.current.length) {
                fullTranscriptRef.current = data.text;
              }

              // Call callback if provided
              if (onSpeechRecognized) {
                onSpeechRecognized(data.text);
              }
            } else if (data.error) {
              console.error(`WebSocket error: ${data.error}`);

              // Check if this is a tensor type error (common with faster-whisper)
              if (
                data.error.includes("ONNX") ||
                data.error.includes("tensor")
              ) {
                console.log(
                  "Received ONNX tensor error - this is usually temporary, will retry"
                );
                // Don't show this error to user as it's usually just a temporary issue
              } else {
                // Display other errors to the user
                setError(`Speech recognition error: ${data.error}`);
              }
            }
          } catch (e) {
            console.error("Error parsing WebSocket message:", e);
          }
        };

        ws.onerror = (error) => {
          console.error(`WebSocket error:`, error);
          // Don't try to reconnect on error - this can cause infinite loops
        };

        ws.onclose = () => {
          console.log(`WebSocket closed for ${language}`);

          // Clean up reference
          if (wsConnectionRef.current === ws) {
            setWsConnection(null);
          }
        };

        // Store the WebSocket connection
        setWsConnection(ws);

        // Set up interval to send audio chunks only if the connection is open
        const wsInterval = setInterval(() => {
          if (
            ws.readyState === WebSocket.OPEN &&
            audioChunksRef.current.length > 0 &&
            isRecording
          ) {
            // Get latest chunk
            const latestChunk =
              audioChunksRef.current[audioChunksRef.current.length - 1];

            // Send the audio chunk
            if (latestChunk) {
              console.log(
                `Sending audio chunk via WebSocket for ${language}: ${latestChunk.size} bytes`
              );

              try {
                // Clone the blob to avoid any potential issues with the original being modified
                const blobToSend = latestChunk.slice(0, latestChunk.size);
                ws.send(blobToSend);
              } catch (sendError) {
                console.error(
                  "Error sending audio chunk via WebSocket:",
                  sendError
                );
                // Clear the interval if we encounter an error sending data
                clearInterval(wsInterval);
              }
            }
          } else if (
            ws.readyState !== WebSocket.OPEN &&
            ws.readyState !== WebSocket.CONNECTING
          ) {
            // Clear interval if connection is closed or closing
            clearInterval(wsInterval);
          }
        }, 1000); // Send every second

        // Clean up function
        return () => {
          clearInterval(wsInterval);

          if (
            ws.readyState === WebSocket.OPEN ||
            ws.readyState === WebSocket.CONNECTING
          ) {
            console.log(`Closing WebSocket connection for ${language}`);
            // Use a clean close code
            ws.close(1000, "Component unmounting");
          }

          setWsConnection(null);
        };
      } catch (error) {
        console.error("Error setting up WebSocket:", error);
        return undefined;
      }
    };

    // Initial connection
    connectWebSocket();
  }, [isRecording, language, onSpeechRecognized]);

  // Return component JSX here
  return (
    <Paper elevation={3} style={{ padding: "16px", marginBottom: "16px" }}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
      >
        {!isInitialized && !initializing && (
          <Button
            variant="contained"
            color="primary"
            onClick={initializeRecording}
            disabled={disabled || initializing}
            startIcon={<MicIcon />}
          >
            Initialize Microphone
          </Button>
        )}

        {initializing && (
          <Box display="flex" alignItems="center">
            <CircularProgress size={24} style={{ marginRight: "8px" }} />
            <Typography>Initializing microphone...</Typography>
          </Box>
        )}

        {/* Only show error alerts when server is definitely not running, hide other debug info */}
        {serverRunning === false && language === "fi-FI" && (
          <Alert
            severity="error"
            style={{ marginBottom: "16px", width: "100%" }}
          >
            The Whisper server is not running. Finnish speech recognition
            requires the Python server to be started with:{" "}
            <code>python speechbrain_service.py</code>
          </Alert>
        )}

        {isInitialized && (
          <Button
            variant="contained"
            color={isRecording ? "error" : "primary"}
            startIcon={isRecording ? <StopIcon /> : <MicIcon />}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={
              disabled ||
              processingTranscript ||
              initializing ||
              waitingForResponse ||
              (language === "fi-FI" && serverRunning === false) // Disable recording for Finnish if server isn't running
            }
            sx={{ mb: 2 }}
          >
            {initializing
              ? "Initializing..."
              : isRecording
              ? language === "fi-FI"
                ? "Lopeta äänitys"
                : "Stop Recording"
              : waitingForResponse
              ? "Processing..."
              : language === "fi-FI"
              ? "Aloita äänitys"
              : "Start Recording"}
          </Button>
        )}

        {isRecording && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography
              variant="body1"
              component="div"
              sx={{ fontWeight: language === "fi-FI" ? "medium" : "normal" }}
            >
              {language === "fi-FI"
                ? `Äänitetään... ${formatTime(recordingTime)}`
                : `Recording... ${formatTime(recordingTime)}`}
            </Typography>
          </Box>
        )}

        {processingTranscript && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography
              variant="body1"
              component="div"
              sx={{
                fontWeight: language.toLowerCase().includes("fi")
                  ? "medium"
                  : "normal"
              }}
            >
              {languageSupport.usesWhisper ||
              language.toLowerCase().includes("fi")
                ? language.toLowerCase().includes("fi")
                  ? `Analysoidaan Whisperillä...`
                  : `Processing with Whisper...`
                : `Processing transcription...`}
            </Typography>
          </Box>
        )}

        {waitingForResponse && !isRecording && !processingTranscript && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography
              variant="body1"
              component="div"
              sx={{
                fontWeight: language.toLowerCase().includes("fi")
                  ? "medium"
                  : "normal"
              }}
            >
              {language.toLowerCase().includes("fi")
                ? "Käsitellään..."
                : "Processing request..."}
            </Typography>
          </Box>
        )}

        {/* Transcription area - simplified for both languages */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            mt: 2,
            width: "100%",
            backgroundColor: "#f8f9fa",
            borderLeft: "4px solid #1976d2",
            position: "relative",
            maxHeight: "200px",
            overflow: "auto"
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1
              }}
            >
              <Typography
                variant="subtitle2"
                color="primary"
                sx={{ fontWeight: "bold" }}
              >
                Speech Recognition:
              </Typography>
              <IconButton
                size="small"
                onClick={clearTranscript}
                sx={{ p: 0.5 }}
                aria-label="Clear transcript"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Box>
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                minHeight: "40px",
                backgroundColor: "#ffffff"
              }}
            >
              <Typography>
                {serverTranscript ||
                  browserTranscript ||
                  "Nothing recorded yet"}
              </Typography>
            </Paper>
          </Box>
        </Paper>

        {_audioURL && !isRecording && (
          <Box sx={{ mt: 2, width: "100%" }}>
            <audio src={_audioURL} controls style={{ width: "100%" }} />
          </Box>
        )}

        {/* Display an error message if there is one */}
        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}

        {/* Show loading indicator when initializing or processing */}
        {isLoading && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography variant="body1" component="div">
              Loading...
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default VoiceRecorder;
