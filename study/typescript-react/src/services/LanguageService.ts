// LanguageService.ts
// Service for managing language sessions and interactions

export interface LanguageSession {
  id: string;
  userId: string;
  language: string;
  proficiencyLevel: string;
}

export interface LanguageInteraction {
  id?: string;
  sessionId: string;
  userMessage: string;
  aiResponse: string;
  audioUrl: string;
}

export interface LanguageProficiency {
  userId: string;
  language: string;
  level: string;
  lastUpdated: number;
}

// API URL for the Python server
const API_URL = 'http://localhost:8008';

/**
 * Create a new language practice session
 * @param userId User ID
 * @param language Language code (e.g., "en-US")
 * @param proficiencyLevel User's proficiency level
 * @returns Promise with the created session
 */
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
    throw error;
  }
};

/**
 * Get language sessions for a user
 * @param userId User ID
 * @returns Promise with an array of sessions
 */
export const getUserLanguageSessions = async (
  userId: string
): Promise<LanguageSession[]> => {
  try {
    const response = await fetch(`${API_URL}/api/language-sessions/${userId}`);

    if (!response.ok) {
      throw new Error(`Failed to get language sessions: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting language sessions:', error);
    throw error;
  }
};

/**
 * Save a language interaction (question and response)
 * @param interaction The interaction to save
 * @returns Promise with the saved interaction ID
 */
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
    throw error;
  }
};

/**
 * Get language interactions for a session
 * @param sessionId Session ID
 * @returns Promise with an array of interactions
 */
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

/**
 * Get user's language proficiency
 * @param userId User ID
 * @param language Optional language code to filter by
 * @returns Promise with proficiency information
 */
export const getUserLanguageProficiency = async (
  userId: string,
  language?: string
): Promise<LanguageProficiency | LanguageProficiency[]> => {
  try {
    const url = language
      ? `${API_URL}/api/users/${userId}/language-proficiency?language=${language}`
      : `${API_URL}/api/users/${userId}/language-proficiency`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to get language proficiency: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching language proficiency:', error);
    throw error;
  }
};

/**
 * Get AI response to user message
 * @param message User's message
 * @param language Language code
 * @param userId User ID
 * @param proficiencyLevel User's proficiency level
 * @returns Promise with the AI response
 */
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