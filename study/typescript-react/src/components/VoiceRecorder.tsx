import React, { useState, useRef, useEffect } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { MicNone, Stop } from "@mui/icons-material";

// Interface for the Speech Recognition Event
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: Record<string, unknown>;
}

// Interface for the Speech Recognition Error
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
  // Basic state
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Start recording function
  const startRecording = async () => {
    try {
      // Reset state
      setError(null);
      setIsLoading(true);
      setTranscript("");
      audioChunksRef.current = [];

      console.log(`Starting recording for language: ${language}`);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder with best supported format
      let options = {};
      if (MediaRecorder.isTypeSupported("audio/wav")) {
        options = { mimeType: "audio/wav" };
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/webm" };
      }

      console.log(`Using MediaRecorder with options:`, options);

      // Create and configure MediaRecorder
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      // Handle data available
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`Audio chunk received: ${event.data.size} bytes`);
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle stop event
      recorder.onstop = () => {
        console.log("MediaRecorder stopped");

        // Create blob with all chunks
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm"
        });

        // Create URL for playback
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        // Call callback with audio and transcript
        onAudioRecorded(audioBlob, transcript);

        // Clean up
        stream.getTracks().forEach((track) => track.stop());

        // Reset UI state
        setIsLoading(false);
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // Start recording
      recorder.start(1000); // Collect chunks every second

      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Update state
      setIsRecording(true);
      setIsLoading(false);

      // For English, try to use browser speech recognition
      if (language.toLowerCase().includes("en")) {
        try {
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

  // Stop recording
  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;

    // Stop browser speech recognition if running
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Error stopping speech recognition:", err);
      }
      recognitionRef.current = null;
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    // Update state
    setIsLoading(true); // Show loading while processing
  };

  // Start browser speech recognition (for English)
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
          setTranscript((prev) =>
            prev ? `${prev} ${finalTranscript}` : finalTranscript
          );
          if (onSpeechRecognized) {
            onSpeechRecognized(finalTranscript);
          }
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

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Render the component
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
          ) : (
            "Record"
          )}
        </Button>

        {audioURL && !isRecording && <audio src={audioURL} controls />}
      </Box>

      {transcript && (
        <Typography
          variant="body1"
          sx={{ mt: 2, p: 2, bgcolor: "rgba(0, 0, 0, 0.05)", borderRadius: 1 }}
        >
          {transcript}
        </Typography>
      )}
    </Box>
  );
};

export default VoiceRecorder;
