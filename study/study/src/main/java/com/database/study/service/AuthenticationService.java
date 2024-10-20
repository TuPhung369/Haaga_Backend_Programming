package com.database.study.service;

import org.springframework.stereotype.Service;
//import org.springframework.util.CollectionUtils;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.database.study.dto.request.AuthenticationRequest;
import com.database.study.dto.request.IntrospectRequest;
import com.database.study.dto.response.AuthenticationResponse;
import com.database.study.dto.response.IntrospectResponse;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
  UserRepository userRepository;
  PasswordEncoder passwordEncoder;

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
    return AuthenticationResponse.builder()
        .token(token)
        .authenticated(true)
        .build();
  }

  public IntrospectResponse introspect(IntrospectRequest request) {
    try {
      var token = request.getToken();

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
          .expirationTime(new Date(new Date().getTime() + 60 * 60 * 1000)) // 1 hour expiration
          .claim("scope", buildScope(user))
          .build();
      Payload payload = new Payload(jwtClaimsSet.toJSONObject());

      JWSObject jwsObject = new JWSObject(jwsHeader, payload);
      log.info("Signing the token with the secret key");
      jwsObject.sign(new MACSigner(SECRET_KEY_BYTES)); // Make sure the key is correct!

      String token = jwsObject.serialize();
      log.info("Generated token: {}", token);
      return token; // Return the token
    } catch (Exception e) {
      log.error("Error generating token: {}", e.getMessage(), e);
      return null; // Return null in case of failure
    }
  }

  private static byte[] generateSecretKey() {
    SecureRandom secureRandom = new SecureRandom();
    byte[] key = new byte[64]; // 512 bits = 64 bytes
    secureRandom.nextBytes(key);
    // String base64Key = Base64.getEncoder().encodeToString(key);
    // System.out.println("Base64 Encoded Key: " + base64Key);
    return key;
  }

  public static byte[] getSecretKeyBytes() {
    // System.out.println("SECRET_KEY_BYTES: " + SECRET_KEY_BYTES);
    return SECRET_KEY_BYTES; // Expose the secret key for external use
  }

  private String buildScope(com.database.study.entity.User user) {
    // Build the scope based on user roles
    StringJoiner scopeJoiner = new StringJoiner(" ");
    // if (!CollectionUtils.isEmpty(user.getRoles())) {
    //   user.getRoles().forEach(scopeJoiner::add); // Use scopeJoiner instead of stringJoiner
    // }
    return scopeJoiner.toString();
  }
}