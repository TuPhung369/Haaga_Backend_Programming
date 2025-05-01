---
sidebar_position: 8
---

# WebSockets

## WebSocket Overview

The TuPhung Project uses WebSockets for real-time communication.

## WebSocket Implementation

The backend implements WebSockets using:

- Spring WebSocket
- STOMP (Simple Text Oriented Messaging Protocol)
- SockJS for fallback support

## Message Types

The system supports various message types:

- Chat messages
- Notifications
- Status updates
- Real-time collaboration events

## WebSocket Security

WebSocket connections are secured with:

- Authentication token validation
- Connection timeout
- Message size limits
- Rate limiting

## Subscription Topics

Clients can subscribe to various topics:

- `/topic/chat/{chatId}`: Chat messages
- `/topic/notifications/{userId}`: User notifications
- `/topic/board/{boardId}`: Kanban board updates
- `/topic/calendar/{userId}`: Calendar updates

## Message Format

WebSocket messages use a consistent JSON format:

```json
{
  "type": "CHAT_MESSAGE",
  "timestamp": "2023-05-15T10:30:45Z",
  "senderId": "user123",
  "payload": {
    "chatId": "chat456",
    "content": "Hello, world!",
    "contentType": "TEXT"
  }
}
```

