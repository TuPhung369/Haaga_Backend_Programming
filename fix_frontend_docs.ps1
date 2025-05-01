# Script to fix frontend files

$destDir = "e:/IT/Haaga_Backend_Programming/TuPhung_Docs/docs"

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

  "authentication"   = @"
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

# Create frontend files
foreach ($file in $frontendFiles.Keys) {
  $frontendFiles[$file] | Out-File -FilePath "$destDir/frontend/$file.md" -Encoding utf8
  Write-Host "Created frontend/$file.md"
}

Write-Host "Frontend files fixed!"