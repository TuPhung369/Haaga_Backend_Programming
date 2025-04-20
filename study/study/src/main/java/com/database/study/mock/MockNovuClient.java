package com.database.study.mock;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;

import lombok.extern.slf4j.Slf4j;

/**
 * Mock implementation of the Novu client for development and testing
 */
@Slf4j
public class MockNovuClient {

    private final String apiKey;
    private final ApplicationContext applicationContext;
    
    private MockNovuWebSocketHandler webSocketHandler;
    
    /**
     * Constructor with API key and ApplicationContext
     * @param apiKey The Novu API key
     * @param applicationContext The Spring ApplicationContext
     */
    public MockNovuClient(String apiKey, ApplicationContext applicationContext) {
        this.apiKey = apiKey;
        this.applicationContext = applicationContext;
        log.info("MockNovuClient initialized with API key: {}", maskApiKey(apiKey));
    }
    
    /**
     * Constructor with API key, ApplicationContext, and WebSocket handler
     * @param apiKey The Novu API key
     * @param applicationContext The Spring ApplicationContext
     * @param webSocketHandler The WebSocket handler to use
     */
    public MockNovuClient(String apiKey, ApplicationContext applicationContext, MockNovuWebSocketHandler webSocketHandler) {
        this.apiKey = apiKey;
        this.applicationContext = applicationContext;
        this.webSocketHandler = webSocketHandler;
        log.info("MockNovuClient initialized with API key: {} and WebSocket handler: {}", 
                maskApiKey(apiKey), webSocketHandler != null);
    }
    
    /**
     * Set the WebSocket handler
     * @param webSocketHandler The WebSocket handler to use
     */
    public void setWebSocketHandler(MockNovuWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
        log.info("WebSocket handler set: {}", webSocketHandler != null);
    }
    
    /**
     * Masks the API key for logging purposes
     * @param key The API key to mask
     * @return The masked API key
     */
    private String maskApiKey(String key) {
        if (key == null || key.length() < 8) {
            return "***";
        }
        return key.substring(0, 4) + "..." + key.substring(key.length() - 4);
    }

    /**
     * Mock method to create a subscriber
     * @param request The subscriber request
     * @return A mock response
     */
    public Object createSubscriber(Object request) {
        log.info("Mock: Creating subscriber using API key: {}", maskApiKey(apiKey));
        
        // Log the subscriber details for debugging
        if (request instanceof Map) {
            Map<String, Object> subscriberMap = (Map<String, Object>) request;
            log.info("Subscriber ID: {}", subscriberMap.get("subscriberId"));
            log.info("Subscriber email: {}", subscriberMap.get("email"));
            log.info("Subscriber first name: {}", subscriberMap.get("firstName"));
            log.info("Subscriber last name: {}", subscriberMap.get("lastName"));
            
            // In a real implementation, this would make an HTTP request to Novu API
            // For now, we'll just log that we would be making the request
            log.info("Would send HTTP POST request to Novu API at: https://api.novu.co/v1/subscribers");
        } else {
            log.warn("Subscriber object is not a Map, cannot extract details: {}", request);
        }
        
        // Create a mock response that mimics a successful Novu API response
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("acknowledged", true);
        
        // Add a mock subscriber object to the response
        Map<String, Object> subscriberData = new HashMap<>();
        subscriberData.put("_id", UUID.randomUUID().toString());
        subscriberData.put("isActive", true);
        
        response.put("data", subscriberData);
        
        return response;
    }
    
    /**
     * Mock method to trigger an event
     * @param event The event request
     * @return A mock response
     */
    public Object triggerEvent(Object event) {
        log.info("Mock: Triggering event using API key: {}", maskApiKey(apiKey));
        
        // Log the event details for debugging
        if (event instanceof Map) {
            Map<String, Object> eventMap = (Map<String, Object>) event;
            String eventName = (String) eventMap.get("name");
            String subscriberId = (String) eventMap.get("to");
            
            log.info("Event name: {}", eventName);
            log.info("Event to: {}", subscriberId);
            
            // Log payload if present
            Map<String, Object> payload = null;
            if (eventMap.containsKey("payload")) {
                payload = (Map<String, Object>) eventMap.get("payload");
                log.info("Event payload: {}", payload);
            }
            
            // In a real implementation, this would make an HTTP request to Novu API
            // For now, we'll just log that we would be making the request
            log.info("Would send HTTP POST request to Novu API at: https://api.novu.co/v1/events/trigger");
            
            // Ensure we have a WebSocket handler
            if (webSocketHandler == null) {
                log.info("WebSocket handler is null, trying to get it from ApplicationContext");
                try {
                    webSocketHandler = applicationContext.getBean(MockNovuWebSocketHandler.class);
                    log.info("Successfully retrieved WebSocket handler from ApplicationContext: {}", 
                            webSocketHandler != null);
                } catch (Exception e) {
                    log.error("Failed to get WebSocket handler from ApplicationContext: {}", e.getMessage());
                }
            }
            
            // If we have a WebSocket handler, send the notification through it
            if (webSocketHandler != null && subscriberId != null && eventName != null) {
                log.info("Sending notification through WebSocket handler: {}", webSocketHandler.getClass().getSimpleName());
                try {
                    webSocketHandler.sendNotification(subscriberId, eventName, payload != null ? payload : new HashMap<>());
                    log.info("Successfully sent notification through WebSocket handler");
                } catch (Exception e) {
                    log.error("Error sending notification through WebSocket handler: {}", e.getMessage(), e);
                }
            } else {
                log.error("WebSocket handler not available or missing required fields, skipping WebSocket notification");
                log.error("WebSocketHandler: {}, subscriberId: {}, eventName: {}", 
                        webSocketHandler != null ? webSocketHandler.getClass().getSimpleName() : "null", 
                        subscriberId, 
                        eventName);
                
                // If the WebSocket handler is still null, try to create one and use it
                if (webSocketHandler == null && subscriberId != null && eventName != null) {
                    log.info("Creating a new WebSocket handler to send notification");
                    MockNovuWebSocketHandler tempHandler = new MockNovuWebSocketHandler();
                    try {
                        tempHandler.sendNotification(subscriberId, eventName, payload != null ? payload : new HashMap<>());
                        log.info("Successfully sent notification through temporary WebSocket handler");
                    } catch (Exception e) {
                        log.error("Error sending notification through temporary WebSocket handler: {}", e.getMessage(), e);
                    }
                }
            }
        } else {
            log.warn("Event object is not a Map, cannot extract details: {}", event);
        }
        
        // Create a mock response that mimics a successful Novu API response
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("acknowledged", true);
        response.put("transactionId", UUID.randomUUID().toString());
        
        return response;
    }
    
    /**
     * Mock method to create a topic
     * @param topicRequest The topic request
     * @return A mock response
     */
    public Object createTopic(Object topicRequest) {
        log.info("Mock: Creating topic using API key: {}", maskApiKey(apiKey));
        return new Object();
    }
    
    /**
     * Mock method to add subscribers to a topic
     * @param request The subscriber addition request
     * @param topicKey The topic key
     * @return A mock response
     */
    public Object addSubscribersToTopic(Object request, String topicKey) {
        log.info("Mock: Adding subscribers to topic: {} using API key: {}", topicKey, maskApiKey(apiKey));
        return new Object();
    }
    
    /**
     * Mock method to remove subscribers from a topic
     * @param request The subscriber removal request
     * @param topicKey The topic key
     * @return A mock response
     */
    public Object removeSubscribersFromTopic(Object request, String topicKey) {
        log.info("Mock: Removing subscribers from topic: {} using API key: {}", topicKey, maskApiKey(apiKey));
        return new Object();
    }
}