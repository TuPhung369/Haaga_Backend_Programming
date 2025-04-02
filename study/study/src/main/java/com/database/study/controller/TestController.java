package com.database.study.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Simple test controller to verify Spring Boot is processing requests correctly
 */
@RestController
public class TestController {

  private static final Logger logger = LoggerFactory.getLogger(TestController.class);

  @GetMapping("/test")
  public Map<String, String> test() {
    logger.info("Test endpoint called");

    Map<String, String> response = new HashMap<>();
    response.put("status", "success");
    response.put("message", "Spring Boot controller is working");

    return response;
  }
}