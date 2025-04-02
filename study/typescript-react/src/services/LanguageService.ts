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

/**
 * Create a new language session (via Spring Boot)
 * @param language The language code (e.g., 'fi-FI')
 * @param proficiencyLevel Optional proficiency level (defaults to 'intermediate')
 * @param userId Optional user identifier (defaults to 'guest')
 * @returns Promise with the session data
 */
export const createLanguageSession = async (
  language: string,
  proficiencyLevel: string = 'intermediate',
  userId: string = 'guest'
): Promise<LanguageSession> => {
  try {
    console.log(`📡 Creating language session: language=${language}, proficiencyLevel=${proficiencyLevel}, userId=${userId}`);

    const payload = {
      language,
      userId,
      proficiencyLevel
    };
    console.log('📦 Session creation payload:', payload);

    const response = await fetch(`${API_URL}/api/speech/language-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Session creation failed with status ${response.status}: ${errorText}`);
      throw new Error(`Failed to create language session: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Session created successfully:', data);

    // Store the session in localStorage for backup/debugging
    try {
      localStorage.setItem(`session_${data.id}`, JSON.stringify(data));
      console.log(`💾 Session ${data.id} saved to localStorage`);
    } catch (e) {
      console.warn('Could not save session to localStorage:', e);
    }

    return {
      id: data.id || `mock-session-${Date.now()}`,
      userId: data.userId || 'unknown',
      language: data.language || language,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
    };
  } catch (error) {
    console.error('❌ Error creating language session:', error);

    // Generate a fallback session
    const mockSessionId = `mock-${Date.now()}`;
    const mockSession: LanguageSession = {
      id: mockSessionId,
      userId: 'guest',
      language,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('⚠️ Using mock session instead:', mockSession);

    // Store mock session in localStorage for consistency
    try {
      localStorage.setItem(`session_${mockSessionId}`, JSON.stringify(mockSession));
      console.log(`💾 Mock session ${mockSessionId} saved to localStorage`);
    } catch (e) {
      console.warn('Could not save mock session to localStorage:', e);
    }

    return mockSession;
  }
};

/**
 * Save an interaction (via Spring Boot to internal DB)
 * @param interaction The interaction data to save (matching LanguageInteraction model)
 * @returns Promise with the saved interaction data
 */
export const saveInteraction = async (
  interactionData: {
    sessionId: string;
    userMessage: string;
    aiResponse: string;
    audioUrl?: string;
    feedback?: LanguageFeedback;
  }
): Promise<LanguageInteraction> => {
  try {
    console.log(`📡 Saving interaction for session: ${interactionData.sessionId}`);

    // Check if we have the session in localStorage
    const savedSession = localStorage.getItem(`session_${interactionData.sessionId}`);
    if (savedSession) {
      console.log(`📋 Found matching session in localStorage: ${savedSession}`);
    } else {
      console.warn(`⚠️ Session ${interactionData.sessionId} not found in localStorage`);
    }

    // Handle session ID formatting - backend expects without "session-" prefix
    let sessionId = interactionData.sessionId;
    if (sessionId && sessionId.startsWith('session-')) {
      sessionId = sessionId.substring(8); // Remove "session-" prefix
      console.log(`🔄 Adjusted sessionId from ${interactionData.sessionId} to ${sessionId} for backend compatibility`);
    }

    const interactionToSave = {
      ...interactionData,
      sessionId, // Use the adjusted sessionId
      createdAt: new Date()
    };

    console.log('📦 Interaction save payload:', interactionToSave);

    // First verify that the session exists
    try {
      const sessionExists = await verifySessionExists(interactionData.sessionId);
      console.log(`🔍 Session verification result: ${sessionExists ? '✅ Session exists' : '❌ Session not found'}`);

      if (!sessionExists) {
        console.warn(`⚠️ Session ${interactionData.sessionId} not found in database, interaction might not save correctly`);
      }
    } catch (error) {
      console.warn(`⚠️ Error verifying session existence: ${error}`);
    }

    // Use the development endpoint that bypasses CAPTCHA validation
    const response = await fetch(`${API_URL}/api/language-ai/interactions/dev`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(interactionToSave),
    });

    // Log the raw response for debugging
    const responseText = await response.text();
    console.log(`🔍 Raw response from server: ${responseText}`);

    // Try to parse as JSON, but handle text responses too
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      console.warn(`⚠️ Response is not valid JSON: ${responseText}`);
      responseData = { error: 'Invalid JSON response', rawResponse: responseText };
    }

    // Even with status 200, the dev endpoint might return an error message
    if (responseData.error) {
      console.error(`⚠️ Server reported error: ${responseData.error}`);
      console.log(`ℹ️ Server note: ${responseData.note || 'None provided'}`);

      // If the session wasn't found, try to retrieve it and display for debugging
      if (responseData.error.includes('Session not found') || responseData.error.includes('not found')) {
        console.warn(`🔍 Session ID format problem detected. The backend might be expecting a different format.`);
        console.log(`💡 Your current sessionId format: ${interactionData.sessionId}, adjusted to: ${sessionId}`);

        // Try to retrieve the session from the backend as a diagnostic
        try {
          const exists = await verifySessionExists(interactionData.sessionId);
          console.log(`🔍 Session verification after error: ${exists ? 'Session exists' : 'Session does not exist'}`);
        } catch (verifyError) {
          console.error(`❌ Session verification failed: ${verifyError}`);
        }
      }

      // Create a mock interaction but include the server error
      const mockInteraction: LanguageInteraction = {
        id: `error-${Date.now()}`,
        sessionId: interactionData.sessionId,
        userMessage: interactionData.userMessage,
        aiResponse: interactionData.aiResponse,
        audioUrl: interactionData.audioUrl,
        feedback: interactionData.feedback,
        createdAt: new Date(),
      };

      // Store mock interaction in localStorage for fallback retrieval
      try {
        const interactionKey = `interaction_${interactionData.sessionId}_${Date.now()}`;
        localStorage.setItem(interactionKey, JSON.stringify(mockInteraction));
        console.log(`💾 Mock interaction saved to localStorage with key: ${interactionKey}`);
      } catch (e) {
        console.warn("Could not save mock interaction to localStorage:", e);
      }

      console.log('⚠️ Using mock interaction due to server error:', mockInteraction);
      return mockInteraction;
    }

    if (!response.ok && !responseData.id) {
      const errorBody = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
      console.error("❌ Save interaction error response:", errorBody);

      // Check server connectivity
      try {
        const pingResponse = await fetch(`${API_URL}/api/health/ping`, { method: 'GET' });
        if (pingResponse.ok) {
          console.log("✅ Server is reachable, issue might be with the interaction endpoint");
        } else {
          console.error("❌ Server ping failed, potential connectivity issues");
        }
      } catch (e) {
        console.error("❌ Server ping failed with exception:", e);
      }

      throw new Error(`Failed to save interaction: ${response.statusText}`);
    }

    console.log('✅ Interaction saved successfully:', responseData);

    const savedInteraction = {
      id: responseData.id || `saved-${Date.now()}`,
      sessionId: interactionData.sessionId, // Keep the original session ID for frontend consistency
      userMessage: interactionData.userMessage,
      aiResponse: interactionData.aiResponse,
      audioUrl: interactionData.audioUrl,
      feedback: interactionData.feedback,
      createdAt: responseData.createdAt ? new Date(responseData.createdAt) : new Date()
    };

    // Store successful interaction in localStorage as backup
    try {
      const interactionKey = `interaction_${interactionData.sessionId}_${savedInteraction.id}`;
      localStorage.setItem(interactionKey, JSON.stringify(savedInteraction));
      console.log(`💾 Interaction saved to localStorage with key: ${interactionKey}`);
    } catch (e) {
      console.warn("Could not save interaction to localStorage:", e);
    }

    return savedInteraction;
  } catch (error) {
    console.error("❌ Error saving interaction:", error);

    // Network errors need special handling
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error(`💥 Network error when connecting to ${API_URL}. Check if the server is running and accessible.`);
    }

    // Create a fallback interaction to maintain UI functionality
    const fallbackInteraction: LanguageInteraction = {
      id: `fallback-${Date.now()}`,
      sessionId: interactionData.sessionId,
      userMessage: interactionData.userMessage,
      aiResponse: interactionData.aiResponse,
      audioUrl: interactionData.audioUrl,
      feedback: interactionData.feedback,
      createdAt: new Date(),
    };

    // Store fallback in localStorage
    try {
      const interactionKey = `interaction_fallback_${interactionData.sessionId}_${Date.now()}`;
      localStorage.setItem(interactionKey, JSON.stringify({
        ...fallbackInteraction,
        error: error instanceof Error ? error.message : String(error)
      }));
      console.log(`💾 Fallback interaction saved to localStorage with key: ${interactionKey}`);
    } catch (e) {
      console.warn("Could not save fallback interaction to localStorage:", e);
    }

    return fallbackInteraction;
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
 * @param sessionId The session ID to include in the N8N request
 * @returns Promise with the AI response text
 */
export const getAIResponseFromN8n = async (
  userInput: string,
  language: string,
  level: string,
  sessionId: string
): Promise<string> => {
  console.log(`🔍 [STEP 2.1] Preparing N8N request with:
  - User input: "${userInput.substring(0, 50)}${userInput.length > 50 ? '...' : ''}"
  - Language: ${language}
  - Proficiency level: ${level}
  - Session ID: ${sessionId}`);

  if (!N8N_WEBHOOK_URL) {
    console.warn('❌ [STEP 2.1] N8n webhook URL not configured. Using fallback response.');
    return generateFallbackResponse(userInput, language, level);
  }

  try {
    // Prepare the request payload
    const payload = {
      userInput: userInput,
      language: language,
      proficiencyLevel: level,
      sessionId: sessionId
    };

    console.log(`🔍 [STEP 2.2] Sending request to N8N webhook: ${N8N_WEBHOOK_URL}`);
    console.log(`📦 [STEP 2.2] Request payload:`, payload);

    const startTime = performance.now();
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const responseTime = Math.round(performance.now() - startTime);

    console.log(`✅ [STEP 2.3] Received response from N8N in ${responseTime}ms, status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ [STEP 2.3] N8n error response:`, errorBody);
      throw new Error(`N8n service error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`🔍 [STEP 2.4] Parsing N8N response:`, data);

    // Extract response from different possible formats
    let aiResponse = '';
    if (data.aiResponse) {
      aiResponse = data.aiResponse;
      console.log(`✅ [STEP 2.4] Found response in 'aiResponse' field`);
    } else if (data.message) {
      aiResponse = data.message;
      console.log(`✅ [STEP 2.4] Found response in 'message' field`);
    } else if (data.output) {
      aiResponse = data.output;
      console.log(`✅ [STEP 2.4] Found response in 'output' field`);
    } else if (typeof data === 'string') {
      aiResponse = data;
      console.log(`✅ [STEP 2.4] Response is a direct string`);
    } else {
      console.warn(`⚠️ [STEP 2.4] No recognized response format, using fallback`);
      aiResponse = generateFallbackResponse(userInput, language, level);
    }

    console.log(`✅ [STEP 2.5] Final AI response: "${aiResponse.substring(0, 50)}${aiResponse.length > 50 ? '...' : ''}"`);
    return aiResponse;
  } catch (error) {
    console.error(`❌ [STEP 2.X] Error getting AI response from N8n:`, error);
    // Use the fallback response generator instead of a static message
    const fallbackResponse = generateFallbackResponse(userInput, language, level);
    console.log(`⚠️ [STEP 2.X] Using fallback response: "${fallbackResponse.substring(0, 50)}${fallbackResponse.length > 50 ? '...' : ''}"`);
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
        createdAt: new Date(item.createdAt)
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
        createdAt: new Date(item.createdAt)
      }));
    }

    // If response is not in expected format
    console.warn('⚠️ Unexpected response format for interactions:', data);
    return [];
  } catch (error) {
    console.error("❌ Error fetching interactions:", error);

    // Try to recover from localStorage
    console.warn("⚠️ Attempting to recover interactions from localStorage");

    // Find all interactions for this session stored in localStorage
    const localInteractions: LanguageInteraction[] = [];

    try {
      const prefix = `interaction_${sessionId}_`;
      const fallbackPrefix = `interaction_fallback_${sessionId}_`;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(prefix) || key.startsWith(fallbackPrefix))) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const interaction = JSON.parse(item);
              if (interaction.sessionId === sessionId) {
                localInteractions.push({
                  id: interaction.id,
                  sessionId: interaction.sessionId,
                  userMessage: interaction.userMessage,
                  aiResponse: interaction.aiResponse,
                  audioUrl: interaction.audioUrl,
                  feedback: interaction.feedback,
                  createdAt: new Date(interaction.createdAt)
                });
              }
            }
          } catch (e) {
            console.warn(`Could not parse localStorage item: ${key}`, e);
          }
        }
      }

      if (localInteractions.length > 0) {
        console.log(`✅ Recovered ${localInteractions.length} interactions from localStorage`);
        return localInteractions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      } else {
        console.warn("⚠️ No interactions found, returning empty array");
        return [];
      }
    } catch (e) {
      console.error("❌ Error recovering from localStorage:", e);
      return [];
    }
  }
};

/**
 * Verify a session exists in the database
 * @param sessionId Session ID to verify
 * @returns Promise resolving to boolean indicating if session exists
 */
export const verifySessionExists = async (sessionId: string): Promise<boolean> => {
  try {
    console.log(`🔍 Verifying session exists in database: ${sessionId}`);

    // Try to fetch interactions for the session - if it returns a valid response, the session exists
    const response = await fetch(`${API_URL}/api/language-ai/sessions/${sessionId}/exists`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Session verification result: ${data.exists}`);
      return data.exists;
    }

    console.log(`⚠️ Session verification failed with status: ${response.status}`);
    return false;
  } catch (error) {
    console.error('❌ Error verifying session:', error);

    // Fallback to checking localStorage
    console.log('⚠️ Falling back to localStorage check');
    const savedSession = localStorage.getItem(`session_${sessionId}`);
    return !!savedSession;
  }
};