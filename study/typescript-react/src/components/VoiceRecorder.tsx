import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Button,
  Box,
  CircularProgress,
  Typography,
  Paper,
  IconButton,
  Alert
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import ClearIcon from "@mui/icons-material/Clear";
import {
  convertSpeechToText,
  isPythonServerRunning
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
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [browserTranscript, setBrowserTranscript] = useState<string>("");
  const [useFallback, setUseFallback] = useState<boolean>(false);
  const [processingTranscript, setProcessingTranscript] =
    useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [waitingForResponse, setWaitingForResponse] = useState<boolean>(false);
  const [languageSupport, setLanguageSupport] = useState<{
    hasBrowserSupport: boolean;
    usesWhisper: boolean;
  }>({ hasBrowserSupport: true, usesWhisper: false });
  const [serverRunning, setServerRunning] = useState<boolean | null>(null);
  const [serverTranscript, setServerTranscript] = useState<string>("");
  const [audioProcessing, setAudioProcessing] = useState<boolean>(false);
  const [recordingStatus, setRecordingStatus] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null); // Properly typed
  const fullTranscriptRef = useRef<string>(""); // Store complete transcript that won't be affected by re-renders

  const [chunksToProcess, setChunksToProcess] = useState<Blob[]>([]);
  const [isProcessingServerChunks, setIsProcessingServerChunks] =
    useState(false);
  const processingTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Add WebSocket support for real-time Finnish transcription
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Add a dedicated timer reference for periodic transcription
  const transcriptionTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const accumulatedChunksRef = useRef<Blob[]>([]);

  // Add variables for speech detection
  const [hasSpeech, setHasSpeech] = useState<boolean>(false);
  const lastSpeechTimestampRef = useRef<number>(0);
  const silenceThresholdRef = useRef<number>(1500); // 1.5 seconds of silence threshold
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const speechDetectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Add variables to track transcription progress
  const [lastProcessedTranscript, setLastProcessedTranscript] =
    useState<string>("");
  const lastTranscriptLengthRef = useRef<number>(0);

  // Add variables for speech processing optimization
  const minChunkSizeRef = useRef<number>(3000); // Minimum significant audio size in bytes
  const minProcessingIntervalRef = useRef<number>(800); // Minimum time between API calls in ms
  const lastProcessingTimeRef = useRef<number>(0);

  // Add tracking for consecutive speech frames to avoid sporadic noise
  let consecutiveSpeechFramesRef = useRef<number>(0);
  const REQUIRED_CONSECUTIVE_FRAMES = 5; // Require 5 consecutive frames of speech (250ms at 50ms intervals)
  const MIN_SPEECH_DURATION_MS = 500; // Minimum 500ms of speech before processing
  let speechStartTimeRef = useRef<number>(0);

  // Add reference for API call lock and content comparison
  const isProcessingApiRef = useRef<boolean>(false);
  const lastProcessedContentRef = useRef<string>("");
  const lastAudioSizeRef = useRef<number>(0);
  const emptyCallCountRef = useRef<number>(0);

  // Add references for error handling and stopping collection after server errors
  const errorCountRef = useRef<number>(0);
  const MAX_CONSECUTIVE_ERRORS = 3;
  const MAX_API_CALLS = 5;
  const apiCallCountRef = useRef<number>(0);
  const lastErrorTimeRef = useRef<number>(0);
  const serverDownRef = useRef<boolean>(false);

  // Add a function to check if the server is likely down
  const isServerLikelyDown = (): boolean => {
    // If we've had errors recently
    const recentError = Date.now() - lastErrorTimeRef.current < 10000; // Within 10 seconds
    return (
      serverDownRef.current ||
      (errorCountRef.current >= MAX_CONSECUTIVE_ERRORS && recentError)
    );
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
        if (language === "fi-FI") {
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

  // Initialize Web Speech API if available and supported for this language
  useEffect(() => {
    // Skip if this is Finnish language - we'll use Whisper directly
    if (language === "fi-FI") {
      setUseFallback(true);
      return;
    }

    // Check if the SpeechRecognition API is available
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    // Only initialize if we have browser support for this language
    if (
      !recognitionRef.current &&
      SpeechRecognition &&
      languageSupport.hasBrowserSupport
    ) {
      try {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = language;

        console.log("🎤 Speech recognition initialized");
      } catch (e) {
        console.warn("Browser speech recognition not available:", e);
        setUseFallback(true);
      }
    } else if (!SpeechRecognition || !languageSupport.hasBrowserSupport) {
      console.warn(`Web Speech API not supported for ${language}`);
      setUseFallback(true);
    }

    // Initialize event handlers (do this on every dependency change)
    if (recognitionRef.current) {
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        // Only process results when actively recording and not waiting
        if (!isRecording || waitingForResponse || disabled) {
          console.log(
            "🎤 Ignoring speech recognition results - not in recording state"
          );
          return;
        }

        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            // Add final transcript to our full transcript
            fullTranscriptRef.current += " " + transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Use the full transcript + current interim
        const currentTranscript =
          fullTranscriptRef.current +
          (interimTranscript ? " " + interimTranscript : "");

        // Only update UI if we have content
        if (currentTranscript.trim()) {
          setBrowserTranscript(currentTranscript.trim());

          // Send real-time transcript updates to parent
          if (onSpeechRecognized && currentTranscript) {
            onSpeechRecognized(currentTranscript.trim());
          }
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionError) => {
        console.error(`🎤 [Browser Speech Recognition] Error: ${event.error}`);
        // If there's an error, set to use fallback
        setUseFallback(true);
      };

      // Handle recognition ending
      recognitionRef.current.onend = () => {
        console.log("🎤 [Browser Speech Recognition] Ended");
      };
    }
  }, [
    language,
    isRecording,
    waitingForResponse,
    disabled,
    onSpeechRecognized,
    languageSupport.hasBrowserSupport
  ]); // Include all dependencies

  // Update speech recognition based on recording state
  useEffect(() => {
    // Skip Web Speech API completely for Finnish
    if (language === "fi-FI") {
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
          }, 300); // Small delay to ensure recognition completes
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

  // Add this effect to periodically send chunks for Finnish transcription
  useEffect(() => {
    // Only for Finnish and only when recording
    if (language !== "fi-FI" || !isRecording) {
      return;
    }

    // Clear any existing timer
    if (processingTimerRef.current) {
      clearInterval(processingTimerRef.current);
    }

    // Set up timer to process chunks every 2 seconds
    processingTimerRef.current = setInterval(() => {
      if (audioChunksRef.current.length > 0 && !isProcessingServerChunks) {
        processFinnishChunks();
      }
    }, 2000);

    // Clean up timer
    return () => {
      if (processingTimerRef.current) {
        clearInterval(processingTimerRef.current);
        processingTimerRef.current = null;
      }
    };
  }, [language, isRecording]);

  // Add function to process Finnish audio chunks
  const processFinnishChunks = async () => {
    if (isProcessingServerChunks || audioChunksRef.current.length === 0) {
      return;
    }

    try {
      setIsProcessingServerChunks(true);

      // Create a blob from all chunks collected so far
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || "audio/webm"
      });

      console.log(
        `🎤 [Real-time Finnish] Processing ${audioChunksRef.current.length} chunks, ${audioBlob.size} bytes`
      );

      // Only process if we have enough audio data
      if (audioBlob.size < 5000) {
        console.log("🎤 [Real-time Finnish] Not enough audio data yet");
        setIsProcessingServerChunks(false);
        return;
      }

      // Use the server-side speech-to-text service
      const transcript = await convertSpeechToText(audioBlob, language);
      console.log(`🎤 [Real-time Finnish] Got transcript: "${transcript}"`);

      // Update UI with the transcript if it's meaningful
      if (
        transcript &&
        transcript.trim() &&
        !transcript.includes("Ei tunnistettu") &&
        !transcript.includes("Virhe") &&
        !transcript.includes("palvelin")
      ) {
        setBrowserTranscript(transcript);
        setServerTranscript(transcript);
      }
    } catch (error) {
      console.error("🎤 [Real-time Finnish] Error processing chunks:", error);
    } finally {
      setIsProcessingServerChunks(false);
    }
  };

  // Add this effect to establish WebSocket connection for Finnish real-time transcription
  useEffect(() => {
    // Only establish WebSocket for Finnish language and clear any existing connection otherwise
    if (language !== "fi-FI") {
      if (wsConnection) {
        console.log("🎤 [WebSocket] Closing connection (language changed)");
        wsConnection.close();
        setWsConnection(null);
        setWsConnected(false);
      }
      return;
    }

    // Don't establish connection if we already have one
    if (wsConnection && wsConnected) {
      return;
    }

    // Connect to the WebSocket server
    try {
      console.log(
        "🎤 [WebSocket] Attempting to connect to Whisper real-time service"
      );

      // Try both localhost and 127.0.0.1
      const wsUrl = "ws://localhost:8008/ws/finnish";
      const newWsConnection = new WebSocket(wsUrl);

      newWsConnection.onopen = () => {
        console.log("🎤 [WebSocket] Connection established");
        setWsConnected(true);
      };

      newWsConnection.onmessage = (event) => {
        try {
          const transcription = JSON.parse(event.data);
          console.log(
            "🎤 [WebSocket] Real-time transcript:",
            transcription.text
          );

          // Update UI with real-time transcription
          if (transcription.text && !transcription.text.includes("Error")) {
            setBrowserTranscript(transcription.text);
            setServerTranscript(transcription.text);
          }
        } catch (error) {
          console.error("🎤 [WebSocket] Error parsing message:", error);
        }
      };

      newWsConnection.onerror = (error) => {
        console.error("🎤 [WebSocket] Connection error:", error);
        setWsConnected(false);

        // Try fallback to our existing approach
        console.log("🎤 [WebSocket] Falling back to chunk-based API");
      };

      newWsConnection.onclose = () => {
        console.log("🎤 [WebSocket] Connection closed");
        setWsConnected(false);
      };

      setWsConnection(newWsConnection);
    } catch (error) {
      console.error("🎤 [WebSocket] Setup error:", error);
      setWsConnected(false);
    }

    // Cleanup function to close WebSocket connection
    return () => {
      if (wsConnection) {
        console.log("🎤 [WebSocket] Cleaning up connection");
        wsConnection.close();
        setWsConnection(null);
        setWsConnected(false);
      }
    };
  }, [language]);

  // Update the detectSpeech function to be much more strict
  const detectSpeech = (audioData: Uint8Array): boolean => {
    // Simple energy-based voice activity detection
    const sum = audioData.reduce((acc, val) => acc + val, 0);
    const average = sum / audioData.length;

    // Higher threshold for speech detection to avoid false positives
    const threshold = 35; // Increased from 28 to be much more strict

    // Require a significant number of samples above threshold for better detection
    const samplesAboveThreshold = audioData.filter(
      (val) => val > threshold * 1.5
    ).length;
    const percentAboveThreshold =
      (samplesAboveThreshold / audioData.length) * 100;

    // Track consecutive frames with speech for validation
    const hasSufficientEnergy = average > threshold;
    const hasSufficientSamples = percentAboveThreshold > 12; // Increased from 7%

    // Enhanced detection that requires both conditions to be true
    // AND with higher thresholds to avoid false positives
    return hasSufficientEnergy && hasSufficientSamples;
  };

  // Modify the startRecording function for better real-time transcription sending to n8n
  const startRecording = async () => {
    try {
      // Reset transcripts for a new recording
      fullTranscriptRef.current = "";
      setBrowserTranscript("");
      setServerTranscript("");
      setWaitingForResponse(false);
      setHasSpeech(false);
      lastSpeechTimestampRef.current = Date.now();
      lastProcessingTimeRef.current = 0;

      // Reset all error tracking and API call counters
      errorCountRef.current = 0;
      apiCallCountRef.current = 0;
      serverDownRef.current = false;
      lastErrorTimeRef.current = 0;
      isProcessingApiRef.current = false;
      lastProcessedContentRef.current = "";
      lastAudioSizeRef.current = 0;
      emptyCallCountRef.current = 0;

      // Reset accumulated chunks
      accumulatedChunksRef.current = [];

      // Clear any existing timers
      if (processingTimerRef.current) {
        clearInterval(processingTimerRef.current);
        processingTimerRef.current = null;
      }

      if (transcriptionTimerRef.current) {
        clearInterval(transcriptionTimerRef.current);
        transcriptionTimerRef.current = null;
      }

      if (speechDetectionTimerRef.current) {
        clearInterval(speechDetectionTimerRef.current);
        speechDetectionTimerRef.current = null;
      }

      // Clear previous recognized speech when starting a new recording
      if (onSpeechRecognized) {
        onSpeechRecognized("");
      }

      // Set recording state first to show UI feedback immediately
      setIsRecording(true);

      console.log("🎤 Requesting microphone access");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("🎤 Microphone access granted");

      // Set up audio analysis for voice activity detection
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const audioContext = audioContextRef.current;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512; // Higher resolution for better detection
      source.connect(analyser);
      audioAnalyserRef.current = analyser;

      // Small delay to ensure everything is initialized properly
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Determine the best audio MIME type for this browser
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/wav";

      console.log(`🎤 Using MIME type: ${mimeType} for recording`);

      // Create the MediaRecorder with the best available options
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 16000 // Optimized for speech
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);

          // Only add to accumulated chunks if speech was detected
          if (hasSpeech) {
            accumulatedChunksRef.current.push(event.data);
            console.log(
              `🎤 Audio chunk with speech collected: ${event.data.size} bytes`
            );
          }
        }
      };

      // For Finnish, set up real-time transcription with voice activity detection
      if (language === "fi-FI") {
        // Set up speech detection timer - check more frequently for better responsiveness
        speechDetectionTimerRef.current = setInterval(() => {
          if (!audioAnalyserRef.current || !isRecording) return;

          // Get audio data
          const dataArray = new Uint8Array(
            audioAnalyserRef.current.frequencyBinCount
          );
          audioAnalyserRef.current.getByteFrequencyData(dataArray);

          // Detect if speech is present
          const speechDetected = detectSpeech(dataArray);

          if (speechDetected) {
            // Count consecutive frames with speech
            consecutiveSpeechFramesRef.current++;

            // Only consider it actual speech after several consecutive frames
            if (
              consecutiveSpeechFramesRef.current >= REQUIRED_CONSECUTIVE_FRAMES
            ) {
              // If this is the start of speech, note the timestamp
              if (!hasSpeech) {
                speechStartTimeRef.current = Date.now();
                console.log(
                  "🎤 Potential speech detected, monitoring duration..."
                );
              }

              // Check if we've had speech for the minimum duration
              const speechDuration = Date.now() - speechStartTimeRef.current;
              if (!hasSpeech && speechDuration >= MIN_SPEECH_DURATION_MS) {
                console.log(
                  `🎤 Confirmed speech detected after ${speechDuration}ms, starting to collect audio`
                );
                setHasSpeech(true);
              }

              // Update last activity timestamp (only after confirmed speech)
              if (hasSpeech) {
                lastSpeechTimestampRef.current = Date.now();
              }
            }
          } else {
            // Reset consecutive counter when no speech detected
            consecutiveSpeechFramesRef.current = 0;

            // If we were in speech mode, check for silence duration
            if (hasSpeech) {
              // Check if silence has lasted long enough to consider speech ended
              const silenceDuration =
                Date.now() - lastSpeechTimestampRef.current;
              if (silenceDuration > silenceThresholdRef.current) {
                console.log(
                  `🎤 Silence detected for ${silenceDuration}ms, processing speech`
                );
                setHasSpeech(false);

                // Only process accumulated chunks if:
                // 1. We have enough audio data (increased minimum)
                // 2. Enough time has passed since last processing
                // 3. We actually have some accumulated chunks to process
                const currentTime = Date.now();
                const hasMinimumAudioData =
                  accumulatedChunksRef.current.length > 3; // Increased from 2
                const totalAudioDuration =
                  currentTime - speechStartTimeRef.current;
                const enoughTimePassed =
                  currentTime - lastProcessingTimeRef.current >
                  minProcessingIntervalRef.current;

                if (
                  hasMinimumAudioData &&
                  enoughTimePassed &&
                  accumulatedChunksRef.current.length > 0 &&
                  totalAudioDuration > 1000 // Require at least 1 second of audio
                ) {
                  console.log(
                    "🎤 Processing accumulated speech after silence detected"
                  );
                  processAccumulatedChunks(mimeType);
                  lastProcessingTimeRef.current = currentTime;
                } else {
                  console.log(
                    "🎤 Not enough speech data to process after silence, skipping API call"
                  );
                  // Reset state
                  accumulatedChunksRef.current = [];
                }

                // Reset speech tracking
                consecutiveSpeechFramesRef.current = 0;
                speechStartTimeRef.current = 0;
              }
            }
          }
        }, 50); // Check for speech every 50ms
      }

      // Handle recording stop event
      mediaRecorder.onstop = async () => {
        console.log(
          `🎤 MediaRecorder stopped, creating audio blob from ${audioChunksRef.current.length} chunks`
        );

        // Clear real-time transcription timer
        if (transcriptionTimerRef.current) {
          clearInterval(transcriptionTimerRef.current);
          transcriptionTimerRef.current = null;
        }

        // Clean up audio analysis
        if (audioAnalyserRef.current) {
          audioAnalyserRef.current = null;
        }

        if (audioChunksRef.current.length === 0) {
          console.error("🎤 No audio data recorded!");
          setIsRecording(false);
          setWaitingForResponse(false);
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType
        });

        console.log(`🎤 Audio blob created: ${audioBlob.size} bytes`);
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        // Get the final transcript, either from the ref or from the UI
        let finalTranscript = fullTranscriptRef.current.trim();
        const uiTranscript = serverTranscript || browserTranscript;

        // If the ref is empty but we have a UI transcript, use that
        if (!finalTranscript && uiTranscript && uiTranscript.trim()) {
          finalTranscript = uiTranscript.trim();
          console.log(
            `🎤 Using UI transcript for final result: "${finalTranscript}"`
          );
        }

        // If still no transcript, try one last transcription
        if (!finalTranscript && language === "fi-FI" && audioBlob.size > 5000) {
          console.log(
            `🎤 No transcript yet, trying one final transcription...`
          );
          try {
            const lastTranscript = await convertSpeechToText(
              audioBlob,
              language
            );
            if (lastTranscript && !lastTranscript.includes("Error")) {
              finalTranscript = lastTranscript.trim();
              console.log(`🎤 Got final transcription: "${finalTranscript}"`);

              // Update UI with this transcript
              setServerTranscript(finalTranscript);
              setBrowserTranscript(finalTranscript);
            }
          } catch (e) {
            console.error("Failed to get final transcription:", e);
          }
        }

        // If we have a transcript and it hasn't been sent yet, use it
        if (finalTranscript && onSpeechRecognized) {
          console.log(
            `🎤 Sending final transcript to n8n: "${finalTranscript}"`
          );
          onSpeechRecognized(finalTranscript);
        }

        // For browsers with Web Speech API support and supported languages
        if (language === "fi-FI") {
          // We already have the transcript from real-time, just send the recording
          console.log(
            `🎤 Sending recording to parent with transcript: "${finalTranscript}"`
          );
          onAudioRecorded(audioBlob, finalTranscript);
        } else {
          console.log(`🎤 Using browser transcript: "${finalTranscript}"`);
          onAudioRecorded(audioBlob, finalTranscript);
        }

        // Clean up the stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      console.log("🎤 Starting MediaRecorder");
      // Use smaller slices for real-time processing
      mediaRecorder.start(400); // 400ms chunks for better real-time quality
      console.log(`🎤 MediaRecorder started with 400ms slice interval`);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsRecording(false);

      // Show error in UI
      setBrowserTranscript(
        "Error accessing microphone. Please check permissions."
      );
    }
  };

  // Update processAccumulatedChunks to be smarter about server errors
  const processAccumulatedChunks = async (
    mimeType: string,
    clearAllChunks = true
  ) => {
    // Check if we've reached the maximum number of API calls
    if (apiCallCountRef.current >= MAX_API_CALLS) {
      console.log(
        `🎤 Maximum API calls (${MAX_API_CALLS}) reached, not making more calls until recording stops`
      );
      return;
    }

    // Check if server is likely down based on recent errors
    if (isServerLikelyDown()) {
      console.log("🎤 Server appears to be down, not making more API calls");
      // Update the UI to inform the user
      setBrowserTranscript(
        "Whisper-palvelin ei ole käytettävissä. Tarkista palvelimen tila."
      );
      setServerTranscript(
        "Whisper-palvelin ei ole käytettävissä. Tarkista palvelimen tila."
      );
      // Clear accumulated chunks to avoid growing memory usage
      accumulatedChunksRef.current = [];
      return;
    }

    // Don't process if we're already processing an API call
    if (isProcessingApiRef.current) {
      console.log("🎤 Already processing an API call, skipping");
      return;
    }

    if (accumulatedChunksRef.current.length === 0) {
      console.log("🎤 No audio chunks to process, skipping API call");
      return;
    }

    try {
      // Create a blob from accumulated chunks
      const audioBlob = new Blob(accumulatedChunksRef.current, {
        type: mimeType
      });

      // Check if audio is basically empty (too small)
      if (audioBlob.size < 2000) {
        // Less than 2KB is probably empty/noise
        console.log(
          `🎤 Audio too small to process (${audioBlob.size} bytes), skipping API call`
        );
        emptyCallCountRef.current++;

        // If we've had multiple empty calls, clear chunks to reset
        if (emptyCallCountRef.current >= 3) {
          console.log(
            "🎤 Multiple empty recordings detected, clearing audio buffer"
          );
          accumulatedChunksRef.current = [];
          emptyCallCountRef.current = 0;
        }
        return;
      }

      // If this audio has the same size as the last processed one, likely no new content
      if (
        Math.abs(audioBlob.size - lastAudioSizeRef.current) < 1000 &&
        lastAudioSizeRef.current > 0
      ) {
        console.log(
          `🎤 No significant change in audio size (${audioBlob.size} vs ${lastAudioSizeRef.current}), skipping API call`
        );
        return;
      }

      // Set the lock - we're starting an API call
      isProcessingApiRef.current = true;

      // Increment API call counter
      apiCallCountRef.current++;

      console.log(
        `🎤 Processing ${accumulatedChunksRef.current.length} speech chunks (${audioBlob.size} bytes) - Call ${apiCallCountRef.current} of ${MAX_API_CALLS}`
      );

      // Update the last processed audio size
      lastAudioSizeRef.current = audioBlob.size;

      // Send to server for transcription with timeout handling
      try {
        const transcript = await convertSpeechToText(audioBlob, language);

        // Reset error counter since we got a successful response
        errorCountRef.current = 0;
        serverDownRef.current = false;

        // Reset the empty call counter since we processed something
        emptyCallCountRef.current = 0;

        // Check if we got a server error message
        if (
          transcript &&
          (transcript.includes("Whisper-palvelin ei ole käytettävissä") ||
            transcript.includes("Error") ||
            transcript.includes("Virhe"))
        ) {
          console.log("🎤 Server returned error message:", transcript);
          // Track error
          errorCountRef.current++;
          lastErrorTimeRef.current = Date.now();

          if (errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
            console.log("🎤 Too many server errors, marking server as down");
            serverDownRef.current = true;
            // Clear accumulated chunks
            accumulatedChunksRef.current = [];
          }

          // Update UI
          setServerTranscript(transcript);
          setBrowserTranscript(transcript);

          // Release lock
          isProcessingApiRef.current = false;
          return;
        }

        // Only update if we got meaningful content
        if (transcript) {
          console.log(`🎤 [Real-time Finnish] Got transcript: "${transcript}"`);

          // Check if the transcript is empty or basically empty
          if (!transcript.trim()) {
            console.log("🎤 Empty transcript received, not updating UI");
            isProcessingApiRef.current = false;
            return;
          }

          // Check if this is the same as the last processed content
          if (transcript.trim() === lastProcessedContentRef.current.trim()) {
            console.log("🎤 Same transcript as before, not updating UI");
            isProcessingApiRef.current = false;
            return;
          }

          // Store the new transcript for future comparison
          lastProcessedContentRef.current = transcript;

          // Always store the latest valid transcript in the fullTranscriptRef
          if (transcript.trim().length > 0) {
            fullTranscriptRef.current = transcript;
            console.log(
              `🎤 Updated fullTranscriptRef.current to: "${fullTranscriptRef.current}"`
            );
          }

          // Check if there's new content since the last processed transcript
          // Only update if substantially different (more than just noise)
          const newContentSize =
            transcript.length - lastTranscriptLengthRef.current;
          const hasSignificantChange = newContentSize > 10; // More threshold for significance

          if (hasSignificantChange) {
            setLastProcessedTranscript(transcript);
            lastTranscriptLengthRef.current = transcript.length;

            // Update the UI display
            setServerTranscript(transcript);
            setBrowserTranscript(transcript);

            // Send to n8n for immediate feedback if the transcript is substantial
            if (transcript.length > 10 && onSpeechRecognized) {
              console.log(
                `🎤 Sending real-time transcript to n8n: "${transcript}"`
              );
              onSpeechRecognized(transcript);
            }
          } else {
            console.log(
              `🎤 No significant change in transcript, not updating UI`
            );
          }
        } else {
          console.log("🎤 No meaningful transcript received, not updating UI");
        }
      } catch (error) {
        // Handle API errors
        console.error("Error in speech-to-text API call:", error);
        errorCountRef.current++;
        lastErrorTimeRef.current = Date.now();

        if (errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
          console.log("🎤 Too many consecutive errors, marking server as down");
          serverDownRef.current = true;

          // Update UI with error message
          const errorMessage =
            "Whisper-palvelin ei ole käytettävissä. Tarkista palvelimen tila.";
          setServerTranscript(errorMessage);
          setBrowserTranscript(errorMessage);

          // Clear accumulated chunks
          accumulatedChunksRef.current = [];
        }
      }

      // Reset accumulated chunks but keep some for context if needed
      if (clearAllChunks) {
        // Keep last 2 chunks for overlap
        if (accumulatedChunksRef.current.length > 2) {
          accumulatedChunksRef.current = accumulatedChunksRef.current.slice(-2);
        } else {
          accumulatedChunksRef.current = [];
        }
      } else {
        // Keep last 5 chunks for ongoing speech
        if (accumulatedChunksRef.current.length > 5) {
          accumulatedChunksRef.current = accumulatedChunksRef.current.slice(-5);
        }
      }
    } catch (error) {
      console.error("Error in processing speech chunks:", error);
      errorCountRef.current++;
      lastErrorTimeRef.current = Date.now();
    } finally {
      // Always release the lock when done, whether successful or error
      isProcessingApiRef.current = false;
    }
  };

  const processServerTranscription = async (audioBlob: Blob) => {
    console.log("Processing server transcription");
    console.log(`Audio blob size: ${audioBlob.size} bytes`);

    setAudioProcessing(true);

    if (language === "fi-FI") {
      setRecordingStatus("Analysoidaan ääntä Whisperillä...");
    } else {
      setRecordingStatus("Processing audio with Whisper...");
    }

    try {
      // Convert speech to text using the server
      const transcript = await convertSpeechToText(audioBlob, language);
      console.log("Got transcript from server:", transcript);

      // Removed the debug popup

      // Update the UI immediately with the transcript
      setServerTranscript(
        transcript ||
          (language === "fi-FI"
            ? "Ei tunnistettu puhetta. Kokeile puhua kovempaa."
            : "No speech detected. Try speaking louder.")
      );

      // Update the browser transcript as well to ensure it's visible in all UI locations
      setBrowserTranscript(transcript);

      setAudioProcessing(false);
      if (language === "fi-FI") {
        setRecordingStatus("Äänitys valmis");
      } else {
        setRecordingStatus("Recording finished");
      }

      return transcript;
    } catch (error) {
      console.error("Error during server speech processing:", error);
      const errorMessage =
        language === "fi-FI"
          ? "Virhe puheen tunnistuksessa. Whisper-palvelin saattaa olla pois päältä."
          : "Error processing speech. Whisper server might be offline.";

      setServerTranscript(errorMessage);
      setAudioProcessing(false);
      setRecordingStatus("Error");
      return "";
    }
  };

  const sendRecording = (audioBlob: Blob, transcript: string) => {
    try {
      console.log(`🎤 Sending recording with transcript: "${transcript}"`);

      // Make sure we have a transcript to send
      if (!transcript || transcript.trim() === "") {
        console.warn("🎤 Empty transcript, using placeholder");
        transcript = "I couldn't hear what you said. Please try again.";
      }

      // Send recording to parent
      onAudioRecorded(audioBlob, transcript);

      // Don't clear the transcript - keep it visible in the UI
      // This ensures the Whisper recognition content remains visible

      // Keep waiting for response
      // This will be reset when startRecording is called again
    } catch (error) {
      console.error("Error sending recording:", error);
      // Re-enable button on error
      setWaitingForResponse(false);
    }
  };

  // Update the clearTranscript function without removing important functionality
  const clearTranscript = useCallback(() => {
    console.log("🎤 Clearing transcript");
    fullTranscriptRef.current = "";
    setBrowserTranscript("");
    setServerTranscript("");

    // Reset the recording time to 0
    setRecordingTime(0);

    // Clear the timer if it's running
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // If we're still recording, restart the timer
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }

    // Notify parent component
    if (onSpeechRecognized) {
      onSpeechRecognized("");
    }
  }, [isRecording, onSpeechRecognized]);

  // Function to manually initialize the microphone
  const initializeRecording = async () => {
    try {
      setInitializing(true);
      console.log("🎤 Initializing audio stream...");

      // Request audio permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Clean up the stream after getting permission
      setTimeout(() => {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        setIsInitialized(true);
        setInitializing(false);
        console.log("🎤 Audio system initialized successfully");
      }, 500);
    } catch (error) {
      console.error("Error initializing audio:", error);
      setInitializing(false);
      // Show error in UI
      setBrowserTranscript(
        "Error accessing microphone. Please check permissions."
      );
    }
  };

  // Check if 'disabled' prop changed from true to false or from false to true
  useEffect(() => {
    // When the parent component re-enables us, reset waiting state
    if (!disabled && waitingForResponse) {
      setWaitingForResponse(false);
    }

    // When the component becomes disabled (AI starts speaking), stop recognition
    if (disabled && recognitionRef.current) {
      try {
        // Stop speech recognition if it's running
        recognitionRef.current.stop();
        console.log(
          "🎤 Speech recognition stopped due to component being disabled"
        );

        // Clear any transcript that might have been captured from AI speech
        setBrowserTranscript("");
        fullTranscriptRef.current = "";
      } catch {
        // Ignore errors when stopping
      }
    }
  }, [disabled, waitingForResponse]);

  useEffect(() => {
    // Cleanup function to stop recording when component unmounts
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Stop speech recognition
      if (recognitionRef.current && !useFallback) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore, might not be started
          console.debug("Error stopping recognition on cleanup:");
        }
      }
    };
  }, [isRecording, useFallback]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Update the stopRecording function to clean up all resources
  const stopRecording = () => {
    // Capture the current transcript before stopping
    const finalTranscript = fullTranscriptRef.current.trim();
    console.log(`🎤 Final transcript before stopping: "${finalTranscript}"`);

    // Clear any real-time processing timers
    if (transcriptionTimerRef.current) {
      clearInterval(transcriptionTimerRef.current);
      transcriptionTimerRef.current = null;
      console.log("🎤 Cleaned up real-time transcription timer");
    }

    if (processingTimerRef.current) {
      clearInterval(processingTimerRef.current);
      processingTimerRef.current = null;
      console.log("🎤 Cleaned up processing timer");
    }

    // Clear speech detection timer
    if (speechDetectionTimerRef.current) {
      clearInterval(speechDetectionTimerRef.current);
      speechDetectionTimerRef.current = null;
      console.log("🎤 Cleaned up speech detection timer");
    }

    // Set waiting for response to disable recording
    setWaitingForResponse(true);

    // Stop the media recorder to create the audio blob
    if (mediaRecorderRef.current && isRecording) {
      // Get any existing transcript from the UI before stopping
      const uiTranscript = serverTranscript || browserTranscript;

      // If there's a valid transcript in the UI, update our refs
      if (uiTranscript && uiTranscript.trim().length > 0) {
        fullTranscriptRef.current = uiTranscript.trim();
        console.log(
          `🎤 Using UI transcript for final result: "${uiTranscript}"`
        );
      }

      // Stop the media recorder to create the complete audio blob
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else if (recognitionRef.current && !useFallback) {
      // If using browser recognition, stop it first
      try {
        recognitionRef.current.stop();
        // Give a small delay to ensure final recognition results are processed
        setTimeout(() => {
          if (mediaRecorderRef.current && isRecording) {
            // Get any existing transcript from the UI before stopping
            const uiTranscript = serverTranscript || browserTranscript;

            // If there's a valid transcript in the UI, update our refs
            if (uiTranscript && uiTranscript.trim().length > 0) {
              fullTranscriptRef.current = uiTranscript.trim();
              console.log(
                `🎤 Using UI transcript for final result: "${uiTranscript}"`
              );
            }

            mediaRecorderRef.current.stop();
            setIsRecording(false);
          }
        }, 300); // Small delay to ensure recognition completes
      } catch (e) {
        console.warn("Error stopping speech recognition:", e);
        // If error in stopping recognition, still stop recording
        if (mediaRecorderRef.current && isRecording) {
          // Get any existing transcript from the UI before stopping
          const uiTranscript = serverTranscript || browserTranscript;

          // If there's a valid transcript in the UI, update our refs
          if (uiTranscript && uiTranscript.trim().length > 0) {
            fullTranscriptRef.current = uiTranscript.trim();
            console.log(
              `🎤 Using UI transcript for final result: "${uiTranscript}"`
            );
          }

          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setRecordingTime(0);
    }

    // Reset transcript tracking
    lastTranscriptLengthRef.current = 0;
    setLastProcessedTranscript("");

    // Reset all API tracking variables
    errorCountRef.current = 0;
    apiCallCountRef.current = 0;
    serverDownRef.current = false;
    lastErrorTimeRef.current = 0;
    isProcessingApiRef.current = false;
  };

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
              sx={{ fontWeight: language === "fi-FI" ? "medium" : "normal" }}
            >
              {languageSupport.usesWhisper || language === "fi-FI"
                ? language === "fi-FI"
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
              sx={{ fontWeight: language === "fi-FI" ? "medium" : "normal" }}
            >
              {language === "fi-FI"
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

        {audioURL && !isRecording && (
          <Box sx={{ mt: 2, width: "100%" }}>
            <audio src={audioURL} controls style={{ width: "100%" }} />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default VoiceRecorder;
