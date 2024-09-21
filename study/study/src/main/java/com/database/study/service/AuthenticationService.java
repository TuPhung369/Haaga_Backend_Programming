package com.database.study.service;

import org.springframework.stereotype.Service;

import com.database.study.dto.request.AuthenticationRequest;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
  UserRepository userRepository;
  PasswordEncoder passwordEncoder;
  // Initialize the logger for the class
  static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);

  public boolean authenticate(AuthenticationRequest request) {
    var user = userRepository.findByUsername(request.getUsername())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));
    log.info("Found user: {}", user.getUsername());
    boolean matches = passwordEncoder.matches(request.getPassword(), user.getPassword());
    log.info("Password matches: {}", matches);
    if (!matches) {
      throw new AppException(ErrorCode.PASSWORD_MISMATCH);
    }
    return matches;
  }
}
