package com.database.study.configuration;

import java.io.IOException;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

/**
 * CORS filter for WebSocket connections
 * This allows the frontend to connect to our WebSocket endpoint
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class WebSocketCorsFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        // Check if this is a WebSocket request
        if (request.getRequestURI().contains("/socket.io")) {
            log.debug("WebSocket request detected: {}", request.getRequestURI());
            
            // Add CORS headers - use the specific origin instead of wildcard
            String origin = request.getHeader("Origin");
            if (origin != null) {
                response.setHeader("Access-Control-Allow-Origin", origin);
            } else {
                // Fallback to localhost if no origin is provided
                response.setHeader("Access-Control-Allow-Origin", "http://localhost:9095");
            }
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "*");
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Access-Control-Max-Age", "3600");
            
            // Handle preflight requests
            if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                response.setStatus(HttpServletResponse.SC_OK);
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }
}