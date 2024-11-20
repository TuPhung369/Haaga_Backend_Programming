package com.database.study.service;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;

@Service
public class GoogleTokenValidationService {

  private final JwtDecoder googleJwtDecoder;

  public GoogleTokenValidationService(JwtDecoder googleJwtDecoder) {
    this.googleJwtDecoder = googleJwtDecoder;
  }

  public Jwt validateGoogleIdToken(String idToken) {
    try {
      return googleJwtDecoder.decode(idToken);
    } catch (JwtException e) {
      throw new RuntimeException("Invalid Google ID token: " + e.getMessage(), e);
    }
  }
}
