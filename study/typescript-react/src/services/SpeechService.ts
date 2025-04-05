/**
 * Service for handling speech-to-text and text-to-speech operations
 */

// API URL - using the absolute URL of the Spring Boot server as a proxy
const API_BASE_URI = import.meta.env.VITE_API_BASE_URI;

/**
 * Convert speech to text
 * @param audioBlob Audio blob to convert
 * @param language Language code (e.g., "fi-FI")
 * @returns Promise with the transcribed text
 */
export const convertSpeechToText = async (
  audioBlob: Blob,
  language: string = 'en-US'
): Promise<string> => {
  try {
    console.log(`🎤 [Speech-to-Text] Starting conversion for language: ${language}`);
    console.log(`🎤 [Speech-to-Text] Audio blob size: ${Math.round(audioBlob.size / 1024)} KB, type: ${audioBlob.type}`);

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    formData.append('language', language);

    console.log(`🎤 [Speech-to-Text] Sending request to ${API_BASE_URI}/api/speech/speech-to-text`);

    const response = await fetch(`${API_BASE_URI}/api/speech/speech-to-text`, {
      method: 'POST',
      body: formData,
    });

    console.log(`🎤 [Speech-to-Text] Response status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log(`🎤 [Speech-to-Text] Raw server response:`, data);

    if (data.transcript) {
      console.log(`🎤 [Speech-to-Text] Transcript received: "${data.transcript.substring(0, 100)}${data.transcript.length > 100 ? '...' : ''}"`);

      if (data.transcript.includes("simulated transcript")) {
        console.warn(`⚠️ [Speech-to-Text] WARNING: Received simulated transcript instead of actual transcription. The speech-to-text service appears to be returning placeholder data.`);
      }

      return data.transcript;
    } else if (data.error) {
      throw new Error(`Server error: ${data.error}`);
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error(`❌ [Speech-to-Text] Error:`, error);
    return "Error transcribing audio. Please try again.";
  }
};

/**
 * Convert text to speech
 * @param text Text to convert to speech
 * @param language Language code (e.g., "fi-FI")
 * @param voice Voice to use (e.g., "male", "female")
 * @returns Promise with the audio URL or base64 string
 */
export const convertTextToSpeech = async (
  text: string,
  language: string = 'en-US',
  voice: string = 'neutral'
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URI}/api/speech/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, language, voice }),
    });

    if (!response.ok) {
      throw new Error(`Text-to-Speech failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Check if response contains base64 audio data
    if (data.audio) {
      return `data:audio/mp3;base64,${data.audio}`;
    } else if (data.audioUrl) {
      return data.audioUrl;
    } else {
      throw new Error('No audio data received');
    }
  } catch (error) {
    console.error('Error converting text to speech:', error);
    // We can't generate fallback audio, so return null and let the caller handle it
    return '';
  }
};

/**
 * Play the audio from a base64 string or URL
 * @param audioData Base64 encoded audio or URL
 */
export const playAudio = (audioData: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(audioData);

      audio.onended = () => {
        resolve();
      };

      audio.onerror = (error) => {
        console.error('Error playing audio:', error);
        reject(error);
      };

      audio.play().catch((error) => {
        console.error('Error playing audio:', error);
        reject(error);
      });
    } catch (error) {
      console.error('Error creating audio element:', error);
      reject(error);
    }
  });
};

/**
 * Record audio from microphone
 * @param timeLimit Maximum recording time in milliseconds (default: 10 seconds)
 * @returns Promise with the recorded audio blob
 */
export const recordAudio = async (timeLimit: number = 10000): Promise<Blob> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: BlobPart[] = [];

    mediaRecorder.addEventListener('dataavailable', (event) => {
      audioChunks.push(event.data);
    });

    mediaRecorder.start();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, timeLimit);

      mediaRecorder.addEventListener('stop', () => {
        clearTimeout(timeoutId);

        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        resolve(audioBlob);
      });

      mediaRecorder.addEventListener('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error recording audio:', error);
    throw error;
  }
};

// Function to get supported languages
export const getSupportedLanguages = (): Array<{ code: string, name: string }> => {
  // This would typically come from your backend which would query Google's API
  // For now, we'll hardcode some common languages
  return [
    { code: 'en-US', name: 'English (US)' },
    { code: 'vi-VN', name: 'Vietnamese' },
    { code: 'fi-FI', name: 'Finnish' },
  ];
};

// Function to get supported voice types
export const getSupportedVoices = (): Array<{ id: string, name: string, description?: string }> => {
  return [
    { id: "mark-en-us", name: "Mark", description: "M-English" },
    { id: "ryan-en-gb", name: "Ryan", description: "M-English" },
    { id: "aria-en-us", name: "Aria", description: "FM-English" },
    { id: "sonia-en-gb", name: "Sonia", description: "FM-English" },
    { id: "guy-en-us", name: "Guy", description: "M-English" },
    { id: "jenny-en-us", name: "Jenny", description: "FM-English" },
    { id: "david-en-us", name: "David", description: "M-English" },
    { id: "zira-en-us", name: "Zira", description: "FM-English" },
    { id: "david-desktop-en-us", name: "David Desktop", description: "M-English" },
    { id: "zira-desktop-en-us", name: "Zira Desktop", description: "FM-English" },
    { id: "heidi-fi-fi", name: "Heidi", description: "FM-Finnish" },
    { id: "an-vi-vn", name: "An", description: "M-Vietnamese" },
  ];
};