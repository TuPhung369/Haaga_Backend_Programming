// LanguageService.ts
// Service for managing language sessions and interactions

import { LanguageSession, LanguageInteraction, LanguageFeedback } from '../models/LanguageAI';

export const API_URL = 'http://localhost:9095/identify_service'; // Correct Spring Boot URL with context path
export const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/c1784e69-2d89-45fb-b47d-dd13dddcf31e/chat';

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

    const interactionToSave = {
      ...interactionData,
      createdAt: new Date()
    };

    console.log('📦 Interaction save payload:', interactionToSave);

    // Use the development endpoint that bypasses CAPTCHA validation
    const response = await fetch(`${API_URL}/api/language-ai/interactions/dev`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(interactionToSave),
    });

    const responseData = await response.json();

    // Even with status 200, the dev endpoint might return an error message
    if (responseData.error) {
      console.error(`⚠️ Server reported error: ${responseData.error}`);
      console.log(`ℹ️ Server note: ${responseData.note || 'None provided'}`);

      // If the session wasn't found, try to retrieve it and display for debugging
      if (responseData.error.includes('Session not found') || responseData.error.includes('not found')) {
        console.warn(`🔍 Session ID format problem detected. The backend might be expecting a different format.`);
        console.log(`💡 Your current sessionId format: ${interactionData.sessionId}`);
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

      console.log('⚠️ Using mock interaction due to server error:', mockInteraction);
      return mockInteraction;
    }

    if (!response.ok && !responseData.id) {
      const errorBody = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
      console.error("❌ Save interaction error response:", errorBody);
      throw new Error(`Failed to save interaction: ${response.statusText}`);
    }

    console.log('✅ Interaction saved successfully:', responseData);

    return {
      id: responseData.id || `saved-${Date.now()}`,
      sessionId: interactionData.sessionId,
      userMessage: interactionData.userMessage,
      aiResponse: interactionData.aiResponse,
      audioUrl: interactionData.audioUrl,
      feedback: interactionData.feedback,
      createdAt: responseData.createdAt ? new Date(responseData.createdAt) : new Date()
    };
  } catch (error) {
    console.error('❌ Error saving interaction:', error);

    const mockInteraction: LanguageInteraction = {
      id: `mock-${Date.now()}`,
      sessionId: interactionData.sessionId,
      userMessage: interactionData.userMessage,
      aiResponse: interactionData.aiResponse,
      audioUrl: interactionData.audioUrl,
      feedback: interactionData.feedback,
      createdAt: new Date(),
    };

    console.log('⚠️ Using mock interaction instead:', mockInteraction);
    return mockInteraction;
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