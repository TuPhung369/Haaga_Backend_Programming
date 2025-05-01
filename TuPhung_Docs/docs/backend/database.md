---
sidebar_position: 3
---

# Database Design

## Database Overview

The TuPhung Project uses PostgreSQL as its primary database.

## Entity Relationship Diagram

The database consists of the following main entities:
- Users
- Authentication
- Chats
- Messages
- Boards
- Tasks
- Events
- Speech Records

## Key Tables

### Users Table
- id (PK)
- username
- email
- password_hash
- first_name
- last_name
- role
- created_at
- updated_at

### Authentication Table
- id (PK)
- user_id (FK)
- token
- refresh_token
- expires_at
- created_at

### Chats Table
- id (PK)
- name
- type (individual/group)
- created_at
- updated_at

### Messages Table
- id (PK)
- chat_id (FK)
- sender_id (FK)
- content
- content_type
- sent_at
- read_at

### Boards Table
- id (PK)
- name
- description
- owner_id (FK)
- created_at
- updated_at

### Tasks Table
- id (PK)
- board_id (FK)
- title
- description
- status
- assignee_id (FK)
- due_date
- created_at
- updated_at

### Events Table
- id (PK)
- title
- description
- start_time
- end_time
- location
- owner_id (FK)
- created_at
- updated_at
