package com.database.study.controller;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.entity.User;
import com.database.study.service.UserService;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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

@RestController
@RequestMapping("/users")
public class UserController {
  @Autowired
  private UserService userService;

  @PostMapping
  public User createUser(@RequestBody UserCreationRequest request) {
    return userService.createRequest(request);
  }

  @GetMapping
  public List<User> getUsers() {
    return userService.getUsers();
  }

  @GetMapping("/{userId}")
  public User getUserByPath(@PathVariable("userId") UUID userId) {
    return userService.getUserById(userId);
  }

  @GetMapping("/info")
  public User getUserByQuery(@RequestParam("id") UUID id) {
    return userService.getUserById(id);
  }

  @PutMapping("/{userId}")
  public User updateUser(@PathVariable UUID userId, @RequestBody UserCreationRequest request) {
    return userService.updateUser(userId, request);
  }

  @DeleteMapping("/{userId}")
  public ResponseEntity<String> deleteUser(@PathVariable UUID userId) {
    try {
      userService.deleteUser(userId);
      return ResponseEntity.ok("User successfully deleted"); // Returns a 200 OK status with a success message
    } catch (RuntimeException e) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found"); // Returns a 404 Not Found status with
    }
  }

}
