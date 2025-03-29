package com.database.study.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.database.study.dto.request.*;
import com.database.study.dto.response.*;
import com.database.study.security.GoogleTokenValidation;
import com.database.study.service.AuthenticationService;
import com.database.study.service.CookieService;
import com.database.study.exception.AppException;
import com.nimbusds.jose.JOSEException;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.oauth2.jwt.Jwt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.text.ParseException;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {

  AuthenticationService authenticationService;
  GoogleTokenValidation googleTokenValidationService;
  CookieService cookieService;
  private static final Logger log = LoggerFactory.getLogger(AuthenticationController.class);
  private static final Logger logger = LoggerFactory.getLogger(AuthenticationController.class);

  // New initial authentication endpoint that checks for 2FA requirements
  @PostMapping("/initAuthentication")
  public ApiResponse<AuthenticationInitResponse> initiateAuthentication(
      @RequestBody AuthenticationRequest request,
      HttpServletRequest httpRequest) {
    var result = authenticationService.initiateAuthentication(request, httpRequest);
    return ApiResponse.<AuthenticationInitResponse>builder()
        .result(result)
        .build();
  }

  // Email OTP authentication endpoint
  @PostMapping("/email-otp/token")
  public ApiResponse<AuthenticationResponse> authenticateWithEmailOtp(
      @RequestBody EmailOtpAuthenticationRequest request,
      HttpServletRequest httpRequest) {
    var result = authenticationService.authenticateWithEmailOtp(request, httpRequest);
    return ApiResponse.<AuthenticationResponse>builder()
        .result(result)
        .build();
  }

  // Email OTP authentication with cookies endpoint
  @PostMapping("/email-otp/token/cookie")
  public ApiResponse<AuthenticationResponse> authenticateWithEmailOtpAndCookies(
      @RequestBody EmailOtpAuthenticationRequest request,
      HttpServletRequest httpRequest,
      HttpServletResponse httpResponse) {

    // First authenticate with Email OTP
    var authResult = authenticationService.authenticateWithEmailOtp(request, httpRequest);

    // Then set refresh token cookie if authentication successful
    if (authResult.isAuthenticated()) {
      cookieService.createRefreshTokenCookie(httpResponse, authResult.getRefreshToken());

      // Don't return the refresh token in the response body when using cookies
      return ApiResponse.<AuthenticationResponse>builder()
          .result(AuthenticationResponse.builder()
              .token(authResult.getToken())
              .authenticated(true)
              .build())
          .build();
    }

    return ApiResponse.<AuthenticationResponse>builder()
        .result(authResult)
        .build();
  }

  // Authenticate user and generate token
  @PostMapping("/token")
  public ApiResponse<AuthenticationResponse> authenticate(
      @RequestBody AuthenticationRequest request,
      HttpServletRequest httpRequest) {
    var result = authenticationService.authenticate(request, false, httpRequest);
    return ApiResponse.<AuthenticationResponse>builder()
        .result(result)
        .build();
  }

  // Introspect token
  @PostMapping("/introspect")
  public ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request) {
    try {
      var result = authenticationService.introspect(request);
      return ApiResponse.<IntrospectResponse>builder()
          .result(result)
          .build();
    } catch (Exception e) {
      // Log error but return a valid response with valid=false instead of throwing
      return ApiResponse.<IntrospectResponse>builder()
          .result(IntrospectResponse.builder().valid(false).build())
          .message("Token validation failed")
          .build();
    }
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
    try {
      log.info("Received registration request for username: {}, email: {}",
          request.getUsername(), request.getEmail());
      log.info("Registration request contains reCAPTCHA token: {}",
          request.getRecaptchaToken() != null
              ? request.getRecaptchaToken().substring(0, Math.min(10, request.getRecaptchaToken().length())) + "..."
              : "null");

      ApiResponse<Void> response = authenticationService.register(request);
      log.info("Registration completed successfully for username: {}", request.getUsername());
      return response;
    } catch (Exception e) {
      log.error("Error processing registration request", e);
      throw e;
    }
  }

  @PostMapping("/verify-email")
  public ApiResponse<Void> verifyEmail(@RequestBody VerifyEmailRequest request) {
    return authenticationService.verifyEmail(request);
  }

  @PostMapping("/request-email-change")
  public ApiResponse<Void> requestEmailChange(@RequestBody EmailChangeRequest request) {
    return authenticationService.requestEmailChange(request);
  }

  @PostMapping("/verify-email-change")
  public ApiResponse<Void> verifyEmailChange(@RequestBody VerifyEmailChangeRequest request) {
    // Log the incoming request
    logger.info("Received request to verify email change: {}", request);

    ApiResponse<Void> response = authenticationService.verifyEmailChange(request);

    // Log the response
    logger.info("Response from verifyEmailChange: {}", response);

    return response;
  }

  @PostMapping("/change-password")
  public ApiResponse<Void> changePassword(@RequestBody PasswordChangeRequest request) {
    return authenticationService.changePassword(request);
  }

  @PostMapping("/totp/token")
  public ApiResponse<AuthenticationResponse> authenticateWithTotp(
      @RequestBody TotpAuthenticationRequest request,
      HttpServletRequest httpRequest) {
    try {
      var result = authenticationService.authenticateWithTotp(request, httpRequest);
      return ApiResponse.<AuthenticationResponse>builder()
          .result(result)
          .build();
    } catch (AppException e) {
      // Return error response with the appropriate status
      return ApiResponse.<AuthenticationResponse>builder()
          .code(e.getErrorCode().getCode())
          .message(e.getMessage())
          .metadata(e.getAllExtraInfo()) // Include remaining attempts and other extra info
          .build();
    }
  }

  @PostMapping("/totp/token/cookie")
  public ApiResponse<AuthenticationResponse> authenticateWithTotpAndCookies(
      @RequestBody TotpAuthenticationRequest request,
      HttpServletRequest httpRequest,
      HttpServletResponse httpResponse) {
    try {
      // First authenticate with TOTP
      var authResult = authenticationService.authenticateWithTotp(request, httpRequest);

      // Then set refresh token cookie if authentication successful
      if (authResult.isAuthenticated()) {
        cookieService.createRefreshTokenCookie(httpResponse, authResult.getRefreshToken());

        // Don't return the refresh token in the response body when using cookies
        return ApiResponse.<AuthenticationResponse>builder()
            .result(AuthenticationResponse.builder()
                .token(authResult.getToken())
                .authenticated(true)
                .build())
            .build();
      }

      return ApiResponse.<AuthenticationResponse>builder()
          .result(authResult)
          .build();
    } catch (AppException e) {
      // Return error response with the appropriate status
      return ApiResponse.<AuthenticationResponse>builder()
          .code(e.getErrorCode().getCode())
          .message(e.getMessage())
          .metadata(e.getAllExtraInfo()) // Include remaining attempts and other extra info
          .build();
    }
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

  // Validate GitHub token
  @PostMapping("/github/token")
  public ResponseEntity<?> validateGithubToken(@RequestBody Map<String, String> body) {
    String accessToken = body.get("access_token");
    try {
      // For GitHub, we obtain user information from the GitHub API
      Map<String, Object> userInfo = authenticationService.validateGithubToken(accessToken);
      return ResponseEntity.ok(userInfo);
    } catch (RuntimeException e) {
      log.error("GitHub token validation error", e);
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  // Validate Facebook token
  @PostMapping("/facebook/token")
  public ResponseEntity<?> validateFacebookToken(@RequestBody Map<String, String> body) {
    String accessToken = body.get("access_token");
    try {
      // For Facebook, we obtain user information from the Facebook Graph API
      Map<String, Object> userInfo = authenticationService.validateFacebookToken(accessToken);
      return ResponseEntity.ok(userInfo);
    } catch (RuntimeException e) {
      log.error("Facebook token validation error", e);
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  // Cookie-based authentication endpoints
  @PostMapping("/token/cookie")
  public ApiResponse<AuthenticationResponse> authenticateWithCookies(
      @RequestBody AuthenticationRequest request,
      HttpServletResponse response) {

    var result = authenticationService.authenticateWithCookies(request, response);

    return ApiResponse.<AuthenticationResponse>builder()
        .result(result)
        .build();
  }

  @PostMapping("/refresh/cookie")
  public ApiResponse<RefreshTokenResponse> refreshTokenFromCookie(
      HttpServletRequest request,
      HttpServletResponse response) {
    try {
      var result = authenticationService.refreshTokenFromCookie(request, response);
      return ApiResponse.<RefreshTokenResponse>builder()
          .result(result)
          .build();
    } catch (AppException e) {
      // Return error response with 401 status but don't redirect
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      return ApiResponse.<RefreshTokenResponse>builder()
          .message(e.getMessage())
          .code(e.getErrorCode().getCode())
          .build();
    } catch (Exception e) {
      // Return generic error response
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      return ApiResponse.<RefreshTokenResponse>builder()
          .message("Invalid or expired refresh token")
          .build();
    }
  }

  @PostMapping("/logout/cookie")
  public ApiResponse<Void> logoutWithCookies(
      HttpServletRequest request,
      HttpServletResponse response) {

    return authenticationService.logoutWithCookies(request, response);
  }
}