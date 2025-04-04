// Language AI Model - Represents language practice sessions data
export interface LanguageSession {
  id: string;
  userId: string;
  language: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Represents a single language practice interaction
export interface LanguageInteraction {
  id: string;
  sessionId: string;
  userMessage: string;
  aiResponse: string;
  audioUrl?: string;
  feedback?: LanguageFeedback;
  messageType?: string;
  language?: string;
  createdAt: string;
  userId?: string;
  content?: string;
}

// Represents feedback on language usage
export interface LanguageFeedback {
  pronunciation: number; // Score from 1-10
  grammar: number; // Score from 1-10
  vocabulary: number; // Score from 1-10
  fluency: number; // Score from 1-10
  suggestions: string[];
  corrections: {
    original: string;
    corrected: string;
    explanation: string;
  }[];
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

// Proficiency level enum
export enum ProficiencyLevel {
  Beginner = "beginner",
  Elementary = "elementary",
  Intermediate = "intermediate",
  Advanced = "advanced",
  Proficient = "proficient",
  Native = "native"
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