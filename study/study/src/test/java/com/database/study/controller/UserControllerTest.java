package com.database.study.controller;

import org.springframework.boot.test.context.SpringBootTest;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import com.database.study.service.UserService;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.dto.response.UserResponse;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import lombok.extern.slf4j.Slf4j;
import org.mockito.Mockito;

import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import java.util.List;

@Slf4j
@SpringBootTest
@AutoConfigureMockMvc
public class UserControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private UserService userService;

  private UserCreationRequest userCreationRequest;
  private UserResponse userResponse;
  private LocalDate dob;

  @BeforeEach
  void initData() {
    dob = LocalDate.of(1990, 1, 1);
    userCreationRequest = UserCreationRequest.builder()
        .username("testAminTest")
        .password("testThanhcong6(")
        .firstname("Tom test")
        .lastname("Jerry test")
        .dob(dob)
        .roles(List.of("ADMIN"))
        .build();

    userResponse = UserResponse.builder()
        .id(UUID.fromString("23e4567-e89b-12d3-a456-426614174000"))
        .username("testAminTest")
        .firstname("Tom test")
        .lastname("Jerry test")
        .dob(dob)
        .build();
  }

  @Test
  void createUser_validRequest_success() throws Exception {
    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
    String content = objectMapper.writeValueAsString(userCreationRequest);
    Mockito.when(userService.createUser(userCreationRequest)).thenReturn(userResponse);
    mockMvc.perform(MockMvcRequestBuilders
        .post("/users")
        .contentType(MediaType.APPLICATION_JSON_VALUE)
        .content(content))
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.jsonPath("code").value(2000));
  }

  @Test
  void createUser_usernameInvalid_fail() throws Exception {
    userCreationRequest.setUsername("test");
    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
    String content = objectMapper.writeValueAsString(userCreationRequest);

    mockMvc.perform(MockMvcRequestBuilders
        .post("/users")
        .contentType(MediaType.APPLICATION_JSON_VALUE)
        .content(content))
        .andExpect(MockMvcResultMatchers.status().isBadRequest())
        .andExpect(MockMvcResultMatchers.jsonPath("code").value(4001));
  }
}
