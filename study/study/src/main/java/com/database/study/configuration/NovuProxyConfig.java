package com.database.study.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import lombok.extern.slf4j.Slf4j;

/**
 * Configuration for Novu API proxy
 * This allows us to intercept and redirect Novu API requests to our mock implementation
 */
@Configuration
@Slf4j
public class NovuProxyConfig {

    /**
     * Configure CORS for the Novu API proxy
     * @return WebMvcConfigurer
     */
    @Bean
    public WebMvcConfigurer novuCorsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // Allow CORS for the Novu API proxy
                registry.addMapping("/api/mock-novu/**")
                        .allowedOriginPatterns("*") // Use patterns instead of origins
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true) // Allow credentials
                        .maxAge(3600);
                
                log.info("CORS configured for Novu API proxy");
            }
        };
    }
}