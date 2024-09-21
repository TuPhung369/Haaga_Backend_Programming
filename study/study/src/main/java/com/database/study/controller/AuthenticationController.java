package com.database.study.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.database.study.dto.request.ApiResponse;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.database.study.dto.request.AuthenticationRequest;
import com.database.study.dto.response.AuthenticationResponse;
import com.database.study.service.AuthenticationService;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
  AuthenticationService authenticationService;

  @PostMapping("/login")
  ApiResponse<AuthenticationResponse> login(@RequestBody AuthenticationRequest request) {
    boolean result = authenticationService.authenticate(request);
    return ApiResponse.<AuthenticationResponse>builder()
        .result(AuthenticationResponse.builder().authenticated(result).build())
        .build();
  }
}
