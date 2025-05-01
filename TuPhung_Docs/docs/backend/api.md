﻿﻿---
sidebar_position: 7
description: "REST API Overview"
---

# API Endpoints

## REST API Overview

The Enterprise Nexus Project provides a comprehensive REST API for all functionality.

## Authentication Endpoints

- POST /api/auth/login: User login
- POST /api/auth/register: User registration
- POST /api/auth/refresh: Refresh authentication token
- POST /api/auth/logout: User logout

## User Management Endpoints

- GET /api/users: Get all users
- GET /api/users/\{id\}: Get user by ID
- PUT /api/users/\{id\}: Update user
- DELETE /api/users/\{id\}: Delete user

## Chat Endpoints

- GET /api/chats: Get all chats for current user
- GET /api/chats/\{id\}: Get chat by ID
- POST /api/chats: Create new chat
- PUT /api/chats/\{id\}: Update chat
- DELETE /api/chats/\{id\}: Delete chat
- GET /api/chats/\{id\}/messages: Get messages for chat
- POST /api/chats/\{id\}/messages: Send message to chat

## Task Management Endpoints

- GET /api/boards: Get all kanban boards
- GET /api/boards/\{id\}: Get board by ID
- POST /api/boards: Create new board
- PUT /api/boards/\{id\}: Update board
- DELETE /api/boards/\{id\}: Delete board
- GET /api/boards/\{id\}/tasks: Get tasks for board
- POST /api/boards/\{id\}/tasks: Create new task

## Calendar Endpoints

- GET /api/events: Get all calendar events
- GET /api/events/\{id\}: Get event by ID
- POST /api/events: Create new event
- PUT /api/events/\{id\}: Update event
- DELETE /api/events/\{id\}: Delete event

## Speech Processing Endpoints

- POST /api/speech/transcribe: Transcribe speech to text
- POST /api/speech/synthesize: Synthesize text to speech

## Example Responses

### User Response

```
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "username": "johndoe",
  "email": "john.doe@example.com",
  "full_name": "John Doe",
  "role": "USER",
  "created_at": "2023-05-15T10:30:45Z",
  "updated_at": "2023-05-15T10:30:45Z"
}
```

### Chat Response

```
{
  "chat_id": "123e4567-e89b-12d3-a456-426614174001",
  "title": "Project Discussion",
  "participants": [
    {
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "username": "johndoe"
    },
    {
      "user_id": "123e4567-e89b-12d3-a456-426614174002",
      "username": "janedoe"
    }
  ],
  "created_at": "2023-05-15T10:30:45Z",
  "updated_at": "2023-05-15T10:30:45Z"
}
```

### Task Response

```
{
  "task_id": "123e4567-e89b-12d3-a456-426614174003",
  "title": "Implement API",
  "description": "Implement the REST API for the project",
  "status": "IN_PROGRESS",
  "assignee": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "johndoe"
  },
  "due_date": "2023-06-15T23:59:59Z",
  "created_at": "2023-05-15T10:30:45Z",
  "updated_at": "2023-05-15T10:30:45Z"
}
```

