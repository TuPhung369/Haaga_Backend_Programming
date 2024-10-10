package com.database.study.service;

import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.repository.UserRepository;
import com.database.study.enums.Role;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.dto.response.UserResponse;
import com.database.study.mapper.UserMapper;

import java.util.HashSet;
import java.util.Set;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserService {

  UserRepository userRepository;
  UserMapper userMapper;
  PasswordEncoder passwordEncoder;

  @PreAuthorize("hasRole('ADMIN')")
  public List<UserResponse> getUsers() {
    log.info("In method getUsers with role ADMIN");
    return userRepository.findAll().stream()
        .map(userMapper::toUserResponse)
        .toList();
  }

  public UserResponse createUser(UserCreationRequest request) {
    if (userRepository.existsByUsername(request.getUsername())) {
      throw new AppException(ErrorCode.USER_EXISTS);
    }
    // Map request to user entity and encode the password
    User user = userMapper.toUser(request);
    user.setPassword(passwordEncoder.encode(request.getPassword()));

    // Set default role as USER
    Set<String> roles = new HashSet<>();
    roles.add(Role.USER.name());
    user.setRoles(roles);
    log.info("User before saving: {}", user);
    // Save the user and return response
    user = userRepository.save(user);
    return userMapper.toUserResponse(user);
  }

  @PostAuthorize("returnObject.username == authentication.name")
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

    // Find existing user or throw an exception if not found
    User existingUser = userRepository.findById(userId)
        .orElseThrow(() -> {
          log.error("User with ID {} not found", userId);
          throw new AppException(ErrorCode.USER_NOT_FOUND);
        });
    // Update other fields of the user using the userMapper
    userMapper.updateUser(existingUser, request);
    existingUser.setPassword(passwordEncoder.encode(request.getPassword()));

    // Save the updated user to the repository
    User updatedUser = userRepository.save(existingUser);

    // Return the updated user response
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
