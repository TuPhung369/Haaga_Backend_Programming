package com.database.study.mock;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * Mock WebSocket handler for Novu notifications
 * This simulates the Novu WebSocket server for development and testing
 */
@Slf4j
public class MockNovuWebSocketHandler extends TextWebSocketHandler {
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, String> sessionToUserMap = new ConcurrentHashMap<>(); // Maps session ID to user ID
    
    // Queue to store pending notifications for users who don't have an active session yet
    private final Map<String, List<Map<String, Object>>> pendingNotifications = new ConcurrentHashMap<>();
    
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("Mock Novu WebSocket connection established: {}", session.getId());
        sessions.put(session.getId(), session);
        
        // Try to extract user ID from session attributes or URI parameters
        try {
            boolean userIdFound = false;
            
            // Check if there's a user ID in the session attributes
            if (session.getAttributes().containsKey("userId")) {
                String userId = session.getAttributes().get("userId").toString();
                associateUserWithSession(session.getId(), userId);
                log.info("Found userId in session attributes: {}", userId);
                userIdFound = true;
            }
            
            // Check if there's a subscriber ID in the URI parameters
            String uri = session.getUri().toString();
            log.info("WebSocket connection URI: {}", uri);
            
            // Check for subscriberId parameter
            if (uri.contains("subscriberId=")) {
                int start = uri.indexOf("subscriberId=") + "subscriberId=".length();
                int end = uri.indexOf("&", start);
                if (end == -1) end = uri.length();
                String subscriberId = uri.substring(start, end);
                associateUserWithSession(session.getId(), subscriberId);
                log.info("Found subscriberId in URI: {}", subscriberId);
                userIdFound = true;
            }
            
            // Check for userId parameter
            if (uri.contains("userId=")) {
                int start = uri.indexOf("userId=") + "userId=".length();
                int end = uri.indexOf("&", start);
                if (end == -1) end = uri.length();
                String userId = uri.substring(start, end);
                associateUserWithSession(session.getId(), userId);
                log.info("Found userId in URI: {}", userId);
                userIdFound = true;
            }
            
            // Check for EIO parameter (Socket.IO connection)
            if (uri.contains("EIO=")) {
                log.info("This appears to be a Socket.IO connection");
                
                // For Socket.IO connections, we'll need to wait for the authentication message
                // But we can try to extract the user ID from the headers or cookies
                Map<String, Object> attributes = session.getAttributes();
                log.info("Socket.IO connection attributes: {}", attributes);
                
                // Check for Authorization header
                if (session.getHandshakeHeaders().containsKey("Authorization")) {
                    String authHeader = session.getHandshakeHeaders().getFirst("Authorization");
                    log.info("Found Authorization header: {}", authHeader);
                    
                    // Try to extract user ID from JWT token
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        log.info("Found JWT token: {}", token);
                        
                        // In a real implementation, you would decode the JWT token
                        // For now, we'll just log it and wait for the authentication message
                    }
                }
                
                // Check for Cookie header
                if (session.getHandshakeHeaders().containsKey("Cookie")) {
                    String cookieHeader = session.getHandshakeHeaders().getFirst("Cookie");
                    log.info("Found Cookie header: {}", cookieHeader);
                    
                    // Try to extract user ID from cookies
                    if (cookieHeader != null && cookieHeader.contains("userId=")) {
                        int start = cookieHeader.indexOf("userId=") + "userId=".length();
                        int end = cookieHeader.indexOf(";", start);
                        if (end == -1) end = cookieHeader.length();
                        String userId = cookieHeader.substring(start, end);
                        associateUserWithSession(session.getId(), userId);
                        log.info("Found userId in Cookie: {}", userId);
                        userIdFound = true;
                    }
                }
            }
            
            // If no user ID was found, log a warning
            if (!userIdFound) {
                log.warn("No user ID found in session attributes or URI parameters. This may cause notification issues.");
                log.info("Session attributes: {}", session.getAttributes());
                log.info("Session URI: {}", session.getUri());
                log.info("Session headers: {}", session.getHandshakeHeaders());
                
                // As a fallback, associate this session with all pending notifications
                // This is only for development/testing to ensure notifications work
                for (String userId : pendingNotifications.keySet()) {
                    if (!pendingNotifications.get(userId).isEmpty()) {
                        log.info("Associating session {} with user {} because there are pending notifications", 
                                session.getId(), userId);
                        associateUserWithSession(session.getId(), userId);
                        break;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error extracting user information from session: {}", e.getMessage(), e);
        }
        
        // Send initial connection message (similar to Socket.IO handshake)
        String connectMessage = "0{\"sid\":\"mock-session-" + session.getId() + "\",\"upgrades\":[],\"pingInterval\":25000,\"pingTimeout\":5000}";
        session.sendMessage(new TextMessage(connectMessage));
        
        // Send a mock "connected" message
        String connectedMessage = "40{\"connected\":true}";
        session.sendMessage(new TextMessage(connectedMessage));
        
        log.info("Connection established messages sent to session: {}", session.getId());
        log.info("Total active sessions: {}", sessions.size());
        log.info("Current session-to-user mapping: {}", sessionToUserMap);
        
        // Check if there are any pending notifications for this user
        for (Map.Entry<String, String> entry : sessionToUserMap.entrySet()) {
            if (entry.getKey().equals(session.getId())) {
                String userId = entry.getValue();
                deliverPendingNotifications(userId, session);
                break;
            }
        }
    }
    
    /**
     * Associate a user ID with a session
     * @param sessionId The session ID
     * @param userId The user ID
     */
    public void associateUserWithSession(String sessionId, String userId) {
        sessionToUserMap.put(sessionId, userId);
        log.info("Associated user {} with session {}", userId, sessionId);
        
        // Check if there are any pending notifications for this user
        WebSocketSession session = sessions.get(sessionId);
        if (session != null && session.isOpen()) {
            deliverPendingNotifications(userId, session);
        }
    }
    
    /**
     * Create a mock session for testing
     * 
     * @param sessionId The session ID to create
     * @param userId The user ID to associate with the session
     */
    public void createMockSession(String sessionId, String userId) {
        log.info("Creating mock session {} for user {}", sessionId, userId);
        
        // Create a mock session and add it to the sessions map
        try {
            // Associate the user with this session ID
            associateUserWithSession(sessionId, userId);
            
            // Create a mock WebSocketSession
            MockWebSocketSession mockSession = new MockWebSocketSession(sessionId);
            
            // Add it to the sessions map
            sessions.put(sessionId, mockSession);
            
            log.info("Created mock session {} for user {}", sessionId, userId);
        } catch (Exception e) {
            log.error("Error creating mock session: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Deliver pending notifications for a user to all associated sessions
     * 
     * @param userId The user ID to deliver notifications for
     */
    public void deliverPendingNotifications(String userId) {
        log.info("Attempting to deliver pending notifications for user: {}", userId);
        
        // Find all sessions associated with this user
        List<String> userSessions = new ArrayList<>();
        for (Map.Entry<String, String> entry : sessionToUserMap.entrySet()) {
            if (entry.getValue().equals(userId)) {
                userSessions.add(entry.getKey());
            }
        }
        
        if (userSessions.isEmpty()) {
            log.warn("No sessions found for user {}, notifications will remain pending", userId);
            return;
        }
        
        log.info("Found {} sessions for user {}", userSessions.size(), userId);
        
        // Deliver notifications to each session
        for (String sessionId : userSessions) {
            WebSocketSession session = sessions.get(sessionId);
            if (session != null && session.isOpen()) {
                log.info("Delivering pending notifications to session {}", sessionId);
                deliverPendingNotifications(userId, session);
            } else {
                log.warn("Session {} is not available or not open", sessionId);
            }
        }
    }
    
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        log.info("Received message from client {}: {}", session.getId(), payload);
        
        // Handle different types of messages based on Socket.IO protocol
        if (payload.startsWith("2")) {
            // Ping message, respond with pong
            session.sendMessage(new TextMessage("3"));
        } else if (payload.startsWith("42[\"subscribe_to_user_updates\"")) {
            // User subscription request
            handleUserSubscription(session, payload);
            
            // Extract user ID from the subscription message
            try {
                // The format is typically: 42["subscribe_to_user_updates",{"userId":"user-id-here"}]
                extractAndAssociateUserId(session, payload);
            } catch (Exception e) {
                log.error("Error extracting user ID from subscription message: {}", e.getMessage());
            }
        } else if (payload.startsWith("42[\"notification_read\"")) {
            // Notification read event
            handleNotificationRead(session, payload);
        } else if (payload.contains("\"subscriberId\"") || payload.contains("\"_subscriberId\"") || payload.contains("\"userId\"")) {
            // This might be a registration message with a subscriber ID or user ID
            log.info("Potential user identification message: {}", payload);
            try {
                extractAndAssociateUserId(session, payload);
            } catch (Exception e) {
                log.error("Error extracting user identifier: {}", e.getMessage());
            }
        } else if (payload.startsWith("42[\"set_user_id\"") || payload.startsWith("42[\"register\"") || payload.startsWith("42[\"identify\"")) {
            // This is likely a user identification message
            log.info("User identification message: {}", payload);
            try {
                extractAndAssociateUserId(session, payload);
                
                // Send a confirmation message
                String response = "42[\"user_id_set\",{\"success\":true}]";
                session.sendMessage(new TextMessage(response));
            } catch (Exception e) {
                log.error("Error handling user identification message: {}", e.getMessage());
            }
        } else {
            log.info("Unhandled message type: {}", payload);
            
            // Try to extract user ID from any message as a fallback
            try {
                if (payload.contains("\"userId\"") || payload.contains("\"subscriberId\"") || payload.contains("\"_subscriberId\"")) {
                    log.info("Attempting to extract user ID from unhandled message");
                    extractAndAssociateUserId(session, payload);
                }
            } catch (Exception e) {
                log.error("Error extracting user ID from unhandled message: {}", e.getMessage());
            }
        }
        
        // Log the current session-to-user mapping after processing the message
        log.info("Current session-to-user mapping after message processing: {}", sessionToUserMap);
    }
    
    /**
     * Extract user ID from a message payload and associate it with the session
     */
    private void extractAndAssociateUserId(WebSocketSession session, String payload) {
        log.info("Attempting to extract user ID from payload: {}", payload);
        
        try {
            // Try to extract userId
            int userIdStart = payload.indexOf("\"userId\"");
            if (userIdStart > 0) {
                int valueStart = payload.indexOf(":", userIdStart) + 1;
                // Skip whitespace
                while (valueStart < payload.length() && 
                      (payload.charAt(valueStart) == ' ' || payload.charAt(valueStart) == '"')) {
                    valueStart++;
                }
                
                int valueEnd;
                if (payload.charAt(valueStart - 1) == '"') {
                    // If it's a quoted string
                    valueEnd = payload.indexOf("\"", valueStart);
                } else {
                    // If it's not quoted (e.g., a number or boolean)
                    valueEnd = payload.indexOf(",", valueStart);
                    if (valueEnd == -1) {
                        valueEnd = payload.indexOf("}", valueStart);
                    }
                }
                
                if (valueStart > 0 && valueEnd > valueStart) {
                    String userId = payload.substring(valueStart, valueEnd);
                    associateUserWithSession(session.getId(), userId);
                    log.info("Successfully extracted userId: {}", userId);
                    return;
                }
            }
            
            // Try to extract subscriberId if userId wasn't found
            int subscriberIdStart = payload.indexOf("\"subscriberId\"");
            if (subscriberIdStart > 0) {
                int valueStart = payload.indexOf(":", subscriberIdStart) + 1;
                // Skip whitespace
                while (valueStart < payload.length() && 
                      (payload.charAt(valueStart) == ' ' || payload.charAt(valueStart) == '"')) {
                    valueStart++;
                }
                
                int valueEnd;
                if (payload.charAt(valueStart - 1) == '"') {
                    // If it's a quoted string
                    valueEnd = payload.indexOf("\"", valueStart);
                } else {
                    // If it's not quoted (e.g., a number or boolean)
                    valueEnd = payload.indexOf(",", valueStart);
                    if (valueEnd == -1) {
                        valueEnd = payload.indexOf("}", valueStart);
                    }
                }
                
                if (valueStart > 0 && valueEnd > valueStart) {
                    String subscriberId = payload.substring(valueStart, valueEnd);
                    associateUserWithSession(session.getId(), subscriberId);
                    log.info("Successfully extracted subscriberId: {}", subscriberId);
                    return;
                }
            }
            
            // Try to extract _subscriberId if subscriberId wasn't found
            int _subscriberIdStart = payload.indexOf("\"_subscriberId\"");
            if (_subscriberIdStart > 0) {
                int valueStart = payload.indexOf(":", _subscriberIdStart) + 1;
                // Skip whitespace
                while (valueStart < payload.length() && 
                      (payload.charAt(valueStart) == ' ' || payload.charAt(valueStart) == '"')) {
                    valueStart++;
                }
                
                int valueEnd;
                if (payload.charAt(valueStart - 1) == '"') {
                    // If it's a quoted string
                    valueEnd = payload.indexOf("\"", valueStart);
                } else {
                    // If it's not quoted (e.g., a number or boolean)
                    valueEnd = payload.indexOf(",", valueStart);
                    if (valueEnd == -1) {
                        valueEnd = payload.indexOf("}", valueStart);
                    }
                }
                
                if (valueStart > 0 && valueEnd > valueStart) {
                    String subscriberId = payload.substring(valueStart, valueEnd);
                    associateUserWithSession(session.getId(), subscriberId);
                    log.info("Successfully extracted _subscriberId: {}", subscriberId);
                    return;
                }
            }
            
            log.warn("Could not extract any user identifier from payload");
        } catch (Exception e) {
            log.error("Error extracting user ID from payload: {}", e.getMessage(), e);
        }
    }
    
    private void handleUserSubscription(WebSocketSession session, String payload) throws IOException {
        log.info("Client {} subscribed to user updates with payload: {}", session.getId(), payload);
        
        // Send a mock response confirming subscription
        String response = "42[\"user_subscription_confirmed\",{\"success\":true}]";
        session.sendMessage(new TextMessage(response));
        
        try {
            // Extract user ID from the subscription message
            extractAndAssociateUserId(session, payload);
            
            // Get the user ID associated with this session
            String userId = sessionToUserMap.get(session.getId());
            
            // If we still don't have a user ID, try to extract it from the payload using a more direct approach
            if (userId == null) {
                log.info("No user ID found in session-to-user mapping, trying to extract from payload directly");
                
                try {
                    // Try to parse the payload as JSON
                    // The format is typically: 42["subscribe_to_user_updates",{"userId":"user-id-here"}]
                    // We need to extract the second part (after the comma) and parse it as JSON
                    int commaIndex = payload.indexOf(',');
                    if (commaIndex > 0 && commaIndex < payload.length() - 1) {
                        String jsonPart = payload.substring(commaIndex + 1, payload.length() - 1);
                        log.info("Extracted JSON part: {}", jsonPart);
                        
                        // Parse the JSON part
                        Map<String, Object> data = objectMapper.readValue(jsonPart, Map.class);
                        log.info("Parsed JSON data: {}", data);
                        
                        // Check for userId, subscriberId, or _subscriberId
                        if (data.containsKey("userId")) {
                            userId = data.get("userId").toString();
                            associateUserWithSession(session.getId(), userId);
                            log.info("Extracted userId from JSON: {}", userId);
                        } else if (data.containsKey("subscriberId")) {
                            userId = data.get("subscriberId").toString();
                            associateUserWithSession(session.getId(), userId);
                            log.info("Extracted subscriberId from JSON: {}", userId);
                        } else if (data.containsKey("_subscriberId")) {
                            userId = data.get("_subscriberId").toString();
                            associateUserWithSession(session.getId(), userId);
                            log.info("Extracted _subscriberId from JSON: {}", userId);
                        }
                    }
                } catch (Exception e) {
                    log.error("Error parsing JSON from payload: {}", e.getMessage(), e);
                }
            }
            
            // If we still don't have a user ID, check if there are any pending notifications
            if (userId == null) {
                log.info("No user ID found, checking for pending notifications");
                
                // As a fallback, associate this session with all pending notifications
                // This is only for development/testing to ensure notifications work
                for (String pendingUserId : pendingNotifications.keySet()) {
                    if (!pendingNotifications.get(pendingUserId).isEmpty()) {
                        log.info("Associating session {} with user {} because there are pending notifications", 
                                session.getId(), pendingUserId);
                        associateUserWithSession(session.getId(), pendingUserId);
                        userId = pendingUserId;
                        break;
                    }
                }
            }
            
            // Create a proper unseen count update with the user ID if available
            Map<String, Object> countData = new HashMap<>();
            
            // Check if there are pending notifications for this user
            List<Map<String, Object>> notifications = userId != null ? pendingNotifications.get(userId) : null;
            int unseenCount = (notifications != null && !notifications.isEmpty()) ? notifications.size() : 1;
            
            // Always set to at least 1 to ensure the bell shows notifications
            countData.put("unseenCount", unseenCount);
            if (userId != null) {
                countData.put("userId", userId);
            }
            
            String unseenCountUpdate = "42[\"unseen_count_changed\"," + objectMapper.writeValueAsString(countData) + "]";
            session.sendMessage(new TextMessage(unseenCountUpdate));
            
            log.info("Sent unseen count update with count {} to session {}", unseenCount, session.getId());
            
            // If we have a user ID, deliver any pending notifications
            if (userId != null) {
                deliverPendingNotifications(userId, session);
            }
        } catch (Exception e) {
            log.error("Error handling user subscription: {}", e.getMessage(), e);
            
            // Fallback to simple format if there's an error
            String unseenCountUpdate = "42[\"unseen_count_changed\",{\"unseenCount\":1}]";
            session.sendMessage(new TextMessage(unseenCountUpdate));
        }
    }
    
    private void handleNotificationRead(WebSocketSession session, String payload) throws IOException {
        log.info("Client {} marked notification as read", session.getId());
        
        // Send a mock response confirming the read status
        String response = "42[\"notification_read_confirmed\",{\"success\":true}]";
        session.sendMessage(new TextMessage(response));
        
        try {
            // Get the user ID associated with this session
            String userId = sessionToUserMap.get(session.getId());
            
            // Create a proper unseen count update with the user ID if available
            Map<String, Object> countData = new HashMap<>();
            countData.put("unseenCount", 0); // Set to 0 after reading
            if (userId != null) {
                countData.put("userId", userId);
            }
            
            String unseenCountUpdate = "42[\"unseen_count_changed\"," + objectMapper.writeValueAsString(countData) + "]";
            session.sendMessage(new TextMessage(unseenCountUpdate));
            
            log.info("Sent unseen count update with count 0 to session {}", session.getId());
        } catch (Exception e) {
            log.error("Error creating unseen count update: {}", e.getMessage());
            
            // Fallback to simple format if there's an error
            String unseenCountUpdate = "42[\"unseen_count_changed\",{\"unseenCount\":0}]";
            session.sendMessage(new TextMessage(unseenCountUpdate));
        }
    }
    
    /**
     * Deliver any pending notifications for a user
     * @param userId The user ID
     * @param session The WebSocket session
     */
    private void deliverPendingNotifications(String userId, WebSocketSession session) {
        List<Map<String, Object>> notifications = pendingNotifications.get(userId);
        if (notifications != null && !notifications.isEmpty()) {
            log.info("Found {} pending notifications for user {}", notifications.size(), userId);
            
            try {
                for (Map<String, Object> notification : new ArrayList<>(notifications)) {
                    try {
                        // Send the notification in all supported formats
                        String notificationMessage = "42[\"notification\"," + objectMapper.writeValueAsString(notification) + "]";
                        String novuNotificationMessage = "42[\"received_notification\"," + objectMapper.writeValueAsString(notification) + "]";
                        String directNotification = "42[\"notification_received\",{\"notification\":" + 
                            objectMapper.writeValueAsString(notification) + "}]";
                        String alternativeNotification = "42[\"received_notification\",{\"notification\":" + 
                            objectMapper.writeValueAsString(notification) + "}]";
                        
                        // Send all formats to ensure compatibility
                        session.sendMessage(new TextMessage(notificationMessage));
                        session.sendMessage(new TextMessage(novuNotificationMessage));
                        session.sendMessage(new TextMessage(directNotification));
                        session.sendMessage(new TextMessage(alternativeNotification));
                        
                        // Send an unseen count update
                        Map<String, Object> countUpdate = new HashMap<>();
                        countUpdate.put("unseenCount", 1); // Set to 1 to ensure the bell shows notifications
                        countUpdate.put("userId", userId);
                        
                        String unseenCountUpdate = "42[\"unseen_count_changed\"," + objectMapper.writeValueAsString(countUpdate) + "]";
                        session.sendMessage(new TextMessage(unseenCountUpdate));
                        
                        log.info("Successfully delivered pending notification to user {}", userId);
                    } catch (Exception e) {
                        log.error("Error delivering pending notification: {}", e.getMessage(), e);
                    }
                }
                
                // Clear the delivered notifications
                notifications.clear();
                log.info("Cleared pending notifications for user {}", userId);
            } catch (Exception e) {
                log.error("Error processing pending notifications for user {}: {}", userId, e.getMessage(), e);
            }
        }
    }
    
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        log.info("Mock Novu WebSocket connection closed: {}, status: {}", session.getId(), status);
        
        // Remove the session from both maps
        sessions.remove(session.getId());
        String userId = sessionToUserMap.remove(session.getId());
        
        if (userId != null) {
            log.info("Removed user association for session {}, user {}", session.getId(), userId);
        }
    }
    
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("Transport error in mock Novu WebSocket for session {}: {}", session.getId(), exception.getMessage(), exception);
    }
    
    /**
     * Get information about active WebSocket sessions
     * @return A map containing information about active sessions
     */
    public Map<String, Object> getSessionInfo() {
        Map<String, Object> info = new HashMap<>();
        
        // Add session count
        info.put("sessionCount", sessions.size());
        
        // Add session-to-user mapping
        info.put("sessionToUserMap", new HashMap<>(sessionToUserMap));
        
        // Add pending notifications
        Map<String, Object> pendingNotificationsInfo = new HashMap<>();
        for (Map.Entry<String, List<Map<String, Object>>> entry : pendingNotifications.entrySet()) {
            pendingNotificationsInfo.put(entry.getKey(), entry.getValue().size());
        }
        info.put("pendingNotifications", pendingNotificationsInfo);
        
        // Add active sessions
        List<Map<String, Object>> sessionInfoList = new ArrayList<>();
        for (Map.Entry<String, WebSocketSession> entry : sessions.entrySet()) {
            WebSocketSession session = entry.getValue();
            Map<String, Object> sessionInfo = new HashMap<>();
            sessionInfo.put("id", session.getId());
            sessionInfo.put("open", session.isOpen());
            sessionInfo.put("uri", session.getUri() != null ? session.getUri().toString() : null);
            sessionInfo.put("userId", sessionToUserMap.get(session.getId()));
            
            sessionInfoList.add(sessionInfo);
        }
        info.put("sessions", sessionInfoList);
        
        return info;
    }
    
    /**
     * Send a notification directly to a specific WebSocket session
     * This can be used to manually trigger a notification for testing
     * 
     * @param sessionId The ID of the session to send the notification to
     * @param notificationType The type of notification
     * @param data The notification data
     */
    public void sendNotificationToSession(String sessionId, String notificationType, Map<String, Object> data) {
        WebSocketSession session = sessions.get(sessionId);
        if (session != null && session.isOpen()) {
            try {
                // Create a notification payload
                Map<String, Object> notification = new HashMap<>();
                notification.put("_id", java.util.UUID.randomUUID().toString());
                notification.put("type", notificationType);
                notification.put("payload", data);
                notification.put("createdAt", System.currentTimeMillis());
                notification.put("seen", false);
                notification.put("read", false);
                notification.put("status", "sent");
                
                // Create content based on notification type
                notification.put("content", createContentBasedOnType(notificationType, data));
                
                // Send the notification in all supported formats
                String notificationMessage = "42[\"notification\"," + objectMapper.writeValueAsString(notification) + "]";
                String novuNotificationMessage = "42[\"received_notification\"," + objectMapper.writeValueAsString(notification) + "]";
                String directNotification = "42[\"notification_received\",{\"notification\":" + 
                    objectMapper.writeValueAsString(notification) + "}]";
                
                // Send all formats to ensure compatibility
                session.sendMessage(new TextMessage(notificationMessage));
                session.sendMessage(new TextMessage(novuNotificationMessage));
                session.sendMessage(new TextMessage(directNotification));
                
                // Send an unseen count update
                Map<String, Object> countUpdate = new HashMap<>();
                countUpdate.put("unseenCount", 1); // Set to 1 to ensure the bell shows notifications
                
                String unseenCountUpdate = "42[\"unseen_count_changed\"," + objectMapper.writeValueAsString(countUpdate) + "]";
                session.sendMessage(new TextMessage(unseenCountUpdate));
                
                log.info("Successfully sent direct notification to session {}", sessionId);
            } catch (Exception e) {
                log.error("Error sending direct notification to session {}: {}", sessionId, e.getMessage(), e);
            }
        } else {
            log.warn("Cannot send notification to session {}: session not found or closed", sessionId);
        }
    }
    
    /**
     * Send a notification to all active sessions
     * This can be used to broadcast a notification for testing
     * 
     * @param notificationType The type of notification
     * @param data The notification data
     */
    public void broadcastNotification(String notificationType, Map<String, Object> data) {
        log.info("Broadcasting {} notification to all active sessions: {}", notificationType, data);
        
        int count = 0;
        for (WebSocketSession session : sessions.values()) {
            if (session.isOpen()) {
                try {
                    // Create a notification payload
                    Map<String, Object> notification = new HashMap<>();
                    notification.put("_id", java.util.UUID.randomUUID().toString());
                    notification.put("type", notificationType);
                    notification.put("payload", data);
                    notification.put("createdAt", System.currentTimeMillis());
                    notification.put("seen", false);
                    notification.put("read", false);
                    notification.put("status", "sent");
                    
                    // Create content based on notification type
                    notification.put("content", createContentBasedOnType(notificationType, data));
                    
                    // Send the notification in all supported formats
                    String notificationMessage = "42[\"notification\"," + objectMapper.writeValueAsString(notification) + "]";
                    String novuNotificationMessage = "42[\"received_notification\"," + objectMapper.writeValueAsString(notification) + "]";
                    String directNotification = "42[\"notification_received\",{\"notification\":" + 
                        objectMapper.writeValueAsString(notification) + "}]";
                    
                    // Send all formats to ensure compatibility
                    session.sendMessage(new TextMessage(notificationMessage));
                    session.sendMessage(new TextMessage(novuNotificationMessage));
                    session.sendMessage(new TextMessage(directNotification));
                    
                    // Send an unseen count update
                    Map<String, Object> countUpdate = new HashMap<>();
                    countUpdate.put("unseenCount", 1); // Set to 1 to ensure the bell shows notifications
                    
                    String unseenCountUpdate = "42[\"unseen_count_changed\"," + objectMapper.writeValueAsString(countUpdate) + "]";
                    session.sendMessage(new TextMessage(unseenCountUpdate));
                    
                    count++;
                } catch (Exception e) {
                    log.error("Error broadcasting notification to session {}: {}", session.getId(), e.getMessage(), e);
                }
            }
        }
        
        log.info("Successfully broadcast notification to {} active sessions", count);
    }
    
    /**
     * Create appropriate content based on notification type
     * 
     * @param notificationType The type of notification
     * @param data The notification data
     * @return A map containing the content for the notification
     */
    private Map<String, Object> createContentBasedOnType(String notificationType, Map<String, Object> data) {
        Map<String, Object> content = new HashMap<>();
        
        switch (notificationType) {
            case "contact-request":
                content.put("title", "New Contact Request");
                content.put("message", "You have received a new contact request");
                if (data.containsKey("requesterId")) {
                    content.put("requesterId", data.get("requesterId"));
                }
                break;
            case "new-message":
                content.put("title", "New Message");
                if (data.containsKey("messagePreview")) {
                    content.put("message", data.get("messagePreview"));
                } else {
                    content.put("message", "You have received a new message");
                }
                if (data.containsKey("senderId")) {
                    content.put("senderId", data.get("senderId"));
                }
                break;
            case "contact-accepted":
                content.put("title", "Contact Request Accepted");
                content.put("message", "Your contact request has been accepted");
                if (data.containsKey("accepterId")) {
                    content.put("accepterId", data.get("accepterId"));
                }
                break;
            default:
                content.put("title", "New Notification");
                content.put("message", "You have a new notification");
                break;
        }
        
        return content;
    }
    
    /**
     * Send a notification to a specific user
     * This can be called from other parts of the application to simulate Novu sending a notification
     * 
     * @param userId The ID of the user to send the notification to
     * @param notificationType The type of notification (e.g., "contact-request", "new-message")
     * @param data The notification data
     */
    public void sendNotification(String userId, String notificationType, Map<String, Object> data) {
        log.info("Sending {} notification to user {}: {}", notificationType, userId, data);
        
        try {
            // Create a notification payload based on the notification type
            Map<String, Object> notification = new HashMap<>();
            notification.put("_id", java.util.UUID.randomUUID().toString());
            notification.put("type", notificationType);
            notification.put("payload", data);
            notification.put("userId", userId);
            notification.put("createdAt", System.currentTimeMillis());
            notification.put("seen", false);
            notification.put("read", false);
            notification.put("status", "sent");
            notification.put("cta", new HashMap<>()); // Click-to-action data
            
            // Create a Socket.IO-like message format for the notification
            String notificationMessage = "42[\"notification\"," + objectMapper.writeValueAsString(notification) + "]";
            
            // Create a proper Novu notification format that matches what the frontend expects
            Map<String, Object> novuNotification = new HashMap<>();
            novuNotification.put("_id", java.util.UUID.randomUUID().toString());
            novuNotification.put("_templateId", java.util.UUID.randomUUID().toString());
            novuNotification.put("_environmentId", java.util.UUID.randomUUID().toString());
            novuNotification.put("_organizationId", java.util.UUID.randomUUID().toString());
            novuNotification.put("_subscriberId", userId);
            novuNotification.put("_feedId", java.util.UUID.randomUUID().toString());
            novuNotification.put("templateIdentifier", notificationType);
            novuNotification.put("content", createContentBasedOnType(notificationType, data));
            novuNotification.put("channel", "in_app");
            novuNotification.put("seen", false);
            novuNotification.put("read", false);
            novuNotification.put("status", "sent");
            novuNotification.put("createdAt", System.currentTimeMillis());
            novuNotification.put("payload", data);
            
            // Create a Socket.IO-like message format for the Novu notification
            String novuNotificationMessage = "42[\"received_notification\"," + objectMapper.writeValueAsString(novuNotification) + "]";
            
            // Log the current session-to-user mapping for debugging
            log.info("Current session-to-user mapping: {}", sessionToUserMap);
            
            // Send to sessions that match the target user ID
            int sessionCount = 0;
            boolean userFound = false;
            
            // First, try to find sessions specifically for this user
            for (Map.Entry<String, WebSocketSession> entry : sessions.entrySet()) {
                String sessionId = entry.getKey();
                WebSocketSession session = entry.getValue();
                
                // Check if this session belongs to the target user
                String sessionUserId = sessionToUserMap.get(sessionId);
                
                if (session.isOpen() && userId.equals(sessionUserId)) {
                    userFound = true;
                    log.info("Found matching session for user {}: {}", userId, sessionId);
                    
                    // Send both notification formats to ensure compatibility
                    session.sendMessage(new TextMessage(notificationMessage));
                    session.sendMessage(new TextMessage(novuNotificationMessage));
                    
                    // Also send an unseen count update specifically for this user
                    Map<String, Object> countUpdate = new HashMap<>();
                    countUpdate.put("unseenCount", 1); // Increment by 1 for the new notification
                    countUpdate.put("userId", userId);
                    
                    String unseenCountUpdate = "42[\"unseen_count_changed\"," + objectMapper.writeValueAsString(countUpdate) + "]";
                    session.sendMessage(new TextMessage(unseenCountUpdate));
                    
                    sessionCount++;
                }
            }
            
            // If no sessions were found for this user, store the notification for later delivery
            if (!userFound) {
                log.warn("No sessions found specifically for user {}. Storing notification for later delivery.", userId);
                
                // Store the notification in the pending queue
                pendingNotifications.computeIfAbsent(userId, k -> new ArrayList<>())
                    .add(novuNotification);
                
                log.info("Stored notification for user {} in pending queue. Total pending: {}", 
                        userId, pendingNotifications.getOrDefault(userId, Collections.emptyList()).size());
                
                // IMPORTANT: Since we're in development/testing mode, we'll also try to send to ALL sessions
                // This ensures notifications are visible during development
                for (WebSocketSession session : sessions.values()) {
                    if (session.isOpen()) {
                        log.info("Sending notification to fallback session: {} for user: {}", session.getId(), userId);
                        
                        try {
                            // First, associate this session with the user to ensure future notifications work
                            associateUserWithSession(session.getId(), userId);
                            
                            // Send both notification formats to ensure compatibility
                            session.sendMessage(new TextMessage(notificationMessage));
                            session.sendMessage(new TextMessage(novuNotificationMessage));
                            
                            // Send an unseen count update with a value greater than 0
                            Map<String, Object> countUpdate = new HashMap<>();
                            countUpdate.put("unseenCount", 1); // Increment by 1 for the new notification
                            countUpdate.put("userId", userId); // Add the user ID to the count update
                            
                            String unseenCountUpdate = "42[\"unseen_count_changed\"," + objectMapper.writeValueAsString(countUpdate) + "]";
                            session.sendMessage(new TextMessage(unseenCountUpdate));
                            
                            // Send a direct notification event that doesn't rely on user ID matching
                            String directNotification = "42[\"notification_received\",{\"notification\":" + 
                                objectMapper.writeValueAsString(novuNotification) + "}]";
                            session.sendMessage(new TextMessage(directNotification));
                            
                            // Also try the format that the frontend might be expecting
                            String alternativeNotification = "42[\"received_notification\",{\"notification\":" + 
                                objectMapper.writeValueAsString(novuNotification) + "}]";
                            session.sendMessage(new TextMessage(alternativeNotification));
                            
                            // Try another format with the notification directly in the payload
                            String directPayloadNotification = "42[\"received_notification\"," + 
                                objectMapper.writeValueAsString(novuNotification) + "]";
                            session.sendMessage(new TextMessage(directPayloadNotification));
                            
                            // Try yet another format with a different event name
                            String anotherFormat = "42[\"notification\"," + 
                                objectMapper.writeValueAsString(novuNotification) + "]";
                            session.sendMessage(new TextMessage(anotherFormat));
                            
                            // Send a simple notification with just the essential data
                            Map<String, Object> simpleNotification = new HashMap<>();
                            simpleNotification.put("_id", novuNotification.get("_id"));
                            simpleNotification.put("content", novuNotification.get("content"));
                            simpleNotification.put("seen", false);
                            simpleNotification.put("read", false);
                            
                            String simpleNotificationMessage = "42[\"notification\",{\"notification\":" + 
                                objectMapper.writeValueAsString(simpleNotification) + "}]";
                            session.sendMessage(new TextMessage(simpleNotificationMessage));
                            
                            sessionCount++;
                        } catch (Exception e) {
                            log.error("Error sending notification to session {}: {}", session.getId(), e.getMessage());
                        }
                    }
                }
            }
            
            log.info("Notification sent successfully to {} active sessions for user {}", sessionCount, userId);
        } catch (Exception e) {
            log.error("Failed to send notification: {}", e.getMessage(), e);
        }
    }
    

}