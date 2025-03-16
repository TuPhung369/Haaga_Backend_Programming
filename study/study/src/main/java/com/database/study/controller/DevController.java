package com.database.study.controller;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.dto.request.VerifyEmailRequest;
import com.database.study.dto.response.ApiResponse;
import com.database.study.entity.EmailVerificationToken;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.repository.EmailVerificationTokenRepository;
import com.database.study.repository.UserRepository;
import com.database.study.service.AuthenticationService;
import com.database.study.service.ReCaptchaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * Development Controller - only active in dev profiles
 * Handles special requests for development mode, including
 * bypassing reCAPTCHA validation
 */
@RestController
@RequestMapping("/_dev_")
@Profile({ "dev", "default", "local", "test" })
@RequiredArgsConstructor
@Slf4j
public class DevController {

  private final AuthenticationService authenticationService;
  private final ReCaptchaService reCaptchaService;
  private final UserRepository userRepository;
  private final EmailVerificationTokenRepository emailVerificationTokenRepository;

  /**
   * Special development-only registration endpoint that ensures
   * reCAPTCHA validation is bypassed
   */
  @PostMapping("/auth/register")
  public ApiResponse<Void> devRegister(@RequestBody UserCreationRequest request) {
    log.info("🛠️ DEV MODE: Processing registration request for username: {}", request.getUsername());
    log.info("🛠️ DEV MODE: Token provided: {}",
        request.getRecaptchaToken() != null
            ? request.getRecaptchaToken().substring(0, Math.min(10, request.getRecaptchaToken().length())) + "..."
            : "null");

    // Force development mode for this request
    ApiResponse<Void> response = authenticationService.register(request);
    log.info("🛠️ DEV MODE: Registration completed successfully for username: {}", request.getUsername());
    return response;
  }

  /**
   * Special development-only email verification endpoint that handles
   * token validation issues
   */
  @PostMapping("/auth/verify-email")
  @Transactional
  public ApiResponse<Void> devVerifyEmail(@RequestBody VerifyEmailRequest request) {
    log.info("🛠️ DEV MODE: Processing email verification for username: {}", request.getUsername());
    log.info("🛠️ DEV MODE: Token provided: {}", request.getToken());

    try {
      // First try the standard verification flow
      return authenticationService.verifyEmail(request);
    } catch (AppException e) {
      log.warn("🛠️ DEV MODE: Standard verification failed with error: {}", e.getMessage());

      // In dev mode, we'll manually activate the account if the token is invalid
      User user = userRepository.findByUsername(request.getUsername())
          .orElseThrow(() -> new AppException(com.database.study.exception.ErrorCode.USER_NOT_EXISTS));

      // Check if the user is already active
      if (user.isActive()) {
        log.info("🛠️ DEV MODE: User is already active: {}", request.getUsername());
        return ApiResponse.<Void>builder()
            .message("Email verified successfully")
            .build();
      }

      // Find any verification token for this user
      Optional<EmailVerificationToken> tokenOpt = emailVerificationTokenRepository
          .findByUsernameAndUsed(request.getUsername(), false);

      if (tokenOpt.isPresent()) {
        // Mark the token as used
        EmailVerificationToken token = tokenOpt.get();
        token.setUsed(true);
        emailVerificationTokenRepository.save(token);
      }

      // Activate the user anyway (for development convenience)
      user.setActive(true);
      userRepository.save(user);

      log.info("🛠️ DEV MODE: Manually activated user: {}", request.getUsername());
      return ApiResponse.<Void>builder()
          .message("Email verified successfully (DEV MODE override)")
          .build();
    }
  }
}