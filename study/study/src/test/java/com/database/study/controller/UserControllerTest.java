package com.database.study.controller;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.dto.request.UserUpdateRequest;
import com.database.study.dto.response.ApiResponse;
import com.database.study.dto.response.UserResponse;
import com.database.study.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserControllerTest {

  @Mock
  private UserService userService;

  @Mock
  private SecurityContext securityContext;

  @Mock
  private Authentication authentication;

  @InjectMocks
  private UserController userController;

  @BeforeEach
  void setUp() {
    MockitoAnnotations.openMocks(this);
    SecurityContextHolder.setContext(securityContext);
  }

  @Test
  void testCreateUser() {
    UserCreationRequest request = new UserCreationRequest();
    UserResponse userResponse = new UserResponse();
    when(userService.createUser(request)).thenReturn(userResponse);

    ApiResponse<UserResponse> response = userController.createUser(request);

    assertNotNull(response);
    assertEquals(userResponse, response.getResult());
    verify(userService, times(1)).createUser(request);
  }

  @Test
  void testGetUsersWithAuthentication() {
    when(securityContext.getAuthentication()).thenReturn(authentication);
    when(authentication.isAuthenticated()).thenReturn(true);
    List<UserResponse> users = List.of(new UserResponse());
    when(userService.getUsers()).thenReturn(users);

    List<UserResponse> response = userController.getUsers();

    assertNotNull(response);
    assertEquals(users, response);
    verify(userService, times(1)).getUsers();
  }

  @Test
  void testGetUsersWithoutAuthentication() {
    when(securityContext.getAuthentication()).thenReturn(null);

    List<UserResponse> response = userController.getUsers();

    assertNotNull(response);
    assertTrue(response.isEmpty());
    verify(userService, never()).getUsers();
  }

  @Test
  void testGetMyInfo() {
    UserResponse userResponse = new UserResponse();
    when(userService.getMyInfo()).thenReturn(userResponse);

    ApiResponse<UserResponse> response = userController.getMyInfo();

    assertNotNull(response);
    assertEquals(userResponse, response.getResult());
    verify(userService, times(1)).getMyInfo();
  }

  @Test
  void testGetUserByPath() {
    UUID userId = UUID.randomUUID();
    UserResponse userResponse = new UserResponse();
    when(userService.getUserById(userId)).thenReturn(userResponse);

    ApiResponse<UserResponse> response = userController.getUserByPath(userId);

    assertNotNull(response);
    assertEquals(userResponse, response.getResult());
    verify(userService, times(1)).getUserById(userId);
  }

  @Test
  void testGetUserByQuery() {
    UUID userId = UUID.randomUUID();
    UserResponse userResponse = new UserResponse();
    when(userService.getUserById(userId)).thenReturn(userResponse);

    ApiResponse<UserResponse> response = userController.getUserByQuery(userId);

    assertNotNull(response);
    assertEquals(userResponse, response.getResult());
    verify(userService, times(1)).getUserById(userId);
  }

  @Test
  void testUpdateUser() {
    UUID userId = UUID.randomUUID();
    UserUpdateRequest request = new UserUpdateRequest();
    UserResponse userResponse = new UserResponse();
    when(userService.updateUser(userId, request)).thenReturn(userResponse);

    ApiResponse<UserResponse> response = userController.updateUser(userId, request);

    assertNotNull(response);
    assertEquals(userResponse, response.getResult());
    verify(userService, times(1)).updateUser(userId, request);
  }

  @Test
  void testUpdateMyInfo() {
    UUID userId = UUID.randomUUID();
    UserUpdateRequest request = new UserUpdateRequest();
    UserResponse userResponse = new UserResponse();
    when(userService.updateMyInfo(userId, request)).thenReturn(userResponse);

    ApiResponse<UserResponse> response = userController.updateMyInfo(userId, request);

    assertNotNull(response);
    assertEquals(userResponse, response.getResult());
    verify(userService, times(1)).updateMyInfo(userId, request);
  }

  @Test
  void testDeleteUser() {
    UUID userId = UUID.randomUUID();
    doNothing().when(userService).deleteUser(userId);

    ApiResponse<String> response = userController.deleteUser(userId);

    assertNotNull(response);
    assertEquals("User ID: " + userId, response.getResult());
    assertEquals(2000, response.getCode());
    assertEquals("User successfully deleted", response.getMessage());
    verify(userService, times(1)).deleteUser(userId);
  }
}
