package com.database.study.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class WebConfig implements WebMvcConfigurer {

  @Bean
  public ObjectMapper objectMapper() {
    ObjectMapper mapper = new ObjectMapper();
    // Configure Jackson to ignore unknown properties to handle extra fields from
    // frontend
    mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    // Register Java 8 date/time module to handle LocalDate, LocalDateTime, etc.
    mapper.registerModule(new JavaTimeModule());
    return mapper;
  }
  
  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // Add resource handlers for static resources
    registry.addResourceHandler("/**")
            .addResourceLocations("classpath:/static/");
    
    log.info("Resource handlers configured for static resources");
  }
}