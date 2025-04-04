// LanguageService.ts
// Service for managing language sessions and interactions

import { LanguageSession, LanguageInteraction, LanguageFeedback } from '../models/LanguageAI';

export const API_URL = 'http://localhost:9095/identify_service'; // Correct Spring Boot URL with context path
export const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/c1784e69-2d89-45fb-b47d-dd13dddcf31e/chat';

// Debug utility for localStorage inspection
export const inspectLocalStorage = () => {
  console.log('📊 Examining localStorage for stored sessions and interactions:');

  // Count items by type
  let sessionCount = 0;
  let interactionCount = 0;
  const sessions: Array<{ key: string; id?: string; userId?: string; language?: string; error?: string }> = [];
  const interactions: Array<{ key: string; id?: string; sessionId?: string; messagePreview?: string; error?: string }> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    if (key.startsWith('session_')) {
      sessionCount++;
      try {
        const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
        sessions.push({ key, id: sessionData.id || '', userId: sessionData.userId || '', language: sessionData.language || '' });
      } catch {
        sessions.push({ key, error: 'Failed to parse' });
      }
    } else if (key.startsWith('interaction_')) {
      interactionCount++;
      try {
        const interactionData = JSON.parse(localStorage.getItem(key) || '{}');
        interactions.push({
          key,
          id: interactionData.id || '',
          sessionId: interactionData.sessionId || '',
          messagePreview: interactionData.userMessage ?
            interactionData.userMessage.substring(0, 20) + '...' : 'N/A'
        });
      } catch {
        interactions.push({ key, error: 'Failed to parse' });
      }
    }
  }

  console.log(`Found ${sessionCount} sessions and ${interactionCount} interactions in localStorage`);
  console.log('Sessions:', sessions);
  console.log('Recent Interactions:', interactions.slice(-5)); // Show only the last 5 to avoid console flood

  return { sessionCount, interactionCount, sessions, interactions };
};

// Define a type for the Redux store
interface ReduxStore {
  getState: () => {
    auth?: {
      token?: string;
    };
  };
}

// Define a type for the window object with reduxStore
declare global {
  interface Window {
    reduxStore?: ReduxStore;
  }
}

// Define a type for the API response message
interface ApiLanguageMessage {
  id?: string;
  content?: string;
  userId?: string;
  sessionId?: string;
  messageType?: string;
  userMessage?: string;
  aiResponse?: string;
  language?: string;
  created_at?: string | number[] | Date;
  createdAt?: string | number[] | Date;
  message_type?: string;
}

// Add this function at the top of your file or in a utility file
function convertArrayToDate(dateArray: number[]): Date {
  if (!Array.isArray(dateArray) || dateArray.length < 3) {
    return new Date();
  }

  const [year, month, day, hour = 0, minute = 0, second = 0, ms = 0] = dateArray;
  // Note: Month is 0-based in JS Date, but 1-based in the array from Java
  return new Date(year, month - 1, day, hour, minute, second, ms / 1000000);
}

/**
 * Create a new language session (via Spring Boot)
 * @param language The language code (e.g., 'fi-FI')
 * @param proficiencyLevel Optional proficiency level (defaults to 'intermediate')
 * @param userId Optional user identifier (defaults to 'guest')
 * @param token Optional JWT token for authorization
 * @returns Promise with the session data
 */
export const createLanguageSession = async (
  language: string,
  proficiencyLevel: string = 'intermediate',
  userId: string = 'guest',
  token?: string
): Promise<LanguageSession> => {
  try {
    console.log(`=== CREATING NEW LANGUAGE SESSION ===`);
    console.log(`Language: ${language}`);
    console.log(`User ID: ${userId}`);
    console.log(`Proficiency: ${proficiencyLevel}`);

    const payload = {
      language,
      userId,
      proficiencyLevel,
      recaptchaToken: "mock-token-for-development" // Add required token for backend validation
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // First, try using the direct token passed in
    if (token) {
      console.log(`Using token passed directly to the function`);
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Fallback to findAuthToken() for backwards compatibility
      const tokenInfo = findAuthToken();

      if (tokenInfo) {
        console.log(`Using auth token from ${tokenInfo.source}`);
        headers['Authorization'] = `Bearer ${tokenInfo.token}`;
      } else {
        console.log(`No auth token found - request may fail with 401 Unauthorized`);
      }
    }

    console.log(`Request headers:`, headers);

    // Check if a session already exists with this user ID (to avoid duplicate sessions)
    try {
      console.log(`Checking if session already exists for user: ${userId}`);
      const existingSession = await verifySessionExists(userId, token);
      if (existingSession) {
        console.log(`Session already exists for user: ${userId}`);
        // Return a properly formatted session object
        return {
          id: userId.startsWith('session-') ? userId : `session-${userId}`,
          userId,
          language,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      console.log(`No existing session found for user: ${userId}`);
    } catch (error) {
      console.log(`Error checking for existing session: ${error instanceof Error ? error.message : String(error)}`);
      // Continue with session creation attempt
    }

    const response = await fetch(`${API_URL}/api/language-ai/sessions/dev`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      credentials: 'include' // This enables sending cookies with the request
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`API Error (${response.status}): ${errorText}`);
      console.log(`Full request details:
      • URL: ${API_URL}/api/language-ai/sessions/dev
      • Method: POST
      • Payload: ${JSON.stringify(payload)}
      • Status: ${response.status} ${response.statusText}`);

      throw new Error(`Failed to create language session: ${response.statusText}`);
    }

    const data = await response.json();

    // Ensure session ID follows the expected format (with 'session-' prefix)
    let sessionId = data.id || '';
    if (sessionId && !sessionId.startsWith('session-')) {
      // If session ID is returned without the prefix, add it
      sessionId = `session-${sessionId}`;
      console.log(`Added 'session-' prefix to session ID: ${sessionId}`);
    } else {
      console.log(`Session created with ID: ${sessionId}`);
    }

    // Store the session in localStorage for backup/debugging
    try {
      localStorage.setItem(`session_${sessionId}`, JSON.stringify({ ...data, id: sessionId }));
    } catch (error) {
      console.log("Could not save to localStorage:", error);
    }

    return {
      id: sessionId || `mock-session-${Date.now()}`,
      userId: data.userId || userId,
      language: data.language || language,
      createdAt: data.createdAt ? data.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: data.updatedAt ? data.updatedAt.toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    console.log(`=== ERROR CREATING SESSION ===`);
    console.log(`Error: ${error instanceof Error ? error.message : String(error)}`);

    // Generate a fallback session
    const mockSessionId = `mock-${Date.now()}`;
    const mockSession: LanguageSession = {
      id: mockSessionId,
      userId: 'guest',
      language,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log(`Using mock session ID: ${mockSessionId}`);

    // Store mock session in localStorage for consistency
    try {
      localStorage.setItem(`session_${mockSessionId}`, JSON.stringify(mockSession));
    } catch (error) {
      console.log("Could not save to localStorage:", error);
    }

    return mockSession;
  }
};

/**
 * Save an interaction (via Spring Boot to internal DB)
 * Sends user message and AI response to be stored, associated with the user and language.
 * @param interactionData The interaction data containing userId, messages, language, etc.
 * @returns Promise with the saved interaction data (likely representing the saved AI response message).
 */
export const saveInteraction = async (
  interactionData: {
    // sessionId is no longer sent from frontend for saving
    userMessage: string;
    aiResponse: string;
    userId: string;
    language: string;        // Language is now mandatory
    proficiencyLevel: string; // Proficiency is now mandatory
    audioUrl?: string;
    userAudioUrl?: string;   // Added userAudioUrl field if available
    feedback?: LanguageFeedback;
    token?: string; // Optional token for authorization
  }
): Promise<LanguageInteraction> => {
  try {
    console.log(`Saving interaction for user: ${interactionData.userId}`);
    console.log(`Message: "${interactionData.userMessage.substring(0, 50)}..."`);
    console.log(`Response: "${interactionData.aiResponse.substring(0, 50)}..."`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization if we have a token
    if (interactionData.token) {
      headers['Authorization'] = `Bearer ${interactionData.token}`;
      delete interactionData.token; // Remove token from payload
    } else {
      const tokenInfo = findAuthToken();
      if (tokenInfo) {
        headers['Authorization'] = `Bearer ${tokenInfo.token}`;
      }
    }

    // Attempt to save interaction via API
    try {
      const { getRecaptchaToken } = await import("../utils/recaptchaUtils");
      const recaptchaToken = getRecaptchaToken();
      // Create a payload including the recaptchaToken
      const requestPayload = {
        ...interactionData,
        recaptchaToken: recaptchaToken // Add required token for backend validation
      };

      // Remove token from the payload as it's already in headers
      if (requestPayload.token) {
        delete requestPayload.token;
      }

      const response = await fetch(`${API_URL}/api/language-ai/interactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload),
        credentials: 'include' // This enables sending cookies with the request
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save interaction: ${response.status} - ${errorText}`);
      }

      const savedData = await response.json();
      console.log(`Interaction saved successfully with ID: ${savedData.id || 'unknown'}`);

      // Return a properly formatted LanguageInteraction object
      return {
        id: savedData.id || `local-${Date.now()}`,
        sessionId: `session-${interactionData.userId}`, // Create a session ID if not provided
        userMessage: interactionData.userMessage,
        aiResponse: interactionData.aiResponse,
        createdAt: new Date().toISOString(),
        // Add the optional fields
        audioUrl: interactionData.audioUrl,
        feedback: interactionData.feedback
      };

    } catch (apiError) {
      console.log(`API Error: ${apiError instanceof Error ? apiError.message : String(apiError)}`);

      // For development/demo purposes, return a mock success response with the same data
      console.log(`Using fallback response - creating local interaction record`);

      // Create a properly formatted LanguageInteraction
      return {
        id: `fallback-${Date.now()}`,
        sessionId: `session-${interactionData.userId}`, // Create a session ID if not provided
        userMessage: interactionData.userMessage,
        aiResponse: interactionData.aiResponse,
        createdAt: new Date().toISOString(),
        // Add the optional fields
        audioUrl: interactionData.audioUrl,
        feedback: interactionData.feedback
      };
    }
  } catch (error) {
    console.error(`Error in saveInteraction: ${error instanceof Error ? error.message : String(error)}`);

    // Always return a valid LanguageInteraction even in error cases
    return {
      id: `error-${Date.now()}`,
      sessionId: `session-${interactionData.userId}`,
      userMessage: interactionData.userMessage,
      aiResponse: interactionData.aiResponse || "Error saving interaction",
      createdAt: new Date().toISOString()
    };
  }
};

/**
 * Generate a fallback AI response for development purposes
 * @param userInput The user's input text
 * @param language The language code
 * @param level The proficiency level
 * @returns A simulated AI response
 */
const generateFallbackResponse = (userInput: string, language: string, level: string): string => {
  // Simple templates based on proficiency level
  const templates = {
    beginner: [
      "That's a good start! Let me help you with a simpler way to say that: [simplified version].",
      "I understand what you're trying to say. For beginners, I'd recommend: [simplified version].",
      "Good effort! Here's how to say that more clearly: [simplified version]."
    ],
    intermediate: [
      "That's well said! Here's a suggestion to make it more natural: [improved version].",
      "Good job! To sound more fluent, you could say: [improved version].",
      "That's quite good! A native speaker might phrase it like: [improved version]."
    ],
    advanced: [
      "Excellent! To add some sophistication, consider: [advanced version].",
      "Very well expressed! For more variety in your vocabulary, try: [advanced version].",
      "That's great! To sound even more natural, you might say: [advanced version]."
    ],
    fluent: [
      "Your language skills are impressive! Just a minor refinement: [refined version].",
      "Almost perfect! A slight nuance you might consider: [refined version].",
      "Excellent communication! For absolute perfection, try: [refined version]."
    ],
    native: [
      "That sounds very natural! For stylistic variety, you could also say: [stylistic variation].",
      "Perfect! Another way to express that might be: [stylistic variation].",
      "Couldn't have said it better myself! For variety's sake: [stylistic variation]."
    ]
  };

  // Default to intermediate if level isn't recognized
  const levelTemplates = templates[level as keyof typeof templates] || templates.intermediate;

  // Select a random template
  const template = levelTemplates[Math.floor(Math.random() * levelTemplates.length)];

  // Create response based on language
  let response = template;

  if (language.startsWith('fi')) {
    response = `[FINNISH SIMULATION] ${template}\n\nTämä on simuloitu vastaus. Oikea tekoäly käyttäisi kontekstia ja kieltäsi paremmin.`;
  } else if (language.startsWith('sv')) {
    response = `[SWEDISH SIMULATION] ${template}\n\nDetta är ett simulerat svar. En riktig AI skulle använda sammanhang och ditt språk bättre.`;
  } else if (language.startsWith('de')) {
    response = `[GERMAN SIMULATION] ${template}\n\nDies ist eine simulierte Antwort. Eine echte KI würde Kontext und Ihre Sprache besser nutzen.`;
  } else if (language.startsWith('fr')) {
    response = `[FRENCH SIMULATION] ${template}\n\nCeci est une réponse simulée. Une véritable IA utiliserait mieux le contexte et votre langue.`;
  } else if (language.startsWith('es')) {
    response = `[SPANISH SIMULATION] ${template}\n\nEsta es una respuesta simulada. Una IA real usaría mejor el contexto y tu idioma.`;
  } else {
    // Default to English
    response = `[SIMULATION] ${template}\n\nThis is a simulated response. A real AI would use context and your language better.`;
  }

  return response;
};

/**
 * Get an AI response directly from N8n
 * @param userInput The user's input text (matches userMessage in model)
 * @param language The language code (e.g., 'fi-FI')
 * @param level The proficiency level (e.g., 'beginner')
 * @param userId The user ID to include in the N8N request
 * @returns Promise with the AI response text
 */
export const getAIResponseFromN8n = async (
  userInput: string,
  language: string,
  level: string,
  userId: string
): Promise<string> => {
  // console.log(`Getting AI response for:
  // • User input: "${userInput}"
  // • Language: ${language}
  // • Level: ${level}
  // • User ID: ${userId}`);

  if (!N8N_WEBHOOK_URL) {
    console.log(`N8n webhook URL not configured, using fallback response`);
    return generateFallbackResponse(userInput, language, level);
  }

  try {
    // Create a session ID from the user ID for compatibility with N8N
    const sessionId = `session-${userId}`;

    // Prepare the request payload with all the expected fields
    const payload = {
      userInput: userInput,
      message: userInput, // Add message field (some APIs expect this)
      input: userInput, // Add input field (some APIs expect this)
      language: language,
      proficiencyLevel: level,
      userId: userId,
      sessionId: sessionId, // Include sessionId for N8N
      recaptchaToken: "mock-token-for-development" // Add recaptcha token that might be expected
    };

    //const startTime = performance.now();
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-auth-for-n8n' // Add a fake auth token just in case
      },
      body: JSON.stringify(payload),
    });
    //const responseTime = Math.round(performance.now() - startTime);

    //console.log(`Received response from N8N in ${responseTime}ms (status: ${response.status})`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.log(`N8n error response: ${errorBody}`);
      throw new Error(`N8n service error: ${response.statusText}`);
    }

    // Get the raw response text first for debugging
    const responseText = await response.text();

    // Try to parse as JSON if possible
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(responseText);
    } catch (/* eslint-disable-line @typescript-eslint/no-unused-vars */ _parseError) {
      // If parsing fails, just use the text response directly
      console.log(`Response is not valid JSON, using as plain text`);
      return responseText.length > 0 ? responseText : generateFallbackResponse(userInput, language, level);
    }

    // Extract response from different possible formats
    let aiResponse = '';
    if (typeof data.aiResponse === 'string') {
      aiResponse = data.aiResponse;
    } else if (typeof data.message === 'string') {
      aiResponse = data.message;
    } else if (typeof data.output === 'string') {
      aiResponse = data.output;
    } else if (typeof data.response === 'string') {
      aiResponse = data.response;
    } else if (typeof data.text === 'string') {
      aiResponse = data.text;
    } else if (typeof data === 'string') {
      aiResponse = data;
    } else if (typeof data.content === 'string') {
      aiResponse = data.content;
    } else {
      console.log(`No recognized response format from N8N, using fallback`);
      aiResponse = generateFallbackResponse(userInput, language, level);
    }

    return aiResponse;
  } catch (error) {
    console.log(`Error getting AI response: ${error instanceof Error ? error.message : String(error)}`);
    // Use the fallback response generator instead of a static message
    const fallbackResponse = generateFallbackResponse(userInput, language, level);
    console.log(`Using fallback AI response`);
    return fallbackResponse;
  }
};

/**
 * Get all interactions for a session
 * @param sessionId The session ID
 * @returns Promise with array of interactions
 */
export const getSessionInteractions = async (
  sessionId: string
): Promise<LanguageInteraction[]> => {
  try {
    console.log(`🔍 Getting interactions for session: ${sessionId}`);

    // Session interactions are no longer needed as we use a create-only flow
    // Just return an empty array to avoid errors in the UI
    console.log(`ℹ️ Skipping API call - using simplified interaction flow`);
    return [];

    // Keep the old code commented out in case we need it later
    /*
    // Handle different session ID formats - ensure it has the "session-" prefix for the backend controller
    let cleanSessionId = sessionId;
    if (cleanSessionId && !cleanSessionId.startsWith('session-') && !cleanSessionId.startsWith('mock-')) {
      cleanSessionId = `session-${cleanSessionId}`;
      console.log(`🔄 Added prefix to sessionId: ${cleanSessionId}`);
    }

    const response = await fetch(`${API_URL}/api/language-ai/sessions/${cleanSessionId}/interactions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`📡 Session interactions response status: ${response.status}`);

    // If not found (404) or other error, try to recover interactions from localStorage
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Fetching interactions failed with status ${response.status}: ${errorText}`);
      throw new Error(`Failed to fetch interactions: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Retrieved ${data.content ? data.content.length : 0} interactions from server`);

    // Process pageable response from Spring
    if (data.content && Array.isArray(data.content)) {
      return data.content.map((item: {
        id: string;
        sessionId: string;
        userMessage: string;
        aiResponse: string;
        audioUrl?: string;
        feedback?: LanguageFeedback;
        createdAt: string;
      }) => ({
        id: item.id,
        sessionId: cleanSessionId, // Keep consistent with what the frontend expects
        userMessage: item.userMessage,
        aiResponse: item.aiResponse,
        audioUrl: item.audioUrl,
        feedback: item.feedback,
        createdAt: new Date(item.createdAt).toISOString()
      }));
    }

    // Handle case where we get an array directly
    if (Array.isArray(data)) {
      console.log(`✅ Retrieved ${data.length} interactions (array format)`);
      return data.map((item: {
        id: string;
        sessionId: string;
        userMessage: string;
        aiResponse: string;
        audioUrl?: string;
        feedback?: LanguageFeedback;
        createdAt: string;
      }) => ({
        id: item.id,
        sessionId: cleanSessionId,
        userMessage: item.userMessage,
        aiResponse: item.aiResponse,
        audioUrl: item.audioUrl,
        feedback: item.feedback,
        createdAt: new Date(item.createdAt).toISOString()
      }));
    }

    // If response is not in expected format
    console.warn('⚠️ Unexpected response format for interactions:', data);
    */
    return [];
  } catch {
    // Just return an empty array without throwing an error
    console.log("ℹ️ Returning empty interactions array - using simplified flow");
    return [];
  }
};

/**
 * Verify a session exists in the database
 * @param sessionId Session ID to verify
 * @param token Optional JWT token for authorization
 * @returns Promise resolving to boolean indicating if session exists
 */
export const verifySessionExists = async (sessionId: string, token?: string): Promise<boolean> => {
  try {
    console.log(`Verifying session exists: ${sessionId}`);

    // Try both formats - with and without prefix
    const withPrefix = sessionId.startsWith('session-') ? sessionId : `session-${sessionId}`;
    const withoutPrefix = sessionId.startsWith('session-') ? sessionId.substring(8) : sessionId;

    console.log(`Checking backend with ID: ${withoutPrefix} (without prefix)`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // First, try using the direct token passed in
    if (token) {
      console.log(`Using token passed directly to the verifySessionExists function`);
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Fallback to findAuthToken() for backwards compatibility
      const tokenInfo = findAuthToken();

      if (tokenInfo) {
        console.log(`Using auth token from ${tokenInfo.source}`);
        headers['Authorization'] = `Bearer ${tokenInfo.token}`;
      } else {
        console.log(`No auth token found - request may fail with 401 Unauthorized`);
      }
    }

    // Always use the version without prefix for backend API calls
    const response = await fetch(`${API_URL}/api/language-ai/sessions/${withoutPrefix}/exists`, {
      method: 'GET',
      headers,
      credentials: 'include' // This enables sending cookies with the request
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`Session verification response: ${data.exists ? 'EXISTS' : 'NOT FOUND'}`);
      return data.exists === true;
    }

    // If we get a 404, the session doesn't exist
    if (response.status === 404) {
      console.log(`Session does not exist (404)`);
      return false;
    }

    // For other errors, log them but don't fail the check
    console.log(`Error verifying session: ${response.status} ${response.statusText}`);

    // Try to get more info from the response
    try {
      const errorText = await response.text();
      console.log(`API Error detail: ${errorText}`);
    } catch (/* eslint-disable-line @typescript-eslint/no-unused-vars */ _readError) {
      console.log(`Could not read API error detail`);
    }

    // Default to false on error
    return false;
  } catch (error) {
    console.log(`Exception verifying session: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
};

/**
 * Debug helper function to diagnose session ID issues
 * @param sessionId The session ID to debug
 * @param token Optional JWT token for authorization
 */
export const debugSessionId = async (sessionId: string, token?: string): Promise<void> => {
  console.log(`=== DEBUGGING SESSION ID: ${sessionId} ===`);

  // Check different session ID formats
  const withPrefix = sessionId.startsWith('session-') ? sessionId : `session-${sessionId}`;
  const withoutPrefix = sessionId.startsWith('session-') ? sessionId.substring(8) : sessionId;

  console.log(`Session ID with prefix: ${withPrefix}`);
  console.log(`Session ID without prefix: ${withoutPrefix}`);

  // Check if session exists in localStorage
  const localStorageKey = `session_${sessionId}`;
  const sessionData = localStorage.getItem(localStorageKey);

  if (sessionData) {
    console.log(`Session found in localStorage with key: ${localStorageKey}`);
    try {
      const parsed = JSON.parse(sessionData);
      console.log(`Session data: userId=${parsed.userId}, language=${parsed.language}`);
    } catch (error) {
      console.log(`Could not parse session data: ${error}`);
    }
  } else {
    console.log(`Session NOT found in localStorage with key: ${localStorageKey}`);

    // Try the alternative format in localStorage
    const altLocalStorageKey = `session_${sessionId.startsWith('session-') ? withoutPrefix : withPrefix}`;
    const altSessionData = localStorage.getItem(altLocalStorageKey);

    if (altSessionData) {
      console.log(`Session found in localStorage with alternative key: ${altLocalStorageKey}`);
    }
  }

  // Check if sessions exist in backend with both formats
  try {
    console.log(`Checking backend for session with prefix: ${withPrefix}`);
    const existsWithPrefix = await verifySessionExists(withPrefix, token);
    console.log(`Backend result for ID with prefix: ${existsWithPrefix ? 'EXISTS' : 'NOT FOUND'}`);

    console.log(`Checking backend for session without prefix: ${withoutPrefix}`);
    const existsWithoutPrefix = await verifySessionExists(withoutPrefix, token);
    console.log(`Backend result for ID without prefix: ${existsWithoutPrefix ? 'EXISTS' : 'NOT FOUND'}`);
  } catch (error) {
    console.log(`Error verifying session in backend: ${error}`);
  }

  console.log(`=== END DEBUG SESSION ID ===`);
};

/**
 * Utility function to find where the authentication token is stored
 * @returns The token and its storage location, or null if not found
 */
export const findAuthToken = (): { token: string, source: string } | null => {
  try {
    // First check if we can access Redux store directly
    // This requires a way to access the store outside of components
    // If your app has a store export or singleton, you could check it here
    if (typeof window !== 'undefined' && 'reduxStore' in window && window.reduxStore) {
      const state = window.reduxStore.getState();
      if (state?.auth?.token) {
        return { token: state.auth.token, source: 'redux-store' };
      }
    }

    // Check localStorage
    const localStorageToken = localStorage.getItem('auth_token');
    if (localStorageToken) {
      return { token: localStorageToken, source: 'localStorage' };
    }

    // Check sessionStorage
    const sessionStorageToken = sessionStorage.getItem('auth_token');
    if (sessionStorageToken) {
      return { token: sessionStorageToken, source: 'sessionStorage' };
    }

    // Check for refresh token in cookies
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'refresh_token') {
        return { token: decodeURIComponent(value), source: 'cookie:refresh_token' };
      }
    }

    // Check other common token names in localStorage
    const commonTokenNames = [
      'token', 'jwt_token', 'access_token', 'id_token', 'idToken',
      'accessToken', 'jwtToken', 'authToken', 'refresh_token'
    ];

    for (const name of commonTokenNames) {
      const token = localStorage.getItem(name);
      if (token) {
        return { token, source: `localStorage:${name}` };
      }

      const sessionToken = sessionStorage.getItem(name);
      if (sessionToken) {
        return { token: sessionToken, source: `sessionStorage:${name}` };
      }
    }

    return null;
  } catch (e) {
    console.error('Error while finding auth token:', e);
    return null;
  }
};

/**
 * Get recent language messages for a user
 * @param userId The user ID to fetch messages for
 * @param limit Optional limit on the number of messages to return (default: 10)
 * @param token Optional JWT token for authorization
 * @returns Promise with array of language messages
 */
export const getUserLanguageMessages = async (
  userId: string,
  limit: number = 10,
  token?: string
): Promise<LanguageInteraction[]> => {
  try {
    console.log(`Fetching recent language messages for user: ${userId}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization if we have a token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      const tokenInfo = findAuthToken();
      if (tokenInfo) {
        headers['Authorization'] = `Bearer ${tokenInfo.token}`;
      }
    }

    // Direct query to the language_message table
    const response = await fetch(`${API_URL}/api/language-ai/messages/user/${userId}?limit=${limit}`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch user messages: ${errorText}`);

      // If response is not ok, return mock data
      if (!response.ok) {
        console.log('Using mock data for language messages');
        return generateMockLanguageMessages(userId, limit);
      }

      throw new Error(`Failed to fetch language messages: ${response.statusText}`);
    }

    const data = await response.json();

    // Process the data to match our expected format
    // Map database fields to our model fields
    const messages = Array.isArray(data) ? data : (data.content || []);

    return messages.map((msg: ApiLanguageMessage) => {
      // Convert createdAt to Date with proper type handling
      let createdAtDate: Date;
      try {
        if (msg.created_at) {
          if (Array.isArray(msg.created_at)) {
            createdAtDate = convertArrayToDate(msg.created_at);
          } else if (typeof msg.created_at === 'string') {
            createdAtDate = new Date(msg.created_at);
          } else if (msg.created_at instanceof Date) {
            createdAtDate = msg.created_at;
          } else {
            createdAtDate = new Date();
          }
        } else {
          createdAtDate = new Date();
        }
      } catch (error) {
        console.error("Error converting date:", error);
        createdAtDate = new Date();
      }

      return {
        id: msg.id || `mock-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        sessionId: msg.sessionId || `session-${userId}`,
        userMessage: msg.message_type === 'USER_MESSAGE' ? msg.content : '',
        aiResponse: msg.message_type === 'AI_RESPONSE' ? msg.content : '',
        createdAt: createdAtDate.toISOString(),
        messageType: msg.message_type || ''
      };
    });
  } catch (error) {
    console.error('Error fetching language messages:', error);
    return generateMockLanguageMessages(userId, limit);
  }
};

/**
 * Get conversations grouped by user messages and AI responses
 * This function fetches recent language messages from the API and groups them into pairs.
 * 
 * @param userId User ID to fetch messages for
 * @param limit Maximum number of messages to fetch
 * @param token Optional JWT token for authorization
 * @returns Promise with an array of LanguageInteraction objects
 */
export const getLanguageConversations = async (
  userId: string,
  limit: number = 40,
  token?: string
): Promise<LanguageInteraction[]> => {
  try {
    console.log(`Fetching language conversations for user: ${userId}, limit: ${limit}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Use either the provided token or try to find one
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      const tokenInfo = findAuthToken();
      if (tokenInfo) {
        headers['Authorization'] = `Bearer ${tokenInfo.token}`;
      }
    }

    // Use the new API endpoint to get messages for a user
    const response = await fetch(`${API_URL}/api/language-ai/messages/user/${userId}?limit=${limit}`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      console.error(`Error fetching language conversations: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch language conversations: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.length} messages for user ${userId}`);

    // Process messages into properly structured LanguageInteraction objects
    const conversations: LanguageInteraction[] = data.map((message: ApiLanguageMessage) => {
      // Handle date fields safely
      let createdAtDate: Date;
      try {
        // Try to parse a date from various possible formats
        const dateSource = message.created_at || message.createdAt;
        if (dateSource) {
          if (dateSource instanceof Date) {
            createdAtDate = dateSource;
          } else if (Array.isArray(dateSource)) {
            // Use the convertArrayToDate function
            createdAtDate = convertArrayToDate(dateSource);
          } else if (typeof dateSource === 'string') {
            // Convert string to Date
            createdAtDate = new Date(dateSource);
          } else {
            createdAtDate = new Date();
          }
        } else {
          createdAtDate = new Date();
        }
      } catch (error) {
        console.error("Error processing date:", error);
        createdAtDate = new Date();
      }

      // Create a properly typed message object
      return {
        id: message.id || `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sessionId: message.sessionId || `session-${userId}`,
        userMessage: message.content && message.messageType === 'USER_MESSAGE'
          ? message.content
          : message.userMessage || '',
        aiResponse: message.content && message.messageType === 'AI_RESPONSE'
          ? message.content
          : message.aiResponse || '',
        messageType: message.messageType || '',
        language: message.language || 'en-US',
        createdAt: createdAtDate.toISOString(),
        userId: message.userId || userId
      };
    });

    return conversations;
  } catch (error) {
    console.error('Error in getLanguageConversations:', error);

    // In case of error, return mock data for development
    return generateMockLanguageMessages(userId, limit);
  }
};

/**
 * Generate mock language messages for development/testing
 */
export const generateMockLanguageMessages = (userId: string, limit: number): LanguageInteraction[] => {
  const messages: LanguageInteraction[] = [];
  const mockLanguages = ['en-US', 'es-ES', 'fr-FR', 'de-DE'];
  const mockLevels = ['beginner', 'intermediate', 'advanced'];

  // Create mock messages
  for (let i = 0; i < limit; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i); // Each message is one day older

    // Create a complete mock conversation with a sessionId
    messages.push({
      id: `mock-msg-${i}`,
      sessionId: `session-${userId}`,
      userMessage: `This is user message ${i + 1}. How do I say this in ${mockLanguages[i % mockLanguages.length]}?`,
      aiResponse: `This is AI response ${i + 1}. You would say: "Example translated text for ${mockLevels[i % mockLevels.length]} level"`,
      createdAt: date.toISOString()
    });
  }

  return messages;
};