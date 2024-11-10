package com.database.study.configuration;

import javax.crypto.spec.SecretKeySpec;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import com.database.study.service.AuthenticationService;

@Component
public class CustomJwtDecoder {

  private final JwtDecoder jwtDecoder;

  public CustomJwtDecoder() {
    byte[] secretKeyBytes = AuthenticationService.getSecretKeyBytes();
    SecretKeySpec secretKeySpec = new SecretKeySpec(secretKeyBytes, "HmacSHA512");
    this.jwtDecoder = NimbusJwtDecoder.withSecretKey(secretKeySpec)
        .macAlgorithm(MacAlgorithm.HS512)
        .build();
  }

  public JwtDecoder getJwtDecoder() {
    return jwtDecoder;
  }
}
