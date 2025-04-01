import {
  LanguageSession,
  LanguageInteraction,
  UserLanguageProficiency,
  LanguagePreferences,
  ProficiencyLevel
} from '../models/LanguageAI';

export interface LanguageSession {
  id: string;
  userId: string;
  language: string;
  proficiencyLevel: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LanguageInteraction {
  id?: string;
  sessionId: string;
  userMessage: string;
  aiResponse: string;
  audioUrl: string;
  timestamp?: number;
  createdAt?: Date;
}

export interface UserLanguageProficiency {
  userId: string;
  language: string;
  level: string;
  lastUpdated: number;
  strengths?: string[];
  weaknesses?: string[];
}

export enum ProficiencyLevel {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
  Fluent = 'fluent',
  Native = 'native'
}

export interface LanguagePreferences {
  userId: string;
  topicPreferences: string[];
  learningGoals: string[];
  studyReminders: boolean;
  studyFrequency: string;
}

const API_URL = 'http://localhost:8008';

// Get all language sessions for a user
export const getUserLanguageSessions = async (userId: string): Promise<LanguageSession[]> => {
  try {
    const response = await fetch(`${API_URL}/api/language-sessions/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch language sessions: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching language sessions:', error);
    // Return mock data for development
    return [
      {
        id: 'mock-session-1',
        userId,
        language: 'en-US',
        proficiencyLevel: 'Intermediate',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
};

// Create a new language session
export const createLanguageSession = async (
  userId: string,
  language: string,
  proficiencyLevel: string
): Promise<LanguageSession> => {
  try {
    const response = await fetch(`${API_URL}/api/language-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, language, proficiencyLevel }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create language session: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating language session:', error);
    // Return mock data for development
    return {
      id: `mock-session-${Date.now()}`,
      userId,
      language,
      proficiencyLevel,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
};

// Save a language interaction
export const saveLanguageInteraction = async (
  interaction: LanguageInteraction
): Promise<{ id: string }> => {
  try {
    const response = await fetch(`${API_URL}/api/language-ai/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(interaction),
    });

    if (!response.ok) {
      throw new Error(`Failed to save interaction: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving language interaction:', error);
    // Return mock data for development
    return { id: `mock-interaction-${Date.now()}` };
  }
};

// Get user language proficiency
export const getUserLanguageProficiency = async (
  userId: string,
  language?: string
): Promise<UserLanguageProficiency | UserLanguageProficiency[]> => {
  try {
    const url = language
      ? `${API_URL}/api/users/${userId}/language-proficiency?language=${language}`
      : `${API_URL}/api/users/${userId}/language-proficiency`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch proficiency: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching language proficiency:', error);
    // Return mock data for development
    return {
      userId,
      language: 'en-US',
      level: ProficiencyLevel.Intermediate,
      strengths: ['Basic vocabulary', 'Simple phrases'],
      areasToImprove: ['Grammar', 'Complex sentences'],
      lastAssessed: new Date()
    };
  }
};

// Update user language preferences
export const updateLanguagePreferences = async (
  preferences: LanguagePreferences
): Promise<LanguagePreferences> => {
  try {
    const response = await fetch(`${API_URL}/api/language-ai/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      throw new Error(`Failed to update preferences: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating language preferences:', error);
    // Return the input data for development
    return preferences;
  }
};

// Get language interactions for a session
export const getSessionInteractions = async (
  sessionId: string
): Promise<LanguageInteraction[]> => {
  try {
    const response = await fetch(`${API_URL}/api/language-ai/interactions/${sessionId}`);

    if (!response.ok) {
      throw new Error(`Failed to get interactions: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting session interactions:', error);
    throw error;
  }
};

// Get AI response to user message
export const getAIResponse = async (
  message: string,
  language: string,
  userId: string,
  proficiencyLevel: string
): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/api/ai-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        language,
        userId,
        proficiencyLevel,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get AI response: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw error;
  }
}; 