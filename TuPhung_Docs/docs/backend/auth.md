---
sidebar_position: 2
---

# Authentication & Security

## Authentication Overview

The Enterprise Nexus Project uses JWT (JSON Web Tokens) for authentication.

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

