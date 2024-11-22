package com.database.study.security;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;

@Service
public class GitHubTokenValidation {

  private final JwtDecoder githubJwtDecoder;

  public GitHubTokenValidation(JwtDecoder githubJwtDecoder) {
    this.githubJwtDecoder = githubJwtDecoder;
  }

  public Jwt validateGitHubToken(String token) {
    try {
      return githubJwtDecoder.decode(token);
    } catch (JwtException e) {
      throw new RuntimeException("Invalid GitHub token: " + e.getMessage(), e);
    }
  }
}