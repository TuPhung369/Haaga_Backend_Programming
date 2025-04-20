package com.database.study.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.database.study.mock.MockNovuClient;
import com.database.study.mock.MockNovuWebSocketHandler;

import lombok.extern.slf4j.Slf4j;

/**
 * Configuration for Novu notification service
 */
@Configuration
@Slf4j
public class NovuConfig {

    @Value("${novu.api-key}")
    private String apiKey;
    
    @Value("${novu.app-id:uWb0H0wlJgOP}")
    private String appId;
    
    @Value("${novu.base-url:https://api.novu.co/v1}")
    private String baseUrl;
    
    /**
     * Create a mock Novu WebSocket handler bean
     * @return The mock Novu WebSocket handler
     */
    @Bean
    public MockNovuWebSocketHandler mockNovuWebSocketHandler() {
        log.info("Creating mock Novu WebSocket handler");
        MockNovuWebSocketHandler handler = new MockNovuWebSocketHandler();
        log.info("Mock Novu WebSocket handler created successfully: {}", handler != null);
        return handler;
    }
    
    /**
     * Create a mock Novu client bean with WebSocket handler
     * @param webSocketHandler The WebSocket handler to use
     * @param applicationContext The Spring ApplicationContext
     * @return The mock Novu client
     */
    @Bean
    public MockNovuClient mockNovuClient(MockNovuWebSocketHandler webSocketHandler, ApplicationContext applicationContext) {
        log.info("Creating mock Novu client with API key: {}, app ID: {} and WebSocket handler", 
                maskApiKey(apiKey), appId);
        
        // Ensure the WebSocket handler is not null
        if (webSocketHandler == null) {
            log.warn("WebSocket handler is null, creating a new one");
            webSocketHandler = new MockNovuWebSocketHandler();
        }
        
        // Use the constructor that takes all parameters
        MockNovuClient client = new MockNovuClient(apiKey, applicationContext, webSocketHandler);
        log.info("Mock Novu client created successfully: {}", client != null);
        return client;
    }
    
    /**
     * Mask the API key for logging
     * @param key The API key to mask
     * @return The masked API key
     */
    private String maskApiKey(String key) {
        if (key == null || key.length() < 8) {
            return "****";
        }
        return key.substring(0, 4) + "..." + key.substring(key.length() - 4);
    }
}