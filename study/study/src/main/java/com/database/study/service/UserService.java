package com.database.study.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.repository.UserRepository;
import com.database.study.dto.request.UserCreationRequest;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class UserService {
  private static final Logger log = LoggerFactory.getLogger(UserService.class);
  @Autowired
  private UserRepository userRepository;

  public User createUser(UserCreationRequest request) {
    User user = new User();
    if (userRepository.existsByUsername(request.getUsername())) {
      throw new AppException(ErrorCode.USER_EXISTS);
    }
    user.setUsername(request.getUsername());
    user.setPassword(request.getPassword());
    user.setFirstname(request.getFirstname());
    user.setLastname(request.getLastname());
    user.setDob(request.getDob());
    return userRepository.save(user);
  }

  public List<User> getUsers() {
    return userRepository.findAll();
  }

  public User getUserById(UUID userId) {
    log.info("Fetching user by ID: {}", userId); // Log ID before fetching
    return userRepository.findById(userId)
        .orElseThrow(() -> {
          log.error("User with ID {} not found", userId); // Log error with ID
          throw new AppException(ErrorCode.USER_NOT_FOUND); // Ensure correct error is thrown
        });
  }

  public User updateUser(UUID userId, UserCreationRequest request) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    user.setUsername(request.getUsername());
    user.setPassword(request.getPassword());
    user.setFirstname(request.getFirstname());
    user.setLastname(request.getLastname());
    user.setDob(request.getDob());

    return userRepository.save(user);
  }

  public void deleteUser(UUID userId) {
    if (userRepository.existsById(userId)) {
      userRepository.deleteById(userId);
    } else {
      throw new AppException(ErrorCode.USER_NOT_FOUND);
    }
  }

}
