package com.database.study.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 101) // Lower precedence than MockNovuWebSocketConfig
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry config) {
        // Enable a simple in-memory message broker with increased buffer sizes and heartbeat
        config.enableSimpleBroker("/topic", "/queue", "/user")
            .setTaskScheduler(taskScheduler())
            .setHeartbeatValue(new long[] {10000, 10000});
        
        // Set prefix for client-to-server messages
        config.setApplicationDestinationPrefixes("/app");
        
        // Enable user-specific messaging with the /user prefix
        config.setUserDestinationPrefix("/user");
    }
    
    @Bean
    public TaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(2);
        scheduler.setThreadNamePrefix("websocket-heartbeat-thread-");
        scheduler.initialize();
        return scheduler;
    }

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        // Register STOMP endpoints
        registry.addEndpoint("/ws-messaging")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // Enable SockJS fallback
    }
}
