package com.database.study.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

@Configuration
public class GitHubJwtDecoderConfig {

  @Bean
  public JwtDecoder githubJwtDecoder() {
    // Replace with GitHub's JWK URI if available
    String jwkSetUri = "https://api.github.com/.well-known/jwks.json";
    return NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
  }
}
