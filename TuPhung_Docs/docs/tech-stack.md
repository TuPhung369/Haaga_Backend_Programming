---
sidebar_position: 2
sidebar_label: "Technology Stack"
---

# Technology Stack

<div className="tech-stack-banner">
  <div className="tech-stack-banner-content">
    <h2>Enterprise-Grade Technology Ecosystem</h2>
    <p>A carefully curated selection of modern, scalable, and secure technologies powering Enterprise Nexus</p>
  </div>
</div>

<div className="tech-stack-overview">
  <div className="tech-stack-overview-item">
    <div className="tech-stack-overview-icon">⚛️</div>
    <div className="tech-stack-overview-count">25+</div>
    <div className="tech-stack-overview-label">Frontend Technologies</div>
  </div>
  <div className="tech-stack-overview-item">
    <div className="tech-stack-overview-icon">🍃</div>
    <div className="tech-stack-overview-count">30+</div>
    <div className="tech-stack-overview-label">Backend Technologies</div>
  </div>
  <div className="tech-stack-overview-item">
    <div className="tech-stack-overview-icon">🧠</div>
    <div className="tech-stack-overview-count">5+</div>
    <div className="tech-stack-overview-label">AI Components</div>
  </div>
  <div className="tech-stack-overview-item">
    <div className="tech-stack-overview-icon">🔒</div>
    <div className="tech-stack-overview-count">10+</div>
    <div className="tech-stack-overview-label">Security Features</div>
  </div>
</div>

## Technology Architecture

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
    classDef devops fill:#E91E63,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold
    classDef testing fill:#3F51B5,stroke:#333,stroke-width:2px,color:#fff,font-weight:bold

    %% Main components
    subgraph ClientLayer["Client Layer"]
        Browser[Web Browser]:::client
        Mobile[Mobile Device]:::client
    end

    subgraph FrontendLayer["Frontend Layer"]
        React[React 18]:::frontend
        TypeScript[TypeScript]:::frontend
        Redux[Redux Toolkit]:::frontend
        Router[React Router]:::frontend
        AntD[Ant Design]:::frontend
        Tailwind[TailwindCSS]:::frontend
    end

    subgraph APILayer["API Layer"]
        REST[REST API]:::api
        WebSockets[WebSockets]:::api
        GraphQL[GraphQL]:::api
    end

    subgraph BackendLayer["Backend Layer"]
        Spring[Spring Boot]:::backend
        Security[Spring Security]:::backend
        JPA[Spring Data JPA]:::backend
        Hibernate[Hibernate]:::backend
    end

    subgraph AILayer["AI Layer"]
        SpeechBrain[SpeechBrain]:::ai
        Whisper[Whisper]:::ai
        Wav2Vec[Wav2Vec2]:::ai
        TTS[Text-to-Speech]:::ai
    end

    subgraph DataLayer["Data Layer"]
        MySQL[MySQL]:::database
        Redis[Redis]:::database
        S3[Object Storage]:::database
    end

    subgraph DevOpsLayer["DevOps Layer"]
        Docker[Docker]:::devops
        GitHub[GitHub Actions]:::devops
        Maven[Maven]:::devops
        NPM[npm]:::devops
    end

    subgraph TestingLayer["Testing Layer"]
        JUnit[JUnit 5]:::testing
        Mockito[Mockito]:::testing
        Jest[Jest]:::testing
        RTL[React Testing Library]:::testing
    end

    %% Connections
    ClientLayer --> FrontendLayer
    FrontendLayer --> APILayer
    APILayer --> BackendLayer
    BackendLayer --> AILayer
    BackendLayer --> DataLayer
    DevOpsLayer -.-> FrontendLayer & BackendLayer & DataLayer
    TestingLayer -.-> FrontendLayer & BackendLayer

    %% Apply styles
    class Browser,Mobile client
    class React,TypeScript,Redux,Router,AntD,Tailwind frontend
    class REST,WebSockets,GraphQL api
    class Spring,Security,JPA,Hibernate backend
    class SpeechBrain,Whisper,Wav2Vec,TTS ai
    class MySQL,Redis,S3 database
    class Docker,GitHub,Maven,NPM devops
    class JUnit,Mockito,Jest,RTL testing

    %% Styling for subgraphs
    style ClientLayer fill:#FFF3E0,stroke:#FFB74D,stroke-width:1px
    style FrontendLayer fill:#E3F2FD,stroke:#90CAF9,stroke-width:1px
    style APILayer fill:#E8F5E9,stroke:#A5D6A7,stroke-width:1px
    style BackendLayer fill:#F3E5F5,stroke:#CE93D8,stroke-width:1px
    style AILayer fill:#FCE4EC,stroke:#F48FB1,stroke-width:1px
    style DataLayer fill:#FFFDE7,stroke:#FFF176,stroke-width:1px
    style DevOpsLayer fill:#E8EAF6,stroke:#9FA8DA,stroke-width:1px
    style TestingLayer fill:#EFEBE9,stroke:#D7CCC8,stroke-width:1px
```

## Frontend Technologies

<div className="tech-category">
  <div className="tech-category-header">
    <div className="tech-category-icon">⚛️</div>
    <div className="tech-category-title">Core Framework & Language</div>
  </div>
  <div className="tech-grid">
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React" className="tech-card-icon" />
        <h3 className="tech-card-title">React 18</h3>
      </div>
      <div className="tech-card-description">
        JavaScript library for building user interfaces with component-based architecture. React 18 introduces concurrent rendering for improved performance and user experience.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Concurrent Mode</span>
        <span className="tech-card-feature">Server Components</span>
        <span className="tech-card-feature">Suspense</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <img src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg" alt="TypeScript" className="tech-card-icon" />
        <h3 className="tech-card-title">TypeScript</h3>
      </div>
      <div className="tech-card-description">
        Strongly-typed superset of JavaScript that enhances code quality, developer experience, and enables better tooling and IDE support.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Static Typing</span>
        <span className="tech-card-feature">Type Inference</span>
        <span className="tech-card-feature">Interface Support</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <img src="https://vitejs.dev/logo.svg" alt="Vite" className="tech-card-icon" />
        <h3 className="tech-card-title">Vite</h3>
      </div>
      <div className="tech-card-description">
        Modern, fast build tool and development server that leverages native ES modules for instant server start and lightning-fast HMR.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Hot Module Replacement</span>
        <span className="tech-card-feature">ES Module Based</span>
        <span className="tech-card-feature">Optimized Build</span>
      </div>
    </div>
  </div>
</div>

<div className="tech-category">
  <div className="tech-category-header">
    <div className="tech-category-icon">🔄</div>
    <div className="tech-category-title">State Management</div>
  </div>
  <div className="tech-grid">
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <img src="https://redux-toolkit.js.org/img/redux.svg" alt="Redux Toolkit" className="tech-card-icon" />
        <h3 className="tech-card-title">Redux Toolkit</h3>
      </div>
      <div className="tech-card-description">
        Official, opinionated Redux toolset for efficient state management with simplified logic and reduced boilerplate code.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">createSlice API</span>
        <span className="tech-card-feature">Immer Integration</span>
        <span className="tech-card-feature">RTK Query</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <img src="https://redux-toolkit.js.org/img/redux.svg" alt="Redux Persist" className="tech-card-icon" />
        <h3 className="tech-card-title">Redux Persist</h3>
      </div>
      <div className="tech-card-description">
        Persistence layer for Redux store that saves and rehydrates state between sessions, improving user experience.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Local Storage</span>
        <span className="tech-card-feature">Session Storage</span>
        <span className="tech-card-feature">Custom Storage</span>
      </div>
    </div>
  </div>
</div>

<div className="tech-category">
  <div className="tech-category-header">
    <div className="tech-category-icon">🎨</div>
    <div className="tech-category-title">UI and Styling</div>
  </div>
  <div className="tech-grid">
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <img src="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg" alt="Ant Design" className="tech-card-icon" />
        <h3 className="tech-card-title">Ant Design</h3>
      </div>
      <div className="tech-card-description">
        Comprehensive UI component library with enterprise-grade features, accessibility, and internationalization support.
      </div>
      <div className="tech-card-features">
        <div className="tech-card-feature">60+ Components</div>
        <div className="tech-card-feature">Customizable Themes</div>
        <div className="tech-card-feature">TypeScript Support</div>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <div className="emoji-icon">🎨</div>
        <h3 className="tech-card-title">TailwindCSS</h3>
      </div>
      <div className="tech-card-description">
        Utility-first CSS framework for rapid UI development with highly customizable design system and minimal CSS output.
      </div>
      <div className="tech-card-features">
        <div className="tech-card-feature">Utility Classes</div>
        <div className="tech-card-feature">JIT Compiler</div>
        <div className="tech-card-feature">Design System</div>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <div className="emoji-icon">📦</div>
        <h3 className="tech-card-title">CSS Modules</h3>
      </div>
      <div className="tech-card-description">
        Scoped CSS for component styling that eliminates style conflicts and improves maintainability through local scope.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Local Scoping</span>
        <span className="tech-card-feature">Composition</span>
        <span className="tech-card-feature">TypeScript Integration</span>
      </div>
    </div>
  </div>
</div>

<div className="tech-category">
  <div className="tech-category-header">
    <div className="tech-category-icon">🔌</div>
    <div className="tech-category-title">API Communication</div>
  </div>
  <div className="tech-grid">
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <img src="https://axios-http.com/assets/logo.svg" alt="Axios" className="tech-card-icon" />
        <h3 className="tech-card-title">Axios</h3>
      </div>
      <div className="tech-card-description">
        Promise-based HTTP client for API requests with automatic transforms for JSON data, interceptors, and request cancellation.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Request/Response Interceptors</span>
        <span className="tech-card-feature">Automatic Transforms</span>
        <span className="tech-card-feature">Request Cancellation</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <div className="emoji-icon">🔌</div>
        <h3 className="tech-card-title">SockJS</h3>
      </div>
      <div className="tech-card-description">
        WebSocket emulation for browsers without WebSocket support, providing fallback transport mechanisms for real-time communication.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">WebSocket Emulation</span>
        <span className="tech-card-feature">Fallback Transports</span>
        <span className="tech-card-feature">Cross-Browser Support</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <div className="emoji-icon">📨</div>
        <h3 className="tech-card-title">STOMP</h3>
      </div>
      <div className="tech-card-description">
        Simple Text Oriented Messaging Protocol for WebSocket communication, providing a messaging pattern for real-time features.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Message Patterns</span>
        <span className="tech-card-feature">Topic Subscription</span>
        <span className="tech-card-feature">Message Headers</span>
      </div>
    </div>
  </div>
</div>

## Backend Technologies

<div className="tech-category">
  <div className="tech-category-header">
    <div className="tech-category-icon">🍃</div>
    <div className="tech-category-title">Core Framework</div>
  </div>
  <div className="tech-grid">
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <div className="emoji-icon">🍃</div>
        <h3 className="tech-card-title">Spring Boot</h3>
      </div>
      <div className="tech-card-description">
        Java-based framework for creating stand-alone, production-grade applications with minimal configuration and maximum productivity.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Auto-configuration</span>
        <span className="tech-card-feature">Embedded Servers</span>
        <span className="tech-card-feature">Production-ready Features</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <div className="emoji-icon">🌐</div>
        <h3 className="tech-card-title">Spring MVC</h3>
      </div>
      <div className="tech-card-description">
        Web framework for building RESTful APIs with a model-view-controller architecture and comprehensive request handling.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">RESTful Controllers</span>
        <span className="tech-card-feature">Request Mapping</span>
        <span className="tech-card-feature">Content Negotiation</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <div className="emoji-icon">⚡</div>
        <h3 className="tech-card-title">Spring WebFlux</h3>
      </div>
      <div className="tech-card-description">
        Reactive programming support for specific components, enabling non-blocking, event-driven applications with backpressure.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Reactive Streams</span>
        <span className="tech-card-feature">Non-blocking I/O</span>
        <span className="tech-card-feature">Functional Endpoints</span>
      </div>
    </div>
  </div>
</div>

<div className="tech-category">
  <div className="tech-category-header">
    <div className="tech-category-icon">🔒</div>
    <div className="tech-category-title">Security</div>
  </div>
  <div className="tech-grid">
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <div className="emoji-icon">🔒</div>
        <h3 className="tech-card-title">Spring Security</h3>
      </div>
      <div className="tech-card-description">
        Authentication and authorization framework with comprehensive security features for enterprise applications.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Authentication Providers</span>
        <span className="tech-card-feature">Method Security</span>
        <span className="tech-card-feature">CSRF Protection</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <img src="https://jwt.io/img/pic_logo.svg" alt="JWT" className="tech-card-icon" />
        <h3 className="tech-card-title">JWT Authentication</h3>
      </div>
      <div className="tech-card-description">
        Stateless authentication mechanism using JSON Web Tokens for secure transmission of information between parties.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Stateless Authentication</span>
        <span className="tech-card-feature">Signature Verification</span>
        <span className="tech-card-feature">Claim-based Authorization</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <img src="https://oauth.net/images/oauth-logo-square.png" alt="OAuth2" className="tech-card-icon" />
        <h3 className="tech-card-title">OAuth2</h3>
      </div>
      <div className="tech-card-description">
        Protocol for authorization that enables third-party applications to obtain limited access to a user's account.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Authorization Code Flow</span>
        <span className="tech-card-feature">Resource Owner Password Flow</span>
        <span className="tech-card-feature">Client Credentials Flow</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <div className="emoji-icon">🔑</div>
        <h3 className="tech-card-title">TOTP</h3>
      </div>
      <div className="tech-card-description">
        Time-based One-Time Password for multi-factor authentication, generating temporary codes based on a shared secret.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Time-based Codes</span>
        <span className="tech-card-feature">Replay Protection</span>
        <span className="tech-card-feature">HMAC-based Algorithm</span>
      </div>
    </div>
  </div>
</div>

<div className="tech-category">
  <div className="tech-category-header">
    <div className="tech-category-icon">🗄️</div>
    <div className="tech-category-title">Data Access</div>
  </div>
  <div className="tech-grid">
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <div className="emoji-icon">🗄️</div>
        <h3 className="tech-card-title">Spring Data JPA</h3>
      </div>
      <div className="tech-card-description">
        Data access abstraction that simplifies the implementation of data access layers by reducing boilerplate code.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Repository Pattern</span>
        <span className="tech-card-feature">Query Methods</span>
        <span className="tech-card-feature">Pagination & Sorting</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <img src="https://hibernate.org/images/hibernate-logo.svg" alt="Hibernate" className="tech-card-icon" />
        <h3 className="tech-card-title">Hibernate</h3>
      </div>
      <div className="tech-card-description">
        Object-relational mapping framework that provides a framework for mapping an object-oriented domain model to a relational database.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">ORM Mapping</span>
        <span className="tech-card-feature">Lazy Loading</span>
        <span className="tech-card-feature">Caching</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <img src="https://www.mysql.com/common/logos/logo-mysql-170x115.png" alt="MySQL" className="tech-card-icon" />
        <h3 className="tech-card-title">MySQL</h3>
      </div>
      <div className="tech-card-description">
        Popular open-source relational database management system known for its reliability, scalability, and ease of use in web applications.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">ACID Compliance</span>
        <span className="tech-card-feature">InnoDB Engine</span>
        <span className="tech-card-feature">Full-Text Search</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <div className="emoji-icon">🔄</div>
        <h3 className="tech-card-title">Flyway</h3>
      </div>
      <div className="tech-card-description">
        Database migration tool that enables version control for database schemas and seamless evolution of database structure.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Version Control</span>
        <span className="tech-card-feature">Migration Scripts</span>
        <span className="tech-card-feature">Repeatable Migrations</span>
      </div>
    </div>
  </div>
</div>

## AI and Speech Processing

<div className="tech-category">
  <div className="tech-category-header">
    <div className="tech-category-icon">🧠</div>
    <div className="tech-category-title">AI Technologies</div>
  </div>
  <div className="tech-grid">
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <div className="emoji-icon">🧠</div>
        <h3 className="tech-card-title">SpeechBrain</h3>
      </div>
      <div className="tech-card-description">
        PyTorch-based speech toolkit for speech processing, including speech recognition, speaker recognition, and speech enhancement.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Speech Recognition</span>
        <span className="tech-card-feature">Speaker Identification</span>
        <span className="tech-card-feature">Speech Enhancement</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <div className="emoji-icon">🎤</div>
        <h3 className="tech-card-title">Whisper</h3>
      </div>
      <div className="tech-card-description">
        Speech recognition model developed by OpenAI that approaches human-level robustness and accuracy in speech recognition.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Multilingual Support</span>
        <span className="tech-card-feature">Noise Robustness</span>
        <span className="tech-card-feature">Transcription & Translation</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <img src="https://huggingface.co/front/assets/huggingface_logo.svg" alt="Wav2Vec2" className="tech-card-icon" />
        <h3 className="tech-card-title">Wav2Vec2</h3>
      </div>
      <div className="tech-card-description">
        Speech-to-text model for Finnish language, leveraging self-supervised learning to improve speech recognition accuracy.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Finnish Language Support</span>
        <span className="tech-card-feature">Self-supervised Learning</span>
        <span className="tech-card-feature">Contextual Representations</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <div className="emoji-icon">🔊</div>
        <h3 className="tech-card-title">Text-to-Speech</h3>
      </div>
      <div className="tech-card-description">
        Voice synthesis capabilities that convert text into natural-sounding speech with control over voice characteristics.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Natural Voice Synthesis</span>
        <span className="tech-card-feature">Multiple Voice Options</span>
        <span className="tech-card-feature">Prosody Control</span>
      </div>
    </div>
  </div>
</div>

## Development and Deployment

<div className="tech-category">
  <div className="tech-category-header">
    <div className="tech-category-icon">🚀</div>
    <div className="tech-category-title">DevOps Tools</div>
  </div>
  <div className="tech-grid">
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <img src="https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png" alt="Docker" className="tech-card-icon" />
        <h3 className="tech-card-title">Docker</h3>
      </div>
      <div className="tech-card-description">
        Platform for developing, shipping, and running applications in containers, ensuring consistency across environments.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Containerization</span>
        <span className="tech-card-feature">Environment Isolation</span>
        <span className="tech-card-feature">Reproducible Builds</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Actions" className="tech-card-icon" />
        <h3 className="tech-card-title">GitHub Actions</h3>
      </div>
      <div className="tech-card-description">
        Continuous integration and deployment platform that automates build, test, and deployment workflows directly from GitHub.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">CI/CD Pipelines</span>
        <span className="tech-card-feature">Workflow Automation</span>
        <span className="tech-card-feature">Matrix Builds</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <img src="https://maven.apache.org/images/maven-logo-black-on-white.png" alt="Maven" className="tech-card-icon" />
        <h3 className="tech-card-title">Maven</h3>
      </div>
      <div className="tech-card-description">
        Build automation and dependency management tool for Java projects that simplifies the build process.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Dependency Management</span>
        <span className="tech-card-feature">Build Lifecycle</span>
        <span className="tech-card-feature">Project Object Model</span>
      </div>
    </div>
    
    <div className="tech-card">
      <div className="tech-card-header-wrapper">
        <div className="emoji-icon">📦</div>
        <h3 className="tech-card-title">npm</h3>
      </div>
      <div className="tech-card-description">
        Package manager for JavaScript that automates the process of installing, upgrading, configuring, and removing packages.
      </div>
      <div className="tech-card-features">
        <span className="tech-card-feature">Package Management</span>
        <span className="tech-card-feature">Dependency Resolution</span>
        <span className="tech-card-feature">Script Running</span>
      </div>
    </div>
  </div>
</div>

## Technology Selection Rationale

<div className="tech-rationale">
  <div className="tech-rationale-item">
    <div className="tech-rationale-icon">⚖️</div>
    <div className="tech-rationale-content">
      <h3>Enterprise-Grade Stability</h3>
      <p>Our technology stack prioritizes battle-tested frameworks and libraries with proven track records in enterprise environments. Spring Boot and React provide robust foundations with extensive community support and regular security updates.</p>
    </div>
  </div>
  
  <div className="tech-rationale-item">
    <div className="tech-rationale-icon">🔍</div>
    <div className="tech-rationale-content">
      <h3>Developer Experience</h3>
      <p>TypeScript and modern tooling like Vite enhance developer productivity through static typing, fast feedback loops, and comprehensive IDE support. This leads to fewer bugs, better code quality, and faster development cycles.</p>
    </div>
  </div>
  
  <div className="tech-rationale-item">
    <div className="tech-rationale-icon">📈</div>
    <div className="tech-rationale-content">
      <h3>Scalability & Performance</h3>
      <p>Our architecture is designed for horizontal scalability with stateless components, efficient caching strategies, and optimized database access patterns. Technologies like WebSockets enable real-time features without sacrificing performance.</p>
    </div>
  </div>
  
  <div className="tech-rationale-item">
    <div className="tech-rationale-icon">🔒</div>
    <div className="tech-rationale-content">
      <h3>Security First Approach</h3>
      <p>Security is integrated at every layer with Spring Security, multi-factor authentication, and encrypted communication channels. Our token-based authentication system implements industry best practices for secure user sessions.</p>
    </div>
  </div>
  
  <div className="tech-rationale-item">
    <div className="tech-rationale-icon">🧩</div>
    <div className="tech-rationale-content">
      <h3>Modular Architecture</h3>
      <p>Component-based design principles are applied throughout the stack, enabling independent development, testing, and deployment of features. This modularity supports team collaboration and simplifies maintenance.</p>
    </div>
  </div>
  
  <div className="tech-rationale-item">
    <div className="tech-rationale-icon">🔮</div>
    <div className="tech-rationale-content">
      <h3>Future-Proof Innovation</h3>
      <p>Integration of cutting-edge AI capabilities and speech processing technologies positions the platform to evolve with emerging business needs and technological advancements, ensuring long-term relevance.</p>
    </div>
  </div>
</div>

<style>
{`
  /* Banner styling */
  .tech-stack-banner {
    background: linear-gradient(135deg, #4285f4, #34a853, #fbbc04, #ea4335);
    border-radius: 8px;
    padding: 30px;
    margin-bottom: 30px;
    color: white;
    text-align: center;
  }
  
  /* Responsive adjustments for laptop screens */
  @media (min-width: 997px) and (max-width: 1200px) {
    .tech-stack-banner {
      padding: 25px;
      margin-bottom: 25px;
    }
    
    .tech-stack-banner-content h2 {
      font-size: 1.6rem;
    }
    
    .tech-stack-banner-content p {
      font-size: 1rem;
    }
  }
  
  .tech-stack-banner-content h2 {
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0 0 10px 0;
  }
  
  .tech-stack-banner-content p {
    font-size: 1.1rem;
    margin: 0;
    opacity: 0.9;
  }
  
  /* Overview styling */
  .tech-stack-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }
  
  /* Responsive adjustments for laptop screens */
  @media (min-width: 997px) and (max-width: 1200px) {
    .tech-stack-overview {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
  }
  
  .tech-stack-overview-item {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .tech-stack-overview-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  
  .tech-stack-overview-icon {
    font-size: 2.5rem;
    margin-bottom: 10px;
  }
  
  .tech-stack-overview-count {
    font-size: 2rem;
    font-weight: 700;
    color: #4285f4;
    margin-bottom: 5px;
  }
  
  .tech-stack-overview-label {
    font-size: 1rem;
    color: #5f6368;
  }
  
  /* Category styling */
  .tech-category {
    margin-bottom: 40px;
  }
  
  /* Responsive adjustments for laptop screens */
  @media (min-width: 997px) and (max-width: 1200px) {
    .tech-category {
      margin-bottom: 30px;
    }
    
    .tech-category-header {
      margin-bottom: 15px;
    }
    
    .tech-category-icon {
      font-size: 1.8rem;
      margin-right: 12px;
    }
    
    .tech-category-title {
      font-size: 1.4rem;
    }
  }
  
  .tech-category-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .tech-category-icon {
    font-size: 2rem;
    margin-right: 15px;
  }
  
  .tech-category-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #202124;
  }
  
  /* Dark mode styles for headers */
  html[data-theme='dark'] .tech-category-title {
    color: #e3e3e3;
  }
  
  /* Grid styling */
  .tech-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 25px;
    margin-bottom: 30px;
  }
  
  /* Responsive adjustments for laptop screens */
  @media (min-width: 997px) and (max-width: 1200px) {
    .tech-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
  }
  
  /* Card styling */
  .tech-card {
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
    .tech-card {
      padding: 20px;
      min-height: 220px;
    }
    
    .tech-card-title {
      font-size: 1.15rem;
    }
    
    .tech-card-description {
      font-size: 0.9rem;
      margin-bottom: 15px;
    }
    
    .tech-card-feature {
      font-size: 0.8rem;
      padding: 5px 0;
    }
    
    .tech-card-header-wrapper {
      margin-bottom: 15px;
      padding-bottom: 10px;
    }
  }
  
  html[data-theme='dark'] .tech-card {
    background-color: #1e1e1e;
    border: 1px solid #333;
    box-shadow: 0 3px 8px rgba(0,0,0,0.2);
  }
  
  .tech-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
    border-color: #e0e0e0;
  }
  
  .tech-card-header-wrapper {
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
  
  html[data-theme='dark'] .tech-card-header-wrapper {
    border-bottom: 1px solid #333;
  }
  
  .tech-card-icon {
    width: 40px;
    height: 40px;
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 6px;
    object-fit: contain;
    grid-column: 1;
  }
  
  .tech-card-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #202124;
    line-height: 1.3;
    margin: 0;
    padding: 0;
    grid-column: 2;
  }
  
  .tech-card-description {
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
  html[data-theme='dark'] .tech-card-title {
    color: #e3e3e3;
  }
  
  html[data-theme='dark'] .tech-card-description {
    color: #b0b0b0;
  }
  
  .tech-card-features {
    display: flex;
    flex-direction: column;
    width: 100%; /* Ensure it takes full width of parent */
    margin-top: auto; /* Push to bottom of card */
    border-top: 1px dashed #e0e0e0;
    padding-top: 12px;
  }
  
  html[data-theme='dark'] .tech-card-features {
    border-top: 1px dashed #333;
  }
  
  .tech-card-feature {
    font-size: 0.85rem;
    color: #5f6368;
    display: flex;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid #f5f5f5;
  }
  
  html[data-theme='dark'] .tech-card-feature {
    color: #a0a0a0;
    border-bottom: 1px solid #2d2d2d;
  }
  
  .tech-card-feature:before {
    content: "✓";
    color: #4CAF50;
    margin-right: 8px;
    font-weight: bold;
  }
  
  .tech-card-feature:last-child {
    border-bottom: none;
  }
  
  /* Rationale styling */
  .tech-rationale {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    margin-top: 40px;
  }
  
  /* Responsive adjustments for laptop screens */
  @media (min-width: 997px) and (max-width: 1200px) {
    .tech-rationale {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }
    
    .tech-rationale-item {
      padding: 12px;
    }
    
    .tech-rationale-icon {
      font-size: 1.8rem;
      margin-right: 12px;
    }
    
    .tech-rationale-content h3 {
      font-size: 1.1rem;
      margin-bottom: 8px;
    }
    
    .tech-rationale-content p {
      font-size: 0.85rem;
    }
  }
  
  .tech-rationale-item {
    display: flex;
    align-items: flex-start;
    padding: 15px;
    border-radius: 8px;
    background-color: #f9f9f9;
    border: 1px solid #f0f0f0;
    transition: all 0.3s ease;
  }
  
  html[data-theme='dark'] .tech-rationale-item {
    background-color: #1e1e1e;
    border: 1px solid #333;
  }
  
  .tech-rationale-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  
  html[data-theme='dark'] .tech-rationale-item:hover {
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  }
  
  .tech-rationale-icon {
    font-size: 2rem;
    margin-right: 15px;
    min-width: 40px;
    text-align: center;
  }
  
  .tech-rationale-content h3 {
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 1.2rem;
    color: #202124;
  }
  
  .tech-rationale-content p {
    margin: 0;
    font-size: 0.9rem;
    color: #5f6368;
    line-height: 1.5;
  }
  
  /* Dark mode styles for rationale section */
  html[data-theme='dark'] .tech-rationale-content h3 {
    color: #e3e3e3;
  }
  
  html[data-theme='dark'] .tech-rationale-content p {
    color: #b0b0b0;
  }
  
  /* Tablet responsive adjustments */
  @media (max-width: 996px) {
    .tech-grid {
      grid-template-columns: repeat(auto-fill, minmax(45%, 1fr));
      gap: 20px;
    }
    
    .tech-stack-overview {
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .tech-rationale {
      grid-template-columns: 1fr;
      gap: 20px;
    }
    
    .tech-card {
      padding: 20px;
      min-height: 220px;
    }
    
    .tech-stack-banner {
      padding: 25px;
    }
    
    .tech-stack-banner-content h2 {
      font-size: 1.6rem;
    }
  }
  
  /* Mobile responsive adjustments */
  @media (max-width: 576px) {
    .tech-grid {
      grid-template-columns: 1fr;
    }
    
    .tech-stack-overview {
      grid-template-columns: 1fr;
    }
    
    .tech-card {
      padding: 16px;
    }
    
    .tech-stack-banner {
      padding: 20px;
    }
    
    .tech-stack-banner-content h2 {
      font-size: 1.4rem;
    }
    
    .tech-stack-banner-content p {
      font-size: 0.9rem;
    }
    
    .tech-category-title {
      font-size: 1.3rem;
    }
    
    .tech-category-icon {
      font-size: 1.6rem;
    }
  }
`}
</style>

