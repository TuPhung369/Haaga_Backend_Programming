package com.database.study.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.database.study.entity.User;
import com.database.study.repository.UserRepository;
import com.database.study.dto.request.UserCreationRequest;
import java.util.List;
import java.util.UUID;

@Service
public class UserService {
  @Autowired
  private UserRepository userRepository;

  public User createRequest(UserCreationRequest request) {
    User user = new User();

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
    return userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("User not found"));
  }

  public User updateUser(UUID userId, UserCreationRequest request) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("User not found"));

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
      throw new RuntimeException("User not found");
    }
  }
}
