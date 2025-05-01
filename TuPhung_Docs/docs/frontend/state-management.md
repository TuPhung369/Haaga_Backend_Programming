---
sidebar_position: 9
---

# State Management

## State Management Overview

The TuPhung Project frontend uses Redux for state management.

## Redux Architecture

- **Store**: Central state container
- **Actions**: Events that trigger state changes
- **Reducers**: Pure functions that update state
- **Selectors**: Functions to extract state data
- **Middleware**: For side effects and async logic

## State Structure

The Redux store is organized into slices:
- **Auth**: Authentication state
- **User**: User data and preferences
- **Chat**: Chat conversations and messages
- **Kanban**: Boards, columns, and tasks
- **Calendar**: Events and calendar settings
- **UI**: UI-related state (modals, themes, etc.)

## Middleware

The application uses several Redux middleware:
- **Redux Thunk**: For async actions
- **Redux Logger**: For development debugging
- **Redux Persist**: For state persistence
- **Redux WebSocket**: For real-time communication

## Performance Optimizations

- Normalized state shape
- Memoized selectors with Reselect
- Optimistic updates
- Lazy loading of state slices
- Debounced actions for frequent updates

## State Management Patterns

- Container/Presentational component pattern
- Redux hooks (useSelector, useDispatch)
- Action creators for complex actions
- Selector composition for derived data
