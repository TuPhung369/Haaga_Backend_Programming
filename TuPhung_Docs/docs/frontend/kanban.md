---
sidebar_position: 7
---

# Kanban Board

## Kanban Board Overview

The TuPhung Project includes a Kanban board for visual task management.

## Kanban Features

- Customizable columns (To Do, In Progress, Done, etc.)
- Drag-and-drop task movement
- Task creation and editing
- Task filtering and sorting
- Task assignment
- Due dates and priorities
- Labels and categories

## Kanban Components

### Board Component
- Renders the overall board structure
- Manages column layout
- Handles board-level actions

### Column Component
- Displays tasks in a specific status
- Handles column-specific actions
- Shows column statistics

### Task Card Component
- Displays task information
- Provides quick actions
- Supports drag-and-drop

### Task Detail Component
- Shows comprehensive task information
- Allows detailed editing
- Displays comments and activity

## State Management

The Kanban board uses Redux for state management:
- Normalized task and board data
- Optimistic updates for drag-and-drop
- Undo/redo support

## Backend Integration

- RESTful API for CRUD operations
- WebSockets for real-time updates
- Batch operations for efficiency
