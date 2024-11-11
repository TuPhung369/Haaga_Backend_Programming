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
import com.database.study.dto.request.LogoutRequest;
import com.database.study.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import com.database.study.dto.request.IntrospectRequest;
import com.database.study.dto.response.IntrospectResponse;
import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
  AuthenticationService authenticationService;

  @PostMapping("/token")
  ApiResponse<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
    var result = authenticationService.authenticate(request);
    return ApiResponse.<AuthenticationResponse>builder()
        .result(result)
        .build();
  }

  @PostMapping("/introspect")
  ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request)
      throws JOSEException, ParseException {
    var result = authenticationService.introspect(request);
    return ApiResponse.<IntrospectResponse>builder()
        .result(result)
        .build();
  }

  @PostMapping("/logout")
  ApiResponse<Void> logout(@RequestBody LogoutRequest request)
      throws JOSEException, ParseException {
    authenticationService.logout(request);
    return ApiResponse.<Void>builder()
        .message("Logged out successfully!")
        .build();
  }
}
