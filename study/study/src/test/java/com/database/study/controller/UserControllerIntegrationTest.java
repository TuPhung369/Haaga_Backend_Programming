package com.database.study.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.database.study.repository.UserRepository;
import com.database.study.dto.request.UserCreationRequest;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Testcontainers
public class UserControllerIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private UserRepository userRepository;

  @Container
  private static final MySQLContainer<?> mysqlContainer = new MySQLContainer<>("mysql:latest")
      .withDatabaseName("identify_service")
      .withUsername("root")
      .withPassword("root");

  static {
    mysqlContainer.start();
  }

  @AfterAll
  static void tearDown() {
    if (mysqlContainer != null) {
      mysqlContainer.stop();
    }
  }

  @BeforeEach
  void setUp() {
    // Clear the database before each test
    userRepository.deleteAll();
  }

  @Test
  void testDeleteUser() throws Exception {
    // Create a user first
    UserCreationRequest userRequest = new UserCreationRequest();
    userRequest.setUsername("testUser");
    userRequest.setPassword("password123");

    MvcResult result = mockMvc.perform(MockMvcRequestBuilders
        .post("/users")
        .contentType("application/json")
        .content(objectMapper.writeValueAsString(userRequest)))
        .andExpect(status().isOk())
        .andReturn();

    String responseContent = result.getResponse().getContentAsString();
    // Parse the JSON response to extract the user ID
    JsonNode jsonNode = objectMapper.readTree(responseContent);
    UUID userId = UUID.fromString(jsonNode.get("id").asText());

    // Now delete the user
    mockMvc.perform(MockMvcRequestBuilders
        .delete("/users/" + userId))
        .andExpect(status().isOk());

    // Verify the user is deleted
    assertFalse(userRepository.findById(userId).isPresent());
  }
}