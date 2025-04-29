package com.database.study.config;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

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
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
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
                        // Allow anonymous connections but log a warning
                        log.warn("No JWT token found in WebSocket connection");
                        // Set a default anonymous authentication to prevent NullPointerException
                        Authentication anonymousAuth = createAnonymousAuthentication();
                        SecurityContextHolder.getContext().setAuthentication(anonymousAuth);
                        accessor.setUser(anonymousAuth);
                        log.info("Set anonymous authentication for WebSocket connection");
                    }
                }
                return message;
            }

            private String extractTokenFromHeaders(StompHeaderAccessor accessor) {
                // Try to get token from Authorization header
                String authorization = accessor.getFirstNativeHeader("Authorization");
                if (authorization != null) {
                    if (authorization.startsWith("Bearer ")) {
                        log.info("Found token in Authorization header with Bearer prefix");
                        return authorization.substring(7);
                    } else {
                        // Some clients might send the token without the Bearer prefix
                        log.info("Found token in Authorization header without Bearer prefix");
                        return authorization;
                    }
                }

                // Try to get token from custom header
                String token = accessor.getFirstNativeHeader("X-Auth-Token");
                if (token != null) {
                    log.info("Found token in X-Auth-Token header");
                    return token;
                }

                // Try to get token from access_token header (common in WebSocket connections)
                String accessToken = accessor.getFirstNativeHeader("access_token");
                if (accessToken != null) {
                    log.info("Found token in access_token header");
                    return accessToken;
                }

                // Try to get token from session attributes
                Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                if (sessionAttributes != null) {
                    Object tokenAttr = sessionAttributes.get("token");
                    if (tokenAttr != null) {
                        log.info("Found token in session attributes");
                        return tokenAttr.toString();
                    }
                }

                // Log all headers for debugging
                log.info("WebSocket connection headers (token not found):");
                // Use getMessageHeaders() instead of getNativeHeaders() which is protected
                accessor.getMessageHeaders().forEach((key, value) -> {
                    log.info("Header: {} = {}", key, value);
                });
                log.info("Session ID: {}", accessor.getSessionId());

                return null;
            }

            /**
             * Creates an anonymous authentication object for WebSocket connections without
             * JWT tokens
             * 
             * @return An Authentication object for anonymous users
             */
            private Authentication createAnonymousAuthentication() {
                return new Authentication() {
                    @Override
                    public Collection<? extends GrantedAuthority> getAuthorities() {
                        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_ANONYMOUS"));
                    }

                    @Override
                    public Object getCredentials() {
                        return null;
                    }

                    @Override
                    public Object getDetails() {
                        return null;
                    }

                    @Override
                    public Object getPrincipal() {
                        return "anonymous";
                    }

                    @Override
                    public boolean isAuthenticated() {
                        return true;
                    }

                    @Override
                    public void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException {
                        // Cannot change authentication status
                    }

                    @Override
                    public String getName() {
                        return "anonymous";
                    }
                };
            }
        });
    }
}