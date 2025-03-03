package com.database.study.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.database.study.dto.request.*;
import com.database.study.dto.response.*;
import com.database.study.security.GoogleTokenValidation;
import com.database.study.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.oauth2.jwt.Jwt;

import java.text.ParseException;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {

  AuthenticationService authenticationService;
  GoogleTokenValidation googleTokenValidationService;

  // Authenticate user and generate token
  @PostMapping("/token")
  public ApiResponse<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
    var result = authenticationService.authenticate(request);
    return ApiResponse.<AuthenticationResponse>builder()
        .result(result)
        .build();
  }

  // Introspect token
  @PostMapping("/introspect")
  public ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request)
      throws JOSEException, ParseException {
    var result = authenticationService.introspect(request);
    return ApiResponse.<IntrospectResponse>builder()
        .result(result)
        .build();
  }

  @PostMapping("/refreshToken")
  public ApiResponse<RefreshTokenResponse> refreshToken(@RequestBody RefreshTokenRequest request)
      throws JOSEException, ParseException {
    var result = authenticationService.refreshToken(request);
    return ApiResponse.<RefreshTokenResponse>builder()
        .result(result)
        .build();
  }

  @PostMapping("/logout")
  public ApiResponse<Void> logout(@RequestBody LogoutRequest request)
      throws JOSEException, ParseException {
    authenticationService.logout(request);
    return ApiResponse.<Void>builder()
        .message("Logged out successfully!")
        .build();
  }

  @PostMapping("/resetPassword")
  public ApiResponse<Void> resetPassword(@RequestBody ResetPasswordRequest request) {
    return authenticationService.resetPassword(request);
  }

  @PostMapping("/forgot-password")
  public ApiResponse<Void> forgotPassword(@RequestBody ForgotPasswordRequest request) {
      return authenticationService.initiatePasswordReset(request);
  }
  
  @PostMapping("/reset-password-with-token")
  public ApiResponse<Void> resetPasswordWithToken(@RequestBody VerifyResetTokenRequest request) {
      return authenticationService.resetPasswordWithToken(request);
  }

  @PostMapping("/register")
  public ApiResponse<Void> register(@RequestBody UserCreationRequest request) {
    return authenticationService.register(request);
  }

  @PostMapping("/verify-email")
  public ApiResponse<Void> verifyEmail(@RequestBody VerifyEmailRequest request) {
    return authenticationService.verifyEmail(request);
  }

  @PostMapping("/resend-verification")
  public ApiResponse<Void> resendVerification(@RequestBody ResendVerificationRequest request) {
      return authenticationService.resendVerificationEmail(request);
  }

  // Validate Google ID token
  @PostMapping("/google/token")
  public ResponseEntity<?> validateGoogleToken(@RequestBody Map<String, String> body) {
    String idToken = body.get("id_token");
    try {
      Jwt jwt = googleTokenValidationService.validateGoogleIdToken(idToken);
      return ResponseEntity.ok(jwt.getClaims());
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

}
