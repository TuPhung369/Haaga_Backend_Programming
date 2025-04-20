package com.database.study.mock;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Configuration for mock Novu WebSocket server
 * This allows the frontend to connect to our mock WebSocket endpoint instead of the real Novu service
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE + 98) // Higher precedence than WebSocketAuthenticationConfig
public class MockNovuWebSocketConfig implements WebSocketConfigurer {

    private final MockNovuWebSocketHandler mockNovuWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Register the mock Novu WebSocket handler at the same path that the frontend expects
        // First register the handler for raw WebSocket connections at both paths
        registry.addHandler(mockNovuWebSocketHandler, "/socket.io/*")
               .setAllowedOriginPatterns("*"); // Use patterns instead of origins
        
        registry.addHandler(mockNovuWebSocketHandler, "/identify_service/socket.io/*")
               .setAllowedOriginPatterns("*"); // Use patterns instead of origins
        
        // Then register the same handler with SockJS support at both paths
        registry.addHandler(mockNovuWebSocketHandler, "/socket.io")
               .setAllowedOriginPatterns("*")
               .withSockJS(); // Add SockJS support for better compatibility
        
        registry.addHandler(mockNovuWebSocketHandler, "/identify_service/socket.io")
               .setAllowedOriginPatterns("*")
               .withSockJS(); // Add SockJS support for better compatibility
        
        log.info("Registered mock Novu WebSocket handler at /socket.io/* and /identify_service/socket.io/* with handler: {}", 
                mockNovuWebSocketHandler.getClass().getSimpleName());
        log.info("Both raw WebSocket and SockJS endpoints are available at both paths");
    }
}