// src/types/languageAI.ts

import { SelectChangeEvent } from "@mui/material"; // Import needed MUI type

// --- Enums ---

export enum ProficiencyLevel {
  Beginner = "BEGINNER",
  Intermediate = "INTERMEDIATE",
  Advanced = "ADVANCED",
  Fluent = "FLUENT",
  Native = "NATIVE"
}

// --- Core Data Interfaces ---

export interface ChatMessageData {
  sender: "User" | "AI";
  content: string;
  timestamp: string; // ISO String
  id?: string; // Optional ID from DB for history or unique message key
}

export interface LanguageInteraction {
  id: string;
  sessionId: string; // Assuming sessionId is always present for interactions
  userMessage: string;
  aiResponse: string;
  audioUrl?: string;
  feedback?: LanguageFeedback;
  messageType?: string;
  language?: string;
  createdAt: string; // Should be ISO String from DB/API
  userId?: string;
  content?: string; // Seems redundant with userMessage/aiResponse? Review if needed.
}

export interface LanguageFeedback {
  pronunciation: number; // Score from 1-10
  grammar: number; // Score from 1-10
  vocabulary: number; // Score from 1-10
  fluency: number; // Score from 1-10
  suggestions: string[];
  corrections: Array<{ // Explicitly type array elements
    original: string;
    corrected: string;
    explanation: string;
  }>;
}

// --- Metadata and Configuration Interfaces ---

export interface ResponseMetadata {
  responseTime?: number;
  responseSource?: "n8n" | "fallback";
  sessionId?: string;
  rawResponse?: Record<string, unknown>;
  isSimulated?: boolean;
}

export interface LanguageOption {
  code: string;
  name: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  description?: string;
}

// --- Component Prop Interfaces ---
// Consolidating prop interfaces here makes them easily reusable

export interface ChatControlsProps {
  language: string;
  proficiencyLevel: string; // Uses ProficiencyLevel enum values
  selectedVoice: string;
  supportedLanguages: LanguageOption[];
  supportedVoices: VoiceOption[];
  isProcessingAudio: boolean;
  isGeneratingResponse: boolean;
  isSpeaking: boolean;
  backendAvailable: boolean;
  error: string | null;
  aiResponse: string; // Last AI response for replay button
  showDebugInfo: boolean;
  responseMetadata: ResponseMetadata;
  onLanguageChange: (event: SelectChangeEvent<string>) => void;
  onProficiencyChange: (event: SelectChangeEvent<string>) => void;
  onVoiceChange: (event: SelectChangeEvent<string>) => void;
  onAudioRecorded: (audioBlob: Blob, browserTranscript: string) => void;
  onSpeechRecognized: (transcript: string) => void;
  onSpeakLastResponse: () => void;
  onStopSpeaking: () => void;
  onToggleDebugInfo: () => void;
}

export interface ChatWindowProps {
  messages: ChatMessageData[];
  username: string;
  previousMessages: ChatMessageData[];
  isLoadingHistory: boolean;
  isGeneratingResponse: boolean;
  showHistory: boolean;
  onToggleHistory: () => void;
  fetchPreviousMessages: () => void; // Function to trigger history fetch
  formatTimestamp: (timestamp: string) => string;
}

export interface ChatMessageProps {
  message: ChatMessageData;
  username: string;
  formatTimestamp: (timestamp: string) => string;
}

export interface LanguageSession {
  id: string;
  userId: string;
  language: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}


// User language proficiency levels
export interface UserLanguageProficiency {
  userId: string;
  language: string;
  level: ProficiencyLevel;
  strengths: string[];
  areasToImprove: string[];
  lastAssessed: string | Date;
}

// User language preferences
export interface LanguagePreferences {
  userId: string;
  preferredLanguages: string[];
  learningTopics: string[];
  learningStyle: LearningStyle;
  practiceFrequency: PracticeFrequency;
}

export enum LearningStyle {
  Visual = "visual",
  Auditory = "auditory",
  Verbal = "verbal",
  Physical = "physical",
  Logical = "logical",
  Social = "social",
  Solitary = "solitary"
}

export enum PracticeFrequency {
  Daily = "daily",
  Weekly = "weekly",
  BiWeekly = "bi-weekly",
  Monthly = "monthly"
} 