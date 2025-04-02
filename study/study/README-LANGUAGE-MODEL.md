# Language Practice - Simplified Data Model

## Overview

This document explains the simplified data model for the language practice feature. The previous implementation used 5 separate entities, which added unnecessary complexity. This new implementation consolidates everything into a single `LanguageMessage` entity.

## Why Simplify?

The previous model used 5 separate entities:
1. `LanguageSession` - Session information
2. `LanguageInteraction` - User-AI exchanges
3. `LanguageFeedback` - Assessment of user's language
4. `LanguageCorrection` - Text corrections
5. `LanguageSuggestion` - Improvement suggestions

This approach was unnecessarily complex for several reasons:
- It created a deep object hierarchy that was difficult to navigate
- It required multiple database queries to retrieve related data
- It made the codebase harder to maintain and understand
- The separate tables weren't providing much normalization benefit

## New Design: Single Entity Model

The new design uses a single `LanguageMessage` entity that represents all types of messages in the language practice system:

```
LanguageMessage
├── id
├── sessionId
├── userId
├── language
├── proficiencyLevel
├── messageType (USER_MESSAGE, AI_RESPONSE, AI_FEEDBACK, SYSTEM_MESSAGE)
├── content
├── audioUrl
├── isSessionMetadata
├── pronunciationScore (only for AI_FEEDBACK)
├── grammarScore (only for AI_FEEDBACK)
├── vocabularyScore (only for AI_FEEDBACK)
├── fluencyScore (only for AI_FEEDBACK)
├── corrections (JSON string, only for AI_FEEDBACK)
├── suggestions (JSON string, only for AI_FEEDBACK)
├── replyToId (reference to another message, for threading)
├── createdAt
└── updatedAt
```

Benefits of this approach:
- Simplifies the data model significantly
- Makes queries faster and more straightforward
- Reduces code complexity
- Follows the document-oriented pattern common in chat/messaging applications
- Makes the codebase more maintainable

## How It Works

### Sessions
- A language practice session is represented by a collection of messages with the same `sessionId`
- The first message in a session has `isSessionMetadata = true` and contains session metadata
- Sessions can be easily retrieved by querying for messages with a particular `sessionId`

### Message Types
- `USER_MESSAGE` - Messages from the user
- `AI_RESPONSE` - Responses from the AI language tutor
- `AI_FEEDBACK` - Assessment/feedback messages (contains scores and suggestions)
- `SYSTEM_MESSAGE` - System messages (session creation, etc.)

### Conversation Flow
1. User creates a session -> System creates a `SYSTEM_MESSAGE` with metadata
2. User sends a message -> System creates a `USER_MESSAGE`
3. AI responds -> System creates an `AI_RESPONSE`
4. AI provides feedback -> System creates an `AI_FEEDBACK` (optional)

## Migration Process

A data migration utility is included to help migrate data from the old model to the new model:

1. The migration runs automatically when the application starts
2. It only runs if there is data in the old model but none in the new model
3. For each session in the old model:
   - Creates a session metadata message
   - For each interaction, creates user and AI messages
   - For each feedback, creates an AI feedback message
4. All timestamps, IDs, and other metadata are preserved

## API Endpoints

The new API provides these endpoints:

- `POST /api/language/sessions` - Create a new language practice session
- `GET /api/language/users/{userId}/sessions` - Get all sessions for a user
- `GET /api/language/sessions/{sessionId}/messages` - Get all messages in a session
- `POST /api/language/messages` - Save a user message (and get AI response)
- `GET /api/language/sessions/{sessionId}/exists` - Check if a session exists
- `GET /api/language/sessions/{sessionId}/metadata` - Get session metadata

## Technical Notes

- The corrections and suggestions are stored as JSON strings
- The `replyToId` field allows for threaded conversations
- The `isSessionMetadata` flag helps quickly find session information
- Indexes are created for all fields commonly used in WHERE clauses

## Conclusion

This simplified model maintains all the functionality of the previous model while being significantly easier to understand, maintain, and extend. The migration process ensures a smooth transition from the old model to the new one. 