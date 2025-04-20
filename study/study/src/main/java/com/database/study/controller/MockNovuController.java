package com.database.study.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.database.study.mock.MockNovuClient;
import com.database.study.mock.MockNovuWebSocketHandler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Controller to handle Novu API requests from the frontend
 * This allows us to intercept and mock the Novu API responses
 */
@RestController
@RequestMapping("/api/mock-novu")
@RequiredArgsConstructor
@Slf4j
public class MockNovuController {

    private final MockNovuClient novuClient;
    private final MockNovuWebSocketHandler mockNovuWebSocketHandler;
    
    /**
     * Get notifications for a user
     * @param subscriberId The subscriber ID
     * @return A list of notifications
     */
    @GetMapping("/notifications/{subscriberId}")
    public ResponseEntity<Map<String, Object>> getNotifications(@PathVariable String subscriberId) {
        log.info("Getting notifications for subscriber: {}", subscriberId);
        
        // Create a mock response with empty notifications
        Map<String, Object> response = new HashMap<>();
        response.put("data", new HashMap<String, Object>() {{
            put("page", 0);
            put("totalCount", 0);
            put("pageSize", 10);
            put("data", new Object[0]); // Empty array of notifications
        }});
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get the unseen count for a user
     * @param subscriberId The subscriber ID
     * @return The unseen count
     */
    @GetMapping("/notifications/unseen/{subscriberId}")
    public ResponseEntity<Map<String, Object>> getUnseenCount(@PathVariable String subscriberId) {
        log.info("Getting unseen count for subscriber: {}", subscriberId);
        
        // Create a mock response with zero unseen count
        Map<String, Object> response = new HashMap<>();
        response.put("data", new HashMap<String, Object>() {{
            put("count", 0);
        }});
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Mark a notification as read
     * @param subscriberId The subscriber ID
     * @param notificationId The notification ID
     * @return Success response
     */
    @PostMapping("/notifications/{notificationId}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable String notificationId,
            @RequestBody Map<String, Object> request) {
        
        String subscriberId = (String) request.get("subscriberId");
        log.info("Marking notification {} as read for subscriber: {}", notificationId, subscriberId);
        
        // Create a mock success response
        Map<String, Object> response = new HashMap<>();
        response.put("data", true);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Mark all notifications as read
     * @param subscriberId The subscriber ID
     * @return Success response
     */
    @PostMapping("/notifications/read")
    public ResponseEntity<Map<String, Object>> markAllAsRead(@RequestBody Map<String, Object> request) {
        String subscriberId = (String) request.get("subscriberId");
        log.info("Marking all notifications as read for subscriber: {}", subscriberId);
        
        // Create a mock success response
        Map<String, Object> response = new HashMap<>();
        response.put("data", true);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Create a subscriber
     * @param request The subscriber request
     * @return The created subscriber
     */
    @PostMapping("/subscribers")
    public ResponseEntity<Map<String, Object>> createSubscriber(@RequestBody Map<String, Object> request) {
        log.info("Creating subscriber: {}", request.get("subscriberId"));
        
        // Use the mock client to create the subscriber
        Object result = novuClient.createSubscriber(request);
        
        // Return the result
        return ResponseEntity.ok((Map<String, Object>) result);
    }
    
    /**
     * Trigger an event
     * @param request The event request
     * @return Success response
     */
    @PostMapping("/events/trigger")
    public ResponseEntity<Map<String, Object>> triggerEvent(@RequestBody Map<String, Object> request) {
        log.info("Triggering event: {}", request.get("name"));
        
        // Use the mock client to trigger the event
        Object result = novuClient.triggerEvent(request);
        
        // Return the result
        return ResponseEntity.ok((Map<String, Object>) result);
    }
    
    /**
     * Trigger a notification for a specific user
     * This is a testing endpoint that directly uses the WebSocket handler
     * 
     * @param userId The user ID to send the notification to
     * @param payload The notification payload
     * @return A response indicating success or failure
     */
    @PostMapping("/test/notify/{userId}")
    public ResponseEntity<Map<String, Object>> triggerNotification(
            @PathVariable String userId,
            @RequestBody Map<String, Object> payload) {
        
        log.info("Manually triggering notification for user {}: {}", userId, payload);
        
        try {
            // Extract notification type from payload or use default
            String notificationType = payload.containsKey("notificationType") 
                ? payload.get("notificationType").toString() 
                : (payload.containsKey("type") ? payload.get("type").toString() : "contact-request");
            
            // Extract payload data
            Map<String, Object> notificationData;
            if (payload.containsKey("payload") && payload.get("payload") instanceof Map) {
                notificationData = new HashMap<>((Map<String, Object>) payload.get("payload"));
            } else {
                // Create a copy of the payload without the type field
                notificationData = new HashMap<>(payload);
                notificationData.remove("type");
                notificationData.remove("notificationType");
            }
            
            // Add some default fields if they don't exist
            if (!notificationData.containsKey("timestamp")) {
                notificationData.put("timestamp", System.currentTimeMillis());
            }
            
            // For contact request notifications
            if (notificationType.equals("contact-request") && !notificationData.containsKey("requesterId")) {
                notificationData.put("requesterId", UUID.randomUUID().toString());
            }
            
            // For new message notifications
            if (notificationType.equals("new-message") && !notificationData.containsKey("senderId")) {
                notificationData.put("senderId", UUID.randomUUID().toString());
            }
            
            // For contact accepted notifications
            if (notificationType.equals("contact-accepted") && !notificationData.containsKey("accepterId")) {
                notificationData.put("accepterId", UUID.randomUUID().toString());
            }
            
            log.info("Sending notification of type {} to user {} with data: {}", 
                    notificationType, userId, notificationData);
            
            // Send the notification
            mockNovuWebSocketHandler.sendNotification(userId, notificationType, notificationData);
            
            // Return success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Notification triggered for user: " + userId);
            response.put("notificationType", notificationType);
            response.put("payload", notificationData);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error triggering notification: {}", e.getMessage(), e);
            
            // Return error response
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error triggering notification: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Get information about active WebSocket sessions
     * This is a testing endpoint that directly uses the WebSocket handler
     * 
     * @return A response with information about active sessions
     */
    @GetMapping("/test/sessions")
    public ResponseEntity<Map<String, Object>> getSessionInfo() {
        log.info("Getting WebSocket session information");
        
        try {
            // Get session information from the WebSocket handler
            Map<String, Object> sessionInfo = mockNovuWebSocketHandler.getSessionInfo();
            
            // Return success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", sessionInfo);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting session information: {}", e.getMessage(), e);
            
            // Return error response
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error getting session information: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Broadcast a notification to all active sessions
     * This is a testing endpoint that directly uses the WebSocket handler
     * 
     * @param payload The notification payload
     * @return A response indicating success or failure
     */
    @PostMapping("/test/broadcast")
    public ResponseEntity<Map<String, Object>> broadcastNotification(
            @RequestBody Map<String, Object> payload) {
        
        log.info("Manually broadcasting notification: {}", payload);
        
        try {
            // Extract notification type from payload or use default
            String notificationType = payload.containsKey("type") 
                ? payload.get("type").toString() 
                : "contact-request";
            
            // Create a copy of the payload without the type field
            Map<String, Object> notificationData = new HashMap<>(payload);
            notificationData.remove("type");
            
            // Broadcast the notification
            mockNovuWebSocketHandler.broadcastNotification(notificationType, notificationData);
            
            // Return success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Notification broadcast to all active sessions");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error broadcasting notification: {}", e.getMessage(), e);
            
            // Return error response
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error broadcasting notification: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Health check endpoint for the mock Novu API
     * @return A response indicating the service is healthy
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        log.info("Health check request received for mock Novu API");
        
        // Create a success response
        Map<String, Object> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("service", "mock-novu");
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Debug endpoint to manually associate a user with a session
     * This is useful for testing when the automatic association fails
     * 
     * @param userId The user ID to associate
     * @param sessionId The session ID to associate with the user
     * @return A response indicating success or failure
     */
    @PostMapping("/debug/associate-user")
    public ResponseEntity<Map<String, Object>> associateUserWithSession(
            @RequestBody Map<String, String> request) {
        
        String userId = request.get("userId");
        String sessionId = request.get("sessionId");
        
        log.info("Manually associating user {} with session {}", userId, sessionId);
        
        try {
            if (userId == null || userId.isEmpty()) {
                throw new IllegalArgumentException("userId is required");
            }
            
            // If no sessionId is provided, associate with all active sessions
            if (sessionId == null || sessionId.isEmpty()) {
                log.info("No sessionId provided, associating user with all active sessions");
                
                // Get all active sessions
                Map<String, Object> sessionInfo = mockNovuWebSocketHandler.getSessionInfo();
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> sessions = (List<Map<String, Object>>) sessionInfo.get("sessions");
                
                if (sessions == null || sessions.isEmpty()) {
                    throw new IllegalStateException("No active sessions found");
                }
                
                // Associate user with all sessions
                for (Map<String, Object> session : sessions) {
                    String sessionId = (String) session.get("id");
                    mockNovuWebSocketHandler.associateUserWithSession(sessionId, userId);
                    log.info("Associated user {} with session {}", userId, sessionId);
                }
                
                // Return success response
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "User associated with all active sessions");
                response.put("userId", userId);
                response.put("sessionCount", sessions.size());
                return ResponseEntity.ok(response);
            } else {
                // Associate user with specific session
                mockNovuWebSocketHandler.associateUserWithSession(sessionId, userId);
                
                // Return success response
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "User associated with session");
                response.put("userId", userId);
                response.put("sessionId", sessionId);
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            log.error("Error associating user with session: {}", e.getMessage(), e);
            
            // Return error response
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error associating user with session: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Debug endpoint to manually send a notification to a user
     * This is useful for testing when the automatic notification fails
     * 
     * @param request The request containing userId and message
     * @return A response indicating success or failure
     */
    @PostMapping("/debug/send-notification")
    public ResponseEntity<Map<String, Object>> sendDebugNotification(
            @RequestBody Map<String, Object> request) {
        
        String userId = (String) request.get("userId");
        String message = (String) request.get("message");
        
        log.info("Manually sending debug notification to user {}: {}", userId, message);
        
        try {
            if (userId == null || userId.isEmpty()) {
                throw new IllegalArgumentException("userId is required");
            }
            
            // Create notification data
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("message", message != null ? message : "Debug notification");
            notificationData.put("timestamp", System.currentTimeMillis());
            notificationData.put("debug", true);
            
            // Send the notification
            mockNovuWebSocketHandler.sendNotification(userId, "debug-notification", notificationData);
            
            // Return success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Debug notification sent");
            response.put("userId", userId);
            response.put("notificationData", notificationData);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error sending debug notification: {}", e.getMessage(), e);
            
            // Return error response
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error sending debug notification: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Debug endpoint to create a mock WebSocket session for testing
     * This is useful when the client can't establish a WebSocket connection
     * 
     * @param request The request containing userId
     * @return A response indicating success or failure
     */
    @PostMapping("/debug/create-session")
    public ResponseEntity<Map<String, Object>> createMockSession(
            @RequestBody Map<String, String> request) {
        
        String userId = request.get("userId");
        
        log.info("Creating mock WebSocket session for user: {}", userId);
        
        try {
            if (userId == null || userId.isEmpty()) {
                throw new IllegalArgumentException("userId is required");
            }
            
            // Create a mock session ID
            String sessionId = "mock-session-" + System.currentTimeMillis();
            
            // Create a mock session in the handler
            mockNovuWebSocketHandler.createMockSession(sessionId, userId);
            
            // Add any pending notifications for this user to the session
            mockNovuWebSocketHandler.deliverPendingNotifications(userId);
            
            // Return success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Mock session created");
            response.put("userId", userId);
            response.put("sessionId", sessionId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating mock session: {}", e.getMessage(), e);
            
            // Return error response
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error creating mock session: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}