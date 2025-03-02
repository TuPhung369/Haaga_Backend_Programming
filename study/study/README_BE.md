# Haaga Backend Programming Project

## Abstract

This repository contains a comprehensive Spring Boot backend application developed as part of the Haaga-Helia University of Applied Sciences curriculum. The project demonstrates the implementation of core enterprise application concepts including user authentication, role-based access control, RESTful API design, data persistence, and microservices architecture. The application showcases modern development practices in Java enterprise development using Spring Boot and related technologies.

## Table of Contents

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Core Technologies](#core-technologies)
4. [Key Features](#key-features)
5. [API Documentation](#api-documentation)
6. [Database Design](#database-design)
7. [Security Implementation](#security-implementation)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Considerations](#deployment-considerations)
10. [Future Enhancements](#future-enhancements)
11. [Development Setup](#development-setup)
12. [Contributing Guidelines](#contributing-guidelines)

## Introduction

The Haaga Backend Programming project was developed to create a robust and scalable backend system that serves as the foundation for modern web applications. The system is designed to handle user management, authentication, data processing, and provide secure API endpoints for client applications.

This project applies theoretical principles of software engineering in a practical context, focusing on:

- Clean architecture principles
- Separation of concerns
- Domain-driven design
- Security best practices
- API-first development
- Testable code

The backend system is intended to support multiple frontend clients, including web and mobile applications, through consistent and well-documented REST APIs.

## System Architecture

The application follows a layered architecture pattern with clear separation of concerns:

```ListDown
├── Controller Layer (REST API endpoints)
├── Service Layer (Business logic)
├── Repository Layer (Data access)
├── Domain Layer (Entity models)
├── Security Layer (Authentication & Authorization)
├── Configuration (Application configuration)
└── Exception Handling (Centralized error management)
```

### Architectural Overview

The application is structured around Spring Boot's convention-over-configuration paradigm, with the following components:

1. **Presentation Layer**: Controllers that handle HTTP requests and responses.
2. **Business Layer**: Services that encapsulate the business logic.
3. **Persistence Layer**: Repositories that interface with the database.
4. **Security Layer**: Manages authentication, authorization, and secure communication.
5. **Cross-cutting Concerns**: Logging, exception handling, and validation.

## Core Technologies

The project leverages the following technologies:

- **Spring Boot**: Application framework and foundation
- **Spring Security**: Authentication and authorization
- **Spring Data JPA**: Data persistence and ORM
- **Hibernate**: Object-relational mapping
- **PostgreSQL/MySQL**: Relational database for persistent storage
- **JWT (JSON Web Tokens)**: Stateless authentication mechanism
- **Maven/Gradle**: Dependency management and build automation
- **Lombok**: Reduces boilerplate code for entity and data objects
- **JUnit & Mockito**: Testing frameworks for unit and integration testing
- **Swagger/OpenAPI**: API documentation
- **Docker**: Containerization for consistent deployment

## Key Features

### User Management

- User registration and account management
- Profile creation and updates
- Role-based access control
- Password encryption using BCrypt

### Authentication & Authorization

- JWT-based authentication flow
- Role-based permission system
- OAuth2 integration for third-party login
- Session management

### Resource Management

- CRUD operations for domain resources
- Relationship management between entities
- Transaction management
- File upload and storage

### API Features

- RESTful API design
- Versioning strategy
- Pagination and sorting
- Filtering capabilities
- HATEOAS compliance

### Administration

- User administration dashboard
- System monitoring endpoints
- Audit logging
- Configuration management

## API Documentation

The API follows RESTful conventions and is documented using OpenAPI/Swagger. Key endpoints include:

### Authentication Endpoints

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Authenticate a user
- `GET /api/auth/me`: Get current user information
- `POST /api/auth/refresh`: Refresh access token
- `POST /api/auth/logout`: Logout and invalidate token

### User Management Endpoints

- `GET /api/users`: Get list of users (admin)
- `GET /api/users/{id}`: Get user details
- `PUT /api/users/{id}`: Update user
- `DELETE /api/users/{id}`: Delete user

### Role Management Endpoints

- `GET /api/roles`: Get available roles
- `POST /api/roles`: Create a new role (admin)
- `PUT /api/roles/{id}`: Update a role (admin)
- `DELETE /api/roles/{id}`: Delete a role (admin)

### Permission Management Endpoints

- `GET /api/permissions`: Get available permissions
- `POST /api/permissions`: Create a new permission (admin)
- `DELETE /api/permissions/{id}`: Delete a permission (admin)

## Database Design

The database design follows normalized relational database principles:

### Core Entities

1. **User**: Stores user credentials and basic information
2. **Role**: Defines user roles in the system
3. **Permission**: Defines specific permissions within the system
4. **Role_Permission**: Junction table for role-permission relationship
5. **User_Role**: Junction table for user-role relationship

### Entity Relationships

- One-to-Many: User to User Resources
- Many-to-Many: User to Roles
- Many-to-Many: Roles to Permissions

### Data Persistence

The application uses Hibernate as the ORM provider with Spring Data JPA repositories to abstract database operations. Each entity is mapped to a database table with appropriate relationships, constraints, and indexes.

## Security Implementation

### Authentication Flow

1. Client submits login credentials
2. Server validates credentials and issues JWT tokens
3. Access token is used for authorization
4. Refresh token is used to obtain new access tokens

### Password Security

- Passwords are hashed using BCrypt with appropriate work factor
- Password validation rules enforce strong passwords
- Failed login attempts are tracked to prevent brute force attacks

### Request Security

- CSRF protection for state-changing operations
- CORS configuration for controlled cross-origin requests
- Content Security Policy implementation
- Rate limiting to prevent abuse

### Data Protection

- Sensitive data is encrypted at rest
- PII is handled according to privacy regulations
- Database connections use TLS encryption

## Testing Strategy

The project employs a comprehensive testing strategy:

### Unit Testing

- Service layer tests with mocked dependencies
- Repository tests using H2 in-memory database
- Utility and helper class tests

### Integration Testing

- Controller layer tests with MockMvc
- End-to-end API tests with TestRestTemplate
- Security configuration tests

### Test Coverage

Code coverage targets are set to ensure adequate test coverage across all layers of the application.

## Deployment Considerations

### Environment Configuration

The application uses Spring profiles to manage different environments:

- `dev`: Development environment with H2 database
- `test`: Testing environment with in-memory database
- `prod`: Production environment with optimized settings

### Container Deployment

Dockerfiles are provided for containerized deployment, with separate configurations for development and production environments.

### Cloud Deployment

The application is designed to be cloud-native and can be deployed to various cloud platforms:

- AWS Elastic Beanstalk
- Azure App Service
- Google Cloud Run
- Heroku

## Future Enhancements

Planned future enhancements include:

1. Implementing message queuing for asynchronous processing
2. Adding WebSocket support for real-time features
3. Enhancing monitoring with Actuator and Prometheus
4. Implementing caching strategies
5. Adding support for multi-tenancy

## Development Setup

### Prerequisites

- JDK 11 or higher
- Maven 3.6+ or Gradle 7+
- PostgreSQL/MySQL database
- Docker (optional, for containerized development)

### Setup Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/TuPhung369/Haaga_Backend_Programming.git
   cd Haaga_Backend_Programming/study/study
   ```

2. Configure database connection in `application.properties` or `application.yml`:

   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/haaga_db
       username: postgres
       password: your_password
     jpa:
       hibernate:
         ddl-auto: update
   ```

3. Build the application:

   ```bash
   mvn clean install
   ```

4. Run the application:

   ```bash
   mvn spring-boot:run
   ```

5. Access the API documentation:

   ```html
   http://localhost:8080/swagger-ui.html
   ```

### Development with Docker

1. Build the Docker image:

   ```bash
   docker build -t haaga-backend .
   ```

2. Run the container:

   ```bash
   docker run -p 8080:8080 haaga-backend
   ```

## Contributing Guidelines

Contributions to the project are welcome. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

All contributions should include appropriate tests and adhere to the existing code style.

---

This project was developed by Tu Phung as part of the coursework for the Haaga-Helia University of Applied Sciences Backend Programming curriculum.

© 2024 Tu Phung. All rights reserved.
