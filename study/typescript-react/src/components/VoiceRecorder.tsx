import React, { useState, useRef, useEffect } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { MicNone, Stop } from "@mui/icons-material";

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
  disabled = false
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

  const startRecording = async () => {
    try {
      setError(null);
      setIsLoading(true);
      setTranscript("");
      setServerTranscript("");
      audioChunksRef.current = [];

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
        console.log("MediaRecorder stopped");
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm"
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        // Transcribe using server
        const serverResult = await transcribeAudio(audioBlob);
        setServerTranscript(serverResult);

        // Pass both audio and transcript to parent (choose server or browser transcript)
        onAudioRecorded(audioBlob, serverResult); // Using server transcript here

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

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;

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
          setTranscript((prev) =>
            prev ? `${prev} ${finalTranscript}` : finalTranscript
          );
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

  function getTranscriptionEndpoint(language: string) {
    const langPrefix = language.split("-")[0].toLowerCase();
    if (langPrefix === "fi") {
      return "/api/speech-to-text/fi";
    } else if (langPrefix === "en") {
      return "/api/speech-to-text/en";
    } else {
      return "/api/speech-to-text";
    }
  }

  async function transcribeAudio(file: Blob) {
    const endpoint = getTranscriptionEndpoint(language);
    const formData = new FormData();
    formData.append("file", file);
    if (endpoint === "/api/speech-to-text") {
      formData.append("language", language);
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      return data.transcript || "Transcription failed";
    } catch (error) {
      console.error("API request failed:", error);
      return "An error occurred during transcription.";
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
          Browser Transcript: {transcript}
        </Typography>
      )}
      {serverTranscript && (
        <Typography
          variant="body1"
          sx={{ mt: 2, p: 2, bgcolor: "rgba(0, 0, 0, 0.05)", borderRadius: 1 }}
        >
          Server Transcript: {serverTranscript}
        </Typography>
      )}
    </Box>
  );
};

export default VoiceRecorder;
