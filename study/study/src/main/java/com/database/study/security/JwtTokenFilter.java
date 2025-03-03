package com.database.study.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.database.study.repository.ActiveTokenRepository;
import com.database.study.entity.ActiveToken;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Optional;

@Component
public class JwtTokenFilter extends OncePerRequestFilter {

  @Autowired
  private ActiveTokenRepository activeTokenRepository;

  @Override
  protected void doFilterInternal(@NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain) throws ServletException, IOException {
    String authorizationHeader = request.getHeader("Authorization");

    if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
      String token = authorizationHeader.substring(7);

      // Check if the token exists in the ActiveToken repository
      Optional<ActiveToken> validToken  = activeTokenRepository.findByToken(token);
      if (!validToken .isPresent()) {
        throw new AppException(ErrorCode.INVALID_TOKEN);
      }
    }
    filterChain.doFilter(request, response);
  }
}
