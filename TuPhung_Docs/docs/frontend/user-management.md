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
