package com.database.study.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

@Configuration
public class GoogleJwtDecoderConfig {

  @Bean
  public JwtDecoder googleJwtDecoder() {
    String jwkSetUri = "https://www.googleapis.com/oauth2/v3/certs";
    return NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
  }
}
