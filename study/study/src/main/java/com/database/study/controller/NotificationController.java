package com.database.study.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.database.study.entity.User;
import com.database.study.repository.UserRepository;
import com.database.study.security.UserPrincipal;
import com.database.study.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    /**
     * Register the current user as a subscriber in Novu
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> registerCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            UUID userId = UUID.fromString(userPrincipal.getId());
            // Get the user entity directly from the repository
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            notificationService.registerUserAsSubscriber(user);
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "User registered as subscriber");
            response.put("subscriberId", userId.toString());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error registering user as subscriber", e);
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Failed to register user as subscriber: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get the subscriber ID for the current user
     */
    @GetMapping("/subscriber-id")
    public ResponseEntity<Map<String, String>> getSubscriberId(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        Map<String, String> response = new HashMap<>();
        response.put("subscriberId", userPrincipal.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * Test sending a notification
     */
    @PostMapping("/test")
    public ResponseEntity<Map<String, String>> testNotification(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            UUID userId = UUID.fromString(userPrincipal.getId());
            notificationService.sendNewMessageNotification(
                UUID.randomUUID(), // Fake sender ID
                userId,
                "This is a test notification message!"
            );
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Test notification sent");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error sending test notification", e);
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Failed to send test notification: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Send a custom notification
     */
    @PostMapping("/send")
    public ResponseEntity<Map<String, String>> sendCustomNotification(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, String> request) {
        try {
            UUID userId = UUID.fromString(userPrincipal.getId());
            String templateName = request.getOrDefault("template", "new-message");
            String message = request.getOrDefault("message", "Custom notification message");
            
            // Use appropriate service method based on template
            switch (templateName) {
                case "new-message" -> notificationService.sendNewMessageNotification(
                    userId, // Sender ID (self)
                    userId, // Receiver ID (self for testing)
                    message
                );
                case "contact-request" -> notificationService.sendContactRequestNotification(
                    userId, // Requester ID (self)
                    userId  // Receiver ID (self for testing)
                );
                case "contact-accepted" -> notificationService.sendContactAcceptedNotification(
                    userId, // Accepter ID (self)
                    userId  // Requester ID (self for testing)
                );
                default -> notificationService.sendNewMessageNotification(
                    userId,
                    userId,
                    message
                );
            }
            
            // Create a transaction ID for tracking
            String transactionId = UUID.randomUUID().toString();
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Custom notification sent");
            response.put("transactionId", transactionId);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error sending custom notification", e);
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Failed to send custom notification: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Send a contact request notification
     */
    @PostMapping("/contact-request/{receiverId}")
    public ResponseEntity<Map<String, String>> sendContactRequest(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String receiverId) {
        try {
            UUID requesterId = UUID.fromString(userPrincipal.getId());
            UUID receiverUuid = UUID.fromString(receiverId);
            
            notificationService.sendContactRequestNotification(requesterId, receiverUuid);
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Contact request notification sent");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error sending contact request notification", e);
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Failed to send contact request notification: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Send a contact accepted notification
     */
    @PostMapping("/contact-accepted/{requesterId}")
    public ResponseEntity<Map<String, String>> sendContactAccepted(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String requesterId) {
        try {
            UUID accepterId = UUID.fromString(userPrincipal.getId());
            UUID requesterUuid = UUID.fromString(requesterId);
            
            notificationService.sendContactAcceptedNotification(accepterId, requesterUuid);
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Contact accepted notification sent");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error sending contact accepted notification", e);
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Failed to send contact accepted notification: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Debug endpoint to manually send a notification to a specific user
     * This endpoint doesn't require authentication for testing purposes
     */
    @PostMapping("/debug/send/{userId}")
    public ResponseEntity<Map<String, Object>> debugSendNotification(
            @PathVariable String userId,
            @RequestBody Map<String, Object> payload) {
        try {
            log.info("Debug notification request received for user: {}", userId);
            log.info("Payload: {}", payload);
            
            UUID receiverId = UUID.fromString(userId);
            UUID senderId = UUID.randomUUID(); // Generate a random sender ID
            
            // Extract message content from payload or use default
            String messageContent = payload.containsKey("message") 
                ? payload.get("message").toString() 
                : "Debug notification message";
                
            // Send the notification
            notificationService.sendNewMessageNotification(senderId, receiverId, messageContent);
            
            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Debug notification sent");
            response.put("details", Map.of(
                "receiverId", receiverId.toString(),
                "senderId", senderId.toString(),
                "content", messageContent
            ));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error sending debug notification", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Failed to send debug notification: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
}