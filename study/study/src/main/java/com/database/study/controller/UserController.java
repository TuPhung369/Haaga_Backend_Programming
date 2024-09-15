package com.database.study.controller;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.entity.User;
import com.database.study.service.UserService;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;


@RestController
@RequestMapping("/users")
public class UserController {
  @Autowired
  private UserService userService;

  @PostMapping
  User createUser(@RequestBody UserCreationRequest request) {
    return userService.createRequest(request);
  }

  @GetMapping
  List<User> getUsers() {
    return userService.getUsers();
  }
  
}
