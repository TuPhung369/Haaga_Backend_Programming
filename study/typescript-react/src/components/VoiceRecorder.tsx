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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null); // Properly typed
  const fullTranscriptRef = useRef<string>(""); // Store complete transcript that won't be affected by re-renders

  // Initialize Web Speech API if available
  useEffect(() => {
    // Check if the SpeechRecognition API is available
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        // Set language when it changes
        recognitionRef.current.lang = language;

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
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
          setBrowserTranscript(currentTranscript.trim());

          // Send real-time transcript updates to parent
          if (onSpeechRecognized && currentTranscript) {
            onSpeechRecognized(currentTranscript.trim());
          }
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionError) => {
          console.error(
            `🎤 [Browser Speech Recognition] Error: ${event.error}`
          );
        };

        // Handle recognition ending
        recognitionRef.current.onend = () => {
          console.log("🎤 [Browser Speech Recognition] Ended");
        };
      } catch (e) {
        console.warn("Browser speech recognition not available:", e);
      }
    } else {
      console.warn("Web Speech API not supported in this browser");
    }
  }, [onSpeechRecognized, language]);

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

      // Clear previous recognized speech when starting a new recording
      if (onSpeechRecognized) {
        onSpeechRecognized("");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav"
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        // Get the most complete transcript from our ref
        const finalTranscript = fullTranscriptRef.current.trim();

        // Send audio to backend for processing, along with the browser transcript
        sendRecording(audioBlob, finalTranscript);

        // Clean up the stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start browser-based speech recognition if available
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Could not start speech recognition:", e);
        }
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    // Stop speech recognition first to ensure final results are captured
    if (recognitionRef.current) {
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

  const sendRecording = (audioBlob: Blob, transcript: string) => {
    onAudioRecorded(audioBlob, transcript);
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
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore, might not be started
          console.debug("Error stopping recognition on cleanup:", e);
        }
      }
    };
  }, [isRecording]);

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
          disabled={disabled}
          sx={{ mb: 2 }}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>

        {isRecording && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography>Recording... {formatTime(recordingTime)}</Typography>
          </Box>
        )}

        {isRecording && browserTranscript && (
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
                Browser Speech Recognition (Real-time):
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
