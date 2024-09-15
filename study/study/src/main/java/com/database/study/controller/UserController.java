package com.database.study.controller;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.entity.User;
import com.database.study.service.UserService;
import com.database.study.dto.request.ApiResponse;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
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

@RestController
@RequestMapping("/users")
public class UserController {
  @Autowired
  private UserService userService;

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
  ApiResponse<User> getUserByPath(@PathVariable("userId") UUID userId) {
    ApiResponse<User> apiResponse = new ApiResponse<>();
    apiResponse.setResult(userService.getUserById(userId));
    return apiResponse;
  }

  @GetMapping("/info")
  ApiResponse<User> getUserByQuery(@RequestParam("id") UUID id) {
    ApiResponse<User> apiResponse = new ApiResponse<>();
    apiResponse.setResult(userService.getUserById(id));
    return apiResponse;
  }

  @PutMapping("/{userId}")
  public ApiResponse<User> updateUser(@PathVariable UUID userId, @RequestBody @Valid UserCreationRequest request) {
    ApiResponse<User> apiResponse = new ApiResponse<>();
    apiResponse.setResult(userService.updateUser(userId, request));
    return apiResponse;
  }

  @DeleteMapping("/{userId}")
  public ResponseEntity<String> deleteUser(@PathVariable UUID userId) {
    userService.deleteUser(userId);
    return ResponseEntity.ok("User successfully deleted");
  }
}