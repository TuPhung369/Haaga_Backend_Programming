package com.database.study.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.database.study.entity.User;
import com.database.study.repository.UserRepository;
import com.database.study.dto.request.UserCreationRequest;
import java.util.List;
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
}
