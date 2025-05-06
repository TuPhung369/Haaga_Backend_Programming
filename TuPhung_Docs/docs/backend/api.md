﻿---
sidebar_position: 2
sidebar_label: "API"
description: "Comprehensive documentation for the REST API architecture, endpoints, and integration patterns"
---

import PanzoomWrapper from '@site/src/components/MermaidDiagram/PanzoomWrapper';

# API Architecture and Endpoints

## API Architecture and Workflows

### API Request Processing Workflow

<PanzoomWrapper>
<div id="api-request-processing-diagram">
```mermaid
sequenceDiagram
    participant Client as Client
    participant Gateway as API Gateway
    participant Auth as Auth Service
    participant Controller as API Controller
    participant Service as Service Layer
    participant Repository as Data Repository
    participant DB as Database

    Client->>Gateway: HTTP Request
    Gateway->>Gateway: Request Preprocessing
    Gateway->>Auth: Authentication Check

    alt Authentication Failed
        Auth-->>Gateway: 401 Unauthorized
        Gateway-->>Client: 401 Response
    else Authentication Successful
        Auth-->>Gateway: User Context
        Gateway->>Controller: Forward Request
        Controller->>Controller: Validate Request

        alt Validation Failed
            Controller-->>Gateway: 400 Bad Request
            Gateway-->>Client: 400 Response
        else Validation Successful
            Controller->>Service: Process Request
            Service->>Repository: Data Operation
            Repository->>DB: Database Query
            DB-->>Repository: Query Result
            Repository-->>Service: Data Objects
            Service-->>Controller: Response Data
            Controller-->>Gateway: HTTP Response
            Gateway->>Gateway: Response Postprocessing
            Gateway-->>Client: Final Response
        end
    end

````
</div>
</PanzoomWrapper>

### API Resource Lifecycle
<PanzoomWrapper>
<div id="api-resource-lifecycle-diagram">
```mermaid
stateDiagram-v2
    [*] --> Created: POST Request
    Created --> Retrieved: GET Request
    Retrieved --> Updated: PUT/PATCH Request
    Updated --> Retrieved: GET Request
    Retrieved --> Deleted: DELETE Request
    Deleted --> [*]

    Created --> Listed: GET Collection
    Updated --> Listed: GET Collection

    state Retrieved {
        [*] --> Full: Full Resource
        [*] --> Partial: Projection
    }

    state Updated {
        [*] --> FullUpdate: PUT Request
        [*] --> PartialUpdate: PATCH Request
    }
````

</div>
</PanzoomWrapper>

### API Error Handling Workflow

<PanzoomWrapper>
<div id="api-error-handling-diagram">
```mermaid
flowchart TD
    A[API Request] --> B{Error Occurs?}
    B -->|No| C[Normal Processing]
    B -->|Yes| D{Error Type}

    D -->|Validation Error| E[400 Bad Request]
    D -->|Authentication Error| F[401 Unauthorized]
    D -->|Authorization Error| G[403 Forbidden]
    D -->|Resource Not Found| H[404 Not Found]
    D -->|Method Not Allowed| I[405 Method Not Allowed]
    D -->|Conflict| J[409 Conflict]
    D -->|Server Error| K[500 Internal Server Error]

    E --> L[Format Error Response]
    F --> L
    G --> L
    H --> L
    I --> L
    J --> L
    K --> L

    L --> M[Log Error]
    M --> N[Return Error Response]

    classDef entryPoints fill:#4CAF50,stroke:#333,stroke-width:1px,color:#fff
    classDef middleware fill:#FF9800,stroke:#333,stroke-width:1px,color:#fff
    classDef processing fill:#F44336,stroke:#333,stroke-width:1px,color:#fff
    classDef errorHandling fill:#2196F3,stroke:#333,stroke-width:1px,color:#fff

    class A,C entryPoints
    class B,D middleware
    class E,F,G,H,I,J,K processing
    class L,M,N errorHandling

````
</div>
</PanzoomWrapper>

## REST API Overview

The Enterprise Nexus Project provides a comprehensive REST API that follows industry best practices and standards. Our API is designed with a resource-oriented architecture, consistent patterns, and thorough documentation to ensure ease of use and integration.

## API Design Principles

Our API follows these key design principles:

1. **Resource-Oriented**: APIs are organized around resources and use standard HTTP methods
2. **Consistent Patterns**: Consistent URL structure, request/response formats, and error handling
3. **Stateless**: Each request contains all information needed to process it
4. **Secure by Default**: All endpoints require appropriate authentication and authorization
5. **Versioned**: API versioning to ensure backward compatibility
6. **Well-Documented**: Comprehensive documentation with examples and schemas

## API Endpoint Categories

### Authentication Endpoints

| Endpoint               | Method | Description       | Request Body                  | Response                      |
| ---------------------- | ------ | ----------------- | ----------------------------- | ----------------------------- |
| `/api/auth/login`      | POST   | User login        | `{username, password}`        | `{accessToken, refreshToken}` |
| `/api/auth/register`   | POST   | User registration | `{username, email, password}` | `{userId, message}`           |
| `/api/auth/refresh`    | POST   | Refresh token     | `{refreshToken}`              | `{accessToken}`               |
| `/api/auth/logout`     | POST   | User logout       | `{refreshToken}`              | `{message}`                   |
| `/api/auth/mfa/setup`  | POST   | Setup MFA         | `{mfaType}`                   | `{setupData}`                 |
| `/api/auth/mfa/verify` | POST   | Verify MFA        | `{code}`                      | `{verified}`                  |

### User Management Endpoints

| Endpoint            | Method | Description      | Request Body | Response    |
| ------------------- | ------ | ---------------- | ------------ | ----------- |
| `/api/users`        | GET    | Get all users    | -            | `[{user}]`  |
| `/api/users/{id}`   | GET    | Get user by ID   | -            | `{user}`    |
| `/api/users/{id}`   | PUT    | Update user      | `{userData}` | `{user}`    |
| `/api/users/{id}`   | DELETE | Delete user      | -            | `{message}` |
| `/api/users/me`     | GET    | Get current user | -            | `{user}`    |
| `/api/users/search` | GET    | Search users     | `q={query}`  | `[{user}]`  |

### Chat System Endpoints

| Endpoint                       | Method | Description      | Request Body         | Response      |
| ------------------------------ | ------ | ---------------- | -------------------- | ------------- |
| `/api/chats`                   | GET    | Get all chats    | -                    | `[{chat}]`    |
| `/api/chats/{id}`              | GET    | Get chat by ID   | -                    | `{chat}`      |
| `/api/chats`                   | POST   | Create new chat  | `{chatData}`         | `{chat}`      |
| `/api/chats/{id}`              | PUT    | Update chat      | `{chatData}`         | `{chat}`      |
| `/api/chats/{id}`              | DELETE | Delete chat      | -                    | `{message}`   |
| `/api/chats/{id}/messages`     | GET    | Get messages     | `?page={p}&size={s}` | `[{message}]` |
| `/api/chats/{id}/messages`     | POST   | Send message     | `{messageData}`      | `{message}`   |
| `/api/chats/{id}/participants` | GET    | Get participants | -                    | `[{user}]`    |
| `/api/chats/{id}/participants` | POST   | Add participant  | `{userId}`           | `{message}`   |

### Task Management Endpoints

| Endpoint                   | Method | Description     | Request Body           | Response     |
| -------------------------- | ------ | --------------- | ---------------------- | ------------ |
| `/api/boards`              | GET    | Get all boards  | -                      | `[{board}]`  |
| `/api/boards/{id}`         | GET    | Get board by ID | -                      | `{board}`    |
| `/api/boards`              | POST   | Create board    | `{boardData}`          | `{board}`    |
| `/api/boards/{id}`         | PUT    | Update board    | `{boardData}`          | `{board}`    |
| `/api/boards/{id}`         | DELETE | Delete board    | -                      | `{message}`  |
| `/api/boards/{id}/columns` | GET    | Get columns     | -                      | `[{column}]` |
| `/api/boards/{id}/columns` | POST   | Add column      | `{columnData}`         | `{column}`   |
| `/api/boards/{id}/tasks`   | GET    | Get tasks       | `?status={s}`          | `[{task}]`   |
| `/api/boards/{id}/tasks`   | POST   | Create task     | `{taskData}`           | `{task}`     |
| `/api/tasks/{id}`          | GET    | Get task by ID  | -                      | `{task}`     |
| `/api/tasks/{id}`          | PUT    | Update task     | `{taskData}`           | `{task}`     |
| `/api/tasks/{id}`          | DELETE | Delete task     | -                      | `{message}`  |
| `/api/tasks/{id}/move`     | POST   | Move task       | `{columnId, position}` | `{task}`     |

### Calendar Endpoints

| Endpoint                     | Method | Description         | Request Body             | Response       |
| ---------------------------- | ------ | ------------------- | ------------------------ | -------------- |
| `/api/events`                | GET    | Get all events      | `?from={date}&to={date}` | `[{event}]`    |
| `/api/events/{id}`           | GET    | Get event by ID     | -                        | `{event}`      |
| `/api/events`                | POST   | Create event        | `{eventData}`            | `{event}`      |
| `/api/events/{id}`           | PUT    | Update event        | `{eventData}`            | `{event}`      |
| `/api/events/{id}`           | DELETE | Delete event        | -                        | `{message}`    |
| `/api/events/search`         | GET    | Search events       | `q={query}`              | `[{event}]`    |
| `/api/calendars`             | GET    | Get calendars       | -                        | `[{calendar}]` |
| `/api/calendars/{id}/events` | GET    | Get calendar events | -                        | `[{event}]`    |

### Speech Processing Endpoints

| Endpoint                 | Method | Description             | Request Body    | Response             |
| ------------------------ | ------ | ----------------------- | --------------- | -------------------- |
| `/api/speech/transcribe` | POST   | Transcribe speech       | `audio file`    | `{text, confidence}` |
| `/api/speech/synthesize` | POST   | Synthesize speech       | `{text, voice}` | `audio file`         |
| `/api/speech/analyze`    | POST   | Analyze speech          | `audio file`    | `{analysis}`         |
| `/api/speech/languages`  | GET    | Get supported languages | -               | `[{language}]`       |
| `/api/speech/voices`     | GET    | Get available voices    | -               | `[{voice}]`          |

## API Response Formats

All API responses follow a consistent format with appropriate HTTP status codes and standardized JSON structures.

### Standard Response Format

<PanzoomWrapper>
<div id="standard-response-format">
```mermaid
classDiagram
    class BaseResponse {
        +int code
        +String message
    }

    class SuccessResponse {
        +int code
        +String message
        +Object data
        +Object metadata
    }

    class ErrorResponse {
        +int code
        +String message
        +String errorCode
        +Object details
        +String timestamp
    }

    class PaginatedResponse {
        +int code
        +String message
        +Object[] content
        +int page
        +int size
        +int totalPages
        +int totalElements
        +boolean last
    }

    SuccessResponse --|> BaseResponse
    ErrorResponse --|> BaseResponse
    PaginatedResponse --|> SuccessResponse
```
</div>
</PanzoomWrapper>

### Example Responses

#### Authentication Response

```json
{
  "code": 2000,
  "message": "Authentication successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

#### User Response

```json
{
  "code": 2000,
  "message": "User retrieved successfully",
  "data": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "full_name": "John Doe",
    "role": "USER",
    "profile_image": "https://example.com/profiles/johndoe.jpg",
    "status": "ACTIVE",
    "created_at": "2023-05-15T10:30:45Z",
    "updated_at": "2023-05-15T10:30:45Z"
  }
}
```

#### Chat Response

```json
{
  "code": 2000,
  "message": "Chat retrieved successfully",
  "data": {
    "chat_id": "123e4567-e89b-12d3-a456-426614174001",
    "title": "Project Discussion",
    "type": "GROUP",
    "participants": [
      {
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "username": "johndoe",
        "profile_image": "https://example.com/profiles/johndoe.jpg",
        "status": "ONLINE"
      },
      {
        "user_id": "123e4567-e89b-12d3-a456-426614174002",
        "username": "janedoe",
        "profile_image": "https://example.com/profiles/janedoe.jpg",
        "status": "OFFLINE"
      }
    ],
    "last_message": {
      "message_id": "123e4567-e89b-12d3-a456-426614174005",
      "sender_id": "123e4567-e89b-12d3-a456-426614174000",
      "content": "Let's discuss the API design",
      "timestamp": "2023-05-15T11:45:30Z"
    },
    "created_at": "2023-05-15T10:30:45Z",
    "updated_at": "2023-05-15T11:45:30Z"
  }
}
```

#### Task Response

```json
{
  "code": 2000,
  "message": "Task retrieved successfully",
  "data": {
    "task_id": "123e4567-e89b-12d3-a456-426614174003",
    "title": "Implement API",
    "description": "Implement the REST API for the project",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "board_id": "123e4567-e89b-12d3-a456-426614174010",
    "column_id": "123e4567-e89b-12d3-a456-426614174011",
    "position": 2,
    "assignee": {
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "username": "johndoe",
      "profile_image": "https://example.com/profiles/johndoe.jpg"
    },
    "tags": ["API", "Backend", "Priority"],
    "due_date": "2023-06-15T23:59:59Z",
    "created_by": "123e4567-e89b-12d3-a456-426614174002",
    "created_at": "2023-05-15T10:30:45Z",
    "updated_at": "2023-05-15T10:30:45Z"
  }
}
```

#### Calendar Event Response

```json
{
  "code": 2000,
  "message": "Event retrieved successfully",
  "data": {
    "event_id": "123e4567-e89b-12d3-a456-426614174004",
    "title": "API Design Meeting",
    "description": "Discuss the REST API design for the project",
    "location": "Conference Room A",
    "start_time": "2023-06-10T14:00:00Z",
    "end_time": "2023-06-10T15:30:00Z",
    "all_day": false,
    "recurring": true,
    "recurrence_pattern": "WEEKLY",
    "organizer": {
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "username": "johndoe"
    },
    "attendees": [
      {
        "user_id": "123e4567-e89b-12d3-a456-426614174002",
        "username": "janedoe",
        "status": "ACCEPTED"
      },
      {
        "user_id": "123e4567-e89b-12d3-a456-426614174003",
        "username": "bobsmith",
        "status": "PENDING"
      }
    ],
    "reminders": [
      {
        "type": "EMAIL",
        "time": "30M"
      },
      {
        "type": "NOTIFICATION",
        "time": "15M"
      }
    ],
    "created_at": "2023-05-15T10:30:45Z",
    "updated_at": "2023-05-15T10:30:45Z"
  }
}
```

#### Paginated Response

```json
{
  "code": 2000,
  "message": "Messages retrieved successfully",
  "content": [
    {
      "message_id": "123e4567-e89b-12d3-a456-426614174005",
      "chat_id": "123e4567-e89b-12d3-a456-426614174001",
      "sender": {
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "username": "johndoe"
      },
      "content": "Let's discuss the API design",
      "content_type": "TEXT",
      "timestamp": "2023-05-15T11:45:30Z",
      "read_by": ["123e4567-e89b-12d3-a456-426614174002"]
    },
    {
      "message_id": "123e4567-e89b-12d3-a456-426614174006",
      "chat_id": "123e4567-e89b-12d3-a456-426614174001",
      "sender": {
        "user_id": "123e4567-e89b-12d3-a456-426614174002",
        "username": "janedoe"
      },
      "content": "I agree, let's start with the authentication endpoints",
      "content_type": "TEXT",
      "timestamp": "2023-05-15T11:46:15Z",
      "read_by": ["123e4567-e89b-12d3-a456-426614174000"]
    }
  ],
  "page": 0,
  "size": 10,
  "totalPages": 5,
  "totalElements": 42,
  "last": false
}
```

#### Error Response

```json
{
  "code": 4004,
  "message": "Resource not found",
  "errorCode": "USER_NOT_FOUND",
  "details": {
    "resourceType": "User",
    "resourceId": "123e4567-e89b-12d3-a456-426614174999"
  },
  "timestamp": "2023-05-15T10:30:45Z"
}
```

````

