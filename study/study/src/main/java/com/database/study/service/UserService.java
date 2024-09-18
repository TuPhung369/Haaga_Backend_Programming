package com.database.study.service;

import org.springframework.stereotype.Service;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.dto.response.UserResponse;
import com.database.study.mapper.UserMapper;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
  static final Logger log = LoggerFactory.getLogger(UserService.class);

  UserRepository userRepository;
  UserMapper userMapper;

  public List<User> getUsers() {
    return userRepository.findAll();
  }

  public UserResponse createUser(UserCreationRequest request) {
    if (userRepository.existsByUsername(request.getUsername())) {
      throw new AppException(ErrorCode.USER_EXISTS);
    }
    User user = userMapper.toUser(request);
    user = userRepository.save(user);
    return userMapper.toUserResponse(user);
  }

  public UserResponse getUserById(UUID userId) {
    log.info("Fetching user by ID: {}", userId);
    User user = userRepository.findById(userId)
        .orElseThrow(() -> {
          log.error("User with ID {} not found", userId);
          throw new AppException(ErrorCode.USER_NOT_FOUND);
        });
    return userMapper.toUserResponse(user); // Use the mapper to convert to UserResponse
  }

  public UserResponse updateUser(UUID userId, UserCreationRequest request) {
    log.info("Updating user with ID: {}", userId);
    User existingUser = userRepository.findById(userId)
        .orElseThrow(() -> {
          log.error("User with ID {} not found", userId);
          throw new AppException(ErrorCode.USER_NOT_FOUND);
        });

    userMapper.updateUser(existingUser, request);
    User updatedUser = userRepository.save(existingUser);

    return userMapper.toUserResponse(updatedUser);
  }

  public void deleteUser(UUID userId) {
    if (userRepository.existsById(userId)) {
      userRepository.deleteById(userId);
    } else {
      throw new AppException(ErrorCode.USER_NOT_FOUND);
    }
  }

}
