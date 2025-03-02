package com.database.study.service;

import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.database.study.dto.request.AuthenticationRequest;
import com.database.study.dto.request.LogoutRequest;
import com.database.study.dto.request.ResetPasswordRequest;
import com.database.study.dto.request.UserCreationRequest;
import com.database.study.dto.request.IntrospectRequest;
import com.database.study.dto.request.RefreshTokenRequest;
import com.database.study.dto.response.ApiResponse;
import com.database.study.dto.response.AuthenticationResponse;
import com.database.study.dto.response.IntrospectResponse;
import com.database.study.dto.response.RefreshTokenResponse;
import com.database.study.entity.InvalidatedToken;
import com.database.study.entity.Role;
import com.database.study.entity.User;
import com.database.study.enums.ENUMS;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.mapper.UserMapper;
import com.database.study.repository.InvalidatedTokenRepository;
import com.database.study.repository.RoleRepository;
import com.database.study.repository.UserRepository;
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
  InvalidatedTokenRepository invalidatedTokenRepository;

  // protected static final byte[] SECRET_KEY_BYTES = generateSecretKey();
  protected static final byte[] SECRET_KEY_BYTES = Base64.getDecoder()
      .decode("2fl9V3Xl0ks5yX9dGuVHRV1H6ld9F0OjhrYhP7QvxqJrB/1OLKJHpPoMxSBcUe3EEC6Hq0kseMfUQlhK2w2yQA==");
  static final int SURPLUS_EXPIRE_TIME = 7;

  public static byte[] getSecretKeyBytes() {
    return SECRET_KEY_BYTES;
  }

  @Transactional
  public AuthenticationResponse authenticate(AuthenticationRequest request) {
    com.database.study.entity.User user = userRepository.findByUsername(request.getUsername())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

    boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
    if (!authenticated) {
      throw new AppException(ErrorCode.PASSWORD_MISMATCH);
    }
    invalidatedTokenRepository.deleteAllByExpiryTimeBefore(new Date());

    //Optional<InvalidatedToken> existingTokenOpt = invalidatedTokenRepository.findByName(user.getUsername());
    // Always generate a new token and jwtId
      String jwtId = UUID.randomUUID().toString();
      String token = generateToken(user, jwtId);
      String refreshToken = generateRefreshToken(user, jwtId);

      // Create session identifier (like device ID or client ID)
      String sessionId = request.getSessionIdentifier();
      if (sessionId == null) {
          sessionId = UUID.randomUUID().toString(); // Default value if client doesn't provide one
      }
      Date expiryTime = extractTokenExpiry(token);
      Date expireRefreshTime = extractTokenExpiry(refreshToken);
      // Instant expireInstant = expiryTime.toInstant().plus(SURPLUS_EXPIRE_TIME,
      // ChronoUnit.HOURS);
      // Date expireRefreshTime = Date.from(expireInstant);

      // Save token with unique combination of username and session ID
      InvalidatedToken newToken = InvalidatedToken.builder()
          .id(jwtId)
          .token(token)
          .refreshToken(refreshToken)
          .expiryTime(expiryTime)
          .expiryRefreshTime(expireRefreshTime)
          .username(user.getUsername())
          .description("Session: " + sessionId)
          .build();
      invalidatedTokenRepository.save(newToken);

    // Create and return the authentication response
    AuthenticationResponse response = AuthenticationResponse.builder()
        .token(token)
        .authenticated(true)
        .build();
    return response;
  }

@Transactional
public AuthenticationResponse authenticateOAuth(String username, String sessionId) {
  User user = userRepository.findByUsername(username)
      .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));
  
  // Skip password check completely - user is already authenticated by OAuth
  String jwtId = UUID.randomUUID().toString();
  String token = generateToken(user, jwtId);
  String refreshToken = generateRefreshToken(user, jwtId);
  
  // Use provided sessionId or generate one
  if (sessionId == null) {
    sessionId = UUID.randomUUID().toString();
  }
  
  Date expiryTime = extractTokenExpiry(token);
  Date expireRefreshTime = extractTokenExpiry(refreshToken);
  
  InvalidatedToken newToken = InvalidatedToken.builder()
      .id(jwtId)
      .token(token)
      .refreshToken(refreshToken)
      .expiryTime(expiryTime)
      .expiryRefreshTime(expireRefreshTime)
      .username(user.getUsername())
      .description("OAuth Session: " + sessionId)
      .build();
  
  invalidatedTokenRepository.save(newToken);
  
  return AuthenticationResponse.builder()
      .token(token)
      .authenticated(true)
      .build();
}

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
  public ApiResponse<Void> register(UserCreationRequest request) {
    if (userRepository.existsByUsername(request.getUsername())) {
      throw new AppException(ErrorCode.USER_EXISTS);
    }

    User user = userMapper.toUser(request);
    user.setPassword(passwordEncoder.encode(request.getPassword()));

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

    return ApiResponse.<Void>builder()
        .message("User registered successfully!")
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
    // Delete all expired tokens before adding the new entry
    invalidatedTokenRepository.deleteAllByExpiryTimeBefore(new Date());

    // Find the existing InvalidatedToken by UUID
    Optional<InvalidatedToken> existingTokenOpt = invalidatedTokenRepository.findById(uuid);
    if (existingTokenOpt.isPresent()) {
      // Update only the description field
      InvalidatedToken existingToken = existingTokenOpt.get();
      // existingToken.getDescription());
      existingToken.setDescription("Logged OUT at: " + formattedDate);
      invalidatedTokenRepository.save(existingToken);
      invalidatedTokenRepository.flush(); // Flush using to changes the database
    } else {
      throw new AppException(ErrorCode.INVALID_TOKEN);
    }
  }

  @Transactional
  public RefreshTokenResponse refreshToken(RefreshTokenRequest request) throws ParseException, JOSEException {
    SignedJWT signedRefreshToken = verifyToken(request.getToken());

    var user = userRepository.findByUsername(signedRefreshToken.getJWTClaimsSet().getSubject())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

    Optional<InvalidatedToken> existingTokenOpt = invalidatedTokenRepository.findByUsername(user.getUsername());

    if (existingTokenOpt.isPresent() && existingTokenOpt.get().getExpiryRefreshTime().after(new Date())) {
      invalidatedTokenRepository.deleteByUsername(user.getUsername());
    }

    String jwtId = UUID.randomUUID().toString();
    String newAccessToken = generateToken(user, jwtId);
    String newRefreshToken = generateRefreshToken(user, jwtId);
    // SignedJWT signedNewAccessToken = verifyToken(newAccessToken);
    // SignedJWT signedNewRefreshToken = verifyToken(newRefreshToken);

    Date expiryTime = extractTokenExpiry(newAccessToken);
    Date expireRefreshTime = extractTokenExpiry(newRefreshToken);
    // Instant expireInstant = expiryTime.toInstant().plus(SURPLUS_EXPIRE_TIME,
    // ChronoUnit.HOURS);
    // Date expireRefreshTime = Date.from(expireInstant);

    InvalidatedToken newInvalidatedToken = InvalidatedToken.builder()
        .id(jwtId)
        .token(newAccessToken)
        .refreshToken(newRefreshToken)
        .expiryTime(expiryTime)
        .expiryRefreshTime(expireRefreshTime)
        .username(user.getUsername())
        .description("Newly issued refresh token")
        .build();

    invalidatedTokenRepository.save(newInvalidatedToken);

    RefreshTokenResponse response = RefreshTokenResponse.builder()
        .token(newAccessToken)
        .authenticated(true)
        .build();
    return response;
  }

  public IntrospectResponse introspect(IntrospectRequest request) {
    String token = request.getToken();
    boolean isValid;
    try {
      verifyToken(token);
      isValid = true;
    } catch (Exception e) {
      // e.getMessage(), e);
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

  public String generateToken(com.database.study.entity.User user, String jwtId) {
    try {
      JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512); // Use HS512 algorithm
      JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
          .subject(user.getUsername())
          .claim("userId", user.getId().toString())
          .issuer("tommem.com")
          .issueTime(new Date())
          .expirationTime(new Date(new Date().getTime() + 60 * 60 * 1000)) // 60 * 60 * 1 hour expiration
          .jwtID(jwtId)
          .claim("scope", buildScope(user))
          .build();
      Payload payload = new Payload(jwtClaimsSet.toJSONObject());

      JWSObject jwsObject = new JWSObject(jwsHeader, payload);
      jwsObject.sign(new MACSigner(SECRET_KEY_BYTES)); // Make sure the key is correct!
      String token = jwsObject.serialize();

      return token;
    } catch (Exception e) {
      log.error("Error generating token: {}", e.getMessage(), e);
      return null;
    }
  }

  private String generateRefreshToken(com.database.study.entity.User user, String jwtId) {
    try {
      JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512); // Use HS512 algorithm
      JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
          .subject(user.getUsername())
          .claim("userId", user.getId().toString())
          .issuer("tommem.com")
          .issueTime(new Date())
          .expirationTime(new Date(new Date().getTime() + 60 * 60 * (1 + SURPLUS_EXPIRE_TIME) * 1000))
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

  private String buildScope(com.database.study.entity.User user) {
    // Build the scope based on user roles
    StringJoiner scopeJoiner = new StringJoiner(" ");
    if (!CollectionUtils.isEmpty(user.getRoles())) {
      user.getRoles().forEach(role -> {
        scopeJoiner.add("ROLE_" + role.getName());
        if (!CollectionUtils.isEmpty(role.getPermissions())) {
          role.getPermissions()
              .forEach(permission -> scopeJoiner.add(permission.getName()));
        }
      }); // Use scopeJoiner instead of stringJoiner
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
}
