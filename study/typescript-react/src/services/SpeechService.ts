/**
 * Service for handling speech-to-text and text-to-speech operations
 */

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
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    formData.append('language', language);

    const response = await fetch(`http://localhost:8008/api/speech-to-text`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Speech-to-Text failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.transcript;
  } catch (error) {
    console.error('Error converting speech to text:', error);
    throw error;
  }
};

/**
 * Convert text to speech
 * @param text Text to convert to speech
 * @param language Language code (e.g., "fi-FI")
 * @returns Promise with the base64 encoded audio
 */
export const convertTextToSpeech = async (
  text: string,
  language: string = 'en-US'
): Promise<string> => {
  try {
    const response = await fetch('http://localhost:8008/api/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, language }),
    });

    if (!response.ok) {
      throw new Error(`Text-to-Speech failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.audio;
  } catch (error) {
    console.error('Error converting text to speech:', error);
    throw error;
  }
};

/**
 * Play the audio from a base64 string
 * @param base64Audio Base64 encoded audio
 */
export const playAudio = (base64Audio: string): void => {
  const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);

  audio.play().catch((error) => {
    console.error('Error playing audio:', error);
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
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ru-RU', name: 'Russian' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'ar-SA', name: 'Arabic' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'vi-VN', name: 'Vietnamese' },
    { code: 'fi-FI', name: 'Finnish' },
  ];
}; 