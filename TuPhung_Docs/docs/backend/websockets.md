---
sidebar_position: 6
sidebar_label: "WebSockets"
---

# WebSockets

## WebSocket Architecture and Workflows

### Connection Establishment Workflow

```mermaid
sequenceDiagram
    participant Client as Client
    participant SockJS as SockJS Fallback
    participant STOMP as STOMP Broker
    participant Security as Security Layer
    participant Handler as Message Handler
    participant Service as Backend Services
    
    Client->>SockJS: Connect Request
    SockJS->>STOMP: Establish Connection
    STOMP->>Security: Authenticate Connection
    
    alt Authentication Failed
        Security-->>STOMP: Reject Connection
        STOMP-->>SockJS: Connection Rejected
        SockJS-->>Client: Connection Failed
    else Authentication Successful
        Security-->>STOMP: Connection Authorized
        STOMP-->>SockJS: Connection Established
        SockJS-->>Client: Connection Successful
        Client->>STOMP: Subscribe to Topics
        STOMP-->>Client: Subscription Confirmed
    end
    
    Note over Client,Service: Connection Established
```

### Message Publishing Workflow

```mermaid
sequenceDiagram
    participant Client as Client
    participant STOMP as STOMP Broker
    participant Handler as Message Handler
    participant Service as Backend Services
    participant DB as Database
    
    Client->>STOMP: Send Message
    STOMP->>Handler: Process Message
    Handler->>Service: Business Logic Processing
    Service->>DB: Persist Message
    DB-->>Service: Confirmation
    Service-->>Handler: Processing Result
    Handler-->>STOMP: Broadcast to Subscribers
    STOMP-->>Client: Deliver to Subscribers
    
    Note over Client,DB: Message Delivered to All Subscribers
```

### Notification Workflow

```mermaid
flowchart TD
    A[System Event Occurs] --> B{Event Type}
    B -->|User Action| C[Generate Notification]
    B -->|System Alert| D[Create System Message]
    B -->|Status Change| E[Create Status Update]
    
    C --> F[Persist Notification]
    D --> F
    E --> F
    
    F --> G[Identify Recipients]
    G --> H[Format Message]
    H --> I[Publish to STOMP Topics]
    
    I --> J{Recipient Online?}
    J -->|Yes| K[Immediate Delivery]
    J -->|No| L[Store for Later Delivery]
    
    L --> M[Deliver on Reconnect]
    
    style A fill:#4CAF50,stroke:#333,stroke-width:1px,color:#fff
    style B fill:#FF9800,stroke:#333,stroke-width:1px,color:#fff
    style C,D,E,F,G,H,I fill:#2196F3,stroke:#333,stroke-width:1px,color:#fff
    style J fill:#FF9800,stroke:#333,stroke-width:1px,color:#fff
    style K,L,M fill:#9C27B0,stroke:#333,stroke-width:1px,color:#fff
```

## WebSocket Overview

The Enterprise Nexus Project uses WebSockets for real-time communication, enabling instant updates and notifications across the application. This bidirectional communication channel allows for efficient real-time features like chat, notifications, and collaborative editing.

## WebSocket Implementation

The backend implements WebSockets using a robust stack of technologies:

- **Spring WebSocket**: Core framework for WebSocket support in Spring Boot
- **STOMP (Simple Text Oriented Messaging Protocol)**: Message protocol for WebSocket communication
- **SockJS**: Provides fallback options for browsers without WebSocket support

## Message Types and Processing

The system supports various message types, each with specific handling logic:

### Message Categories

| Category | Description | Use Cases |
|----------|-------------|-----------|
| Chat Messages | Real-time communication between users | Private chats, group discussions |
| Notifications | System alerts and user notifications | Task assignments, mentions, reminders |
| Status Updates | Changes in system or entity status | Task status changes, user presence |
| Collaboration Events | Real-time collaborative actions | Kanban board updates, document editing |

### Message Processing Workflow

```mermaid
flowchart LR
    A[Message Received] --> B[Message Type Identification]
    B --> C{Message Type}
    
    C -->|Chat| D[Chat Processing]
    C -->|Notification| E[Notification Processing]
    C -->|Status| F[Status Processing]
    C -->|Collaboration| G[Collaboration Processing]
    
    D --> H[Chat Message Handler]
    E --> I[Notification Handler]
    F --> J[Status Update Handler]
    G --> K[Collaboration Handler]
    
    H --> L[Message Persistence]
    I --> L
    J --> L
    K --> L
    
    L --> M[Topic Publication]
    M --> N[Client Delivery]
    
    style A,B fill:#4CAF50,stroke:#333,stroke-width:1px,color:#fff
    style C fill:#FF9800,stroke:#333,stroke-width:1px,color:#fff
    style D,E,F,G fill:#2196F3,stroke:#333,stroke-width:1px,color:#fff
    style H,I,J,K fill:#9C27B0,stroke:#333,stroke-width:1px,color:#fff
    style L,M,N fill:#E91E63,stroke:#333,stroke-width:1px,color:#fff
```

## WebSocket Security Architecture

WebSocket connections are secured with multiple layers of protection:

### Security Measures

| Security Feature | Implementation | Purpose |
|------------------|----------------|---------|
| Authentication | JWT Token Validation | Verify user identity |
| Authorization | Role-based access control | Control access to topics |
| Connection Timeout | 5-minute idle timeout | Prevent resource exhaustion |
| Message Size Limits | 64KB maximum message size | Prevent DoS attacks |
| Rate Limiting | 100 messages per minute | Prevent abuse |
| Message Validation | Schema validation | Prevent malformed messages |

### Security Workflow

```mermaid
flowchart TD
    A[Connection Request] --> B[JWT Token Extraction]
    B --> C{Token Valid?}
    
    C -->|No| D[Reject Connection]
    C -->|Yes| E[User Authentication]
    
    E --> F{User Authorized?}
    F -->|No| D
    F -->|Yes| G[Connection Established]
    
    G --> H[Subscribe Request]
    H --> I{Topic Authorization}
    I -->|No| J[Reject Subscription]
    I -->|Yes| K[Subscription Confirmed]
    
    G --> L[Message Sending]
    L --> M[Rate Limiting Check]
    M -->|Exceeded| N[Throttle Message]
    M -->|Within Limits| O[Size Validation]
    
    O -->|Too Large| P[Reject Message]
    O -->|Acceptable| Q[Process Message]
    
    style A,B,E,G,H,L fill:#4CAF50,stroke:#333,stroke-width:1px,color:#fff
    style C,F,I,M,O fill:#FF9800,stroke:#333,stroke-width:1px,color:#fff
    style D,J,N,P fill:#F44336,stroke:#333,stroke-width:1px,color:#fff
    style K,Q fill:#2196F3,stroke:#333,stroke-width:1px,color:#fff
```

## Subscription Topics and Routing

Clients can subscribe to various topics, each serving a specific purpose in the application:

### Core Topics

| Topic Pattern | Description | Access Control |
|---------------|-------------|----------------|
| `/topic/chat/{chatId}` | Chat messages for a specific chat | Chat participants only |
| `/topic/notifications/{userId}` | User notifications | User and admins only |
| `/topic/board/{boardId}` | Kanban board updates | Board members only |
| `/topic/calendar/{userId}` | Calendar updates | User and shared calendar members |
| `/topic/presence` | User online status | All authenticated users |
| `/topic/announcements` | System-wide announcements | All authenticated users |

### Topic Subscription Workflow

```mermaid
sequenceDiagram
    participant Client as Client
    participant STOMP as STOMP Broker
    participant Auth as Authorization Service
    participant Sub as Subscription Manager
    
    Client->>STOMP: Subscribe to Topic
    STOMP->>Auth: Check Authorization
    
    alt Unauthorized
        Auth-->>STOMP: Reject Subscription
        STOMP-->>Client: Subscription Failed
    else Authorized
        Auth-->>STOMP: Authorize Subscription
        STOMP->>Sub: Register Subscription
        Sub-->>STOMP: Subscription Registered
        STOMP-->>Client: Subscription Successful
        
        loop While Subscribed
            STOMP->>Client: Message 1
            STOMP->>Client: Message 2
            STOMP->>Client: Message N
        end
        
        Client->>STOMP: Unsubscribe
        STOMP->>Sub: Remove Subscription
        Sub-->>STOMP: Subscription Removed
    end
```

## Message Format and Validation

WebSocket messages use a consistent JSON format with strict validation:

### Standard Message Structure

```json
{
  "type": "CHAT_MESSAGE",
  "timestamp": "2023-05-15T10:30:45Z",
  "senderId": "user123",
  "payload": {
    "chatId": "chat456",
    "content": "Hello, world!",
    "contentType": "TEXT"
  }
}
```

### Message Type Specifications

| Message Type | Required Fields | Payload Structure | Validation Rules |
|--------------|----------------|-------------------|------------------|
| CHAT_MESSAGE | type, timestamp, senderId, payload | chatId, content, contentType | Content max length: 2000 chars |
| NOTIFICATION | type, timestamp, payload | notificationType, title, message | Title max length: 100 chars |
| STATUS_UPDATE | type, timestamp, payload | entityId, entityType, status | Valid status values per entity |
| BOARD_UPDATE | type, timestamp, senderId, payload | boardId, action, data | Valid actions: move, add, delete |

### Message Validation Workflow

```mermaid
flowchart TD
    A[Message Received] --> B[Schema Validation]
    B --> C{Valid Schema?}
    
    C -->|No| D[Reject Message]
    C -->|Yes| E[Content Validation]
    
    E --> F{Content Valid?}
    F -->|No| D
    F -->|Yes| G[Business Rule Validation]
    
    G --> H{Rules Satisfied?}
    H -->|No| D
    H -->|Yes| I[Process Message]
    
    style A,B,E,G fill:#4CAF50,stroke:#333,stroke-width:1px,color:#fff
    style C,F,H fill:#FF9800,stroke:#333,stroke-width:1px,color:#fff
    style D fill:#F44336,stroke:#333,stroke-width:1px,color:#fff
    style I fill:#2196F3,stroke:#333,stroke-width:1px,color:#fff
```

## Error Handling and Recovery

The WebSocket implementation includes robust error handling and recovery mechanisms:

### Error Handling Strategies

| Error Type | Handling Strategy | Client Notification |
|------------|-------------------|---------------------|
| Connection Failures | Automatic reconnection with exponential backoff | Connection status events |
| Message Delivery Failures | Message queuing and retry | Delivery status updates |
| Invalid Messages | Rejection with error details | Error message with validation details |
| Server Errors | Graceful degradation | Error notification with tracking ID |

### Reconnection Workflow

```mermaid
sequenceDiagram
    participant Client as Client
    participant SockJS as SockJS
    participant Server as WebSocket Server
    
    Client->>SockJS: Initial Connection
    SockJS->>Server: Establish Connection
    Server-->>SockJS: Connection Established
    SockJS-->>Client: Connected
    
    Note over Client,Server: Connection Lost
    
    loop Reconnection Attempts
        Client->>SockJS: Reconnect (Attempt 1)
        SockJS->>Server: Reconnection Request
        alt Server Available
            Server-->>SockJS: Connection Reestablished
            SockJS-->>Client: Reconnected
        else Server Unavailable
            SockJS-->>Client: Reconnection Failed
            Note over Client: Wait with Exponential Backoff
            Client->>SockJS: Reconnect (Attempt 2)
            SockJS->>Server: Reconnection Request
        end
    end
    
    Server-->>SockJS: Connection Reestablished
    SockJS-->>Client: Reconnected
    Client->>Server: Resubscribe to Topics
    Server-->>Client: Subscriptions Restored
    Server-->>Client: Missed Messages Delivered
```

