import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  IconButton,
} from "@mui/material";
import { MicNone, Stop, Clear } from "@mui/icons-material";
// We're now using direct fetch calls instead of the SpeechService
// import { convertSpeechToText } from "../services/SpeechService";

// --- Interfaces remain the same ---
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
  onstart?: () => void;
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
  onSpeechRecognized?: (transcript: string) => void; // Callback for partial/final transcripts
  language: string;
  disabled?: boolean;
}

// Increase Finnish processing interval to collect more data
const FINNISH_PROCESSING_INTERVAL_MS = 10000; // Increase to 10 seconds to collect more audio
// Define a larger chunk size for Finnish processing (100KB)
const FINNISH_CHUNK_SIZE = 100000; // 100KB chunk size for better processing

const SimpleVoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onAudioRecorded,
  onSpeechRecognized,
  language,
  disabled = false,
}) => {
  // Basic state
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState(""); // Finalized transcript
  const [interimTranscript, setInterimTranscript] = useState(""); // Browser's interim transcript
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [browserRecognitionActive, setBrowserRecognitionActive] =
    useState(false);
  const [restartCount, setRestartCount] = useState(0);

  // **NEW**: State for Finnish processing
  const [finnishChunks, setFinnishChunks] = useState<Blob[]>([]); // Store Finnish audio chunks
  const [processingServerRequest, setProcessingServerRequest] = useState(false); // Prevent overlap

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]); // Stores ALL chunks for final blob
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null); // For browser recognition
  const isRecordingRef = useRef<boolean>(false); // Reference to track recording state
  // Add a ref to store Finnish chunks directly, bypassing React state batching
  const finnishChunksRef = useRef<Blob[]>([]);

  // **NEW**: Ref for Finnish processing timer
  const finnishRecognitionTimerRef = useRef<ReturnType<
    typeof setInterval
  > | null>(null);

  // Function to clear the transcript
  const clearTranscript = () => {
    setTranscript("");
    setInterimTranscript("");
    setRestartCount(0);
    setRecordingTime(0);
    setFinnishChunks([]); // Clear Finnish chunks too
    if (onSpeechRecognized) {
      onSpeechRecognized(""); // Notify parent that transcript is cleared
    }
  };

  // Function to restart speech recognition (for browser API)
  const restartSpeechRecognition = (): boolean => {
    if (!isRecording || !browserRecognitionActive) return false; // Only restart if browser was active

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return false;

    // Avoid restarting if a recognition instance is already running or being created
    if (recognitionRef.current) {
      console.log(
        "🔄 Restart blocked: Recognition already exists or starting."
      );
      return false;
    }

    try {
      console.log(
        `🔄 RESTART #${
          restartCount + 1
        }: Creating new speech recognition instance`
      );

      const newRecognition = new SpeechRecognition();
      recognitionRef.current = newRecognition; // Set ref immediately to block concurrent restarts

      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      newRecognition.lang = language;

      newRecognition.onresult = (event) => {
        let finalTranscriptPart = "";
        let currentInterimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0].transcript;

          if (result.isFinal) {
            finalTranscriptPart += transcriptText + " "; // Add space between final parts
          } else {
            currentInterimTranscript = transcriptText; // Only the latest interim
          }
        }

        setInterimTranscript(currentInterimTranscript);

        if (finalTranscriptPart) {
          console.log(
            `🔄 Final part from restart: "${finalTranscriptPart.trim()}"`
          );
          // Append to existing transcript
          setTranscript((prev) =>
            (prev ? prev + finalTranscriptPart : finalTranscriptPart).trim()
          );
          if (onSpeechRecognized) {
            onSpeechRecognized(finalTranscriptPart.trim()); // Send only the new part
          }
          setInterimTranscript(""); // Clear interim once a final part is received
        }
      };

      newRecognition.onerror = (event) => {
        console.warn(`🔄 Restarted recognition error: ${event.error}`, event);
        recognitionRef.current = null; // Clear ref on error
        // Optionally try restarting again after a delay on certain errors?
      };

      newRecognition.onend = () => {
        console.log(`🔄 RESTART #${restartCount + 1}: Recognition ended.`);
        const wasActiveRecognition = recognitionRef.current === newRecognition;
        recognitionRef.current = null; // Clear the ref

        if (wasActiveRecognition && isRecording) {
          setRestartCount((prev) => prev + 1);
          console.log(
            `🔄 RESTART #${restartCount + 1}: Scheduling next restart attempt.`
          );
          // Use a small, increasing delay to prevent hammering?
          setTimeout(() => {
            if (isRecording && !recognitionRef.current) {
              // Check again before restarting
              restartSpeechRecognition();
            }
          }, 500 + restartCount * 100); // e.g., 500ms, 600ms, 700ms...
        }
      };

      newRecognition.onstart = () => {
        console.log(
          `🔄 RESTART #${restartCount + 1}: Recognition started successfully`
        );
      };

      console.log(`🔄 RESTART #${restartCount + 1}: Calling start()...`);
      newRecognition.start();

      return true;
    } catch (err) {
      console.error(
        `🔄 RESTART #${restartCount + 1}: Failed to restart recognition:`,
        err
      );
      recognitionRef.current = null; // Clear ref on failure
      return false;
    }
  };

  // **NEW/MODIFIED**: Function to process Finnish speech recognition periodically
  const processFinnishSpeechRecognition = async () => {
    console.log(
      `🇫🇮 Processing Finnish speech recognition. isRecording: ${isRecordingRef.current}`
    );

    if (!isRecordingRef.current) {
      console.log("🇫🇮 Not recording, skip processing");
      return;
    }

    // Check if we have chunks to process - use the ref instead of state
    if (finnishChunksRef.current.length === 0) {
      console.log("🇫🇮 No chunks to process, skipping");
      return;
    }

    // Don't clear chunks immediately - we need to accumulate more data
    // We'll use a copy of the current chunks for processing
    const currentChunks = [...finnishChunksRef.current];
    console.log(`🇫🇮 Processing ${currentChunks.length} accumulated chunks`);

    // Use the same MIME type as the recorder for consistency
    const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
    console.log(`🇫🇮 Using recorder's MIME type: ${mimeType} for blob creation`);

    // Create a blob with ALL accumulated chunks
    const audioBlob = new Blob(currentChunks, { type: mimeType });

    // Update UI state to show processing
    setProcessingServerRequest(true);

    try {
      // Log the size of the blob for debugging
      const blobSizeKB = Math.round(audioBlob.size / 1024);
      console.log(
        `🇫🇮 Sending audio blob of size: ${audioBlob.size} bytes (${blobSizeKB} KB)`
      );
      console.log(
        `🇫🇮 Accumulated chunks: ${currentChunks.length}, MIME type: ${mimeType}`
      );

      // Calculate the total duration based on chunk collection rate (approx)
      const estimatedDurationSec = currentChunks.length * 0.5; // 500ms per chunk
      console.log(
        `🇫🇮 Estimated audio duration: ~${estimatedDurationSec.toFixed(
          1
        )} seconds`
      );

      // Always try to process audio regardless of length - the server will decide
      console.log("🇫🇮 Processing audio of any length to test server response");

      // Create a proper FormData object with filename specifically set
      // Use the correct extension based on the MIME type
      const fileExtension = mimeType.includes("wav") ? "wav" : "webm";
      const filename = `recording.${fileExtension}`;

      const formData = new FormData();
      formData.append("file", audioBlob, filename);
      formData.append("optimize", "false");
      formData.append("priority", "accuracy");
      formData.append("chunk_size", FINNISH_CHUNK_SIZE.toString()); // Use larger chunk size for Finnish

      console.log(
        `🇫🇮 Created FormData with filename: ${filename} for server processing with chunk_size: ${FINNISH_CHUNK_SIZE}`
      );

      // Enhanced debugging for server request
      console.log(
        "🇫🇮 Sending request to http://localhost:8008/api/speech-to-text/fi"
      );
      console.log(
        `🇫🇮 Audio blob type: ${audioBlob.type}, size: ${audioBlob.size}`
      );

      // Call the API with "fi-FI" language code - use FormData directly
      const response = await fetch(
        "http://localhost:8008/api/speech-to-text/fi",
        {
          method: "POST",
          body: formData,
        }
      ).then((res) => {
        console.log(`🇫🇮 Response status: ${res.status}`);
        // Log response headers for more detailed debugging
        const headers = {};
        res.headers.forEach((value, key) => {
          headers[key] = value;
        });
        console.log(`🇫🇮 Response headers:`, headers);
        return res.json();
      });

      // Process the response
      console.log("🇫🇮 Speech recognition response:", response);

      // IMPORTANT: REMOVED check for "too short" error - always process response and continue
      // Always include any transcript regardless of content
      if (response && response.transcript) {
        console.log(`🇫🇮 Received transcription: "${response.transcript}"`);

        // If we got any transcription (even error message), we'll treat it as text
        // This allows us to see the actual server response in the UI
        const transcriptText = response.transcript.trim();

        // Always continue accumulating chunks regardless of response
        // This ensures we have enough audio data for the server to process
        console.log(`🇫🇮 Continuing to accumulate chunks for better audio quality`);
        
        // Only clear chunks if we got a useful transcript that's not an error message
        // and we have accumulated a significant amount of audio (at least 30 chunks - about 15 seconds)
        if (
          transcriptText &&
          transcriptText !== "Äänitiedosto on liian lyhyt." &&
          finnishChunksRef.current.length > 30
        ) {
          console.log(`🇫🇮 Got useful transcript and have enough chunks, clearing chunks`);
          finnishChunksRef.current = [];
          setFinnishChunks([]);
        }

        // Only append meaningful transcripts to the existing one
        setTranscript((prevTranscript) => {
          // Skip error messages and empty responses
          if (
            !transcriptText || 
            transcriptText === "Äänitiedosto on liian lyhyt." ||
            transcriptText.trim() === ""
          ) {
            console.log(`🇫🇮 Got empty or error message, not adding to transcript`);
            return prevTranscript;
          }

          console.log(`🇫🇮 Adding valid transcript: "${transcriptText}"`);
          const combined = prevTranscript
            ? `${prevTranscript} ${transcriptText}`
            : transcriptText;

          // Notify parent if callback exists
          if (onSpeechRecognized) {
            onSpeechRecognized(transcriptText);
          }

          return combined;
        });
      }
    } catch (error) {
      console.error("🇫🇮 Error in Finnish speech recognition:", error);
    } finally {
      setProcessingServerRequest(false);
    }
  };

  // Handle data available from MediaRecorder
  const handleDataAvailable = (event: BlobEvent) => {
    // Skip empty chunks
    if (event.data.size === 0) return;

    const chunk = event.data;
    console.log(`Received audio chunk of size: ${chunk.size} bytes`);

    // Always add to main chunks for final audio blob
    audioChunksRef.current.push(chunk);

    // For Finnish, also add to the Finnish specific chunks
    if (language.toLowerCase().startsWith("fi") && isRecordingRef.current) {
      console.log("🇫🇮 Adding chunk to Finnish chunks");
      // Add to the ref directly for processing
      finnishChunksRef.current.push(chunk);
      // Also update state for UI purposes
      setFinnishChunks((prevChunks) => [...prevChunks, chunk]);
    }
  };

  // Start recording function
  const startRecording = async () => {
    // --- Reset state (mostly unchanged) ---
    setError(null);
    setIsLoading(true);
    setTranscript("");
    setInterimTranscript("");
    setAudioURL(null); // Clear previous recording URL
    audioChunksRef.current = [];
    setBrowserRecognitionActive(false);
    setRestartCount(0); // Reset restart counter

    // **NEW**: Reset Finnish specific state
    setFinnishChunks([]);
    finnishChunksRef.current = []; // Clear ref too
    setProcessingServerRequest(false);
    if (finnishRecognitionTimerRef.current) {
      clearInterval(finnishRecognitionTimerRef.current);
      finnishRecognitionTimerRef.current = null;
    }
    // Make sure any existing browser recognition is stopped before starting new
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Error stopping previous recognition:", e);
      }
      recognitionRef.current = null;
    }

    console.log(`Starting recording for language: ${language}`);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // IMPORTANT: For proper Finnish audio recordings, use the correct audio format
      // We'll use WebM with PCM codec which works better with FFmpeg processing
      let options = { mimeType: "audio/webm" }; // Default basic WebM

      // Option priority for Finnish recording
      const priorityTypes = [
        "audio/webm", // Basic WebM, best compatibility
        "audio/webm;codecs=pcm", // PCM audio in WebM container
        "audio/webm;codecs=opus", // Opus audio in WebM container
        "audio/ogg", // Ogg container
        "audio/mp4", // MP4 container
      ];

      // Find the best supported option
      let bestType: string | null = null;
      for (const type of priorityTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          bestType = type;
          console.log(`Found supported audio format: ${type}`);
          // Don't break, continue to find the highest priority type
        }
      }

      if (bestType) {
        options = { mimeType: bestType };
        console.log(`Using MediaRecorder with mimeType: ${bestType}`);
      } else {
        console.warn(
          "No preferred audio format supported, using browser default"
        );
      }

      // Also set audio quality and bitrate for better results
      if (language.toLowerCase().startsWith("fi")) {
        // For Finnish, explicitly use PCM WAV format which is guaranteed to work with FFmpeg
        // Try several format options that are best for speech processing
        if (MediaRecorder.isTypeSupported("audio/wav")) {
          options = { mimeType: "audio/wav" };
          console.log("🇫🇮 Using WAV format for Finnish (best compatibility)");
        } else if (MediaRecorder.isTypeSupported("audio/webm;codecs=pcm")) {
          options = { mimeType: "audio/webm;codecs=pcm" };
          console.log("🇫🇮 Using WebM with PCM codec for Finnish");
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          options = { mimeType: "audio/webm" };
          console.log("🇫🇮 Using standard WebM format for Finnish");
        }

        // Add more detailed logging about format for debugging
        console.log(`🇫🇮 Final audio format selected: ${options.mimeType}`);
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      // Update isRecordingRef before starting recorder
      isRecordingRef.current = true;
      recorder.ondataavailable = handleDataAvailable;

      // Start recording with smaller time slices to get more frequent chunks
      // This helps with continuous processing, especially for Finnish
      recorder.start(200); // Get chunks every 200ms instead of 500ms for more granular data

      recorder.onstop = async () => {
        console.log("MediaRecorder stopped");
        // Update isRecordingRef
        isRecordingRef.current = false;

        // Combine ALL collected chunks for the final audio file
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        // Log more detailed information about the final audio blob
        console.log(
          `Final audio blob created: ${audioBlob.size} bytes, type: ${audioBlob.type}`
        );

        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        // Final transcript depends on the method used
        let finalTranscript = "";

        if (language.toLowerCase().startsWith("fi")) {
          // For Finnish, the `transcript` state holds the accumulated server results
          // Wait a moment to allow any final processing to complete
          if (finnishChunksRef.current.length > 0) {
            console.log(
              `🇫🇮 Found ${finnishChunksRef.current.length} remaining chunks in onstop handler`
            );
            try {
              // Check if we have enough data to process
              if (finnishChunksRef.current.length < 10) {
                console.log(`🇫🇮 Not enough final chunks (${finnishChunksRef.current.length} < 10), skipping final processing`);
                return;
              }
              
              console.log(
                `🇫🇮 Processing final ${finnishChunksRef.current.length} chunks`
              );

              // Create a blob with all chunks for final processing
              // Use the correct MIME type from the recorder
              const mimeType = recorder.mimeType || "audio/webm";
              const fileExtension = mimeType.includes("wav") ? "wav" : "webm";
              const finalBlob = new Blob(finnishChunksRef.current, {
                type: mimeType,
              });

              const blobSizeKB = Math.round(finalBlob.size / 1024);
              console.log(
                `🇫🇮 Processing final audio blob of size: ${finalBlob.size} bytes (${blobSizeKB} KB), type: ${mimeType}`
              );

              // Call the API directly here with explicit filename
              const formData = new FormData();
              formData.append("file", finalBlob, `recording.${fileExtension}`);
              formData.append("optimize", "false");
              formData.append("priority", "accuracy");
              formData.append("chunk_size", FINNISH_CHUNK_SIZE.toString()); // Use larger chunk size

              console.log(
                `🇫🇮 Final FormData created with filename: recording.${fileExtension} and chunk_size: ${FINNISH_CHUNK_SIZE}`
              );

              try {
                // Send directly to server with fetch for better control
                console.log("🇫🇮 Sending final request to server");
                const finalResponse = await fetch(
                  "http://localhost:8008/api/speech-to-text/fi",
                  {
                    method: "POST",
                    body: formData,
                  }
                ).then(async (res) => {
                  console.log(`🇫🇮 Final response status: ${res.status}`);
                  // Log response headers
                  const headers = {};
                  res.headers.forEach((value, key) => {
                    headers[key] = value;
                  });
                  console.log("🇫🇮 Response headers:", headers);
                  return res.json();
                });

                console.log("🇫🇮 Final API response:", finalResponse);

                // Always accept any transcript, just avoid the "too short" error message
                if (
                  finalResponse &&
                  finalResponse.transcript &&
                  finalResponse.transcript !== "Äänitiedosto on liian lyhyt." &&
                  finalResponse.transcript.trim() !== ""
                ) {
                  // Append to transcript
                  setTranscript((prev) =>
                    prev
                      ? `${prev} ${finalResponse.transcript.trim()}`
                      : finalResponse.transcript.trim()
                  );
                }
              } catch (apiError) {
                console.error("🇫🇮 Error in final API call:", apiError);
              }
            } catch (e) {
              console.error("🇫🇮 Error processing final chunks:", e);
            }
          }

          // Use whatever transcript we have at this point
          finalTranscript = transcript;
        } else {
          // For browser recognition, combine final + last interim
          finalTranscript = (transcript + " " + interimTranscript).trim();
        }

        console.log(`Final transcript on stop: "${finalTranscript}"`);

        onAudioRecorded(audioBlob, finalTranscript);

        // Clean up stream
        stream.getTracks().forEach((track) => track.stop());

        setIsLoading(false);
        setIsRecording(false);
        setInterimTranscript(""); // Clear interim after stopping
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setRecordingTime(0); // Reset timer display
      };

      // Start recording timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      setIsRecording(true); // Update React state
      setIsLoading(false);
      console.log(`Checking language strategy. Language is: "${language}"`);
      // Select recognition strategy based on language
      if (language.toLowerCase().startsWith("en")) {
        // Assuming English uses browser API
        console.log("Attempting to start browser speech recognition...");
        const recognitionStarted = startBrowserSpeechRecognition();
        setBrowserRecognitionActive(recognitionStarted);
        if (!recognitionStarted) {
          console.warn("Browser speech recognition could not be started.");
          // Optional: Fallback or display message
        }
      } else if (language.toLowerCase().startsWith("fi")) {
        // **NEW**: Start periodic processing for Finnish
        console.log(
          `🇫🇮 Setting up Finnish server-side speech recognition (interval: ${FINNISH_PROCESSING_INTERVAL_MS}ms)`
        );
        // Clear any existing timer just in case
        if (finnishRecognitionTimerRef.current) {
          clearInterval(finnishRecognitionTimerRef.current);
        }

        // Create a function to handle timing of Finnish processing
        const runFinnishProcessing = () => {
          console.log("🇫🇮 Running scheduled Finnish processing");

          // Log current chunks for debugging
          console.log(
            `🇫🇮 Current Finnish chunks in ref: ${finnishChunksRef.current.length}`
          );
          console.log(
            `🇫🇮 Current Finnish chunks in state: ${finnishChunks.length}`
          );

          // Only process if we have chunks and are still recording
          if (finnishChunksRef.current.length > 0 && isRecordingRef.current) {
            // Require a minimum number of chunks before attempting processing
            // This helps avoid the "Audio file too short" error
            if (finnishChunksRef.current.length >= 10) {
              processFinnishSpeechRecognition();
            } else {
              console.log(`🇫🇮 Not enough chunks yet (${finnishChunksRef.current.length}/10), waiting for more data`);
            }
          } else {
            console.log("🇫🇮 Skipping processing - no chunks or not recording");
          }
        };

        // Process after a much longer initial delay to collect sufficient audio
        setTimeout(() => {
          if (isRecordingRef.current) {
            console.log(
              "🇫🇮 Initial processing call (after collecting initial audio)"
            );
            runFinnishProcessing();
          }
        }, 8000); // Give it 8 seconds to collect initial audio

        // Start the interval timer for regular processing
        finnishRecognitionTimerRef.current = setInterval(() => {
          console.log(
            `🇫🇮 Timer interval fired (${FINNISH_PROCESSING_INTERVAL_MS}ms).`
          );
          runFinnishProcessing();
        }, FINNISH_PROCESSING_INTERVAL_MS); // Use the defined constant
      } else {
        console.log(
          `No specific real-time recognition strategy for language: ${language}. Recording audio only.`
        );
      }

      // Add mediaRecorder diagnostic information
      console.log("🎙️ MediaRecorder info:", {
        mimeType: recorder.mimeType,
        state: recorder.state,
        audioBitsPerSecond: recorder.audioBitsPerSecond,
        videoBitsPerSecond: recorder.videoBitsPerSecond,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Error starting recording:", errorMessage);
      setError(
        `Could not access microphone or start recording: ${errorMessage}`
      );
      setIsLoading(false);
      // Ensure cleanup if start fails midway
      isRecordingRef.current = false; // Update ref
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
      setIsRecording(false); // Ensure state reflects failure
      if (timerRef.current) clearInterval(timerRef.current);
      if (finnishRecognitionTimerRef.current)
        clearInterval(finnishRecognitionTimerRef.current);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;

    console.log("Stopping recording...");
    setIsLoading(true); // Indicate processing might occur

    // **IMPORTANT**: Process any Finnish chunks *BEFORE* setting isRecordingRef to false
    // This ensures the final processing works correctly
    if (
      language.toLowerCase().startsWith("fi") &&
      finnishChunksRef.current.length > 0
    ) {
      console.log(
        `🇫🇮 Processing final Finnish chunks (count: ${finnishChunksRef.current.length}) before stopping...`
      );
      // Call this immediately without waiting for timer
      processFinnishSpeechRecognition();
    }

    // Update isRecordingRef to false AFTER attempting to process final chunks
    isRecordingRef.current = false;

    // **MODIFIED**: Stop Finnish recognition timer if active
    if (finnishRecognitionTimerRef.current) {
      console.log("🇫🇮 Clearing Finnish processing timer.");
      clearInterval(finnishRecognitionTimerRef.current);
      finnishRecognitionTimerRef.current = null;
    }

    // Stop browser speech recognition if running
    if (recognitionRef.current) {
      try {
        console.log("Stopping browser speech recognition");
        recognitionRef.current.stop(); // This will trigger its 'onend' handler
      } catch (err) {
        console.warn("Error stopping speech recognition:", err);
      }
      // recognitionRef.current = null; // Let the onend handler clear this
    }

    // Stop MediaRecorder (this will trigger recorder.onstop)
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      console.log("Calling MediaRecorder.stop()");
      mediaRecorderRef.current.stop();
    } else {
      console.log("MediaRecorder already stopped or inactive.");
      // If already stopped, manually trigger cleanup logic normally in onstop
      setIsLoading(false);
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setRecordingTime(0);
    }

    // No need to update IsLoading here, recorder.onstop will handle it
  };

  // Start browser speech recognition (for English or compatible languages)
  const startBrowserSpeechRecognition = (): boolean => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser");
      return false;
    }

    // Defensive check: Don't start if already running
    if (recognitionRef.current) {
      console.warn(
        "Browser recognition start blocked: instance already exists."
      );
      return true; // Or false? Arguably it's 'active' if one exists.
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition; // Set ref immediately

      recognition.continuous = true; // Keep listening even after pauses
      recognition.interimResults = true; // Get results as they come
      recognition.lang = language; // Set the language

      console.log(
        `Starting browser speech recognition for language: ${language}`
      );

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscriptPart = "";
        let currentInterimTranscript = ""; // Store only the latest interim

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptPart += event.results[i][0].transcript + " "; // Append final results
          } else {
            currentInterimTranscript = event.results[i][0].transcript; // Update interim result
          }
        }

        // Update the interim transcript state for display
        setInterimTranscript(currentInterimTranscript);

        // If we received a final part, append it to the main transcript
        if (finalTranscriptPart) {
          console.log(`Browser final part: "${finalTranscriptPart.trim()}"`);
          setTranscript((prev) =>
            (prev ? prev + finalTranscriptPart : finalTranscriptPart).trim()
          );
          if (onSpeechRecognized) {
            onSpeechRecognized(finalTranscriptPart.trim()); // Send only the new part
          }
          setInterimTranscript(""); // Clear interim display after getting a final part
        }
      };

      recognition.onerror = (event: SpeechRecognitionError) => {
        console.warn(
          `Browser speech recognition error: ${event.error}`,
          event.message
        );
        if (event.error === "no-speech") {
          console.log("Browser detected no speech.");
          // No need to restart immediately for 'no-speech', it might just be silence.
          // The 'onend' handler will manage restarts if needed.
        } else if (event.error === "network") {
          setError("Network error during speech recognition.");
        } else if (event.error === "audio-capture") {
          setError("Microphone error during speech recognition.");
        } else if (event.error === "not-allowed") {
          setError("Microphone permission denied for speech recognition.");
        }
        // Allow 'onend' to handle cleanup/restart logic
        recognitionRef.current = null; // Clear ref on error
      };

      recognition.onend = () => {
        console.log("Browser speech recognition service ended.");
        const wasActiveRecognition = recognitionRef.current === recognition;
        recognitionRef.current = null; // Clear the ref

        // If we are still supposed to be recording, attempt a restart
        if (wasActiveRecognition && isRecording) {
          console.log(
            "Attempting to restart browser recognition due to auto-end."
          );
          // Reset count for a fresh restart sequence after natural end
          setRestartCount(0);
          setTimeout(() => {
            if (isRecording && !recognitionRef.current) {
              // Check state again before restarting
              restartSpeechRecognition();
            }
          }, 500); // Delay before restart
        }
      };

      recognition.onstart = () => {
        console.log("🎙️ Browser speech recognition started successfully");
        setBrowserRecognitionActive(true); // Confirm it started
      };

      console.log("Calling recognition.start()...");
      recognition.start();

      return true; // Indicate success
    } catch (err) {
      console.error("❌ Error starting browser speech recognition:", err);
      setError(
        `Failed to start speech recognition: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      recognitionRef.current = null; // Ensure ref is clear on error
      return false; // Indicate failure
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
      console.log(
        "SimpleVoiceRecorder unmounting - cleaning up timers and refs"
      );
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // **MODIFIED**: Clear Finnish timer on unmount
      if (finnishRecognitionTimerRef.current) {
        clearInterval(finnishRecognitionTimerRef.current);
      }
      // Stop MediaRecorder if active
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn("Error stopping MediaRecorder on unmount:", e);
        }
      }
      // Stop browser recognition if active
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Error stopping Recognition on unmount:", e);
        }
        recognitionRef.current = null;
      }
      // Release microphone stream if held by recorder
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
        console.log("Microphone stream released on unmount.");
      }
    };
  }, []); // Empty dependency array means this runs only on mount and unmount

  // Add a utility function to check server status
  const checkServerStatus = async () => {
    try {
      console.log("🔍 Checking speech server status...");
      const response = await fetch("http://localhost:8008/health");
      const serverInfo = await response.json();
      console.log("📊 Server status:", serverInfo);

      // Check speech compatibility
      const langResponse = await fetch(
        "http://localhost:8008/api/supported-languages"
      );
      const languages = await langResponse.json();
      console.log("🌐 Supported languages:", languages);

      // Find Finnish support
      const finnishSupport = languages.find((lang) => lang.code === "fi-FI");
      if (finnishSupport) {
        console.log("🇫🇮 Finnish support info:", finnishSupport);
      }

      return serverInfo;
    } catch (error) {
      console.error("❌ Error checking server status:", error);
      return null;
    }
  };

  // Check server status on mount
  useEffect(() => {
    if (language.toLowerCase().startsWith("fi")) {
      checkServerStatus();
    }
  }, [language]);

  // Render the component
  return (
    <Box sx={{ mb: 2 }}>
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
          Error: {error}
        </Typography>
      )}

      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}
      >
        <Button
          variant="contained"
          color={isRecording ? "secondary" : "primary"}
          startIcon={isRecording ? <Stop /> : <MicNone />}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isLoading} // isLoading handles start/stop transitions
          sx={{ minWidth: "130px" }} // Ensure button size is consistent
        >
          {isLoading && !isRecording ? ( // Loading before recording starts
            <CircularProgress size={24} color="inherit" />
          ) : isRecording ? (
            // Show loading indicator briefly when stopping if processing takes time
            isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              `Stop (${formatTime(recordingTime)})`
            )
          ) : (
            "Record"
          )}
        </Button>

        {/* Clear button only if there's a transcript or interim */}
        {(transcript || interimTranscript) && !isRecording && (
          <IconButton
            onClick={clearTranscript}
            aria-label="Clear transcript"
            color="default" // Use default color, maybe style differently
            size="small"
            title="Clear transcript"
          >
            <Clear />
          </IconButton>
        )}

        {/* Audio player appears only after recording stops and URL is ready */}
        {audioURL && !isRecording && (
          <audio src={audioURL} controls style={{ marginLeft: "auto" }} />
        )}
      </Box>

      {/* Transcript display area */}
      {/* Show transcript area even while recording if language is Finnish or browser recognition is active */}
      {(isRecording || transcript || interimTranscript) && (
        <Box
          sx={{
            mt: 2,
            p: 1.5, // Slightly less padding
            border: 1, // Add a border
            borderColor: "divider", // Use theme's divider color
            borderRadius: 1,
            minHeight: "4em", // Ensure minimum height
            bgcolor: "action.hover", // Subtle background
          }}
        >
          {/* Final Transcript */}
          {transcript && (
            <Typography
              variant="body1"
              sx={{ mb: interimTranscript ? 0.5 : 0 }}
            >
              {transcript}
            </Typography>
          )}

          {/* Interim Transcript (Browser only) */}
          {interimTranscript && (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", fontStyle: "italic" }}
            >
              {interimTranscript}
            </Typography>
          )}

          {/* **NEW**: Finnish processing indicator */}
          {language.toLowerCase().startsWith("fi") && isRecording && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
              {processingServerRequest && (
                <CircularProgress size={16} thickness={5} />
              )}
              <Typography
                variant="caption"
                sx={{ color: "text.disabled" }} // More subtle color
              >
                {processingServerRequest ? "Processing..." : "Listening..."}
                {/* Optionally show pending chunk count */}
                {/* {finnishChunks.length > 0 ? ` (${finnishChunks.length} pending)`: ''} */}
              </Typography>
            </Box>
          )}

          {/* Show if browser recognition is active but no text yet */}
          {!transcript &&
            !interimTranscript &&
            isRecording &&
            browserRecognitionActive && (
              <Typography
                variant="body2"
                sx={{ color: "text.disabled", fontStyle: "italic" }}
              >
                Listening... (Browser)
              </Typography>
            )}

          {/* Show if recording but no recognition method is active */}
          {!transcript &&
            !interimTranscript &&
            isRecording &&
            !browserRecognitionActive &&
            !language.toLowerCase().startsWith("fi") && (
              <Typography
                variant="body2"
                sx={{ color: "text.disabled", fontStyle: "italic" }}
              >
                Recording audio...
              </Typography>
            )}
        </Box>
      )}
    </Box>
  );
};

export default SimpleVoiceRecorder;
