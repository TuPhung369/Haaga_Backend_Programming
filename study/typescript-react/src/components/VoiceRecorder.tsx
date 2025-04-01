import React, { useState, useRef, useEffect } from "react";
import { Button, Box, Typography, LinearProgress } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import SendIcon from "@mui/icons-material/Send";

// Define a type for setTimeout/setInterval timers
type Timer = ReturnType<typeof setTimeout>;

interface VoiceRecorderProps {
  onAudioRecorded: (audioBlob: Blob) => void;
  language?: string;
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onAudioRecorded,
  language = "en-US",
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [hasRecording, setHasRecording] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<Timer | null>(null);

  // Clean up audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [audioUrl]);

  // Start recording function
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      setHasRecording(false);
      setAudioUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;

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
        setAudioUrl(url);
        setHasRecording(true);
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  // Stop recording function
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop all tracks on the stream
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());

      // Clear interval
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Send recording function
  const sendRecording = () => {
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      onAudioRecorded(audioBlob);
      setHasRecording(false);
    }
  };

  // Format time function
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mr: 1 }}>
          {isRecording
            ? "Recording..."
            : hasRecording
            ? "Recording complete"
            : "Ready to record"}
        </Typography>

        {isRecording && (
          <Typography variant="body2" color="error">
            {formatTime(recordingTime)}
          </Typography>
        )}
      </Box>

      {isRecording && <LinearProgress color="error" sx={{ mb: 2 }} />}

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {!isRecording && !hasRecording && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<MicIcon />}
            onClick={startRecording}
            disabled={disabled}
          >
            Start Recording
          </Button>
        )}

        {isRecording && (
          <Button
            variant="contained"
            color="error"
            startIcon={<StopIcon />}
            onClick={stopRecording}
          >
            Stop Recording
          </Button>
        )}

        {hasRecording && (
          <>
            <Button
              variant="contained"
              color="success"
              startIcon={<SendIcon />}
              onClick={sendRecording}
              disabled={disabled}
            >
              Send Recording
            </Button>

            <Button
              variant="outlined"
              color="primary"
              startIcon={<MicIcon />}
              onClick={startRecording}
              disabled={disabled}
            >
              Record Again
            </Button>
          </>
        )}
      </Box>

      {audioUrl && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Preview recording:
          </Typography>
          <audio src={audioUrl} controls />
          <Typography variant="caption" display="block" gutterBottom>
            Speaking: {language}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default VoiceRecorder;
