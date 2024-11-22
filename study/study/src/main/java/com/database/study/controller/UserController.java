package com.database.study.controller;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.dto.response.ApiResponse;
import com.database.study.dto.response.UserResponse;
import com.database.study.service.UserService;

import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/users")
public class UserController {
  UserService userService;

  @PostMapping
  public ApiResponse<UserResponse> createUser(@RequestBody @Valid UserCreationRequest request) {
    UserResponse userResponse = userService.createUser(request);
    ApiResponse<UserResponse> apiResponse = new ApiResponse<>();
    apiResponse.setResult(userResponse);
    return apiResponse;
  }

  @GetMapping
  public List<UserResponse> getUsers() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
      log.warn("No authenticated user found");
      return List.of(); // Return an empty list or handle it as appropriate
    }
    // authentication.getAuthorities().forEach(authority ->
    // authority.getAuthority());
    List<UserResponse> users = userService.getUsers();
    return users;
  }

  @GetMapping("/myInfo")
  public ApiResponse<UserResponse> getMyInfo() {
    UserResponse userResponse = userService.getMyInfo();
    return ApiResponse.<UserResponse>builder()
        .result(userResponse)
        .build();
  }

  @GetMapping("/{userId}")
  public ApiResponse<UserResponse> getUserByPath(@PathVariable("userId") UUID userId) {
    UserResponse userResponse = userService.getUserById(userId);
    return ApiResponse.<UserResponse>builder()
        .result(userResponse)
        .build();
  }

  @GetMapping("/info")
  public ApiResponse<UserResponse> getUserByQuery(@RequestParam("id") UUID id) {
    UserResponse userResponse = userService.getUserById(id);
    return ApiResponse.<UserResponse>builder()
        .result(userResponse)
        .build();
  }

  @PutMapping("/{userId}")
  public ApiResponse<UserResponse> updateUser(@PathVariable UUID userId,
      @RequestBody @Valid UserCreationRequest request) {
    UserResponse userResponse = userService.updateUser(userId, request);
    return ApiResponse.<UserResponse>builder()
        .result(userResponse)
        .build();
  }

  @PutMapping("/updateMyInfo/{userId}")
  public ApiResponse<UserResponse> updateMyInfo(@PathVariable UUID userId,
      @RequestBody @Valid UserCreationRequest request) {
    UserResponse userResponse = userService.updateMyInfo(userId, request);
    return ApiResponse.<UserResponse>builder()
        .result(userResponse)
        .build();
  }

  @DeleteMapping("/{userId}")
  public ApiResponse<String> deleteUser(@PathVariable UUID userId) {
    userService.deleteUser(userId);
    return ApiResponse.<String>builder()
        .code(2000) // Success code or you can set a specific code
        .message("User successfully deleted")
        .result("User ID: " + userId) // Include any additional details if needed
        .build();
  }
}