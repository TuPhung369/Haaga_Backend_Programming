import { 
  LanguageSession, 
  LanguageInteraction, 
  UserLanguageProficiency,
  LanguagePreferences,
  ProficiencyLevel
} from '../models/LanguageAI';

const API_BASE_URL = '/api/language-ai';

// Get all language sessions for a user
export const getUserLanguageSessions = async (userId: string): Promise<LanguageSession[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions?userId=${userId}`);
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
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
};

// Create a new language session
export const createLanguageSession = async (
  userId: string,
  language: string
): Promise<LanguageSession> => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, language }),
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
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
};

// Save a language interaction
export const saveLanguageInteraction = async (
  sessionId: string,
  userMessage: string,
  aiResponse: string,
  audioUrl?: string
): Promise<LanguageInteraction> => {
  try {
    const response = await fetch(`${API_BASE_URL}/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        userMessage,
        aiResponse,
        audioUrl,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save interaction: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving language interaction:', error);
    // Return mock data for development
    return {
      id: `mock-interaction-${Date.now()}`,
      sessionId,
      userMessage,
      aiResponse,
      audioUrl,
      createdAt: new Date()
    };
  }
};

// Get user language proficiency
export const getUserLanguageProficiency = async (
  userId: string,
  language: string
): Promise<UserLanguageProficiency> => {
  try {
    const response = await fetch(`${API_BASE_URL}/proficiency?userId=${userId}&language=${language}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch proficiency: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching language proficiency:', error);
    // Return mock data for development
    return {
      userId,
      language,
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
    const response = await fetch(`${API_BASE_URL}/preferences`, {
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