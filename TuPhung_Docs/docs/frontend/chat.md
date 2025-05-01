---
sidebar_position: 5
---

# Chat System

## Chat System Overview

The TuPhung Project includes a real-time chat system for communication.

## Chat Features

- One-on-one messaging
- Group chats
- File sharing
- Message formatting
- Read receipts
- Typing indicators
- Message search
- Emoji and reactions

## Chat Components

### Chat List Component
- Displays all chats
- Shows unread message count
- Sorts by recent activity

### Conversation Component
- Displays message thread
- Handles message pagination
- Shows participant information

### Message Input Component
- Text input with formatting
- File attachment
- Emoji picker
- Mention suggestions

## Real-time Communication

The chat system uses WebSockets for real-time features:
- Instant message delivery
- Online status updates
- Typing indicators
- Read receipts

## Message Storage

- Messages stored in database
- Local caching for performance
- Offline support with message queuing
