package com.database.study.service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.database.study.entity.User;
import com.database.study.mock.MockNovuClient;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for handling notifications
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final MockNovuClient novuClient; // Mock Novu client

    /**
     * Ensure a user is registered as a subscriber in Novu
     */
    public void registerUserAsSubscriber(User user) {
        try {
            log.info("Registering user as subscriber: {}", user.getEmail());
            
            // Create a proper subscriber request object with all required fields
            Map<String, Object> subscriberRequest = new HashMap<>();
            subscriberRequest.put("subscriberId", user.getId().toString());
            subscriberRequest.put("email", user.getEmail());
            
            // Add name information if available
            if (user.getFirstname() != null) {
                subscriberRequest.put("firstName", user.getFirstname());
            }
            if (user.getLastname() != null) {
                subscriberRequest.put("lastName", user.getLastname());
            }
            
            // Add any additional data that might be useful
            Map<String, Object> data = new HashMap<>();
            data.put("username", user.getUsername());
            if (user.getUserStatus() != null) {
                data.put("status", user.getUserStatus());
            }
            subscriberRequest.put("data", data);
            
            // Use the novuClient to create the subscriber
            Object response = novuClient.createSubscriber(subscriberRequest);
            
            log.info("Successfully registered user as subscriber: {}, response: {}", user.getEmail(), response);
        } catch (Exception e) {
            log.error("Failed to register user as subscriber: {}", e.getMessage(), e);
            // If it contains "already exists" in the error message, the subscriber already exists
            if (e.getMessage() != null && e.getMessage().contains("already exists")) {
                log.info("Subscriber already exists for user: {}", user.getEmail());
            } else {
                throw new RuntimeException("Failed to register user as subscriber", e);
            }
        }
    }

    /**
     * Send a new message notification
     */
    public void sendNewMessageNotification(UUID senderId, UUID receiverId, String messageContent) {
        try {
            log.info("Sending new message notification from {} to {}", senderId, receiverId);
            
            // Create a preview of the message
            String preview = messageContent.length() > 50 
                ? messageContent.substring(0, 47) + "..." 
                : messageContent;
                
            log.info("Message preview: {}", preview);
            
            // Create a proper event request object with the necessary information
            Map<String, Object> eventRequest = new HashMap<>();
            eventRequest.put("name", "new-message"); // Event name in Novu
            
            // Add payload data
            Map<String, Object> payload = new HashMap<>();
            payload.put("senderId", senderId.toString());
            payload.put("messagePreview", preview);
            payload.put("timestamp", System.currentTimeMillis());
            
            // Add to and data fields
            eventRequest.put("to", receiverId.toString()); // Subscriber ID to send to
            eventRequest.put("payload", payload);
            
            // Use the novuClient to trigger the notification event
            Object response = novuClient.triggerEvent(eventRequest);
            
            log.info("Successfully sent new message notification to Novu, response: {}", response);
        } catch (Exception e) {
            log.error("Failed to send new message notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Send a contact request notification
     */
    public void sendContactRequestNotification(UUID requesterId, UUID receiverId) {
        try {
            log.info("Sending contact request notification from {} to {}", requesterId, receiverId);
            
            // Create a proper event request object with the necessary information
            Map<String, Object> eventRequest = new HashMap<>();
            eventRequest.put("name", "contact-request"); // Event name in Novu
            
            // Add payload data
            Map<String, Object> payload = new HashMap<>();
            payload.put("requesterId", requesterId.toString());
            payload.put("receiverId", receiverId.toString());
            
            // Add to and data fields
            eventRequest.put("to", receiverId.toString()); // Subscriber ID to send to
            eventRequest.put("payload", payload);
            
            // Use the novuClient to trigger the notification event
            novuClient.triggerEvent(eventRequest);
            
            log.info("Successfully sent contact request notification to Novu");
        } catch (Exception e) {
            log.error("Failed to send contact request notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Send a contact accepted notification
     */
    public void sendContactAcceptedNotification(UUID accepterId, UUID requesterId) {
        try {
            log.info("Sending contact accepted notification from {} to {}", accepterId, requesterId);
            
            // Create a proper event request object with the necessary information
            Map<String, Object> eventRequest = new HashMap<>();
            eventRequest.put("name", "contact-accepted"); // Event name in Novu
            
            // Add payload data
            Map<String, Object> payload = new HashMap<>();
            payload.put("accepterId", accepterId.toString());
            payload.put("requesterId", requesterId.toString());
            payload.put("timestamp", System.currentTimeMillis());
            
            // Add to and data fields
            eventRequest.put("to", requesterId.toString()); // Subscriber ID to send to
            eventRequest.put("payload", payload);
            
            // Use the novuClient to trigger the notification event
            Object response = novuClient.triggerEvent(eventRequest);
            
            log.info("Successfully sent contact accepted notification to Novu, response: {}", response);
        } catch (Exception e) {
            log.error("Failed to send contact accepted notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Create a topic for group messaging
     */
    public String createTopic(String topicName) {
        try {
            log.info("Creating topic: {}", topicName);
            
            // Create a simple topic request object
            Object topicRequest = new Object(); // In a real implementation, this would be a proper topic request
            
            // Use the novuClient to create the topic
            novuClient.createTopic(topicRequest);
            
            // Generate a topic key from the topic name
            String topicKey = topicName.toLowerCase().replace(" ", "-");
            log.info("Successfully created topic: {}", topicName);
            
            // Return the topic key
            return topicKey;
        } catch (Exception e) {
            log.error("Failed to create topic: {}", e.getMessage(), e);
            return "dummy-topic-key";
        }
    }

    /**
     * Add a subscriber to a topic
     */
    public void addSubscriberToTopic(String topicKey, UUID subscriberId) {
        try {
            log.info("Adding subscriber {} to topic {}", subscriberId, topicKey);
            
            // Create a simple subscriber request object
            Object subscriberRequest = new Object(); // In a real implementation, this would be a proper request object
            
            // Use the novuClient to add the subscriber to the topic
            novuClient.addSubscribersToTopic(subscriberRequest, topicKey);
            
            log.info("Successfully added subscriber to topic");
        } catch (Exception e) {
            log.error("Failed to add subscriber to topic: {}", e.getMessage(), e);
        }
    }

    /**
     * Remove a subscriber from a topic
     */
    public void removeSubscriberFromTopic(String topicKey, UUID subscriberId) {
        try {
            log.info("Removing subscriber {} from topic {}", subscriberId, topicKey);
            
            // Create a simple subscriber request object
            Object subscriberRequest = new Object(); // In a real implementation, this would be a proper request object
            
            // Use the novuClient to remove the subscriber from the topic
            novuClient.removeSubscribersFromTopic(subscriberRequest, topicKey);
            
            log.info("Successfully removed subscriber from topic");
        } catch (Exception e) {
            log.error("Failed to remove subscriber from topic: {}", e.getMessage(), e);
        }
    }
}
