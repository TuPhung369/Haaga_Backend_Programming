package com.database.study.service;

import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.database.study.dto.request.AuthenticationRequest;
import com.database.study.dto.request.EmailChangeRequest;
import com.database.study.dto.request.ForgotPasswordRequest;
import com.database.study.dto.request.VerifyResetTokenRequest;
import com.database.study.dto.request.LogoutRequest;
import com.database.study.dto.request.ResetPasswordRequest;
import com.database.study.dto.request.TokenRefreshRequest;
import com.database.study.dto.request.TotpAuthenticationRequest;
import com.database.study.dto.request.UserCreationRequest;
import com.database.study.dto.request.VerifyEmailChangeRequest;
import com.database.study.dto.request.VerifyEmailRequest;
import com.database.study.dto.request.IntrospectRequest;
import com.database.study.dto.request.RefreshTokenRequest;
import com.database.study.dto.request.ResendVerificationRequest;
import com.database.study.dto.response.ApiResponse;
import com.database.study.dto.response.AuthenticationResponse;
import com.database.study.dto.response.IntrospectResponse;
import com.database.study.dto.response.RefreshTokenResponse;
import com.database.study.dto.response.TokenRefreshResponse;
import com.database.study.entity.EmailVerificationToken;
import com.database.study.entity.ActiveToken;
import com.database.study.entity.EmailChangeToken;
import com.database.study.entity.PasswordResetToken;
import com.database.study.entity.Role;
import com.database.study.entity.User;
import com.database.study.enums.ENUMS;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.mapper.UserMapper;
import com.database.study.repository.EmailVerificationTokenRepository;
import com.database.study.repository.ActiveTokenRepository;
import com.database.study.repository.EmailChangeTokenRepository;
import com.database.study.repository.PasswordResetTokenRepository;
import com.database.study.repository.RoleRepository;
import com.database.study.repository.UserRepository;
import com.database.study.security.JwtUtils;
import com.database.study.security.TokenSecurity;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jose.JWSVerifier;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.Date;
import java.util.Optional;
import java.util.StringJoiner;
import java.util.UUID;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.ArrayList;
import org.springframework.transaction.annotation.Transactional;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.util.Random;

import java.util.List;
import java.util.Set;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
  UserRepository userRepository;
  PasswordEncoder passwordEncoder;
  RoleRepository roleRepository;
  UserMapper userMapper;
  ActiveTokenRepository activeTokenRepository;
  EmailService emailService;
  PasswordResetTokenRepository passwordResetTokenRepository;
  EmailVerificationTokenRepository emailVerificationTokenRepository;
  EmailChangeTokenRepository emailChangeTokenRepository;
  EncryptionService encryptionService;
  TokenSecurity tokenSecurity;
  CookieService cookieService;
  JwtUtils jwtUtils;
  TotpService totpService;

  static final long TOKEN_EXPIRY_TIME = 60 * 60 * 1000; // 60 minutes
  static final long REFRESH_TOKEN_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days

  @Transactional
  public AuthenticationResponse authenticate(AuthenticationRequest request) {
    // 1. Authenticate the user
    User user = userRepository.findByUsername(request.getUsername())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

    boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
    if (!authenticated) {
      throw new AppException(ErrorCode.PASSWORD_MISMATCH);
    }

    if (!user.isActive()) {
      throw new AppException(ErrorCode.ACCOUNT_NOT_VERIFIED);
    }

    // 2. Clean up expired tokens
    // activeTokenRepository.deleteAllByExpiryTimeBefore(new Date());
    // activeTokenRepository.deleteAllByExpiryRefreshTimeBefore(new Date());

    // 3. Check for existing tokens
    Optional<ActiveToken> existingTokenOpt = activeTokenRepository.findByUsername(user.getUsername());

    if (existingTokenOpt.isPresent()) {
      ActiveToken existingToken = existingTokenOpt.get();
      Date currentTime = new Date();

      // 3a. If access token is still valid, reuse it
      if (existingToken.getExpiryTime().after(currentTime)) {
        log.info("Reusing existing valid token for user: {}", user.getUsername());

        // Return the stored encrypted tokens to client
        return AuthenticationResponse.builder()
            .token(existingToken.getToken())
            .refreshToken(existingToken.getRefreshToken())
            .authenticated(true)
            .build();
      }
      // 3b. If access token expired but refresh token is valid, create new access token
      else if (existingToken.getExpiryRefreshTime().after(currentTime)) {
        log.info("Access token expired but refresh token valid. Generating new access token for user: {}",
            user.getUsername());

        // Generate new plain JWT token
        String plainNewAccessToken = generateToken(user, existingToken.getId());
        Date newExpiryTime = extractTokenExpiry(plainNewAccessToken);

        // Encrypt new token
        String encryptedNewAccessToken = encryptionService.encryptToken(plainNewAccessToken);

        // Update only access token, keep refresh token
        existingToken.setToken(encryptedNewAccessToken);
        existingToken.setExpiryTime(newExpiryTime);
        existingToken.setDescription("Refreshed at " + new Date());

        activeTokenRepository.save(existingToken);

        // Send encrypted tokens to client
        return AuthenticationResponse.builder()
            .token(encryptedNewAccessToken)
            .refreshToken(existingToken.getRefreshToken())
            .authenticated(true)
            .build();
      }
      // 3c. Both tokens expired, delete and create new ones
      else {
        log.info("All tokens expired for user: {}, creating new tokens", user.getUsername());
        activeTokenRepository.delete(existingToken);
      }
    }

    // 4. Create new tokens if none exist or all expired
    String jwtId = UUID.randomUUID().toString();
    String plainAccessToken = generateToken(user, jwtId);
    String plainRefreshToken = generateRefreshToken(user, jwtId);

    Date expiryTime = extractTokenExpiry(plainAccessToken);
    Date expireRefreshTime = extractTokenExpiry(plainRefreshToken);

    // Encrypt tokens
    String encryptedAccessToken = encryptionService.encryptToken(plainAccessToken);
    String encryptedRefreshToken = encryptionService.encryptToken(plainRefreshToken);

    // 5. Save encrypted tokens in database
    ActiveToken newToken = ActiveToken.builder()
        .id(jwtId)
        .token(encryptedAccessToken)
        .refreshToken(encryptedRefreshToken)
        .expiryTime(expiryTime)
        .expiryRefreshTime(expireRefreshTime)
        .username(user.getUsername())
        .description("Login at " + new Date())
        .build();

    activeTokenRepository.save(newToken);

    // 6. Return encrypted tokens to client
    return AuthenticationResponse.builder()
        .token(encryptedAccessToken)
        .refreshToken(encryptedRefreshToken)
        .authenticated(true)
        .build();
  }
  
  @Transactional
  public AuthenticationResponse authenticateOAuth(String username) {
      User user = userRepository.findByUsername(username)
          .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

      // Delete expired tokens
      // activeTokenRepository.deleteAllByExpiryTimeBefore(new Date());
      // activeTokenRepository.deleteAllByExpiryRefreshTimeBefore(new Date());
      // Define longer expiry for OAuth tokens
      final long OAUTH_TOKEN_EXPIRY_TIME = 60 * 60 * 1000; // 60 minutes for OAuth tokens

      // Find current token
      Optional<ActiveToken> existingTokenOpt = activeTokenRepository.findByUsername(user.getUsername());

      if (existingTokenOpt.isPresent()) {
          ActiveToken existingToken = existingTokenOpt.get();
          Date currentTime = new Date();

          // If token is still valid, reuse it
          if (existingToken.getExpiryTime().after(currentTime)) {
              log.info("Reusing existing valid OAuth token for user: {}", user.getUsername());
              
              return AuthenticationResponse.builder()
                  .token(existingToken.getToken())
                  .refreshToken(existingToken.getRefreshToken())
                  .authenticated(true)
                  .build();
          } 
          // If access token expired but refresh token is valid, create new access token
          else if (existingToken.getExpiryRefreshTime().after(currentTime)) {
              log.info("OAuth access token expired but refresh token valid. Generating new access token for user: {}", user.getUsername());
              
              // Generate new plain JWT token
              String plainNewAccessToken = generateToken(user, existingToken.getId());
              Date newExpiryTime = extractTokenExpiry(plainNewAccessToken);
              
              // Encrypt new token for storage and client
              String encryptedNewAccessToken = encryptionService.encryptToken(plainNewAccessToken);
              
              // Update only access token, keep refresh token
              existingToken.setToken(encryptedNewAccessToken);
              existingToken.setExpiryTime(newExpiryTime);
              existingToken.setDescription("OAuth Refreshed at " + new Date());
              
              activeTokenRepository.save(existingToken);
              
              return AuthenticationResponse.builder()
                  .token(encryptedNewAccessToken)
                  .refreshToken(existingToken.getRefreshToken())
                  .authenticated(true)
                  .build();
          } 
          // Both tokens expired, delete and create new ones
          else {
              log.info("All OAuth tokens expired for user: {}, creating new tokens", user.getUsername());
              activeTokenRepository.delete(existingToken);
          }
      }

      // Create new tokens
      String jwtId = UUID.randomUUID().toString();
      
      // Generate plain JWT tokens
      // Generate plain JWT tokens WITH LONGER EXPIRY TIME FOR OAUTH
      String plainAccessToken = generateOAuthToken(user, jwtId, OAUTH_TOKEN_EXPIRY_TIME);
      String plainRefreshToken = generateRefreshToken(user, jwtId);

      // Add debug log to verify the token content
      log.debug("OAuth plain token generated for user {}: {} (first 20 chars)", 
                user.getUsername(),
                plainAccessToken.substring(0, Math.min(20, plainAccessToken.length())));

      // Get expiry dates from plain JWT tokens
      Date expiryTime = extractTokenExpiry(plainAccessToken);
      Date expireRefreshTime = extractTokenExpiry(plainRefreshToken);

      // Encrypt tokens for storage and client
      String encryptedAccessToken = encryptionService.encryptToken(plainAccessToken);
      String encryptedRefreshToken = encryptionService.encryptToken(plainRefreshToken);

      // Store encrypted tokens in database
      ActiveToken newToken = ActiveToken.builder()
          .id(jwtId)
          .token(encryptedAccessToken)
          .refreshToken(encryptedRefreshToken)
          .expiryTime(expiryTime)
          .expiryRefreshTime(expireRefreshTime)
          .username(user.getUsername())
          .description("OAuth Login at " + new Date())
          .build();

      activeTokenRepository.save(newToken);

      // Return encrypted tokens to client
      return AuthenticationResponse.builder()
          .token(encryptedAccessToken)
          .refreshToken(encryptedRefreshToken)
          .authenticated(true)
          .build();
  }

  @Transactional
  public AuthenticationResponse authenticateWithTotp(TotpAuthenticationRequest request) {
    // 1. First authenticate username and password
    User user = userRepository.findByUsername(request.getUsername())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

    boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
    if (!authenticated) {
      throw new AppException(ErrorCode.PASSWORD_MISMATCH);
    }

    if (!user.isActive()) {
      throw new AppException(ErrorCode.ACCOUNT_NOT_VERIFIED);
    }

    // 2. Check if TOTP is required
    boolean totpEnabled = totpService.isTotpEnabled(user.getUsername());

    // 3. If TOTP is enabled, verify the TOTP code
    if (totpEnabled) {
      String totpCode = request.getTotpCode();

      // If no TOTP code provided but required
      if (totpCode == null || totpCode.isEmpty()) {
        throw new AppException(ErrorCode.TOTP_REQUIRED);
      }

      // Verify TOTP code
      boolean validTotp = totpService.validateCode(user.getUsername(), totpCode);
      if (!validTotp) {
        throw new AppException(ErrorCode.TOTP_INVALID);
      }
    }

    // 4. If everything is valid, proceed with token generation (same as original authenticate method)
    Optional<ActiveToken> existingTokenOpt = activeTokenRepository.findByUsername(user.getUsername());

    if (existingTokenOpt.isPresent()) {
      ActiveToken existingToken = existingTokenOpt.get();
      Date currentTime = new Date();

      // If access token is still valid, reuse it
      if (existingToken.getExpiryTime().after(currentTime)) {
        return AuthenticationResponse.builder()
            .token(existingToken.getToken())
            .refreshToken(existingToken.getRefreshToken())
            .authenticated(true)
            .build();
      }
      // If access token expired but refresh token is valid, create new access token
      else if (existingToken.getExpiryRefreshTime().after(currentTime)) {
        String plainNewAccessToken = generateToken(user, existingToken.getId());
        Date newExpiryTime = extractTokenExpiry(plainNewAccessToken);
        String encryptedNewAccessToken = encryptionService.encryptToken(plainNewAccessToken);

        existingToken.setToken(encryptedNewAccessToken);
        existingToken.setExpiryTime(newExpiryTime);
        existingToken.setDescription("Refreshed at " + new Date());

        activeTokenRepository.save(existingToken);

        return AuthenticationResponse.builder()
            .token(encryptedNewAccessToken)
            .refreshToken(existingToken.getRefreshToken())
            .authenticated(true)
            .build();
      }
      // Both tokens expired, delete and create new ones
      else {
        activeTokenRepository.delete(existingToken);
      }
    }

    // Create new tokens if none exist or all expired
    String jwtId = UUID.randomUUID().toString();
    String plainAccessToken = generateToken(user, jwtId);
    String plainRefreshToken = generateRefreshToken(user, jwtId);

    Date expiryTime = extractTokenExpiry(plainAccessToken);
    Date expireRefreshTime = extractTokenExpiry(plainRefreshToken);

    // Encrypt tokens
    String encryptedAccessToken = encryptionService.encryptToken(plainAccessToken);
    String encryptedRefreshToken = encryptionService.encryptToken(plainRefreshToken);

    // Save encrypted tokens in database
    ActiveToken newToken = ActiveToken.builder()
        .id(jwtId)
        .token(encryptedAccessToken)
        .refreshToken(encryptedRefreshToken)
        .expiryTime(expiryTime)
        .expiryRefreshTime(expireRefreshTime)
        .username(user.getUsername())
        .description("Login with 2FA at " + new Date())
        .build();

    activeTokenRepository.save(newToken);

    // Return encrypted tokens to client
    return AuthenticationResponse.builder()
        .token(encryptedAccessToken)
        .refreshToken(encryptedRefreshToken)
        .authenticated(true)
        .build();
  }

  @Transactional
  public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
    String refreshToken = request.getRefreshToken();
    
    // Find the token record by refresh token
    ActiveToken tokenRecord = activeTokenRepository.findByRefreshToken(refreshToken)
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_REFRESH_TOKEN));
    
    // Verify refresh token is still valid
    Date currentTime = new Date();
    if (tokenRecord.getExpiryRefreshTime().before(currentTime)) {
      activeTokenRepository.delete(tokenRecord);
      throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
    }
    
    // Get username from refresh token
    String username;
    try {
      SignedJWT signedJWT = SignedJWT.parse(refreshToken);
      username = signedJWT.getJWTClaimsSet().getSubject();
    } catch (AppException e) {
        throw e;
      } catch (ParseException e) {
          log.error("Error parsing token: {}", e.getMessage(), e);
          throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
      } catch (Exception e) {
          // Keep this as fallback for truly unexpected exceptions
          log.error("Unexpected error refreshing token: {}", e.getMessage(), e);
          throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
      }
    
    // Find the user
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));
    
    // Generate new access token
    String newToken = generateToken(user, tokenRecord.getId());
    Date newExpiryTime = extractTokenExpiry(newToken);
    
    // Update the access token
    tokenRecord.setToken(newToken);
    tokenRecord.setExpiryTime(newExpiryTime);
    tokenRecord.setDescription("Refreshed at " + new Date());
    
    activeTokenRepository.save(tokenRecord);
    
    return TokenRefreshResponse.builder()
        .token(newToken)
        .refreshToken(refreshToken) // Return the same refresh token
        .refreshed(true)
        .build();
  }

  @Transactional
  public AuthenticationResponse authenticateWithCookies(AuthenticationRequest request, HttpServletResponse httpResponse) {
    User user = userRepository.findByUsername(request.getUsername())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

    boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
    if (!authenticated) {
        throw new AppException(ErrorCode.PASSWORD_MISMATCH);
    }

    if (!user.isActive()) {
        throw new AppException(ErrorCode.ACCOUNT_NOT_VERIFIED);
    }

    // Clean up expired tokens
    // activeTokenRepository.deleteAllByExpiryTimeBefore(new Date());
    // activeTokenRepository.deleteAllByExpiryRefreshTimeBefore(new Date());

    // Check for existing tokens
    Optional<ActiveToken> existingTokenOpt = activeTokenRepository.findByUsername(user.getUsername());

    if (existingTokenOpt.isPresent()) {
        ActiveToken existingToken = existingTokenOpt.get();
        Date currentTime = new Date();

        // If access token is still valid, reuse it
        if (existingToken.getExpiryTime().after(currentTime)) {
            log.info("Reusing existing valid token for user: {}", user.getUsername());
            cookieService.createRefreshTokenCookie(httpResponse, existingToken.getRefreshToken());
            return AuthenticationResponse.builder()
                .token(existingToken.getToken())
                .authenticated(true)
                .build();
        }
        // If access token expired but refresh token is valid, create new access token
        else if (existingToken.getExpiryRefreshTime().after(currentTime)) {
            log.info("Access token expired but refresh token valid. Generating new access token for user: {}", user.getUsername());
            String plainNewAccessToken = generateToken(user, existingToken.getId());
            Date newExpiryTime = extractTokenExpiry(plainNewAccessToken);
            String encryptedNewAccessToken = encryptionService.encryptToken(plainNewAccessToken);

            existingToken.setToken(encryptedNewAccessToken);
            existingToken.setExpiryTime(newExpiryTime);
            existingToken.setDescription("Refreshed at " + new Date());

            activeTokenRepository.save(existingToken);
            cookieService.createRefreshTokenCookie(httpResponse, existingToken.getRefreshToken());
            return AuthenticationResponse.builder()
                .token(encryptedNewAccessToken)
                .authenticated(true)
                .build();
        }
        // Do not delete token here if it has expired; let it be cleaned up by scheduled task
    }

    // Create new tokens only if no valid token exists
    String jwtId = UUID.randomUUID().toString();
    String plainAccessToken, plainRefreshToken;

    try {
        plainAccessToken = generateToken(user, jwtId);
        plainRefreshToken = generateRefreshToken(user, jwtId);
    } catch (Exception e) {
        log.error("Error generating tokens for user {}: {}", user.getUsername(), e.getMessage());
        throw new AppException(ErrorCode.GENERAL_EXCEPTION);
    }

    Date expiryTime, expireRefreshTime;
    try {
        expiryTime = extractTokenExpiry(plainAccessToken);
        expireRefreshTime = extractTokenExpiry(plainRefreshToken);
    } catch (Exception e) {
        log.error("Error extracting token expiry: {}", e.getMessage());
        expiryTime = new Date(new Date().getTime() + TOKEN_EXPIRY_TIME);
        expireRefreshTime = new Date(new Date().getTime() + REFRESH_TOKEN_EXPIRY_TIME);
    }

    String encryptedAccessToken = encryptionService.encryptToken(plainAccessToken);
    String encryptedRefreshToken = encryptionService.encryptToken(plainRefreshToken);

    ActiveToken newToken = ActiveToken.builder()
        .id(jwtId)
        .token(encryptedAccessToken)
        .refreshToken(encryptedRefreshToken)
        .expiryTime(expiryTime)
        .expiryRefreshTime(expireRefreshTime)
        .username(user.getUsername())
        .description("Login at " + new Date())
        .build();

    activeTokenRepository.save(newToken);
    cookieService.createRefreshTokenCookie(httpResponse, encryptedRefreshToken);

    return AuthenticationResponse.builder()
        .token(encryptedAccessToken)
        .authenticated(true)
        .build();
}
  
  @Transactional
  public AuthenticationResponse authenticateWithCookies(String username, HttpServletResponse httpResponse) {
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

    // Clean up expired tokens
    // activeTokenRepository.deleteAllByExpiryTimeBefore(new Date());
    // activeTokenRepository.deleteAllByExpiryRefreshTimeBefore(new Date());

    // Check for existing tokens
    Optional<ActiveToken> existingTokenOpt = activeTokenRepository.findByUsername(user.getUsername());

    if (existingTokenOpt.isPresent()) {
      ActiveToken existingToken = existingTokenOpt.get();
      Date currentTime = new Date();

      // If access token is still valid, reuse it
      if (existingToken.getExpiryTime().after(currentTime)) {
        log.info("Reusing existing valid token for user: {}", username);
        cookieService.createRefreshTokenCookie(httpResponse, existingToken.getRefreshToken());
        return AuthenticationResponse.builder()
            .token(existingToken.getToken())
            .authenticated(true)
            .build();
      }
      // If access token expired but refresh token is valid, create new access token
      else if (existingToken.getExpiryRefreshTime().after(currentTime)) {
        log.info("Access token expired but refresh token valid. Generating new access token for user: {}", username);
        String plainNewAccessToken = generateToken(user, existingToken.getId());
        Date newExpiryTime = extractTokenExpiry(plainNewAccessToken);
        String encryptedNewAccessToken = encryptionService.encryptToken(plainNewAccessToken);

        existingToken.setToken(encryptedNewAccessToken);
        existingToken.setExpiryTime(newExpiryTime);
        existingToken.setDescription("OAuth Refreshed at " + new Date());

        activeTokenRepository.save(existingToken);
        cookieService.createRefreshTokenCookie(httpResponse, existingToken.getRefreshToken());
        return AuthenticationResponse.builder()
            .token(encryptedNewAccessToken)
            .authenticated(true)
            .build();
      }
      // Do not delete token here if it has expired
    }

    // Create new tokens only if no valid token exists
    String jwtId = UUID.randomUUID().toString();
    String plainAccessToken, plainRefreshToken;

    try {
      plainAccessToken = generateToken(user, jwtId);
      plainRefreshToken = generateRefreshToken(user, jwtId);
    } catch (Exception e) {
      log.error("Error generating tokens for OAuth user {}: {}", username, e.getMessage());
      throw new AppException(ErrorCode.GENERAL_EXCEPTION);
    }

    Date expiryTime, expireRefreshTime;
    try {
      expiryTime = extractTokenExpiry(plainAccessToken);
      expireRefreshTime = extractTokenExpiry(plainRefreshToken);
    } catch (Exception e) {
      log.error("Error extracting token expiry: {}", e.getMessage());
      expiryTime = new Date(new Date().getTime() + TOKEN_EXPIRY_TIME);
      expireRefreshTime = new Date(new Date().getTime() + REFRESH_TOKEN_EXPIRY_TIME);
    }

    String encryptedAccessToken = encryptionService.encryptToken(plainAccessToken);
    String encryptedRefreshToken = encryptionService.encryptToken(plainRefreshToken);

    ActiveToken newToken = ActiveToken.builder()
        .id(jwtId)
        .token(encryptedAccessToken)
        .refreshToken(encryptedRefreshToken)
        .expiryTime(expiryTime)
        .expiryRefreshTime(expireRefreshTime)
        .username(user.getUsername())
        .description("OAuth Login with dynamic key at " + new Date())
        .build();

    activeTokenRepository.save(newToken);
    cookieService.createRefreshTokenCookie(httpResponse, encryptedRefreshToken);

    return AuthenticationResponse.builder()
        .token(encryptedAccessToken)
        .authenticated(true)
        .build();
  }
  
@Transactional
  public RefreshTokenResponse refreshTokenFromCookie(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
    try {
        // 1. Get the encrypted refresh token from cookie
        String encryptedRefreshToken = cookieService.getRefreshTokenFromCookies(httpRequest);
        
        if (encryptedRefreshToken == null) {
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        
        // 2. Decrypt it to get the plain JWT
        String plainRefreshToken = encryptionService.decryptToken(encryptedRefreshToken);
        
        // 3. Extract username from the plain JWT
        String username = extractUsernameFromJwt(plainRefreshToken);
        if (username == null) {
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        
        // 4. Find token record by username
        Optional<ActiveToken> tokenOpt = activeTokenRepository.findByUsername(username);
        if (!tokenOpt.isPresent()) {
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        
        ActiveToken tokenRecord = tokenOpt.get();
        
        // 5. Verify encrypted tokens match
        if (!tokenRecord.getRefreshToken().equals(encryptedRefreshToken)) {
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        
        // 6. Verify refresh token is still valid
        Date currentTime = new Date();
        if (tokenRecord.getExpiryRefreshTime().before(currentTime)) {
            activeTokenRepository.delete(tokenRecord);
            cookieService.deleteRefreshTokenCookie(httpResponse);
            throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }
        
        // 7. Get the user
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));
        
        // 8. Generate new plain JWT access token
        String plainNewAccessToken = generateToken(user, tokenRecord.getId());
        Date newExpiryTime = extractTokenExpiry(plainNewAccessToken);
        
        // 9. Encrypt new token for storage and client
        String encryptedNewAccessToken = encryptionService.encryptToken(plainNewAccessToken);
        
        // 10. Update stored token
        tokenRecord.setToken(encryptedNewAccessToken);
        tokenRecord.setExpiryTime(newExpiryTime);
        tokenRecord.setDescription("Refreshed at " + new Date());
        
        activeTokenRepository.save(tokenRecord);
        
        // 11. Return only the access token in the response body
        return RefreshTokenResponse.builder()
            .token(encryptedNewAccessToken)
            .authenticated(true)
            .refreshed(true)
            .build();
    } catch (AppException e) {
        throw e;
    } catch (Exception e) {
        log.error("Error refreshing token: {}", e.getMessage(), e);
        throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
    }
}

  @Transactional
  public ApiResponse<Void> logoutWithCookies(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
    try {
      // Get the encrypted refresh token from cookie
      String encryptedRefreshToken = cookieService.getRefreshTokenFromCookies(httpRequest);

      if (encryptedRefreshToken != null) {
        // Decrypt to get username
        String plainRefreshToken = encryptionService.decryptToken(encryptedRefreshToken);
        // Verify token and extract UUID
        SignedJWT signedToken = SignedJWT.parse(plainRefreshToken); // Giả sử bạn có hàm verify token
        String uuid = signedToken.getJWTClaimsSet().getJWTID();

        if (uuid != null) {
          // Delete token from database
          activeTokenRepository.deleteByUsername(uuid);
        }
      }

      // Clear the cookie regardless of token validity
      cookieService.deleteRefreshTokenCookie(httpResponse);

      return ApiResponse.<Void>builder()
          .message("Logged out successfully")
          .build();
  } catch (ParseException e) {
      log.error("Error parsing JWT token: {}", e.getMessage(), e);
      return null;
  } catch (Exception e) {
      // Still clear cookie even if error occurs
      cookieService.deleteRefreshTokenCookie(httpResponse);

      log.error("Error during logout: {}", e.getMessage());
      return ApiResponse.<Void>builder()
          .message("Logged out successfully")
          .build();
  }
}
  
  @Transactional
  public ApiResponse<Void> resetPassword(ResetPasswordRequest request) {
    User user = userRepository.findByUsername(request.getUsername())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

    String encodedPassword = passwordEncoder.encode(request.getNewPassword());
    user.setPassword(encodedPassword);
    userRepository.save(user);

    return ApiResponse.<Void>builder()
        .message("Password reset successfully!")
        .build();
  }

  @Transactional
  public ApiResponse<Void> initiatePasswordReset(ForgotPasswordRequest request) {
    User user = userRepository.findByUsername(request.getUsername())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

    // Verify email matches
    if (!user.getEmail().equals(request.getEmail())) {
      throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
    }

    // Check for existing token and delete it
    passwordResetTokenRepository.findByUsernameAndUsed(user.getUsername(), false)
        .ifPresent(token -> passwordResetTokenRepository.delete(token));

    // Generate random 6-digit code
    String resetCode = generateSixDigitCode();

    // Create new token valid for 15 minutes
    PasswordResetToken resetToken = PasswordResetToken.builder()
        .token(resetCode)
        .username(user.getUsername())
        .email(user.getEmail())
        .expiryDate(LocalDateTime.now().plusMinutes(15))
        .used(false)
        .build();

    passwordResetTokenRepository.save(resetToken);

    // Send HTML email with styled verification code
    emailService.sendPasswordResetEmail(
        user.getEmail(),
        user.getFirstname(),
        resetCode);

    return ApiResponse.<Void>builder()
        .message("Password reset code has been sent to your email")
        .build();
  }

  @Transactional
  public ApiResponse<Void> resetPasswordWithToken(VerifyResetTokenRequest request) {
    PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN));

    // Check if token is expired
    if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
      passwordResetTokenRepository.delete(resetToken);
      throw new AppException(ErrorCode.INVALID_TOKEN);
    }

    // Check if token has been used
    if (resetToken.isUsed()) {
      throw new AppException(ErrorCode.INVALID_TOKEN);
    }

    // Get the user and update password
    User user = userRepository.findByUsername(resetToken.getUsername())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

    String encodedPassword = passwordEncoder.encode(request.getNewPassword());
    user.setPassword(encodedPassword);
    userRepository.save(user);

    // Mark token as used
    resetToken.setUsed(true);
    passwordResetTokenRepository.save(resetToken);

    return ApiResponse.<Void>builder()
        .message("Password has been reset successfully")
        .build();
  }

  @Transactional(rollbackFor = Exception.class)
  public ApiResponse<Void> register(UserCreationRequest request) {
    log.info("Processing registration request for username: {}, email: {}", request.getUsername(), request.getEmail());
    
    try {
      // Check if username exists
      log.info("Checking if username exists: {}", request.getUsername());
      if (userRepository.existsByUsername(request.getUsername())) {
        log.warn("Username already exists: {}", request.getUsername());
        throw new AppException(ErrorCode.USER_EXISTS);
      }
      
      // Check if email exists - ENSURE THIS CHECK HAPPENS FOR ALL ACCOUNTS
      String email = request.getEmail();
      log.info("Checking if email exists: {}", email);
      boolean emailExists = userRepository.existsByEmail(email);
      
      if (emailExists) {
        // Get the user with this email to check if it's verified
        log.info("Email exists, checking if account is verified: {}", email);
        Optional<User> existingUserWithEmail = userRepository.findByEmail(email);
        
        if (existingUserWithEmail.isPresent()) {
          User existingUser = existingUserWithEmail.get();
          
          // If account is already verified, ALWAYS return error
          if (existingUser.isActive()) {
            log.warn("Registration attempt with already verified email: {}", email);
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
          }
          
          // If not verified, delete the old account
          log.info("Found unverified account with email {}, preparing to delete", email);
          try {
            // Get user ID for logging
            UUID userId = existingUser.getId();
            String username = existingUser.getUsername();
            log.info("Deleting unverified account - ID: {}, username: {}", userId, username);
            
            // Check for verification tokens
            log.info("Checking for verification tokens for username: {}", username);
            Optional<EmailVerificationToken> token = emailVerificationTokenRepository.findByUsernameAndUsed(username, false);
            
            // Delete token if exists
            if (token.isPresent()) {
              log.info("Deleting verification token for username: {}", username);
              emailVerificationTokenRepository.delete(token.get());
              emailVerificationTokenRepository.flush(); // Ensure deletion is committed
            } else {
              log.info("No verification token found for username: {}", username);
            }
            
            // Delete the user
            log.info("Deleting user with ID: {}", userId);
            userRepository.delete(existingUser);
            userRepository.flush(); // Ensure deletion is committed
            log.info("Successfully deleted unverified user with email: {}", email);
          } catch (Exception e) {
            log.error("Error while cleaning up unverified account: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.GENERAL_EXCEPTION);
          }
        } else {
          // This is an edge case - email exists but user not found
          log.error("Email exists in database but user not found: {}", email);
          throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
      } else {
        log.info("Email does not exist yet: {}", email);
      }
      
      // Continue with normal registration process
      log.info("Creating new user entity for: {}", request.getUsername());
      User user = userMapper.toUser(request);
      user.setPassword(passwordEncoder.encode(request.getPassword()));
      
      // Set active status
      user.setActive(Boolean.TRUE.equals(request.getActive()));
      log.info("Setting active status: {}", user.isActive());
      
      // Set default role as USER if roles are not provided or empty
      List<String> roles = request.getRoles();
      if (roles == null || roles.isEmpty()) {
        log.info("No roles provided, setting default USER role");
        roles = new ArrayList<>();
        roles.add(ENUMS.Role.USER.name());
      } else {
        log.info("Using provided roles: {}", roles);
      }
      
      // Fetch Role entities based on role names
      log.info("Fetching role entities from database");
      Set<Role> roleEntities = roles.stream()
          .map(roleName -> {
            log.info("Finding role: {}", roleName);
            return roleRepository.findByName(roleName)
                .orElseThrow(() -> {
                  log.error("Role not found: {}", roleName);
                  return new AppException(ErrorCode.ROLE_NOT_FOUND);
                });
          })
          .collect(Collectors.toSet());
      user.setRoles(roleEntities);
      
      log.info("Saving new user to database: {}", user.getUsername());
      user = userRepository.save(user);
      userRepository.flush();
      log.info("User saved successfully with ID: {}", user.getId());
      
      if (!user.isActive()) {
        log.info("User not active, sending verification email to: {}", user.getEmail());
        // Generate verification code and send email
        String verificationCode = generateSixDigitCode();
        log.info("Generated verification code for user: {}", user.getUsername());
        
        log.info("Creating verification token for user: {}", user.getUsername());
        // Create new token valid for 15 minutes
        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
            .token(verificationCode)
            .username(user.getUsername())
            .email(user.getEmail())
            .expiryDate(LocalDateTime.now().plusMinutes(15))
            .used(false)
            .build();
        
        log.info("Saving verification token to database");
        emailVerificationTokenRepository.save(verificationToken);
        emailVerificationTokenRepository.flush();
        
        // Send verification email
        log.info("Sending verification email to: {}", user.getEmail());
        try {
          emailService.sendEmailVerificationCode(
              user.getEmail(),
              user.getFirstname(),
              verificationCode);
          log.info("Verification email sent successfully");
        } catch (Exception e) {
          log.error("Failed to send verification email: {}", e.getMessage(), e);
          // Continue without throwing exception, user was created but email failed
        }
      }
      
      log.info("Registration completed successfully for: {}", user.getUsername());
      return ApiResponse.<Void>builder()
          .message("User registered successfully! Please check your email to verify your account.")
          .build();
    } catch (AppException e) {
      // Let AppExceptions propagate with their specific error code
      log.warn("Registration failed with AppException: {}", e.getMessage());
      throw e;
    } catch (Exception e) {
      // Log and wrap any other exceptions
      log.error("Unexpected error during registration: {}", e.getMessage(), e);
      throw new AppException(ErrorCode.GENERAL_EXCEPTION);
    }
  }

  @Transactional
  public ApiResponse<Void> verifyEmail(VerifyEmailRequest request) {
    EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(request.getToken())
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN));

    // Check if token is for the correct user
    if (!verificationToken.getUsername().equals(request.getUsername())) {
      throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
    }

    // Check if token is expired
    if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
      emailVerificationTokenRepository.delete(verificationToken);
      throw new AppException(ErrorCode.INVALID_TOKEN);
    }

    // Check if token has been used
    if (verificationToken.isUsed()) {
      throw new AppException(ErrorCode.INVALID_TOKEN);
    }

    // Get the user and update active status
    User user = userRepository.findByUsername(verificationToken.getUsername())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

    user.setActive(true);
    userRepository.save(user);

    // Mark token as used
    verificationToken.setUsed(true);
    emailVerificationTokenRepository.save(verificationToken);

    return ApiResponse.<Void>builder()
        .message("Email verified successfully. You can now log in.")
        .build();
  }

  @Transactional
  public ApiResponse<Void> requestEmailChange(EmailChangeRequest request) {
    log.info("Starting email change request for userId: {}, from: {} to: {}", 
        request.getUserId(), request.getCurrentEmail(), request.getNewEmail());
    
    // Find the user
    User user = userRepository.findById(UUID.fromString(request.getUserId()))
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));
    log.info("User found: {} (username: {})", user.getId(), user.getUsername());
    
    // Verify the current password
    boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
    log.info("Password authentication result: {}", authenticated);
    if (!authenticated) {
        log.warn("Password mismatch for user: {}", user.getUsername());
        throw new AppException(ErrorCode.PASSWORD_MISMATCH);
    }
    
    // Check if the new email already exists for another user
    boolean emailExists = userRepository.existsByEmail(request.getNewEmail());
    boolean isSameEmail = user.getEmail().equalsIgnoreCase(request.getNewEmail());
    log.info("New email exists check: exists={}, isSameEmail={}", emailExists, isSameEmail);
    
    if (emailExists && !isSameEmail) {
        log.warn("Email {} already exists for another user", request.getNewEmail());
        throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }
    
    // Check if there's an existing token for this email change request
    Optional<EmailChangeToken> existingToken = emailChangeTokenRepository
        .findByUserIdAndNewEmailAndUsed(request.getUserId(), request.getNewEmail(), false);
    log.info("Existing unused token found: {}", existingToken.isPresent());
    
    existingToken.ifPresent(token -> {
        log.info("Deleting existing token: {}", token.getToken());
        emailChangeTokenRepository.delete(token);
    });
    
    // Generate verification code
    String verificationCode = generateSixDigitCode();
    log.info("Generated verification code: {}", verificationCode);
    
    // Create token record valid for 15 minutes
    EmailChangeToken emailChangeToken = EmailChangeToken.builder()
        .token(verificationCode)
        .username(user.getUsername())
        .userId(user.getId().toString())
        .currentEmail(user.getEmail())
        .newEmail(request.getNewEmail())
        .expiryDate(LocalDateTime.now().plusMinutes(15))
        .used(false)
        .build();
    
    EmailChangeToken savedToken = emailChangeTokenRepository.save(emailChangeToken);
    log.info("Email change token saved with ID: {}, expiry: {}", 
        savedToken.getToken(), savedToken.getExpiryDate());
    
    // Send verification email to the NEW email address
    try {
        log.info("Attempting to send verification email to: {}", request.getNewEmail());
        emailService.sendEmailChangeVerification(
            request.getNewEmail(),
            user.getFirstname(),
            verificationCode
        );
        log.info("Email sent successfully to: {}", request.getNewEmail());
    } catch (Exception e) {
        log.error("Failed to send verification email: {}", e.getMessage(), e);
        // You may want to decide whether to throw this exception or continue
    }

    log.info("Email change request completed successfully");
    return ApiResponse.<Void>builder()
        .message("Verification code has been sent to your new email address.")
        .build();
}
    
  @Transactional
  public ApiResponse<Void> verifyEmailChange(VerifyEmailChangeRequest request) {
    // Find the token
    EmailChangeToken token = emailChangeTokenRepository.findByToken(request.getVerificationCode())
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN));

    // Validate token belongs to the right user
    if (!token.getUserId().equals(request.getUserId())) {
      throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
    }

    // Check new email matches
    if (!token.getNewEmail().equals(request.getNewEmail())) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    // Check if token is expired
    if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
      emailChangeTokenRepository.delete(token);
      throw new AppException(ErrorCode.INVALID_TOKEN);
    }

    // Check if token has already been used
    if (token.isUsed()) {
      throw new AppException(ErrorCode.INVALID_TOKEN);
    }

    // Update the user's email
    User user = userRepository.findById(UUID.fromString(request.getUserId()))
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

    // Get current email from token before updating
    String currentEmail = token.getCurrentEmail();

    user.setEmail(request.getNewEmail());
    User savedUser = userRepository.save(user);
    log.info("User email updated to: {}", savedUser.getEmail());

    // Mark token as used
    token.setUsed(true);
    emailChangeTokenRepository.save(token);

    // Get all active tokens for this user
    List<ActiveToken> userTokens = activeTokenRepository.findAllByUsername(user.getUsername());

    // Update token descriptions if needed
    for (ActiveToken activeToken : userTokens) {
      // Option: update token description if it contains the email
      if (activeToken.getDescription() != null &&
          activeToken.getDescription().contains(currentEmail)) {
        activeToken.setDescription(
            activeToken.getDescription().replace(
                currentEmail, request.getNewEmail()));
        activeTokenRepository.save(activeToken);
      }
    }

    log.info("Updated tokens for user {} after email change", user.getUsername());

    return ApiResponse.<Void>builder()
        .message("Your email has been successfully updated.")
        .build();
  }

  @Transactional
  public ApiResponse<Void> resendVerificationEmail(ResendVerificationRequest request) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String username = authentication.getName();
    
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

    // Delete any existing verification tokens for this user
    emailVerificationTokenRepository.findByUsernameAndUsed(user.getUsername(), false)
        .ifPresent(token -> emailVerificationTokenRepository.delete(token));

    // Generate a new verification code
    String verificationCode = generateSixDigitCode();

    // Create new token valid for 15 minutes
    EmailVerificationToken verificationToken = EmailVerificationToken.builder()
        .token(verificationCode)
        .username(user.getUsername())
        .email(user.getEmail())
        .expiryDate(LocalDateTime.now().plusMinutes(15))
        .used(false)
        .build();

    emailVerificationTokenRepository.save(verificationToken);

    // Send verification email
    emailService.sendEmailVerificationCode(
        user.getEmail(),
        user.getFirstname(),
        verificationCode);

    return ApiResponse.<Void>builder()
        .message("Verification code has been sent to your email.")
        .build();
  }

  @Transactional
  public void logout(LogoutRequest request) throws ParseException, JOSEException {
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    String formattedDate = sdf.format(new Date());
    String token = request.getToken();
    SignedJWT signedToken = verifyToken(token);

    // Retrieve the existing UUID from the token claims
    String uuid = signedToken.getJWTClaimsSet().getJWTID();
    
    // Delete all expired tokens
    //activeTokenRepository.deleteAllByExpiryTimeBefore(new Date());

    // Find the existing ActiveToken by UUID
    Optional<ActiveToken> existingTokenOpt = activeTokenRepository.findById(uuid);
    if (existingTokenOpt.isPresent()) {
      // Update description field
      ActiveToken existingToken = existingTokenOpt.get();
      existingToken.setDescription("Logged OUT at: " + formattedDate);
      activeTokenRepository.save(existingToken);
      activeTokenRepository.flush();
    } else {
      throw new AppException(ErrorCode.INVALID_TOKEN);
    }
  }

  @Transactional
  public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
    try {
        // 1. Get the encrypted refresh token from client
        String encryptedRefreshToken = request.getToken();
        
        // 2. Decrypt it to get the plain JWT
        String plainRefreshToken = encryptionService.decryptToken(encryptedRefreshToken);
        
        // 3. Extract username from the plain JWT
        String username = extractUsernameFromJwt(plainRefreshToken);
        if (username == null) {
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        
        // 4. Find token record by username
        Optional<ActiveToken> tokenOpt = activeTokenRepository.findByUsername(username);
        if (!tokenOpt.isPresent()) {
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        
        ActiveToken tokenRecord = tokenOpt.get();
        
        // 5. Verify encrypted tokens match
        if (!tokenRecord.getRefreshToken().equals(encryptedRefreshToken)) {
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        
        // 6. Verify refresh token is still valid
        Date currentTime = new Date();
        if (tokenRecord.getExpiryRefreshTime().before(currentTime)) {
            activeTokenRepository.delete(tokenRecord);
            throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }
        
        // 7. Get the user
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));
        
        // 8. Generate new plain JWT access token
        String plainNewAccessToken = generateToken(user, tokenRecord.getId());
        Date newExpiryTime = extractTokenExpiry(plainNewAccessToken);
        
        // 9. Encrypt new token for storage and client
        String encryptedNewAccessToken = encryptionService.encryptToken(plainNewAccessToken);
        
        // 10. Update stored token
        tokenRecord.setToken(encryptedNewAccessToken);
        tokenRecord.setExpiryTime(newExpiryTime);
        tokenRecord.setDescription("Refreshed at " + new Date());
        
        activeTokenRepository.save(tokenRecord);
        
        // 11. Return encrypted tokens to client
        return RefreshTokenResponse.builder()
            .token(encryptedNewAccessToken)
            .refreshToken(encryptedRefreshToken) // Return same encrypted refresh token
            .authenticated(true)
            .refreshed(true)
            .build();
    } catch (AppException e) {
        throw e;
    } catch (Exception e) {
        log.error("Error refreshing token: {}", e.getMessage(), e);
        throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
    }
}

  private String extractUsernameFromJwt(String token) {
  try {
    SignedJWT signedJWT = SignedJWT.parse(token);
    return signedJWT.getJWTClaimsSet().getSubject();
  } catch (ParseException e) {
      log.error("Error parsing JWT token: {}", e.getMessage(), e);
      return null;
  } catch (Exception e) {
    log.error("Error extracting username from token", e);
    return null;
  }
}

  @Transactional
  public ApiResponse<Void> logout(String authToken) {
    String token = authToken;
    if (token.startsWith("Bearer ")) {
      token = token.substring(7);
    }
    
    try {
      Claims claims = extractAllClaims(token);
      String username = claims.getSubject();
      
      // Delete user tokens
      activeTokenRepository.deleteByUsername(username);
      
      return ApiResponse.<Void>builder()
          .message("Logged out successfully")
          .build();
    } catch (Exception e) {
      log.error("Error during logout: {}", e.getMessage());
      return ApiResponse.<Void>builder()
          .message("Logout failed")
          .build();
    }
  }

  public IntrospectResponse introspect(IntrospectRequest request) {
    String encryptedToken = request.getToken();

    // Detailed logging
    log.info("Introspect received token: {}", encryptedToken);
    log.info("Token length: {}", encryptedToken != null ? encryptedToken.length() : 0);

    if (encryptedToken == null || encryptedToken.isEmpty()) {
      log.warn("Introspection request with null or empty token");
      return IntrospectResponse.builder().valid(false).build();
    }

    // Log the first few characters to diagnose issues
    log.debug("Introspect token received (first 10 chars): {}",
        encryptedToken.substring(0, Math.min(10, encryptedToken.length())));

    try {
            // 1. First decrypt the token received from the client
      encryptedToken = encryptedToken.trim();
              // Sanitize before decrypting (same logic as in decryptToken)
        String sanitizedToken = encryptedToken.trim()
            .replace(" ", "+")
            .replace("\n", "")
            .replace("\r", "")
            .replace("\t", "");


      String plainJwtToken = encryptionService.decryptToken(sanitizedToken );

      // 2. Verify the decrypted JWT token
      verifyToken(plainJwtToken);

      // 3. Also verify it exists in our database
      String username = tokenSecurity.extractUsernameFromToken(plainJwtToken);
      if (username == null) {
            return IntrospectResponse.builder().valid(false).build();
      }
      
        Optional<ActiveToken> tokenOpt = activeTokenRepository.findByUsername(username);
        if (!tokenOpt.isPresent() || tokenOpt.get().getExpiryTime().before(new Date())) {
            return IntrospectResponse.builder().valid(false).build();
        }
        return IntrospectResponse.builder().valid(true).build();
    } catch (ParseException | JOSEException e) {
      log.error("Error parsing or validating JWT token: {}", e.getMessage(), e);
      return IntrospectResponse.builder().valid(false).build();
    }
}

  private SignedJWT verifyToken(String token) throws ParseException, JOSEException {
    SignedJWT signedJWT = SignedJWT.parse(token);

    // Trích xuất thông tin cho dynamic key
    String userIdStr = signedJWT.getJWTClaimsSet().getStringClaim("userId");
    String refreshExpiryStr = signedJWT.getJWTClaimsSet().getStringClaim("refreshExpiry");

    boolean verified = false;

    // Trường hợp 1: Token mới với dynamic key
    if (userIdStr != null && !userIdStr.isEmpty() &&
        refreshExpiryStr != null && !refreshExpiryStr.isEmpty()) {
      try {
        UUID userId = UUID.fromString(userIdStr);

        // Parse the refresh expiry
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
        Date refreshExpiry = sdf.parse(refreshExpiryStr);

        // Compute dynamic key
        byte[] dynamicKey = jwtUtils.computeDynamicSecretKey(userId, refreshExpiry);
        JWSVerifier dynamicVerifier = new MACVerifier(dynamicKey);

        verified = signedJWT.verify(dynamicVerifier);

        if (verified) {
          log.debug("Token verified with dynamic key for user: {}", userIdStr);
          Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
          verified = expiryTime.after(new Date());
        }
      } catch (ParseException | JOSEException e) {
        log.warn("Error verifying with dynamic key: {}", e.getMessage());
        verified = false;
      }
    }

    // Trường hợp 2: Token cũ hoặc OAuth token
    if (!verified) {
      try {
        JWSVerifier staticVerifier = new MACVerifier(jwtUtils.getSecretKeyBytes());
        verified = signedJWT.verify(staticVerifier);

        if (verified) {
          log.debug("Token verified with static key");
          Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
          verified = expiryTime.after(new Date());
        }
      } catch (ParseException | JOSEException e) {
        log.warn("Error verifying with static key: {}", e.getMessage());
        verified = false;
      }
    }

    // Trường hợp 3: Token không xác thực được
    if (!verified) {
      log.error("Token validation failed completely");
      throw new AppException(ErrorCode.INVALID_TOKEN);
    }

    return signedJWT;
  }

  public String generateToken(User user, String jwtId) {
    try {
        // Compute expiry times
        Date tokenExpiry = new Date(new Date().getTime() + TOKEN_EXPIRY_TIME);
        Date refreshExpiry = new Date(new Date().getTime() + REFRESH_TOKEN_EXPIRY_TIME);
        
        // Format refresh expiry for claim
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
        String refreshExpiryStr = sdf.format(refreshExpiry);
        
        // Compute dynamic key
        byte[] secretKey = jwtUtils.computeDynamicSecretKey(user.getId(), refreshExpiry);
        
        JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
            .subject(user.getUsername())
            .claim("userId", user.getId().toString())
            .claim("refreshExpiry", refreshExpiryStr) // Include for verification
            .issuer("tommem.com")
            .issueTime(new Date())
            .expirationTime(tokenExpiry)
            .jwtID(jwtId)
            .claim("scope", buildScope(user))
            .build();
        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(jwsHeader, payload);
        jwsObject.sign(new MACSigner(secretKey));
        String token = jwsObject.serialize();

        return token;
    } catch (JOSEException e) {
        log.error("Error generating token: {}", e.getMessage(), e);
        return null;
    }
}

 private String generateRefreshToken(User user, String jwtId) {
    try {
        Date refreshExpiry = new Date(new Date().getTime() + REFRESH_TOKEN_EXPIRY_TIME);
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
        String refreshExpiryStr = sdf.format(refreshExpiry);
        
        // Use same dynamic key algorithm
        byte[] secretKey = jwtUtils.computeDynamicSecretKey(user.getId(), refreshExpiry);
        
        JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
            .subject(user.getUsername())
            .claim("userId", user.getId().toString())
            .claim("refreshExpiry", refreshExpiryStr)
            .issuer("tommem.com")
            .issueTime(new Date())
            .expirationTime(refreshExpiry)
            .jwtID(jwtId)
            .claim("scope", buildScope(user))
            .build();
        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(jwsHeader, payload);
        jwsObject.sign(new MACSigner(secretKey));
        
        return jwsObject.serialize();
    } catch (JOSEException e) {
        log.error("Error generating refresh token: {}", e.getMessage(), e);
        return null;
    }
}

  // Add this new method for OAuth tokens with longer expiry time
  private String generateOAuthToken(User user, String jwtId, long expiryTimeMillis) {
    try {
      // Tính toán ngày hết hạn
      Date tokenExpiry = new Date(new Date().getTime() + expiryTimeMillis);
      Date refreshExpiry = new Date(new Date().getTime() + REFRESH_TOKEN_EXPIRY_TIME);

      // Format refresh expiry for claim
      SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
      String refreshExpiryStr = sdf.format(refreshExpiry);

      // Compute dynamic key
      byte[] secretKey = jwtUtils.computeDynamicSecretKey(user.getId(), refreshExpiry);

      JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);
      JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
          .subject(user.getUsername())
          .claim("userId", user.getId().toString())
          .claim("refreshExpiry", refreshExpiryStr)
          .issuer("tommem.com")
          .issueTime(new Date())
          .expirationTime(tokenExpiry)
          .jwtID(jwtId)
          .claim("scope", buildScope(user))
          .claim("tokenSource", "oauth")
          .build();
      Payload payload = new Payload(jwtClaimsSet.toJSONObject());

      JWSObject jwsObject = new JWSObject(jwsHeader, payload);
      jwsObject.sign(new MACSigner(secretKey));
      return jwsObject.serialize();
    } catch (JOSEException e) {
      log.error("Error generating OAuth token: {}", e.getMessage(), e);
      return null;
    }
  }

  private String buildScope(User user) {
    // Build the scope based on user roles
    StringJoiner scopeJoiner = new StringJoiner(" ");
    if (!CollectionUtils.isEmpty(user.getRoles())) {
      user.getRoles().forEach(role -> {
        scopeJoiner.add("ROLE_" + role.getName());
        if (!CollectionUtils.isEmpty(role.getPermissions())) {
          role.getPermissions()
              .forEach(permission -> scopeJoiner.add(permission.getName()));
        }
      });
    }
    return scopeJoiner.toString();
  }

  private Date extractTokenExpiry(String token) {
      try {
          // Đầu tiên parse JWT để lấy thông tin mà không cần verify
          SignedJWT signedJWT = SignedJWT.parse(token);
          
          // Trực tiếp trả về thời hạn của token mà không cần kiểm tra thêm
          return signedJWT.getJWTClaimsSet().getExpirationTime();
      } catch (ParseException e) {
          // Nếu không parse được bằng phương pháp trên, thử với cách cũ
          log.warn("Error parsing token with SignedJWT, falling back to static method: {}", e.getMessage());
          try {
              Claims claims = Jwts.parser()
                  .verifyWith(Keys.hmacShaKeyFor(jwtUtils.getSecretKeyBytes()))
                  .build()
                  .parseSignedClaims(token)
                  .getPayload();
              return claims.getExpiration();
          } catch (io.jsonwebtoken.security.SecurityException ex) {
              log.error("Failed to extract token expiry: {}", ex.getMessage());
              return new Date(System.currentTimeMillis() - 1000);
          } catch (io.jsonwebtoken.JwtException ex) {
              log.error("Failed to extract token expiry: {}", ex.getMessage());
              return new Date(System.currentTimeMillis() - 1000);
          }
      }
  }

  private Claims extractAllClaims(String token) {
    try {
      // Thử trực tiếp với parser của JJWT
      return Jwts.parser()
          .verifyWith(Keys.hmacShaKeyFor(jwtUtils.getSecretKeyBytes()))
          .build()
          .parseSignedClaims(token)
          .getPayload();
    } catch (io.jsonwebtoken.JwtException e) {
      log.warn("Error parsing token with JJWT parser: {}", e.getMessage());
      throw new AppException(ErrorCode.INVALID_TOKEN);
    }
  }

  private String generateSixDigitCode() {
    Random random = new Random();
    int code = 100000 + random.nextInt(900000); 
    return String.valueOf(code);
  }

    // Scheduled task to clean up expired tokens
  @Scheduled(cron = "${cleanup.cron.expression}")
  @Transactional
  public void cleanupExpiredTokens() {
    log.info("Running scheduled token cleanup...");

    try {
      // Get current dates
      java.util.Date now = new java.util.Date();
      LocalDateTime nowDateTime = LocalDateTime.now();

      // Log token counts before deletion
      long totalTokensBeforeCleanup = activeTokenRepository.count();
      long expiredAccessTokens = activeTokenRepository.countByExpiryTimeBefore(now);
      long passwordTokensBefore = passwordResetTokenRepository.count(); // Add this line

      log.info("Before cleanup: {} total tokens, {} expired access tokens found, {} password tokens",
          totalTokensBeforeCleanup, expiredAccessTokens, passwordTokensBefore);

      // Execute deletion queries
      log.info("Deleting expired access tokens...");
      int deletedAccessTokens = activeTokenRepository.deleteByExpiryTimeBefore(now);

      log.info("Deleting expired refresh tokens...");
      int deletedRefreshTokens = activeTokenRepository.deleteByExpiryRefreshTimeBefore(now);

      // For password reset tokens
      log.info("Deleting expired password reset tokens...");
      passwordResetTokenRepository.deleteByExpiryDateBefore(nowDateTime);
      long passwordTokensAfter = passwordResetTokenRepository.count();
      int deletedPasswordTokens = (int) (passwordTokensBefore - passwordTokensAfter);

      // Log results
      long remainingTokens = activeTokenRepository.count();
      log.info("Cleanup completed: Deleted {} access tokens, {} refresh tokens, {} password tokens",
          deletedAccessTokens, deletedRefreshTokens, deletedPasswordTokens);
      log.info("After cleanup: {} tokens remain in database", remainingTokens);

      if (totalTokensBeforeCleanup == remainingTokens && expiredAccessTokens > 0) {
        log.warn("Warning: Found expired tokens but none were deleted!");
      }
    } catch (Exception e) {
      log.error("Error during token cleanup: {}", e.getMessage(), e);
    }
  }

}
