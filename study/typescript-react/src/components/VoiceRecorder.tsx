import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Box,
  CircularProgress,
  Typography,
  Paper,
  IconButton
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import ClearIcon from "@mui/icons-material/Clear";
import { convertSpeechToText } from "../services/SpeechService";

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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null); // Properly typed
  const fullTranscriptRef = useRef<string>(""); // Store complete transcript that won't be affected by re-renders

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

  // Initialize Web Speech API if available
  useEffect(() => {
    // Check if the SpeechRecognition API is available
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    // Create the recognition instance only once
    if (!recognitionRef.current && SpeechRecognition) {
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
    } else if (!SpeechRecognition) {
      console.warn("Web Speech API not supported in this browser");
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
  }, [language, isRecording, waitingForResponse, disabled, onSpeechRecognized]); // Include all dependencies

  // Start or stop recognition based on recording state
  useEffect(() => {
    if (!recognitionRef.current) return;

    // Only start speech recognition if we're recording, not disabled, and not waiting
    if (isRecording && !disabled && !waitingForResponse && !useFallback) {
      try {
        // Set the current language
        recognitionRef.current.lang = language;

        // Try to start recognition
        console.log("🎤 Starting speech recognition");
        recognitionRef.current.start();
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

  const startRecording = async () => {
    try {
      // Reset transcripts for a new recording
      fullTranscriptRef.current = "";
      setBrowserTranscript("");
      setWaitingForResponse(false);

      // Clear previous recognized speech when starting a new recording
      if (onSpeechRecognized) {
        onSpeechRecognized("");
      }

      // Set recording state first to show UI feedback immediately
      setIsRecording(true);

      console.log("🎤 Requesting microphone access");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("🎤 Microphone access granted");

      // Small delay to ensure everything is initialized properly
      // This helps especially on the first recording attempt
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
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log(
          `🎤 MediaRecorder stopped, creating audio blob from ${audioChunksRef.current.length} chunks`
        );

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

        // Get the final transcript from our ref
        const finalTranscript = fullTranscriptRef.current.trim();

        // For browsers with Web Speech API support
        if (!useFallback) {
          // Get the most complete transcript from our ref
          console.log(`🎤 Using browser transcript: "${finalTranscript}"`);

          // Send audio to backend for processing, along with the browser transcript
          sendRecording(audioBlob, finalTranscript);
        } else {
          // Server-side transcription for browsers without Web Speech API
          processServerTranscription(audioBlob);
        }

        // Clean up the stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      console.log("🎤 Starting MediaRecorder");
      // Start recording with a minimum of 250ms slice
      mediaRecorder.start(250);

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

  const stopRecording = () => {
    // Capture the current transcript before stopping
    const finalTranscript = fullTranscriptRef.current.trim();
    console.log(`🎤 Final transcript before stopping: "${finalTranscript}"`);

    // Set waiting for response to disable recording
    setWaitingForResponse(true);

    // Stop speech recognition first to ensure final results are captured
    if (recognitionRef.current && !useFallback) {
      try {
        recognitionRef.current.stop();
        // Give a small delay to ensure final recognition results are processed
        setTimeout(() => {
          if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
          }
        }, 300); // Small delay to ensure recognition completes
      } catch (e) {
        console.warn("Error stopping speech recognition:", e);
        // If error in stopping recognition, still stop recording
        if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }
    } else if (mediaRecorderRef.current && isRecording) {
      // No recognition, just stop recording
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setRecordingTime(0);
    }
  };

  const processServerTranscription = async (audioBlob: Blob) => {
    try {
      setProcessingTranscript(true);
      console.log("🎤 Using server-side speech recognition");

      // Use the server-side speech-to-text service
      let serverTranscript = await convertSpeechToText(audioBlob, language);

      console.log(`🎤 Server transcription result: "${serverTranscript}"`);

      // If the transcript contains "error" or "couldn't", set a clearer error message
      if (
        serverTranscript.toLowerCase().includes("error") ||
        serverTranscript.toLowerCase().includes("couldn't") ||
        serverTranscript.trim() === ""
      ) {
        console.warn(
          "🎤 Server returned an error or empty transcript, using fallback message"
        );
        serverTranscript = "Please say something clearly and try again.";
      }

      // Update the transcript state
      setBrowserTranscript(serverTranscript);

      // Send the transcription to parent component
      if (onSpeechRecognized) {
        onSpeechRecognized(serverTranscript);
      }

      // Send audio to backend for processing, along with the server transcript
      sendRecording(audioBlob, serverTranscript);
    } catch (error) {
      console.error("Error with server transcription:", error);

      // Set an error message in the transcript
      const errorMessage = "Error transcribing audio. Please try again.";
      setBrowserTranscript(errorMessage);

      // Send the error message as transcript
      sendRecording(audioBlob, errorMessage);
    } finally {
      setProcessingTranscript(false);
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

      // Don't clear the transcript immediately - leave it visible for a moment
      // Then clear it after a short delay
      setTimeout(() => {
        setBrowserTranscript("");
        fullTranscriptRef.current = "";
        console.log("🎤 Transcript cleared after sending");
      }, 2000); // 2 second delay to keep it visible

      // Keep waiting for response
      // This will be reset when startRecording is called again
    } catch (error) {
      console.error("Error sending recording:", error);
      // Re-enable button on error
      setWaitingForResponse(false);
    }
  };

  // Add a function to clear the transcript
  const clearTranscript = () => {
    fullTranscriptRef.current = "";
    setBrowserTranscript("");

    // Notify parent component
    if (onSpeechRecognized) {
      onSpeechRecognized("");
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

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          mb: 2
        }}
      >
        <Button
          variant="contained"
          color={isRecording ? "error" : "primary"}
          startIcon={isRecording ? <StopIcon /> : <MicIcon />}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={
            disabled ||
            processingTranscript ||
            initializing ||
            waitingForResponse
          }
          sx={{ mb: 2 }}
        >
          {initializing
            ? "Initializing..."
            : isRecording
            ? "Stop Recording"
            : waitingForResponse
            ? "Processing..."
            : "Start Recording"}
        </Button>

        {isRecording && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography>Recording... {formatTime(recordingTime)}</Typography>
          </Box>
        )}

        {processingTranscript && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography>Processing transcription...</Typography>
          </Box>
        )}

        {waitingForResponse && !isRecording && !processingTranscript && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography>Processing request...</Typography>
          </Box>
        )}

        {browserTranscript && (
          <Paper
            elevation={1}
            sx={{
              p: 2,
              mt: 2,
              width: "100%",
              backgroundColor: "#f8f9fa",
              borderLeft: "4px solid #4caf50",
              position: "relative"
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start"
              }}
            >
              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
              >
                {useFallback
                  ? "Server Speech Recognition:"
                  : "Speech Recognition:"}
              </Typography>
              <IconButton
                size="small"
                onClick={clearTranscript}
                sx={{ padding: 0, marginLeft: 1 }}
                aria-label="Clear transcript"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography>{browserTranscript}</Typography>
          </Paper>
        )}

        {audioURL && !isRecording && (
          <Box sx={{ mt: 2, width: "100%" }}>
            <audio src={audioURL} controls style={{ width: "100%" }} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default VoiceRecorder;
