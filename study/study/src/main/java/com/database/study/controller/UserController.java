package com.database.study.controller;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.dto.response.UserResponse;
import com.database.study.entity.User;
import com.database.study.service.UserService;
import com.database.study.dto.request.ApiResponse;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/users")
public class UserController {
  UserService userService;

  @PostMapping
  ApiResponse<User> createUser(@RequestBody @Valid UserCreationRequest request) {
    ApiResponse<User> apiResponse = new ApiResponse<>();
    apiResponse.setResult(userService.createUser(request));
    return apiResponse;
  }

  @GetMapping
  public List<User> getUsers() {
    return userService.getUsers();
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

  @DeleteMapping("/{userId}")
  public ResponseEntity<String> deleteUser(@PathVariable UUID userId) {
    userService.deleteUser(userId);
    return ResponseEntity.ok("User successfully deleted");
  }
}