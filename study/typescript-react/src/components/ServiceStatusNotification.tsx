import React, { useEffect, useState, useCallback } from "react";
import { API_URL } from "../services/LanguageService";
import "../styles/ServiceStatusNotification.css";

interface ServiceStatusProps {
  onStatusChange?: (isAvailable: boolean) => void;
}

const ServiceStatusNotification: React.FC<ServiceStatusProps> = ({
  onStatusChange
}) => {
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [details, setDetails] = useState<string>("");

  const serviceUrl = API_URL; // Using the same API_URL from LanguageService
  const alternativeUrl = "http://localhost:8008"; // Direct Python server URL

  // Helper to write strings to DataView
  const writeString = (
    view: DataView,
    offset: number,
    string: string
  ): void => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // Helper to convert AudioBuffer to WAV blob
  const audioBufferToWav = useCallback((buffer: AudioBuffer): Promise<Blob> => {
    return new Promise((resolve) => {
      const length = buffer.length * buffer.numberOfChannels * 2;
      const view = new DataView(new ArrayBuffer(44 + length));

      // RIFF chunk descriptor
      writeString(view, 0, "RIFF");
      view.setUint32(4, 36 + length, true);
      writeString(view, 8, "WAVE");

      // FMT sub-chunk
      writeString(view, 12, "fmt ");
      view.setUint32(16, 16, true); // subchunk size
      view.setUint16(20, 1, true); // PCM format
      view.setUint16(22, buffer.numberOfChannels, true);
      view.setUint32(24, buffer.sampleRate, true);
      view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true); // byte rate
      view.setUint16(32, buffer.numberOfChannels * 2, true); // block align
      view.setUint16(34, 16, true); // bits per sample

      // Data sub-chunk
      writeString(view, 36, "data");
      view.setUint32(40, length, true);

      // Write PCM samples
      const data = new Float32Array(buffer.getChannelData(0));
      let offset = 44;
      for (let i = 0; i < data.length; i++) {
        const sample = Math.max(-1, Math.min(1, data[i]));
        view.setInt16(
          offset,
          sample < 0 ? sample * 0x8000 : sample * 0x7fff,
          true
        );
        offset += 2;
      }

      // Create blob
      const blob = new Blob([view], { type: "audio/wav" });
      resolve(blob);
    });
  }, []);

  // Test sending a specific format to the server
  const testSendFormat = async (
    blob: Blob,
    mimeType: string,
    formatName: string
  ) => {
    try {
      console.log(`Testing ${formatName} format compatibility...`);

      const formData = new FormData();
      formData.append(
        "file",
        blob,
        `test_${Date.now()}.${formatName.toLowerCase()}`
      );
      formData.append("language", "en");

      const response = await fetch(`${alternativeUrl}/api/speech-to-text`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`${formatName} test result:`, result);
        setDetails((prev) => `${prev}\n${formatName} format: Compatible`);
        return true;
      } else {
        console.error(
          `${formatName} test failed with status:`,
          response.status
        );
        setDetails((prev) => `${prev}\n${formatName} format: Incompatible`);
        return false;
      }
    } catch (error) {
      console.error(`${formatName} test error:`, error);
      setDetails(
        (prev) =>
          `${prev}\n${formatName} format: Error - ${
            error instanceof Error ? error.message : String(error)
          }`
      );
      return false;
    }
  };

  // Test MediaRecorder format
  const testMediaRecorderFormat = useCallback(async (mimeType: string) => {
    try {
      // Create a simple stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create recorder with the specified format
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      // Set up promise to wait for data
      const dataPromise = new Promise<Blob>((resolve) => {
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          resolve(blob);
        };
      });

      // Record for 500ms
      recorder.start();
      await new Promise((resolve) => setTimeout(resolve, 500));
      recorder.stop();

      // Wait for data and clean up
      const blob = await dataPromise;
      stream.getTracks().forEach((track) => track.stop());

      console.log(`Created ${mimeType} blob: ${blob.size} bytes`);

      // Test sending to server
      const formatName = mimeType.includes("opus") ? "WebM+Opus" : "WebM";
      await testSendFormat(blob, mimeType, formatName);
    } catch (error) {
      console.error(`MediaRecorder ${mimeType} test failed:`, error);
      setDetails(
        (prev) =>
          `${prev}\n${mimeType}: Not supported - ${
            error instanceof Error ? error.message : String(error)
          }`
      );
    }
  }, []);

  // Test function to check audio format compatibility
  const testAudioFormat = useCallback(async () => {
    try {
      console.log("Testing audio format compatibility...");

      const audioContext = new AudioContext();
      const sampleRate = 16000;
      const duration = 1; // 1 second
      const buffer = audioContext.createBuffer(
        1,
        sampleRate * duration,
        sampleRate
      );

      const wavBlob = await audioBufferToWav(buffer);
      console.log(`Created test WAV blob: ${wavBlob.size} bytes`);

      await testSendFormat(wavBlob, "audio/wav", "WAV");

      if (MediaRecorder.isTypeSupported("audio/webm")) {
        await testMediaRecorderFormat("audio/webm");
      }

      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        await testMediaRecorderFormat("audio/webm;codecs=opus");
      }
    } catch (error) {
      console.error("Audio format test failed:", error);
      throw error;
    }
  }, [audioBufferToWav, testMediaRecorderFormat]);

  // Use useCallback to properly memoize the function
  const checkServiceStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const response = await fetch(`${serviceUrl}/api/speech/health`, {
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        const isHealthy = data.status === "healthy";
        setIsAvailable(isHealthy);
        if (onStatusChange) {
          onStatusChange(isHealthy);
        }

        // If primary health check fails, try the direct server
        if (!isHealthy) {
          try {
            // Try direct Python server health check
            const directResponse = await fetch(`${alternativeUrl}/health`, {
              method: "GET",
              signal: AbortSignal.timeout(2000) // 2 second timeout
            });

            if (directResponse.ok) {
              const directData = await directResponse.json();
              if (directData.status === "ok") {
                // The direct server is working but the proxy isn't
                setDetails(
                  "Direct speech server is available, but proxy is unavailable"
                );

                // Check if Whisper is working specifically
                if (directData.whisper_available) {
                  console.log("Whisper is available on the direct server");

                  // Try to diagnose format issues with test file
                  try {
                    await testAudioFormat();
                  } catch (formatError) {
                    console.error("Audio format test failed:", formatError);
                  }
                } else {
                  setDetails(
                    "Speech server is running but Whisper model is not available"
                  );
                }
              }
            }
          } catch (directError) {
            console.warn("Direct speech server check failed:", directError);
            setDetails("Both proxy and direct speech servers are unavailable");
          }
        }
      } else {
        setIsAvailable(false);
        if (onStatusChange) {
          onStatusChange(false);
        }
      }
    } catch (error) {
      console.error("Error checking service status:", error);
      setIsAvailable(false);
      if (onStatusChange) {
        onStatusChange(false);
      }
    } finally {
      setIsChecking(false);
      setLastChecked(new Date());
    }
  }, [serviceUrl, alternativeUrl, onStatusChange, testAudioFormat]);

  useEffect(() => {
    // Only call the health check once when component mounts
    checkServiceStatus();

    // No interval setup - we only check once on mount

    // No cleanup needed since we're not setting up an interval
  }, [checkServiceStatus]);

  if (isChecking && lastChecked === null) {
    return null; // Don't show anything during initial check
  }

  if (isAvailable) {
    return null; // Don't show anything when service is available
  }

  return (
    <div className="service-status-notification">
      <div className="service-status-content">
        <span className="service-status-icon">⚠️</span>
        <span className="service-status-message">
          The language service is currently unavailable. Some features may be
          limited.
          {details && (
            <div className="service-status-details">
              {details.split("\n").map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}
        </span>
        <button
          className="service-status-refresh"
          onClick={checkServiceStatus}
          disabled={isChecking}
        >
          {isChecking ? "Checking..." : "Retry"}
        </button>
      </div>
    </div>
  );
};

export default ServiceStatusNotification;
