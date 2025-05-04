---
sidebar_position: 1
sidebar_label: "Project Structure"
---

import PanzoomWrapper from '@site/src/components/MermaidDiagram/PanzoomWrapper';

# Frontend Project Structure

## Overview

The frontend component of the Enterprise Nexus project is located in the `study/typescript-react` directory and is built with React, TypeScript, and Redux Toolkit. The application follows a modern component-based architecture with a focus on type safety, reusability, and maintainability.

## Architecture Diagram

<PanzoomWrapper>
<div id="architecture-diagram" >

```mermaid
classDiagram
    class Application {
        +Router router
        +Store store
        +ThemeProvider themeProvider
        +AuthProvider authProvider
    }

    class Router {
        +Routes routes
        +PrivateRoute privateRoute
        +PublicRoute publicRoute
        +handleNavigation()
    }

    class Store {
        +RootState state
        +Reducers reducers
        +Middleware middleware
        +configureStore()
        +getState()
        +dispatch()
    }

    class Services {
        +BaseService baseService
        +AuthService authService
        +UserService userService
        +KanbanService kanbanService
        +ChatService chatService
        +CalendarService calendarService
        +AIServices aiServices
    }

    class Components {
        +CoreComponents core
        +PageComponents pages
        +UIComponents ui
        +FeatureComponents features
    }

    class Hooks {
        +useApi()
        +useAuth()
        +useFieldErrors()
        +useWebSocket()
        +useNotification()
    }

    class Utils {
        +dateUtils
        +validationUtils
        +formatters
        +tokenHandlers
        +storageUtils
    }

    Application *-- Router
    Application *-- Store
    Application *-- Services
    Application o-- Components
    Application o-- Hooks
    Application o-- Utils
    Components --> Store : uses
    Components --> Services : uses
    Components --> Hooks : uses
    Services --> Store : updates
    Hooks --> Services : calls
    Hooks --> Store : accesses
```

</div>
</PanzoomWrapper>

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

## Application Flow

<PanzoomWrapper>
<div id="application-flow" >

```mermaid
flowchart TD
    %% Define node styles
    classDef entryPoint fill:#4a6cf7,stroke:#2a4cd7,color:white,stroke-width:2px
    classDef component fill:#6c757d,stroke:#495057,color:white,stroke-width:2px
    classDef service fill:#28a745,stroke:#1e7e34,color:white,stroke-width:2px
    classDef store fill:#ffc107,stroke:#d39e00,color:#212529,stroke-width:2px
    classDef hook fill:#17a2b8,stroke:#117a8b,color:white,stroke-width:2px
    classDef util fill:#dc3545,stroke:#bd2130,color:white,stroke-width:2px

    %% Main flow
    A[main.tsx] -->|Entry Point| B[App.tsx]:::entryPoint
    B --> C[Router]:::component
    B --> D[Store Provider]:::store
    B --> E[Theme Provider]:::component
    B --> F[Auth Provider]:::component

    %% Router flow
    C --> G[Public Routes]:::component
    C --> H[Private Routes]:::component
    G --> I[Auth Pages]:::component
    H --> J[Protected Pages]:::component

    %% Auth flow
    F --> K[Auth Service]:::service
    K --> L[Token Management]:::util
    K --> M[User Service]:::service

    %% Data flow
    D --> N[Redux Store]:::store
    N --> O[State Slices]:::store
    O --> P[Components]:::component
    P --> Q[Hooks]:::hook
    Q --> R[Services]:::service
    R --> S[API Calls]:::service
    S --> O
```

</div>
</PanzoomWrapper>

## Key Components

### Core Components

The application includes various reusable components organized by functionality:

| Component Type      | Description                  | Examples                                                              |
| ------------------- | ---------------------------- | --------------------------------------------------------------------- |
| **Authentication**  | User identity and access     | `TotpAuthComponent`, `EmailOtpAuthComponent`, `OAuth2RedirectHandler` |
| **Navigation**      | App navigation and structure | `Sidebar`, `HeaderCustom`, `DockMenu`, `Breadcrumbs`                  |
| **Data Display**    | Information presentation     | `DataTable`, `CardView`, `Timeline`, `StatisticWidget`                |
| **Data Entry**      | User input collection        | `FormBuilder`, `RichTextEditor`, `FileUploader`, `DatePicker`         |
| **Feedback**        | User interaction response    | `Notification`, `ProgressIndicator`, `Modal`, `Tooltip`               |
| **AI Features**     | AI-powered functionality     | `LanguageAIComponent`, `AssistantAI`, `VoiceRecognition`              |
| **Task Management** | Project and task tools       | `ColumnKanban`, `TaskCardKanban`, `TaskFilter`, `PrioritySelector`    |
| **UI Enhancement**  | Visual improvements          | `SparklesCore`, `ShineBorder`, `LoadingState`, `ThemeSwitcher`        |

### Feature Component Architecture

<PanzoomWrapper>
<div id="feature-component-architecture" >

```mermaid
flowchart TD
    A["Feature Component"] --> B["Presentation Layer"]
    A --> C["Logic Layer"]
    A --> D["Data Layer"]

    B --> E["UI Components"]
    B --> F["Styling"]
    B --> G["Animations"]

    C --> H["Event Handlers"]
    C --> I["State Management"]
    C --> J["Side Effects"]

    D --> K["API Integration"]
    D --> L["Data Transformation"]
    D --> M["Caching Strategy"]

    classDef featureComponent fill:#4CAF50,stroke:#333,stroke-width:1px,color:#fff
    classDef layers fill:#FF9800,stroke:#333,stroke-width:1px,color:#fff
    classDef details fill:#2196F3,stroke:#333,stroke-width:1px,color:#fff

    class A featureComponent
    class B,C,D layers
    class E,F,G,H,I,J,K,L,M details
```

</div>
</PanzoomWrapper>

### Pages

The application is organized into page components that serve specific user needs:

- **User Management**

  - `AuthPage`: Authentication (login, register, password reset)
  - `ProfilePage`: User profile management and preferences
  - `UserListPage`: Administrative user management
  - `RolesPage`: Role and permission management

- **Productivity Tools**

  - `KanbanPage`: Visual task management with drag-and-drop
  - `CalendarPage`: Event scheduling and time management
  - `ChatPage`: Real-time communication platform

- **AI Integration**

  - `LanguageAIPage`: Natural language processing interface
  - `AssistantAIPage`: AI-powered virtual assistant
  - `SpeechRecognitionPage`: Voice-to-text capabilities

- **Administration**
  - `AdminDashBoardPage`: System overview and metrics
  - `PermissionsPage`: Access control management
  - `SettingPage`: Application configuration

### Services Architecture

<PanzoomWrapper>
<div id="services-architecture" >

```mermaid
classDiagram
    class BaseService {
        +axios instance
        +handleError(error)
        +setAuthHeader(token)
        +get(url, params)
        +post(url, data)
        +put(url, data)
        +delete(url)
    }

    class AuthService {
        +login(credentials)
        +register(userData)
        +logout()
        +refreshToken()
        +verifyEmail(token)
        +resetPassword(email)
        +setupTOTP()
        +verifyTOTP(code)
    }

    class UserService {
        +getProfile()
        +updateProfile(data)
        +getUsers(filters)
        +createUser(data)
        +updateUser(id, data)
        +deleteUser(id)
        +changeRole(id, role)
    }

    class KanbanService {
        +getBoards()
        +createBoard(data)
        +getColumns(boardId)
        +getTasks(columnId)
        +createTask(data)
        +updateTask(id, data)
        +moveTask(taskId, source, destination)
    }

    class WebSocketService {
        +connect()
        +disconnect()
        +subscribe(channel, callback)
        +unsubscribe(channel)
        +send(channel, message)
    }

    BaseService <|-- AuthService
    BaseService <|-- UserService
    BaseService <|-- KanbanService
    BaseService <|-- WebSocketService
```

</div>
</PanzoomWrapper>

### State Management Architecture and Workflows

The application uses Redux Toolkit for centralized state management with a well-defined architecture:

<PanzoomWrapper>
<div id="state-management-architecture-and-workflows" >

```mermaid
flowchart TD
    A["User Interaction"] --> B["Component"]
    B --> C["Dispatch Action"]
    C --> D["Redux Store"]
    D --> E["Reducer"]
    E --> F["Update State"]
    F --> G["Selector"]
    G --> H["Component Re-render"]
    H --> A

    C -.-> I["Thunk Middleware"]
    I -.-> J["API Call"]
    J -.-> K["Dispatch Result Action"]
    K -.-> D

    classDef userFlow fill:#4CAF50,stroke:#333,stroke-width:1px,color:#fff
    classDef reduxCore fill:#FF9800,stroke:#333,stroke-width:1px,color:#fff
    classDef apiFlow fill:#2196F3,stroke:#333,stroke-width:1px,color:#fff

    class A,B,H userFlow
    class C,D,E,F,G reduxCore
    class I,J,K apiFlow
```

</div>
</PanzoomWrapper>

#### Redux Data Flow

<PanzoomWrapper>
<div id="redux-data-flow" >

```mermaid
flowchart LR
    A["User Event"] --> B["Action Creator"]
    B --> C["Action"]
    C --> D["Middleware"]
    D --> E["Reducer"]
    E --> F["Store"]
    F --> G["UI Update"]

    classDef event fill:#E91E63,stroke:#333,stroke-width:1px,color:#fff
    classDef action fill:#9C27B0,stroke:#333,stroke-width:1px,color:#fff
    classDef processing fill:#2196F3,stroke:#333,stroke-width:1px,color:#fff
    classDef state fill:#4CAF50,stroke:#333,stroke-width:1px,color:#fff
    classDef ui fill:#FF9800,stroke:#333,stroke-width:1px,color:#fff

    class A event
    class B,C action
    class D,E processing
    class F state
    class G ui
```

</div>
</PanzoomWrapper>

#### Redux Slice Implementation

```typescript
// Example of a Redux slice with TypeScript
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User, UserState } from "../types/UserTypes";

const initialState: UserState = {
  currentUser: null,
  userList: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    fetchUserStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchUserSuccess(state, action: PayloadAction<User>) {
      state.loading = false;
      state.currentUser = action.payload;
    },
    fetchUserFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    updateUserProfile(state, action: PayloadAction<Partial<User>>) {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
    // Additional reducers...
  },
});

export const {
  fetchUserStart,
  fetchUserSuccess,
  fetchUserFailure,
  updateUserProfile,
} = userSlice.actions;

export default userSlice.reducer;
```

### TypeScript Type System

The application leverages TypeScript's type system for enhanced code quality and developer experience:

```typescript
// Example of TypeScript interfaces for the application
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  avatarUrl?: string;
  isActive: boolean;
  settings: UserSettings;
  createdAt: string;
  lastLogin?: string;
}

export interface UserSettings {
  theme: "light" | "dark" | "system";
  language: string;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  digest: "daily" | "weekly" | "none";
}

export interface PrivacySettings {
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  showEmail: boolean;
}

export type Role = "admin" | "manager" | "user" | "guest";

export interface UserState {
  currentUser: User | null;
  userList: User[];
  loading: boolean;
  error: string | null;
}
```

## Styling Approach

The application employs a comprehensive styling strategy:

### Tailwind CSS Integration

```jsx
// Example of Tailwind CSS usage in a component
const Button = ({ variant, size, children, onClick }) => {
  const baseClasses =
    "font-medium rounded focus:outline-none transition-colors";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  const sizeClasses = {
    sm: "py-1 px-2 text-sm",
    md: "py-2 px-4 text-base",
    lg: "py-3 px-6 text-lg",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### CSS Module Example

```css
/* ChatMessage.module.css */
.messageContainer {
  display: flex;
  margin-bottom: 1rem;
}

.userMessage {
  margin-left: auto;
  background-color: var(--primary-color);
  color: white;
  border-radius: 1rem 1rem 0 1rem;
}

.botMessage {
  margin-right: auto;
  background-color: var(--secondary-color);
  border-radius: 1rem 1rem 1rem 0;
}

.messageContent {
  padding: 0.75rem 1rem;
  max-width: 70%;
}

.timestamp {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 0.25rem;
}
```

## Build and Development

The application uses Vite for fast development and optimized production builds:

### Development Workflow

<PanzoomWrapper>
<div id="development-workflow" >

```mermaid
flowchart LR
    A["Code Changes"] --> B["Vite Dev Server"]
    B --> C["Hot Module Replacement"]
    C --> D["Browser Update"]
    D --> A

    E["TypeScript Files"] --> F["SWC Compiler"]
    F --> B

    G["CSS/SCSS"] --> H["PostCSS"]
    H --> B

    I["ESLint"] --> J["Code Quality Checks"]
    J --> A

    classDef codeChanges fill:#4CAF50,stroke:#333,stroke-width:1px,color:#fff
    classDef devServer fill:#FF9800,stroke:#333,stroke-width:1px,color:#fff
    classDef tsCompiler fill:#2196F3,stroke:#333,stroke-width:1px,color:#fff
    classDef linting fill:#9C27B0,stroke:#333,stroke-width:1px,color:#fff

    class A codeChanges
    class B,C,D devServer
    class E,F,G,H tsCompiler
    class I,J linting
```

</div>
</PanzoomWrapper>

### Build Configuration

The application is configured with Vite for optimal performance:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["@splinetool/react-spline"],
  },
  resolve: {
    alias: {
      // Polyfills for Node.js modules
      stream: "stream-browserify",
      buffer: "buffer",
    },
  },
  define: {
    // Polyfills for Node.js globals
    global: "window",
    process: {
      env: {},
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Speech processing endpoints - Python server on port 8008
      "/api/speech-to-text": {
        target: "http://localhost:8008",
        changeOrigin: true,
        secure: false,
      },
      "/api/text-to-speech": {
        target: "http://localhost:8008",
        changeOrigin: true,
        secure: false,
      },
      // Ensure WebSocket connections work properly
      "/ws": {
        target: "ws://localhost:8008",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      // WebSocket for chat
      "/identify_service/ws-messaging": {
        target: "ws://localhost:9095",
        ws: true,
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Allow-Origin": "*",
        },
      },
      "/identify_service/ws-messaging/**": {
        target: "ws://localhost:9095",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      // Add specific endpoint for audio format conversion
      "/api/convert-audio": {
        target: "http://localhost:8008",
        changeOrigin: true,
        secure: false,
      },
      // All other endpoints - Spring Boot on port 9095
      "/identify_service": {
        target: "http://localhost:9095",
        changeOrigin: true,
        secure: false,
      },
      "/api/chat": {
        target: "http://localhost:9095",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/chat/, "/identify_service/api/chat"),
      },
      "/api/assistant": {
        target: "http://localhost:9095",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/assistant/, "/identify_service/api/assistant"),
      },
      // Language AI endpoints should continue using Spring Boot
      "/api/language-ai": {
        target: "http://localhost:9095",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(
            /^\/api\/language-ai/,
            "/identify_service/api/language-ai"
          ),
      },
    },
  },
});
```

