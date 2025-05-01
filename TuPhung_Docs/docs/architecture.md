---
sidebar_position: 3
---

# Architecture

## Architecture Overview

The Haaga Backend Programming project follows a modern, scalable architecture that separates concerns between frontend and backend components while enabling real-time communication and integration with AI services. The system is designed to be modular, maintainable, and secure, demonstrating best practices in full-stack development.

## Key Architectural Components

### Frontend Architecture (study/typescript-react)

The frontend is built with React and TypeScript, following a component-based architecture with Redux Toolkit for state management.

Key components include:

- **React Components**: Modular UI components organized by feature
- **Redux Toolkit State Management**: Centralized state with slices for different domains
- **API Services**: Axios-based service layer for backend communication
- **WebSocket Communication**: Real-time data exchange using SockJS and STOMP
- **Custom Hooks**: Reusable logic for common operations
- **TypeScript Types**: Strong typing throughout the application

### Backend Architecture (study/study)

The backend is built with Spring Boot, following a layered architecture with controllers, services, and repositories.

Key components include:

- **REST Controllers**: API endpoints organized by domain
- **Service Layer**: Business logic implementation
- **Repository Layer**: Data access using Spring Data JPA
- **Security Layer**: JWT-based authentication with Spring Security
- **WebSocket Handlers**: Real-time message processing
- **SpeechBrain Integration**: AI-powered speech processing
- **External Services Integration**: OAuth providers and email services

## Communication Patterns

### REST API Communication

The frontend communicates with the backend primarily through RESTful API endpoints for CRUD operations and business logic. The API follows standard REST conventions with proper resource naming, HTTP methods, and status codes.

```mermaid
sequenceDiagram
    %% Styling
    participant Client as <strong style="font-size:14px">React Client</strong>
    participant API as <strong style="font-size:14px">REST API</strong>
    participant Service as <strong style="font-size:14px">Service Layer</strong>
    participant DB as <strong style="font-size:14px">Database</strong>

    %% Color definitions
    rect rgb(240, 248, 255, 0.6)
        note right of Client: Frontend
        Client->>+API: HTTP Request (GET, POST, PUT, DELETE)
        API->>+Service: Process Request
    end

    rect rgb(245, 245, 245, 0.6)
        note right of Service: Backend
        Service->>+DB: Data Operation
        DB-->>-Service: Return Data
        Service-->>-API: Process Response
    end

    rect rgb(240, 248, 255, 0.6)
        API-->>-Client: HTTP Response (JSON)
    end

    %% Notes
    note over Client,API: Frontend Communication
    note over Service,DB: Backend Processing
```

### WebSocket Communication

Real-time features like chat and notifications use WebSockets for bidirectional communication, enabling instant updates without polling.

```mermaid
sequenceDiagram
    %% Styling
    participant Client as <strong style="font-size:14px">React Client</strong>
    participant WS as <strong style="font-size:14px">WebSocket Server</strong>
    participant Service as <strong style="font-size:14px">Message Service</strong>
    participant DB as <strong style="font-size:14px">Database</strong>

    %% Connection setup
    rect rgb(230, 255, 230, 0.6)
        note right of Client: Connection Phase
        Client->>+WS: Connect (STOMP over SockJS)
        WS-->>-Client: Connection Established
        Client->>WS: Subscribe to Topics
    end

    %% Message sending
    rect rgb(255, 240, 245, 0.6)
        note right of Client: Message Sending
        Client->>+WS: Send Message
        WS->>+Service: Process Message
        Service->>+DB: Store Message
    end

    %% Broadcasting
    rect rgb(240, 240, 255, 0.6)
        note right of Service: Broadcasting
        Service->>-WS: Broadcast to Subscribers
        WS-->>-Client: Receive Message
        DB-->>-Service: Confirmation
    end

    %% Notes
    note over Client,WS: Real-time Communication
    note over Service,DB: Message Processing
```

## Data Flow

The system implements various data flows for different features:

### Authentication Flow

```mermaid
flowchart TD
    %% Styling
    classDef userAction fill:#FFD700,stroke:#333,stroke-width:2px,color:#000,font-weight:bold,font-size:14px
    classDef decision fill:#FF6347,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold,font-size:14px
    classDef error fill:#DC143C,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold,font-size:14px
    classDef process fill:#4169E1,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold,font-size:14px
    classDef success fill:#32CD32,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold,font-size:14px
    classDef token fill:#9370DB,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold,font-size:14px

    %% Main Authentication Flow
    subgraph "Login Process"
        A[User Enters Credentials] --> B{Validate Input}
        B -->|Invalid| C[Show Error]
        B -->|Valid| D[Send to Auth Service]
        D --> E{Authentication}
        E -->|Failure| F[Show Error]
        E -->|Success| G[Generate JWT]
        G --> H[Store Token]
        H --> I[Redirect to Dashboard]
    end

    %% Token Refresh Flow
    subgraph "Token Management"
        J[Token Expiring] --> K[Refresh Token]
        K -->|Success| L[Update Stored Token]
        K -->|Failure| M[Logout User]
    end

    %% Apply styles
    class A,J userAction
    class B,E decision
    class C,F error
    class D,K process
    class G,H,L token
    class I,M success
```

### Speech Processing Flow

```mermaid
flowchart TD
    %% Styling
    classDef userAction fill:#FF9966,stroke:#333,stroke-width:2px,color:#000,font-weight:bold,font-size:14px
    classDef frontend fill:#61DAFB,stroke:#333,stroke-width:2px,color:#000,font-weight:bold,font-size:14px
    classDef backend fill:#6DB33F,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold,font-size:14px
    classDef ai fill:#9C27B0,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold,font-size:14px
    classDef speech fill:#E91E63,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold,font-size:14px

    %% Frontend Flow
    subgraph "Frontend"
        A[User Records Audio] --> B[Send to Backend]
        H[Return to Frontend] --> I[Play Audio Response]
    end

    %% Backend Processing
    subgraph "Backend"
        B --> C[Process with SpeechBrain]
    end

    %% SpeechBrain Processing
    subgraph "SpeechBrain"
        C --> D[Convert Speech to Text]
        D --> E[Analyze Language]
        E --> F[Generate AI Response]
        F --> G[Convert Text to Speech]
        G --> H
    end

    %% Apply styles
    class A,I userAction
    class B,H frontend
    class C backend
    class D,E,F,G speech
```

### User Management Flow

The system implements role-based access control with a comprehensive permission system:

- **User Registration**: Secure signup with email verification
- **Role Assignment**: Users can be assigned multiple roles
- **Permission Management**: Granular control over system access
- **User Administration**: Complete user lifecycle management

### Task Management Flow

The Kanban board implements a drag-and-drop task management system:

- **Board Creation**: Users can create multiple boards
- **Column Management**: Customizable workflow stages
- **Task CRUD**: Create, read, update, and delete tasks
- **Task Assignment**: Assign tasks to users
- **Priority Management**: Set and visualize task priorities