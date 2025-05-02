---
sidebar_position: 3
sidebar_label: "Architecture"
---

# Architecture

<div className="architecture-banner">
  <div className="architecture-banner-content">
    <h2>Enterprise-Grade System Architecture</h2>
    <p>A modern, scalable, and secure architecture designed for optimal performance and maintainability</p>
  </div>
</div>

<div className="architecture-overview">
  <div className="architecture-overview-item">
    <div className="architecture-overview-icon">🏗️</div>
    <div className="architecture-overview-count">5</div>
    <div className="architecture-overview-label">Architectural Layers</div>
  </div>
  <div className="architecture-overview-item">
    <div className="architecture-overview-icon">🔄</div>
    <div className="architecture-overview-count">3</div>
    <div className="architecture-overview-label">Communication Patterns</div>
  </div>
  <div className="architecture-overview-item">
    <div className="architecture-overview-icon">🔌</div>
    <div className="architecture-overview-count">10+</div>
    <div className="architecture-overview-label">Integration Points</div>
  </div>
  <div className="architecture-overview-item">
    <div className="architecture-overview-icon">🛡️</div>
    <div className="architecture-overview-count">4</div>
    <div className="architecture-overview-label">Security Layers</div>
  </div>
</div>

## System Architecture

Enterprise Nexus implements a modern, layered architecture that ensures scalability, maintainability, and security:

```mermaid
flowchart TD
    %% Styling
    classDef client fill:#FF9900,stroke:#333,stroke-width:2px,color:#000,font-weight:bold
    classDef frontend fill:#61DAFB,stroke:#333,stroke-width:2px,color:#000,font-weight:bold
    classDef api fill:#6DB33F,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold
    classDef backend fill:#6DB33F,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold
    classDef database fill:#F8C517,stroke:#333,stroke-width:2px,color:#000,font-weight:bold
    classDef ai fill:#9C27B0,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold
    classDef security fill:#E91E63,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold
    classDef integration fill:#3F51B5,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold

    %% Main components
    subgraph PresentationLayer["Presentation Layer"]
        Browser[Web Browser]:::client
        Mobile[Mobile Device]:::client
    end

    subgraph FrontendLayer["Frontend Layer"]
        React[React Components]:::frontend
        Redux[Redux State]:::frontend
        Hooks[Custom Hooks]:::frontend
        TypeScript[TypeScript Types]:::frontend
    end

    subgraph APILayer["API Layer"]
        REST[REST Controllers]:::api
        WebSockets[WebSocket Handlers]:::api
        Validation[Request Validation]:::api
    end

    subgraph BusinessLayer["Business Layer"]
        Services[Service Layer]:::backend
        DTOs[Data Transfer Objects]:::backend
        Events[Event System]:::backend
    end

    subgraph DataLayer["Data Layer"]
        Repositories[Repository Layer]:::backend
        Entities[Domain Entities]:::backend
        MySQL[MySQL Database]:::database
        Redis[Redis Cache]:::database
    end

    subgraph SecurityLayer["Security Layer"]
        JWT[JWT Authentication]:::security
        RBAC[Role-Based Access]:::security
        Encryption[Data Encryption]:::security
    end

    subgraph IntegrationLayer["Integration Layer"]
        SpeechBrain[SpeechBrain]:::ai
        OAuth[OAuth Providers]:::integration
        Email[Email Service]:::integration
    end

    %% Connections
    PresentationLayer --> FrontendLayer
    FrontendLayer --> APILayer
    APILayer --> BusinessLayer
    APILayer --> SecurityLayer
    BusinessLayer --> DataLayer
    BusinessLayer --> IntegrationLayer
    SecurityLayer -.-> APILayer & BusinessLayer

    %% Apply styles
    class Browser,Mobile client
    class React,Redux,Hooks,TypeScript frontend
    class REST,WebSockets,Validation api
    class Services,DTOs,Events backend
    class Repositories,Entities backend
    class MySQL,Redis database
    class JWT,RBAC,Encryption security
    class SpeechBrain,OAuth,Email integration

    %% Styling for subgraphs
    style PresentationLayer fill:#FFF3E0,stroke:#FFB74D,stroke-width:1px
    style FrontendLayer fill:#E3F2FD,stroke:#90CAF9,stroke-width:1px
    style APILayer fill:#E8F5E9,stroke:#A5D6A7,stroke-width:1px
    style BusinessLayer fill:#F3E5F5,stroke:#CE93D8,stroke-width:1px
    style DataLayer fill:#FFFDE7,stroke:#FFF176,stroke-width:1px
    style SecurityLayer fill:#FCE4EC,stroke:#F48FB1,stroke-width:1px
    style IntegrationLayer fill:#E8EAF6,stroke:#9FA8DA,stroke-width:1px
```

<div className="architecture-category">
  <div className="architecture-category-header">
    <div className="architecture-category-icon">🏗️</div>
    <div className="architecture-category-title">Architectural Layers</div>
  </div>
  <div className="architecture-grid">
    <div className="architecture-card">
      <div className="architecture-card-header-wrapper">
        <div className="emoji-icon">⚛️</div>
        <h3 className="architecture-card-title">Frontend Layer</h3>
      </div>
      <div className="architecture-card-description">
        Component-based architecture using React and TypeScript with Redux Toolkit for state management, providing a responsive and interactive user interface.
      </div>
      <div className="architecture-card-features">
        <span className="architecture-card-feature">Component Hierarchy</span>
        <span className="architecture-card-feature">Centralized State Management</span>
        <span className="architecture-card-feature">Type-Safe Development</span>
      </div>
    </div>
    
    <div className="architecture-card">
      <div className="architecture-card-header-wrapper">
        <div className="emoji-icon">🔌</div>
        <h3 className="architecture-card-title">API Layer</h3>
      </div>
      <div className="architecture-card-description">
        RESTful API endpoints and WebSocket handlers that provide a clean interface between frontend and backend, with proper validation and error handling.
      </div>
      <div className="architecture-card-features">
        <span className="architecture-card-feature">REST Controllers</span>
        <span className="architecture-card-feature">WebSocket Communication</span>
        <span className="architecture-card-feature">Request/Response Validation</span>
      </div>
    </div>
    
    <div className="architecture-card">
      <div className="architecture-card-header-wrapper">
        <div className="emoji-icon">⚙️</div>
        <h3 className="architecture-card-title">Business Layer</h3>
      </div>
      <div className="architecture-card-description">
        Core business logic implementation with service classes, DTOs for data transfer, and an event system for decoupled communication between components.
      </div>
      <div className="architecture-card-features">
        <span className="architecture-card-feature">Service-Oriented Design</span>
        <span className="architecture-card-feature">Business Logic Encapsulation</span>
        <span className="architecture-card-feature">Event-Driven Architecture</span>
      </div>
    </div>
    
    <div className="architecture-card">
      <div className="architecture-card-header-wrapper">
        <div className="emoji-icon">💾</div>
        <h3 className="architecture-card-title">Data Layer</h3>
      </div>
      <div className="architecture-card-description">
        Data access and persistence using Spring Data JPA repositories, domain entities, and a combination of MySQL for relational data and Redis for caching.
      </div>
      <div className="architecture-card-features">
        <span className="architecture-card-feature">Repository Pattern</span>
        <span className="architecture-card-feature">ORM with JPA/Hibernate</span>
        <span className="architecture-card-feature">Caching Strategy</span>
      </div>
    </div>
    
    <div className="architecture-card">
      <div className="architecture-card-header-wrapper">
        <div className="emoji-icon">🔒</div>
        <h3 className="architecture-card-title">Security Layer</h3>
      </div>
      <div className="architecture-card-description">
        Comprehensive security implementation with JWT authentication, role-based access control, and data encryption for sensitive information.
      </div>
      <div className="architecture-card-features">
        <span className="architecture-card-feature">Token-Based Authentication</span>
        <span className="architecture-card-feature">Authorization Framework</span>
        <span className="architecture-card-feature">Secure Communication</span>
      </div>
    </div>
  </div>
</div>

<div className="architecture-category">
  <div className="architecture-category-header">
    <div className="architecture-category-icon">🔄</div>
    <div className="architecture-category-title">Communication Patterns</div>
  </div>
  <div className="architecture-grid">
    <div className="architecture-card">
      <div className="architecture-card-header-wrapper">
        <div className="emoji-icon">🔄</div>
        <h3 className="architecture-card-title">REST Communication</h3>
      </div>
      <div className="architecture-card-description">
        Standard HTTP-based communication for CRUD operations and business logic, following RESTful principles with proper resource naming and status codes.
      </div>
      <div className="architecture-card-features">
        <span className="architecture-card-feature">Resource-Oriented Design</span>
        <span className="architecture-card-feature">HTTP Methods (GET, POST, PUT, DELETE)</span>
        <span className="architecture-card-feature">JSON Data Exchange</span>
      </div>
    </div>
    
    <div className="architecture-card">
      <div className="architecture-card-header-wrapper">
        <div className="emoji-icon">⚡</div>
        <h3 className="architecture-card-title">WebSocket Communication</h3>
      </div>
      <div className="architecture-card-description">
        Bidirectional real-time communication for features like chat and notifications, using SockJS for cross-browser compatibility and STOMP for messaging patterns.
      </div>
      <div className="architecture-card-features">
        <span className="architecture-card-feature">Persistent Connections</span>
        <span className="architecture-card-feature">Topic Subscription</span>
        <span className="architecture-card-feature">Real-Time Updates</span>
      </div>
    </div>
    
    <div className="architecture-card">
      <div className="architecture-card-header-wrapper">
        <div className="emoji-icon">📨</div>
        <h3 className="architecture-card-title">Event-Driven Communication</h3>
      </div>
      <div className="architecture-card-description">
        Internal communication between system components using an event bus, enabling loose coupling and better scalability through asynchronous processing.
      </div>
      <div className="architecture-card-features">
        <span className="architecture-card-feature">Publisher-Subscriber Pattern</span>
        <span className="architecture-card-feature">Asynchronous Processing</span>
        <span className="architecture-card-feature">System Decoupling</span>
      </div>
    </div>
  </div>
</div>

## Data Flow Diagrams

### Authentication Flow

```mermaid
sequenceDiagram
    %% Styling
    participant Client as React Client
    participant API as Auth API
    participant Service as Auth Service
    participant DB as User Database
    participant JWT as JWT Provider

    %% Color definitions
    rect rgb(240, 248, 255, 0.6)
        note right of Client: Frontend
        Client->>+API: Login Request (username/password)
        API->>+Service: Authenticate User
    end

    rect rgb(245, 245, 245, 0.6)
        note right of Service: Backend
        Service->>+DB: Verify Credentials
        DB-->>-Service: User Details
        Service->>+JWT: Generate Token
        JWT-->>-Service: JWT Token
    end

    rect rgb(240, 248, 255, 0.6)
        Service-->>-API: Authentication Result
        API-->>-Client: JWT Token & User Info
        Client->>Client: Store Token in Local Storage
    end

    %% Notes
    note over Client,API: Secure Authentication
    note over Service,JWT: Token Generation
```

### Speech Processing Flow

```mermaid
sequenceDiagram
    %% Styling
    participant Client as React Client
    participant API as Speech API
    participant Service as Speech Service
    participant AI as SpeechBrain
    participant TTS as Text-to-Speech

    %% Audio Recording
    rect rgb(230, 255, 230, 0.6)
        note right of Client: Audio Capture
        Client->>Client: Record Audio
        Client->>+API: Send Audio File
    end

    %% Speech Processing
    rect rgb(255, 240, 245, 0.6)
        note right of API: Processing
        API->>+Service: Process Audio
        Service->>+AI: Speech-to-Text
        AI-->>-Service: Transcribed Text
        Service->>Service: Process Text
        Service->>+TTS: Generate Response Audio
        TTS-->>-Service: Audio Response
    end

    %% Response
    rect rgb(240, 240, 255, 0.6)
        Service-->>-API: Audio & Text Response
        API-->>-Client: Return Response
        Client->>Client: Play Audio Response
    end

    %% Notes
    note over Client,API: Audio Communication
    note over Service,TTS: AI Processing
```

### Task Management Flow

```mermaid
flowchart TD
    %% Styling
    classDef userAction fill:#FFD700,stroke:#333,stroke-width:2px,color:#000,font-weight:bold
    classDef process fill:#4169E1,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold
    classDef storage fill:#32CD32,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold
    classDef notification fill:#9370DB,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold

    %% Task Creation Flow
    subgraph "Task Management"
        A[Create Task] --> B[Validate Input]
        B --> C[Save Task]
        C --> D[Update Board]
        D --> E[Notify Assignees]

        F[Drag Task] --> G[Update Status]
        G --> H[Save Changes]
        H --> I[Broadcast Updates]

        J[Edit Task] --> K[Update Details]
        K --> L[Save Changes]
        L --> M[Notify Stakeholders]
    end

    %% Apply styles
    class A,F,J userAction
    class B,D,G,I,K,M process
    class C,H,L storage
    class E notification
```

<div className="architecture-category">
  <div className="architecture-category-header">
    <div className="architecture-category-icon">🔍</div>
    <div className="architecture-category-title">Architectural Decisions</div>
  </div>
  <div className="architecture-rationale">
    <div className="architecture-rationale-item">
      <div className="architecture-rationale-icon">🔄</div>
      <div className="architecture-rationale-content">
        <h3>Layered Architecture</h3>
        <p>The system uses a clear layered architecture to separate concerns, improve maintainability, and enable independent testing of components. Each layer has a specific responsibility and communicates with adjacent layers through well-defined interfaces.</p>
      </div>
    </div>
    
    <div className="architecture-rationale-item">
      <div className="architecture-rationale-icon">⚡</div>
      <div className="architecture-rationale-content">
        <h3>Real-Time Communication</h3>
        <p>WebSockets were chosen over polling for real-time features to reduce server load, minimize latency, and provide a better user experience. The STOMP protocol adds message routing capabilities on top of the raw WebSocket connection.</p>
      </div>
    </div>
    
    <div className="architecture-rationale-item">
      <div className="architecture-rationale-icon">🔒</div>
      <div className="architecture-rationale-content">
        <h3>JWT Authentication</h3>
        <p>JWT tokens provide a stateless authentication mechanism that scales well in distributed systems. They contain all necessary user information, reducing database lookups and enabling efficient validation across services.</p>
      </div>
    </div>
    
    <div className="architecture-rationale-item">
      <div className="architecture-rationale-icon">📦</div>
      <div className="architecture-rationale-content">
        <h3>Centralized State Management</h3>
        <p>Redux Toolkit was selected for state management to provide a predictable state container with powerful debugging capabilities, middleware support, and a standardized approach to handling complex application state.</p>
      </div>
    </div>
  </div>
</div>

<style>
{`
  /* Banner styling */
  .architecture-banner {
    background: linear-gradient(135deg, #6DB33F, #4285f4, #34a853, #6DB33F);
    border-radius: 8px;
    padding: 30px;
    margin-bottom: 30px;
    color: white;
    text-align: center;
  }
  
  /* Responsive adjustments for laptop screens */
  @media (min-width: 997px) and (max-width: 1200px) {
    .architecture-banner {
      padding: 25px;
      margin-bottom: 25px;
    }
    
    .architecture-banner-content h2 {
      font-size: 1.6rem;
    }
    
    .architecture-banner-content p {
      font-size: 1rem;
    }
  }
  
  .architecture-banner-content h2 {
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0 0 10px 0;
  }
  
  .architecture-banner-content p {
    font-size: 1.1rem;
    margin: 0;
    opacity: 0.9;
  }
  
  /* Overview styling */
  .architecture-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }
  
  /* Responsive adjustments for laptop screens */
  @media (min-width: 997px) and (max-width: 1200px) {
    .architecture-overview {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
  }
  
  .architecture-overview-item {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .architecture-overview-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  
  .architecture-overview-icon {
    font-size: 2.5rem;
    margin-bottom: 10px;
  }
  
  .architecture-overview-count {
    font-size: 2rem;
    font-weight: 700;
    color: #6DB33F;
    margin-bottom: 5px;
  }
  
  .architecture-overview-label {
    font-size: 1rem;
    color: #5f6368;
  }
  
  /* Category styling */
  .architecture-category {
    margin-bottom: 40px;
  }
  
  /* Responsive adjustments for laptop screens */
  @media (min-width: 997px) and (max-width: 1200px) {
    .architecture-category {
      margin-bottom: 30px;
    }
    
    .architecture-category-header {
      margin-bottom: 15px;
    }
    
    .architecture-category-icon {
      font-size: 1.8rem;
      margin-right: 12px;
    }
    
    .architecture-category-title {
      font-size: 1.4rem;
    }
  }
  
  .architecture-category-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .architecture-category-icon {
    font-size: 2rem;
    margin-right: 15px;
  }
  
  .architecture-category-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #202124;
  }
  
  /* Dark mode styles for headers */
  html[data-theme='dark'] .architecture-category-title {
    color: #e3e3e3;
  }
  
  /* Grid styling */
  .architecture-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 25px;
    margin-bottom: 30px;
  }
  
  /* Responsive adjustments for laptop screens */
  @media (min-width: 997px) and (max-width: 1200px) {
    .architecture-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
  }
  
  /* Card styling */
  .architecture-card {
    background-color: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 3px 8px rgba(0,0,0,0.08);
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: visible; /* Allow content to be visible */
    position: relative; /* For proper positioning */
    min-height: 240px; /* Ensure minimum height */
    border: 1px solid #f0f0f0;
  }
  
  /* Responsive adjustments for laptop screens */
  @media (min-width: 997px) and (max-width: 1200px) {
    .architecture-card {
      padding: 20px;
      min-height: 220px;
    }
    
    .architecture-card-title {
      font-size: 1.15rem;
    }
    
    .architecture-card-description {
      font-size: 0.9rem;
      margin-bottom: 15px;
    }
    
    .architecture-card-feature {
      font-size: 0.8rem;
      padding: 5px 0;
    }
    
    .architecture-card-header-wrapper {
      margin-bottom: 15px;
      padding-bottom: 10px;
    }
  }
  
  html[data-theme='dark'] .architecture-card {
    background-color: #1e1e1e;
    border: 1px solid #333;
    box-shadow: 0 3px 8px rgba(0,0,0,0.2);
  }
  
  .architecture-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
    border-color: #e0e0e0;
  }
  
  .architecture-card-header-wrapper {
    display: grid;
    grid-template-columns: 50px 1fr;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 12px;
    width: 100%;
    overflow: visible;
  }
  
  html[data-theme='dark'] .architecture-card-header-wrapper {
    border-bottom: 1px solid #333;
  }
  
  .emoji-icon {
    font-size: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .architecture-card-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #202124;
    line-height: 1.3;
    margin: 0;
    padding: 0;
    grid-column: 2;
  }
  
  .architecture-card-description {
    font-size: 0.95rem;
    color: #5f6368;
    margin-bottom: 20px;
    flex-grow: 1;
    width: 100%;
    clear: both; /* Clear any floats */
    line-height: 1.5;
    letter-spacing: 0.01em;
  }
  
  /* Dark mode styles for card text */
  html[data-theme='dark'] .architecture-card-title {
    color: #e3e3e3;
  }
  
  html[data-theme='dark'] .architecture-card-description {
    color: #b0b0b0;
  }
  
  .architecture-card-features {
    display: flex;
    flex-direction: column;
    width: 100%; /* Ensure it takes full width of parent */
    margin-top: auto; /* Push to bottom of card */
    border-top: 1px dashed #e0e0e0;
    padding-top: 12px;
  }
  
  html[data-theme='dark'] .architecture-card-features {
    border-top: 1px dashed #333;
  }
  
  .architecture-card-feature {
    font-size: 0.85rem;
    color: #5f6368;
    display: flex;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid #f5f5f5;
  }
  
  html[data-theme='dark'] .architecture-card-feature {
    color: #a0a0a0;
    border-bottom: 1px solid #2d2d2d;
  }
  
  .architecture-card-feature:before {
    content: "✓";
    color: #4CAF50;
    margin-right: 8px;
    font-weight: bold;
  }
  
  .architecture-card-feature:last-child {
    border-bottom: none;
  }
  
  /* Rationale styling */
  .architecture-rationale {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    margin-top: 20px;
  }
  
  /* Responsive adjustments for laptop screens */
  @media (min-width: 997px) and (max-width: 1200px) {
    .architecture-rationale {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }
    
    .architecture-rationale-item {
      padding: 12px;
    }
    
    .architecture-rationale-icon {
      font-size: 1.8rem;
      margin-right: 12px;
    }
    
    .architecture-rationale-content h3 {
      font-size: 1.1rem;
      margin-bottom: 8px;
    }
    
    .architecture-rationale-content p {
      font-size: 0.85rem;
    }
  }
  
  .architecture-rationale-item {
    display: flex;
    align-items: flex-start;
    padding: 15px;
    border-radius: 8px;
    background-color: #f9f9f9;
    border: 1px solid #f0f0f0;
    transition: all 0.3s ease;
  }
  
  html[data-theme='dark'] .architecture-rationale-item {
    background-color: #1e1e1e;
    border: 1px solid #333;
  }
  
  .architecture-rationale-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  
  html[data-theme='dark'] .architecture-rationale-item:hover {
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  }
  
  .architecture-rationale-icon {
    font-size: 2rem;
    margin-right: 15px;
    min-width: 40px;
    text-align: center;
  }
  
  .architecture-rationale-content h3 {
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 1.2rem;
    color: #202124;
  }
  
  .architecture-rationale-content p {
    margin: 0;
    font-size: 0.9rem;
    color: #5f6368;
    line-height: 1.5;
  }
  
  /* Dark mode styles for rationale section */
  html[data-theme='dark'] .architecture-rationale-content h3 {
    color: #e3e3e3;
  }
  
  html[data-theme='dark'] .architecture-rationale-content p {
    color: #b0b0b0;
  }
  
  /* Dark mode for overview items */
  html[data-theme='dark'] .architecture-overview-item {
    background-color: #1e1e1e;
    border: 1px solid #333;
  }
  
  html[data-theme='dark'] .architecture-overview-count {
    color: #7b68ee;
  }
  
  html[data-theme='dark'] .architecture-overview-label {
    color: #b0b0b0;
  }
  
  /* Tablet responsive adjustments */
  @media (max-width: 996px) {
    .architecture-grid {
      grid-template-columns: repeat(auto-fill, minmax(45%, 1fr));
      gap: 20px;
    }
    
    .architecture-overview {
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .architecture-rationale {
      grid-template-columns: 1fr;
      gap: 20px;
    }
    
    .architecture-card {
      padding: 20px;
      min-height: 220px;
    }
    
    .architecture-banner {
      padding: 25px;
    }
    
    .architecture-banner-content h2 {
      font-size: 1.6rem;
    }
  }
  
  /* Mobile responsive adjustments */
  @media (max-width: 576px) {
    .architecture-grid {
      grid-template-columns: 1fr;
    }
    
    .architecture-overview {
      grid-template-columns: 1fr;
    }
    
    .architecture-card {
      padding: 16px;
    }
    
    .architecture-banner {
      padding: 20px;
    }
    
    .architecture-banner-content h2 {
      font-size: 1.4rem;
    }
    
    .architecture-banner-content p {
      font-size: 0.9rem;
    }
    
    .architecture-category-title {
      font-size: 1.3rem;
    }
    
    .architecture-category-icon {
      font-size: 1.6rem;
    }
  }
`}
</style>

