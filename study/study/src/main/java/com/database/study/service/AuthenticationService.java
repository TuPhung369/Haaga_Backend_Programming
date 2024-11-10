package com.database.study.service;

import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.database.study.dto.request.AuthenticationRequest;
import com.database.study.dto.request.LogoutRequest;
import com.database.study.dto.request.IntrospectRequest;
import com.database.study.dto.response.AuthenticationResponse;
import com.database.study.dto.response.IntrospectResponse;
import com.database.study.entity.InvalidatedToken;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.repository.InvalidatedTokenRepository;
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

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.security.SecureRandom;
import java.util.Date;
import java.util.StringJoiner;
import java.util.UUID;
import java.util.Base64;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
  UserRepository userRepository;
  PasswordEncoder passwordEncoder;
  InvalidatedTokenRepository invalidatedTokenRepository;

  // Define a static secret key (for demonstration purposes, you should store this
  // securely)

  protected static final byte[] SECRET_KEY_BYTES = generateSecretKey();

  // Initialize the logger for the class
  static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);

  public AuthenticationResponse authenticate(AuthenticationRequest request) {
    var user = userRepository.findByUsername(request.getUsername())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));
    log.info("Found user: {}", user.getUsername());
    boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
    log.info("Password matches: {}", authenticated);
    if (!authenticated) {
      throw new AppException(ErrorCode.PASSWORD_MISMATCH);
    }

    // Generate token
    String token = generateToken(user);
    log.info("STEP 1: Token from LOGIN {} - BEFORE store to AuthenticationResponse", token);

    AuthenticationResponse response = AuthenticationResponse.builder()
        .token(token)
        .authenticated(true)
        .build();

    // Test the stored token
    String storedToken = response.getToken();
    log.info("STEP 1: Token from LOGIN {} - AFTER store to AuthenticationResponse", storedToken);

    // Returning the response
    return response;
  }

  public void logout(LogoutRequest request) throws ParseException, JOSEException {
    var signedToken = verifyToken(request.getToken());
    String jwtId = signedToken.getJWTClaimsSet().getJWTID();
    Date expiryTime = signedToken.getJWTClaimsSet().getExpirationTime();
    InvalidatedToken invalidatedToken = InvalidatedToken.builder()
        .id(jwtId)
        .expiryTime(expiryTime)
        .build();
    log.warn("STEP 6: Token from signedToken", signedToken);
    invalidatedTokenRepository.save(invalidatedToken);
  }

  private SignedJWT verifyToken(String token) throws ParseException, JOSEException {

    log.info("STEP 3: Token from verifyToken: {}", token);
    SignedJWT signedJWT = SignedJWT.parse(token);
    JWSVerifier verifier = new MACVerifier(SECRET_KEY_BYTES);
    Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
    boolean verified = signedJWT.verify(verifier) && expiryTime.after(new Date());
    if (!verified) {
      log.warn("STEP 3:Token verification failed. Verified: {}, Expired: {}", signedJWT.verify(verifier),
          expiryTime.before(new Date()));
      throw new AppException(ErrorCode.INVALID_TOKEN);
    }
    return signedJWT;
  }

  // public IntrospectResponse introspect(IntrospectRequest request) {
  // try {
  // log.info("STEP 2: Token BEFORE request.getToken(): {}", request.getToken());
  // String token = request.getToken();
  // log.info("STEP 2: Token BEFORE verifyToken: {}", token);
  // verifyToken(token);
  // return IntrospectResponse.builder()
  // .valid(true)
  // .build();
  // } catch (Exception e) {
  // log.error("Error during token introspection: {}", e.getMessage(), e);
  // throw new AppException(ErrorCode.GENERAL_EXCEPTION);
  // }
  // }

  public IntrospectResponse introspect(IntrospectRequest request) {
    try {
      log.info("STEP 2: Token BEFORE request.getToken(): {}", request.getToken());
      String token = request.getToken();
      log.info("STEP 2: Token BEFORE verifyToken: {}", token);
      // Parse and verify the token
      SignedJWT signedJWT = SignedJWT.parse(token);
      JWSVerifier verifier = new MACVerifier(SECRET_KEY_BYTES);

      // Extract expiration time
      Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

      // Verify token and check expiration
      boolean verified = signedJWT.verify(verifier);
      boolean isTokenValid = verified && expiryTime.after(new Date());

      return IntrospectResponse.builder()
          .valid(isTokenValid)
          .build();
    } catch (JOSEException | ParseException e) {
      log.error("Error during token introspection: {}", e.getMessage(), e);
      throw new AppException(ErrorCode.GENERAL_EXCEPTION);
    }
  }

  private String generateToken(com.database.study.entity.User user) {
    try {
      JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512); // Use HS512 algorithm
      JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
          .subject(user.getUsername())
          .issuer("tommem.com")
          .issueTime(new Date())
          .expirationTime(new Date(new Date().getTime() + 60 * 60 * 4000)) // 4 hour expiration
          .jwtID(UUID.randomUUID().toString()) // Unique identifier for the token ID
          .claim("scope", buildScope(user))
          .build();
      Payload payload = new Payload(jwtClaimsSet.toJSONObject());

      JWSObject jwsObject = new JWSObject(jwsHeader, payload);
      jwsObject.sign(new MACSigner(SECRET_KEY_BYTES)); // Make sure the key is correct!
      String token = jwsObject.serialize();
      log.info("Generated token: {}", token);

      return token;
    } catch (Exception e) {
      log.error("Error generating token: {}", e.getMessage(), e);
      return null;
    }
  }

  private static byte[] generateSecretKey() {
    SecureRandom secureRandom = new SecureRandom();
    byte[] key = new byte[64]; // 512 bits = 64 bytes
    secureRandom.nextBytes(key);
    String base64Key = Base64.getEncoder().encodeToString(key);
    System.out.println("STEP 4: Base64 Encoded Key: " + base64Key);
    return key;
  }

  public static byte[] getSecretKeyBytes() {
    System.out.println("STEP 5: SECRET_KEY_BYTES: " + SECRET_KEY_BYTES);
    String base64Key = Base64.getEncoder().encodeToString(SECRET_KEY_BYTES);
    System.out.println("STEP 5: Base64 Encoded Key: " + base64Key);
    return SECRET_KEY_BYTES; // Expose the secret key for external use
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
}