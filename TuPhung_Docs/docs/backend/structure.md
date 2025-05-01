---
sidebar_position: 1
---

# Backend Project Structure

## Overview

The backend component of the Haaga Backend Programming project is located in the `study/study` directory and follows a standard Spring Boot project structure with additional components for speech processing. The application is organized using a layered architecture pattern that separates concerns and promotes maintainability.

## Main Directory Structure

```
study/study/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── haaga/
│   │   │           ├── config/         # Configuration classes
│   │   │           ├── controller/     # REST controllers
│   │   │           ├── dto/            # Data Transfer Objects
│   │   │           ├── exception/      # Custom exceptions
│   │   │           ├── model/          # Entity models
│   │   │           ├── repository/     # Data repositories
│   │   │           ├── security/       # Security configuration
│   │   │           ├── service/        # Business logic
│   │   │           ├── util/           # Utility classes
│   │   │           └── Application.java # Main application class
│   │   └── resources/
│   │       ├── application.yaml        # Main application properties
│   │       ├── application-dev.yaml    # Development properties
│   │       ├── application-aws.yaml    # AWS deployment properties
│   │       ├── data.sql                # Initial data script
│   │       ├── schema.sql              # Schema definition
│   │       └── templates/              # Email templates
│   └── test/
│       ├── java/                       # Test classes
│       └── resources/
│           └── application-test.properties # Test configuration
├── speechbrain/                        # Speech processing module
│   ├── models/                         # AI language models
│   │   ├── models--Systran--faster-whisper-large-v3/
│   │   ├── models--Systran--faster-whisper-medium/
│   │   └── wav2vec2-finnish/
│   ├── pretrained_models/              # TTS models
│   │   ├── tts-tacotron2-en_female/
│   │   ├── tts-tacotron2-en_male/
│   │   ├── tts-hifigan-en_female/
│   │   └── tts-hifigan-en_male/
│   ├── src/                            # Python source code
│   ├── speechbrain_service.py          # Main service script
│   ├── whisper_server.py               # Whisper model server
│   └── wav2vec2_finnish.py             # Finnish speech recognition
└── pom.xml                             # Maven configuration
```

## Key Components

### Controllers

Controllers handle HTTP requests and define the API endpoints. They are organized by domain:

- `AuthController`: Authentication endpoints (login, register, token refresh)
- `UserController`: User management operations
- `RoleController`: Role and permission management
- `ChatController`: Chat functionality endpoints
- `KanbanController`: Task management endpoints
- `CalendarController`: Event scheduling endpoints
- `LanguageController`: Speech processing endpoints

### Services

Services implement the business logic and orchestrate operations:

- `AuthService`: Authentication and authorization logic
- `UserService`: User management operations
- `RoleService`: Role and permission management
- `ChatService`: Chat message handling
- `KanbanService`: Task and board management
- `CalendarService`: Event scheduling and management
- `LanguageService`: Integration with speech processing
- `EmailService`: Email sending functionality
- `TotpService`: Time-based One-Time Password implementation

### Repositories

Repositories interface with the database using Spring Data JPA:

- `UserRepository`: User entity operations
- `RoleRepository`: Role entity operations
- `PermissionRepository`: Permission entity operations
- `ChatMessageRepository`: Chat message storage
- `KanbanBoardRepository`: Kanban board operations
- `KanbanTaskRepository`: Task operations
- `CalendarEventRepository`: Event storage and retrieval
- `LanguageMessageRepository`: Language processing data

### Models

Entity models define the database structure and relationships:

- `User`: User information and credentials
- `Role`: Role definitions
- `Permission`: Permission definitions
- `ChatMessage`: Chat message data
- `KanbanBoard`: Kanban board structure
- `KanbanTask`: Task information
- `CalendarEvent`: Event data with recurrence
- `LanguageMessage`: Language processing data

### Security

The security package implements authentication and authorization:

- `JwtTokenProvider`: JWT token generation and validation
- `CustomUserDetailsService`: User details loading
- `SecurityConfig`: Security configuration
- `OAuth2AuthenticationSuccessHandler`: OAuth2 success handling
- `TotpAuthenticationProvider`: TOTP authentication

### SpeechBrain Integration

The SpeechBrain module provides AI-powered speech processing:

- Speech-to-text conversion using Whisper and Wav2Vec2 models
- Text-to-speech synthesis using Tacotron2 and HiFi-GAN models
- Language analysis and feedback
- Multi-language support with focus on English and Finnish

## Configuration Files

The application uses YAML configuration files for different environments:

- `application.yaml`: Default configuration
- `application-dev.yaml`: Development environment settings
- `application-aws.yaml`: AWS deployment configuration
- `application-test.properties`: Test environment settings

## Database Setup

The database schema is defined in `schema.sql` and initial data is loaded from `data.sql`. The application supports:

- PostgreSQL for production
- H2 in-memory database for development and testing

## Testing Structure

The test directory mirrors the main source structure:

- `controller`: API endpoint tests using MockMvc
- `service`: Business logic tests with Mockito
- `repository`: Data access tests with test database
- `security`: Authentication and authorization tests
