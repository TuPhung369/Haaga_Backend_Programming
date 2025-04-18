package com.database.study.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.database.study.security.JwtTokenProvider;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthenticationConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Extract JWT token from headers
                    String token = extractTokenFromHeaders(accessor);
                    
                    if (token != null) {
                        try {
                            // Validate token and set authentication
                            Authentication auth = jwtTokenProvider.getAuthentication(token);
                            SecurityContextHolder.getContext().setAuthentication(auth);
                            accessor.setUser(auth);
                            log.info("WebSocket connection authenticated for user: {}", auth.getName());
                        } catch (Exception e) {
                            log.error("Invalid JWT token in WebSocket connection", e);
                        }
                    } else {
                        // Allow anonymous connections for now, but you can reject them if needed
                        log.warn("No JWT token found in WebSocket connection");
                    }
                }
                return message;
            }
            
            private String extractTokenFromHeaders(StompHeaderAccessor accessor) {
                // Try to get token from Authorization header
                String authorization = accessor.getFirstNativeHeader("Authorization");
                if (authorization != null && authorization.startsWith("Bearer ")) {
                    return authorization.substring(7);
                }
                
                // Try to get token from custom header
                String token = accessor.getFirstNativeHeader("X-Auth-Token");
                if (token != null) {
                    return token;
                }
                
                return null;
            }
        });
    }
}