package com.database.study.configuration;

import java.util.Objects;

import javax.crypto.spec.SecretKeySpec;
import java.util.Date;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import com.database.study.service.AuthenticationService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class CustomJwtDecoder implements JwtDecoder {

  private NimbusJwtDecoder nimbusJwtDecoder = null;

  @Override
  public Jwt decode(String token) throws JwtException {
    if (Objects.isNull(nimbusJwtDecoder)) {
      byte[] secretKeyBytes = AuthenticationService.getSecretKeyBytes();
      SecretKeySpec secretKeySpec = new SecretKeySpec(secretKeyBytes, "HmacSHA512");
      nimbusJwtDecoder = NimbusJwtDecoder.withSecretKey(secretKeySpec)
          .macAlgorithm(MacAlgorithm.HS512)
          .build();
    }
    Jwt decodedJwt = nimbusJwtDecoder.decode(token);
    // Perform additional checks, such as expiration time
    Date expirationTime = Date.from(decodedJwt.getExpiresAt());
    if (expirationTime != null && expirationTime.before(new Date())) {
      log.warn("Token has expired: {}", token);
      throw new JwtException("Token has expired");
    }
    return decodedJwt;
  }
}

// JwtDecoder jwtDecoder =
// NimbusJwtDecoder.withSecretKey(secretKeySpec).build();
// Jwt jwt = jwtDecoder.decode(token);