# Simple script to copy HTML files to Markdown files

# Source and destination directories
$sourceDir = "e:/IT/Haaga_Backend_Programming/TuPhung_Project/pages"
$destDir = "e:/IT/Haaga_Backend_Programming/TuPhung_Docs/docs"

# Create directories if they don't exist
if (-not (Test-Path "$destDir/backend")) {
  New-Item -ItemType Directory -Path "$destDir/backend" -Force
}

if (-not (Test-Path "$destDir/frontend")) {
  New-Item -ItemType Directory -Path "$destDir/frontend" -Force
}

# Copy architecture.html to architecture.md
$archContent = @"
---
sidebar_position: 2
---

# System Architecture

## Architecture Overview

The TuPhung Project follows a modern, scalable architecture that separates concerns between frontend and backend components while enabling real-time communication and integration with AI services. The system is designed to be modular, maintainable, and secure.

## Key Architectural Components

### Frontend Architecture

The frontend is built with React and TypeScript, following a component-based architecture with Redux for state management.

Key components include:
- React Components (Pages, Shared Components)
- Redux State Management
- API Services
- WebSocket Communication
- Custom Hooks

### Backend Architecture

The backend is built with Spring Boot, following a layered architecture with controllers, services, and repositories.

Key components include:
- REST Controllers
- Service Layer
- Repository Layer
- Security Layer
- WebSocket Handlers
- External Services Integration

## Communication Patterns

### REST API Communication

The frontend communicates with the backend primarily through RESTful API endpoints for CRUD operations and business logic.

### WebSocket Communication

Real-time features like chat and notifications use WebSockets for bidirectional communication.

## Data Flow

The system implements various data flows for different features:
- Authentication Flow
- User Management Flow
- Chat Communication Flow
- Task Management Flow
- Calendar Event Flow
- AI Assistant Integration Flow
"@

$archContent | Out-File -FilePath "$destDir/architecture.md" -Encoding utf8
Write-Host "Created architecture.md"

# Copy tech-stack.html to tech-stack.md
$techContent = @"
---
sidebar_position: 3
---

# Technology Stack

## Frontend Technologies

- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed superset of JavaScript
- **Redux**: State management
- **React Router**: Routing library
- **Material-UI**: UI component library
- **Socket.IO Client**: WebSocket client
- **Axios**: HTTP client

## Backend Technologies

- **Spring Boot**: Java-based framework
- **Spring Security**: Authentication and authorization
- **Spring Data JPA**: Data access
- **PostgreSQL**: Relational database
- **WebSocket**: Real-time communication
- **JWT**: JSON Web Tokens for authentication
- **SpeechBrain**: Speech processing

## Development Tools

- **Git**: Version control
- **Maven**: Build automation
- **npm**: Package management
- **Docker**: Containerization
- **JUnit**: Testing framework
- **Jest**: JavaScript testing
"@

$techContent | Out-File -FilePath "$destDir/tech-stack.md" -Encoding utf8
Write-Host "Created tech-stack.md"

# Backend files
$backendFiles = @{
  "api"                = @"
---
sidebar_position: 1
---

# API Endpoints

## REST API Overview

The TuPhung Project provides a comprehensive REST API for all functionality.

## Authentication Endpoints

- `POST /api/auth/login`: User login
- `POST /api/auth/register`: User registration
- `POST /api/auth/refresh`: Refresh authentication token
- `POST /api/auth/logout`: User logout

## User Management Endpoints

- `GET /api/users`: Get all users
- `GET /api/users/{id}`: Get user by ID
- `PUT /api/users/{id}`: Update user
- `DELETE /api/users/{id}`: Delete user

## Chat Endpoints

- `GET /api/chats`: Get all chats for current user
- `GET /api/chats/{id}`: Get chat by ID
- `POST /api/chats`: Create new chat
- `PUT /api/chats/{id}`: Update chat
- `DELETE /api/chats/{id}`: Delete chat
- `GET /api/chats/{id}/messages`: Get messages for chat
- `POST /api/chats/{id}/messages`: Send message to chat

## Task Management Endpoints

- `GET /api/boards`: Get all kanban boards
- `GET /api/boards/{id}`: Get board by ID
- `POST /api/boards`: Create new board
- `PUT /api/boards/{id}`: Update board
- `DELETE /api/boards/{id}`: Delete board
- `GET /api/boards/{id}/tasks`: Get tasks for board
- `POST /api/boards/{id}/tasks`: Create new task

## Calendar Endpoints

- `GET /api/events`: Get all calendar events
- `GET /api/events/{id}`: Get event by ID
- `POST /api/events`: Create new event
- `PUT /api/events/{id}`: Update event
- `DELETE /api/events/{id}`: Delete event

## Speech Processing Endpoints

- `POST /api/speech/transcribe`: Transcribe speech to text
- `POST /api/speech/synthesize`: Synthesize text to speech
"@

  "auth"               = @"
---
sidebar_position: 2
---

# Authentication & Security

## Authentication Overview

The TuPhung Project uses JWT (JSON Web Tokens) for authentication.

## Authentication Flow

1. User submits credentials (username/password)
2. Server validates credentials
3. Server generates JWT token
4. Token is returned to client
5. Client stores token and includes it in subsequent requests
6. Server validates token for protected endpoints

## Security Features

- Password hashing with BCrypt
- Role-based access control
- HTTPS for all communications
- CSRF protection
- XSS protection
- Rate limiting
- Input validation

## OAuth2 Integration

The system supports OAuth2 authentication with:
- Google
- GitHub
- Microsoft

## Multi-Factor Authentication

Optional MFA is available using:
- Time-based One-Time Password (TOTP)
- SMS verification
"@

  "database"           = @"
---
sidebar_position: 3
---

# Database Design

## Database Overview

The TuPhung Project uses PostgreSQL as its primary database.

## Entity Relationship Diagram

The database consists of the following main entities:
- Users
- Authentication
- Chats
- Messages
- Boards
- Tasks
- Events
- Speech Records

## Key Tables

### Users Table
- id (PK)
- username
- email
- password_hash
- first_name
- last_name
- role
- created_at
- updated_at

### Authentication Table
- id (PK)
- user_id (FK)
- token
- refresh_token
- expires_at
- created_at

### Chats Table
- id (PK)
- name
- type (individual/group)
- created_at
- updated_at

### Messages Table
- id (PK)
- chat_id (FK)
- sender_id (FK)
- content
- content_type
- sent_at
- read_at

### Boards Table
- id (PK)
- name
- description
- owner_id (FK)
- created_at
- updated_at

### Tasks Table
- id (PK)
- board_id (FK)
- title
- description
- status
- assignee_id (FK)
- due_date
- created_at
- updated_at

### Events Table
- id (PK)
- title
- description
- start_time
- end_time
- location
- owner_id (FK)
- created_at
- updated_at
"@

  "exception-handling" = @"
---
sidebar_position: 4
---

# Exception Handling

## Exception Handling Overview

The TuPhung Project implements a comprehensive exception handling strategy.

## Global Exception Handler

The system uses Spring's `@ControllerAdvice` to handle exceptions globally.

## Exception Types

### Application Exceptions
- `ResourceNotFoundException`: When a requested resource doesn't exist
- `UnauthorizedException`: When a user is not authorized to access a resource
- `ValidationException`: When input validation fails
- `DuplicateResourceException`: When attempting to create a duplicate resource

### System Exceptions
- `DatabaseException`: For database-related errors
- `ExternalServiceException`: For errors in external service calls
- `FileProcessingException`: For file upload/download errors

## Error Response Format

All API errors return a consistent JSON format:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid input data",
  "timestamp": "2023-05-15T10:30:45Z",
  "path": "/api/users",
  "details": [
    "Username must be between 3 and 20 characters",
    "Email format is invalid"
  ]
}
```

## Logging

All exceptions are logged with:
- Exception type
- Exception message
- Stack trace
- Request details
- User information (if available)
"@

  "speech-processing"  = @"
---
sidebar_position: 5
---

# Speech Processing

## Speech Processing Overview

The TuPhung Project integrates advanced speech processing capabilities.

## Speech-to-Text

The system uses SpeechBrain for speech-to-text conversion with:
- Support for multiple languages
- Noise reduction
- Speaker diarization
- Punctuation prediction

## Text-to-Speech

Text-to-speech capabilities include:
- Natural-sounding voices
- Multiple languages and accents
- Adjustable speech rate
- Emotion and emphasis control

## Voice Recognition

The system can identify users by their voice patterns:
- Voice biometrics for authentication
- Speaker identification in meetings
- Voice profile management

## Integration Points

Speech processing is integrated with:
- Chat system for voice messages
- Meeting transcription
- Voice commands for application control
- Accessibility features
"@

  "structure"          = @"
---
sidebar_position: 6
---

# Project Structure

## Backend Structure Overview

The TuPhung Project backend follows a standard Spring Boot project structure.

## Directory Structure

```
src/
├── main/
│   ├── java/
│   │   └── com/
│   │       └── tuphung/
│   │           ├── config/         # Configuration classes
│   │           ├── controller/     # REST controllers
│   │           ├── dto/            # Data Transfer Objects
│   │           ├── exception/      # Custom exceptions
│   │           ├── model/          # Entity models
│   │           ├── repository/     # Data repositories
│   │           ├── security/       # Security configuration
│   │           ├── service/        # Business logic
│   │           ├── util/           # Utility classes
│   │           └── Application.java # Main application class
│   └── resources/
│       ├── application.properties  # Application properties
│       ├── application-dev.properties # Development properties
│       ├── application-prod.properties # Production properties
│       └── static/                 # Static resources
└── test/
    └── java/
        └── com/
            └── tuphung/
                ├── controller/     # Controller tests
                ├── repository/     # Repository tests
                └── service/        # Service tests
```

## Key Components

### Controllers
Handle HTTP requests and responses, mapping to service methods.

### Services
Implement business logic and orchestrate operations.

### Repositories
Interface with the database using Spring Data JPA.

### Models
Define database entities and relationships.

### DTOs
Transfer data between layers and to/from the client.

### Configuration
Configure application behavior, security, and integrations.
"@

  "user-management"    = @"
---
sidebar_position: 7
---

# User Management

## User Management Overview

The TuPhung Project implements comprehensive user management functionality.

## User Roles

The system supports multiple user roles:
- **Admin**: Full system access
- **Manager**: Team and project management
- **User**: Standard user access
- **Guest**: Limited read-only access

## User Registration

Users can register through:
- Email and password
- OAuth2 providers (Google, GitHub, Microsoft)

Registration process includes:
- Email verification
- Profile completion
- Terms acceptance

## User Profiles

User profiles include:
- Personal information
- Profile picture
- Contact details
- Preferences
- Activity history

## User Administration

Administrators can:
- Create, update, and delete users
- Assign and modify roles
- Reset passwords
- Lock/unlock accounts
- View audit logs

## Password Policies

The system enforces password policies:
- Minimum length and complexity
- Password expiration
- Password history
- Account lockout after failed attempts
"@

  "websockets"         = @"
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
"@
}

# Frontend files
$frontendFiles = @{
  "ai-assistants"    = @"
---
sidebar_position: 1
---

# AI Assistants

## AI Assistants Overview

The TuPhung Project integrates AI assistants to enhance user productivity.

## Assistant Types

The system offers multiple AI assistant types:
- **Task Assistant**: Helps with task management and prioritization
- **Meeting Assistant**: Assists with scheduling and meeting notes
- **Research Assistant**: Helps gather and organize information
- **Writing Assistant**: Assists with content creation and editing

## Key Features

### Natural Language Understanding
- Command interpretation
- Context awareness
- Multi-turn conversations

### Task Automation
- Calendar management
- Email drafting
- Information retrieval
- Task creation and assignment

### Personalization
- Learning user preferences
- Adapting to work patterns
- Customizable responses

## Integration Points

AI assistants are integrated with:
- Chat interface
- Task management system
- Calendar
- Document editor
"@

  "auth"             = @"
---
sidebar_position: 2
---

# Authentication

## Authentication Overview

The TuPhung Project frontend implements secure authentication using JWT.

## Login Flow

1. User enters credentials on login page
2. Frontend sends credentials to backend
3. Backend validates and returns JWT token
4. Frontend stores token in secure storage
5. Protected routes check for valid token

## Authentication Components

### Login Component
- Username/password form
- OAuth2 login buttons
- Remember me option
- Forgot password link

### Registration Component
- User registration form
- Email verification
- Terms acceptance

### Auth Context
- Manages authentication state
- Provides auth methods to components
- Handles token refresh

### Protected Route Component
- Redirects unauthenticated users
- Checks role-based permissions

## Security Features

- Token storage in HttpOnly cookies
- CSRF protection
- Automatic token refresh
- Session timeout handling
- Secure logout process
"@

  "calendar-revised" = @"
---
sidebar_position: 3
---

# Calendar (Revised)

## Calendar Overview

The revised calendar component in TuPhung Project offers enhanced functionality and performance.

## Key Improvements

- Optimized rendering performance
- Enhanced drag-and-drop capabilities
- Improved recurring event handling
- Better timezone support
- More customization options

## Calendar Views

- **Month View**: Traditional calendar grid
- **Week View**: Detailed week schedule
- **Day View**: Hour-by-hour daily schedule
- **Agenda View**: List of upcoming events
- **Timeline View**: Visual timeline of events

## Event Management

- Create, edit, and delete events
- Set event categories and colors
- Add location and participants
- Set reminders and notifications
- Attach files and notes

## Integration Features

- Sync with external calendars (Google, Outlook)
- Integration with task management
- Meeting scheduling with availability checking
- Resource booking (rooms, equipment)
"@

  "calendar"         = @"
---
sidebar_position: 4
---

# Calendar

## Calendar Overview

The TuPhung Project includes a comprehensive calendar system for event management.

## Calendar Features

- Event creation and management
- Multiple calendar views (month, week, day)
- Recurring events
- Event categories and color coding
- Reminders and notifications
- Sharing and collaboration

## Calendar Components

### Calendar View Component
- Renders different calendar layouts
- Handles date navigation
- Displays events appropriately

### Event Form Component
- Creates and edits events
- Validates event data
- Handles recurring event patterns

### Event Detail Component
- Displays event information
- Provides actions (edit, delete, share)
- Shows participant information

## State Management

The calendar uses Redux for state management:
- Events stored in normalized format
- Optimistic updates for better UX
- Caching for performance

## Backend Integration

- RESTful API for CRUD operations
- WebSockets for real-time updates
- Synchronization with external calendars
"@

  "chat"             = @"
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
"@

  "kanban-revised"   = @"
---
sidebar_position: 6
---

# Kanban Board (Revised)

## Kanban Board Overview

The revised Kanban board in TuPhung Project offers enhanced functionality and performance.

## Key Improvements

- Optimized drag-and-drop performance
- Enhanced filtering and sorting
- Improved task detail view
- Better support for subtasks
- More customization options

## Board Structure

- **Customizable Columns**: Define workflow stages
- **Swimlanes**: Group tasks by category, assignee, or priority
- **WIP Limits**: Set work-in-progress limits for columns
- **Collapsible Sections**: Organize related tasks

## Task Management

- Create, edit, and delete tasks
- Set priority, due date, and assignees
- Add attachments and comments
- Track time and progress
- Create dependencies between tasks

## Advanced Features

- Burndown and velocity charts
- Cumulative flow diagrams
- Cycle time and lead time tracking
- Integration with calendar and chat
- Automated workflows and triggers
"@

  "kanban"           = @"
---
sidebar_position: 7
---

# Kanban Board

## Kanban Board Overview

The TuPhung Project includes a Kanban board for visual task management.

## Kanban Features

- Customizable columns (To Do, In Progress, Done, etc.)
- Drag-and-drop task movement
- Task creation and editing
- Task filtering and sorting
- Task assignment
- Due dates and priorities
- Labels and categories

## Kanban Components

### Board Component
- Renders the overall board structure
- Manages column layout
- Handles board-level actions

### Column Component
- Displays tasks in a specific status
- Handles column-specific actions
- Shows column statistics

### Task Card Component
- Displays task information
- Provides quick actions
- Supports drag-and-drop

### Task Detail Component
- Shows comprehensive task information
- Allows detailed editing
- Displays comments and activity

## State Management

The Kanban board uses Redux for state management:
- Normalized task and board data
- Optimistic updates for drag-and-drop
- Undo/redo support

## Backend Integration

- RESTful API for CRUD operations
- WebSockets for real-time updates
- Batch operations for efficiency
"@

  "language-ai"      = @"
---
sidebar_position: 8
---

# Language AI

## Language AI Overview

The TuPhung Project integrates advanced language AI capabilities.

## Speech Recognition

- Real-time speech-to-text conversion
- Multiple language support
- Speaker identification
- Noise cancellation
- Punctuation and formatting

## Text-to-Speech

- Natural-sounding voice synthesis
- Multiple voices and languages
- Adjustable speech parameters
- SSML support for advanced control

## Language Processing

- Natural language understanding
- Entity recognition
- Sentiment analysis
- Language translation
- Text summarization

## Integration Points

Language AI is integrated with:
- Chat system for voice messages
- Meeting transcription and notes
- Voice commands for application control
- Accessibility features
- Content creation assistance

## Implementation

The frontend communicates with backend language AI services through:
- WebSocket connections for real-time processing
- REST API for batch processing
- Client-side audio processing for efficiency
"@

  "state-management" = @"
---
sidebar_position: 9
---

# State Management

## State Management Overview

The TuPhung Project frontend uses Redux for state management.

## Redux Architecture

- **Store**: Central state container
- **Actions**: Events that trigger state changes
- **Reducers**: Pure functions that update state
- **Selectors**: Functions to extract state data
- **Middleware**: For side effects and async logic

## State Structure

The Redux store is organized into slices:
- **Auth**: Authentication state
- **User**: User data and preferences
- **Chat**: Chat conversations and messages
- **Kanban**: Boards, columns, and tasks
- **Calendar**: Events and calendar settings
- **UI**: UI-related state (modals, themes, etc.)

## Middleware

The application uses several Redux middleware:
- **Redux Thunk**: For async actions
- **Redux Logger**: For development debugging
- **Redux Persist**: For state persistence
- **Redux WebSocket**: For real-time communication

## Performance Optimizations

- Normalized state shape
- Memoized selectors with Reselect
- Optimistic updates
- Lazy loading of state slices
- Debounced actions for frequent updates

## State Management Patterns

- Container/Presentational component pattern
- Redux hooks (useSelector, useDispatch)
- Action creators for complex actions
- Selector composition for derived data
"@

  "structure"        = @"
---
sidebar_position: 10
---

# Project Structure

## Frontend Structure Overview

The TuPhung Project frontend follows a modern React application structure.

## Directory Structure

```
src/
├── assets/           # Static assets (images, fonts, etc.)
├── components/       # Reusable components
│   ├── common/       # Common UI components
│   ├── auth/         # Authentication components
│   ├── chat/         # Chat components
│   ├── kanban/       # Kanban board components
│   ├── calendar/     # Calendar components
│   └── ai/           # AI-related components
├── hooks/            # Custom React hooks
├── pages/            # Page components
├── services/         # API services
├── store/            # Redux store
│   ├── actions/      # Action creators
│   ├── reducers/     # State reducers
│   ├── selectors/    # State selectors
│   └── middleware/   # Redux middleware
├── utils/            # Utility functions
├── App.tsx           # Main App component
└── index.tsx         # Application entry point
```

## Key Components

### Common Components
- Button, Input, Modal, Card, etc.
- Layout components (Header, Sidebar, Footer)
- Form components and validation

### Feature Components
- Authentication (Login, Register, Profile)
- Chat (ChatList, Conversation, MessageInput)
- Kanban (Board, Column, TaskCard, TaskDetail)
- Calendar (CalendarView, EventForm, EventDetail)
- AI (VoiceInput, Transcription, AIAssistant)

## State Management

- Redux for global state
- React Context for theme and localization
- Local component state for UI-specific state

## Routing

- React Router for navigation
- Route-based code splitting
- Protected routes for authentication
"@

  "user-management"  = @"
---
sidebar_position: 11
---

# User Management

## User Management Overview

The TuPhung Project frontend implements comprehensive user management features.

## User Profile

- View and edit personal information
- Change password
- Manage notification preferences
- Set language and theme preferences
- View activity history

## User List (Admin)

- View all users
- Filter and search users
- Create new users
- Edit user details
- Manage user roles
- Activate/deactivate users

## User Components

### Profile Component
- Displays user information
- Provides edit functionality
- Shows activity statistics

### User Form Component
- Creates and edits user accounts
- Validates user data
- Handles role assignment

### User List Component
- Displays paginated user list
- Provides sorting and filtering
- Shows user status indicators

## State Management

User management uses Redux for state:
- User data stored in normalized format
- Caching for performance
- Optimistic updates for better UX

## Backend Integration

- RESTful API for CRUD operations
- Role-based access control
- Data validation
"@
}

# Create backend files
foreach ($file in $backendFiles.Keys) {
  $backendFiles[$file] | Out-File -FilePath "$destDir/backend/$file.md" -Encoding utf8
  Write-Host "Created backend/$file.md"
}

# Create frontend files
foreach ($file in $frontendFiles.Keys) {
  $frontendFiles[$file] | Out-File -FilePath "$destDir/frontend/$file.md" -Encoding utf8
  Write-Host "Created frontend/$file.md"
}

# Create category files
$backendCategory = @"
{
  "label": "Backend",
  "position": 4,
  "link": {
    "type": "generated-index",
    "description": "Documentation for the Backend part of the TuPhung Project"
  }
}
"@

$frontendCategory = @"
{
  "label": "Frontend",
  "position": 5,
  "link": {
    "type": "generated-index",
    "description": "Documentation for the Frontend part of the TuPhung Project"
  }
}
"@

$backendCategory | Out-File -FilePath "$destDir/backend/_category_.json" -Encoding utf8
$frontendCategory | Out-File -FilePath "$destDir/frontend/_category_.json" -Encoding utf8

Write-Host "Created category files"
Write-Host "Conversion complete!"