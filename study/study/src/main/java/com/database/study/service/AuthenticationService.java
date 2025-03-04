package com.database.study.service;

import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.database.study.dto.request.AuthenticationRequest;
import com.database.study.dto.request.ForgotPasswordRequest;
import com.database.study.dto.request.VerifyResetTokenRequest;
import com.database.study.dto.request.LogoutRequest;
import com.database.study.dto.request.ResetPasswordRequest;
import com.database.study.dto.request.TokenRefreshRequest;
import com.database.study.dto.request.UserCreationRequest;
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
import com.database.study.entity.PasswordResetToken;
import com.database.study.entity.Role;
import com.database.study.entity.User;
import com.database.study.enums.ENUMS;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.mapper.UserMapper;
import com.database.study.repository.EmailVerificationTokenRepository;
import com.database.study.repository.ActiveTokenRepository;
import com.database.study.repository.PasswordResetTokenRepository;
import com.database.study.repository.RoleRepository;
import com.database.study.repository.UserRepository;
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
import java.util.ArrayList;
import java.util.Base64;
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
  EncryptionService encryptionService;
  TokenSecurity tokenSecurity;

  // Protected static final byte[] SECRET_KEY_BYTES = generateSecretKey();
  protected static final byte[] SECRET_KEY_BYTES = Base64.getDecoder()
      .decode("2fl9V3Xl0ks5yX9dGuVHRV1H6ld9F0OjhrYhP7QvxqJrB/1OLKJHpPoMxSBcUe3EEC6Hq0kseMfUQlhK2w2yQA==");
  static final int SURPLUS_EXPIRE_TIME = 7;
  static final long TOKEN_EXPIRY_TIME = 1 * 60 * 1000; // 1 minutes
  static final long REFRESH_TOKEN_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days

  public static byte[] getSecretKeyBytes() {
    return SECRET_KEY_BYTES;
  }

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
    activeTokenRepository.deleteAllByExpiryTimeBefore(new Date());
    activeTokenRepository.deleteAllByExpiryRefreshTimeBefore(new Date());

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

        // Encrypt new token using TokenSecurity
        String encryptedNewAccessToken = tokenSecurity.encryptForClient(plainNewAccessToken);

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

    // Encrypt tokens using TokenSecurity
    String encryptedAccessToken = tokenSecurity.encryptForClient(plainAccessToken);
    String encryptedRefreshToken = tokenSecurity.encryptForClient(plainRefreshToken);

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
    activeTokenRepository.deleteAllByExpiryTimeBefore(new Date());
    activeTokenRepository.deleteAllByExpiryRefreshTimeBefore(new Date());

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
        
        String newToken = generateToken(user, existingToken.getId());
        Date newExpiryTime = extractTokenExpiry(newToken);
        
        // Update only access token, keep refresh token
        existingToken.setToken(newToken);
        existingToken.setExpiryTime(newExpiryTime);
        existingToken.setDescription("OAuth Refreshed at " + new Date());
        
        activeTokenRepository.save(existingToken);
        
        return AuthenticationResponse.builder()
            .token(newToken)
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
    String token = generateToken(user, jwtId);
    String refreshToken = generateRefreshToken(user, jwtId);

    Date expiryTime = extractTokenExpiry(token);
    Date expireRefreshTime = extractTokenExpiry(refreshToken);

    ActiveToken newToken = ActiveToken.builder()
        .id(jwtId)
        .token(token)
        .refreshToken(refreshToken)
        .expiryTime(expiryTime)
        .expiryRefreshTime(expireRefreshTime)
        .username(user.getUsername())
        .description("OAuth Login at " + new Date())
        .build();

    activeTokenRepository.save(newToken);

    return AuthenticationResponse.builder()
        .token(token)
        .refreshToken(refreshToken)
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
    } catch (Exception e) {
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

  @Transactional
  public ApiResponse<Void> register(UserCreationRequest request) {
    if (userRepository.existsByUsername(request.getUsername())) {
      throw new AppException(ErrorCode.USER_EXISTS);
    }

    User user = userMapper.toUser(request);
    user.setPassword(passwordEncoder.encode(request.getPassword()));

    // If not provided, set it to false by default (requiring email verification)
    user.setActive(request.getActive() != null ? request.getActive() : false);

    // Set default role as USER if roles are not provided or empty
    List<String> roles = request.getRoles();
    if (roles == null || roles.isEmpty()) {
      roles = new ArrayList<>();
      roles.add(ENUMS.Role.USER.name());
    }

    // Fetch Role entities based on role names
    Set<Role> roleEntities = roles.stream()
        .map(roleName -> roleRepository.findByName(roleName)
            .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND)))
        .collect(Collectors.toSet());
    user.setRoles(roleEntities);

    userRepository.save(user);
    if (!user.isActive()) {
      // Generate verification code and send email
      String verificationCode = generateSixDigitCode();

      // Check for existing token and delete it
      emailVerificationTokenRepository.findByUsernameAndUsed(user.getUsername(), false)
          .ifPresent(token -> emailVerificationTokenRepository.delete(token));

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
    }

    return ApiResponse.<Void>builder()
        .message("User registered successfully! Please check your email to verify your account.")
        .build();
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
  public ApiResponse<Void> resendVerificationEmail(ResendVerificationRequest request) {
    User user = userRepository.findByUsername(request.getUsername())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

    // Check if user is already active
    if (user.isActive()) {
      return ApiResponse.<Void>builder()
          .message("Your account is already verified. You can log in.")
          .build();
    }

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
    activeTokenRepository.deleteAllByExpiryTimeBefore(new Date());

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
    boolean isValid;
    
    try {
        // 1. First decrypt the token received from the client
        String plainJwtToken = tokenSecurity.decryptFromClient(encryptedToken);
        
        // 2. Verify the decrypted JWT token
        verifyToken(plainJwtToken);
        
        // 3. Also verify it exists in our database
        String username = tokenSecurity.extractUsernameFromToken(plainJwtToken);
        if (username != null) {
            Optional<ActiveToken> activeTokenOpt = activeTokenRepository.findByUsername(username);
            if (!activeTokenOpt.isPresent() || !activeTokenOpt.get().getToken().equals(encryptedToken)) {
                throw new AppException(ErrorCode.INVALID_TOKEN);
            }
            
            // Check if token has expired in database
            if (activeTokenOpt.get().getExpiryTime().before(new Date())) {
                throw new AppException(ErrorCode.INVALID_TOKEN);
            }
        } else {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }
        
        isValid = true;
    } catch (Exception e) {
        log.warn("Token introspection failed: {}", e.getMessage());
        isValid = false;
    }
    
    IntrospectResponse response = IntrospectResponse.builder()
        .valid(isValid)
        .build();
    return response;
}

  private SignedJWT verifyToken(String token) throws ParseException, JOSEException {
    SignedJWT signedJWT = SignedJWT.parse(token);
    JWSVerifier verifier = new MACVerifier(SECRET_KEY_BYTES);
    Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
    boolean verified = signedJWT.verify(verifier) && expiryTime.after(new Date());
    if (!verified) {
      throw new AppException(ErrorCode.INVALID_TOKEN);
    }
    return signedJWT;
  }

  public String generateToken(User user, String jwtId) {
    try {
      JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);
      JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
          .subject(user.getUsername())
          .claim("userId", user.getId().toString())
          .issuer("tommem.com")
          .issueTime(new Date())
          .expirationTime(new Date(new Date().getTime() + TOKEN_EXPIRY_TIME))
          .jwtID(jwtId)
          .claim("scope", buildScope(user))
          .build();
      Payload payload = new Payload(jwtClaimsSet.toJSONObject());

      JWSObject jwsObject = new JWSObject(jwsHeader, payload);
      jwsObject.sign(new MACSigner(SECRET_KEY_BYTES));
      String token = jwsObject.serialize();

      return token;
    } catch (Exception e) {
      log.error("Error generating token: {}", e.getMessage(), e);
      return null;
    }
  }

  private String generateRefreshToken(User user, String jwtId) {
    try {
      JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);
      JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
          .subject(user.getUsername())
          .claim("userId", user.getId().toString())
          .issuer("tommem.com")
          .issueTime(new Date())
          .expirationTime(new Date(new Date().getTime() + REFRESH_TOKEN_EXPIRY_TIME))
          .jwtID(jwtId)
          .claim("scope", buildScope(user))
          .build();
      Payload payload = new Payload(jwtClaimsSet.toJSONObject());

      JWSObject jwsObject = new JWSObject(jwsHeader, payload);
      jwsObject.sign(new MACSigner(SECRET_KEY_BYTES));
      String token = jwsObject.serialize();

      return token;
    } catch (Exception e) {
      log.error("Error generating refresh token: {}", e.getMessage(), e);
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
    Claims claims = Jwts.parser()
        .verifyWith(Keys.hmacShaKeyFor(SECRET_KEY_BYTES))
        .build()
        .parseSignedClaims(token)
        .getPayload();
    return claims.getExpiration();
  }
  
  private Claims extractAllClaims(String token) {
    return Jwts.parser()
        .verifyWith(Keys.hmacShaKeyFor(SECRET_KEY_BYTES))
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }

  private String generateSixDigitCode() {
    Random random = new Random();
    int code = 100000 + random.nextInt(900000); // Generates a number between 100000 and 999999
    return String.valueOf(code);
  }

  // Scheduled task to clean up expired tokens
  @Scheduled(fixedRate = 24 * 60 * 60 * 1000) // Run once a day
  public void cleanupExpiredTokens() {
    passwordResetTokenRepository.deleteByExpiryDateBefore(LocalDateTime.now());
    
    // Also clean up expired tokens
    activeTokenRepository.deleteAllByExpiryTimeBefore(new Date());
    activeTokenRepository.deleteAllByExpiryRefreshTimeBefore(new Date());
  }

}