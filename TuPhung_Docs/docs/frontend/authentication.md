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
