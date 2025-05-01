---
sidebar_position: 1
---

# Frontend Project Structure

## Overview

The frontend component of the Haaga Backend Programming project is located in the `study/typescript-react` directory and is built with React, TypeScript, and Redux Toolkit. The application follows a modern component-based architecture with a focus on type safety, reusability, and maintainability.

## Main Directory Structure

```
study/typescript-react/
├── public/                # Static assets and HTML template
├── src/
│   ├── assets/            # Static assets (images, fonts, etc.)
│   ├── components/        # Reusable UI components
│   │   ├── AssistantAI.tsx        # AI assistant component
│   │   ├── ColumnKanban.tsx       # Kanban column component
│   │   ├── EmailOtpAuthComponent.tsx # Email OTP authentication
│   │   ├── HeaderCustom.tsx       # Application header
│   │   ├── LanguageAIComponent.tsx # Language AI interface
│   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   ├── TaskCardKanban.tsx     # Kanban task card
│   │   ├── TotpAuthComponent.tsx  # TOTP authentication
│   │   └── ...                    # Other components
│   ├── hooks/             # Custom React hooks
│   │   ├── useApi.ts      # API interaction hook
│   │   └── useFieldErrors.ts # Form validation hook
│   ├── pages/             # Page components
│   │   ├── AdminDashBoardPage.tsx # Admin dashboard
│   │   ├── AssistantAIPage.tsx    # AI assistant page
│   │   ├── AuthPage.tsx           # Authentication page
│   │   ├── CalendarPage.tsx       # Calendar page
│   │   ├── ChatPage.tsx           # Chat interface
│   │   ├── HomePage.tsx           # Home page
│   │   ├── KanbanPage.tsx         # Kanban board
│   │   ├── LanguageAIPage.tsx     # Language AI page
│   │   ├── ProfilePage.tsx        # User profile
│   │   └── ...                    # Other pages
│   ├── services/          # API services
│   │   ├── authService.ts         # Authentication API
│   │   ├── baseService.ts         # Base API service
│   │   ├── calendarService.ts     # Calendar API
│   │   ├── chatService.ts         # Chat API
│   │   ├── kanbanService.ts       # Kanban API
│   │   ├── languageService.ts     # Language AI API
│   │   ├── totpService.ts         # TOTP API
│   │   ├── userService.ts         # User management API
│   │   └── websocketService.ts    # WebSocket service
│   ├── store/             # Redux store
│   │   ├── assistantAISlice.ts    # AI assistant state
│   │   ├── authSlice.ts           # Authentication state
│   │   ├── chatSlice.ts           # Chat state
│   │   ├── index.ts               # Store exports
│   │   ├── kanbanSlice.ts         # Kanban state
│   │   ├── languageSlice.ts       # Language AI state
│   │   ├── resetActions.ts        # State reset actions
│   │   ├── rootState.ts           # Root state type
│   │   ├── store.ts               # Store configuration
│   │   └── userSlice.ts           # User state
│   ├── styles/            # CSS styles
│   │   ├── AssistantAI.css        # AI assistant styles
│   │   ├── AuthPage.css           # Authentication styles
│   │   ├── ChatPage.css           # Chat styles
│   │   ├── HomePage.css           # Home page styles
│   │   └── ...                    # Other styles
│   ├── types/             # TypeScript type definitions
│   │   ├── ApiTypes.ts            # API response types
│   │   ├── AssistantAITypes.ts    # AI assistant types
│   │   ├── AuthTypes.ts           # Authentication types
│   │   ├── CalendarTypes.ts       # Calendar event types
│   │   ├── ChatTypes.ts           # Chat message types
│   │   ├── KanbanTypes.ts         # Kanban board types
│   │   ├── LanguageAITypes.ts     # Language AI types
│   │   ├── RootStateTypes.ts      # Redux state types
│   │   └── UserTypes.ts           # User types
│   ├── utils/             # Utility functions
│   │   ├── authSetup.ts           # Authentication setup
│   │   ├── axios-customize.ts     # Axios configuration
│   │   ├── constant.ts            # Constants
│   │   ├── dateUtils.ts           # Date manipulation
│   │   ├── function.ts            # General utilities
│   │   ├── tokenRefresh.ts        # Token refresh logic
│   │   └── validateInput.ts       # Input validation
│   ├── App.tsx            # Main App component
│   ├── index.css          # Global styles
│   ├── index.tsx          # Application entry point
│   └── main.tsx           # Vite entry point
├── .eslintrc.js           # ESLint configuration
├── package.json           # Dependencies and scripts
├── postcss.config.js      # PostCSS configuration
├── tailwind.config.cjs    # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

## Key Components

### Core Components

The application includes various reusable components:

- **Authentication Components**:

  - `TotpAuthComponent`: Time-based One-Time Password authentication
  - `EmailOtpAuthComponent`: Email-based OTP authentication
  - `OAuth2RedirectHandler`: OAuth2 redirect handling

- **Navigation Components**:

  - `Sidebar`: Main navigation sidebar
  - `HeaderCustom`: Application header with user information
  - `DockMenu`: Dock-style navigation menu

- **Feature Components**:

  - `ColumnKanban`: Kanban board column
  - `TaskCardKanban`: Kanban task card
  - `LanguageAIComponent`: Language AI interface
  - `AssistantAI`: AI assistant interface
  - `TinyMCEEditor`: Rich text editor

- **UI Enhancement Components**:
  - `SparklesCore`: Animated sparkles effect
  - `ShineBorder`: Animated border effect
  - `LoadingState`: Loading indicators
  - `ServiceStatusNotification`: Service status display

### Pages

The application is organized into page components:

- `AuthPage`: User authentication (login, register)
- `HomePage`: Dashboard and overview
- `ProfilePage`: User profile management
- `KanbanPage`: Kanban board for task management
- `CalendarPage`: Calendar for event scheduling
- `ChatPage`: Real-time chat interface
- `LanguageAIPage`: Language AI interaction
- `AssistantAIPage`: AI assistant interaction
- `AdminDashBoardPage`: Admin dashboard
- `UserListPage`: User management
- `RolesPage`: Role management
- `PermissionsPage`: Permission management
- `SettingPage`: Application settings

### Services

Services handle API communication:

- `baseService`: Base service with common functionality
- `authService`: Authentication operations
- `userService`: User management
- `roleService`: Role management
- `permissionService`: Permission management
- `chatService`: Chat operations
- `kanbanService`: Kanban board operations
- `calendarService`: Calendar operations
- `languageService`: Language AI operations
- `speechService`: Speech processing
- `websocketService`: WebSocket communication

### State Management

The application uses Redux Toolkit for state management:

- `store.ts`: Redux store configuration
- `authSlice.ts`: Authentication state
- `userSlice.ts`: User information state
- `chatSlice.ts`: Chat messages and conversations
- `kanbanSlice.ts`: Kanban boards and tasks
- `languageSlice.ts`: Language AI state
- `assistantAISlice.ts`: AI assistant state

### Utilities

Utility functions provide common functionality:

- `axios-customize.ts`: Axios instance with interceptors
- `tokenRefresh.ts`: JWT token refresh logic
- `validateInput.ts`: Form input validation
- `authSetup.ts`: Authentication setup
- `dateUtils.ts`: Date manipulation utilities
- `languageUtils.ts`: Language processing utilities

## TypeScript Type System

The application uses TypeScript for type safety:

- Interface-based type definitions
- Strict null checking
- Generics for reusable types
- Union types for state variations
- Type guards for runtime type checking

## Styling Approach

The application uses a combination of styling approaches:

- Tailwind CSS for utility-based styling
- CSS modules for component-specific styles
- Ant Design components with custom theming
- Custom CSS for complex animations and effects

## Build and Development

The application uses Vite for fast development and building:

- Hot Module Replacement for quick development
- TypeScript compilation with SWC
- CSS processing with PostCSS
- ESLint for code quality
- Environment variable configuration

